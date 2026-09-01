package com.finflow.service;

import com.finflow.domain.Role;
import com.finflow.domain.Status;
import com.finflow.domain.User;
import com.finflow.dto.RegisterUserRequest;
import com.finflow.dto.UpdateProfileRequest;
import com.finflow.dto.UserResponse;
import com.finflow.exception.DuplicateEmailException;
import com.finflow.exception.InvalidCredentialsException;
import com.finflow.exception.UserInactiveException;
import com.finflow.dto.LoginRequest;
import com.finflow.dto.LoginResponse;
import com.finflow.service.JwtService;
import com.finflow.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for user-related business logic such as registration.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Register a new user.
     *
     * @param request registration request
     * @return UserResponse representing the saved user
     */
    @Transactional
    public UserResponse register(RegisterUserRequest request) {
        String email = request.email().trim().toLowerCase();

        // Check for duplicate email
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException("Email already registered: " + email);
        }

        // Hash password
        String hashed = passwordEncoder.encode(request.password());

        // Build user using available API on User entity
        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(email);
        user.setPasswordHash(hashed);
        user.setRole(Role.USER);      // default role per project enums
        user.setStatus(Status.ACTIVE); // default status

        // Persist
        User saved = userRepository.save(user);

        // Map to response (do not expose passwordHash)
        return new UserResponse(
                saved.getId(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getStatus(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();

        var userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Do not reveal whether email exists
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (user.getStatus() != Status.ACTIVE) {
            throw new UserInactiveException("User status does not allow login");
        }

        String token = jwtService.generateToken(user);
        long expiresIn = jwtService.getExpirationSeconds();

        UserResponse userResp = new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );

        return new LoginResponse(token, "Bearer", expiresIn, userResp);
    }

    @Transactional(readOnly = true)
    public UserResponse getById(java.util.UUID id) {
        var user = userRepository.findById(id).orElseThrow(() -> new com.finflow.exception.UserNotFoundException("User not found"));
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    @Transactional
    public UserResponse updateProfile(java.util.UUID id, UpdateProfileRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new com.finflow.exception.UserNotFoundException("User not found"));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        User saved = userRepository.save(user);
        return new UserResponse(
                saved.getId(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getStatus(),
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }
}

