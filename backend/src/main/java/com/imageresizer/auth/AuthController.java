package com.imageresizer.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Public authentication endpoints.
 *
 * <ul>
 *   <li>{@code POST /api/auth/register} — create a new account, return JWT</li>
 *   <li>{@code POST /api/auth/login}    — verify credentials, return JWT</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository    userRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtService        jwtService;
    private final JwtProperties     jwtProperties;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest body) {
        if (userRepository.existsByEmail(body.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account with that email already exists.");
        }
        User user = userRepository.save(User.builder()
                .email(body.email())
                .password(passwordEncoder.encode(body.password()))
                .build());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(buildResponse(user));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest body) {
        User user = userRepository.findByEmail(body.email())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (!passwordEncoder.matches(body.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Invalid email or password.");
        }
        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        return new AuthResponse(
                jwtService.generate(user),
                user.getEmail(),
                jwtProperties.getExpiryMs()
        );
    }
}
