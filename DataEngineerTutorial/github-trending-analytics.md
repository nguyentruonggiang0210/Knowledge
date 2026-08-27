# Đề bài: GitHub Trending Analytics Platform

## Bối cảnh

Bạn có 1 file CSV ~10 triệu record (~1.5GB) chứa dữ liệu GitHub trending repos theo thời gian, với các cột:
```
org_name, repo_name, repo_url, description, language, star, forks, daily_star, date, trending_category
```

Nhiệm vụ: xây dựng một hệ thống end-to-end xử lý dữ liệu này, lưu trữ, phục vụ qua API, và giám sát real-time — sử dụng đầy đủ 6 công nghệ: **PySpark, PostgreSQL, FastAPI, Prometheus, Grafana, Angular**.

---

## Kiến trúc tổng quan

```
CSV (10M rows, 1.5GB)
     │
     ▼
[PySpark ETL Job] ──► [PostgreSQL] ◄──► [FastAPI]
     │                                      │
     ▼                                      ▼
 (metrics export)                    [Prometheus] ──► [Grafana]
                                              │
                                              ▼
                                         [Angular Dashboard]
```

---

## Phase 1 — PySpark: Xử lý & làm sạch dữ liệu

**Yêu cầu bắt buộc:**
1. Đọc file CSV 1.5GB bằng Spark (không dùng pandas — bắt buộc trải nghiệm distributed processing)
2. Data cleaning:
   - Xử lý missing value ở `description`, `language` (một số repo không có mô tả)
   - Chuẩn hóa `date` về đúng kiểu `DateType`
   - Loại bỏ duplicate records (`org_name` + `repo_name` + `date` trùng nhau)
   - Validate `star`, `forks`, `daily_star` phải >= 0, loại bỏ dòng lỗi
3. Transformation — tạo các bảng tổng hợp (aggregation):
   - **Top trending repos theo ngày** (rank theo `daily_star` trong từng `trending_category`)
   - **Growth rate**: tốc độ tăng star theo thời gian cho từng repo (window function)
   - **Language popularity theo thời gian**: tổng star theo `language` theo từng tháng
   - **Organization ranking**: tổng hợp theo `org_name` — tổng repo, tổng star, top language
4. Tối ưu hiệu năng (bắt buộc để hiểu sâu Spark):
   - Dùng `repartition`/`coalesce` hợp lý trước khi ghi output
   - So sánh thời gian chạy khi dùng `cache()`/`persist()` vs không dùng
   - Viết dữ liệu output ra Parquet, partition theo `date` (hoặc `year`/`month`)
   - Đo và giải thích Spark UI: shuffle, stage, DAG của job

**Output:** ghi kết quả đã transform vào PostgreSQL (dùng JDBC connector của Spark) theo batch, không insert từng dòng.

**Câu hỏi tự kiểm tra kiến thức (bắt buộc trả lời trong báo cáo):**
- Sự khác biệt giữa `repartition` và `coalesce`, khi nào dùng cái nào?
- Vì sao `groupBy` + `agg` có thể gây shuffle nặng với 10M row, cách giảm thiểu?
- Broadcast join là gì, áp dụng được ở đâu trong bài này? (gợi ý: join với bảng nhỏ mapping ngôn ngữ → category)

---

## Phase 2 — PostgreSQL: Thiết kế schema

**Yêu cầu:**
1. Thiết kế schema chuẩn hóa (không để 1 bảng phẳng):
   - `organizations` (org_id, org_name)
   - `repositories` (repo_id, org_id FK, repo_name, repo_url, language, description)
   - `repo_daily_stats` (repo_id FK, date, star, forks, daily_star, trending_category) — bảng lớn nhất, ~10M row
2. Index hợp lý:
   - Composite index trên `(repo_id, date)` cho `repo_daily_stats`
   - Index trên `language`, `trending_category` để phục vụ filter nhanh cho API
3. Partitioning bảng `repo_daily_stats` theo tháng (Postgres native table partitioning) — bắt buộc vì dữ liệu lớn
4. Viết ít nhất 3 câu query phân tích phức tạp dùng window function (`RANK() OVER`, `LAG()` để tính growth rate)

**Câu hỏi tự kiểm tra:**
- Tại sao partition theo tháng giúp query nhanh hơn full table scan?
- `EXPLAIN ANALYZE` một query filter theo `date` — index có được dùng không (Index Scan vs Seq Scan)?

