# 10 - Hiệu năng: EXPLAIN, system tables và phương pháp triage

## Mục tiêu

- Tối ưu theo số liệu, phân biệt scan, CPU, memory, disk và network bottleneck.
- Dùng `EXPLAIN`, query log, profile events, parts/merges để tìm nguyên nhân.
- Thiết lập benchmark tái lập và guardrail tài nguyên.

## 1. Quy trình 7 bước

1. Ghi query, parameters, user, thời điểm và latency percentile.
2. Xác nhận correctness/grain trước khi tối ưu.
3. Đọc `EXPLAIN` để xem rewrite, indexes, pipeline.
4. Đọc query log: rows/bytes, memory, threads, exceptions.
5. Kiểm tra parts/merge/mutation/disk và workload đồng thời.
6. Thay **một** biến: query, key, projection, MV, setting hoặc resource.
7. Benchmark nhiều lần với data representative; lưu kết quả trước/sau.

## 2. Các dạng EXPLAIN

```sql
EXPLAIN SYNTAX
SELECT category, count()
FROM ecommerce.events
WHERE event_date = '2025-01-05'
GROUP BY category;

EXPLAIN PLAN
SELECT category, count()
FROM ecommerce.events
WHERE event_date = '2025-01-05'
GROUP BY category;

EXPLAIN PIPELINE
SELECT category, count()
FROM ecommerce.events
WHERE event_date = '2025-01-05'
GROUP BY category;

EXPLAIN indexes = 1
SELECT count()
FROM ecommerce.events
WHERE event_date = '2025-01-05'
  AND event_type = 'purchase';
```

- `SYNTAX`: query sau rewrite.
- `PLAN`: logical/physical steps.
- `PIPELINE`: processors và concurrency.
- `indexes=1`: parts/granules bị chọn hoặc bỏ.

Plan “có index” chưa đủ; cần xem granules selected/total và query-log read metrics.

## 3. Query log

Gắn `log_comment` để tìm đúng lần chạy (hoặc truyền `--query_id` từ client):

```sql
SELECT category, sum(price * quantity)
FROM ecommerce.events
WHERE event_date >= '2025-01-01' AND event_type = 'purchase'
GROUP BY category
SETTINGS log_queries = 1, log_comment = 'lesson10-revenue-v1';

SYSTEM FLUSH LOGS;

SELECT
    query_id,
    log_comment,
    type,
    query_duration_ms,
    read_rows,
    formatReadableSize(read_bytes) AS read_bytes,
    result_rows,
    formatReadableSize(memory_usage) AS memory,
    ProfileEvents['SelectedParts'] AS selected_parts,
    ProfileEvents['SelectedMarks'] AS selected_marks,
    exception_code,
    exception
FROM system.query_log
WHERE log_comment = 'lesson10-revenue-v1'
ORDER BY event_time_microseconds;
```

Query text/log có thể chứa PII/literals. Giới hạn quyền và retention, hoặc dùng parameterized query/masking phù hợp.

## 4. Slow-query leaderboard

```sql
SELECT
    normalized_query_hash,
    any(query) AS sample,
    count() AS executions,
    quantile(0.95)(query_duration_ms) AS p95_ms,
    sum(read_rows) AS rows_read,
    formatReadableSize(sum(read_bytes)) AS bytes_read,
    formatReadableSize(max(memory_usage)) AS max_memory
FROM system.query_log
WHERE type = 'QueryFinish'
  AND event_time >= now() - INTERVAL 1 HOUR
  AND database = 'ecommerce'
GROUP BY normalized_query_hash
ORDER BY p95_ms DESC
LIMIT 20;
```

`any(query)` có thể chọn literal bất kỳ; hash normalized gom query shape nhưng không phải metric nghiệp vụ. Tách user/workload class khi dashboard và backfill cùng shape nhưng resource profile khác.

## 5. Parts, merges, mutations và disk

```sql
SELECT
    table,
    partition,
    count() AS parts,
    sum(rows) AS rows,
    round(sum(rows) / count(), 1) AS rows_per_part,
    formatReadableSize(sum(bytes_on_disk)) AS disk
FROM system.parts
WHERE database = 'ecommerce' AND active
GROUP BY table, partition
ORDER BY parts DESC;

SELECT database, table, elapsed, progress, num_parts,
       formatReadableSize(total_size_bytes_compressed) AS merge_size
FROM system.merges
ORDER BY elapsed DESC;

SELECT database, table, mutation_id, parts_to_do, is_done, latest_fail_reason
FROM system.mutations
WHERE is_done = 0;

SELECT
    name,
    path,
    formatReadableSize(free_space) AS free,
    formatReadableSize(total_space) AS total,
    formatReadableSize(keep_free_space) AS reserved
FROM system.disks;
```

Low disk làm merge không có chỗ tạo part mới; write có thể fail trước khi disk đạt 100% vì reserved space/temporary amplification.

## 6. Current queries và cancellation

```sql
SELECT
    query_id,
    user,
    elapsed,
    read_rows,
    formatReadableSize(read_bytes) AS read_bytes,
    formatReadableSize(memory_usage) AS memory,
    query
FROM system.processes
ORDER BY memory_usage DESC;

-- Chỉ sau khi xác nhận đúng query_id:
-- KILL QUERY WHERE query_id = 'bad-query-id' SYNC;
```

Kill client query không chắc xóa mọi external side effect/downstream insert đã hoàn thành. Điều tra root cause và thêm quota/timeout, không biến kill thành scheduler.

