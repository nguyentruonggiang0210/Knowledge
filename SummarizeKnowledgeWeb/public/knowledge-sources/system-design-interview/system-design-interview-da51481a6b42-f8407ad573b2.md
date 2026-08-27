# Bài 25 — LLD/HLD và distributed-system interview

## Bar senior

Trong 45–60 phút: biến ambiguity thành requirement/SLO, estimate scale, thiết kế API/data/high-level flow, deep-dive bottleneck/failure/consistency/security/operations và bảo vệ trade-off. [Sizing/building-block sample](../SourceSamples/25-system-design/src/main/java/course/systemdesign/SystemDesignDemo.java).

## 1. Framework HLD timeboxed

| Phút | Nội dung | Output |
|---:|---|---|
| 0–5 | clarify scope/users/use cases | functional + out-of-scope |
| 5–10 | NFR/SLO/constraints | QPS, latency, availability, consistency, retention |
| 10–15 | estimate | traffic, concurrency, storage, bandwidth, hot key/headroom |
| 15–22 | API/event + data model | contract, idempotency, indexes/partition key |
| 22–32 | high-level flow | components, read/write path, ownership |
| 32–47 | deep dive | scale, cache, queue, consistency, failures |
| 47–55 | security/observability/deploy/cost | production completeness |
| 55–60 | bottleneck/trade-off/recap | alternatives và evolution |

Không đọc template như robot; interviewer có thể muốn deep dive sớm. Luôn xác nhận priority.

## 2. Estimation nhanh nhưng hữu ích

