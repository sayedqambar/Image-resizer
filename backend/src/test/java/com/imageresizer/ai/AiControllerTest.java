package com.imageresizer.ai;

import com.imageresizer.auth.JwtAuthFilter;
import com.imageresizer.auth.JwtProperties;
import com.imageresizer.auth.JwtService;
import com.imageresizer.auth.UserRepository;
import com.imageresizer.common.exception.AiServiceException;
import com.imageresizer.common.exception.GlobalExceptionHandler;
import com.imageresizer.common.exception.InvalidFileException;
import com.imageresizer.config.SecurityConfig;
import com.imageresizer.upload.FileUploadValidator;
import com.imageresizer.usage.UsageEnforcementService;
import com.imageresizer.usage.UsageLimitProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Slice tests for {@link AiController}.
 *
 * Security filter chain is loaded so the tests exercise the real permit-all rule
 * for /api/ai/**. UsageEnforcementService is mocked so no DB is needed.
 */
@WebMvcTest(AiController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class,
         JwtAuthFilter.class, JwtService.class, JwtProperties.class,
         UsageLimitProperties.class})
class AiControllerTest {

    @Autowired MockMvc mvc;

    @MockitoBean AiServiceClient          client;
    @MockitoBean FileUploadValidator      validator;
    @MockitoBean UsageEnforcementService  usageService;
    @MockitoBean UserRepository           userRepository;  // needed by JwtAuthFilter

    private static final byte[] PNG_BYTES = {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x01
    };

    private MockMultipartFile pngFile() {
        return new MockMultipartFile("file", "photo.png", "image/png", PNG_BYTES);
    }

    @BeforeEach
    void defaults() {
        doNothing().when(validator).validate(any());
        doNothing().when(usageService).checkAndRecord(any(), anyString(), anyString());
    }

    // ── remove-background ────────────────────────────────────────────────────

    @Test
    void removeBackground_ok() throws Exception {
        byte[] result = {1, 2, 3};
        when(client.removeBackground(any(), anyString())).thenReturn(result);

        mvc.perform(multipart("/api/ai/remove-background").file(pngFile()))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(result));
    }

    @Test
    void removeBackground_missingFile_returns400() throws Exception {
        mvc.perform(multipart("/api/ai/remove-background"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("No file was uploaded."));
    }

    @Test
    void removeBackground_invalidFileType_returns400() throws Exception {
        doThrow(new InvalidFileException("Unsupported file type: text/plain."))
                .when(validator).validate(any());

        mvc.perform(multipart("/api/ai/remove-background").file(pngFile()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Unsupported")));
    }

    @Test
    void removeBackground_aiTimeout_returns504() throws Exception {
        when(client.removeBackground(any(), anyString()))
                .thenThrow(new AiServiceException(HttpStatus.GATEWAY_TIMEOUT,
                        "AI service unreachable: timeout"));

        mvc.perform(multipart("/api/ai/remove-background").file(pngFile()))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.message").value(containsString("timeout")));
    }

    @Test
    void removeBackground_aiBadGateway_returns502() throws Exception {
        when(client.removeBackground(any(), anyString()))
                .thenThrow(new AiServiceException(HttpStatus.BAD_GATEWAY, "AI service error (500)"));

        mvc.perform(multipart("/api/ai/remove-background").file(pngFile()))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502));
    }

    @Test
    void removeBackground_quotaExceeded_returns429() throws Exception {
        doThrow(new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                "Daily limit reached (2 AI uses/day for guests). Log in for more."))
                .when(usageService).checkAndRecord(any(), anyString(), anyString());

        mvc.perform(multipart("/api/ai/remove-background").file(pngFile()))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value(containsString("Daily limit reached")));
    }

    // ── upscale ──────────────────────────────────────────────────────────────

    @Test
    void upscale_2x_ok() throws Exception {
        byte[] result = {4, 5, 6};
        when(client.upscale(any(), anyString(), anyInt())).thenReturn(result);

        mvc.perform(multipart("/api/ai/upscale").file(pngFile()).param("scale", "2"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(result));
    }

    @Test
    void upscale_4x_ok() throws Exception {
        byte[] result = {7, 8, 9};
        when(client.upscale(any(), anyString(), anyInt())).thenReturn(result);

        mvc.perform(multipart("/api/ai/upscale").file(pngFile()).param("scale", "4"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(result));
    }

    @Test
    void upscale_invalidScale_returns400() throws Exception {
        mvc.perform(multipart("/api/ai/upscale").file(pngFile()).param("scale", "3"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("scale must be 2 or 4")));
    }

    @Test
    void upscale_missingScale_returns400() throws Exception {
        mvc.perform(multipart("/api/ai/upscale").file(pngFile()))
                .andExpect(status().isBadRequest());
    }

    // ── smart-crop ───────────────────────────────────────────────────────────

    @Test
    void smartCrop_ok() throws Exception {
        byte[] result = {10, 11, 12};
        when(client.smartCrop(any(), anyString(), anyInt(), anyInt())).thenReturn(result);

        mvc.perform(multipart("/api/ai/smart-crop")
                        .file(pngFile()).param("width", "16").param("height", "9"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(result));
    }

    @Test
    void smartCrop_zeroDimension_returns400() throws Exception {
        mvc.perform(multipart("/api/ai/smart-crop")
                        .file(pngFile()).param("width", "0").param("height", "9"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("width and height must be positive")));
    }

    @Test
    void smartCrop_missingHeight_returns400() throws Exception {
        mvc.perform(multipart("/api/ai/smart-crop").file(pngFile()).param("width", "16"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void smartCrop_aiError_returns502() throws Exception {
        when(client.smartCrop(any(), anyString(), anyInt(), anyInt()))
                .thenThrow(new AiServiceException(HttpStatus.BAD_GATEWAY,
                        "AI service error (422): bad params"));

        mvc.perform(multipart("/api/ai/smart-crop")
                        .file(pngFile()).param("width", "1").param("height", "1"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message").value(containsString("AI service error")));
    }
}
