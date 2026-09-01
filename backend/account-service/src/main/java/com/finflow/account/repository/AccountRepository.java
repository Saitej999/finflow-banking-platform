package com.finflow.account.repository;

import com.finflow.account.domain.Account;
import com.finflow.account.domain.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {

    Optional<Account> findByAccountNumber(String accountNumber);

    boolean existsByAccountNumber(String accountNumber);

    List<Account> findByUserId(UUID userId);

    List<Account> findByUserIdAndStatus(UUID userId, AccountStatus status);
}
