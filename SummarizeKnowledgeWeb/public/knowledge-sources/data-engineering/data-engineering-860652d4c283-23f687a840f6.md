# Giải thích module `etl-spark`

## 1. `etl-spark` làm nhiệm vụ gì?

Nó là **module ETL** (Extract – Transform – Load) của dự án. Nhiệm vụ: đọc dữ liệu thô GitHub Trending dạng CSV (có thể ~10 triệu dòng), **làm sạch → biến đổi/tính toán → ghi kết quả xuống PostgreSQL**, đồng thời đẩy metrics lên monitoring. Nó là "cỗ máy xử lý dữ liệu nặng" đứng ở đầu chuỗi:

```
CSV → etl-spark (PySpark) → PostgreSQL → backend FastAPI → frontend Angular
                │
                └─ push metrics → Pushgateway → Prometheus → Grafana
```

> **ETL là gì?** Đây là quy trình chuẩn trong Data Engineering:
> - **Extract**: lấy dữ liệu thô từ nguồn (ở đây là file CSV).
> - **Transform**: làm sạch + tính toán, biến dữ liệu thô thành dữ liệu có giá trị (xếp hạng, tốc độ tăng trưởng, thống kê...).
> - **Load**: ghi dữ liệu đã xử lý vào nơi lưu trữ để phục vụ truy vấn (PostgreSQL).

### Cấu trúc thư mục
- `config/spark_config.py` – tạo `SparkSession` (điểm khởi đầu mọi job Spark) + thông tin kết nối JDBC tới Postgres.
- `utils/schema.py` – định nghĩa **schema cứng** cho CSV (kiểu dữ liệu từng cột) để Spark không tự đoán sai.
- `utils/metrics_pushgateway.py` – đẩy metric (số dòng xử lý, thời gian chạy) lên Prometheus Pushgateway.
- `jobs/clean_data.py` – bước Transform 1: dedup, lọc null, điền giá trị mặc định.
- `jobs/transform_trending.py` – xếp hạng top repo theo (category, ngày) bằng `RANK`.
- `jobs/transform_growth.py` – tính tăng trưởng star ngày-qua-ngày bằng `LAG`.
- `jobs/transform_language.py` – tổng hợp star theo (ngôn ngữ, tháng).
- `jobs/load_to_postgres.py` – ghi kết quả xuống Postgres qua JDBC.
- `run_pipeline.py` – entrypoint, chạy tuần tự clean → 3 transform → load.
- `tests/test_transform.py` – unit test logic transform bằng pytest + Spark local.

### Luồng chạy (đọc `run_pipeline.py`)
1. `get_spark()` → tạo SparkSession.
2. `clean_data.clean(...).cache()` → làm sạch, giữ trong bộ nhớ để tái dùng.
3. Chạy 3 transform độc lập trên cùng dataframe đã clean:
   - `transform_trending` → bảng `repo_trending_daily`
   - `transform_growth` → bảng `repo_growth`
   - `transform_language` → bảng `language_monthly_stats`
4. `push_job_metrics(...)` → bắn metrics, rồi `spark.stop()`.

Cách chạy:
```bash
spark-submit run_pipeline.py --csv data/raw/github_trending.csv
```

---

## 2. Spark hoạt động thế nào? (kèm định nghĩa khái niệm mới)

**Apache Spark** là engine xử lý dữ liệu lớn theo kiểu **phân tán** (distributed) — chia dữ liệu ra nhiều máy/nhiều core rồi xử lý song song, nên xử lý được lượng dữ liệu quá lớn so với 1 máy đơn. **PySpark** chỉ là API Python của Spark.

### Các khái niệm cốt lõi
- **SparkSession**: cửa ngõ vào Spark, cầm nó là dùng được mọi thứ (đọc file, tạo DataFrame...). Xem `config/spark_config.py`. `local[1]` trong test nghĩa là chạy Spark trên 1 máy, 1 luồng (chế độ local để test).
- **DataFrame**: bảng dữ liệu 2 chiều (hàng × cột) có schema, giống bảng SQL/pandas nhưng được chia nhỏ và xử lý phân tán. Đây là kiểu dữ liệu trung tâm của toàn bộ code này.
- **Partition (phân mảnh)**: một DataFrame lớn được cắt thành nhiều mảnh nhỏ, mỗi mảnh xử lý trên 1 core/máy → đó là cách Spark chạy song song.
- **Driver & Executor**: **Driver** là tiến trình "chỉ huy" (chạy code Python của bạn, lập kế hoạch); **Executor** là các "công nhân" thực thi tính toán trên từng partition.

### Điểm quan trọng nhất: Lazy Evaluation (tính toán lười)
Spark chia thao tác thành 2 loại:
- **Transformation** (biến đổi): `filter`, `withColumn`, `groupBy`, `dropDuplicates`, `join`... → **KHÔNG chạy ngay**. Spark chỉ ghi lại "kế hoạch" (gọi là DAG — sơ đồ các bước phụ thuộc nhau).
- **Action** (hành động): `count`, `collect`, `save`, `show`... → **kích hoạt** Spark thực sự chạy toàn bộ kế hoạch đã tích lũy.

Ví dụ trong code này: các `clean/transform` chỉ dựng kế hoạch; đến `cleaned.count()` và `.save()` trong `load_to_postgres` mới thật sự xử lý. Nhờ lười, Spark **tối ưu toàn bộ chuỗi trước khi chạy** (bỏ bước thừa, gộp bước, đẩy filter lên sớm...).

> **cache()**: sau khi clean xong, dataframe được giữ trong RAM. Vì 3 transform + `count()` đều dùng lại `cleaned`, nếu không cache thì Spark sẽ đọc & clean lại CSV **4 lần**. Cache = tính 1 lần, tái dùng nhiều lần.

### Window Function (hàm cửa sổ) — dùng nhiều trong code này
Là hàm tính toán trên **một nhóm hàng liên quan** mà **vẫn giữ nguyên từng hàng** (khác `groupBy` gộp lại thành 1 dòng/nhóm). Một window gồm: `partitionBy` (chia nhóm) + `orderBy` (sắp thứ tự trong nhóm).
- `transform_trending.py`: `RANK` xếp hạng repo theo star trong từng (category, ngày), rồi giữ top 25.
- `transform_growth.py`: `LAG("stars")` lấy giá trị star của **hàng trước đó** (ngày hôm trước) trong cùng repo → tính `star_delta` và `growth_rate`.

### JDBC (trong bước Load)
**JDBC** = chuẩn giao tiếp Java để nói chuyện với database qua driver. Spark chạy trên nền JVM nên ghi xuống Postgres qua driver `org.postgresql` (`config/spark_config.py`). `batchsize=10000` = gộp 10.000 dòng ghi 1 lần cho nhanh, thay vì ghi từng dòng.

---

## 3. Tóm tắt nhanh từng file `jobs/`

| File | Kỹ thuật Spark | Kết quả |
|------|----------------|---------|
| `clean_data.py` | `dropDuplicates`, `filter`, `fillna`, `coalesce` | DataFrame sạch (bỏ trùng, bỏ null, điền mặc định) |
| `transform_trending.py` | Window + `rank()` | Top 25 repo theo (category, ngày) |
| `transform_growth.py` | Window + `lag()` | Tăng trưởng star ngày-qua-ngày |
| `transform_language.py` | `groupBy` + `sum`/`countDistinct` | Tổng star & số repo theo (ngôn ngữ, tháng) |
| `load_to_postgres.py` | `write.format("jdbc")` | Ghi kết quả xuống bảng Postgres |
