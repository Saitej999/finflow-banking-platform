package com.finflow.account.service;

import com.finflow.account.domain.Account;
import com.finflow.account.domain.AccountStatus;
import com.finflow.account.dto.AccountResponse;
import com.finflow.account.dto.CreateAccountRequest;
import com.finflow.account.repository.AccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
