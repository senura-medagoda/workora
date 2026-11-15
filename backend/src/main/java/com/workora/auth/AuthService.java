package com.workora.auth;

import com.workora.auth.dto.LoginRequest;
import com.workora.auth.dto.RegisterRequest;
import com.workora.auth.dto.UserResponse;
import com.workora.security.JwtService;
import com.workora.security.SecurityProperties;
import com.workora.user.User;
import com.workora.user.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final SecurityProperties props;
    private final String dummyHash;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService,
                       SecurityProperties props) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.props = props;
        // Used to burn the same CPU time when the email doesn't exist (see login)
        this.dummyHash = passwordEncoder.encode("workora-timing-equalizer");
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalize(request.email());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyRegisteredException();
        }

        User user = new User(email, passwordEncoder.encode(request.password()), request.fullName().trim());
        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            throw new EmailAlreadyRegisteredException();
        }
        return toResponse(user);
    }

    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalize(request.email())).orElse(null);

        // Always run one BCrypt comparison, even for unknown emails. Otherwise "unknown email" returns
        // in 1 ms and "wrong password" in 100 ms, and attackers can use that to discover registered emails.
        String hashToCheck = (user != null) ? user.getPasswordHash() : dummyHash;
        boolean passwordMatches = passwordEncoder.matches(request.password(), hashToCheck);

        if (user == null || !passwordMatches || !user.isEnabled()) {
            throw new InvalidCredentialsException();     // same message for every failure reason
        }
        return issueTokens(user);
    }

    // Deliberately NOT @Transactional: RefreshTokenService.rotate manages its own transaction
    // (an outer one would roll back the "revoke everything" safety action).
    public AuthResult refresh(String rawRefreshToken) {
        RefreshTokenService.RotatedToken rotated = refreshTokenService.rotate(rawRefreshToken);
        User user = userRepository.findById(rotated.userId())
                .filter(User::isEnabled)
                .orElseThrow(InvalidRefreshTokenException::new);
        return new AuthResult(
                jwtService.generateAccessToken(user),
                props.accessTokenTtl().toSeconds(),
                rotated.rawToken(),
                toResponse(user));
    }

    public void logout(String rawRefreshToken) {
        refreshTokenService.revoke(rawRefreshToken);
    }

    private AuthResult issueTokens(User user) {
        String access = jwtService.generateAccessToken(user);
        String refresh = refreshTokenService.issue(user.getId());
        return new AuthResult(access, props.accessTokenTtl().toSeconds(), refresh, toResponse(user));
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName());
    }
}