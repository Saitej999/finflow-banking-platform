package com.finflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Password encoding configuration for Identity Service.
 */
@Configuration
public class PasswordConfig {

    /**
     * Exposes a BCryptPasswordEncoder as a Spring bean.
     * Use constructor injection where needed to consume this bean.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        // strength 10 is a reasonable default; tune for production
        return new BCryptPasswordEncoder(10);
    }
}
