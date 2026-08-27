# 17 - Schema evolution, data quality và kiểm thử/benchmark

## Mục tiêu

- Thay đổi schema theo expand → migrate → contract mà không dừng ingest dài.
- Dùng shadow table và `EXCHANGE TABLES` cho thay đổi layout lớn.
- Tách accepted/rejected data, viết reconciliation có boundary.
- Xây regression test và benchmark tái lập trước cutover.

## 1. Phân loại schema change trước khi chạy

| Thay đổi | Chi phí/đặc điểm | Chiến lược mặc định |
|---|---|---|
| `ADD COLUMN ... DEFAULT` | Chủ yếu metadata; old parts tính default khi đọc | Expand trước, deploy reader/writer tương thích. |
| `RENAME COLUMN` | Metadata nhưng không áp dụng được cho cột key | Dual-read alias ở app; kiểm tra mọi MV/view/dictionary. |
| `MODIFY COLUMN` type/codec | Có thể rewrite parts/mutation | Canary một partition, theo dõi disk/queue rồi rollout. |
| `MATERIALIZE COLUMN` | Rewrite dữ liệu cũ để lưu default thật | Chạy theo partition/window, throttle ngoài giờ cao điểm. |
| Đổi sorting/partition key | Cần layout/table mới | Shadow table + backfill + dual write + atomic exchange. |
| `DROP COLUMN` | Xóa file cột nhanh nhưng phá consumer/reference | Contract cuối cùng sau thời gian tương thích và backup. |

Không đánh giá một ALTER chỉ bằng thời gian query DDL trả về. Mutation/rewrite có thể tiếp tục nền và tranh disk với merge, ingest, backup.

## 2. Expand → migrate → contract

Scenario: đổi `amount Decimal` sang `amount_cents UInt64` nhưng API cũ vẫn đang ghi `amount`.

```sql
DROP TABLE IF EXISTS ecommerce.orders_live;

CREATE TABLE ecommerce.orders_live
(
    order_id UInt64,
    amount Decimal(14, 2),
    created_at DateTime64(3, 'UTC'),
    currency LowCardinality(String) DEFAULT 'USD',
    CONSTRAINT positive_amount CHECK amount >= 0
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY order_id;

INSERT INTO ecommerce.orders_live (order_id, amount, created_at)
VALUES (1, 10.00, '2025-01-01 00:00:00.000');

-- Expand: metadata nhanh, old part tính expression khi đọc.
ALTER TABLE ecommerce.orders_live
    ADD COLUMN IF NOT EXISTS amount_cents UInt64
    DEFAULT toUInt64(amount * 100);

SELECT order_id, amount, amount_cents
FROM ecommerce.orders_live;
```

Rollout an toàn:

1. reader hiểu cả cột cũ và mới;
2. writer dual-write hoặc server default trong giai đoạn chuyển tiếp;
3. kiểm tra divergence theo partition;
4. materialize dần nếu cần lưu cột mới trong old parts;
5. đổi reader sang cột mới;
6. dừng writer cũ, chờ compatibility window rồi mới drop.

Materialize một partition:

```sql
ALTER TABLE ecommerce.orders_live
    MATERIALIZE COLUMN amount_cents IN PARTITION '202501';

SELECT
    mutation_id,
    command,
    parts_to_do,
    is_done,
    latest_fail_reason
FROM system.mutations
WHERE database = 'ecommerce' AND table = 'orders_live'
ORDER BY create_time DESC;
```

Default expression có thể đổi sau này. Old parts chưa materialize sẽ tính **default hiện hành** khi đọc, còn parts đã materialize giữ giá trị cũ; đây là nguồn dữ liệu không đồng nhất khó thấy.

## 3. Shadow table cho layout/type lớn

Đổi `ORDER BY`, `PARTITION BY` hoặc transform lớn bằng table mới thay vì mutation toàn table đang nóng:

