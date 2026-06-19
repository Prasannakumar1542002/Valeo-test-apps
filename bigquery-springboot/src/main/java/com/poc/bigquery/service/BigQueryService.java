package com.poc.bigquery.service;

import com.google.cloud.bigquery.*;
import com.poc.bigquery.config.BigQueryProperties;
import com.poc.bigquery.model.QueryResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Spring service that wraps the BigQuery client. The {@link BigQuery} bean is
 * injected by Spring (built in BigQueryConfig).
 */
@Service
public class BigQueryService {

	private static final Logger log = LoggerFactory.getLogger(BigQueryService.class);

	private final BigQuery bigQuery;
	private final BigQueryProperties props;

	public BigQueryService(BigQuery bigQuery, BigQueryProperties props) {
		this.bigQuery = bigQuery;
		this.props = props;
	}

	// ── Fetch default table ───────────────────────────────────────

	public QueryResult fetchTableData() throws InterruptedException {
		return fetchTableData(0, props.getMaxRows(), null, null, null, null, null, null);
	}

	public QueryResult fetchTableData(int page, int size) throws InterruptedException {
		return fetchTableData(page, size, null, null, null, null, null, null);
	}

	public QueryResult fetchTableData(int page, int size, String orgaloc, String pudate, String lra, String cc, String rechargeable, String project) throws InterruptedException {
		Map<String, String> params = buildParamMap(orgaloc, pudate, lra, cc, rechargeable, project);
		int offset = page * size;
		String sql = String.format(
				"SELECT * FROM `%s.%s.%s` %s "
						+ "ORDER BY createdOnDateFormat DESC LIMIT %d OFFSET %d",
				props.getProjectId(), props.getDatasetId(), props.getTableId(), buildWhereClause(params), size, offset);
		return runQuery(sql, params);
	}

	// ── Fetch total row count for Pagination ──────────────────────

	public long fetchTableCount() throws InterruptedException {
		return fetchTableCount(null, null, null, null, null, null);
	}

	public long fetchTableCount(String orgaloc, String pudate, String lra, String cc, String rechargeable, String project) throws InterruptedException {
		Map<String, String> params = buildParamMap(orgaloc, pudate, lra, cc, rechargeable, project);
		String sql = String.format(
				"SELECT COUNT(*) FROM `%s.%s.%s` %s",
				props.getProjectId(), props.getDatasetId(), props.getTableId(), buildWhereClause(params));
		
		QueryJobConfiguration.Builder builder = QueryJobConfiguration.newBuilder(sql).setUseLegacySql(false);
		for (Map.Entry<String, String> entry : params.entrySet()) {
			builder.addNamedParameter(entry.getKey(), QueryParameterValue.string(entry.getValue()));
		}
		
		TableResult result = bigQuery.query(builder.build());
		for (FieldValueList row : result.iterateAll()) {
			return row.get(0).getLongValue();
		}
		return 0;
	}

	private Map<String, String> buildParamMap(String orgaloc, String pudate, String lra, String cc, String rechargeable, String project) {
		Map<String, String> params = new HashMap<>();
		if (orgaloc != null && !orgaloc.isBlank()) params.put("orgaloc", orgaloc.trim());
		if (pudate != null && !pudate.isBlank()) params.put("pudate", pudate.trim());
		if (lra != null && !lra.isBlank()) params.put("lra", lra.trim());
		if (cc != null && !cc.isBlank()) params.put("cc", cc.trim());
		if (rechargeable != null && !rechargeable.isBlank()) params.put("rechargeable", rechargeable.trim());
		if (project != null && !project.isBlank()) params.put("project", project.trim());
		return params;
	}

	private String buildWhereClause(Map<String, String> params) {
		StringBuilder where = new StringBuilder("WHERE createdOnDateFormat <= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)");
		if (params.containsKey("orgaloc")) where.append(" AND orgaloc = @orgaloc");
		if (params.containsKey("pudate")) where.append(" AND pu_date = @pudate");
		if (params.containsKey("lra")) where.append(" AND Logistic_Red_Alert = @lra");
		if (params.containsKey("cc")) where.append(" AND Cost_Center = @cc");
		if (params.containsKey("rechargeable")) where.append(" AND LOWER(Freight_Rechargeable) = LOWER(@rechargeable)");
		if (params.containsKey("project")) where.append(" AND Project_Name = @project");
		return where.toString();
	}

	// ── Run arbitrary SQL ─────────────────────────────────────────

	public QueryResult runQuery(String sql) throws InterruptedException {
		return runQuery(sql, new HashMap<>());
	}

	public QueryResult runQuery(String sql, Map<String, String> parameters) throws InterruptedException {
		log.info("Executing SQL: {}", sql);
		long start = System.currentTimeMillis();

		QueryJobConfiguration.Builder builder = QueryJobConfiguration.newBuilder(sql).setUseLegacySql(false);
		for (Map.Entry<String, String> entry : parameters.entrySet()) {
			builder.addNamedParameter(entry.getKey(), QueryParameterValue.string(entry.getValue()));
		}

		TableResult result = bigQuery.query(builder.build());
		long elapsed = System.currentTimeMillis() - start;

		// Extract column names from schema
		Schema schema = result.getSchema();
		List<String> headers = new ArrayList<>();
		if (schema != null) {
			for (Field f : schema.getFields()) {
				headers.add(f.getName());
			}
		}

		// Convert rows to List<Map<String, String>> for easy template iteration
		List<Map<String, String>> rows = new ArrayList<>();
		for (FieldValueList row : result.iterateAll()) {
			Map<String, String> rowMap = new LinkedHashMap<>();
			for (int i = 0; i < headers.size(); i++) {
				FieldValue fv = row.get(i);
				rowMap.put(headers.get(i), fv.isNull() ? "" : fv.getValue().toString());
			}
			rows.add(rowMap);
		}

		log.info("Query returned {} row(s) in {} ms", rows.size(), elapsed);
		log.info("TableResult rows : {}", rows);
		return new QueryResult(headers, rows, sql, elapsed);
	}
}
