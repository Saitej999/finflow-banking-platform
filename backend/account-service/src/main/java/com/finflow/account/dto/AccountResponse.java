package com.finflow.account.dto;

import com.finflow.account.domain.AccountStatus;
import com.finflow.account.domain.AccountType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AccountResponse(
        UUID id,
        String accountNumber,
        UUID userId,
        AccountType accountType,
        BigDecimal balance,
        String currency,
        AccountStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
