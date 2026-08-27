# 02 - Kiểu dữ liệu và thiết kế schema phân tích

## Mục tiêu

- Chọn type nhỏ, chính xác và phù hợp phép tính.
- Phân biệt `DEFAULT`, `MATERIALIZED`, `ALIAS`.
- Biết khi nào denormalize, khi nào JOIN/dictionary.
- Tránh lỗi tiền tệ, timezone, null và schema tiến hóa.

## 1. Numeric: đúng miền giá trị trước, tiết kiệm sau

```sql
SELECT
    toTypeName(toUInt16(65000)) AS unsigned_type,
    toTypeName(toInt32(-10)) AS signed_type,
    toDecimal64('19.99', 2) * 3 AS exact_money,
    0.1::Float64 + 0.2::Float64 AS floating_result;
```

Dùng:

- `UInt*` khi giá trị không âm và đã kiểm tra upper bound;
- `Int*` khi có số âm;
- `Decimal(P,S)` cho tiền/giá trị cần fixed scale;
- `Float*` cho đo lường xấp xỉ, khoa học, telemetry.

Decimal có precision/scale và quy tắc promotion. Khi cộng/nhân nhiều trường, kiểm tra type kết quả:

```sql
SELECT
    toTypeName(price) AS price_type,
    toTypeName(price * quantity) AS line_total_type,
    sum(price * quantity) AS revenue
FROM ecommerce.events
GROUP BY price, quantity
LIMIT 3;
```

## 2. Date, DateTime64 và timezone

Storage mẫu dùng UTC:

```sql
SELECT
    event_time AS utc_time,
    toTimeZone(event_time, 'Asia/Ho_Chi_Minh') AS local_time,
    toDate(event_time, 'Asia/Ho_Chi_Minh') AS local_date
FROM ecommerce.events
ORDER BY event_time
LIMIT 3;
```

`DateTime64(3, 'UTC')` giữ milliseconds và timezone là metadata diễn giải/hiển thị; timestamp vẫn là một thời điểm. Business day theo Việt Nam phải tính với timezone Việt Nam, không dùng `event_date` UTC nếu báo cáo yêu cầu ngày địa phương.

## 3. String, FixedString, UUID, Enum và IP

```sql
SELECT
    country,
    length(country) AS bytes,
    toTypeName(country),
    toTypeName(event_id)
FROM ecommerce.events
LIMIT 3;
```

- `String`: độ dài biến đổi, có thể chứa byte bất kỳ.
- `FixedString(N)`: đúng N bytes; hợp mã cố định thật sự, nhưng so sánh/hiển thị có padding zero.
- `UUID`: 16 bytes thay vì UUID text.
- `IPv4`/`IPv6`: compact và có hàm network.
- `Enum8/Enum16`: chặt nhưng đổi mapping cần cẩn trọng; `LowCardinality(String)` thường dễ tiến hóa hơn cho dimension.

## 4. Array, Tuple, Map và Nested

```sql
SELECT
    event_id,
    properties['campaign'] AS campaign,
    mapKeys(properties) AS property_keys
FROM ecommerce.events
WHERE mapContains(properties, 'campaign');

SELECT
    arrayJoin(['view', 'add_cart', 'purchase']) AS funnel_step,
    indexOf(['view', 'add_cart', 'purchase'], funnel_step) AS step_number;
```

`Map(K,V)` linh hoạt cho thuộc tính thưa nhưng đọc một key có thể vẫn cần đọc map stream đáng kể. Field lọc/group thường xuyên nên là cột typed riêng. `Nested` biểu diễn nhiều array song song; mọi array con phải có cùng length trên một row.

## 5. Nullable và giá trị vắng mặt

```sql
SELECT
    cast(NULL, 'Nullable(UInt32)') AS missing,
    coalesce(missing, 0) AS displayed,
    isNull(missing) AS was_missing;
```

`NULL`, zero, empty string và “unknown” khác nghĩa. Chỉ bỏ `Nullable` khi domain có sentinel rõ ràng và downstream hiểu sentinel. `Nullable(T)` lưu thêm null mask và có thể làm một số tối ưu/type path phức tạp hơn.

## 6. DEFAULT, MATERIALIZED, ALIAS

```sql
CREATE TABLE ecommerce.expression_demo
(
    ts DateTime64(3, 'UTC'),
    amount Decimal(12, 2),
    tax_rate Decimal(5, 4) DEFAULT 0.1000,
    event_date Date MATERIALIZED toDate(ts),
    gross Decimal(14, 2) ALIAS amount * (1 + tax_rate)
)
ENGINE = MergeTree
ORDER BY (event_date, ts);

INSERT INTO ecommerce.expression_demo (ts, amount)
VALUES ('2025-01-01 00:00:00.000', 100.00);

SELECT ts, amount, tax_rate, event_date, gross
FROM ecommerce.expression_demo;
```

