package com.finflow.transaction.controller;

import com.finflow.transaction.dto.TransactionResponse;
import com.finflow.transaction.dto.DepositRequest;
import com.finflow.transaction.dto.TransferRequest;
import com.finflow.transaction.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping("/transfers")
    public ResponseEntity<TransactionResponse> transfer(
            @Valid @RequestBody TransferRequest request,
            Authentication authentication,
            @RequestHeader("Authorization") String authorizationHeader) {

        UUID authenticatedUserId = UUID.fromString(authentication.getName());
        TransactionResponse response = transactionService.transfer(authenticatedUserId, request, authorizationHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/deposits")
    public ResponseEntity<TransactionResponse> deposit(
            @Valid @RequestBody DepositRequest request,
            Authentication authentication,
            @RequestHeader("Authorization") String authorizationHeader) {

        UUID authenticatedUserId = UUID.fromString(authentication.getName());
        TransactionResponse response = transactionService.deposit(authenticatedUserId, request, authorizationHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<List<TransactionResponse>> getMyTransactions(Authentication authentication) {
        UUID authenticatedUserId = UUID.fromString(authentication.getName());
        List<TransactionResponse> transactions = transactionService.getMyTransactions(authenticatedUserId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransactionById(
            @PathVariable UUID transactionId,
            Authentication authentication) {

        UUID authenticatedUserId = UUID.fromString(authentication.getName());
        TransactionResponse response = transactionService.getTransactionById(authenticatedUserId, transactionId);
        return ResponseEntity.ok(response);
    }
}
