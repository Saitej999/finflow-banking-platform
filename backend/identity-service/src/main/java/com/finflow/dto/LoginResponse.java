package com.finflow.dto;

import java.util.Objects;

/**
 * Response returned after successful authentication.
 */
public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {
    public LoginResponse {
        Objects.requireNonNull(accessToken);
        Objects.requireNonNull(tokenType);
        Objects.requireNonNull(user);
    }
}
