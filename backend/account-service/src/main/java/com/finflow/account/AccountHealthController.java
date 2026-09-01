package com.finflow.account;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AccountHealthController {

    @GetMapping("/api/accounts/health")
    public Map<String, String> health() {
        return Map.of(
                "service", "account-service",
                "status", "UP"
        );
    }
}
