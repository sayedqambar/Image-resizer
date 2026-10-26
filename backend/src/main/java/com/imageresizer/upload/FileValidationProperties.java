package com.imageresizer.upload;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;

import java.util.List;

/**
 * Configurable file-upload rules, bound from {@code app.upload.*} in
 * application.yml. Defaults mirror the frontend's dropzone rules.
 */
@Data
@ConfigurationProperties(prefix = "app.upload")
public class FileValidationProperties {

    /** Content types the API will accept for processing. */
    private List<String> allowedContentTypes =
            List.of("image/jpeg", "image/png", "image/webp");

    /** Maximum accepted file size. */
    private DataSize maxFileSize = DataSize.ofMegabytes(10);
}
