package com.finflow.transaction.dto;

import com.finflow.transaction.domain.TransactionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        UUID initiatedByUserId,
        UUID sourceAccountId,
        UUID destinationAccountId,
        BigDecimal amount,
        String currency,
        TransactionStatus status,
        Instant createdAt,
        Instant updatedAt,
        Instant completedAt
) {
}
