# ClickHouse — Đáp án và giải thích

Chỉ mở sau khi đã làm [đề ClickHouse](CLICKHOUSE_QUESTIONS.md). Ví dụ dùng ClickHouse 26.3; kiểm tra documentation/changelog khi chạy phiên bản khác.

## A. Multiple choice

### CH-01 — Đáp án B

**Vì sao:** ClickHouse là column-oriented OLAP database: compression tốt theo cột, vectorized execution và scan/aggregate lượng lớn dữ liệu append-heavy. Chỉ các cột được dùng mới cần đọc.

**Bẫy production:** latency thấp trên một analytical query không biến ClickHouse thành OLTP store. Không có transaction/constraint semantics giống PostgreSQL; giữ system of record ở hệ phù hợp.

### CH-02 — Đáp án B

**Vì sao:** ORDER BY xác định sort key bên trong mỗi data part và sparse primary index/marks, ảnh hưởng data locality, compression và pruning. SELECT không có ORDER BY vẫn không bảo đảm thứ tự output.

~~~sql
SHOW CREATE TABLE quiz_ch.events;
EXPLAIN indexes = 1
SELECT count() FROM quiz_ch.events
WHERE tenant_id = 7 AND event_date >= today() - 7;
~~~

**Bẫy production:** ORDER BY không phải unique constraint. Hai event cùng toàn bộ key vẫn có thể cùng tồn tại; dedup cần engine/query/idempotency riêng.

### CH-03 — Đáp án B

**Vì sao:** event_id gần như unique tạo số partition cực lớn; mỗi insert chạm nhiều partition/part, metadata và merge scheduling bùng nổ.

**Bẫy production:** partition càng nhỏ không đồng nghĩa query càng nhanh. Partition chủ yếu phục vụ lifecycle/coarse pruning; monthly/daily thường hợp lý hơn tùy volume và retention.

### CH-04 — Đáp án B

**Vì sao:** MergeTree lưu mark cho granule, không entry cho từng row. Primary-key condition loại granule/range chắc chắn không chứa dữ liệu cần đọc.

**Bẫy production:** lookup một ID ngẫu nhiên không theo prefix key vẫn có thể scan rộng. Bật force_primary_key chỉ làm query lỗi khi key không dùng được, không tự tối ưu schema.

### CH-05 — Đáp án B

**Vì sao:** FINAL hợp nhất logical versions khi đọc trước khi trả kết quả. Nó không buộc data parts trên disk merge vĩnh viễn ngay lúc SELECT.

~~~sql
SELECT count() FROM entity_state FINAL;
~~~

**Bẫy production:** gắn FINAL vào mọi dashboard có thể tăng read amplification, CPU/RAM và latency. Thiết kế query argMax/serving table hoặc bảo đảm partition/key phù hợp trước.

### CH-06 — Đáp án B

**Vì sao:** mutation tạo nhiệm vụ rewrite các parts chứa row cần đổi/xóa và hoàn tất bất đồng bộ theo từng part/replica.

~~~sql
SELECT database, table, mutation_id, command, parts_to_do, is_done, latest_fail_reason
FROM system.mutations
WHERE database = 'quiz_ch';
~~~

**Bẫy production:** mutation phạm vi lớn cạnh tranh I/O với merge và query, đồng thời có thể cần free disk gần bằng dữ liệu rewrite. “Lệnh trả về” không nhất thiết nghĩa mọi replica đã xong.

### CH-07 — Đáp án B

**Vì sao:** materialized view nhận các inserted blocks mới như insert trigger; CREATE không tự xử lý toàn lịch sử. Mutation/xóa ở source không tự đảo aggregate đã ghi ở target.

**Bẫy production:** POPULATE trong lúc live ingest có race window. Dùng cutoff rõ ràng, view cho live và backfill phần lịch sử không chồng lấn.

### CH-08 — Đáp án B

**Vì sao:** Nullable lưu thêm null mask và một số operation/codec tối ưu kém hơn. Nó vẫn đúng khi NULL có nghĩa nghiệp vụ khác default.

**Bẫy production:** thay NULL bằng 0/chuỗi rỗng để tối ưu có thể nhập nhằng “không biết” với giá trị thật. Chỉ dùng sentinel khi contract và valid-domain bảo đảm phân biệt.

### CH-09 — Đáp án A

**Vì sao:** dictionary encoding của LowCardinality giảm storage và tăng tốc group/filter với nhiều giá trị lặp như event_type, country, plan.

**Bẫy production:** UUID/url gần unique làm dictionary lớn và có thể tốn thêm CPU/memory. Cardinality thay đổi theo thời gian; đo system.columns và query benchmark.

### CH-10 — Đáp án A

**Vì sao:** PREWHERE đọc cột lọc sớm, rồi trì hoãn đọc các cột còn lại cho tập cần thiết; optimizer thường có thể tự di chuyển predicate.

**Bẫy production:** predicate không chọn lọc hoặc trên cột rất rộng/đắt vẫn có thể không lợi. PREWHERE không bù được ORDER BY sai và không bảo đảm ít rows read ở cấp granule.

## B. Explain why

### CH-11 — Parts và merge

**Đáp án:** mỗi INSERT vào MergeTree tạo một hoặc nhiều immutable part theo partition. Background merge kết hợp part cùng partition, sắp theo key, áp dụng engine semantics/TTL và giảm metadata/read amplification. Insert từng row tạo part nhanh hơn merge xử lý, dẫn đến quá nhiều part và ClickHouse throttling/reject insert để tự bảo vệ.

~~~sql
SELECT partition, count() AS active_parts, sum(rows) AS rows,
       round(rows / active_parts, 1) AS rows_per_part
FROM system.parts
WHERE active AND database = 'quiz_ch' AND table = 'events'
GROUP BY partition ORDER BY active_parts DESC;

