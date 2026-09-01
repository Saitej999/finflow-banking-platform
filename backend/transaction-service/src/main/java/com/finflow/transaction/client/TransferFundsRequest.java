package com.finflow.transaction.client;

import java.math.BigDecimal;
import java.util.UUID;

public record TransferFundsRequest(
        UUID sourceAccountId,
        UUID destinationAccountId,
        BigDecimal amount,
        String currency
) {
}
