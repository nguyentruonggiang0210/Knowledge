# Assessment coverage matrix

Ma trận này chỉ ghi coverage có yêu cầu trả lời, SQL, bằng chứng hoặc rubric cụ thể. Một keyword chỉ xuất hiện trong đáp án không được tính là đã assessment.

## Ký hiệu

- **Direct:** question/lab kiểm tra trực tiếp phần cốt lõi của lesson.
- **Partial:** chỉ một số mục của lesson được kiểm tra; vẫn phải làm bài tập trong lesson.
- **Optional:** cần thêm tài nguyên/topology, không phải điều kiện pass core roadmap.
- Diagnostic là gate đầu vào; advanced bank và lab được làm sau lesson tương ứng.

## PostgreSQL

| Lesson | Assessment trực tiếp | Lab/capstone | Mức phủ và giới hạn |
|---|---|---|---|
| [00 — Nền tảng](../LessionPostresql/00-nen-tang-duy-nhat.md) | PG-D01..PG-D10 | SQL gates PG-D09/D10 | **Direct:** schema, type, NULL, constraint, DML. |
| [01 — Advanced SQL](../LessionPostresql/01-advanced-sql.md) | PG-18, PG-22, PG-23 | Capstone báo cáo | **Partial:** join/latest/keyset; CTE, LATERAL, recursive và GROUPING SETS vẫn dùng bài tập lesson. |
| [02 — MVCC/isolation/lock](../LessionPostresql/02-mvcc-isolation-locks.md) | PG-01, PG-04, PG-11, PG-14, PG-19, PG-20, PG-24 | PG-L02; capstone F3/F5 | **Direct** cho MVCC/race/serializable/queue; advisory/table-lock breadth còn ở lesson. |
| [03 — Index chuyên sâu](../LessionPostresql/03-index-chuyen-sau.md) | PG-02/03/05/06/09/13/21/25/30, PG-43 | PG-L01 | **Direct** B-tree/partial/covering/BRIN/online; PG-43 bổ sung GIN/trigram, GiST chủ yếu ở PG-32. |
| [04 — EXPLAIN/optimizer](../LessionPostresql/04-explain-optimizer-thong-ke.md) | PG-07, PG-12, PG-16, PG-27..PG-30 | PG-L01, PG-L03 | **Direct:** estimate, spill, scan/join evidence; parallel/JIT chỉ qua lesson exercise. |
| [05 — Partitioning](../LessionPostresql/05-partitioning.md) | PG-08 | PG-L05; capstone retention | **Partial:** range/pruning/lifecycle/uniqueness; list/hash/subpartition không có câu riêng. |
| [06 — JSONB/FTS](../LessionPostresql/06-jsonb-full-text-search.md) | PG-43 | PG-L01 chỉ hỗ trợ index method chung | **Partial:** containment, FTS, trigram; JSONPath/update/generated hot fields vẫn làm lesson exercise. |
| [07 — Function/trigger/RLS/security](../LessionPostresql/07-functions-triggers-rls-security.md) | PG-44 | Capstone tenant/security rubric | **Partial:** RLS, pool context, SECURITY DEFINER; trigger/dynamic-SQL breadth ở lesson. |
| [08 — Pooling/vacuum/bloat](../LessionPostresql/08-performance-pooling-vacuum-bloat.md) | PG-01/07/09/20/29/41/42 | PG-L04, PG-L07 | **Direct:** memory, connection, HOT/bloat, timeouts/capacity; PgBouncer modes ở lesson. |
| [09 — Backup/PITR/replication/HA](../LessionPostresql/09-backup-pitr-replication-ha.md) | PG-10, PG-15, PG-40, PG-45 | PG-L07; capstone F6 | **Direct:** backup/slot/PITR evidence/fencing; multi-node failover remains blueprint. |
| [10 — Observability](../LessionPostresql/10-observability-troubleshooting.md) | PG-20/21/27..PG-30/35/41/42/45 | PG-L03/04/07; capstone F5 | **Direct:** activity, plans, WAL/checkpoint, capacity/cancel; dashboard design validated in capstone report. |
| [11 — Modeling/integrity](../LessionPostresql/11-data-modeling-integrity-advanced.md) | PG-31, PG-32, PG-33 | PG-L06; capstone invariants/outbox | **Direct:** domain/generated/exclusion/idempotency/outbox; audit catalog remains lesson exercise. |
| [12 — WAL/checkpoint/durability](../LessionPostresql/12-wal-checkpoint-durability.md) | PG-34, PG-35 | PG-L07 | **Direct:** ACK guarantees, FPI/checkpoint/WAL evidence; checksum drill documented in lab artifact. |
| [13 — Zero-downtime migrations](../LessionPostresql/13-zero-downtime-schema-migrations.md) | PG-36, PG-37, PG-38 | PG-L06 | **Direct:** lock budget, backfill, validation, concurrent constraint, expand-contract. |
| [14 — Extensions/upgrades](../LessionPostresql/14-extension-lifecycle-version-upgrades.md) | PG-39, PG-40 | PG-L07 upgrade ADR | **Direct:** inventory/dependency/upgrade choice/collation; actual major upgrade không bắt buộc local. |
| [15 — Capacity/deadlines](../LessionPostresql/15-capacity-timeouts-cancellation.md) | PG-41, PG-42 | PG-L07; capstone F5 | **Direct:** memory/disk runway, deadlines/cancel/load-shedding reasoning. |
| [16 — Capstone](../LessionPostresql/16-capstone.md) | PG-31..PG-45 dùng làm review | [CAPSTONE.md](CAPSTONE.md), [CAPSTONE_RUBRIC.md](CAPSTONE_RUBRIC.md) | **Direct:** integrated correctness, performance, delivery và recovery. |

