# 06 — JSONB và full-text search

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| `json`/`jsonb` | payload linh hoạt nhưng core fields typed | JSONB operator/index mạnh; normalize/rewrite/TOAST và schema drift |
| Access/null semantics | phân biệt missing, JSON null, SQL NULL | Biểu đạt patch semantics; cast/type inconsistency dễ gây lỗi |
| Containment/JSONPath | filter facet/nested variant | Query cấu trúc linh hoạt; path rộng và operator mismatch tốn CPU |
| `jsonb_set`/merge | patch metadata | Atomic row update; cả document/GIN entries có thể bị rewrite |
| GIN/expression index | containment hoặc một scalar JSON hot | GIN tổng quát vs B-tree nhỏ/selective; mỗi index tăng ingest |
| Generated typed column | promote field JSON được query thường xuyên | Statistics/index tốt; storage/rewrite và logical replication caveat |
| Full-text search | token/ranking article/catalog | Built-in, transactional; dictionary/chất lượng tiếng Việt có giới hạn |
| `pg_trgm` | typo/fuzzy/substring | Hỗ trợ similarity/ILIKE; pattern ngắn/phổ biến có selectivity thấp |

## 1. `json` và `jsonb`

- `json` giữ gần nguyên text input, kể cả thứ tự key/whitespace; mỗi lần xử lý phải parse.
- `jsonb` lưu dạng nhị phân chuẩn hóa, hỗ trợ operator/index phong phú; key trùng chỉ giữ giá trị cuối.

```sql
DROP SCHEMA IF EXISTS document_lab CASCADE;
CREATE SCHEMA document_lab;

SELECT
    '{"a":1, "a":2}'::json  AS raw_json,
    '{"a":1, "a":2}'::jsonb AS normalized_jsonb;

CREATE TABLE document_lab.product (
    product_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku text NOT NULL UNIQUE,
    name text NOT NULL,
    price numeric(12,2) NOT NULL,
    attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (jsonb_typeof(attributes) = 'object')
);

INSERT INTO document_lab.product (sku, name, price, attributes) VALUES
('P-01', 'Bàn phím PostgreSQL', 120,
 '{"brand":"KeyLab","color":"blue","tags":["db","mechanical"],
   "variants":[{"name":"US","stock":10},{"name":"VN","stock":0}]}'),
('P-02', 'Sách Database', 40,
 '{"brand":"DataPress","color":"red","tags":["db","book"]}'),
('P-03', 'Khoá học SQL', 80,
 '{"brand":"DataPress","discount":null,"tags":["sql"]}');
```

**Tình huống thực tế:** Product có thuộc tính thay đổi theo category, trong khi SKU/name/price vẫn là typed columns để enforce constraint và thống kê tốt.

> **Bug ẩn / production — JSONB làm “schema-less”:** JSONB vẫn có schema, chỉ là schema dễ bị trì hoãn sang application. Cùng field có lúc number, lúc string làm query/cast lỗi. Validate ở write path, dùng `CHECK`/generated column cho field quan trọng và version payload khi format thay đổi.

## 2. Operator truy cập và ba loại “null”

```sql
SELECT
    sku,
    attributes -> 'brand' AS brand_json,
    attributes ->> 'brand' AS brand_text,
    attributes #>> '{variants,0,name}' AS first_variant
FROM document_lab.product;

SELECT
    sku,
    attributes ? 'discount' AS key_exists,
    attributes -> 'discount' = 'null'::jsonb AS is_json_null,
    attributes -> 'discount' IS NULL AS is_missing_or_sql_null
FROM document_lab.product
ORDER BY sku;
```

- SQL `NULL`: toàn column không có value (column ở đây đã `NOT NULL`).
- JSON `null`: key tồn tại và value là JSON null.
- Missing key: key không tồn tại; toán tử truy cập thường trả SQL `NULL`.

> **Bug ẩn / production — null:** `->>` biến cả JSON null và missing thành SQL `NULL`; nếu nghiệp vụ phân biệt “đã xóa” và “chưa gửi”, phải kiểm tra `?` trước.

