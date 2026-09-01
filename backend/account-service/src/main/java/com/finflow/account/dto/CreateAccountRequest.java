package com.finflow.account.dto;

import com.finflow.account.domain.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAccountRequest(

        @NotNull(message = "accountType is required")
        AccountType accountType,

        @NotBlank(message = "currency is required")
        @Size(min = 3, max = 3, message = "currency must be exactly 3 characters")
        String currency
) {
}