## ClickHouse

| Lesson | Assessment trực tiếp | Lab/capstone | Mức phủ và giới hạn |
|---|---|---|---|
| [00 — Cài đặt/dataset](../LessionClickHouse/00-cai-dat-va-dataset.md) | CH-D02, CH-D11, CH-D12 | Diagnostic SQL gates | **Direct:** metadata/basic DDL/query; reset safety kiểm tra qua checklist. |
| [01 — Columnar/OLAP](../LessionClickHouse/01-kien-truc-columnar-olap.md) | CH-D01/03/04/05, CH-01/02/04/10/11/12 | CH-L01 | **Direct:** OLAP, parts, marks, PREWHERE và pruning. |
| [02 — Types/schema](../LessionClickHouse/02-kieu-du-lieu-schema.md) | CH-D06..CH-D11, CH-08/09/22 | CH-L06 migration | **Direct** core types/expressions; IP/Enum và mọi complex-type variant không có câu riêng. |
| [03 — MergeTree family](../LessionClickHouse/03-mergetree-key-partition-granule.md) | CH-02..05, CH-12..14, CH-16/22/23/45 | CH-L03 | **Direct:** keys/parts/Replacing/Aggregating/Summing/Collapsing semantics. |
| [04 — Ingestion](../LessionClickHouse/04-ingestion-batch-async.md) | CH-11/17/18/28/34 | CH-L02, CH-L07 optional | **Direct:** batch/small parts/retry; streaming format/Kafka thực hành là optional. |
| [05 — Analytical queries](../LessionClickHouse/05-query-aggregation-window.md) | CH-20, CH-24, CH-26, CH-32 | Capstone funnel/KPI | **Partial:** funnel/distinct/JOIN multiplicity; cohort/ASOF/ROLLUP không có câu riêng. |
| [06 — LowCardinality/codec](../LessionClickHouse/06-lowcardinality-nullable-codec.md) | CH-D07/08, CH-08/09/22/29 | CH-L01 | **Partial:** LC/Nullable/promoted fields; codec rewrite đo trong lesson exercise. |
| [07 — MV/projection/skip index](../LessionClickHouse/07-mv-projection-skip-index.md) | CH-07/19/25/27/29 | CH-L01, CH-L04; capstone serving path | **Direct** MV/backfill/skipping; projection chỉ là benchmark candidate, không claim full coverage. |
| [08 — Mutation/TTL/dedup](../LessionClickHouse/08-mutation-ttl-dedup.md) | CH-05/06/13/18/21/23 | CH-L03, CH-L05; capstone F2/F4 | **Direct:** eventual mutation/latest/dedup/retention. |
| [09 — Distributed/Keeper](../LessionClickHouse/09-distributed-sharding-replication.md) | CH-15, CH-30, CH-42 | Lesson multi-node exercise | **Partial:** mental model/queue/quorum/triage; failure topology là optional blueprint. |
| [10 — Performance/system](../LessionClickHouse/10-performance-explain-system.md) | CH-27..CH-30, CH-32, CH-44 | CH-L01/02/05/06; capstone F5 | **Direct:** pruning, parts, query_log, JOIN memory/cancel; cache ở lesson 16. |
| [11 — Security/backup/monitoring](../LessionClickHouse/11-security-backup-monitoring.md) | CH-40, CH-41 | Không có standalone backup lab; capstone chỉ chấm security/monitoring/rebuild | **Direct** design và restore SQL trong question bank; không claim ClickHouse backup restore qua capstone F6. |
| [12 — PostgreSQL CDC](../LessionClickHouse/12-postgres-cdc-integration.md) | CH-43 | X-L01; capstone F1..F4/reconciliation | **Direct:** snapshot/stream/version/heartbeat/reconcile; live connector stack không bắt buộc. |
| [14 — Dictionary/JOIN](../LessionClickHouse/14-dictionary-external-join.md) | CH-31, CH-32 | CH-L06 | **Direct:** layout/freshness/missing key/ANY-ALL/direct/JOIN algorithms. |
| [15 — Kafka/object storage](../LessionClickHouse/15-kafka-object-storage-table-functions.md) | CH-33, CH-34 | CH-L07 **optional/resource-heavy** | **Direct** reasoning; broker execution optional, file/S3 credentials không bắt buộc. |
| [16 — Query cache/governance](../LessionClickHouse/16-query-cache-resource-governance.md) | CH-35, CH-36 | CH-L06 | **Direct:** stale cache/observability/workload/profile semantics. |
| [17 — Schema evolution/quality](../LessionClickHouse/17-schema-evolution-quality-testing.md) | CH-37, CH-38, CH-39 | CH-L06; capstone F4 | **Direct:** expand-contract/shadow/reconcile/cutover/accepted-rejected. |
| [13 — Capstone, học cuối](../LessionClickHouse/13-capstone.md) | CH-31..CH-45 dùng làm review | [CAPSTONE.md](CAPSTONE.md), [CAPSTONE_RUBRIC.md](CAPSTONE_RUBRIC.md) | **Direct:** capstone học sau lesson 17; file number cũ được giữ để không gãy link. |