> **Bug ẩn / production — cast:** `(attributes->>'stock')::int` lỗi nếu field là `''`, object hoặc text không phải số. Kiểm tra `jsonb_typeof`, validate lúc ghi hoặc đưa field thành typed column.

## 3. Containment và SQL/JSON path

```sql
SELECT sku, name
FROM document_lab.product
WHERE attributes @> '{"brand":"DataPress"}'::jsonb;

SELECT sku
FROM document_lab.product
WHERE attributes @> '{"tags":["db"]}'::jsonb;

SELECT sku
FROM document_lab.product
WHERE jsonb_path_exists(
    attributes,
    '$.variants[*] ? (@.stock > 0)'
);

SELECT sku,
       jsonb_path_query(attributes, '$.variants[*] ? (@.stock > 0)') AS variant
FROM document_lab.product;
```

**Tình huống thực tế:** Lọc catalog theo facets động hoặc tìm product có bất kỳ variant còn hàng.

> **Bug ẩn / production — containment semantics:** `@>` kiểm tra cấu trúc containment, không tương đương so text/sub-string. Array containment cũng không diễn đạt thứ tự. Viết test cho object lồng nhau, array, number/string và duplicate.

> **Bug ẩn / production — JSONPath:** Path quá rộng (`$**`) trên document lớn có thể CPU-heavy. Hạn chế độ sâu/kích thước payload và benchmark operator có index hỗ trợ.

## 4. Update JSONB

```sql
UPDATE document_lab.product
SET attributes = jsonb_set(
    attributes,
    '{color}',
    to_jsonb('green'::text),
    true
)
WHERE sku = 'P-01'
RETURNING sku, attributes;

UPDATE document_lab.product
SET attributes = attributes - 'discount'
WHERE sku = 'P-03'
RETURNING sku, attributes;
```

Thêm object cha và con theo cách rõ ràng:

```sql
UPDATE document_lab.product
SET attributes = attributes || '{"shipping":{"fragile":true}}'::jsonb
WHERE sku = 'P-02';
```

> **Bug ẩn / production — write amplification:** Thay một key vẫn tạo row version mới và có thể ghi lại TOAST value/index entries. JSON document lớn, update thường xuyên gây WAL, bloat và GIN maintenance lớn. Tách dữ liệu mutable/hot thành table/column riêng.

> **Bug ẩn / production — `jsonb_set`:** `create_if_missing=true` tạo final key nhưng không bảo đảm tạo toàn bộ intermediate path thiếu. Test path không tồn tại; merge `||` cũng chỉ merge top-level và có thể thay cả nested object.

## 5. GIN và expression index cho JSONB

```sql
CREATE INDEX product_attributes_gin_idx
ON document_lab.product USING gin (attributes jsonb_path_ops);

CREATE INDEX product_brand_idx
ON document_lab.product ((attributes ->> 'brand'));

ANALYZE document_lab.product;

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM document_lab.product
WHERE attributes @> '{"brand":"DataPress"}'::jsonb;

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM document_lab.product
WHERE attributes ->> 'brand' = 'DataPress';
```

Bảng mẫu nhỏ có thể vẫn seq scan; đó là lựa chọn hợp lý. Dùng dataset lớn trước khi kết luận.

> **Bug ẩn / production — operator class:** `jsonb_path_ops` nhỏ/chuyên cho `@>` và jsonpath nhưng không hỗ trợ key-existence như default `jsonb_ops`. Chọn theo operator thật, không theo benchmark duy nhất.

## 6. Generated column đưa JSONB về typed data

```sql
ALTER TABLE document_lab.product
ADD COLUMN brand text
GENERATED ALWAYS AS (attributes ->> 'brand') STORED;

CREATE INDEX product_generated_brand_idx
ON document_lab.product (brand);

SELECT sku, brand
FROM document_lab.product
WHERE brand = 'DataPress';
```

**Tình huống thực tế:** Field JSON được filter/join liên tục nhưng vẫn cần giữ payload gốc và đồng bộ tự động.

