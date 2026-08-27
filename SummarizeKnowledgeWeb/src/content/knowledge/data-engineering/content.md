Chủ đề này dùng `DataEngineerTutorial` như một capstone cụ thể và nhập các nguyên lý liên quan từ `AIEngineer` vào đúng lớp kiến trúc. Bài toán mục tiêu là xử lý dữ liệu GitHub Trending quy mô khoảng 10 triệu dòng rồi phục vụ phân tích qua API và dashboard.

## Kiến trúc mục tiêu và luồng dữ liệu

```text
CSV lớn
  ↓
PySpark ETL ── JDBC batch ──▶ PostgreSQL partitioned
  │                                  ↓ async SQL
  │ metrics                    FastAPI REST API
  ↓                                  ↓ HTTP
Pushgateway → Prometheus → Grafana   Angular dashboard
```

Mỗi phần có trách nhiệm riêng:

- Spark là batch job on-demand: parse, clean, transform và load.
- PostgreSQL là nguồn phục vụ query đã chuẩn hóa và đánh index.
- FastAPI giữ API contract, validation, pagination, cache và rate limit.
- Prometheus/Grafana quan sát kỹ thuật; Pushgateway nhận metric từ batch job ngắn hạn.
- Angular hiển thị trending, growth và thống kê ngôn ngữ.

Về thiết kế, Docker Compose điều phối service dài hạn; ETL không nên bị biến thành process chạy 24/7. Nếu cần lịch định kỳ, dùng scheduler/orchestrator như Airflow. Compose hiện có trong source vẫn là scaffold chưa chạy trọn luồng: thiếu service Pushgateway dù Prometheus có cấu hình scrape nó, và service Angular trỏ tới một folder chưa có Dockerfile.

## PySpark ETL và chất lượng dữ liệu

Code hiện tại định nghĩa một pipeline Extract–Transform–Load dự kiến như sau:

1. Đọc CSV bằng schema `StructType` rõ ràng thay vì infer kiểu trên dữ liệu lớn.
2. Chuẩn hóa ngày/kiểu và fill một số giá trị thiếu.
3. Deduplicate, đồng thời filter row thiếu `repo_id` hoặc `recorded_at`.
4. Tạo ba output `repo_trending_daily`, `repo_growth` và `language_monthly_stats`.
5. Thử ghi output qua JDBC theo batch và phát metric job.

Đây là ý định nhìn thấy trong code, chưa phải luồng chạy được với dataset local hiện có. CSV 10 triệu record dùng header `org_name,repo_name,repo_url,description,language,star,forks,daily_star,date,trending_category`, trong khi Spark schema khai báo chín field khác tên/thứ tự, bắt đầu bằng `repo_id` kiểu số. Vì Spark áp schema theo vị trí, `org_name` có thể bị parse thành `repo_id = null` rồi bị cleaning loại hết. `clean_data.py` cũng chưa kiểm tra star/fork âm. Cần chốt một data contract, map field tường minh, thêm quarantine/reject reason và test sample trước khi chạy full dataset.

Các transform chính dùng:

| Bài toán | Kỹ thuật Spark |
|---|---|
| Top repo theo category/ngày | Window + `rank()` |
| Star tăng theo ngày | Window + `lag()` |
| Thống kê language/tháng | `groupBy` + aggregate |
| Làm sạch | filter, fill, dedup và chuẩn hóa schema |

Data quality nên có rule, số dòng bị loại và vùng quarantine; không nên âm thầm sửa mọi giá trị bất thường thành mặc định.

## Spark execution và tối ưu

Spark DataFrame được chia thành partition. Driver lập kế hoạch; executor xử lý partition. Transformation như `filter`, `join`, `groupBy` chỉ dựng DAG do lazy evaluation; action như `count` hoặc `save` mới kích hoạt tính toán.

Những quyết định cần benchmark:

- `cache()` hợp lý khi dataframe đã clean được dùng lại cho nhiều transform; cache dữ liệu dùng một lần chỉ tốn RAM.
- `repartition()` có thể tăng/giảm partition và thường gây shuffle; dùng khi cần phân phối lại dữ liệu.
- `coalesce()` chủ yếu giảm partition với ít shuffle hơn; phù hợp trước khi ghi ít file hơn.
- `groupBy`, window và join có thể shuffle lớn; cần xem cardinality, skew, partition key và Spark UI.
- Broadcast join phù hợp khi một phía đủ nhỏ, ví dụ bảng mapping language → category.
- Parquet partition theo `year/month` giúp pruning; quá nhiều partition nhỏ lại gây overhead file metadata.

