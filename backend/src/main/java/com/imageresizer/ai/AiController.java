package com.imageresizer.ai;

import com.imageresizer.common.exception.InvalidFileException;
import com.imageresizer.common.exception.InvalidRequestException;
import com.imageresizer.upload.FileUploadValidator;
import com.imageresizer.usage.RequestUtils;
import com.imageresizer.usage.UsageEnforcementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.stream.Stream;

/**
 * Endpoints that accept an image upload, enforce daily usage quotas, forward
 * the request to the Python AI service, and return the processed image as PNG.
 *
 * <p>Each upload is written to a per-request temporary directory and deleted
 * afterwards, including on failure.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final FileUploadValidator    validator;
    private final AiServiceClient        client;
    private final UsageEnforcementService usageService;

    @PostMapping("/remove-background")
    public ResponseEntity<byte[]> removeBackground(
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication auth,
            HttpServletRequest request) throws IOException {
        requireFile(file);
        validator.validate(file);
        usageService.checkAndRecord(RequestUtils.resolveUserId(auth),
                RequestUtils.resolveIp(request), "remove_bg");
        return process(file, client::removeBackground);
    }

    @PostMapping("/upscale")
    public ResponseEntity<byte[]> upscale(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam int scale,
            Authentication auth,
            HttpServletRequest request) throws IOException {
        requireFile(file);
        if (scale != 2 && scale != 4) {
            throw new InvalidRequestException("scale must be 2 or 4.");
        }
        validator.validate(file);
        usageService.checkAndRecord(RequestUtils.resolveUserId(auth),
                RequestUtils.resolveIp(request), "upscale");
        return process(file, (resource, type) -> client.upscale(resource, type, scale));
    }

    @PostMapping("/smart-crop")
    public ResponseEntity<byte[]> smartCrop(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam int width,
            @RequestParam int height,
            Authentication auth,
            HttpServletRequest request) throws IOException {
        requireFile(file);
        if (width < 1 || height < 1) {
            throw new InvalidRequestException("width and height must be positive integers.");
        }
        validator.validate(file);
        usageService.checkAndRecord(RequestUtils.resolveUserId(auth),
                RequestUtils.resolveIp(request), "smart_crop");
        return process(file, (resource, type) -> client.smartCrop(resource, type, width, height));
    }

    private void requireFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("No file was uploaded.");
        }
    }

    private ResponseEntity<byte[]> process(MultipartFile file, AiCall call) throws IOException {
        Path tempDir = Files.createTempDirectory("ai-upload-");
        try {
            Path tempFile = tempDir.resolve(safeName(file));
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }
            Resource resource = new FileSystemResource(tempFile);
            byte[] result = call.apply(resource, file.getContentType());
            return imageResponse(result);
        } finally {
            deleteRecursively(tempDir);
        }
    }

    private ResponseEntity<byte[]> imageResponse(byte[] body) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"processed.png\"")
                .body(body);
    }

    private String safeName(MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null || name.isBlank()) return "upload.png";
        int slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
        if (slash >= 0) name = name.substring(slash + 1);
        if (name.isBlank() || name.equals(".") || name.equals("..")) return "upload.png";
        return name;
    }

    private void deleteRecursively(Path dir) {
        if (dir == null) return;
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(p -> {
                try { Files.deleteIfExists(p); } catch (IOException ignored) {}
            });
        } catch (IOException e) {
            log.warn("Failed to delete temp dir {}: {}", dir, e.getMessage());
        }
    }

    @FunctionalInterface
    private interface AiCall {
        byte[] apply(Resource resource, String contentType);
    }
}
