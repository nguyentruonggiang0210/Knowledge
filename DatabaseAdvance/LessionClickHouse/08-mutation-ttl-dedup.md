# 08 - Mutation, TTL, deduplication và late data

## Mục tiêu

- Update/delete trong mô hình immutable parts mà không gây bão I/O.
- Thiết kế retention bằng TTL đúng kỳ vọng bất đồng bộ.
- Xử lý version, tombstone, duplicate và event đến muộn.

## 1. Mutation rewrite parts

Tạo table lab trước khi thử:

```sql
CREATE TABLE ecommerce.mutation_demo
(
    id UInt64,
    value String,
    event_date Date
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, id);

INSERT INTO ecommerce.mutation_demo
SELECT number, 'old', toDate('2025-01-01') + toIntervalDay(number % 10)
FROM numbers(100000);

ALTER TABLE ecommerce.mutation_demo
UPDATE value = 'corrected'
WHERE id % 10000 = 0;
```

Theo dõi:

```sql
SELECT
    mutation_id,
    command,
    create_time,
    parts_to_do,
    is_done,
    latest_fail_reason
FROM system.mutations
WHERE database = 'ecommerce' AND table = 'mutation_demo'
ORDER BY create_time DESC;
```

Mutation thường bất đồng bộ. Command sửa 10 rows vẫn có thể rewrite parts chứa chúng; chi phí tỷ lệ data part bị chạm, không chỉ rows match.

## 2. Delete và partition drop

```sql
ALTER TABLE ecommerce.mutation_demo
DELETE WHERE id = 42;

-- Lifecycle theo nguyên partition nhanh hơn row delete lớn.
-- Chỉ bỏ comment khi bạn chủ động muốn xóa toàn bộ partition lab:
-- ALTER TABLE ecommerce.mutation_demo DROP PARTITION 202501;
```

Lightweight delete (`DELETE FROM ... WHERE`) đánh dấu row trước và cleanup vật lý sau; availability/behavior phụ thuộc version/settings. Dù “lightweight”, scan mask và cleanup vẫn có chi phí.

## 3. TTL theo row/partition

Table `events` có:

```sql
SHOW CREATE TABLE ecommerce.events;
```

Quy tắc:

```sql
TTL event_date + INTERVAL 2 YEAR DELETE
```

TTL được áp dụng trong merge theo lịch, không phải scheduler xóa đúng giây. Quan sát:

```sql
SELECT
    partition,
    min(min_date) AS oldest,
    max(max_date) AS newest,
    sum(rows) AS rows
FROM system.parts
WHERE database = 'ecommerce' AND table = 'events' AND active
GROUP BY partition
ORDER BY partition;
```

Ví dụ tiering/recompression (cần storage policy/volume tương ứng):

```sql
CREATE TABLE ecommerce.logs_ttl_blueprint
(
    ts DateTime('UTC'),
    service LowCardinality(String),
    payload String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (service, ts)
TTL
    ts + INTERVAL 7 DAY RECOMPRESS CODEC(ZSTD(6)),
    ts + INTERVAL 90 DAY DELETE;
```

ZSTD level cao tiết kiệm cold storage nhưng TTL recompress tạo I/O/CPU; đo merge capacity.

## 4. Latest state với tombstone

Insert delete event mô phỏng CDC:

```sql
INSERT INTO ecommerce.orders
    (order_id, user_id, status, total_amount, created_at, updated_at, version, is_deleted)
VALUES
    (5004, 105, 'cancelled', 30.00,
     '2025-02-03 10:00:00.000', '2025-02-04 10:00:00.000', 2, 1);
```

Sai: lọc tombstone trước khi chọn latest, làm row version 1 sống lại:

```sql
SELECT order_id, argMax(status, version)
FROM ecommerce.orders
WHERE is_deleted = 0
GROUP BY order_id;
```

Đúng: chọn tuple latest rồi lọc:

```sql
SELECT
    order_id,
    latest.1 AS status,
    latest.2 AS total_amount,
    latest.4 AS version
FROM
(
    SELECT
        order_id,
        argMax(tuple(status, total_amount, is_deleted, version), version) AS latest
    FROM ecommerce.orders
    GROUP BY order_id
)
WHERE latest.3 = 0;
```

Nếu hai messages cùng version nhưng payload khác, `argMax`/Replacing không phải tie-break business đáng tin. Producer cần version tổng thứ tự hoặc thêm deterministic tie-break vào một weight lớn hơn (ví dụ tuple nếu function/type hỗ trợ đúng contract).

## 5. Duplicate vật lý và dedup logic

