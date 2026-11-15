package com.workora.auth;

import com.workora.security.SecurityProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    public record RotatedToken(UUID userId, String rawToken) {}

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository repository;
    private final SecurityProperties props;

    /** Creates a new refresh token and returns the RAW value (shown to the client once, never stored). */
    @Transactional
    public String issue(UUID userId) {
        String raw = generateRawToken();
        repository.save(new RefreshToken(userId, hash(raw), Instant.now().plus(props.refreshTokenTtl())));
        return raw;
    }

    /**
     * noRollbackFor is essential: when we detect token REUSE we revoke all of the user's tokens and then
     * throw. Without it the exception would roll the revocation back, and the attacker's stolen token
     * family would stay alive.
     */
    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public RotatedToken rotate(String rawToken) {
        RefreshToken existing = repository.findByTokenHash(hash(rawToken))
                .orElseThrow(InvalidRefreshTokenException::new);

        if (existing.isRevoked()) {
            repository.revokeAllByUserId(existing.getUserId());   // reuse detected: assume theft
            throw new InvalidRefreshTokenException();
        }
        if (existing.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidRefreshTokenException();
        }

        existing.setRevoked(true);
        String newRaw = issue(existing.getUserId());
        return new RotatedToken(existing.getUserId(), newRaw);
    }

    @Transactional
    public void revoke(String rawToken) {
        repository.findByTokenHash(hash(rawToken)).ifPresent(t -> t.setRevoked(true));
    }

    private static String generateRawToken() {
        byte[] bytes = new byte[32];                       // 256 bits of randomness
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}