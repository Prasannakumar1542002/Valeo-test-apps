# BigQuery Spring Boot POC

A Spring Boot application that queries **Google Cloud BigQuery** and renders
results in a Thymeleaf web page — no external Tomcat install required.

---

## Project structure

```
bigquery-springboot/
├── pom.xml
└── src/main/
    ├── java/com/poc/bigquery/
    │   ├── BigQueryApplication.java          ← @SpringBootApplication entry point
    │   ├── config/
    │   │   ├── BigQueryConfig.java           ← builds BigQuery bean
    │   │   └── BigQueryProperties.java       ← typed config from application.properties
    │   ├── model/
    │   │   └── QueryResult.java              ← DTO (headers + rows + timing)
    │   ├── service/
    │   │   └── BigQueryService.java          ← query execution logic
    │   └── controller/
    │       └── BigQueryController.java       ← MVC controller (GET + POST /data)
    └── resources/
        ├── application.properties            ← all config here
        └── templates/
            └── index.html                    ← Thymeleaf template
```

---

## Quick start

### 1 — Configure

Edit `src/main/resources/application.properties`:

```properties
bigquery.project-id=my-gcp-project-123
bigquery.dataset-id=my_dataset
bigquery.table-id=my_table
```

Or set environment variables (Spring Boot auto-maps them):
```
BIGQUERY_PROJECT_ID=my-gcp-project-123
BIGQUERY_DATASET_ID=my_dataset
BIGQUERY_TABLE_ID=my_table
```

### 2 — Authenticate

**Local development (recommended):**
```bash
gcloud auth application-default login
```

**Service-account key file:**
```properties
bigquery.service-account-key-path=C:/keys/service-account.json
```

Make sure the identity has:
- `roles/bigquery.dataViewer`
- `roles/bigquery.jobUser`

### 3 — Run

```bash
mvn spring-boot:run
```

Open → http://localhost:8080/data

### 4 — Build a fat JAR (for deployment)

```bash
mvn clean package
java -jar target/bigquery-springboot-1.0-SNAPSHOT.jar
```

---

## What changed from the JSP version

| Old (JSP/Servlet)         | New (Spring Boot)                      |
|---------------------------|----------------------------------------|
| `web.xml`                 | Removed — Spring Boot auto-configures  |
| `BigQueryServlet.java`    | `BigQueryController.java` (@Controller)|
| `BigQueryConfig.java`     | `BigQueryProperties.java` + `BigQueryConfig.java` (@Bean) |
| `result.jsp` + JSTL       | `index.html` (Thymeleaf)               |
| Deploy WAR to Tomcat      | `mvn spring-boot:run` (embedded Tomcat)|
| Manual tomcat7 plugin     | `spring-boot-maven-plugin`             |

---

## Customisation tips

| Goal                    | Where                                   |
|-------------------------|-----------------------------------------|
| Change default query    | `BigQueryService.fetchTableData()`      |
| Add pagination          | Pass page/size params in controller     |
| Add column search       | POST a WHERE clause via the SQL editor  |
| REST API endpoint       | Add `@RestController` returning JSON    |
| Export CSV              | Add `/export` endpoint, `text/csv` response |