- Average QPS = daily operations / 86.400; peak factor dựa workload, không mặc định 10× vô căn cứ.
- Concurrent requests ≈ throughput × latency (Little's Law stable-state).
- Storage = records × bytes × retention × replication/index/overhead; tách hot/cold.
- Bandwidth = payload × QPS; fan-out/amplification/cache hit làm thay đổi.
- Availability: 99.9% ~ 43,8 phút downtime/tháng, nhưng error budget được đo theo SLI/window thực.

Estimate để tìm dominant constraint và justify design, không cần giả precision. Nêu assumptions và sensitivity.

## 3. Data/API trước boxes

API nêu auth, idempotency, pagination, error/retry/version. Data model nêu invariant, access pattern, index, transaction boundary, retention. Chọn database từ:

- relational/transaction/query vs key-value/document/search/analytics;
- read/write ratio, data size/growth/key distribution;
- consistency/staleness/multi-region;
- operational maturity/cost/rebuild.

Cache, queue, search index, materialized view là thêm vì một bottleneck/requirement cụ thể, không phải icon bắt buộc.

## 4. Failure-first deep dive

Với mỗi arrow hỏi:

- timeout trước/sau commit thì caller biết gì?
- duplicate/reorder/partial result?
- pool/queue/shard/full disk/quota saturation?
- retry amplification và idempotency key?
- dependency/zone/region outage, failover consistency/RPO/RTO?
- deploy N/N+1, schema/event compatibility?
- metric/alert/reconciliation/manual repair?

Backpressure/load shedding/bulkhead bảo vệ capacity. Queue buffer burst nhưng backlog vẫn là debt: estimate drain rate và freshness SLO.

## 5. Case-study question bank

### URL shortener

ID generation/collision, redirect latency, hot URL/cache, abuse/expiry/custom alias, analytics eventual, multi-region.

### Distributed rate limiter

identity/limit/window/burst/accuracy, token bucket, atomic update, clock/skew, sharding/hot tenant, fail-open/closed.

### Notification platform

preference/consent, template/version, fan-out, provider quota, retry/dedup, scheduled delivery, DLQ/status/callback, PII.

### Order/payment/inventory

stock invariant, idempotency, transaction/outbox, saga/compensation, payment result unknown, reservation expiry, reconciliation/audit.

### Event ingestion/metrics

partition key, producer backpressure, schema, dedup/order, aggregation/window/late data, hot/cold retention, query path.

### Feed/search

fan-out-on-write/read, celebrity hot key, ranking/freshness, privacy delete, index lag/rebuild/pagination.

Mỗi case thiết kế một phiên single-region trước, sau đó interviewer mới thêm multi-region. Đừng tự tạo complexity không được yêu cầu.

## 6. LLD/OOD method

1. Use case/actors/invariant/concurrency/persistence scope.
2. Public API bằng domain language.
3. Core objects/value types/ownership/state transitions.
4. Extension points chỉ cho variation thật (strategy/policy/port), composition trước inheritance.
5. Error/result/idempotency/thread-safety/test boundary.
6. Walk scenario + edge; refactor pressure point.

Pattern là vocabulary, không goal:

- Strategy cho policy thay đổi; State cho transition behavior; Decorator cho cross-cutting composition.
- Factory khi creation phức tạp; Adapter tại external boundary; Observer/event khi one-to-many và lifecycle rõ.
- Repository là domain-facing collection abstraction, không giấu mọi query qua generic CRUD.
- Singleton thường là lifecycle do DI container, không global mutable pattern.

LLD prompts: parking lot (allocation/concurrency), job scheduler (time/retry/lease), workflow engine (state/idempotency), payment router (strategy/failure), LRU+TTL cache (invariants/concurrency), feature flag (evaluation/cache/audit).

### C# → Java design mapping

Design principle chuyển được, nhưng idiom khác: Java record/sealed/interface/default method, package boundary, checked exception, generic variance; C# property/event/delegate/async/struct/explicit interface. Không dùng Java pattern để giả lập feature C# nếu Java idiom đơn giản hơn.

## 7. Rubric HLD 0–4

| Dimension | Weight | Hard signal |
|---|---:|---|
| requirements/SLO | 10% | scope/priority rõ |
| estimation | 10% | assumptions + dominant constraint |
| API/data | 10% | invariant/idempotency/index |
| high-level design | 15% | flow/ownership coherent |
| deep dive | 15% | bottleneck có evidence |
| consistency/failure | 15% | no happy-path-only |
| scale/HA | 10% | hotspot/failover/recovery |
| security/observability/operations | 10% | deploy/run/incident aware |
| trade-off communication | 5% | alternatives/consequences |

Hard fail senior nếu không nói partial failure/consistency/bottleneck/recovery.

### Rubric LLD 0–4

| Dimension | Weight | 3/4 senior signal |
|---|---:|---|
| requirements/invariants | 15% | khóa use case, state rule và out-of-scope |
| public API/domain model | 15% | domain language rõ, ownership/value type đúng |
| correctness/state transitions | 15% | walk được happy + invalid + recovery path |
| cohesion/encapsulation/extensibility | 15% | extension point theo pressure thật, không pattern soup |
| concurrency/consistency | 10% | thread-safety/atomic boundary được định nghĩa |
| error/idempotency/lifecycle | 10% | result/error/retry/resource semantics rõ |
| testability/observability | 10% | clock/port/state seam và critical tests |
| trade-off/communication | 10% | alternatives/consequences, nhận hint tốt |

Hard fail LLD nếu không xác định invariant, chỉ vẽ class không walk scenario, hoặc concurrency làm phá correctness. Với mọi rubric: 0 sai/không signal; 1 cần nhiều gợi ý; 2 happy path mức Middle; 3 độc lập đạt Senior; 4 chủ động phát hiện ambiguity và hệ quả bậc hai.

## Lab/mocks

1. Làm 4 case: URL shortener, rate limiter, order platform, event ingestion; ghi assumptions trước diagram.
2. Mỗi case inject ba failure: timeout-after-commit, hot key, region/downstream outage.
3. Làm hai LLD trong 45 phút; code một critical invariant bằng Java sau diagram.
4. Record session, chấm rubric; chỉ remediate hai dimension thấp nhất trước mock tiếp.

## Quiz

1. Có nên chọn Kafka/Redis trước khi estimate/use case?
2. Queue làm mất overload?
3. Multi-region active-active luôn tăng availability thực tế?
4. Pattern càng nhiều chứng minh LLD càng senior?

<details><summary>Đáp án/rubric</summary>

1. Không; chọn component từ requirement/access/failure/cost.
2. Không; buffer và decouple, backlog vẫn cần capacity/drain/admission/freshness.
3. Không tự động; conflict, routing, dependency/data/key/operation complexity có thể tăng failure.
4. Không; senior tối thiểu hóa concept, giữ invariant và extension pressure thật, nói consequences.
</details>
