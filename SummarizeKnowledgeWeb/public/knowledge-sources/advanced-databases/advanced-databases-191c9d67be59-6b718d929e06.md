# 06 - LowCardinality, Nullable, codec và dữ liệu bán cấu trúc

## Mục tiêu

- Giảm storage/CPU bằng type và codec dựa trên phân bố thật.
- Hiểu chi phí/tính đúng của `LowCardinality` và `Nullable`.
- Đặt JSON/Map đúng vai trò, không thay schema typed bằng một “túi dữ liệu”.

## 1. Đo trước khi tối ưu

```sql
SELECT
    column,
    type,
    formatReadableSize(sum(column_data_compressed_bytes)) AS compressed,
    formatReadableSize(sum(column_data_uncompressed_bytes)) AS uncompressed,
    round(sum(column_data_uncompressed_bytes) /
          greatest(sum(column_data_compressed_bytes), 1), 2) AS ratio
FROM system.parts_columns
WHERE database = 'ecommerce' AND table = 'events' AND active
GROUP BY column, type
ORDER BY sum(column_data_compressed_bytes) DESC;
```

Tối ưu cột chiếm phần lớn bytes hoặc CPU, không tối ưu theo cảm giác.

## 2. LowCardinality

`LowCardinality(String)` mã hóa dictionary trong parts và thường giúp cột dimension ít giá trị:

```sql
SELECT
    toTypeName(event_type),
    uniqExact(event_type) AS cardinality,
    count() AS rows,
    round(cardinality / rows, 6) AS cardinality_ratio
FROM ecommerce.events;
```

So sánh lab:

```sql
CREATE TABLE ecommerce.lc_demo
(
    id UInt64,
    plain String,
    encoded LowCardinality(String)
)
ENGINE = MergeTree
ORDER BY id;

INSERT INTO ecommerce.lc_demo
SELECT number, concat('value_', toString(number % 20)),
       concat('value_', toString(number % 20))
FROM numbers(1000000);

SELECT column, type,
       formatReadableSize(sum(column_data_compressed_bytes)) AS compressed
FROM system.parts_columns
WHERE database = 'ecommerce' AND table = 'lc_demo' AND active
GROUP BY column, type;
```

Cardinality cao, giá trị rất dài/biến động, hoặc nhiều tiny parts có thể giảm lợi ích dictionary. Benchmark group/filter và storage, không dùng một threshold thần kỳ.

## 3. Nullable hay sentinel

```sql
CREATE TABLE ecommerce.null_demo
(
    id UInt64,
    discount Nullable(Decimal(8, 2)),
    note Nullable(String)
)
ENGINE = MergeTree
ORDER BY id;

INSERT INTO ecommerce.null_demo VALUES
    (1, NULL, NULL),
    (2, 0.00, ''),
    (3, 5.00, 'campaign');

SELECT
    count() AS rows,
    count(discount) AS known_discount_rows,
    countIf(discount = 0) AS zero_discount_rows,
    avg(discount) AS avg_known_discount
FROM ecommerce.null_demo;
```

`count(nullable_col)` bỏ NULL; `count()` không bỏ. Zero discount là dữ liệu biết chắc bằng 0, khác unknown.

## 4. Codec chain

Codec biến đổi (`Delta`, `DoubleDelta`, `Gorilla`, `T64`) thường đi trước codec nén (`ZSTD`, `LZ4`):

```sql
CREATE TABLE ecommerce.codec_demo
(
    ts DateTime64(3, 'UTC') CODEC(DoubleDelta, ZSTD(1)),
    sequence UInt64 CODEC(Delta, ZSTD(1)),
    temperature Float64 CODEC(Gorilla, ZSTD(1)),
    amount Decimal(12, 2) CODEC(T64, ZSTD(1)),
    label LowCardinality(String) CODEC(ZSTD(1))
)
ENGINE = MergeTree
ORDER BY (label, ts);

INSERT INTO ecommerce.codec_demo
SELECT
    toDateTime64('2025-01-01 00:00:00', 3, 'UTC') + toIntervalMillisecond(number),
    number,
    20.0 + sin(number / 1000),
    toDecimal64(toString(100 + number % 50), 2),
    concat('sensor_', toString(number % 10))
FROM numbers(1000000);

SELECT
    column,
    any(type) AS type,
    formatReadableSize(sum(column_data_compressed_bytes)) AS compressed,
    round(sum(column_data_uncompressed_bytes) /
          greatest(sum(column_data_compressed_bytes), 1), 2) AS ratio
FROM system.parts_columns
WHERE database = 'ecommerce' AND table = 'codec_demo' AND active
GROUP BY column
ORDER BY compressed DESC;
```

