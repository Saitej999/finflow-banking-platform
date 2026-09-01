package com.finflow.controller;

import com.finflow.dto.LoginRequest;
import com.finflow.dto.LoginResponse;
import com.finflow.dto.RegisterUserRequest;
import com.finflow.dto.UpdateProfileRequest;
import com.finflow.dto.UserResponse;
import com.finflow.exception.DuplicateEmailException;
import com.finflow.exception.InvalidCredentialsException;
import com.finflow.exception.UserInactiveException;
import com.finflow.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/identity")
public class IdentityController {

    private final UserService userService;

    public IdentityController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterUserRequest request) {
        UserResponse saved = userService.register(request);
        URI location = URI.create(String.format("/api/identity/%s", saved.id()));
        return ResponseEntity.created(location).body(saved);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse resp = userService.login(request);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(org.springframework.security.core.Authentication authentication) {
        String userId = authentication.getName();
        java.util.UUID id = java.util.UUID.fromString(userId);
        UserResponse resp = userService.getById(id);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/me")
    public ResponseEntity<UserResponse> updateMe(
            org.springframework.security.core.Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        java.util.UUID id = java.util.UUID.fromString(authentication.getName());
        UserResponse resp = userService.updateProfile(id, request);
        return ResponseEntity.ok(resp);
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateEmail(DuplicateEmailException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "email_already_exists", "message", ex.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentials(InvalidCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "invalid_credentials", "message", "Invalid email or password"));
    }

    @ExceptionHandler(UserInactiveException.class)
    public ResponseEntity<Map<String, String>> handleUserInactive(UserInactiveException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "user_inactive", "message", ex.getMessage()));
    }
}
