# 01 - Kiến trúc columnar và tư duy OLAP

## Mục tiêu

- Phân biệt workload OLTP và OLAP bằng query pattern.
- Hiểu column file, part, mark/granule, vectorized execution và background merge.
- Biết vì sao ClickHouse đọc rất nhanh nhưng không tối ưu cho transaction cập nhật từng row.

## 1. OLTP và OLAP

| Thuộc tính | OLTP (ví dụ PostgreSQL) | OLAP (ClickHouse) |
|---|---|---|
| Truy cập | Ít row, lookup/update cụ thể | Quét nhiều row, ít cột, aggregate |
| Ghi | Transaction nhỏ, update/delete thường xuyên | Append/batch, immutable là lý tưởng |
| Độ trễ | Millisecond cho point query | Sub-second/seconds cho scan lớn |
| Mô hình | Chuẩn hóa để bảo toàn dữ liệu | Denormalize vừa đủ cho truy vấn |
| Consistency | Transaction ACID là trung tâm | Merge/replication có bước bất đồng bộ |

Ví dụ OLAP điển hình:

```sql
SELECT
    event_date,
    category,
    sumIf(toDecimal128(price, 2) * quantity, event_type = 'purchase') AS revenue,
    uniqCombined64If(user_id, event_type = 'purchase') AS buyers
FROM ecommerce.events
WHERE event_date >= '2025-01-01'
GROUP BY event_date, category
ORDER BY event_date, revenue DESC;
```

Không nên biến ClickHouse thành API source-of-truth cho thao tác `UPDATE order SET ... WHERE id = ?` liên tục. PostgreSQL giữ giao dịch; ClickHouse giữ lịch sử/event và phục vụ phân tích.

## 2. Hướng cột: chỉ đọc dữ liệu cần thiết

Row store đặt cả row gần nhau. Column store giữ giá trị cùng cột gần nhau, nên:

- query chọn 3/40 cột chỉ đọc các column stream liên quan;
- giá trị cùng kiểu/phân bố nén tốt;
- CPU xử lý một vector giá trị thay vì gọi logic từng row.

So sánh bytes đã đọc trên dataset benchmark:

```sql
-- Query hẹp: chỉ vài cột.
SELECT category, count()
FROM ecommerce.events_bench
GROUP BY category
FORMAT Null;

-- Query rộng: yêu cầu toàn bộ cột được serialize.
SELECT *
FROM ecommerce.events_bench
FORMAT Null;

SYSTEM FLUSH LOGS;

SELECT
    normalized_query_hash,
    any(query) AS sample,
    sum(read_rows) AS rows,
    formatReadableSize(sum(read_bytes)) AS bytes,
    max(memory_usage) AS peak_memory
FROM system.query_log
WHERE type = 'QueryFinish'
  AND event_time >= now() - INTERVAL 5 MINUTE
  AND query LIKE '%events_bench%'
GROUP BY normalized_query_hash
ORDER BY bytes DESC;
```

`FORMAT Null` vẫn thực thi query nhưng bỏ chi phí trả kết quả; hữu ích khi benchmark execution.

## 3. Part, partition và background merge

Mỗi insert tạo một hoặc nhiều **data part**. Trong mỗi part, data được sắp theo sorting key và tách thành column files. Background merge kết hợp các parts trong cùng partition thành part lớn hơn.

```sql
SELECT
    partition,
    count() AS active_parts,
    sum(rows) AS rows,
    formatReadableSize(sum(bytes_on_disk)) AS bytes
FROM system.parts
WHERE database = 'ecommerce'
  AND table = 'events'
  AND active
GROUP BY partition
ORDER BY partition;

SELECT
    database,
    table,
    elapsed,
    progress,
    num_parts,
    formatReadableSize(total_size_bytes_compressed) AS compressed
FROM system.merges
WHERE database = 'ecommerce';
```

Merge không diễn ra xuyên partition. Merge là eventual: số part, dedup của engine và TTL cleanup có thể chưa đạt trạng thái cuối ngay sau khi insert.

## 4. Granule, mark và sparse primary index

ClickHouse không lưu một B-tree entry cho mỗi row. Primary index lưu **mark** theo từng granule (mặc định mục tiêu khoảng 8192 rows, nhưng có thể bị giới hạn bởi bytes). Khi điều kiện phù hợp prefix của sorting key, engine bỏ qua nhiều granule.

