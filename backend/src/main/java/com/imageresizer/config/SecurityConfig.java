package com.imageresizer.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.imageresizer.auth.JwtAuthFilter;
import com.imageresizer.common.exception.ApiError;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/**
 * Stateless JWT-based security configuration.
 *
 * <p>Public endpoints (no token required):
 * <ul>
 *   <li>{@code POST /api/auth/register}</li>
 *   <li>{@code POST /api/auth/login}</li>
 *   <li>{@code GET  /api/health}</li>
 *   <li>{@code GET  /api/usage}  — works for both anon + authenticated</li>
 *   <li>{@code POST /api/ai/**}  — quota-checked inside the controller</li>
 * </ul>
 *
 * <p>All other paths require a valid JWT.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper  objectMapper;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // CORS must be configured here when Security is active — the MVC-only
            // CorsConfig is bypassed by the security filter chain.
            .cors(c -> c.configurationSource(corsSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/health",
                    "/api/usage",
                    "/api/ai/**",          // quota-enforced, not auth-enforced
                    "/h2-console/**"       // dev profile only
                ).permitAll()
                .anyRequest().authenticated()
            )
            // H2 console uses frames; disable frameOptions for dev convenience.
            .headers(h -> h.frameOptions(f -> f.disable()))

            // Return clean JSON (ApiError) instead of HTML for 401/403.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    res.setStatus(HttpStatus.UNAUTHORIZED.value());
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(res.getWriter(), new ApiError(
                            Instant.now(), 401, "Unauthorized",
                            "Authentication required.", req.getRequestURI()));
                })
                .accessDeniedHandler((req, res, e) -> {
                    res.setStatus(HttpStatus.FORBIDDEN.value());
                    res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    objectMapper.writeValue(res.getWriter(), new ApiError(
                            Instant.now(), 403, "Forbidden",
                            "Access denied.", req.getRequestURI()));
                })
            )

            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(Arrays.asList(allowedOrigins));
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cfg);
        return source;
    }
}
