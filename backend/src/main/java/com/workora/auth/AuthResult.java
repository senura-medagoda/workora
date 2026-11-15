package com.workora.auth;

import com.workora.auth.dto.UserResponse;

/** Internal result of login/refresh. It carries the raw refresh token, which the controller puts in a cookie, never in JSON. */
public record AuthResult(String accessToken, long expiresInSeconds, String refreshToken, UserResponse user) {}