> **Bug ẩn / production — generated column:** STORED tăng storage và write cost; thay expression cần table rewrite trong nhiều tình huống. Expression phải immutable. Nếu field là business invariant cốt lõi, column thường vẫn rõ hơn JSON + generated column.

## 7. Full-text search: `tsvector` và `tsquery`

```sql
CREATE TABLE document_lab.article (
    article_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    body text NOT NULL,
    published_at timestamptz NOT NULL DEFAULT now(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(body, '')), 'B')
    ) STORED
);

CREATE INDEX article_search_gin_idx
ON document_lab.article USING gin (search_vector);

INSERT INTO document_lab.article (title, body) VALUES
('PostgreSQL nâng cao', 'Tìm hiểu MVCC, index và execution plan'),
('Vận hành database', 'Backup, phục hồi và giám sát PostgreSQL'),
('ClickHouse căn bản', 'Phân tích dữ liệu dạng cột');

SELECT
    article_id,
    title,
    ts_rank_cd(search_vector, websearch_to_tsquery('simple', 'PostgreSQL index')) AS rank
FROM document_lab.article
WHERE search_vector @@ websearch_to_tsquery('simple', 'PostgreSQL index')
ORDER BY rank DESC, article_id;
```

- `to_tsvector`: normalize/tokenize document.
- `plainto_tsquery`: biến text thường thành query an toàn.
- `websearch_to_tsquery`: cú pháp thân thiện kiểu web, không ném syntax error với raw input.
- `@@`: match vector với query.
- `ts_rank`/`ts_rank_cd`: tính relevance; cần tie-breaker ổn định.

```sql
SELECT title,
       ts_headline(
           'simple',
           body,
           websearch_to_tsquery('simple', 'backup PostgreSQL'),
           'MaxFragments=2, MaxWords=12, MinWords=5'
       ) AS snippet
FROM document_lab.article
WHERE search_vector @@ websearch_to_tsquery('simple', 'backup PostgreSQL');
```

> **Bug ẩn / production — cấu hình ngôn ngữ:** PostgreSQL chuẩn không có stemmer tiếng Việt đầy đủ. `simple` tokenizes nhưng không xử lý mọi biến thể/dấu như search engine chuyên dụng. Đo chất lượng trên corpus tiếng Việt thật; có thể cần normalization, dictionary/extension được đánh giá, hoặc search system riêng.

> **Bug ẩn / production — config mismatch:** Vector tạo với `'simple'` nhưng query bằng `'english'` cho token khác và bỏ lỡ kết quả. Cố định regconfig ở cả write/query/index.

> **Bug ẩn / production — headline:** `ts_headline` xử lý document gốc và có thể tốn CPU; output chứa text người dùng, UI vẫn phải escape HTML để tránh XSS.

## 8. Fuzzy/substring với `pg_trgm`

Full-text không phải substring search. Extension miễn phí `pg_trgm` hỗ trợ similarity và `LIKE`/`ILIKE` patterns.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX article_title_trgm_idx
ON document_lab.article USING gin (title gin_trgm_ops);

SELECT title, similarity(title, 'Postgres nang cao') AS score
FROM document_lab.article
WHERE title % 'Postgres nang cao'
ORDER BY score DESC, article_id;

SELECT title
FROM document_lab.article
WHERE title ILIKE '%database%';
```

> **Bug ẩn / production — fuzzy input:** Pattern rất ngắn/phổ biến có selectivity thấp và vẫn tốn nhiều CPU/heap fetch. Giới hạn độ dài/rate, pagination và timeout. Similarity threshold là business tuning, không có một giá trị đúng cho mọi ngôn ngữ.

## Bài tập

1. Tạo constraint/type validation cho `variants[*].stock`; thử payload sai để thấy giới hạn của `CHECK` JSONPath.
2. So index size và plan giữa `jsonb_ops`, `jsonb_path_ops`, expression B-tree.
3. Benchmark update một key trong document 1 KB và 1 MB; quan sát WAL/bloat.
4. Xây 20 câu tìm kiếm tiếng Việt, đo precision/recall tương đối của FTS `simple` và trigram.
