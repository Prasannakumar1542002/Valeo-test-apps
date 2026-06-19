package com.poc.bigquery.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

/**
 * Produces a singleton {@link BigQuery} client as a Spring bean.
 *
 * Auth strategy (priority order):
 *  1. Service-account JSON key  →  set bigquery.service-account-key-path
 *  2. Application Default Credentials (ADC)  →  gcloud auth application-default login
 *     (automatic on GCE / GKE / Cloud Run)
 */
@Configuration
public class BigQueryConfig {

    private static final Logger log = LoggerFactory.getLogger(BigQueryConfig.class);

    @Bean
    public BigQuery bigQuery(BigQueryProperties props) throws IOException {
        BigQueryOptions.Builder builder = BigQueryOptions.newBuilder()
                .setProjectId(props.getProjectId());

        String keyPath = props.getServiceAccountKeyPath();
        if (keyPath != null && !keyPath.isBlank()) {
            log.info("BigQuery auth: service-account key → {}", keyPath);
            try (FileInputStream fis = new FileInputStream(keyPath)) {
                builder.setCredentials(ServiceAccountCredentials.fromStream(fis));
            }
        } else {
            log.info("BigQuery auth: Application Default Credentials");
            builder.setCredentials(GoogleCredentials.getApplicationDefault());
        }

        BigQuery client = builder.build().getService();
        log.info("BigQuery client ready — project: {}", props.getProjectId());
        return client;
    }
}
