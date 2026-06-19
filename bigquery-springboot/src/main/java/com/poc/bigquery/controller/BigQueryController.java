package com.poc.bigquery.controller;

import com.poc.bigquery.config.BigQueryProperties;
import com.poc.bigquery.model.QueryResult;
import com.poc.bigquery.service.BigQueryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.http.ResponseEntity;
import java.util.Collections;

/**
 * Spring MVC controller — replaces BigQueryServlet.java.
 *
 * GET  /        → redirect to /data
 * GET  /data    → load default table
 * POST /data    → run custom SQL entered in the UI
 */
@Controller
public class BigQueryController {

    private static final Logger log = LoggerFactory.getLogger(BigQueryController.class);

    private final BigQueryService    service;
    private final BigQueryProperties props;

    public BigQueryController(BigQueryService service, BigQueryProperties props) {
        this.service = service;
        this.props   = props;
    }

    // ── GET /data — load default table ───────────────────────────

    @GetMapping({"/", "/data"})
    public String getData(Model model) {
        addConnectionInfo(model);
        try {
            QueryResult result = service.fetchTableData();
            model.addAttribute("queryResult", result);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            model.addAttribute("errorMessage", "Query was interrupted: " + e.getMessage());
        } catch (Exception e) {
            log.error("BigQuery fetch failed", e);
            model.addAttribute("errorMessage", "Query failed: " + e.getMessage());
        }
        return "index";  // → templates/index.html
    }

    // ── GET /api/data — load default table as JSON ────────────────

    @CrossOrigin(origins = "*")
    @GetMapping("/api/data")
    @ResponseBody
    public ResponseEntity<?> getDataJson(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String orgaloc,
            @RequestParam(required = false) String pudate,
            @RequestParam(required = false) String lra,
            @RequestParam(required = false) String cc,
            @RequestParam(required = false) String rechargeable,
            @RequestParam(required = false) String project) {
        try {
            QueryResult result = service.fetchTableData(page, size, orgaloc, pudate, lra, cc, rechargeable, project);
            long totalRows = service.fetchTableCount(orgaloc, pudate, lra, cc, rechargeable, project);
            int totalPages = (int) Math.ceil((double) totalRows / size);
            
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("data", result);
            response.put("totalRows", totalRows);
            response.put("totalPages", Math.max(1, totalPages));
            
            return ResponseEntity.ok(response);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", "Query was interrupted: " + e.getMessage()));
        } catch (Exception e) {
            log.error("BigQuery JSON fetch failed", e);
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", "Query failed: " + e.getMessage()));
        }
    }

    // ── POST /data — run custom SQL ───────────────────────────────

    @PostMapping("/data")
    public String runCustomSql(@RequestParam(name = "customSql", required = false) String customSql,
                               Model model) {
        addConnectionInfo(model);
        if (customSql == null || customSql.isBlank()) {
            model.addAttribute("errorMessage", "Please enter a SQL query.");
            return "index";
        }
        try {
            QueryResult result = service.runQuery(customSql.trim());
            model.addAttribute("queryResult", result);
            model.addAttribute("customSql", customSql.trim());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            model.addAttribute("errorMessage", "Query was interrupted: " + e.getMessage());
            model.addAttribute("customSql", customSql);
        } catch (Exception e) {
            log.error("Custom SQL failed", e);
            model.addAttribute("errorMessage", "Query failed: " + e.getMessage());
            model.addAttribute("customSql", customSql);
        }
        return "index";
    }

    // ── helpers ───────────────────────────────────────────────────

    private void addConnectionInfo(Model model) {
        model.addAttribute("projectId", props.getProjectId());
        model.addAttribute("datasetId", props.getDatasetId());
        model.addAttribute("tableId",   props.getTableId());
    }
}
