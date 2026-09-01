package com.finflow.transaction.client;

import java.math.BigDecimal;
import java.util.UUID;

public record DepositFundsRequest(
        UUID accountId,
        BigDecimal amount,
        String currency
) {
}
