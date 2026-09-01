package com.finflow.transaction.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;

@Component
public class AccountServiceClient {

    private final RestClient restClient;

    public AccountServiceClient(@Value("${clients.account-service.base-url}") String baseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public TransferFundsResponse transfer(String authorizationHeader, TransferFundsRequest request) {
        try {
            return restClient.post()
                    .uri("/api/accounts/transfer")
                    .header("Authorization", authorizationHeader)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(TransferFundsResponse.class);
        } catch (org.springframework.web.client.HttpClientErrorException ex) {
            throw mapHttpError(ex);
        } catch (org.springframework.web.client.HttpServerErrorException ex) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(ex.getStatusCode().value()), "Account service error");
        } catch (Exception ex) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY, "Unable to reach account service", ex);
        }
    }

    private ResponseStatusException mapHttpError(org.springframework.web.client.HttpClientErrorException ex) {
        String reason = ex.getResponseBodyAsString();
        HttpStatusCode statusCode = HttpStatusCode.valueOf(ex.getStatusCode().value());
        if (statusCode.isSameCodeAs(org.springframework.http.HttpStatus.BAD_REQUEST)) {
            return new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Account transfer validation failed");
        }
        if (statusCode.isSameCodeAs(org.springframework.http.HttpStatus.FORBIDDEN)) {
            return new ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Account transfer forbidden");
        }
        if (statusCode.isSameCodeAs(org.springframework.http.HttpStatus.NOT_FOUND)) {
            return new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Account transfer target not found");
        }
        if (statusCode.isSameCodeAs(org.springframework.http.HttpStatus.CONFLICT)) {
            return new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Account transfer conflict");
        }
        return new ResponseStatusException(statusCode, Objects.requireNonNullElse(reason, "Account service rejected the transfer"));
    }
}
