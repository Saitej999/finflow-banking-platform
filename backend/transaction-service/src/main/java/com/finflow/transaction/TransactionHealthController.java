package com.finflow.transaction;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class TransactionHealthController {

    @GetMapping("/api/transactions/health")
    public Map<String, String> health() {
        return Map.of(
                "service", "transaction-service",
                "status", "UP"
        );
    }
}
