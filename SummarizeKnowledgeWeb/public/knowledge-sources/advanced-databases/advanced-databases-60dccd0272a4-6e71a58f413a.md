# ClickHouse — Đề tự kiểm tra từ cơ bản đến nâng cao

Ngân hàng có 45 câu, tổng 150 điểm: CH-01..CH-30 là core 90 điểm; CH-31..CH-45 là curriculum expansion 60 điểm. Nên làm thành hai phiên 180 phút và 90 phút. Các câu giả định ClickHouse 26.3 LTS; nếu dùng phiên bản khác, ghi rõ khác biệt bạn quan sát.

## Dữ liệu thực hành chung

Chạy bằng clickhouse-client trong container. Dataset 500.000 rows; giảm numbers(500000) nếu máy thiếu RAM.

~~~sql
DROP DATABASE IF EXISTS quiz_ch;
CREATE DATABASE quiz_ch;
USE quiz_ch;

CREATE TABLE events
(
    event_date Date MATERIALIZED toDate(event_time),
    event_time DateTime64(3, 'UTC'),
    event_id UUID,
    tenant_id UInt32,
    user_id UInt64,
    event_type LowCardinality(String),
    properties Map(String, String),
    revenue Decimal(12, 2),
    ingested_at DateTime64(3, 'UTC') DEFAULT now64(3, 'UTC')
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (tenant_id, event_date, event_type, user_id, event_time, event_id);

INSERT INTO events
    (event_time, event_id, tenant_id, user_id, event_type, properties, revenue)
SELECT
    now64(3, 'UTC') - toIntervalSecond(number % 7776000),
    generateUUIDv4(),
    toUInt32(1 + number % 20),
    toUInt64(1 + number % 50000),
    arrayElement(['view', 'click', 'purchase'], 1 + number % 3),
    map('device', arrayElement(['mobile', 'desktop', 'tablet'], 1 + number % 3)),
    toDecimal64(if(number % 3 = 2, (number % 10000) / 100.0, 0), 2)
FROM numbers(500000);

SELECT version(), count(), formatReadableSize(sum(bytes_on_disk))
FROM system.parts
WHERE database = 'quiz_ch' AND table = 'events' AND active;
~~~

Lưu baseline:

~~~sql
SELECT count(), min(event_time), max(event_time), uniqExact(tenant_id), uniqExact(user_id)
FROM events;

SELECT partition, count() AS active_parts, sum(rows) AS rows,
       formatReadableSize(sum(bytes_on_disk)) AS disk
FROM system.parts
WHERE database = 'quiz_ch' AND table = 'events' AND active
GROUP BY partition ORDER BY partition;
~~~

## A. Multiple choice — chọn và giải thích

### CH-01 — Workload

ClickHouse phù hợp nhất với:

A. Update từng row trong transaction ngân hàng nhiều lần/giây  
B. Scan/aggregate nhiều hàng, đọc ít cột, dữ liệu append-heavy  
C. Hàng nghìn foreign key cascade  
D. Serializable transaction qua nhiều bảng

### CH-02 — ORDER BY

Trong MergeTree, ORDER BY chủ yếu quyết định:

A. Thứ tự hiển thị mặc định của mọi SELECT  
B. Cách dữ liệu được sắp trong part và sparse primary index  
C. Unique constraint tuyệt đối  
D. Thứ tự merge replica trên network

### CH-03 — Partition key

Partition theo event_id duy nhất cho bảng event lớn thường gây:

A. Ít partition, merge tốt hơn  
B. Quá nhiều partition/part và metadata overhead  
C. Tự deduplicate toàn bảng  
D. Mọi query thành index-only scan

### CH-04 — Primary index

Phát biểu đúng là:

A. Primary key MergeTree mặc định bảo đảm uniqueness  
B. Primary index thường sparse theo granule, giúp bỏ qua range dữ liệu  
C. Mỗi row có một B-tree entry như OLTP  
D. Primary index chỉ dùng cho JOIN

### CH-05 — FINAL

SELECT ... FINAL trên ReplacingMergeTree:

A. Bắt buộc cho mọi query ClickHouse  
B. Áp logic merge/dedup khi đọc nhưng có thể tốn CPU/RAM và đọc nhiều hơn  
C. Xóa vĩnh viễn duplicate ngay lập tức  
D. Tạo materialized view tự động

### CH-06 — Mutation

ALTER TABLE ... UPDATE/DELETE mutation thường:

A. Là row update tức thời như OLTP  
B. Rewrite data parts bất đồng bộ và có thể rất nặng  
C. Không dùng disk I/O  
D. Luôn rollback đa bảng

### CH-07 — Materialized view

Một materialized view kiểu trigger trong ClickHouse mặc định xử lý:

A. Mọi row lịch sử của source ngay khi CREATE  
B. Block mới được INSERT sau khi view được tạo  
C. Mọi mutation trên source như CDC đầy đủ  
D. Dữ liệu từ mọi replica hai lần

### CH-08 — Nullable

So với non-nullable + default/sentinel có kiểm soát, Nullable thường:

A. Không có chi phí nào  
B. Có null mask và có thể hạn chế/tăng chi phí một số xử lý  
C. Tự tăng compression mọi trường hợp  
D. Bắt buộc cho mọi dimension

### CH-09 — LowCardinality

LowCardinality(String) thường hữu ích nhất khi:

A. Cột có tập giá trị lặp lại tương đối nhỏ như event_type  
B. Mỗi giá trị là UUID duy nhất  
C. Cột cần transaction lock  
D. Cột chứa binary blob ngẫu nhiên

### CH-10 — PREWHERE

PREWHERE giúp:

A. Đọc cột filter trước rồi chỉ đọc thêm cột cho granule/row còn lại  
B. Biến mọi query thành unique lookup  
C. Thay thế partition key  
D. Đồng bộ replica

## B. Explain why

### CH-11 — Parts và background merge

Giải thích vì sao mỗi INSERT tạo part, background merge tồn tại để làm gì, và vì sao nhiều insert cực nhỏ dẫn tới lỗi too many parts hoặc ingest latency.

### CH-12 — Sparse index và granule

Giải thích mark/granule, vì sao ORDER BY đúng access pattern có thể giảm rows read nhiều bậc, và vì sao điều kiện trên cột thứ ba không luôn tận dụng tốt key nếu thiếu prefix.

### CH-13 — ReplacingMergeTree

Vì sao ReplacingMergeTree là eventual dedup chứ không phải unique constraint? version và is_deleted giải quyết gì, FINAL/argMax giải quyết gì ở thời điểm đọc?

### CH-14 — Aggregate states

Phân biệt sum(x), sumState(x), sumMerge(state) và kiểu SimpleAggregateFunction/AggregateFunction. Vì sao lưu state sai kiểu dẫn tới query hoặc merge sai?

### CH-15 — Replicated và Distributed

Phân biệt ReplicatedMergeTree với Distributed table: thành phần nào lưu bản sao, thành phần nào route/fan-out query, và sharding khác replication thế nào?

## C. Hidden bugs — tìm, tái hiện, sửa

### CH-16 — Partition cardinality quá cao

Review DDL:

~~~sql
CREATE TABLE bad_events
(
  event_id UUID,
  event_time DateTime64(3),
  tenant_id UInt32,
  payload String
)
ENGINE = MergeTree
PARTITION BY event_id
ORDER BY (tenant_id, event_time);
~~~

Nêu failure mode, query kiểm tra và DDL hợp lý hơn.

### CH-17 — Small inserts

Producer gửi từng event một qua HTTP. system.parts tăng hàng chục nghìn active part. Đề xuất cách sửa ở producer/server và metric xác minh.

### CH-18 — Retry tạo duplicate

Client timeout sau INSERT và retry cùng batch nhưng batch được serialize khác thứ tự. Vì sao automatic block dedup có thể không cứu được? Thiết kế event identity và query serving để chịu retry.

### CH-19 — Materialized view backfill

Team tạo materialized view, bắt đầu ingest live, sau đó chạy INSERT INTO target SELECT ... FROM source cho toàn lịch sử. Dashboard bị double count một khoảng thời gian. Hãy thiết kế quy trình backfill không chồng lấn và phép đối soát.

### CH-20 — JOIN dùng giá trị mặc định

Một LEFT JOIN trả 0/chuỗi rỗng ở cột phía phải thay vì NULL, khiến downstream hiểu nhầm “customer_id = 0” là dữ liệu thật. Nêu setting/schema/query cần kiểm tra và cách mô hình hóa an toàn.

### CH-21 — DELETE phạm vi lớn

Team chạy ALTER TABLE events DELETE WHERE event_date < today() - 365 trên bảng nhiều TB đúng giờ cao điểm. Nêu vì sao nguy hiểm, cách theo dõi và thiết kế retention tốt hơn.

## D. SQL writing

### CH-22 — Thiết kế bảng event

Viết DDL MergeTree cho event SaaS với query chính:

- luôn lọc tenant_id;
- lọc khoảng event_time;
- thường lọc event_type;
- group theo ngày và event_type;
- giữ 180 ngày.

Giải thích type, PARTITION BY, ORDER BY, TTL và codec; không partition theo tenant nếu có hàng trăm nghìn tenant.

### CH-23 — Latest state

Từ stream có các cột tenant_id, entity_id, version, updated_at, status, amount, viết query trả state mới nhất mỗi entity mà không phụ thuộc background merge. Xử lý tie version thế nào?

### CH-24 — Funnel đơn giản

Từ events, tính số user của tenant 7 có view rồi click rồi purchase theo đúng thứ tự trong 7 ngày. Dùng windowFunnel và nêu hạn chế của kết quả.

### CH-25 — Materialized aggregate

Tạo target AggregatingMergeTree và materialized view để lưu daily unique users cùng revenue theo tenant/event_type. Viết query đọc state đúng cách.

### CH-26 — Sampling/approximation

Viết query daily active users dùng exact và approximate distinct. Nêu cách benchmark độ lệch, memory và thời gian trước khi chọn hàm.

## E. Plan và system-table analysis

Mỗi câu phải nêu evidence, giả thuyết, query kiểm chứng và thay đổi/rollback.

### CH-27 — Pruning chưa tốt

Giả sử EXPLAIN indexes = 1 cho query tenant + date trả:

~~~text
Indexes:
  MinMax
    Keys: event_date
    Parts: 6/6
    Granules: 6100/6100
  Partition
    Keys: toYYYYMM(event_date)
    Parts: 2/6
    Granules: 2100/6100
  PrimaryKey
    Keys: tenant_id, event_date
    Condition: tenant_id = 7 AND event_date in [20260801, 20260901)
    Parts: 2/2
    Granules: 130/2100
~~~

Phân tích hiệu quả từng tầng. Cần thêm data-skipping index không?

### CH-28 — Part explosion

~~~text
partition  active_parts  rows_per_part_p50  rows_per_part_p95
202608     18420         1                  12
202607     9600          2                  20
~~~

Viết query system.parts/system.merges cần dùng, tìm root cause và thứ tự remediation.

### CH-29 — Query đọc quá nhiều

Một dòng system.query_log có read_rows = 8.2 tỷ, result_rows = 120, memory_usage = 18 GB, query_duration_ms = 84.000. Query GROUP BY tenant_id, user_id chỉ lọc properties['campaign'] = 'summer'. Hãy phân tích vì sao ORDER BY hiện tại không giúp nhiều và đưa ra ba hướng thiết kế.

### CH-30 — Distributed skew

Một Distributed query có ba shard kết thúc trong 4 giây, shard còn lại 70 giây và đọc gấp 15 lần. CPU/RAM cluster còn dư trung bình. Nêu các nguyên nhân có thể, phép đo theo shard và cách sửa mà không chỉ “thêm node”.

## F. Curriculum expansion — CH-31..CH-45

Mỗi câu phần này tối đa 4 điểm: correctness, SQL/evidence, trade-off và production pitfall.

### CH-31 — Dictionary layout, refresh và missing key

Thiết kế dictionary product_dict từ bảng ecommerce.product_dimension trên một node. Chọn HASHED thay vì FLAT/CACHE trong điều kiện nào? Viết query đo stale/error/memory và lookup không nhập nhằng key thiếu.

### CH-32 — ANY/ALL, direct JOIN và algorithm

Dimension có duplicate product_id và một sản phẩm có nhiều tags. Vì sao LEFT ANY JOIN có thể nhanh nhưng sai? So sánh direct, parallel_hash, full_sorting_merge và grace_hash; viết phép benchmark/evidence cần lưu.

### CH-33 — file/S3 backfill idempotent

Một backfill đọc nhiều object theo glob và bị retry sau khi nửa số file đã insert. Dùng virtual filename/path và manifest thế nào để không nạp đôi? Phân biệt table function s3()/file() với S3Queue cho continuous ingestion.

### CH-34 — Kafka/Redpanda delivery và rejects

Thiết kế Kafka engine → materialized view → MergeTree cùng reject table khi parse lỗi. Giải thích vì sao offset commit + target insert không tạo exactly-once, cách dedup/reconcile và metric consumer lag cần có.

### CH-35 — Query cache stale result

Dashboard bật use_query_cache, INSERT thêm dữ liệu nhưng cùng SELECT vẫn trả count cũ. Tái hiện bằng SQL, giải thích freshness contract và cách quan sát hit/miss/entries.

### CH-36 — Workload scheduling và profiles

Tạo workload dashboard weight 3, backfill weight 1 và settings profile giới hạn dashboard 4 threads, 1 GB, 30 giây. Vì sao weight không phải hard 75/25 và quota không thay scheduler?

### CH-37 — Expand → migrate → contract

Bảng orders_live cần đổi amount Decimal thành amount_cents UInt64 trong khi writer/readers vẫn chạy. Viết release sequence, dual-write/backfill/reconcile và điều kiện được phép drop cột cũ.

### CH-38 — Shadow table, cutover và rollback

Đổi sorting key/type trên bảng lớn bằng shadow table. Viết query đối soát count/sum/hash theo partition, lệnh cutover atomic phù hợp và rollback. Liệt kê dependencies có thể không tự đi theo intent đổi tên.

### CH-39 — Data-quality accepted/rejected pipeline

Vì sao CHECK TABLE không chứng minh dữ liệu nghiệp vụ đúng? Thiết kế raw ingest → clean/reject bằng materialized views, lưu reasons và quality metrics; nêu cách tránh cùng row vừa clean vừa reject.

### CH-40 — RBAC, row policy, quota và secrets

Thiết kế role dashboard chỉ đọc tenant được phép, settings profile/quota bảo vệ node và secret không nằm trong DDL dictionary. Viết các câu lệnh/kiểm tra chính và nêu bẫy distributed cluster.

### CH-41 — Backup, restore và monitoring

Viết backup một table lab vào disk đã cấu hình, restore dưới tên khác, đối soát và theo dõi disk/query errors. Vì sao replica hoặc BACKUP command thành công chưa đủ chứng minh recovery?

### CH-42 — Keeper, distributed queue và quorum

Một Distributed insert trả ACK nhưng một replica/shard chậm; queue tăng và query có thể thiếu dữ liệu. Phân biệt distributed_foreground_insert, insert_quorum, replication queue và skip_unavailable_shards. Viết query triage.

### CH-43 — PostgreSQL CDC cutover

Thiết kế snapshot + WAL stream không gap/duplicate, giữ transaction boundaries, xử lý schema add-column và heartbeat khi source im lặng. Viết reconciliation theo event_id/source_version và lag.

### CH-44 — EXPLAIN, spill và cancellation

JOIN lớn OOM ở parallel_hash. Dùng EXPLAIN PIPELINE/query_log/processes để quyết định grace_hash/full_sorting_merge hoặc giới hạn; viết cách cancel đúng query_id. Nêu vì sao kill không rollback mọi external effect.

### CH-45 — MergeTree-family correctness

So sánh SummingMergeTree, AggregatingMergeTree và CollapsingMergeTree. Viết một ví dụ cho thấy đọc part chưa merge vẫn cần GROUP BY + sumMerge/sign logic; vì sao OPTIMIZE FINAL không được dùng làm correctness protocol?

## Checklist nộp bài

- [ ] Phân biệt rõ partition pruning, primary-key pruning và skipping index.
- [ ] Không gọi ORDER BY của MergeTree là unique constraint.
- [ ] Mọi giải pháp dedup nêu rõ thời điểm consistency và retry semantics.
- [ ] Mọi aggregate state dùng đúng State/Merge và type target.
- [ ] Mọi đề xuất partition/order key dựa trên query pattern và cardinality.
- [ ] Đã đo rows/bytes read, parts, memory, elapsed thay vì chỉ nhìn thời gian.
- [ ] Distributed design phân biệt shard với replica và có failure scenario.
