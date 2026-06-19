package com.poc.bigquery.model;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Immutable DTO that carries query results from the service layer
 * to the Thymeleaf template.
 */
public class QueryResult {

    private final List<String>              headers;
    private final List<Map<String, String>> rows;
    private final String                    executedSql;
    private final long                      elapsedMs;

    public QueryResult(List<String>              headers,
                       List<Map<String, String>> rows,
                       String                    executedSql,
                       long                      elapsedMs) {
        this.headers     = Collections.unmodifiableList(headers);
        this.rows        = Collections.unmodifiableList(rows);
        this.executedSql = executedSql;
        this.elapsedMs   = elapsedMs;
    }

    public List<String>              getHeaders()     { return headers;     }
    public List<Map<String, String>> getRows()        { return rows;        }
    public String                    getExecutedSql() { return executedSql; }
    public long                      getElapsedMs()   { return elapsedMs;   }
    public int                       getRowCount()    { return rows.size(); }
}
