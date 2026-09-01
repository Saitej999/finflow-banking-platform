package com.finflow.account.controller;

import com.finflow.account.dto.AccountResponse;
import com.finflow.account.dto.CreateAccountRequest;
import com.finflow.account.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @Valid @RequestBody CreateAccountRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        AccountResponse response = accountService.createAccount(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<List<AccountResponse>> getMyAccounts(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        List<AccountResponse> accounts = accountService.getAccountsForUser(userId);
        return ResponseEntity.ok(accounts);
    }
}
