package com.finflow.transaction.service;

import com.finflow.transaction.client.AccountServiceClient;
import com.finflow.transaction.client.TransferFundsRequest;
import com.finflow.transaction.client.TransferFundsResponse;
import com.finflow.transaction.domain.Transaction;
import com.finflow.transaction.domain.TransactionStatus;
import com.finflow.transaction.dto.TransactionResponse;
import com.finflow.transaction.dto.TransferRequest;
import com.finflow.transaction.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountServiceClient accountServiceClient;

    public TransactionService(TransactionRepository transactionRepository,
                             AccountServiceClient accountServiceClient) {
        this.transactionRepository = transactionRepository;
        this.accountServiceClient = accountServiceClient;
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public TransactionResponse transfer(UUID authenticatedUserId, TransferRequest request, String authorizationHeader) {
        if (request.sourceAccountId().equals(request.destinationAccountId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourceAccountId and destinationAccountId must be different");
        }

        String normalizedCurrency = normalizeCurrency(request.currency());
        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be greater than zero");
        }

        Transaction transaction = new Transaction();
        transaction.setInitiatedByUserId(authenticatedUserId);
        transaction.setSourceAccountId(request.sourceAccountId());
        transaction.setDestinationAccountId(request.destinationAccountId());
        transaction.setAmount(request.amount());
        transaction.setCurrency(normalizedCurrency);
        transaction.setStatus(TransactionStatus.PENDING);
        transaction = transactionRepository.save(transaction);

        try {
            TransferFundsRequest accountRequest = new TransferFundsRequest(
                    request.sourceAccountId(),
                    request.destinationAccountId(),
                    request.amount(),
                    normalizedCurrency
            );

            // V1 synchronous flow: Transaction Service writes the ledger first, then asks the
            // Account Service to atomically debit/credit in its own database. A future production
            // design could move this to a Saga or event-driven coordination model.
            TransferFundsResponse accountResponse = accountServiceClient.transfer(authorizationHeader, accountRequest);

            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setCompletedAt(Instant.now());
            transaction = transactionRepository.save(transaction);

            return toResponse(transaction);
        } catch (ResponseStatusException ex) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw ex;
        } catch (Exception ex) {
            transaction.setStatus(TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Account service transfer failed", ex);
        }
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getMyTransactions(UUID authenticatedUserId) {
        return transactionRepository.findByInitiatedByUserIdOrderByCreatedAtDesc(authenticatedUserId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(UUID authenticatedUserId, UUID transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transaction not found"));

        if (!transaction.getInitiatedByUserId().equals(authenticatedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this transaction");
        }

        return toResponse(transaction);
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

    private TransactionResponse toResponse(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getInitiatedByUserId(),
                transaction.getSourceAccountId(),
                transaction.getDestinationAccountId(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getStatus(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt(),
                transaction.getCompletedAt()
        );
    }
}