## Capstone failure mapping

| Failure drill | Năng lực chính | Questions/labs chuẩn bị |
|---|---|---|
| F1 — Lost acknowledgement | at-least-once/idempotency | PG-33, CH-18/34/43, X-L01, CH-L07 optional |
| F2 — Out-of-order/conflict | version/latest/tombstone | PG-26/33, CH-13/23/43, CH-L03 |
| F3 — Worker crash | lease/retry/outbox | PG-19/33, PG-L02, X-L01 |
| F4 — Backfill overlap | cutoff/reconcile/rollback | CH-19/37/38/43, CH-L04/06, X-L01 |
| F5 — Query overload | plan/memory/cancel/governance | PG-29/41/42, CH-35/36/44, PG-L07, CH-L06 |
| F6 — Restore | PostgreSQL RPO/RTO/artifact/invariant | PG-15/40/45, PG-L07 |

CH-41 kiểm tra ClickHouse backup/restore độc lập; capstone F6 hiện chỉ yêu cầu restore PostgreSQL nên không được tính là bằng chứng thực hành cho CH-41.

## Khi nào được đánh dấu hoàn thành

Một lesson chỉ đạt khi learner:

1. qua diagnostic prerequisite nếu có;
2. trả lời đúng IDs được map và nêu production pitfall;
3. chạy SQL/lab được map hoặc ghi rõ vì sao phần optional không chạy;
4. lưu evidence và làm lại câu sai sau 48–72 giờ.
