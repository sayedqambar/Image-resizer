package com.imageresizer.upload;

import com.imageresizer.common.exception.FileTooLargeException;
import com.imageresizer.common.exception.InvalidFileException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Reusable validation for uploaded image files.
 *
 * <p>Validates that a {@link MultipartFile} is present, non-empty, of an allowed
 * content type, and under the configured maximum size. On failure it throws
 * {@link InvalidFileException} (HTTP 400) or {@link FileTooLargeException}
 * (HTTP 413), both translated to clean JSON by {@link
 * com.imageresizer.common.exception.GlobalExceptionHandler}.
 *
 * <p>Any controller that accepts uploads can inject this service and call
 * {@code validate(file)} before processing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadValidator {

    private final FileValidationProperties properties;

    /**
     * Validate the given upload, throwing on the first failure.
     *
     * @param file the uploaded file (may be {@code null})
     * @throws InvalidFileException    if the file is missing/empty or has an unsupported type
     * @throws FileTooLargeException    if the file exceeds the configured maximum size
     */
    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("No file was uploaded.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !properties.getAllowedContentTypes().contains(contentType)) {
            throw new InvalidFileException(
                    "Unsupported file type: " + contentType
                            + ". Allowed types: " + properties.getAllowedContentTypes()
            );
        }

        long maxBytes = properties.getMaxFileSize().toBytes();
        if (file.getSize() > maxBytes) {
            throw new FileTooLargeException(
                    "File is " + humanSize(file.getSize())
                            + ", which exceeds the maximum of " + humanSize(maxBytes) + "."
            );
        }

        log.debug("Validated upload: {} ({} bytes, {})",
                file.getOriginalFilename(), file.getSize(), contentType);
    }

    private String humanSize(long bytes) {
        if (bytes >= 1024L * 1024L) return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        if (bytes >= 1024L) return String.format("%.1f KB", bytes / 1024.0);
        return bytes + " B";
    }
}
