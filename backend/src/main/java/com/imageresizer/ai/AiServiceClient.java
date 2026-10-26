package com.imageresizer.ai;

import com.imageresizer.common.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.net.SocketTimeoutException;
import java.util.Map;

/**
 * Forwards image uploads to the Python FastAPI AI service as multipart form data
 * and returns the processed PNG bytes.
 *
 * <p>Errors and timeouts from the AI service are translated into
 * {@link AiServiceException} (502 Bad Gateway / 504 Gateway Timeout) so the global
 * exception handler can return a clean JSON body.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceClient {

    private final RestTemplate aiRestTemplate;
    private final AiServiceProperties properties;

    /** POST /remove-background on the AI service. */
    public byte[] removeBackground(Resource file, String contentType) {
        return post("/remove-background", file, contentType, null);
    }

    /** POST /upscale?scale=... on the AI service. */
    public byte[] upscale(Resource file, String contentType, int scale) {
        return post("/upscale", file, contentType, Map.of("scale", String.valueOf(scale)));
    }

    /** POST /smart-crop?aspect_w=...&aspect_h=... on the AI service. */
    public byte[] smartCrop(Resource file, String contentType, int aspectW, int aspectH) {
        return post("/smart-crop", file, contentType,
                Map.of("aspect_w", String.valueOf(aspectW), "aspect_h", String.valueOf(aspectH)));
    }

    private byte[] post(String path, Resource file, String contentType, Map<String, String> formFields) {
        // The file part carries the original content type so the AI service can trust it.
        HttpHeaders partHeaders = new HttpHeaders();
        partHeaders.setContentType(MediaType.parseMediaType(contentType));
        HttpEntity<Resource> filePart = new HttpEntity<>(file, partHeaders);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", filePart);
        if (formFields != null) {
            formFields.forEach(body::add);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        String url = baseUrl() + path;
        try {
            ResponseEntity<byte[]> response = aiRestTemplate.postForEntity(url, request, byte[].class);
            byte[] result = response.getBody();
            if (!response.getStatusCode().is2xxSuccessful() || result == null) {
                throw new AiServiceException(HttpStatus.BAD_GATEWAY,
                        "AI service returned " + response.getStatusCode());
            }
            return result;
        } catch (ResourceAccessException ex) {
            // Read/connect timeouts surface as SocketTimeoutException in the cause chain.
            HttpStatus status = (ex.getCause() instanceof SocketTimeoutException)
                    ? HttpStatus.GATEWAY_TIMEOUT
                    : HttpStatus.BAD_GATEWAY;
            throw new AiServiceException(status, "AI service unreachable: " + ex.getMessage(), ex);
        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            HttpStatus status = ex.getStatusCode().is5xxServerError()
                    ? HttpStatus.BAD_GATEWAY
                    : HttpStatus.BAD_REQUEST;
            throw new AiServiceException(status,
                    "AI service error (" + ex.getStatusCode() + "): " + ex.getResponseBodyAsString(), ex);
        }
    }

    private String baseUrl() {
        return properties.getUrl().replaceAll("/+$", "");
    }
}
