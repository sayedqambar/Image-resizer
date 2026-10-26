package com.imageresizer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Entry point for the Image Resizer backend.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class ImageResizerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ImageResizerApplication.class, args);
    }
}