---

## Phase 3 — FastAPI: Backend API

**Yêu cầu endpoint tối thiểu:**
```
GET /repos/trending?category={cat}&date={date}&limit=20
GET /repos/{repo_id}/growth        # trả về daily_star theo thời gian
GET /languages/stats?from={date}&to={date}
GET /organizations/{org_id}/summary
```

**Yêu cầu kỹ thuật bắt buộc:**
1. Dùng `SQLAlchemy` (async, `asyncpg`) — không dùng blocking DB call
2. Pydantic schema validate input/output rõ ràng
3. Pagination cho các endpoint trả list lớn
4. Caching layer đơn giản (in-memory hoặc Redis) cho query nặng hay lặp lại
5. Rate limiting cơ bản (middleware)
6. **Expose metrics cho Prometheus** — dùng `prometheus-fastapi-instrumentator` hoặc tự viết middleware đo:
   - Request count theo endpoint
   - Latency (histogram) theo endpoint
   - Số lỗi 4xx/5xx

**Câu hỏi tự kiểm tra:**
- Async vs sync DB driver ảnh hưởng thế nào tới throughput khi có nhiều concurrent request?
- Nếu 1 query trả về 500k row, xử lý pagination ở DB level hay application level, vì sao?

---

## Phase 4 — Prometheus + Grafana: Monitoring

**Yêu cầu:**
1. Prometheus scrape metrics từ FastAPI (`/metrics` endpoint)
2. Cấu hình alert rule cơ bản (ví dụ: latency p95 > 500ms trong 5 phút → alert)
3. Grafana dashboard tối thiểu 3 panel:
   - Request rate theo endpoint (rate `http_requests_total`)
   - Latency percentile (p50, p95, p99)
   - Error rate (%)
4. Bonus: thêm metrics custom từ business logic — ví dụ số lượng repo mới được insert mỗi lần chạy PySpark job (dùng `Pushgateway` vì Spark job không phải long-running service)

**Câu hỏi tự kiểm tra:**
- Vì sao Prometheus dùng pull model thay vì push, và khi nào cần Pushgateway (case của Spark batch job)?
- Histogram vs Summary trong Prometheus khác nhau thế nào, khi nào dùng cái nào?

---

## Phase 5 — Angular: Dashboard Frontend

**Yêu cầu:**
1. Trang chủ: bảng top trending repos (filter theo `category`, `date`, `language`)
2. Trang chi tiết repo: chart hiển thị growth star theo thời gian (dùng `ngx-charts` hoặc `Chart.js`)
3. Trang thống kê ngôn ngữ: biểu đồ so sánh popularity các ngôn ngữ theo thời gian
4. Kỹ thuật bắt buộc:
   - Dùng `HttpClient` + RxJS (`switchMap`, `debounceTime` cho search/filter input)
   - Lazy loading module
   - State management đơn giản (service + BehaviorSubject, không cần NgRx nếu app nhỏ)
   - Loading state / error handling khi gọi API

**Câu hỏi tự kiểm tra:**
- Vì sao dùng `debounceTime` + `switchMap` cho search input thay vì gọi API mỗi lần user gõ?
- Lazy loading giúp gì cho performance ứng dụng?

---

## Tiêu chí đánh giá (tự chấm)

| Tiêu chí | Trọng số |
|---|---|
| PySpark: xử lý đúng, tối ưu partition/cache, giải thích được Spark UI | 25% |
| PostgreSQL: schema chuẩn hóa, index/partition hợp lý, query hiệu quả | 20% |
| FastAPI: async đúng cách, có metrics, có caching | 20% |
| Prometheus/Grafana: dashboard rõ ràng, alert hoạt động | 15% |
| Angular: UI hoạt động mượt, xử lý async đúng chuẩn RxJS | 15% |
| Trả lời được các câu hỏi tự kiểm tra ở mỗi phase | 5% |

## Gợi ý timeline (nếu làm song song học + thực hành)

- **Tuần 1:** PySpark ETL + PostgreSQL schema
- **Tuần 2:** FastAPI backend + tích hợp Prometheus
- **Tuần 3:** Grafana dashboard + Angular frontend
- **Tuần 4:** Tối ưu hiệu năng toàn hệ thống, viết báo cáo trả lời các câu hỏi tự kiểm tra