Không có một con số partition/cache tối ưu cho mọi cluster; phải đo stage, shuffle, spill, task skew và thời gian end-to-end.

## EDA và feature engineering theo thời điểm

EDA bắt đầu từ việc xác định **đơn vị quan sát** và ý nghĩa của từng dòng, rồi mới chọn biểu đồ. Với mỗi cột cần kiểm tra kiểu dữ liệu, miền/range hợp lệ, tỷ lệ và pattern missing, phân phối, outlier, cardinality và quan hệ với target. Một điểm cực trị có thể là tín hiệu thật hoặc lỗi thu thập; không nên tự động xóa trước khi truy ngược contract và nguồn sinh dữ liệu.

Feature hữu ích thường đến từ vài họ phổ biến: count, ratio, bucket, recency, rolling-window, encoding và interaction. Ví dụ RFM cho repository có thể dùng số ngày từ lần trending gần nhất (**recency**), số ngày xuất hiện trong cửa sổ (**frequency**) và tổng `daily_star` (**monetary/value proxy**). Tên feature phải kèm cửa sổ và đơn vị, chẳng hạn `stars_7d_at_cutoff`, để semantics không bị ẩn.

Mọi feature dự đoán phải có **observation cutoff**. Khi tạo một mẫu tại thời điểm `t`, chỉ event có timestamp `<= t` được phép đóng góp; giao dịch hoặc tín hiệu sau `t` là future leakage dù job batch nhìn thấy chúng. Imputation, vocabulary/encoding, scaling và feature selection cũng chỉ được `fit` trên tập train rồi áp sang validation/test. One-hot hợp lý cho categorical cardinality thấp; hashing hoặc embedding phù hợp hơn khi cardinality cao nhưng phải chấp nhận collision hoặc chi phí học. ID ngẫu nhiên không nên được dùng như một tín hiệu chỉ vì model có thể ghi nhớ nó.

Cùng một định nghĩa feature phải chạy ở offline training và online inference để tránh train-serving skew. Lưu version, lineage, cutoff và input contract cùng feature. Kiểm chứng bằng parity/property test: cùng một history phải cho kết quả tương đương giữa batch và xử lý từng event; thêm event ở tương lai không được làm thay đổi feature tại cutoff; boundary đúng tại `t` phải được test tường minh.

## PostgreSQL: schema, partition và query

Schema mục tiêu tách ba thực thể:

- `organizations`: tổ chức GitHub.
- `repositories`: repo và FK tới organization.
- `repo_daily_stats`: fact table lớn theo repo và thời gian.

Fact table được range-partition theo tháng để database có thể bỏ qua partition ngoài khoảng ngày. Index phải phục vụ query thật: repo + thời gian cho growth, ngày/category cho trending, language cho filter. Index tăng tốc đọc nhưng làm insert, storage và maintenance đắt hơn.

Các query mẫu dùng `RANK() OVER (...)` cho top trending và `LAG()` cho delta/growth. Luôn kiểm tra bằng `EXPLAIN ANALYZE`: partition pruning, index scan, số row ước lượng và số row thực tế quan trọng hơn việc “đã tạo index”.

## FastAPI và ranh giới dịch vụ

API mục tiêu gồm trending repo, growth theo repo, language stats và organization summary. Thiết kế đề xuất:

- SQLAlchemy async + `asyncpg` để không chặn event loop trong lúc chờ database.
- Pydantic cho request/response contract và validation.
- Pagination thực hiện ở database, không tải 500 nghìn row rồi cắt trong application.
- Service layer tách query/business logic khỏi route để dễ test và cache.
- Cache query nặng có TTL cùng chiến lược invalidation khi ETL nạp dữ liệu mới.
- Middleware rate limit và metric bảo vệ/quan sát API.

Async cải thiện concurrency cho I/O wait; nó không làm query SQL chậm trở nên nhanh. Vẫn cần query plan, connection pool, timeout và giới hạn kết quả.

## Prometheus, Grafana và metric đúng nghĩa

FastAPI expose request count và latency histogram theo endpoint/status. Trong kiến trúc mục tiêu, Prometheus scrape service theo pull model; Spark là job kết thúc nhanh nên push metric qua Pushgateway. Dashboard mẫu theo dõi:

- request rate theo endpoint;
- p50/p95/p99 latency;
- error-rate 5xx;
- ETL rows processed và job duration.

Alert mẫu dùng p95 > 500 ms hoặc error rate > 5% trong một cửa sổ thời gian. Ngưỡng chỉ có ý nghĩa khi gắn với SLO và có runbook. Histogram phù hợp để tổng hợp quantile giữa instance; Summary thường khó aggregate đúng trên nhiều process.

Business metric và system metric nên tách tên/nhãn. Tránh label cardinality cao như raw URL, repo ID hoặc error message tự do.

## Dashboard Angular và trải nghiệm bất đồng bộ

Frontend được tổ chức theo feature module: trending list, repo growth chart và language comparison. `HttpClient` gọi API; `debounceTime` tránh request ở mỗi phím gõ; `switchMap` hủy subscription của query cũ khi filter mới xuất hiện, giảm race khiến kết quả cũ ghi đè kết quả mới.

Lazy loading giảm bundle khởi tạo cho route chưa dùng. Service giữ state nhỏ là đủ cho ứng dụng này; loading, empty và error state phải được hiển thị rõ. Chart chỉ nên nhận dữ liệu đã được aggregate/paginate, không phải hàng triệu fact row.

## Thứ tự triển khai và kiểm chứng

Thứ tự hợp lý theo dependency:

1. Chạy migration và seed PostgreSQL.
2. Test Spark transform trên sample nhỏ, sau đó mới benchmark dữ liệu lớn.
3. Hoàn thiện query/service API trên seed có kiểm soát.
4. Gắn metric, dashboard và alert khi API đã sinh traffic.
5. Xây frontend sau khi request/response schema ổn định.
6. Chạy test tích hợp và failure drill: DB chậm, ETL fail giữa chừng, cache stale, API overload.

Checklist chất lượng:

- [ ] ETL idempotent hoặc có chiến lược chống ghi trùng.
- [ ] Có row-count/data-quality metric trước và sau cleaning.
- [ ] Query quan trọng có `EXPLAIN ANALYZE` và dữ liệu đại diện.
- [ ] API có timeout, pagination, pool limit và structured error.
- [ ] Alert có owner, ngưỡng theo SLO và cách xử lý.

## Hợp nhất nguồn và khoảng trống hiện tại

- `github-trending-analytics.md` mô tả yêu cầu năm phase; `project-structure.md`, project `README.md` và `docs/architecture.md` lặp cùng kiến trúc nên được gom vào bài này.
- `etl-spark/etl-spark-explain.md` và code trong `etl-spark/jobs` là nguồn chính cho Spark internals và transform cụ thể.
- Các lesson 09, 10 và 15 của `AIEngineer` lần lượt bổ sung data quality/lineage, EDA cùng feature engineering theo observation cutoff, và API/concurrency; chúng được nhập vào đúng lớp kiến trúc thay vì tạo bản sao riêng.
- Workspace local có file ignored `data/raw/github_trending_10m.csv` khoảng 1,87 GB với đúng 10.000.000 record; file không được Git track. Sự tồn tại của dataset không chứng minh pipeline chạy được: header hiện không tương thích Spark schema và chưa có benchmark end-to-end được lưu.
- `backend-api/app/services/repo_service.py` ghi rõ là skeleton: bốn hàm query còn `TODO` và `raise NotImplementedError`. API chưa hoàn thiện luồng đọc Postgres.
- ETL và migration hiện **chưa khớp contract**: ngoài mismatch CSV ↔ Spark schema, job ghi ba bảng aggregate trong khi migration tạo `organizations`, `repositories`, `repo_daily_stats`; chưa có flow nạp base entity/fact partitioned. Default `--csv` còn trỏ nhầm tới một file Python thay vì dataset CSV. Cần thống nhất schema/loader rồi mới gọi là end-to-end.
- Stack monitoring/deploy cũng chưa khép kín: Compose thiếu Pushgateway và frontend Angular chưa có Dockerfile dù được khai báo `build`.
- `docs/self-check-answers.md` vẫn là placeholder. Vì vậy project hiện là giáo trình + scaffold thực hành, không nên mô tả như hệ thống end-to-end đã hoàn tất hoặc production-ready.