```sql
DROP TABLE IF EXISTS ecommerce.orders_shadow;

CREATE TABLE ecommerce.orders_shadow
(
    order_id UInt64,
    amount Decimal(14, 2),
    amount_cents UInt64,
    created_at DateTime64(3, 'UTC'),
    currency LowCardinality(String),
    CONSTRAINT positive_amount CHECK amount >= 0
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(created_at)
ORDER BY (toDate(created_at), order_id);

INSERT INTO ecommerce.orders_shadow
    (order_id, amount, amount_cents, created_at, currency)
SELECT order_id, amount, amount_cents, created_at, currency
FROM ecommerce.orders_live;
```

Trong production, backfill phải có watermark. Bắt đầu dual-write trước hoặc ghi lại boundary; sau backfill, nạp delta nằm giữa snapshot và realtime. Không chạy “copy xong rồi đổi tên” nếu insert vẫn đến source.

## 4. Reconciliation trước cutover

So theo bucket và nhiều invariant, không chỉ tổng count:

```sql
WITH
source AS
(
    SELECT
        toYYYYMM(created_at) AS bucket,
        count() AS rows,
        sum(toDecimal128(amount, 2)) AS amount_sum,
        sum(toUInt128(cityHash64(order_id, amount_cents, created_at))) AS checksum
    FROM ecommerce.orders_live
    GROUP BY bucket
),
target AS
(
    SELECT
        toYYYYMM(created_at) AS bucket,
        count() AS rows,
        sum(toDecimal128(amount, 2)) AS amount_sum,
        sum(toUInt128(cityHash64(order_id, amount_cents, created_at))) AS checksum
    FROM ecommerce.orders_shadow
    GROUP BY bucket
)
SELECT
    coalesce(source.bucket, target.bucket) AS bucket,
    source.rows AS source_rows,
    target.rows AS target_rows,
    source.amount_sum - target.amount_sum AS amount_diff,
    source.checksum = target.checksum AS checksum_equal
FROM source
FULL OUTER JOIN target USING (bucket)
ORDER BY bucket
SETTINGS join_use_nulls = 1;
```

Hash tổng hợp không phải chứng minh toán học tuyệt đối, nhưng bắt được nhiều trường hợp count/sum vô tình cân bằng. Với dữ liệu cập nhật liên tục, hai phía phải được so ở cùng snapshot/watermark; nếu không bạn tạo mismatch giả.

Assertion cho CI hoặc migration job:

```sql
SELECT throwIf(
    (SELECT count() FROM ecommerce.orders_live)
    !=
    (SELECT count() FROM ecommerce.orders_shadow),
    'reconciliation failed: row count mismatch'
);
```

## 5. Atomic cutover và rollback

Database `Atomic` hoặc `Shared` hỗ trợ exchange hai tên table nguyên tử:

```sql
SELECT name, engine
FROM system.databases
WHERE name = 'ecommerce';

EXCHANGE TABLES ecommerce.orders_live AND ecommerce.orders_shadow;
```

Sau exchange, `orders_live` trỏ vào layout mới và `orders_shadow` giữ table cũ để rollback nhanh:

```sql
-- Rollback nếu canary/read validation thất bại.
EXCHANGE TABLES ecommerce.orders_live AND ecommerce.orders_shadow;
```

Exchange tên không làm dependencies “hiểu intent”. Materialized views, dictionaries, grants, app prepared statement/schema cache và distributed tables có thể tham chiếu object/name khác kỳ vọng; inventory dependency và thử trên staging. Nhiều cặp trong một lệnh được xử lý tuần tự, không atomic như một group migration.

## 6. Data contract bằng constraint

Constraint bảo vệ **insert mới**, không tự quét lịch sử đã có:

```sql
SHOW CREATE TABLE ecommerce.orders_live;

-- Query sau cố tình lỗi để chứng minh contract; chạy riêng khi học.
-- INSERT INTO ecommerce.orders_live
--     (order_id, amount, amount_cents, created_at, currency)
-- VALUES (99, -1.00, 0, now64(3), 'USD');
```

