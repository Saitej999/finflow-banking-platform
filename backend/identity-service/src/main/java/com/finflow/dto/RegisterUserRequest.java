package com.finflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for user registration requests.
 */
public record RegisterUserRequest(
        @NotBlank(message = "firstName must not be blank")
        @Size(max = 100, message = "firstName must be at most 100 characters")
        String firstName,

        @NotBlank(message = "lastName must not be blank")
        @Size(max = 100, message = "lastName must be at most 100 characters")
        String lastName,

        @NotBlank(message = "email must not be blank")
        @Email(message = "email must be a valid email address")
        @Size(max = 254, message = "email must be at most 254 characters")
        String email,

        @NotBlank(message = "password must not be blank")
        @Size(min = 8, max = 128, message = "password must be between 8 and 128 characters")
        String password
) {
}