- `DEFAULT`: dùng expression khi insert thiếu cột, vẫn có thể insert giá trị riêng.
- `MATERIALIZED`: expression được tính và lưu; client thường không insert trực tiếp.
- `ALIAS`: tính lúc đọc, không lưu.

## 7. Denormalization theo query pattern

`events` đã copy `category`, `country`, `device` vào fact. Điều này tránh JOIN dimension trong mọi dashboard.

```sql
SELECT
    e.category,
    count() AS purchases,
    sum(e.price * e.quantity) AS revenue
FROM ecommerce.events AS e
WHERE e.event_type = 'purchase'
GROUP BY e.category;
```

Nếu dimension lớn, đổi thường xuyên hoặc cần thuộc tính “hiện tại”, cân nhắc regular JOIN, dictionary hay refreshable materialized view. Luôn xác định semantic: thuộc tính tại thời điểm event hay thuộc tính hiện tại.

## 8. Schema evolution an toàn

```sql
ALTER TABLE ecommerce.events
    ADD COLUMN IF NOT EXISTS app_version LowCardinality(String) DEFAULT 'unknown';

SELECT app_version, count()
FROM ecommerce.events
GROUP BY app_version;
```

Thêm column metadata thường nhanh; materialize giá trị vào old parts là thao tác khác và có thể rewrite. Test consumer đọc `SELECT *` vì thêm cột có thể làm mapping theo vị trí bị vỡ.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| `UInt8/16/32/64` | Số nguyên không dấu | Cast số âm/overflow có thể wrap hoặc lỗi tùy đường parse; validate ở boundary. |
| `Decimal(P,S)` | Fixed-point | Nhân/chia tăng scale/precision; overflow có thể chỉ xuất hiện ở tổng doanh thu lớn. |
| `Float64` | Floating point | `0.1 + 0.2` không chính xác tuyệt đối; không dùng so sánh equality hoặc kế toán. |
| `Date` | Ngày không giờ | `toDate(timestamp)` dùng timezone; event gần nửa đêm dễ rơi sai business day. |
| `DateTime64` | Timestamp sub-second | Producer gửi local time nhưng gắn UTC làm lệch dữ liệu mà không báo lỗi. |
| `String` | Byte string biến độ dài | Dùng String cho numeric/date khiến parse mỗi query, sorting lexical sai (`'10' < '2'`). |
| `FixedString(N)` | Chuỗi đủ N byte | Padding zero làm equality/export khó hiểu; mã Unicode không phải N ký tự mà là N bytes. |
| `UUID` | ID 128-bit | UUID v4 random nằm đầu sorting key phá locality và data skipping. |
| `Enum` | Mapping label ↔ integer | Reuse cùng numeric code cho label mới diễn giải lại lịch sử; migration phải additive/cẩn trọng. |
| `Array` | Danh sách typed | `arrayJoin` nhân số row và có thể làm nổ memory/cardinality. |
| `Map` | Cặp key/value động | Đẩy mọi field vào Map tạo schema-on-read chậm và không rõ contract. |
| `Nested` | Arrays song song | Array length lệch làm insert fail; ingest pipeline phải validate atomic. |
| `Nullable` | Tách null bằng mask | `NOT IN`/JOIN với NULL có semantics dễ bất ngờ; null mask cũng tăng storage/read path. |
| `DEFAULT` | Giá trị khi thiếu input | Thay DEFAULT chỉ ảnh hưởng insert mới; old rows đọc giá trị cũ đã lưu nếu cột tồn tại trong part. |
| `MATERIALIZED` | Expression lưu vật lý | Đổi business rule không tự rewrite lịch sử; cần migration/backfill có kế hoạch. |
| `ALIAS` | Expression lúc đọc | Biểu thức nặng được tính lại mỗi query, không miễn phí vì “không lưu”. |
| denormalization | Copy dimension vào fact | Dimension đổi tên gây hai sự thật: historical label và current label; phải định nghĩa mong muốn. |
| `ALTER ADD COLUMN` | Tiến hóa schema | Client deserialize theo vị trí hoặc `SELECT *` có thể vỡ khi cột mới xuất hiện. |

## Bài thực hành

Thiết kế bảng `payments` gồm currency, amount, event timestamp, gateway payload và trạng thái. Giải thích vì sao chọn từng type; viết một query đổi UTC sang ngày kinh doanh Bangkok và tính tổng tiền chính xác.
