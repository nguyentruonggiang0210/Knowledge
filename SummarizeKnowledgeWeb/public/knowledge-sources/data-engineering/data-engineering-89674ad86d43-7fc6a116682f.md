# Cấu trúc source chuẩn — GitHub Trending Analytics Platform

Monorepo, tách rõ từng service theo trách nhiệm. Mỗi thư mục top-level tương ứng
1 công nghệ trong stack, có thể build/run độc lập (docker-compose điều phối chung).

```
github-trending-platform/
│
├── docker-compose.yml              # điều phối toàn bộ service: postgres, fastapi, prometheus, grafana, angular
├── .env.example                    # biến môi trường mẫu (DB_URL, API_PORT, ...)
├── README.md
│
├── data/
│   ├── raw/
│   │   └── github_trending.csv     # file CSV gốc 10M record, KHÔNG commit lên git (.gitignore)
│   └── processed/                  # output Parquet sau khi Spark xử lý (partition theo date)
│       └── year=2026/month=07/...
│
├── etl-spark/                      # ==== PHASE 1: PySpark ====
│   ├── requirements.txt            # pyspark, psycopg2-binary, py4j...
│   ├── config/
│   │   └── spark_config.py         # cấu hình SparkSession, JDBC connection string tới Postgres
│   ├── jobs/
│   │   ├── clean_data.py           # đọc CSV, dedup, validate, xử lý null
│   │   ├── transform_trending.py   # tính top trending theo category/ngày (window function RANK)
│   │   ├── transform_growth.py     # tính growth rate theo repo (LAG/LEAD window function)
│   │   ├── transform_language.py   # tổng hợp star theo language theo tháng
│   │   └── load_to_postgres.py     # ghi kết quả xuống Postgres qua JDBC, batch write
│   ├── utils/
│   │   ├── schema.py               # định nghĩa StructType schema cho CSV (tránh Spark tự infer sai kiểu)
│   │   └── metrics_pushgateway.py  # đẩy custom metrics (số row xử lý, thời gian job) lên Prometheus Pushgateway
│   ├── tests/
│   │   └── test_transform.py       # unit test transform logic bằng pytest + chispa/spark local session
│   └── run_pipeline.py             # entrypoint: chạy tuần tự clean -> transform -> load
│
├── db/                             # ==== PHASE 2: PostgreSQL ====
│   ├── migrations/                 # dùng Alembic để version hóa schema
│   │   ├── 001_create_organizations.sql
│   │   ├── 002_create_repositories.sql
│   │   ├── 003_create_repo_daily_stats_partitioned.sql   # bảng lớn, partition theo tháng
│   │   └── 004_create_indexes.sql
│   ├── seeds/
│   │   └── sample_seed.sql         # data mẫu nhỏ để dev/test không cần chạy full Spark job
│   └── queries/                    # các query phân tích phức tạp, lưu lại để tái sử dụng/test
│       ├── top_trending_by_category.sql
│       ├── growth_rate_window.sql
│       └── language_popularity.sql
│
├── backend-api/                    # ==== PHASE 3: FastAPI ====
│   ├── requirements.txt            # fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, prometheus-fastapi-instrumentator
│   ├── app/
│   │   ├── main.py                 # entrypoint FastAPI, mount router + Prometheus instrumentator
│   │   ├── core/
│   │   │   ├── config.py           # đọc biến môi trường (Pydantic Settings)
│   │   │   └── database.py         # async engine + session SQLAlchemy
│   │   ├── models/                 # SQLAlchemy ORM models (map đúng schema trong db/migrations)
│   │   │   ├── organization.py
│   │   │   ├── repository.py
│   │   │   └── repo_daily_stat.py
│   │   ├── schemas/                # Pydantic request/response schema
│   │   │   ├── repo_schema.py
│   │   │   └── language_schema.py
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── routes_repos.py         # GET /repos/trending, /repos/{id}/growth
│   │   │       ├── routes_languages.py     # GET /languages/stats
│   │   │       └── routes_organizations.py # GET /organizations/{id}/summary
│   │   ├── services/                # business logic tách khỏi route (dễ test, dễ cache)
│   │   │   ├── repo_service.py
│   │   │   └── cache_service.py     # in-memory hoặc Redis cache cho query nặng
│   │   └── middlewares/
│   │       ├── rate_limit.py
│   │       └── metrics.py           # custom Prometheus metrics (request count, latency histogram)
│   └── tests/
│       └── test_routes_repos.py     # pytest + httpx AsyncClient
│
├── monitoring/                     # ==== PHASE 4: Prometheus + Grafana ====
│   ├── prometheus/
│   │   ├── prometheus.yml          # cấu hình scrape target: fastapi:8000/metrics, pushgateway:9091
│   │   └── alert_rules.yml         # rule: latency p95 > 500ms, error rate > 5%
│   └── grafana/
│       ├── provisioning/
│       │   ├── datasources/
│       │   │   └── prometheus.yml  # tự động add Prometheus làm datasource khi container khởi động
│       │   └── dashboards/
│       │       └── dashboard.yml
│       └── dashboards/
│           └── api_overview.json   # dashboard JSON: request rate, latency percentile, error rate
│
├── frontend-angular/               # ==== PHASE 5: Angular ====
│   ├── angular.json
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── app.module.ts
│       │   ├── app-routing.module.ts       # lazy load các feature module
│       │   ├── core/
│       │   │   ├── services/
│       │   │   │   └── api.service.ts      # gọi FastAPI qua HttpClient
│       │   │   └── interceptors/
│       │   │       └── error.interceptor.ts
│       │   ├── shared/
│       │   │   └── components/
│       │   │       └── loading-spinner/
│       │   └── features/
│       │       ├── trending/               # lazy-loaded module
│       │       │   ├── trending.module.ts
│       │       │   ├── trending-routing.module.ts
│       │       │   ├── pages/
│       │       │   │   └── trending-list/       # trang top trending repos + filter
│       │       │   └── services/
│       │       │       └── trending.service.ts  # dùng RxJS switchMap/debounceTime cho filter
│       │       ├── repo-detail/            # lazy-loaded module
│       │       │   └── pages/
│       │       │       └── repo-growth-chart/   # chart growth star theo thời gian (ngx-charts)
│       │       └── language-stats/         # lazy-loaded module
│       │           └── pages/
│       │               └── language-comparison/ # biểu đồ so sánh ngôn ngữ
│       └── environments/
│           ├── environment.ts
│           └── environment.prod.ts
│
└── docs/
    ├── architecture.md             # sơ đồ kiến trúc tổng thể
    └── self-check-answers.md       # nơi ghi câu trả lời cho các câu hỏi tự kiểm tra ở mỗi phase
```

