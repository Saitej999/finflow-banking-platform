package com.finflow.account.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

@Component
public class JwtValidator {

    private final SecretKey key;

    public JwtValidator(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Parses and validates the given JWT string.
     * Throws JwtException if the token is malformed, expired, or has an invalid signature.
     *
     * @param token raw JWT (without "Bearer " prefix)
     * @return verified Claims
     */
    public Claims parseAndValidate(String token) throws JwtException {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
