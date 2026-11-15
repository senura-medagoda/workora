package com.workora.auth;

import com.jayway.jsonpath.JsonPath;
import com.workora.TestcontainersConfiguration;
import com.workora.user.User;
import com.workora.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest                       // starts the whole application context
@AutoConfigureMockMvc                 // gives us MockMvc wired through the real security filter chain
@Import(TestcontainersConfiguration.class)   // starts a real PostgreSQL container
class AuthIntegrationTest {

    private static final String PASSWORD = "correct-horse-battery";
    private static final String COOKIE = RefreshCookieFactory.COOKIE_NAME;

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired RefreshTokenRepository refreshTokenRepository;

    @BeforeEach
    void cleanDatabase() {
        refreshTokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ---------- helpers ----------

    private ResultActions register(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"fullName":"Test User","email":"%s","password":"%s"}
                        """.formatted(email, password)));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","password":"%s"}
                        """.formatted(email, password)));
    }

    /** Registers a user and logs in, returning the full login response. */
    private MvcResult registerAndLogin(String email) throws Exception {
        register(email, PASSWORD).andExpect(status().isCreated());
        return login(email, PASSWORD).andExpect(status().isOk()).andReturn();
    }

    private ResultActions refreshWith(Cookie cookie) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/refresh").cookie(cookie));
    }

    private static String accessTokenOf(MvcResult result) throws Exception {
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    private static Cookie refreshCookieOf(MvcResult result) {
        return result.getResponse().getCookie(COOKIE);
    }

    // ---------- registration ----------

    @Test
    @DisplayName("register returns 201, a normalised email and never exposes the password")
    void register_success() throws Exception {
        register("Test@Example.com", PASSWORD)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        User saved = userRepository.findByEmailIgnoreCase("test@example.com").orElseThrow();
        assertThat(saved.getPasswordHash()).startsWith("{bcrypt}").doesNotContain(PASSWORD);
    }

    @Test
    @DisplayName("registering the same email twice (any casing) returns 409")
    void register_duplicateEmail_returns409() throws Exception {
        register("test@example.com", PASSWORD).andExpect(status().isCreated());

        register("TEST@example.com", PASSWORD).andExpect(status().isConflict());
    }

    @ParameterizedTest(name = "password \"{0}\" is rejected")
    @ValueSource(strings = {"", "short", "elevenchars"})   // all shorter than the 12-character minimum
    void register_weakPassword_returns400(String weakPassword) throws Exception {
        register("test@example.com", weakPassword)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    // ---------- login ----------

    @Test
    @DisplayName("login returns an access token in the body and the refresh token only in a hardened cookie")
    void login_success() throws Exception {
        register("test@example.com", PASSWORD).andExpect(status().isCreated());

        MvcResult result = login("test@example.com", PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andReturn();

        String setCookie = result.getResponse().getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).contains(COOKIE + "=", "HttpOnly", "SameSite=Strict", "Path=/api/v1/auth");
    }

    @Test
    @DisplayName("wrong password and unknown email produce identical 401 responses")
    void login_failures_areIndistinguishable() throws Exception {
        register("test@example.com", PASSWORD).andExpect(status().isCreated());

        String wrongPassword = login("test@example.com", "not-the-password-123")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String unknownEmail = login("nobody@example.com", "not-the-password-123")
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertThat(wrongPassword).isEqualTo(unknownEmail);
    }

    // ---------- protected endpoint ----------

    @Test
    @DisplayName("/me without a token is 401")
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("/me with a garbage token is 401")
    void me_withGarbageToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me").header(HttpHeaders.AUTHORIZATION, "Bearer not.a.jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("/me with a valid token returns the caller's profile")
    void me_withValidToken_returnsProfile() throws Exception {
        MvcResult login = registerAndLogin("test@example.com");

        mockMvc.perform(get("/api/v1/users/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessTokenOf(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"));
    }

    // ---------- refresh / logout ----------

    @Test
    @DisplayName("refresh issues a new access token and rotates the refresh cookie")
    void refresh_rotatesToken() throws Exception {
        Cookie first = refreshCookieOf(registerAndLogin("test@example.com"));

        MvcResult refreshed = refreshWith(first)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        assertThat(refreshCookieOf(refreshed).getValue()).isNotEqualTo(first.getValue());
    }

    @Test
    @DisplayName("replaying an already-used refresh token is rejected and kills the whole token family")
    void refresh_reuse_revokesEverything() throws Exception {
        Cookie first = refreshCookieOf(registerAndLogin("test@example.com"));
        Cookie second = refreshCookieOf(refreshWith(first).andExpect(status().isOk()).andReturn());

        refreshWith(first).andExpect(status().isUnauthorized());    // attacker replays the old token
        refreshWith(second).andExpect(status().isUnauthorized());   // the legitimate newer token is revoked too
    }

    @Test
    @DisplayName("refresh without a cookie is 401")
    void refresh_withoutCookie_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("logout clears the cookie and the token can no longer be used")
    void logout_revokesRefreshToken() throws Exception {
        Cookie cookie = refreshCookieOf(registerAndLogin("test@example.com"));

        MvcResult logout = mockMvc.perform(post("/api/v1/auth/logout").cookie(cookie))
                .andExpect(status().isNoContent())
                .andReturn();

        assertThat(logout.getResponse().getHeader(HttpHeaders.SET_COOKIE)).contains("Max-Age=0");
        refreshWith(cookie).andExpect(status().isUnauthorized());
    }
}