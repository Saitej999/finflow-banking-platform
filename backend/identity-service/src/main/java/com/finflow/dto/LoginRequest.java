package com.finflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "email must not be blank")
        @Email(message = "email must be a valid email address")
        @Size(max = 254)
        String email,

        @NotBlank(message = "password must not be blank")
        @Size(min = 8, max = 128)
        String password
) {
}
