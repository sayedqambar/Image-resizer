package com.imageresizer.config;

import com.imageresizer.ai.AiServiceProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Builds the {@link RestTemplate} used to forward image uploads to the Python AI
 * service, configured with connect/read timeouts from {@link AiServiceProperties}.
 */
@Configuration
@RequiredArgsConstructor
public class RestClientConfig {

    private final AiServiceProperties properties;

    @Bean
    public RestTemplate aiRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) properties.getConnectTimeout().toMillis());
        factory.setReadTimeout((int) properties.getReadTimeout().toMillis());
        return new RestTemplate(factory);
    }
}
