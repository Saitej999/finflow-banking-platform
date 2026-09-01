package com.finflow.account.service;

import com.finflow.account.domain.Account;
import com.finflow.account.domain.AccountStatus;
import com.finflow.account.dto.AccountResponse;
import com.finflow.account.dto.DepositFundsRequest;
import com.finflow.account.dto.DepositFundsResponse;
import com.finflow.account.dto.CreateAccountRequest;
import com.finflow.account.dto.TransferFundsRequest;
import com.finflow.account.dto.TransferFundsResponse;
import com.finflow.account.repository.AccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AccountService {

    private static final int ACCOUNT_NUMBER_MAX_ATTEMPTS = 5;

    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Transactional
    public AccountResponse createAccount(UUID userId, CreateAccountRequest request) {
        String currency = request.currency().trim().toUpperCase(Locale.ROOT);

        String accountNumber = generateUniqueAccountNumber();

        Account account = new Account();
        account.setUserId(userId);
        account.setAccountType(request.accountType());
        account.setBalance(BigDecimal.ZERO);
        account.setCurrency(currency);
        account.setStatus(AccountStatus.ACTIVE);
        account.setAccountNumber(accountNumber);

        Account saved = accountRepository.save(account);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsForUser(UUID userId) {
        return accountRepository.findByUserId(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepositFundsResponse depositFunds(UUID authenticatedUserId, DepositFundsRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request is required");
        }
        if (request.accountId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "accountId is required");
        }
        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be greater than zero");
        }

        String normalizedCurrency = normalizeCurrency(request.currency());

        Account account = accountRepository.findByIdForDepositUpdate(request.accountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found"));

        if (!account.getUserId().equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this account");
        }
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Account must be active");
        }
        if (!account.getCurrency().equals(normalizedCurrency)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Account currency does not match requested currency");
        }

        account.setBalance(account.getBalance().add(request.amount()));

        return new DepositFundsResponse(account.getId(), request.amount(), normalizedCurrency);
    }

    @Transactional
    public TransferFundsResponse transferFunds(UUID authenticatedUserId, TransferFundsRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "request is required");
        }

        if (request.sourceAccountId() == null || request.destinationAccountId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourceAccountId and destinationAccountId are required");
        }

        if (request.sourceAccountId().equals(request.destinationAccountId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourceAccountId and destinationAccountId must be different");
        }

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be greater than zero");
        }

        String normalizedCurrency = normalizeCurrency(request.currency());

        Account source = accountRepository.findByIdForUpdate(request.sourceAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source account not found"));
        Account destination = accountRepository.findByIdForUpdate(request.destinationAccountId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Destination account not found"));

        if (!source.getUserId().equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own the source account");
        }

        if (source.getStatus() != AccountStatus.ACTIVE || destination.getStatus() != AccountStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Source and destination accounts must be active");
        }

        if (!source.getCurrency().equals(normalizedCurrency)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Source account currency does not match requested currency");
        }

        if (!destination.getCurrency().equals(normalizedCurrency)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Destination account currency does not match requested currency");
        }

        if (source.getBalance().compareTo(request.amount()) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Insufficient funds");
        }

        source.setBalance(source.getBalance().subtract(request.amount()));
        destination.setBalance(destination.getBalance().add(request.amount()));

        return new TransferFundsResponse(
                source.getId(),
                destination.getId(),
                request.amount(),
                normalizedCurrency
        );
    }

    private String normalizeCurrency(String rawCurrency) {
        if (rawCurrency == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "currency is required");
        }

        String normalized = rawCurrency.trim().toUpperCase(Locale.ROOT);
        if (normalized.length() != 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "currency must be exactly 3 characters");
        }
        return normalized;
    }

    private String generateUniqueAccountNumber() {
        for (int attempt = 0; attempt < ACCOUNT_NUMBER_MAX_ATTEMPTS; attempt++) {
            String candidate = "ACC-" + UUID.randomUUID().toString()
                    .replace("-", "")
                    .substring(0, 12)
                    .toUpperCase(Locale.ROOT);

            if (!accountRepository.existsByAccountNumber(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException(
                "Failed to generate a unique account number after " + ACCOUNT_NUMBER_MAX_ATTEMPTS + " attempts");
    }

    private AccountResponse toResponse(Account account) {
        return new AccountResponse(
                account.getId(),
                account.getAccountNumber(),
                account.getUserId(),
                account.getAccountType(),
                account.getBalance(),
                account.getCurrency(),
                account.getStatus(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }
}