Constraint chỉ nên chứa invariant rẻ và deterministic. Regex/lookup nặng ở ingest làm giảm throughput; business rules thay đổi thường xuyên nên được version hóa trong staging/transform và đo reject rate.

## 7. Accepted/rejected pipeline chạy local

Dùng `Null` source để fan-out một block sang clean và quarantine tables:

```sql
DROP VIEW IF EXISTS ecommerce.quality_clean_mv;
DROP VIEW IF EXISTS ecommerce.quality_reject_mv;
DROP TABLE IF EXISTS ecommerce.quality_ingest;
DROP TABLE IF EXISTS ecommerce.quality_clean;
DROP TABLE IF EXISTS ecommerce.quality_reject;

CREATE TABLE ecommerce.quality_ingest
(
    event_id String,
    event_time String,
    user_id Int64,
    event_type String,
    price String
)
ENGINE = Null;

CREATE TABLE ecommerce.quality_clean
(
    event_id UUID,
    event_time DateTime64(3, 'UTC'),
    user_id UInt64,
    event_type LowCardinality(String),
    price Decimal(12, 2)
)
ENGINE = MergeTree
ORDER BY (event_time, event_id);

CREATE TABLE ecommerce.quality_reject
(
    event_id String,
    event_time String,
    user_id Int64,
    event_type String,
    price String,
    reasons Array(String),
    rejected_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = MergeTree
ORDER BY rejected_at;
```

Hai materialized views phải dùng conversion `OrNull` để row xấu được route thay vì làm cả block fail. Qualify `q.event_id`: ClickHouse alias substitution có thể khiến alias output cùng tên thay ngược vào `WHERE` và tạo lỗi type khó hiểu.

```sql
CREATE MATERIALIZED VIEW ecommerce.quality_clean_mv
TO ecommerce.quality_clean AS
SELECT
    assumeNotNull(toUUIDOrNull(q.event_id)) AS event_id,
    assumeNotNull(parseDateTime64BestEffortOrNull(q.event_time, 3, 'UTC')) AS event_time,
    toUInt64(q.user_id) AS user_id,
    q.event_type AS event_type,
    assumeNotNull(toDecimal64OrNull(q.price, 2)) AS price
FROM ecommerce.quality_ingest AS q
WHERE toUUIDOrNull(q.event_id) IS NOT NULL
  AND parseDateTime64BestEffortOrNull(q.event_time, 3, 'UTC') IS NOT NULL
  AND q.user_id >= 0
  AND toDecimal64OrNull(q.price, 2) IS NOT NULL;

CREATE MATERIALIZED VIEW ecommerce.quality_reject_mv
TO ecommerce.quality_reject AS
SELECT
    q.event_id,
    q.event_time,
    q.user_id,
    q.event_type,
    q.price,
    arrayFilter(x -> x != '', [
        if(toUUIDOrNull(q.event_id) IS NULL, 'event_id_invalid', ''),
        if(parseDateTime64BestEffortOrNull(q.event_time, 3, 'UTC') IS NULL,
           'event_time_invalid', ''),
        if(q.user_id < 0, 'user_id_negative', ''),
        if(toDecimal64OrNull(q.price, 2) IS NULL, 'price_invalid', '')
    ]) AS reasons,
    now64(3) AS rejected_at
FROM ecommerce.quality_ingest AS q
WHERE NOT (
    toUUIDOrNull(q.event_id) IS NOT NULL
    AND parseDateTime64BestEffortOrNull(q.event_time, 3, 'UTC') IS NOT NULL
    AND q.user_id >= 0
    AND toDecimal64OrNull(q.price, 2) IS NOT NULL
);

INSERT INTO ecommerce.quality_ingest VALUES
    ('00000000-0000-0000-0000-000000000099',
     '2025-01-01 10:00:00.000', 9, 'view', '12.50'),
    ('not-a-uuid', 'not-a-time', -1, 'view', 'free');

SELECT count() FROM ecommerce.quality_clean;
SELECT event_id, reasons FROM ecommerce.quality_reject;
```

