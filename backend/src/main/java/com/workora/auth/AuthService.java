package com.workora.auth;

import com.workora.auth.dto.RegisterRequest;
import com.workora.auth.dto.UserResponse;
import com.workora.user.User;
import com.workora.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailAlreadyRegisteredException();
        }

        User user = new User(
                email,
                passwordEncoder.encode(request.password()),
                request.fullName().trim()
        );

        try {
            user = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException e) {
            // two simultaneous requests passed the check above; the DB unique index caught it
            throw new EmailAlreadyRegisteredException();
        }

        return new UserResponse(user.getId(), user.getEmail(), user.getFullName());
    }
}