# Bài 20 — Distributed systems, consistency và data architecture

## Bar senior

Thiết kế dưới partial failure: chọn consistency/availability theo invariant, giải thích replication/sharding/quorum/saga và recovery. Không dùng CAP như câu thần chú. [Sample versioned store](../SourceSamples/20-distributed-systems/src/main/java/course/distributed/DistributedSystemsDemo.java).

## 1. Failure model và time

Trong distributed system, timeout chỉ nói “chưa nhận response trước deadline”, không biết operation có thực thi/commit không. Network có delay, loss, duplicate, reorder, partition; process pause/crash/restart; clock drift/step. Vì vậy:

- request mutating cần idempotency key/dedup hoặc reconciliation;
- deadline/cancellation truyền xuyên call chain;
- retry chỉ khi semantics cho phép và có budget;
- wall clock không dùng làm total-order/uniqueness; dùng DB sequence, logical/version hoặc ID scheme có failure analysis.

At-least-once delivery + idempotent operation là pattern phổ biến hơn “exactly once toàn thế giới”.

## 2. CAP, PACELC và consistency model

CAP nói khi có network partition phải đánh đổi consistency (một nghĩa linearizability) và availability (mọi non-failing node trả response). Hệ thống thực còn trade latency/consistency khi không partition—PACELC là lời nhắc, không phải công thức chọn DB.

Các mức cần phân biệt: linearizable, serializable transaction, snapshot isolation, causal, read-your-writes, monotonic reads, eventual. Một product có thể dùng strong consistency cho balance/stock và eventual cho feed/analytics.

Quorum intuition với N replicas, write W, read R: `W + R > N` tạo overlap nhưng chưa tự bảo đảm linearizability nếu version/conflict/failure/reconfiguration không đúng. Đừng áp công thức vào mọi database mà bỏ implementation contract.

## 3. Replication và failover

- Leader/follower đơn giản hóa write ordering; failover cần election/fencing, có replication lag và stale read.
- Multi-leader tăng write locality/availability nhưng conflict resolution khó.
- Leaderless dùng quorum/read repair/anti-entropy, phải xử lý sibling/version/tombstone.
- Consensus (Raft/Paxos intuition) cho replicas đồng ý log/term leader trong failure assumptions; không làm business transaction nhiều service tự động.

Split-brain cần fencing token/epoch, không chỉ distributed lock lease. Sau failover phải biết RPO (mất bao nhiêu data), RTO (phục hồi bao lâu), restore/reconciliation.

## 4. Partitioning/sharding

- Range sharding hỗ trợ range query nhưng dễ hotspot; hash phân tải đều nhưng range/fan-out khó.
- Consistent hashing giảm key movement khi membership đổi; virtual nodes là một kỹ thuật cân bằng phổ biến, còn rendezvous/jump/weighted variants có cách khác. Vẫn phải thiết kế rebalance và hot-key handling.
- Shard key phải xét cardinality, access locality, tenant skew, reshard và cross-shard transaction/query.
- Secondary index toàn cục/unique constraint cross-shard đắt; đôi khi cần lookup service/materialized view.

Reshard là production operation: dual read/write hoặc routing version, backfill checkpoint, verification, cutover, rollback và deletion delay.

## 5. Chọn data store theo access pattern

| Need | Candidate | Câu hỏi bắt buộc |
|---|---|---|
| relational invariant/query | PostgreSQL/RDBMS | transaction, index, scale/write ownership |
| key/value low latency | Redis/Dynamo-style | consistency, TTL, hot key, durability |
| document aggregate | document DB | atomic boundary, index/query evolution |
| wide-column/time series | Cassandra/TSDB | partition key, retention, compaction |
| full-text/relevance | Elasticsearch/OpenSearch | source of truth, refresh lag, reindex |
| analytical scan | warehouse/lake/columnar | freshness, cost, governance |

Polyglot persistence có sync/rebuild/ownership cost. Một database tốt thường hơn năm database “đúng trend”. Search/index/cache là derived state: phải có source-of-truth và rebuild/reconciliation plan.

## 6. Cross-service consistency

Microservice không chia sẻ database table tùy ý nếu muốn ownership độc lập. Options:

- giữ use case trong modular monolith/one transaction;
- saga với state/compensation;
- outbox + event/materialized view;
- reservation/escrow cho scarce resource;
- reconciliation job cho reality drift.

CQRS tách write/read model khi scale/query/domain cần; không bắt buộc event sourcing. Event sourcing lưu event làm source of truth, kéo theo version/upcast/snapshot/replay/GDPR/debug complexity.

## 7. Senior design proof

Mỗi data decision phải ghi:

- invariant và acceptable staleness;
- expected QPS/data size/growth/read-write ratio/key distribution;
- failure behavior, retry/idempotency;
- partition/replication/backup/restore;
- schema/event evolution;
- observability/reconciliation/manual repair;
- cost và simpler alternative.

## C#/.NET refresh và mapping

CAP/PACELC, clocks, quorum, replication, sharding và saga không phụ thuộc ngôn ngữ. Orleans/Dapr/Akka.NET, Java actor/framework hoặc cloud managed service có thể cung cấp abstraction khác nhau nhưng không xóa partial failure. Khi map từ C#, giữ nguyên invariant/SLO/failure model rồi mới chọn Java client/framework.

## Lab

1. Sample áp version để từ chối stale write; thử last-write-wins và chỉ ra lost business update.
2. Chọn shard key cho multi-tenant orders với một “whale tenant”; thiết kế split strategy.
3. Design read-after-write cho user update profile nhưng search index eventual.
4. Vẽ saga order-payment-stock, mọi bước có timeout/duplicate/compensation/manual resolution.

Versioned-store sample là process-local state model để nhìn stale-write invariant; nó **không mô phỏng network partition, replication, consensus hoặc distributed transaction**. Các claim đó cần fault-injection/integration environment và evidence từ datastore/protocol thật.

## Interview drill

- Timeout sau POST: client retry thế nào nếu không biết server đã commit?
- CAP thật sự nói gì? Availability trong CAP khác uptime thế nào?
- Read quorum có tự bảo đảm strong consistency?
- Replication lag ảnh hưởng read-your-writes/failover?
- Shard key chọn theo tiêu chí nào; reshard online ra sao?
- Saga compensation khác rollback DB thế nào?

## Quiz

1. Network khỏe thì CAP không còn trade-off nào?
2. Consensus giải transaction atomic giữa payment và inventory?
3. Search index có nên là source of truth cho order?
4. Event sourcing và CQRS luôn đi cùng nhau?

<details><summary>Đáp án/rubric</summary>

1. CAP partition choice không active, nhưng latency/consistency/cost và các failure khác vẫn tồn tại (PACELC nhắc điều này).
2. Không tự động; consensus replicate một state machine/log trong group, cross-service workflow vẫn cần transaction protocol/saga/design.
3. Thường không; là derived read model, cần source DB/event log và rebuild plan.
4. Không; có thể CQRS không event sourcing và ngược lại. Chọn theo problem/cost.
</details>
