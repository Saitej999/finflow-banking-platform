package com.finflow.account.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferFundsRequest(

        @NotNull(message = "sourceAccountId is required")
        UUID sourceAccountId,

        @NotNull(message = "destinationAccountId is required")
        UUID destinationAccountId,

        @NotNull(message = "amount is required")
        @DecimalMin(value = "0.0001", inclusive = false, message = "amount must be greater than zero")
        BigDecimal amount,

        @NotBlank(message = "currency is required")
        @Size(min = 3, max = 3, message = "currency must be exactly 3 characters")
        String currency
) {
}