## 7. Memory spill và giới hạn

Ví dụ guardrail cấp query:

```sql
SELECT user_id, groupArray(event_id)
FROM ecommerce.events
GROUP BY user_id
SETTINGS
    max_memory_usage = 1000000000,
    max_bytes_before_external_group_by = 500000000;
```

External aggregation/sort spill ra disk, tránh OOM nhưng chậm và tăng I/O. `groupArray` không giới hạn trên cardinality lớn vẫn có thể tạo result/state khổng lồ; dùng `groupArray(100)` nếu business chỉ cần sample/top N.

```sql
SELECT user_id, groupArray(100)(event_id) AS sample_event_ids
FROM ecommerce.events
GROUP BY user_id;
```

## 8. JOIN algorithm và right-side size

```sql
SELECT i.category, sum(i.quantity)
FROM ecommerce.order_items i
INNER JOIN
(
    SELECT order_id
    FROM ecommerce.orders FINAL
    WHERE status = 'paid' AND is_deleted = 0
) o USING order_id
GROUP BY i.category
SETTINGS join_algorithm = 'auto';
```

`auto` cho engine chọn/fallback theo khả năng, nhưng `FINAL` + join vẫn có thể đắt. Giảm columns/right rows trước join; theo dõi memory và chọn direct/dictionary/partial merge/grace hash chỉ sau benchmark và hiểu điều kiện hỗ trợ.

Lưu ý query trên cũng có lỗi tombstone nếu old live + latest deleted được đặt ở các partition khác nhau nên `FINAL` không gặp được chúng. Latest-state subquery từ bài 05 rõ semantic hơn.

## 9. Cache và benchmark

```sql
SELECT
    query_duration_ms,
    read_rows,
    read_bytes,
    ProfileEvents['OSReadBytes'] AS os_read_bytes,
    ProfileEvents['CachedReadBufferReadFromCacheBytes'] AS cache_bytes
FROM system.query_log
WHERE type = 'QueryFinish'
  AND query_id LIKE 'bench-%'
ORDER BY event_time_microseconds;
```

Không dùng lệnh drop filesystem cache trên máy dùng chung. Benchmark cold/warm theo mục tiêu; randomize khoảng thời gian và chạy đủ samples để tránh một lần may mắn.

## 10. Tối ưu có thứ tự ưu tiên

```sql
-- Tránh SELECT *, lọc thời gian/key sớm, aggregate tại server.
SELECT
    event_date,
    category,
    sum(price * quantity) AS revenue
FROM ecommerce.events
PREWHERE event_date >= '2025-01-01'
WHERE event_type = 'purchase'
GROUP BY event_date, category
ORDER BY event_date, revenue DESC
LIMIT 100;
```

Thứ tự thường hiệu quả: giảm dữ liệu cần đọc → đúng sorting/partition → pre-aggregate/projection → type/codec → settings/threads. Tăng CPU/RAM không sửa key sai hoặc query đọc thừa 99%.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| `EXPLAIN SYNTAX` | Xem rewrite | Rewrite đúng cú pháp không nói chi phí runtime/data distribution. |
| `EXPLAIN PLAN` | Xem steps | Estimate/plan không thay số liệu read_rows/memory thật. |
| `EXPLAIN PIPELINE` | Xem concurrency | Nhiều processors không đồng nghĩa nhanh khi disk/memory bandwidth đã bão hòa. |
| `EXPLAIN indexes=1` | Xem pruning | Index xuất hiện nhưng chọn 99% granules gần như vô ích. |
| `system.query_log` | Lịch sử query | Flush bất đồng bộ; query vừa chạy có thể chưa xuất hiện. Log chứa dữ liệu nhạy cảm. |
| normalized hash | Gom query shape | Hai parameter ranges khác nhau có cost rất khác nhưng cùng hash. |
| `read_rows/read_bytes` | Scan logical | Không phản ánh đầy đủ OS cache, decompression CPU, network hay result serialization. |
| ProfileEvents | Counters chi tiết | Tên/counter availability đổi theo version; dashboard phải test khi upgrade. |
| active parts | Parts hiện hành | Nhiều tiny parts tăng open/seek/merge overhead dù tổng bytes nhỏ. |
| merge backlog | Công việc hợp nhất | Merge tranh disk với query; benchmark lúc hệ idle không thấy tail latency production. |
| mutation backlog | Rewrite đang chờ | Một mutation lỗi có thể giữ queue/parts lâu, tăng disk và block cleanup. |
| external aggregation | Spill state ra disk | Tránh OOM nhưng có thể làm đầy disk và latency tăng hàng chục lần. |
| `max_threads` | Threads/query | Tăng per-query threads làm throughput tổng giảm khi concurrency cao. |
| `KILL QUERY` | Hủy execution | Không phải rollback transaction phân tán; insert/MV/remote side đã hoàn tất có thể còn. |
| warm cache | Data đã ở cache | Benchmark lặp cùng query cho con số đẹp nhưng không đại diện ad-hoc ranges. |
| `FINAL` | Apply merge semantics lúc read | Correctness tax ẩn trong JOIN/dashboard; profile riêng trước khi phổ biến. |

## Bài thực hành

Tạo 50 triệu rows, chọn ba query chậm. Lưu baseline p50/p95, read rows/bytes, peak memory, selected marks và insert throughput. Thay một thiết kế, chạy lại với cùng concurrency và viết postmortem nếu regression.