```sql
EXPLAIN indexes = 1
SELECT count()
FROM ecommerce.events
WHERE event_date = '2025-01-05'
  AND event_type = 'purchase';

EXPLAIN indexes = 1
SELECT count()
FROM ecommerce.events
WHERE product_id = 1001;
```

Table `events` sắp theo `(event_date, event_type, user_id, event_time, event_id)`. Query đầu tận dụng prefix tốt; `product_id` không nằm trong key nên có thể phải scan nhiều hơn.

## 5. Vectorized và pipeline execution

ClickHouse xử lý block nhiều row qua pipeline (read → filter → aggregate → sort → output), chạy song song theo threads.

```sql
EXPLAIN PIPELINE
SELECT category, sum(price * quantity)
FROM ecommerce.events
WHERE event_type = 'purchase'
GROUP BY category;

SELECT
    name,
    value
FROM system.settings
WHERE name IN ('max_threads', 'max_block_size', 'max_memory_usage');
```

Thêm threads không luôn nhanh hơn: query nhỏ chịu overhead; nhiều query đồng thời có thể tranh CPU và memory bandwidth.

## 6. PREWHERE và column pruning

`PREWHERE` đọc cột lọc trước, chỉ đọc cột còn lại cho row sống sót. ClickHouse thường tự đẩy điều kiện phù hợp từ `WHERE` sang `PREWHERE`.

```sql
SELECT user_id, product_id, properties
FROM ecommerce.events
PREWHERE event_date = '2025-01-05' AND event_type = 'purchase'
WHERE country = 'VN';
```

Không cần ép `PREWHERE` cho mọi query. Điều kiện tốn CPU hoặc không selective có thể không giúp; xác nhận bằng query log/profile events.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| OLAP | Scan + aggregate lượng lớn | Dùng ClickHouse làm transactional source-of-truth dẫn tới mutation backlog và consistency khó đoán. |
| columnar | Lưu theo cột | `SELECT *` phá lợi ích column pruning và tăng network/serialization. |
| compression | Nén stream cùng loại | Dữ liệu gần-random hoặc schema String cho mọi thứ nén kém, tốn CPU parse. |
| vectorized execution | Xử lý block giá trị | UDF/format chuyển đổi phức tạp trên từng row có thể biến CPU thành nút thắt. |
| data part | Đơn vị vật lý immutable | Insert quá nhỏ tạo “too many parts”; merge không theo kịp ingest. |
| background merge | Hợp nhất parts bất đồng bộ | Sau restart/peak load, merge backlog hút I/O và làm query latency tăng dù ingest đã giảm. |
| partition | Nhóm parts có cùng partition key | Merge không qua partition; partition cardinality cao để lại hàng vạn part nhỏ vĩnh viễn. |
| granule | Đơn vị đọc/bỏ qua nhỏ nhất | Point lookup vẫn đọc cả granule; không kỳ vọng chi phí một-row như B-tree. |
| mark | Vị trí sparse index vào column streams | `marks` ít không đồng nghĩa query tối ưu nếu predicate không khớp sorting key. |
| primary index | Sparse index trên key | Không unique; duplicate row được phép và thường xuyên xuất hiện. |
| pipeline | Các processor chạy song song | `max_threads` quá cao trên dashboard đồng thời gây oversubscription và tail latency. |
| `PREWHERE` | Filter sớm trước cột rộng | Ép cột không selective vào PREWHERE có thể đọc thêm stage mà không giảm data. |
| `FORMAT Null` | Bỏ output để benchmark engine | Không đo network/client serialization; kết quả không đại diện end-to-end latency. |

## Bài thực hành

1. Tạo `events_bench` từ bài 00 nếu chưa có.
2. Chạy hai query cùng logic: một lọc bằng prefix key, một lọc `product_id`; so sánh `read_rows`.
3. Insert 100 lần, mỗi lần 1 row vào table tạm; quan sát active parts và giải thích vì sao batch tốt hơn.

## Tiêu chí hoàn thành

Bạn có thể vẽ luồng `INSERT → part → background merge` và giải thích được câu: “`ORDER BY` giúp data skipping nhưng không bảo đảm uniqueness”.
