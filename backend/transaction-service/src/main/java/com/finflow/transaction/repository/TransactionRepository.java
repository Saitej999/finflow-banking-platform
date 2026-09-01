package com.finflow.transaction.repository;

import com.finflow.transaction.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findByInitiatedByUserIdOrderByCreatedAtDesc(UUID initiatedByUserId);
}
