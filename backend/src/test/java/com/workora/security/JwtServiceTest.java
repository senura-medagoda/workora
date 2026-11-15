package com.workora.security;

import com.workora.user.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwsHeader;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-that-is-at-least-32-chars";
    private static final String OTHER_SECRET = "a-completely-different-secret-of-32-chars!";

    private static SecurityProperties props(String secret) {
        return new SecurityProperties(secret, Duration.ofMinutes(15), Duration.ofDays(7), false);
    }

    private static JwtService serviceWith(String secret) {
        SecurityProperties props = props(secret);
        return new JwtService(new JwtConfig().jwtEncoder(props), props);
    }

    private static JwtDecoder decoder() {
        return new JwtConfig().jwtDecoder(props(SECRET));
    }

    private static User user() {
        User user = new User("john@example.com", "hash", "John Doe");
        user.setId(UUID.randomUUID());
        return user;
    }

    @Test
    @DisplayName("a generated token carries the user id, role and issuer")
    void generatedToken_containsExpectedClaims() {
        // Arrange
        User user = user();
        JwtService service = serviceWith(SECRET);

        // Act
        String token = service.generateAccessToken(user);
        Jwt decoded = decoder().decode(token);

        // Assert
        assertThat(decoded.getSubject()).isEqualTo(user.getId().toString());
        assertThat(decoded.getClaimAsString("role")).isEqualTo("USER");
        assertThat(decoded.getClaimAsString("iss")).isEqualTo("workora");   // read as a String, not a URL
        assertThat(decoded.getExpiresAt()).isAfter(decoded.getIssuedAt());
    }

    @Test
    @DisplayName("a token signed with a different secret is rejected")
    void tokenSignedWithWrongKey_isRejected() {
        String forged = serviceWith(OTHER_SECRET).generateAccessToken(user());

        assertThatThrownBy(() -> decoder().decode(forged)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("an expired token is rejected")
    void expiredToken_isRejected() {
        // Arrange: sign a token by hand that was issued 20 minutes ago and expired 5 minutes ago.
        // That is beyond the decoder's default 60-second clock-skew tolerance.
        JwtEncoder encoder = new JwtConfig().jwtEncoder(props(SECRET));
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("workora")
                .subject(UUID.randomUUID().toString())
                .issuedAt(now.minus(Duration.ofMinutes(20)))
                .expiresAt(now.minus(Duration.ofMinutes(5)))
                .claim("role", "USER")
                .build();
        String expired = encoder
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        // Act + Assert
        assertThatThrownBy(() -> decoder().decode(expired)).isInstanceOf(JwtException.class);
    }

    @Test
    @DisplayName("a valid token signed with the right secret but a different issuer is rejected")
    void tokenWithWrongIssuer_isRejected() {
        JwtEncoder encoder = new JwtConfig().jwtEncoder(props(SECRET));
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("someone-else")
                .subject(UUID.randomUUID().toString())
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofMinutes(15)))
                .build();
        String token = encoder
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        assertThatThrownBy(() -> decoder().decode(token)).isInstanceOf(JwtException.class);
    }
}