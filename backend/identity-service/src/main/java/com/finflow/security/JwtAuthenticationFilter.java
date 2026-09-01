package com.finflow.security;

import com.finflow.service.JwtService;
import com.finflow.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final AuthEntryPoint authEntryPoint;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository, AuthEntryPoint authEntryPoint) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.authEntryPoint = authEntryPoint;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (!StringUtils.hasText(header) || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            Claims claims = jwtService.parseClaims(token);
            String sub = claims.getSubject();
            if (sub == null) {
                throw new BadCredentialsException("Token missing subject");
            }
            UUID userId = UUID.fromString(sub);

            var userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new BadCredentialsException("Invalid token subject");
            }
            var user = userOpt.get();

            // check status
            if (user.getStatus() == null || !user.getStatus().name().equals("ACTIVE")) {
                // reject inactive users
                authEntryPoint.commence(request, response, new BadCredentialsException("User inactive"));
                return;
            }

            var authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
            var auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                    user.getId().toString(), null, List.of(authority)
            );
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);

            filterChain.doFilter(request, response);
        } catch (JwtException | IllegalArgumentException e) {
            // token invalid or expired
            authEntryPoint.commence(request, response, new BadCredentialsException("Invalid or expired token"));
        }
    }
}
