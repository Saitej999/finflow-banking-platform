package com.finflow.account.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferFundsResponse(
        UUID sourceAccountId,
        UUID destinationAccountId,
        BigDecimal amount,
        String currency
) {
}
