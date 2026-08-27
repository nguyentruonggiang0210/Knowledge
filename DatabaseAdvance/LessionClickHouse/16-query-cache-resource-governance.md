# 16 - Query cache và quản trị tài nguyên

## Mục tiêu

- Dùng query result cache có chủ đích và nhận biết kết quả stale.
- Tách workload dashboard, ad-hoc và backfill bằng settings profile/workload scheduling.
- Phân biệt limit, quota, fair scheduling và capacity planning.
- Quan sát cache/scheduler bằng system tables thay vì suy đoán.

## 1. Query cache không mặc định bật

ClickHouse query cache lưu **kết quả** của `SELECT`, không phải data pages. Mỗi query phải opt-in bằng `use_query_cache = 1`.

Lab sau xóa cache, chạy cùng query hai lần rồi kiểm tra hit/miss:

```sql
SYSTEM CLEAR QUERY CACHE;

SELECT category, sum(price * quantity) AS revenue
FROM ecommerce.events
GROUP BY category
ORDER BY category
SETTINGS
    use_query_cache = 1,
    query_cache_ttl = 60,
    query_cache_min_query_duration = 0;

SELECT category, sum(price * quantity) AS revenue
FROM ecommerce.events
GROUP BY category
ORDER BY category
SETTINGS
    use_query_cache = 1,
    query_cache_ttl = 60,
    query_cache_min_query_duration = 0;

SELECT query, result_size, stale, expires_at
FROM system.query_cache;

SELECT event, value
FROM system.events
WHERE event IN ('QueryCacheHits', 'QueryCacheMisses')
ORDER BY event;
```

`query_cache_min_query_duration = 0` chỉ để query nhỏ của lab được ghi cache. Production nên chỉ cache query đủ đắt; nếu cache mọi query rẻ, lookup/eviction overhead và RAM có thể lớn hơn phần tiết kiệm.

## 2. Tái hiện bug stale result

Query cache **không được invalidated theo transaction** khi table có insert/mutation. Chạy nguyên block:

```sql
DROP TABLE IF EXISTS ecommerce.cache_demo;
CREATE TABLE ecommerce.cache_demo (id UInt64) ENGINE = MergeTree ORDER BY id;
INSERT INTO ecommerce.cache_demo VALUES (1);

SYSTEM CLEAR QUERY CACHE;

SELECT count() AS rows
FROM ecommerce.cache_demo
SETTINGS
    use_query_cache = 1,
    query_cache_ttl = 300,
    query_cache_min_query_duration = 0;

INSERT INTO ecommerce.cache_demo VALUES (2);

-- Có thể vẫn trả 1 vì cùng query đọc kết quả cache chưa hết TTL.
SELECT count() AS rows
FROM ecommerce.cache_demo
SETTINGS
    use_query_cache = 1,
    query_cache_ttl = 300,
    query_cache_min_query_duration = 0;

SYSTEM CLEAR QUERY CACHE;

-- Sau clear trả 2.
SELECT count() AS rows
FROM ecommerce.cache_demo
SETTINGS
    use_query_cache = 1,
    query_cache_ttl = 300,
    query_cache_min_query_duration = 0;

DROP TABLE ecommerce.cache_demo;
```

Scenario phù hợp: dashboard doanh thu refresh mỗi phút, chấp nhận dữ liệu trễ 30 giây. Scenario không phù hợp: kiểm tra đơn vừa thanh toán, fraud alert hay reconciliation cần fresh boundary.

## 3. Read/write cache độc lập và an toàn

```sql
-- Warm cache nhưng không dùng entry cũ cho lần chạy này.
SELECT count()
FROM ecommerce.events
SETTINGS
    use_query_cache = 1,
    enable_reads_from_query_cache = 0,
    enable_writes_to_query_cache = 1,
    query_cache_min_query_duration = 0;

-- Chỉ đọc cache, không tạo entry mới khi miss.
SELECT count()
FROM ecommerce.events
SETTINGS
    use_query_cache = 1,
    enable_reads_from_query_cache = 1,
    enable_writes_to_query_cache = 0;
```

Cache mặc định tách theo user. Cho nhiều users chia cache có thể tăng hit rate nhưng cũng có nguy cơ một user nhận kết quả tạo dưới quyền/row policy khác. Chỉ share sau khi test RBAC và tenant isolation.

