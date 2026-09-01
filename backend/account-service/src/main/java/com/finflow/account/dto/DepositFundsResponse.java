package com.finflow.account.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DepositFundsResponse(
        UUID accountId,
        BigDecimal amount,
        String currency
) {
}
