package com.poc.bigquery.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Typed configuration bean — values are read from application.properties
 * (prefix: bigquery.*) and can be overridden with environment variables:
 *
 *   BIGQUERY_PROJECT_ID, BIGQUERY_DATASET_ID, BIGQUERY_TABLE_ID, etc.
 */
@Component
@ConfigurationProperties(prefix = "bigquery")
public class BigQueryProperties {

    private String projectId;
    private String datasetId;
    private String tableId;
    private int maxRows = 100;
    private String serviceAccountKeyPath = "";

    // ── Getters & Setters ─────────────────────────────────────────

    public String getProjectId()             { return projectId; }
    public void   setProjectId(String v)     { this.projectId = v; }

    public String getDatasetId()             { return datasetId; }
    public void   setDatasetId(String v)     { this.datasetId = v; }

    public String getTableId()               { return tableId; }
    public void   setTableId(String v)       { this.tableId = v; }

    public int    getMaxRows()               { return maxRows; }
    public void   setMaxRows(int v)          { this.maxRows = v; }

    public String getServiceAccountKeyPath()        { return serviceAccountKeyPath; }
    public void   setServiceAccountKeyPath(String v){ this.serviceAccountKeyPath = v; }
}