Query có hàm nondeterministic như `now()`, `today()`, `rand()` hay external dictionary lookup thường không được cache mặc định. Đừng ép cache chúng chỉ để tăng hit rate: key giống nhau không có nghĩa dữ liệu ngoài vẫn giống nhau.

Mỗi server giữ cache riêng. Qua load balancer, request kế tiếp sang replica khác có thể miss; query cache không phải distributed cache và warm một node không warm cả cluster.

## 4. Quan sát query cache

```sql
SELECT
    query,
    result_size,
    tag,
    expires_at,
    stale,
    shared,
    compressed
FROM system.query_cache
ORDER BY expires_at;

SYSTEM FLUSH LOGS;

SELECT
    event_time,
    query_id,
    query_duration_ms,
    query_cache_usage
FROM system.query_log
WHERE type = 'QueryFinish'
  AND event_time >= now() - INTERVAL 10 MINUTE
ORDER BY event_time DESC
LIMIT 20;

SELECT metric, value
FROM system.metrics
WHERE metric IN ('QueryCacheEntries', 'QueryCacheBytes');
```

So hit rate cùng latency và bytes saved. Hit rate cao trên query vốn 2 ms không tạo nhiều giá trị; cache một result rất lớn có thể tốn memory/network serialization và đẩy entry hữu ích ra ngoài.

## 5. Bốn lớp resource governance

| Lớp | Trả lời câu hỏi | Không thay thế được |
|---|---|---|
| Query settings | Một query được dùng bao nhiêu thread/RAM/time? | Fairness giữa nhiều nhóm đang tranh tài nguyên. |
| Settings profile | Gán bộ settings ổn định theo user/role | Giới hạn tổng usage theo khoảng thời gian. |
| Quota | User đã tiêu bao nhiêu queries/errors/rows trong interval? | Peak RAM hay CPU scheduling tức thời. |
| Workload scheduler | Nhóm nào được ưu tiên/fair-share khi contention? | Capacity plan và hard business admission queue. |

Hard limits bảo vệ node nhưng limit quá cao nhân số query đồng thời vẫn OOM. Ví dụ 20 queries × `max_memory_usage = 4 GB` không phù hợp node 32 GB.

## 6. Workload scheduling chạy trên ClickHouse 26.3

Tạo CPU resource và hai workload con:

```sql
DROP WORKLOAD IF EXISTS dashboard;
DROP WORKLOAD IF EXISTS backfill;
DROP WORKLOAD IF EXISTS all;
DROP RESOURCE IF EXISTS cpu;

CREATE RESOURCE cpu (MASTER THREAD, WORKER THREAD);
CREATE WORKLOAD all;
CREATE WORKLOAD dashboard IN all SETTINGS weight = 3;
CREATE WORKLOAD backfill IN all SETTINGS weight = 1;

SELECT name, parent, create_query
FROM system.workloads
ORDER BY name;

SELECT count()
FROM numbers(100000)
SETTINGS workload = 'dashboard';
```

`weight = 3` và `weight = 1` là chia sẻ tương đối khi có cạnh tranh, **không phải** dashboard luôn nhận đúng 75% CPU hay backfill bị cap 25%. Khi chỉ backfill chạy, nó có thể dùng phần tài nguyên rảnh.

CPU scheduling thay đổi cách thread được cấp phát; muốn CPU time fairness/preemption mạnh hơn còn phụ thuộc server configuration. Hãy load-test đúng build/config trước khi tuyên bố isolation.

## 7. Gán workload bằng settings profile

```sql
DROP SETTINGS PROFILE IF EXISTS lesson16_dashboard;

CREATE SETTINGS PROFILE lesson16_dashboard
SETTINGS
    workload = 'dashboard',
    max_threads = 4,
    max_memory_usage = 1000000000,
    max_execution_time = 30
TO student;

SELECT profile_name, setting_name, value
FROM system.settings_profile_elements
WHERE profile_name = 'lesson16_dashboard'
ORDER BY setting_name;
```

Production nên gán profile vào role như `bi_dashboard`, không gán rời từng user. Tách ít nhất:

- dashboard: timeout ngắn, threads/RAM có giới hạn, workload ưu tiên;
- analyst ad-hoc: timeout vừa, concurrency kiểm soát;
- backfill: workload thấp hơn, spill/throttle và window riêng;
- service ingestion: không bị query ad-hoc chiếm hết resource pools.

Cleanup lab:

```sql
DROP SETTINGS PROFILE IF EXISTS lesson16_dashboard;
DROP WORKLOAD IF EXISTS dashboard;
DROP WORKLOAD IF EXISTS backfill;
DROP WORKLOAD IF EXISTS all;
DROP RESOURCE IF EXISTS cpu;
```

