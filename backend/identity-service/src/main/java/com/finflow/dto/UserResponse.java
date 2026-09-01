package com.finflow.dto;

import com.finflow.domain.Role;
import com.finflow.domain.Status;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO returned to clients representing a user.
 */
public record UserResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        Role role,
        Status status,
        Instant createdAt,
        Instant updatedAt
) {
}