SELECT database, table, elapsed, progress,
       formatReadableSize(memory_usage) AS memory
FROM system.merges
WHERE database = 'quiz_ch';
~~~

**Bẫy production:** OPTIMIZE TABLE ... FINAL liên tục không sửa producer và có thể tạo merge khổng lồ. Batch/async inserts là sửa root cause.

### CH-12 — Sparse index và granule

**Đáp án:** một granule thường chứa nhiều row; mark trỏ tới vị trí dữ liệu nén và primary index lưu key quanh mỗi granule. Với ORDER BY (tenant_id, event_date, event_type, user_id), equality tenant + range date định vị dải nhỏ. Chỉ lọc event_type thiếu tenant/date có cùng value rải khắp key nên khó loại granule.

~~~sql
EXPLAIN indexes = 1
SELECT count() FROM quiz_ch.events
WHERE tenant_id = 7
  AND event_date >= today() - 7
  AND event_type = 'purchase';
~~~

**Bẫy production:** đặt cột cardinality cao đầu tiên chỉ vì “chọn lọc” có thể phá các query phổ biến và compression. Thứ tự key phải dựa filter prefix, range và locality toàn workload.

### CH-13 — ReplacingMergeTree

**Đáp án:** engine chỉ loại version trùng key khi relevant parts merge; thời điểm merge không xác định, nên duplicate vẫn đọc thấy trước đó. version chọn row lớn nhất; is_deleted biểu diễn tombstone khi dùng signature hỗ trợ. FINAL áp merge semantics lúc đọc; argMax chọn payload theo version mà không chờ merge.

~~~sql
CREATE TABLE entity_state
(
  tenant_id UInt32,
  entity_id UInt64,
  version UInt64,
  is_deleted UInt8,
  status LowCardinality(String),
  amount Decimal(12,2),
  updated_at DateTime64(3, 'UTC')
)
ENGINE = ReplacingMergeTree(version, is_deleted)
ORDER BY (tenant_id, entity_id);
~~~

**Bẫy production:** hai rows cùng key và version có winner không nên được coi là deterministic. Dùng version monotonic cùng tie-break/source contract; FINAL trên tập lớn có thể đắt.

### CH-14 — Aggregate states

**Đáp án:** sum(x) trả scalar hoàn chỉnh; sumState(x) trả binary state có type AggregateFunction(sum, T); sumMerge(state) kết hợp/finalize các state. SimpleAggregateFunction dùng khi state có cùng representation với kết quả và hàm hỗ trợ; AggregateFunction lưu state tổng quát.

~~~sql
SELECT toTypeName(sum(revenue)), toTypeName(sumState(revenue))
FROM quiz_ch.events;
~~~

**Bẫy production:** INSERT scalar vào cột AggregateFunction hoặc đọc state bằng sum thay vì sumMerge gây type error hoặc semantics sai. Aggregate-state binary representation cũng cần chú ý compatibility khi đổi version/hàm.

### CH-15 — Replicated và Distributed

**Đáp án:** ReplicatedMergeTree lưu và đồng bộ bản sao của local shard thông qua coordination service. Distributed table thường không giữ data parts; nó route INSERT và fan-out SELECT tới local tables trên shards. Sharding chia tập dữ liệu để scale dung lượng/compute; replication sao chép cùng tập để HA/read scale.

~~~text
Distributed table -> shard 1 local ReplicatedMergeTree -> replica 1A, 1B
                  -> shard 2 local ReplicatedMergeTree -> replica 2A, 2B
~~~

**Bẫy production:** Distributed không tự tạo HA và Replicated không tự chia tải theo shard. Sai sharding key gây skew; query qua mọi replica có thể double count nếu topology/config sai.

## C. Hidden bugs

### CH-16 — Partition cardinality

**Đáp án:** một UUID/partition tạo metadata explosion, nhiều tiny parts, open files và merge không thể kết hợp qua partition. Kiểm tra:

~~~sql
SELECT uniqExact(partition), count() AS active_parts,
       quantiles(0.5, 0.95)(rows) AS rows_per_part
FROM system.parts
WHERE database = 'quiz_ch' AND table = 'bad_events' AND active;
~~~

DDL hợp lý hơn:

~~~sql
CREATE TABLE good_events
(
  event_id UUID,
  event_time DateTime64(3, 'UTC'),
  event_date Date MATERIALIZED toDate(event_time),
  tenant_id UInt32,
  payload String
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (tenant_id, event_date, event_time, event_id);
~~~

**Vì sao:** monthly partition hỗ trợ retention/coarse pruning, sort key phục vụ tenant/time query.

**Bẫy production:** đổi DDL không tự rewrite bảng cũ; migration INSERT SELECT cần disk headroom, cutoff và đối soát trước swap.

### CH-17 — Small inserts

**Đáp án:** producer nên batch theo rows/bytes/time và giữ số partition mỗi batch nhỏ. Nếu không sửa ngay client, cân nhắc async inserts với wait_for_async_insert để server gom batch:

~~~sql
INSERT INTO quiz_ch.events
SETTINGS async_insert = 1, wait_for_async_insert = 1
VALUES (...);
~~~

Đo active parts, rows/part, insert latency, rejected/delayed inserts, system.merges và merge-pool queue trước/sau.

**Vì sao:** giảm số insert block làm ít part lớn hơn, để background merge theo kịp.

**Bẫy production:** wait_for_async_insert = 0 có thể trả thành công trước khi flush và thay đổi durability/error visibility. Tăng ngưỡng too-many-parts chỉ trì hoãn sự cố.

### CH-18 — Retry duplicate

**Đáp án:** block dedup nhận dạng inserted block/token trong một window; serialize lại khác thứ tự/kích thước có thể tạo block identity khác, và retry ngoài window cũng lọt. Mỗi event cần event_id ổn định từ source. Có thể dùng ReplacingMergeTree với ORDER BY business identity và version, hoặc serving query argMax/aggregate theo event_id; gửi insert_deduplication_token ổn định cho đúng logical batch khi phù hợp.

~~~sql
SELECT event_id, count() AS copies
FROM quiz_ch.events
GROUP BY event_id
HAVING copies > 1
ORDER BY copies DESC LIMIT 20;
~~~

**Vì sao:** idempotency phải gắn với logical event/batch, không dựa vào timeout response.

**Bẫy production:** dedup key sai scope có thể làm mất hai event hợp lệ; giữ event_id trong ORDER BY làm key rất rộng và ảnh hưởng locality, nên cân nhắc raw vs serving table.

### CH-19 — MV backfill

**Đáp án:** chọn cutoff T0 trên ingested_at đáng tin cậy. Tạo view để nhận inserts mới từ thời điểm đó; backfill target chỉ với source ingested_at < T0. Nếu không có watermark đáng tin, pause ingest ngắn hoặc ingest qua staging có sequence.

~~~sql
-- Minh họa đối soát theo khoảng; thay T0 bằng literal đã ghi lại
SELECT toDate(ingested_at) AS d, count(), sum(revenue)
FROM quiz_ch.events
WHERE ingested_at < toDateTime64('2026-08-27 12:00:00', 3, 'UTC')
GROUP BY d ORDER BY d;
~~~

Đối soát count/sum/uniq theo time bucket giữa source và target, đặc biệt hai bucket quanh T0; lưu query_id của backfill.

**Vì sao:** chia miền dữ liệu thành hai tập không giao nhau loại double count và gap.

**Bẫy production:** event_time không luôn là ingestion watermark vì late event. Mutation/source delete không tự retract aggregate target; cần correction pipeline.

### CH-20 — LEFT JOIN default

**Đáp án:** kiểm tra join_use_nulls. Khi bằng 0, unmatched right columns dùng default type; khi bằng 1, chúng trở thành Nullable và trả NULL.

~~~sql
SELECT getSetting('join_use_nulls');
SET join_use_nulls = 1;

SELECT e.event_id, c.customer_id
FROM events e
LEFT JOIN customers_dimension c ON c.customer_id = e.user_id
LIMIT 10;
~~~

Hoặc trả cột matched UInt8 rõ ràng từ dimension và không dùng 0 làm sentinel nếu 0 hợp lệ.

**Vì sao:** default semantics nhanh/đơn giản nhưng contract downstream phải biết; NULL semantics gần SQL chuẩn hơn.

**Bẫy production:** đổi setting có thể đổi type output và làm client/BI cache lỗi. JOIN nhiều version dimension còn có thể nhân rows; cần ANY/ASOF hoặc dedup dimension đúng nghĩa.

### CH-21 — DELETE lớn

**Đáp án:** mutation phải rewrite nhiều parts, tiêu thụ I/O/CPU/disk và cạnh tranh background merge; giờ cao điểm dễ tăng query/insert latency. Theo dõi:

~~~sql
SELECT mutation_id, command, create_time, parts_to_do, is_done, latest_fail_reason
FROM system.mutations
WHERE database = 'quiz_ch' AND table = 'events'
ORDER BY create_time DESC;

SELECT * FROM system.merges
WHERE database = 'quiz_ch' AND table = 'events';
~~~

Thiết kế retention bằng TTL và partition theo thời gian; khi toàn partition hết hạn, DROP PARTITION có metadata/part-level cost thấp hơn row mutation. Lập resource window và disk headroom.

**Bẫy production:** TTL cũng chạy qua merge, không “miễn phí” và không bảo đảm xóa đúng giây. Partition quá thô giữ dư dữ liệu; quá mịn gây part explosion.

## D. SQL writing

### CH-22 — Bảng event 180 ngày

**Đáp án tham khảo:**

~~~sql
CREATE TABLE saas_events_180d
(
  event_time DateTime64(3, 'UTC') CODEC(Delta, ZSTD(1)),
  event_date Date MATERIALIZED toDate(event_time),
  event_id UUID,
  tenant_id UInt32,
  user_id UInt64,
  event_type LowCardinality(String),
  revenue Decimal(12, 2) CODEC(ZSTD(1)),
  properties Map(String, String) CODEC(ZSTD(3))
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (tenant_id, event_date, event_type, user_id, event_time, event_id)
TTL event_time + INTERVAL 180 DAY DELETE;
~~~

**Vì sao:** tenant equality và date range là prefix chính; event_type tiếp theo hỗ trợ filter/group; monthly partition hợp lifecycle mà không nhân theo hàng trăm nghìn tenant. LowCardinality hợp event_type, Delta/ZSTD hợp time series.

**Bẫy production:** key quá rộng tăng primary-index/merge cost; user_id trước event_type có thể tốt hơn cho user-centric query. Benchmark workload thật và TTL disk pressure trước khi chốt.

### CH-23 — Latest state

**Đáp án:** giả sử có event_id ổn định làm tie-break:

~~~sql
SELECT
  tenant_id,
  entity_id,
  tupleElement(latest, 1) AS status,
  tupleElement(latest, 2) AS amount,
  tupleElement(latest, 3) AS updated_at
FROM
(
  SELECT
    tenant_id,
    entity_id,
    argMax(
      tuple(status, amount, updated_at),
      tuple(version, updated_at, event_id)
    ) AS latest
  FROM entity_updates
  GROUP BY tenant_id, entity_id
);
~~~

**Vì sao:** argMax xác định state khi đọc mà không chờ background merge; tuple weight tạo total order nếu version trùng.

**Bẫy production:** tie-break bằng ingestion time không ổn định khi replay. Query toàn raw history đắt; materialize state/aggregate projection sau khi semantics đã đúng.

### CH-24 — Funnel

**Đáp án:**

~~~sql
SELECT
  countIf(level >= 1) AS viewed_users,
  countIf(level >= 2) AS clicked_users,
  countIf(level >= 3) AS purchased_users
FROM
(
  SELECT
    user_id,
    windowFunnel(604800)(
      toDateTime(event_time),
      event_type = 'view',
      event_type = 'click',
      event_type = 'purchase'
    ) AS level
  FROM quiz_ch.events
  WHERE tenant_id = 7
    AND event_time >= now() - INTERVAL 7 DAY
  GROUP BY user_id
);
~~~

**Vì sao:** windowFunnel tìm chuỗi điều kiện theo thời gian trong cửa sổ giây cho từng user.

**Bẫy production:** câu này dùng cả filter 7 ngày và window 7 ngày; định nghĩa cohort/session/time-zone có thể khác. Event cùng timestamp và duplicate có thể làm thứ tự không như mong muốn.

### CH-25 — Materialized aggregate

**Đáp án:**

~~~sql
CREATE TABLE daily_event_agg
(
  d Date,
  tenant_id UInt32,
  event_type LowCardinality(String),
  users_state AggregateFunction(uniqCombined64, UInt64),
  revenue_state AggregateFunction(sum, Decimal(12, 2))
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(d)
ORDER BY (tenant_id, d, event_type);

CREATE MATERIALIZED VIEW daily_event_agg_mv
TO daily_event_agg
AS
SELECT
  event_date AS d,
  tenant_id,
  event_type,
  uniqCombined64State(user_id) AS users_state,
  sumState(revenue) AS revenue_state
FROM events
GROUP BY d, tenant_id, event_type;

SELECT
  d, tenant_id, event_type,
  uniqCombined64Merge(users_state) AS users,
  sumMerge(revenue_state) AS revenue
FROM daily_event_agg
WHERE tenant_id = 7
GROUP BY d, tenant_id, event_type
ORDER BY d, event_type;
~~~

**Vì sao:** MV tạo partial state theo insert block; AggregatingMergeTree và Merge functions kết hợp các block/parts đúng semantics.

**Bẫy production:** đọc trực tiếp một row state hoặc dùng sum trên state sẽ sai/type error. Backfill/live overlap và duplicate source inserts vẫn có thể double count revenue.

### CH-26 — Exact và approximate

**Đáp án:**

~~~sql
SELECT event_date,
       uniqExact(user_id) AS dau_exact,
       uniqCombined64(user_id) AS dau_approx
FROM quiz_ch.events
WHERE tenant_id = 7
GROUP BY event_date
ORDER BY event_date;
~~~

Chạy nhiều ngày/cardinality, ghi elapsed, peak memory, read_rows/bytes từ system.query_log và sai số abs/relative:

~~~sql
SELECT query_id, query_duration_ms, read_rows, read_bytes,
       memory_usage, result_rows
FROM system.query_log
WHERE type = 'QueryFinish' AND query_id = 'your-query-id';
~~~

**Vì sao:** uniqExact có state tăng theo cardinality; uniqCombined64 đổi accuracy lấy state giới hạn/nhỏ hơn.

**Bẫy production:** approximate value không thích hợp cho billing/audit nếu contract cần exact. Benchmark trên data distribution thật, không chỉ 500.000 row đồng đều của quiz.

## E. Plan và system-table analysis

### CH-27 — Pruning

**Đáp án:** MinMax không loại granule ở ví dụ; partition key loại 4/6 parts; primary key tiếp tục giảm từ 2.100 còn 130 granules, tức khoảng 93,8% trong partitions còn lại. Đây đã là pruning tốt cho tenant/date.

~~~sql
EXPLAIN indexes = 1
SELECT count() FROM quiz_ch.events
WHERE tenant_id = 7
  AND event_date >= toDate('2026-08-01')
  AND event_date < toDate('2026-09-01');
~~~

**Vì sao:** mỗi index layer có mẫu số khác; phải đọc Parts/Granules trước-sau, rồi so read_rows/read_bytes thực tế.

**Bẫy production:** thêm skipping index khi primary key đã loại 94% có thể tăng insert/merge mà gần như không lợi. Chỉ thêm cho predicate khác có selectivity/correlation đã benchmark.

### CH-28 — Part explosion

**Đáp án:** p50 1–2 rows/part chứng minh small inserts. Kiểm tra distribution và merge backlog:

~~~sql
SELECT partition, count() AS parts, sum(rows) AS rows,
       quantiles(0.5, 0.95, 0.99)(rows) AS rows_per_part,
       formatReadableSize(sum(bytes_on_disk)) AS disk
FROM system.parts
WHERE active AND database = 'quiz_ch' AND table = 'events'
GROUP BY partition ORDER BY parts DESC;

SELECT database, table, partition_id, elapsed, progress,
       num_parts, total_size_bytes_compressed
FROM system.merges
WHERE database = 'quiz_ch' AND table = 'events';
~~~

Remediation: giảm/điều tiết producer, batch rows/bytes, bật async insert có durability phù hợp, theo dõi parts giảm dần; chỉ sau đó cân nhắc window OPTIMIZE hoặc tuning merge pool.

**Vì sao:** nếu tốc độ tạo part vẫn lớn hơn merge, mọi tuning hậu kỳ sẽ lại quá tải.

**Bẫy production:** chạy OPTIMIZE FINAL trên partition nóng có thể chiếm I/O lâu và tạo part khổng lồ; tăng background threads có thể làm query latency xấu hơn.

### CH-29 — Query đọc quá nhiều

**Đáp án:** filter properties['campaign'] không nằm trong sort-key prefix và Map extraction phải đọc/giải mã data; sparse primary index không biết campaign để loại granule. 8,2 tỷ → 120 rows và 18 GB là read/aggregation amplification rõ ràng.

Ba hướng:

1. Extract campaign thành LowCardinality(String) materialized column, cân nhắc vị trí key cho workload mới và migrate data.
2. Thêm skipping index phù hợp như bloom filter/set nếu data/cardinality cho phép, benchmark granules dropped.
3. Tạo projection/serving aggregate theo campaign hoặc materialized view cho query dashboard ổn định.

~~~sql
SELECT query_duration_ms, read_rows, read_bytes, result_rows, memory_usage
FROM system.query_log
WHERE type = 'QueryFinish' AND query_id = 'the-query-id';
~~~

**Vì sao:** sửa ở data model/access path giảm dữ liệu trước GROUP BY, hiệu quả hơn chỉ tăng memory.

**Bẫy production:** bloom filter với campaign rất phổ biến hoặc mỗi granule chứa mọi campaign sẽ không skip. Materialized column/view chỉ tự áp dụng cho dữ liệu mới nếu không backfill.

### CH-30 — Distributed skew

**Đáp án:** cluster average che straggler. Nguyên nhân gồm sharding key gom hot tenant vào một shard, data/part lệch sau backfill, replica chậm do merge/mutation/disk, network, cache lạnh, replica selection hoặc query branch khác plan.

Đo cùng query_id theo từng node: elapsed, read_rows/bytes, memory, ProfileEvents; so system.parts, system.merges, system.mutations, disks và system.clusters. Có thể gọi clusterAllReplicas với quyền phù hợp để thu metric thống nhất.

~~~sql
SELECT hostName(), count() AS parts, sum(rows) AS rows,
       formatReadableSize(sum(bytes_on_disk)) AS disk
FROM clusterAllReplicas('your_cluster', system.parts)
WHERE active AND database = 'analytics' AND table = 'events'
GROUP BY hostName() ORDER BY rows DESC;
~~~

Sửa theo nguyên nhân: chọn shard key phân phối theo tenant+entity, tách hot tenant, reshard/rebalance có cutoff, pre-aggregate, repair replica/disk hoặc điều chỉnh replica policy. Đặt SLO theo slowest shard.

**Vì sao:** distributed query hoàn tất khi nhánh chậm hoàn tất; CPU trung bình còn dư không bác bỏ một shard quá tải.

**Bẫy production:** đổi sharding key chỉ cho insert mới tạo hai quy tắc phân phối nếu không migrate. Random sharding cân tải nhưng có thể fan-out mọi tenant query và làm dedup/join khó hơn.

## F. Curriculum expansion — CH-31..CH-45

### CH-31 — Dictionary layout và refresh

~~~sql
CREATE DICTIONARY ecommerce.product_dict
(
  product_id UInt64,
  product_name String,
  category String,
  list_price Decimal(12,2),
  active UInt8
)
PRIMARY KEY product_id
SOURCE(CLICKHOUSE(
  HOST '127.0.0.1' PORT 9000 USER 'student' PASSWORD 'student_pass'
  DB 'ecommerce' TABLE 'product_dimension'
))
LIFETIME(MIN 30 MAX 60)
LAYOUT(HASHED());

SELECT database, name, status, element_count, bytes_allocated,
       lifetime_min, lifetime_max, last_successful_update_time,
       error_count, last_exception
FROM system.dictionaries
WHERE database = 'ecommerce' AND name = 'product_dict';

SELECT product_id,
       dictHas('ecommerce.product_dict', product_id) AS found,
       dictGetOrDefault('ecommerce.product_dict', 'product_name',
                        product_id, 'unknown') AS product_name
FROM ecommerce.events
GROUP BY product_id;
~~~

**Vì sao:** HASHED phù hợp key phân tán và dimension vừa RAM; FLAT chỉ hợp integer key dày/range nhỏ; CACHE hợp working set nhỏ nhưng miss gọi source. dictHas tách missing khỏi attribute default thật.

**Bẫy production:** LIFETIME không phải freshness SLA; source lỗi có thể phục vụ bản cũ. Plaintext credentials chỉ dành lab—production dùng named collection/secret/TLS và read-only source user. Duplicate source key có thể bị che.

### CH-32 — JOIN semantics và algorithm

~~~sql
SELECT product_id, count() AS matches
FROM ecommerce.product_dimension
GROUP BY product_id HAVING matches != 1;

EXPLAIN PIPELINE
SELECT count()
FROM ecommerce.events e
INNER JOIN ecommerce.product_dimension p USING (product_id)
SETTINGS join_algorithm = 'parallel_hash';

SYSTEM FLUSH LOGS;
SELECT query_id, query_duration_ms, read_rows, memory_usage, exception_code
FROM system.query_log
WHERE type = 'QueryFinish' AND query LIKE '%product_dimension%'
ORDER BY event_time DESC LIMIT 10;
~~~

**Vì sao:** ANY giữ tối đa một match nên chỉ đúng với lookup one-to-one/first-match; ALL giữ multiplicity. direct lookup dictionary nhanh và giới hạn semantic; parallel_hash nhanh nếu right side vừa RAM; full_sorting_merge tận dụng order nhưng có sort cost; grace_hash spill buckets khi RAM hạn chế.

**Bẫy production:** ANY có thể che duplicate dimension hoặc làm mất tags one-to-many. Query 10 rows không chứng minh peak memory/spill; benchmark skew, cold/warm và concurrency.

### CH-33 — file/S3 idempotent backfill

~~~sql
CREATE TABLE ecommerce.ingested_objects
(
  object_path String,
  object_etag String,
  loaded_at DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(loaded_at)
ORDER BY (object_path, object_etag);

SELECT _path, _file, count() AS rows
FROM s3('https://example-bucket/public/events/*.parquet', Parquet)
GROUP BY _path, _file ORDER BY _path;
~~~

Một controlled backfill ghi manifest path + immutable ETag/version, chỉ chọn objects chưa acknowledged, insert dữ liệu có stable event_id, rồi reconcile count/sum/hash. Vì manifest insert và fact insert không phải transaction chung, retry vẫn phải an toàn ở event/serving layer.

**Vì sao:** file()/s3() là bounded pull phù hợp import/backfill; S3Queue theo dõi processed files cho continuous discovery/consumption.

**Bẫy production:** glob có thể thấy object mới/overwrite giữa hai lần list; path đơn độc không đủ identity. ReplacingMergeTree không unique tức thời và manifest concurrent workers cần ownership/coordination.

### CH-34 — Kafka/Redpanda pipeline

~~~sql
CREATE TABLE ecommerce.kafka_events_raw
(
  event_id UUID,
  event_time DateTime64(3, 'UTC'),
  user_id UInt64,
  event_type String
)
ENGINE = Kafka
SETTINGS kafka_broker_list = 'redpanda:9092',
         kafka_topic_list = 'ecommerce-events-v1',
         kafka_group_name = 'clickhouse-events-v1',
         kafka_format = 'JSONEachRow',
         kafka_handle_error_mode = 'stream';

CREATE MATERIALIZED VIEW ecommerce.kafka_events_mv
TO ecommerce.events_stream AS
SELECT event_id, event_time, user_id, event_type
FROM ecommerce.kafka_events_raw WHERE _error = '';

CREATE MATERIALIZED VIEW ecommerce.kafka_rejects_mv
TO ecommerce.kafka_rejects AS
SELECT _raw_message AS raw_message, _error AS error, now64(3) AS rejected_at
FROM ecommerce.kafka_events_raw WHERE _error != '';

SELECT database, table, consumer_id, assignments.topic,
       assignments.partition_id, assignments.current_offset,
       last_poll_time, last_commit_time, num_messages_read, exceptions.text
FROM system.kafka_consumers WHERE database = 'ecommerce';
~~~

**Vì sao:** Kafka engine consumes, MVs persist valid/rejected rows. Crash after target insert but before offset commit can replay; stable event_id, raw retention, serving dedup and bucket reconciliation provide at-least-once correctness. Lag needs broker end offset minus current offset plus event-to-ingest time/heartbeat.

**Bẫy production:** direct SELECT from Kafka table can advance consumer semantics; consumers vượt useful partitions không tăng throughput. Reject raw payload may contain PII and needs restricted retention/access.

### CH-35 — Query cache freshness

~~~sql
DROP TABLE IF EXISTS ecommerce.cache_demo;
CREATE TABLE ecommerce.cache_demo (id UInt64) ENGINE = MergeTree ORDER BY id;
INSERT INTO ecommerce.cache_demo VALUES (1);
SYSTEM CLEAR QUERY CACHE;

SELECT count() FROM ecommerce.cache_demo
SETTINGS use_query_cache=1, query_cache_ttl=300,
         query_cache_min_query_duration=0;
INSERT INTO ecommerce.cache_demo VALUES (2);
SELECT count() FROM ecommerce.cache_demo
SETTINGS use_query_cache=1, query_cache_ttl=300,
         query_cache_min_query_duration=0;

SELECT query, result_size, stale, expires_at FROM system.query_cache;
SELECT event, value FROM system.events
WHERE event IN ('QueryCacheHits','QueryCacheMisses');
~~~

**Vì sao:** cache lưu result và không transactionally invalidate theo INSERT/mutation. Dashboard phải định nghĩa TTL/staleness chấp nhận được; reconciliation/read-after-write thường không dùng cache.

**Bẫy production:** share cache giữa users có row policy khác có thể rò result nếu cấu hình sai. Mỗi node có cache riêng; hit rate cao trên query rẻ không chứng minh lợi ích.

### CH-36 — Workload scheduling

~~~sql
CREATE RESOURCE cpu (MASTER THREAD, WORKER THREAD);
CREATE WORKLOAD all;
CREATE WORKLOAD dashboard IN all SETTINGS weight = 3;
CREATE WORKLOAD backfill IN all SETTINGS weight = 1;

CREATE SETTINGS PROFILE dashboard_limits
SETTINGS workload='dashboard', max_threads=4,
         max_memory_usage=1000000000, max_execution_time=30
TO student;

SELECT * FROM system.resources;
SELECT * FROM system.workloads;
SELECT * FROM system.scheduler;
~~~

**Vì sao:** weight là fair-share tương đối khi contention, không phải hard percentage; workload rảnh cho phép workload khác dùng capacity. Profile gán per-query limits/workload; quota đếm usage theo interval, không schedule CPU tức thời.

**Bẫy production:** 20 queries × max_memory_usage 1 GB vẫn có thể làm node nhỏ OOM. Gán profile trực tiếp lab user có thể ảnh hưởng ingestion/admin; production tách role/workload và load-test đúng build/config.

### CH-37 — Expand, migrate, contract

~~~sql
ALTER TABLE ecommerce.orders_live
ADD COLUMN amount_cents Nullable(UInt64);

-- Deploy writer dual-write amount và amount_cents trước backfill.
ALTER TABLE ecommerce.orders_live
UPDATE amount_cents = toUInt64(roundBankers(amount * 100))
WHERE isNull(amount_cents);

SELECT countIf(isNull(amount_cents)) AS missing,
       countIf(amount_cents != toUInt64(roundBankers(amount * 100))) AS mismatch
FROM ecommerce.orders_live;
~~~

Release: expand nullable/additive; sink/readers chấp nhận cả schema; dual-write; backfill theo partition và monitor mutation; reconcile zero mismatch; chuyển readers; quan sát; đổi non-null/type nếu cần; chỉ drop amount sau rollback window và khi mọi producer/consumer/schema cache đã chuyển.

**Vì sao:** overlap compatible versions loại flag day và cho rollback ứng dụng.

**Bẫy production:** ALTER UPDATE là mutation async/rewrite, không phải row update rẻ. SELECT * và positional insert làm add/reorder column phá consumer; rounding/overflow phải có contract.

### CH-38 — Shadow table và cutover

~~~sql
SELECT _partition_id AS partition_id, count() AS rows, sum(amount_cents) AS cents,
       groupBitXor(cityHash64(order_id, amount_cents, currency)) AS checksum
FROM ecommerce.orders_shadow
GROUP BY _partition_id ORDER BY _partition_id;

-- Chạy aggregate tương đương trên source theo cùng cutoff.
EXCHANGE TABLES ecommerce.orders_live AND ecommerce.orders_shadow;

-- Rollback trong cửa sổ giữ bảng cũ:
EXCHANGE TABLES ecommerce.orders_live AND ecommerce.orders_shadow;
~~~

**Vì sao:** shadow table cho layout/type mới, backfill/reconcile độc lập; EXCHANGE đổi tên atomically cho một cặp table.

**Bẫy production:** MV, dictionary, grants, distributed tables, prepared statements/schema cache có thể bám object/name ngoài intent. Hash có collision và count+sum có thể cân bằng lỗi; mismatch phải drill-down key. Writes trong backfill cần cutoff/catch-up.

### CH-39 — Quality pipeline

~~~sql
CREATE TABLE ecommerce.quality_ingest
(
  event_id UUID,
  event_time DateTime64(3,'UTC'),
  amount Decimal(12,2),
  reasons Array(String)
)
ENGINE=MergeTree ORDER BY (event_time,event_id);

CREATE TABLE ecommerce.quality_clean
(
  event_id UUID,
  event_time DateTime64(3,'UTC'),
  amount Decimal(12,2)
)
ENGINE=MergeTree ORDER BY (event_time,event_id);

CREATE TABLE ecommerce.quality_reject
(
  event_id UUID,
  event_time DateTime64(3,'UTC'),
  amount Decimal(12,2),
  reasons Array(String)
)
ENGINE=MergeTree ORDER BY (event_time,event_id);

CREATE MATERIALIZED VIEW ecommerce.quality_clean_mv TO ecommerce.quality_clean AS
SELECT event_id,event_time,amount FROM ecommerce.quality_ingest
WHERE empty(reasons);

CREATE MATERIALIZED VIEW ecommerce.quality_reject_mv TO ecommerce.quality_reject AS
SELECT event_id,event_time,amount,reasons FROM ecommerce.quality_ingest
WHERE NOT empty(reasons);

SELECT count(), countIf(empty(reasons)) AS accepted,
       countIf(NOT empty(reasons)) AS rejected
FROM ecommerce.quality_ingest;
~~~

**Vì sao:** mutually exclusive predicates route every typed row đúng một path; reject giữ identity/reasons để repair/replay. CHECK TABLE xác minh structural readability/checksums, không business ranges, uniqueness hay cross-table invariant.

**Bẫy production:** hai MVs không commit atomically với nhau theo end-to-end business contract; schema/parse failure trước typed source cần raw quarantine. Rule change cần version để không giải thích lịch sử bằng rule mới.

### CH-40 — RBAC, policy, quota và secrets

~~~sql
CREATE ROLE dashboard_reader;
GRANT SELECT(event_date,event_type,tenant_id,revenue)
ON ecommerce.events TO dashboard_reader;
CREATE ROW POLICY tenant_7_events ON ecommerce.events
USING tenant_id = 7 TO dashboard_reader;

CREATE SETTINGS PROFILE dashboard_limits
SETTINGS max_memory_usage=1000000000, max_execution_time=30, max_threads=4
TO dashboard_reader;
CREATE QUOTA dashboard_hourly KEYED BY user_name
FOR INTERVAL 1 HOUR MAX queries=1000, errors=100, result_rows=10000000
TO dashboard_reader;

SHOW GRANTS FOR dashboard_reader;
SELECT * FROM system.row_policies;
~~~

Dictionary/external credentials nên đến từ named collection/config secret/secret manager với read-only identity và TLS, không hard-code trong Git/query URL.

**Vì sao:** GRANT giới hạn object/columns; policy lọc rows; profile giới hạn query; quota giới hạn usage theo interval—bốn lớp khác nhau.

**Bẫy production:** policy chỉ trên Distributed table nhưng local tables/user path vẫn truy cập được có thể bypass; deploy ON CLUSTER và test đúng user/active roles mọi node. Quota quá chặt gây retry storm.

### CH-41 — Backup và restore

~~~sql
BACKUP TABLE ecommerce.events
TO Disk('backups','events_assessment_001');

SELECT id,name,status,error,start_time,end_time,total_size,compressed_size
FROM system.backups ORDER BY start_time DESC;

CREATE DATABASE IF NOT EXISTS ecommerce_restore;
RESTORE TABLE ecommerce.events AS ecommerce_restore.events
FROM Disk('backups','events_assessment_001');

SELECT count(),min(event_time),max(event_time),sum(revenue)
FROM ecommerce_restore.events;

SELECT name, free_space, total_space FROM system.disks;
SELECT name,value,last_error_time,last_error_message
FROM system.errors WHERE value>0 ORDER BY last_error_time DESC;
~~~

**Vì sao:** restore sang namespace khác chứng minh artifact đọc được và cho phép invariant/checksum/query smoke test; RPO/RTO phải đo.

**Bẫy production:** replica sao chép accidental delete/mutation; backup status success chưa chứng minh RBAC/config/Keeper/keys hay restore chain đủ. Destination name phải unique và restore cần capacity.

### CH-42 — Distributed/Keeper triage

~~~sql
SELECT database,table,data_path,error_count,data_files,
       data_compressed_bytes,last_exception
FROM system.distribution_queue ORDER BY error_count DESC;

SELECT database,table,is_readonly,absolute_delay,queue_size,
       inserts_in_queue,merges_in_queue,total_replicas,active_replicas
FROM system.replicas ORDER BY absolute_delay DESC;

SELECT cluster,shard_num,replica_num,host_name,is_local,errors_count
FROM system.clusters ORDER BY cluster,shard_num,replica_num;
~~~

distributed_foreground_insert chờ remote shard nhận trước ACK nhưng timeout vẫn ambiguous; insert_quorum áp replication acknowledgements trong shard; replication queue/Keeper state theo dõi replica tasks. skip_unavailable_shards đổi availability lấy silent partial-result risk và không nên bật mù.

**Vì sao:** sharding delivery và intra-shard replication là hai tầng khác nhau.

**Bẫy production:** quorum timeout có thể xảy ra sau một số replica đã ghi, retry cần stable event identity. SYSTEM SYNC REPLICA trước mọi read biến lag thành latency/outage; Keeper quorum loss khác data replica loss.

### CH-43 — CDC cutover

**Đáp án:** connector lấy consistent snapshot cùng WAL position, stream từ đúng boundary, giữ event_id/source_version/transaction metadata, advance checkpoint sau durable sink ACK và reconcile trước publish dashboard.

~~~sql
SELECT count() - uniqExact(event_id) AS duplicate_copies,
       max(source_version) AS max_version,
       max(source_commit_ts) AS latest_source,
       max(ingested_at) AS latest_ingest,
       dateDiff('second', latest_source, latest_ingest) AS transport_seconds
FROM ecommerce.orders_cdc_raw;

SELECT cityHash64(order_id)%100 AS bucket,
       uniqExact(event_id) AS events,
       max(source_version) AS version,
       groupBitXor(cityHash64(order_id,source_version,is_deleted)) AS checksum
FROM ecommerce.orders_cdc_raw GROUP BY bucket ORDER BY bucket;
~~~

Add-column: sink hiểu field mới, ClickHouse add compatible column/default, producer phát field, consumer không SELECT *, rồi backfill/contract. Heartbeat định kỳ tách source im lặng khỏi pipeline chết. Transaction atomic visibility cần buffer commit marker hoặc chấp nhận eventual window rõ.

**Bẫy production:** snapshot rồi mới bật WAL mất changes; stream trước nhưng thiếu version cho phép snapshot cũ overwrite update mới. Slot bỏ quên giữ WAL tới đầy PostgreSQL source.

### CH-44 — EXPLAIN, spill và cancellation

~~~sql
EXPLAIN PIPELINE
SELECT count()
FROM ecommerce.events e
JOIN ecommerce.large_dimension d USING (product_id)
SETTINGS join_algorithm='parallel_hash';

SELECT query_id,user,elapsed,memory_usage,read_rows,query
FROM system.processes ORDER BY memory_usage DESC;

KILL QUERY WHERE query_id='verified-query-id' SYNC;

SYSTEM FLUSH LOGS;
SELECT query_id,query_duration_ms,read_rows,read_bytes,memory_usage,
       exception_code,exception
FROM system.query_log
WHERE query_id='verified-query-id';
~~~

Nếu right side không vừa RAM, đẩy filter/projection sớm, thử grace_hash để bucket/spill hoặc full_sorting_merge khi order giúp; giới hạn max_memory_usage/max_threads và benchmark disk/latency.

**Vì sao:** plan + actual query log xác nhận peak/read/error; cancellation nhắm đúng query_id thay restart node.

**Bẫy production:** spill cứu OOM nhưng có thể bão hòa disk; kill query không undo message đã consume, external call hay insert block đã commit. Average node memory che peak per shard.

### CH-45 — MergeTree family

~~~sql
-- SummingMergeTree vẫn phải aggregate khi parts chưa merge:
SELECT key, sum(value) FROM sums GROUP BY key;

-- AggregatingMergeTree đọc state bằng Merge function:
SELECT key, sumMerge(value_state) FROM states GROUP BY key;

-- CollapsingMergeTree cần sign semantics:
SELECT key, sum(Sign) AS alive, sum(value * Sign) AS net
FROM changes GROUP BY key HAVING alive != 0;
~~~

**Vì sao:** Summing cộng numeric rows cùng sorting key khi merge; Aggregating kết hợp AggregateFunction states; Collapsing triệt state/cancel pairs theo Sign. Background merge không có deadline correctness.

**Bẫy production:** key/sign/version sai làm mất hoặc nhân state; SELECT FINAL/OPTIMIZE FINAL trên data lớn đắt và inserts tương lai lại tạo unmerged rows. Query serving phải đúng trước merge.

## Tự đánh giá sau khi chấm

- Sai CH-01–04/08–12/16/22/27: ôn storage layout, type, partition và sort key.
- Sai CH-05–07/13–14/18–21/23–25: ôn eventual processing, dedup, aggregate state và lifecycle.
- Sai CH-15/28–30: ôn ingestion/merge pressure và distributed operations.
- Sai CH-26/29: ôn cách đo exact/approx và thiết kế serving path.
- Sai CH-31/32: ôn dictionary freshness, JOIN semantics và algorithm.
- Sai CH-33/34/43: ôn object storage, streaming at-least-once và CDC/reconciliation.
- Sai CH-35–41/44: ôn cache, scheduling, evolution, quality, RBAC, restore và cancellation.
- Sai CH-42/45: ôn Keeper/distributed delivery và MergeTree-family correctness.

Hãy làm lại câu sai trên dữ liệu skew: một tenant chiếm trên 50%, event_type lệch và insert batch không đều. Dataset đồng đều thường che đúng những bug production khó nhất.
