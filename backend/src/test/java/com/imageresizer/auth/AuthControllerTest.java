package com.imageresizer.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.imageresizer.common.exception.GlobalExceptionHandler;
import com.imageresizer.config.SecurityConfig;
import com.imageresizer.usage.UsageLimitProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Slice tests for register and login endpoints.
 */
@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class,
         JwtService.class, JwtProperties.class, JwtAuthFilter.class,
         UsageLimitProperties.class})
class AuthControllerTest {

    @Autowired MockMvc          mvc;
    @Autowired ObjectMapper     mapper;
    @MockitoBean UserRepository userRepository;

    private static final String EMAIL    = "test@example.com";
    private static final String PASSWORD = "password123";

    private User savedUser;

    @BeforeEach
    void setUp() {
        savedUser = User.builder().id(1L).email(EMAIL)
                .password(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                        .encode(PASSWORD))
                .build();
    }

    // ── register ─────────────────────────────────────────────────────────────

    @Test
    void register_newUser_returns201WithToken() throws Exception {
        when(userRepository.existsByEmail(EMAIL)).thenReturn(false);
        when(userRepository.save(any())).thenReturn(savedUser);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new AuthRequest(EMAIL, PASSWORD))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.expiresIn").isNumber());
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        when(userRepository.existsByEmail(EMAIL)).thenReturn(true);

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new AuthRequest(EMAIL, PASSWORD))))
                .andExpect(status().isConflict());
    }

    @Test
    void register_invalidEmail_returns400() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new AuthRequest("not-an-email", PASSWORD))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_shortPassword_returns400() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new AuthRequest(EMAIL, "short"))))
                .andExpect(status().isBadRequest());
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_correctCredentials_returns200WithToken() throws Exception {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(savedUser));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new AuthRequest(EMAIL, PASSWORD))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(EMAIL));
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(savedUser));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new AuthRequest(EMAIL, "wrong-password"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_unknownEmail_returns401() throws Exception {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(new AuthRequest("no@one.com", PASSWORD))))
                .andExpect(status().isUnauthorized());
    }
}