## Nhiệm vụ từng phần (tóm tắt nhanh)

| Thư mục | Vai trò | Chạy độc lập bằng |
|---|---|---|
| `etl-spark/` | Đọc CSV 10M dòng, clean, transform, ghi kết quả xuống Postgres | `spark-submit run_pipeline.py` |
| `db/` | Schema, migration, partitioning, các query phân tích | Alembic + `psql` |
| `backend-api/` | API async phục vụ frontend, expose `/metrics` cho Prometheus | `uvicorn app.main:app` |
| `monitoring/` | Scrape metrics, alert, dashboard trực quan | `docker-compose up prometheus grafana` |
| `frontend-angular/` | Giao diện hiển thị dữ liệu, gọi API | `ng serve` |
| `docs/` | Tài liệu kiến trúc + câu trả lời tự học | — |

## Thứ tự dựng source đề xuất

1. `db/migrations` → tạo schema trước (mọi thứ phụ thuộc vào đây)
2. `etl-spark/` → chạy thử với 1 phần nhỏ CSV (sample vài chục nghìn dòng) để debug transform logic trước khi chạy full 10M
3. `backend-api/` → viết route trước bằng data seed nhỏ trong `db/seeds/`, chưa cần chờ Spark job chạy xong
4. `monitoring/` → gắn vào sau khi API đã chạy ổn định, có traffic thật để xem metrics có ý nghĩa
5. `frontend-angular/` → làm cuối cùng, khi API đã có contract (schema request/response) ổn định

## Lưu ý khi setup docker-compose.yml

Các service cần khai báo trong `docker-compose.yml` ở root:
```yaml
services:
  postgres:      # port 5432
  fastapi:       # port 8000, depends_on postgres
  prometheus:    # port 9090, scrape fastapi:8000/metrics
  grafana:       # port 3000, datasource = prometheus:9090
  angular:       # port 4200 (dev) hoặc build ra static serve qua nginx cho prod
  # etl-spark KHÔNG chạy thường trực — chạy on-demand hoặc qua cron/Airflow riêng
```

`etl-spark` không nên là 1 service chạy 24/7 trong compose — nó là batch job, chạy xong thì thoát. Nếu muốn tự động hóa lịch chạy lại, đây chính là lúc quay lại dùng **Airflow** để orchestrate job này định kỳ.