Một source có nhiều MVs không tạo transaction phân tán hoàn hảo giữa mọi targets. Một view lỗi có thể làm insert fail/retry trong khi trạng thái các target cần được điều tra. Luôn có batch/event id và invariant `accepted + rejected = input` theo boundary.

## 8. `CHECK TABLE` không phải data-quality check

```sql
CHECK TABLE ecommerce.quality_clean;
```

`CHECK TABLE` kiểm tra integrity vật lý/checksum của table/parts theo engine; nó không biết revenue âm, user_id lạ hay accepted + rejected thiếu. Data quality cần query invariant riêng và lịch sử kết quả kiểm tra.

Ví dụ report hằng giờ:

```sql
SELECT
    toStartOfHour(rejected_at) AS hour,
    arrayJoin(reasons) AS reason,
    count() AS rejected
FROM ecommerce.quality_reject
GROUP BY hour, reason
ORDER BY hour, rejected DESC;
```

## 9. Testing pyramid cho ClickHouse

1. **DDL/contract test:** tạo schema trên database tạm, xác nhận type/default/constraint/dependency.
2. **Fixture correctness:** input nhỏ có duplicate, NULL, late event, boundary timezone và expected output cố định.
3. **Property/invariant test:** accepted + rejected, amount không âm, key uniqueness theo semantic, source-target reconciliation.
4. **Plan regression:** lưu `EXPLAIN indexes = 1`; cảnh báo khi read rows/bytes tăng lớn, không khóa cứng text plan qua mọi patch.
5. **Load test:** volume, skew, concurrency, merge/ingest nền giống production.
6. **Failure drill:** kill query/replica/Keeper/network, retry ambiguous commit, restore backup và rollback cutover.

Query fixture không được dựa vào thứ tự row nếu thiếu `ORDER BY`; merge/chạy song song có thể đổi order dù dữ liệu đúng.

## 10. Benchmark tái lập

Tạo query file `queries.sql` bằng editor. Ví dụ một dòng query không dùng result cache:

```sql
SELECT count(), uniqCombined64(user_id) FROM ecommerce.events WHERE event_date >= toDate('2025-01-01') FORMAT Null;
```

Từ `LessionClickHouse/`, chạy bằng Bash/Git Bash:

```bash
docker compose exec -T clickhouse clickhouse-benchmark \
  --host localhost \
  --user student \
  --password student_pass \
  --database ecommerce \
  --concurrency 8 \
  --iterations 100 \
  < queries.sql
```

PowerShell không hỗ trợ input redirection `<` giống Bash; dùng pipeline:

```powershell
Get-Content -Raw .\queries.sql | docker compose exec -T clickhouse `
  clickhouse-benchmark `
  --host localhost `
  --user student `
  --password student_pass `
  --database ecommerce `
  --concurrency 8 `
  --iterations 100
