package com.imageresizer.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Reads the {@code Authorization: Bearer <token>} header, validates the JWT, and
 * installs a {@link UsernamePasswordAuthenticationToken} into the
 * {@link SecurityContextHolder} so downstream code can call
 * {@code SecurityContextHolder.getContext().getAuthentication()}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        if (!jwtService.isValid(token)) {
            chain.doFilter(request, response);
            return;
        }

        try {
            String email  = jwtService.extractEmail(token);
            Long   userId = jwtService.extractUserId(token);

            userRepository.findById(userId).ifPresent(user -> {
                var auth = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER"))
                );
                // Stash userId as details so controllers can read it without a DB round-trip.
                auth.setDetails(userId);
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        } catch (Exception ex) {
            log.debug("JWT auth failed: {}", ex.getMessage());
        }

        chain.doFilter(request, response);
    }
}