## 8. Theo dõi scheduler và contention

```sql
SELECT * FROM system.resources;
SELECT * FROM system.workloads;
SELECT * FROM system.scheduler;

SELECT
    user,
    count() AS running,
    sum(memory_usage) AS memory,
    sum(elapsed) AS elapsed_seconds
FROM system.processes
GROUP BY user
ORDER BY memory DESC;
```

`system.scheduler` là snapshot node-local; query cluster phải đọc từng replica. Alert nên kết hợp queue/wait, CPU saturation, memory tracker, query failures, merge backlog và ingestion lag. Nếu chỉ giảm priority backfill nhưng nó vẫn bão hòa disk bằng spill/merge, dashboard vẫn chậm.

## 9. Query cache và scheduler trong cluster

- Cache và scheduler state là node-local; cấu hình drift giữa replicas tạo latency khó giải thích.
- Workload name phải tồn tại trên mọi node nhận query; deploy DDL/config theo cluster và kiểm tra backlog.
- Distributed query dùng coordinator và remote nodes; limit ở coordinator không phải lúc nào bao phủ toàn bộ memory/threads ở mọi remote shard.
- Resource weights giải quyết contention tương đối, không sửa sharding skew hay một coordinator phải merge result quá lớn.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| query cache | Cache kết quả SELECT | Insert/mutation không invalidate entry; query correctness-sensitive có thể đọc stale. |
| `use_query_cache` | Opt-in cache | Bật toàn profile mà không lọc workload làm cache đầy bởi ad-hoc queries gần như không lặp. |
| `query_cache_ttl` | Tuổi entry | TTL là trade-off freshness; đặt 5 phút cho fraud alert là lỗi nghiệp vụ, không chỉ lỗi tuning. |
| cache hit | Trả entry có sẵn | Hit node-local; load balancer sang replica khác vẫn miss và tạo latency sawtooth. |
| cache sharing | Dùng entry giữa users | Row policy/role/tenant khác nhau có thể gây leak nếu chia sẻ thiếu kiểm thử. |
| nondeterministic query | Kết quả đổi dù text giống | Ép cache `now()`/dictionary lookup trả snapshot cũ ngoài kỳ vọng. |
| `SYSTEM CLEAR QUERY CACHE` | Xóa cache node hiện tại | Clear một replica không clear cả cluster; chạy thường xuyên phá hit rate và tạo thundering herd. |
| settings profile | Bộ limit theo role/user | Gán profile sai role hoặc cho user override setting làm guardrail không còn hiệu lực. |
| `max_memory_usage` | Limit memory một query | N query mỗi query dưới limit vẫn có thể OOM node; cần concurrency/capacity control. |
| quota | Budget theo interval | Quota không phải scheduler; query đầu interval vẫn có thể chiếm hết CPU/RAM. |
| resource | Tài nguyên scheduler quản lý | Chỉ quản CPU mà bỏ disk/network khiến backfill vẫn phá SLO dashboard. |
| workload | Nhánh scheduler | Query không được gán workload rơi ngoài policy mong muốn hoặc lỗi tùy cấu hình. |
| weight | Fair-share tương đối | Bị hiểu thành hard cap/phần trăm cố định; lúc không contention semantics khác. |
| distributed query | Coordinator + remote stages | Profile/config không đồng nhất giữa nodes làm limit và hành vi khác nhau. |

## Bài thực hành

Sinh `events_bench` đủ lớn để query 1–3 giây. Chạy 10 dashboard queries song song với một backfill. Đo p95/p99, CPU, memory, merges ở ba chế độ: không policy; chỉ limits; workload scheduling + profiles. Sau đó bật cache với TTL 30 giây và chứng minh cả latency benefit lẫn độ trễ dữ liệu tối đa.

## Tài liệu chính thức

- [Query cache](https://clickhouse.com/docs/operations/query-cache)
- [Workload scheduling](https://clickhouse.com/docs/operations/workload-scheduling)
- [`system.query_cache`](https://clickhouse.com/docs/reference/system-tables/query_cache)
- [`system.resources`](https://clickhouse.com/docs/reference/system-tables/resources)
- [`system.workloads`](https://clickhouse.com/docs/reference/system-tables/workloads)
- [`system.scheduler`](https://clickhouse.com/docs/reference/system-tables/scheduler)