```

Ghi cùng artifact:

- ClickHouse exact version và config/settings;
- DDL, row count, bytes on disk, partitions/parts;
- data distribution: hot tenant, late data, cardinality, row width;
- concurrency, query mix, background ingest/merge;
- cold/warm run được gắn nhãn rõ;
- p50/p95/p99, throughput, read rows/bytes, peak memory và errors.

Benchmark 100 lần cùng một query cache-hot không đại diện dashboard đa dạng. Tắt query result cache khi so engine/layout, hoặc báo riêng kết quả cache hit/miss.

## 11. Checklist zero-downtime

- [ ] Contract mới backward-compatible với reader/writer đang deploy.
- [ ] Disk headroom đủ cho old + shadow + merge + backup.
- [ ] Watermark/dual-write không tạo gap hoặc overlap chưa dedup.
- [ ] Backfill throttle và theo dõi `system.mutations`, parts, merges.
- [ ] Reconciliation cùng boundary đạt ngưỡng đã định.
- [ ] Canary query correctness, latency và memory đạt SLO.
- [ ] `EXCHANGE` dependency/RBAC/MV/dictionary đã được test.
- [ ] Rollback giữ table cũ và biết xử lý writes sau cutover.
- [ ] Chỉ contract/drop sau compatibility window và backup restore test.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| schema evolution | Thay contract theo thời gian | Producer/consumer deploy khác nhịp; DDL hợp lệ vẫn làm app cũ hỏng. |
| `ADD COLUMN DEFAULT` | Thêm cột metadata | Old parts tính default lúc đọc; đổi expression sau đó làm old/new parts khác semantic. |
| `MATERIALIZE COLUMN` | Lưu default vào old parts | Là mutation rewrite, tranh disk/merge và có thể đầy disk giữa rollout. |
| `MODIFY COLUMN` | Đổi type/codec/default | Narrowing/parse lỗi hoặc rewrite rất lâu; test partition canary trước. |
| shadow table | Layout mới song song | Copy snapshot trong lúc source còn ghi tạo gap nếu thiếu dual-write/watermark. |
| `EXCHANGE TABLES` | Đổi hai tên atomically | Chỉ Atomic/Shared; dependencies/schema cache không tự hiểu intent, nhiều cặp không atomic cả group. |
| rollback | Đổi về table cũ | Writes sau cutover chỉ vào table mới; rollback tên mà không replay delta sẽ mất logic dữ liệu. |
| constraint | CHECK trên insert mới | Không quét historical rows; rule nặng làm giảm ingest và không thay reconciliation. |
| `Null` engine | Bỏ storage nhưng phát block cho MVs | Không có raw replay nếu downstream lỗi; cần durable queue/audit khi dữ liệu quan trọng. |
| `OrNull` conversion | Parse lỗi thành NULL | Nếu không đếm/reject, lỗi schema bị biến thành missing data âm thầm. |
| alias substitution | Alias được resolve trong query | Alias output trùng tên input có thể đổi type trong `WHERE`; qualify bằng table alias. |
| quarantine | Lưu row lỗi + lý do | Không TTL/redact tạo kho PII lâu dài; bỏ alert làm reject tăng mà pipeline vẫn “xanh”. |
| reconciliation | So source/target cùng boundary | Chỉ so count bỏ sót vừa thiếu vừa trùng; boundary khác nhau tạo mismatch giả. |
| `CHECK TABLE` | Kiểm tra integrity vật lý | PASS không có nghĩa business invariants đúng. |
| benchmark | Đo workload tái lập | Dataset đều/cache ấm/no concurrency làm tối ưu thắng lab nhưng thua production. |
| `EXPLAIN` regression | So lượng đọc/plan | Khóa exact plan text qua patch version gây test giòn; assert invariant/metrics có tolerance. |

## Bài thực hành

Với 10 triệu orders, đổi sorting key bằng shadow table trong khi một job tiếp tục insert. Cố tình tạo overlap và một row invalid. Thiết kế watermark/dedup để reconcile về zero, exchange, chạy canary, rollback, rồi replay delta. Báo cáo disk peak, mutation/merge impact và p95 trước/sau.

## Tài liệu chính thức

- [ALTER COLUMN](https://clickhouse.com/docs/reference/statements/alter/column)
- [EXCHANGE statement](https://clickhouse.com/docs/reference/statements/exchange)
- [Constraints](https://clickhouse.com/docs/sql-reference/statements/create/table#constraints)
- [Using materialized views](https://clickhouse.com/blog/using-materialized-views-in-clickhouse)
- [CHECK TABLE](https://clickhouse.com/docs/reference/statements/check-table)
- [ClickHouse benchmark methodology/results](https://benchmark.clickhouse.com/)