- `Delta/DoubleDelta`: chuỗi integer/time thay đổi đều.
- `Gorilla`: time-series floating values.
- `T64`: integer/Decimal trong miền hẹp.
- `LZ4`: nhanh, mặc định tốt.
- `ZSTD(level)`: thường nén tốt hơn, tốn CPU hơn khi ghi/đọc.

Codec hiệu quả phụ thuộc sorting key: timestamp ngẫu nhiên nén Delta kém hơn timestamp gần tuần tự.

## 5. Đổi codec không rewrite ngay dữ liệu cũ

```sql
ALTER TABLE ecommerce.codec_demo
    MODIFY COLUMN temperature Float64 CODEC(Gorilla, ZSTD(3));

SELECT column, compression_codec
FROM system.columns
WHERE database = 'ecommerce' AND table = 'codec_demo';
```

DDL mới áp dụng cho parts mới; old parts giữ encoding cũ cho tới mutation/materialization/merge phù hợp. Ép rewrite toàn bộ chỉ để thấy ratio đẹp có thể tốn I/O hơn dung lượng tiết kiệm.

## 6. Map/JSON: promoted columns cho hot fields

```sql
SELECT
    properties['campaign'] AS campaign,
    count()
FROM ecommerce.events
WHERE mapContains(properties, 'campaign')
GROUP BY campaign;
```

Nếu `campaign` xuất hiện trong dashboard thường xuyên, promote thành cột:

```sql
ALTER TABLE ecommerce.events
    ADD COLUMN IF NOT EXISTS campaign LowCardinality(String)
    MATERIALIZED properties['campaign'];
```

Với raw JSON dạng `String`:

```sql
SELECT
    JSONExtractString('{"campaign":"summer","score":7}', 'campaign') AS campaign,
    JSONExtractUInt('{"campaign":"summer","score":7}', 'score') AS score;
```

Native `JSON`/Object features và cú pháp có thay đổi giữa versions; khóa version, test schema inference và không để input tùy ý tạo vô hạn dynamic paths.

## 7. Cardinality, sorting và compression liên quan nhau

```sql
SELECT
    category,
    count(),
    uniqExact(product_id),
    min(event_time),
    max(event_time)
FROM ecommerce.events
GROUP BY category;
```

Đặt dimension lặp lại gần nhau trong sorting key thường giúp nén, nhưng sorting key trước hết phải phục vụ predicate. Đừng hy sinh read pruning quan trọng chỉ để tăng compression vài phần trăm.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| `LowCardinality(T)` | Dictionary encoding | High-cardinality/giá trị churn làm dictionary overhead; tiny parts tạo nhiều dictionary nhỏ. |
| cardinality | Số distinct | Cardinality toàn table thấp nhưng theo block/part khác nhau vẫn ảnh hưởng dictionary và merge. |
| `Nullable(T)` | Null mask + nested values | `count(col)` khác `count()`; đổi NULL thành 0 làm sai average/rate. |
| sentinel | Giá trị đại diện missing | `1970-01-01`, 0 hay empty có thể là giá trị thật, gây ambiguity không thể sửa downstream. |
| `Delta` | Lưu sai phân | Cột không monotonic theo sorting order làm delta lớn và nén kém. |
| `DoubleDelta` | Sai phân bậc hai | Timestamp jitter/random hoặc out-of-order giảm lợi ích rõ rệt. |
| `Gorilla` | Codec cho Float time series | NaN/pattern nhảy mạnh nén kém; phải benchmark với signal thật. |
| `T64` | Bit transpose numeric | Miền giá trị rộng/random có thể không tốt hơn mặc định. |
| `ZSTD(level)` | Nén mạnh hơn | Level cao tăng CPU ingest/merge; disk tiết kiệm nhưng query latency có thể xấu. |
| `LZ4` | Codec nhanh mặc định | Chuyển tất cả sang ZSTD không chắc tốt khi workload CPU-bound. |
| codec chain | Transform rồi compress | Codec không tương thích type sẽ bị từ chối; schema migration phải test trên representative data. |
| `ALTER MODIFY CODEC` | Codec cho data mới | Không tự recompress toàn bộ old parts; so ratio ngay dễ kết luận sai. |
| `Map` | Thuộc tính động | Mỗi query hot key parse/read map; typo key trả default và che lỗi producer. |
| JSON String | Raw semi-structured payload | Parse mọi query tốn CPU; type drift (`7` thành `"7"`) trả default/error tùy hàm/settings. |
| promoted column | Cột typed từ hot path | MATERIALIZED expression mới không tự có physical stream trong old parts nếu chưa materialize; đọc vẫn tính từ expression. |

## Bài thực hành

Tạo hai bảng 10 triệu rows, một dùng String/default codec và một dùng LowCardinality + codec. So sánh compressed bytes, insert time, group-by time và CPU. Kết luận dựa trên bốn số, không chỉ dung lượng.
