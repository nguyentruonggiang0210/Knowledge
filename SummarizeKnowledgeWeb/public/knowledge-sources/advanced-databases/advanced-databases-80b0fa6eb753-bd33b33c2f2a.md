# 00 - Cài đặt miễn phí và làm quen dataset

## Mục tiêu

- Khởi động ClickHouse local bằng Docker Compose.
- Biết ba giao diện: native client, HTTP và file SQL init.
- Kiểm tra server, database, table, parts và logs.
- Có quy trình reset lab không nhầm với môi trường thật.

## 1. Cài bằng Docker (khuyến nghị)

Các lệnh trong bài này dùng Compose **standalone** và phải chạy tại
`LessionClickHouse`. Nếu bạn đã chạy Compose ở root repository, dừng stack đó
trước; hai stack cùng bind cổng `8123`, `9000`, `9363` và không được chạy đồng
thời.

```bash
docker compose up -d
docker compose logs -f clickhouse
```

Mở client:

```bash
docker compose exec clickhouse clickhouse-client \
  --user student --password student_pass --database ecommerce
```

Chạy smoke test trong client:

```sql
SELECT version(), timezone(), uptime();
SHOW DATABASES;
SHOW CREATE TABLE ecommerce.events;
SELECT count(), min(event_time), max(event_time) FROM ecommerce.events;
```

File `sql/00_init.sql` chỉ chạy khi ClickHouse khởi tạo volume rỗng. Nếu volume đã tồn tại, sửa init file không tự chạy lại.

## 2. Cài native miễn phí (tùy chọn)

ClickHouse Community là mã nguồn mở. Trên Linux/macOS có thể dùng package/binary chính thức; trên Windows, Docker/WSL2 dễ tái lập nhất. Khi cài native, giữ cấu hình và data directory tách khỏi dự án. Không copy cấu hình production vào laptop vì path, user và resource limit khác nhau.

Kiểm tra endpoint HTTP:

```bash
curl -u student:student_pass \
  --data-binary "SELECT formatReadableSize(sum(bytes_on_disk)) FROM system.parts WHERE active" \
  http://127.0.0.1:8123/
```

## 3. Đọc metadata trước khi đọc data

```sql
SELECT
    database,
    table,
    engine,
    sorting_key,
    partition_key,
    total_rows,
    formatReadableSize(total_bytes) AS size
FROM system.tables
WHERE database = 'ecommerce';

SELECT
    table,
    partition,
    name AS part_name,
    rows,
    marks,
    formatReadableSize(bytes_on_disk) AS disk
FROM system.parts
WHERE database = 'ecommerce' AND active
ORDER BY table, partition, name;
```

`system.tables` mô tả logical table; `system.parts` cho thấy physical parts đang hoạt động. Sau mỗi insert, ClickHouse thường tạo một part; background merge sẽ hợp nhất dần.

## 4. Tạo dữ liệu lớn để benchmark

Không chèn vào table mẫu ngay nếu muốn giữ kết quả bài học ổn định. Tạo bản benchmark:

```sql
CREATE TABLE ecommerce.events_bench AS ecommerce.events;

INSERT INTO ecommerce.events_bench
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device, properties)
SELECT
    generateUUIDv4(),
    toDateTime64('2025-01-01 00:00:00', 3, 'UTC') + toIntervalSecond(number % 7776000),
    number % 1000000,
    generateUUIDv4(),
    ['view', 'add_cart', 'purchase'][1 + number % 3],
    number % 100000,
    ['books', 'electronics', 'fashion', 'home'][1 + number % 4],
    toDecimal64(1 + number % 100000 / 100.0, 2),
    toUInt16(1 + number % 5),
    ['VN', 'TH', 'SG'][1 + number % 3],
    ['mobile', 'desktop', 'tablet'][1 + number % 3],
    map('source', ['organic', 'ads'][1 + number % 2])
FROM numbers(1000000);

SELECT count(), uniqExact(user_id), formatReadableSize(sum(bytes_on_disk))
FROM ecommerce.events_bench
CROSS JOIN
(
    SELECT bytes_on_disk
    FROM system.parts
    WHERE database = 'ecommerce' AND table = 'events_bench' AND active
);
```

Query cuối cố tình không lý tưởng vì `CROSS JOIN` nhân row; cách đúng để tách logical stats và physical stats:

```sql
SELECT count(), uniqExact(user_id) FROM ecommerce.events_bench;

SELECT formatReadableSize(sum(bytes_on_disk))
FROM system.parts
WHERE database = 'ecommerce' AND table = 'events_bench' AND active;
```

## 5. Reset an toàn

Các lệnh sau chỉ reset stack standalone khi chạy từ `LessionClickHouse`.
`-v` xóa toàn bộ dữ liệu của stack này:

```bash
docker compose down -v
docker compose up -d
```

Nếu dùng Compose ở root, không chạy lệnh trên từ thư mục này vì nó không tác
động tới stack root. Đồng thời, `docker compose down --volumes` ở root còn xóa
cả volume PostgreSQL; hãy backup và xác nhận đúng project trước khi dùng.

Nếu chỉ muốn làm sạch table benchmark:

```sql
DROP TABLE IF EXISTS ecommerce.events_bench;
```

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| `clickhouse-server` | Tiến trình lưu/truy vấn data | Container chạy được không có nghĩa volume đủ IOPS; disk chậm làm merge backlog tăng âm thầm. |
| `clickhouse-client` | Native CLI | Client/server lệch version có thể khác setting hoặc format; ghi version vào log benchmark. |
| HTTP port `8123` | Query qua HTTP | Query GET có thể lọt vào proxy/access log; không đặt secret hoặc dữ liệu nhạy cảm trong URL. |
| Native port `9000` | Native protocol | Public exposure không TLS là rủi ro; chỉ bind private network hoặc secure native port. |
| init script | Bootstrap khi volume rỗng | Sửa script nhưng giữ volume khiến schema cũ tồn tại, tạo lỗi “máy tôi chạy được”. |
| volume | Persist data ngoài container | Replica/volume không thay backup; thao tác `down -v` xóa sạch lab. |
| `system.parts` | Metadata physical parts | Chỉ cộng `active = 1` khi tính dung lượng/row hiện hành, nếu không dễ đếm cả inactive parts. |
| benchmark | Đo workload đại diện | 10 dòng luôn nhanh; cache ấm và query lặp có thể che I/O thật. |

## Tự kiểm tra

1. Vì sao sửa `00_init.sql` nhưng restart container không đổi table?
2. `system.tables.total_rows` có luôn chính xác tức thời không? Khi cần số chính xác, chạy `count()` và hiểu chi phí.
3. Chụp lại số active parts trước/sau ba lần insert riêng và quan sát sau vài phút.
