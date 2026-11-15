package com.workora.auth;

import com.workora.security.SecurityProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RefreshCookieFactory {

    public static final String COOKIE_NAME = "workora_refresh";
    private static final String COOKIE_PATH = "/api/v1/auth";

    private final SecurityProperties props;

    public ResponseCookie create(String rawToken) {
        return base(rawToken).maxAge(props.refreshTokenTtl()).build();
    }

    public ResponseCookie clear() {
        return base("").maxAge(Duration.ZERO).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)                    // JavaScript cannot read it
                .secure(props.cookieSecure())      // HTTPS only in production
                .sameSite("Strict")                // never sent on cross-site requests
                .path(COOKIE_PATH);                // only sent to the auth endpoints
    }
}