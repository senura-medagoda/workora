package com.workora.auth;

import com.workora.auth.dto.LoginRequest;
import com.workora.auth.dto.RegisterRequest;
import com.workora.auth.dto.UserResponse;
import com.workora.security.JwtService;
import com.workora.security.SecurityProperties;
import com.workora.user.User;
import com.workora.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)   // initialises the @Mock fields and fails on unused stubs
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock RefreshTokenService refreshTokenService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        SecurityProperties props = new SecurityProperties(
                "unit-test-secret-that-is-at-least-32-chars", Duration.ofMinutes(15), Duration.ofDays(7), false);
        authService = new AuthService(userRepository, passwordEncoder, jwtService, refreshTokenService, props);
    }

    @Test
    @DisplayName("register trims and lower-cases the email and stores only the password hash")
    void register_normalizesEmailAndStoresHash() {
        // Arrange
        when(userRepository.existsByEmailIgnoreCase("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("correct-horse-battery")).thenReturn("hashed-value");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        UserResponse response = authService.register(
                new RegisterRequest("  John Doe ", "  John@Example.COM ", "correct-horse-battery"));

        // Assert: capture the entity that was handed to the repository
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("john@example.com");
        assertThat(saved.getFullName()).isEqualTo("John Doe");
        assertThat(saved.getPasswordHash()).isEqualTo("hashed-value");
        assertThat(response.email()).isEqualTo("john@example.com");
    }

    @Test
    @DisplayName("register rejects an already used email and never saves")
    void register_duplicateEmail_throwsAndDoesNotSave() {
        when(userRepository.existsByEmailIgnoreCase("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("John", "john@example.com", "correct-horse-battery")))
                .isInstanceOf(EmailAlreadyRegisteredException.class);

        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("login with an unknown email fails but still performs a password comparison")
    void login_unknownEmail_failsAfterDummyComparison() {
        when(userRepository.findByEmailIgnoreCase("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("ghost@example.com", "whatever-password")))
                .isInstanceOf(InvalidCredentialsException.class);

        // the timing-attack defence: a hash comparison happened even though no user exists
        verify(passwordEncoder).matches(eq("whatever-password"), any());
    }

    @Test
    @DisplayName("login with a wrong password fails and issues no tokens")
    void login_wrongPassword_throwsAndIssuesNothing() {
        User user = new User("john@example.com", "stored-hash", "John");
        when(userRepository.findByEmailIgnoreCase("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("bad-password-123", "stored-hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("john@example.com", "bad-password-123")))
                .isInstanceOf(InvalidCredentialsException.class);

        verifyNoInteractions(jwtService, refreshTokenService);
    }

    @Test
    @DisplayName("login with valid credentials returns an access token and a refresh token")
    void login_success_returnsTokens() {
        User user = new User("john@example.com", "stored-hash", "John");
        user.setId(UUID.randomUUID());
        when(userRepository.findByEmailIgnoreCase("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct-horse-battery", "stored-hash")).thenReturn(true);
        when(jwtService.generateAccessToken(user)).thenReturn("access-token");
        when(refreshTokenService.issue(user.getId())).thenReturn("refresh-token");

        AuthResult result = authService.login(new LoginRequest("John@Example.com", "correct-horse-battery"));

        assertThat(result.accessToken()).isEqualTo("access-token");
        assertThat(result.refreshToken()).isEqualTo("refresh-token");
        assertThat(result.expiresInSeconds()).isEqualTo(900);
        assertThat(result.user().email()).isEqualTo("john@example.com");
    }
}