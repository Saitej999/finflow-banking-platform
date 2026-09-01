package com.finflow.service;

import com.finflow.domain.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Minimal JWT service using HS256 (HMAC) for demo/dev use.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationSeconds;

    public JwtService(@Value("${jwt.secret:dev-secret-change-me}") String secret,
                      @Value("${jwt.expiration-seconds:3600}") long expirationSeconds) {
        // Use provided secret to create HMAC key. In production, supply a secure random secret.
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationSeconds = expirationSeconds;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Date iat = Date.from(now);
        Date exp = Date.from(now.plusSeconds(expirationSeconds));

        return Jwts.builder()
                .setSubject(user.getId().toString())
                .setIssuedAt(iat)
                .setExpiration(exp)
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public io.jsonwebtoken.Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}