```sql
SELECT order_id, count() AS physical_versions,
       uniqExact(version) AS distinct_versions
FROM ecommerce.orders
GROUP BY order_id
HAVING physical_versions > 1;

SELECT count() AS logical_live_orders
FROM
(
    SELECT
        order_id,
        argMax(is_deleted, version) AS deleted
    FROM ecommerce.orders
    GROUP BY order_id
)
WHERE deleted = 0;
```

`OPTIMIZE ... FINAL DEDUPLICATE` có thể loại row trùng theo biểu thức trong parts, nhưng là merge nặng và không thay unique constraint/idempotent producer. Nó cũng không biết hai payload khác nhau cùng business key nên chọn cái nào nếu rule không được encode.

## 6. Late events và partition

Event tháng 1 đến vào tháng 3 vẫn được ghi vào partition tháng 1 vì partition expression dựa trên event time:

```sql
INSERT INTO ecommerce.events
    (event_id, event_time, user_id, session_id, event_type, product_id,
     category, price, quantity, country, device, properties)
VALUES
    (generateUUIDv4(), '2025-01-01 00:00:00.000', 777, generateUUIDv4(),
     'purchase', 1001, 'books', 9.00, 1, 'VN', 'mobile', map('late', 'true'));

SELECT partition, max(modification_time), sum(rows)
FROM system.parts
WHERE database = 'ecommerce' AND table = 'events' AND active
GROUP BY partition
ORDER BY partition;
```

Nếu January partition đã export/freeze/drop theo watermark, late event có thể làm báo cáo và backup không đồng bộ. Định nghĩa allowed lateness, reopen/backfill policy và data-quality alert.

## 7. Cancel/kill mutation chỉ là xử lý sự cố

```sql
-- Xem candidate trước; chỉ chạy KILL với mutation_id cụ thể trong lab.
SELECT database, table, mutation_id, command, parts_to_do
FROM system.mutations
WHERE is_done = 0;

-- KILL MUTATION WHERE database = 'ecommerce'
--   AND table = 'mutation_demo' AND mutation_id = 'mutation_...';
```

Kill không hoàn tác parts đã mutation xong; dữ liệu có thể ở trạng thái hỗn hợp theo parts cho tới khi có kế hoạch sửa tiếp.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| mutation | Rewrite parts để update/delete | Sửa vài rows vẫn rewrite GB/TB; queue dài làm disk tăng và merge/queries chậm. |
| `system.mutations` | Tiến độ/lỗi mutation | `is_done=0` lâu có thể do part mới/lỗi lặp; alert cả age và fail reason, không chỉ count. |
| lightweight delete | Mask row rồi cleanup sau | Data vẫn chiếm disk và scan mask có overhead; không coi là instant physical erase/compliance proof. |
| `DROP PARTITION` | Xóa cả partition nhanh | Sai partition expression/format xóa lượng dữ liệu lớn tức thì; verify candidate và backup trước. |
| TTL DELETE | Retention qua merge | Không xóa đúng deadline; compliance cần đo TTL lag và có quy trình ép/kiểm chứng có kiểm soát. |
| TTL RECOMPRESS | Đổi codec data cũ | Recompression wave tranh I/O với ingest khi nhiều parts cùng đến hạn. |
| `ReplacingMergeTree(version)` | Latest version lúc merge | Version không strictly increasing hoặc nằm ở partition khác làm winner sai/dedup không gặp nhau. |
| tombstone | Bản ghi logical delete | Lọc tombstone trước `argMax` làm hồi sinh phiên bản cũ. |
| `FINAL` | Read-time merge semantics | Correctness dễ đạt nhưng query diện rộng tốn tài nguyên; benchmark và cân nhắc state table. |
| duplicate | Nhiều physical rows/event | `count()` phình trong lúc `uniq` có vẻ đúng, tạo metric không nhất quán giữa dashboard. |
| dedup token/window | Chặn retry gần nhau | Window hết hạn hoặc block shape đổi thì duplicate vẫn vào; không phải exactly-once. |
| late event | Event time cũ, arrival mới | Partition đã đóng/backup/MV aggregate đã publish có thể phải sửa lại. |
| `KILL MUTATION` | Dừng tác vụ còn lại | Không rollback phần đã hoàn thành; cần follow-up mutation/reload để đạt state nhất quán. |

## Bài thực hành

Mô phỏng 10 versions/order, duplicate retry, delete tombstone và late event. Viết ba query: raw audit, current live state, revenue current. So với `FINAL`; đo memory/read rows trên dữ liệu lớn và viết policy mutation/TTL cho production.
