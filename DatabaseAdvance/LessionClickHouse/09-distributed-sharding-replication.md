# 09 - Distributed table, sharding và replication

## Mục tiêu

- Phân biệt shard, replica, Distributed table và ClickHouse Keeper.
- Chọn sharding key ổn định, tránh skew và JOIN xuyên mạng.
- Hiểu consistency/acknowledgement khi replica hoặc network lỗi.
- Biết đọc queue replication/distributed để xử lý sự cố.

> Bài này có **blueprint nhiều node**. Docker Compose của khóa học chỉ có một server nên không thể kiểm thử HA, quorum hay network partition thật. Các DDL `ON CLUSTER analytics_cluster` chỉ chạy sau khi bạn cấu hình cluster cùng tên, macros và ClickHouse Keeper trên ít nhất 2 shard × 2 replica.

## 1. Mental model

```text
Distributed table (không giữ data)
             |
       sharding key
       /           \
  shard 01       shard 02       <- chia data/compute
  /     \         /     \
replica replica  replica replica <- bản sao HA trong mỗi shard
             \ ClickHouse Keeper /
```

- **Shard** giữ một phần dataset; thêm shard tăng capacity nhưng data cũ không tự rebalance.
- **Replica** giữ bản sao cùng shard; tăng HA/read options, không chia nhỏ logical dataset.
- **Distributed** route insert và fan-out/merge query; bản thân thường không giữ columnar parts.
- **Keeper** điều phối replicated metadata/log; không lưu data parts thay node.

## 2. Cluster configuration tối thiểu (blueprint)

Mỗi node cần `remote_servers` và macro khác nhau. Secrets nên lấy từ file/env/secret manager, không commit plaintext:

```xml
<clickhouse>
  <remote_servers>
    <analytics_cluster>
      <shard>
        <internal_replication>true</internal_replication>
        <replica><host>ch-s1-r1</host><port>9000</port></replica>
        <replica><host>ch-s1-r2</host><port>9000</port></replica>
      </shard>
      <shard>
        <internal_replication>true</internal_replication>
        <replica><host>ch-s2-r1</host><port>9000</port></replica>
        <replica><host>ch-s2-r2</host><port>9000</port></replica>
      </shard>
    </analytics_cluster>
  </remote_servers>
  <macros>
    <shard>01</shard>
    <replica>ch-s1-r1</replica>
  </macros>
</clickhouse>
```

Mỗi host/port phải resolve qua private network; cấu hình TLS/auth riêng. Keeper nên có quorum lẻ (thường 3 nodes) và disk ổn định.

## 3. Keeper topology và vận hành production

Keeper dùng Raft cho coordination của replication và distributed DDL. Nó lưu metadata/log điều phối, không lưu data parts thay ClickHouse replicas. Ba Keeper nodes chịu được một node lỗi; hai nodes không chịu được một node lỗi vì không còn đa số.

Mặc định Keeper cho linearizable writes nhưng reads có thể được phục vụ local và không linearizable, tương thích guarantee của ZooKeeper. `quorum_reads` đổi latency/throughput để lấy read guarantee mạnh hơn; không bật theo cảm tính và không dùng znode như application database.

Blueprint cho `keeper-1`; mỗi node dùng `server_id` riêng nhưng có cùng danh sách Raft:

```xml
<clickhouse>
  <keeper_server>
    <tcp_port>9181</tcp_port>
    <server_id>1</server_id>
    <log_storage_path>/var/lib/clickhouse/coordination/log</log_storage_path>
    <snapshot_storage_path>/var/lib/clickhouse/coordination/snapshots</snapshot_storage_path>
    <coordination_settings>
      <operation_timeout_ms>10000</operation_timeout_ms>
      <session_timeout_ms>30000</session_timeout_ms>
      <force_sync>true</force_sync>
    </coordination_settings>
    <raft_configuration>
      <server><id>1</id><hostname>keeper-1</hostname><port>9234</port></server>
      <server><id>2</id><hostname>keeper-2</hostname><port>9234</port></server>
      <server><id>3</id><hostname>keeper-3</hostname><port>9234</port></server>
    </raft_configuration>
  </keeper_server>
</clickhouse>
```

ClickHouse servers trỏ client coordination tới cả ba nodes:

```xml
<clickhouse>
  <zookeeper>
    <node><host>keeper-1</host><port>9181</port></node>
    <node><host>keeper-2</host><port>9181</port></node>
    <node><host>keeper-3</host><port>9181</port></node>
  </zookeeper>
</clickhouse>
```

Trade-off: embedded Keeper ít service hơn nhưng CPU/disk contention của ClickHouse có thể ảnh hưởng quorum. Standalone Keeper tách failure/resource domain tốt hơn nhưng tăng vận hành. Dù chọn kiểu nào, đặt Raft log/snapshot trên disk ổn định; latency fsync hoặc disk full có thể làm toàn cụm replicated table chậm/readonly.

Kiểm tra từng node từ host có `netcat`:

```bash
echo ruok | nc keeper-1 9181
echo mntr | nc keeper-1 9181
echo stat | nc keeper-1 9181
```

`ruok` chỉ chứng minh process trả lời, không chứng minh node đang thuộc quorum khỏe. `mntr`/`stat` cần được đọc trên cả ba nodes để thấy leader/follower, outstanding requests, latency và followers synced.

Từ ClickHouse 26.3, dùng four-letter commands ở trên cho health Raft và kết hợp `system.replicas`, `system.replication_queue` ở các phần sau để thấy tác động phía data node. Đừng copy query system tables của release mới hơn vào runbook 26.3 mà chưa kiểm tra `SELECT version()` và `system.tables`.

Quy tắc topology:

- hostname/IP trong Raft config phải ổn định và resolve giống nhau trên mọi node;
- không copy/reuse `server_id` cho máy thay thế khi member cũ chưa được remove đúng quy trình;
- thay membership từng node, chờ quorum ổn định rồi mới tiếp tục;
- snapshot/log Keeper không tương thích trực tiếp với ZooKeeper; migration cần tool/quy trình được hỗ trợ và rehearsal;
- không tạo quorum trộn ZooKeeper + Keeper rồi kỳ vọng chúng bầu leader chung.

## 4. Replicated local table

```sql
CREATE DATABASE IF NOT EXISTS ecommerce ON CLUSTER analytics_cluster;

CREATE TABLE ecommerce.events_local ON CLUSTER analytics_cluster
(
    event_id UUID,
    event_time DateTime64(3, 'UTC'),
    event_date Date MATERIALIZED toDate(event_time),
    user_id UInt64,
    event_type LowCardinality(String),
    category LowCardinality(String),
    price Decimal(12, 2),
    quantity UInt16
)
ENGINE = ReplicatedMergeTree(
    '/clickhouse/tables/{shard}/{uuid}',
    '{replica}'
)
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, event_type, user_id, event_time, event_id);
```

`{uuid}` tránh path phụ thuộc rename table; `{shard}` bảo đảm replicas cùng shard dùng cùng Keeper path. `{replica}` phải unique trong shard.

Kiểm tra:

```sql
SELECT cluster, shard_num, replica_num, host_name, is_local
FROM system.clusters
WHERE cluster = 'analytics_cluster'
ORDER BY shard_num, replica_num;

SELECT
    database,
    table,
    replica_name,
    is_leader,
    is_readonly,
    absolute_delay,
    queue_size,
    total_replicas,
    active_replicas
FROM system.replicas
WHERE database = 'ecommerce';
```

## 5. Distributed table

```sql
CREATE TABLE ecommerce.events_all ON CLUSTER analytics_cluster
AS ecommerce.events_local
ENGINE = Distributed(
    'analytics_cluster',
    'ecommerce',
    'events_local',
    cityHash64(user_id)
);

INSERT INTO ecommerce.events_all
    (event_id, event_time, user_id, event_type, category, price, quantity)
VALUES
    (generateUUIDv4(), now64(3), 12345, 'purchase', 'books', 12.00, 1);

SELECT category, sum(price * quantity)
FROM ecommerce.events_all
WHERE event_date = today()
GROUP BY category;
```

`cityHash64(user_id)` giữ events một user cùng shard, hữu ích cho session/user aggregation. Nhưng tenant cực lớn sẽ tạo hot shard; có thể hash `(tenant_id, user_id)` nếu query chấp nhận user cùng tenant phân tán theo user.

## 6. Insert acknowledgement và queue

Mặc định Distributed insert có thể ghi block vào local queue rồi gửi nền. Khi cần biết remote shard đã nhận trước ACK:

```sql
INSERT INTO ecommerce.events_all
    (event_id, event_time, user_id, event_type, category, price, quantity)
SETTINGS distributed_foreground_insert = 1
VALUES
    (generateUUIDv4(), now64(3), 12346, 'view', 'books', 12.00, 1);
```

Theo dõi queue:

```sql
SELECT
    database,
    table,
    data_path,
    error_count,
    data_files,
    data_compressed_bytes,
    last_exception
FROM system.distribution_queue
ORDER BY error_count DESC;
```

Foreground insert tăng latency và vẫn cần idempotency khi client timeout không rõ remote đã commit hay chưa.

## 7. Replication consistency và quorum

ReplicatedMergeTree sao chép parts bất đồng bộ. Các setting như `insert_quorum`, `insert_quorum_timeout`, `select_sequential_consistency`, replica load balancing và stale-replica fallback thay đổi availability/latency/consistency; kiểm thử đúng failure mode trước khi bật.

Blueprint:

```sql
INSERT INTO ecommerce.events_local
    (event_id, event_time, user_id, event_type, category, price, quantity)
SETTINGS insert_quorum = 'auto', insert_quorum_timeout = 10000
VALUES
    (generateUUIDv4(), now64(3), 888, 'view', 'home', 5.00, 1);

SYSTEM SYNC REPLICA ecommerce.events_local;
```

`SYSTEM SYNC REPLICA` chờ queue và không nên đặt trước mọi read. Quorum timeout có thể xảy ra sau khi một số replica đã ghi; retry vẫn cần dedup/idempotency.

## 8. Distributed aggregation

Mỗi shard aggregate partial, coordinator merge states:

```sql
SELECT
    category,
    uniqCombined64(user_id) AS users,
    sumIf(price * quantity, event_type = 'purchase') AS revenue
FROM ecommerce.events_all
WHERE event_date >= today() - 7
GROUP BY category;
```

High-cardinality `GROUP BY` chuyển nhiều states qua mạng và coordinator có thể hết memory. Pre-aggregate theo shard, dùng approximate aggregate, giới hạn result hoặc hierarchical MV.

## 9. Distributed JOIN

Nếu fact và dimension shard theo cùng key, local JOIN hiệu quả. Nếu không, `GLOBAL JOIN` chạy subquery một nơi rồi broadcast right side:

```sql
SELECT e.category, count()
FROM ecommerce.events_all AS e
GLOBAL ANY INNER JOIN
(
    SELECT user_id
    FROM ecommerce.vip_users_all
    WHERE active = 1
) AS v USING (user_id)
GROUP BY e.category;
```

DDL `vip_users_all` là minh họa. Broadcast dimension lớn có thể bão network/RAM. `distributed_product_mode` bảo vệ một số double-distributed subquery; đừng tắt bảo vệ mà chưa hiểu multiplicity và traffic.

## 10. Replication queue triage

```sql
SELECT
    database,
    table,
    type,
    create_time,
    num_tries,
    num_postponed,
    postpone_reason,
    last_exception
FROM system.replication_queue
ORDER BY create_time
LIMIT 50;

SELECT
    hostName(),
    database,
    table,
    count() AS active_parts,
    sum(rows) AS rows
FROM clusterAllReplicas('analytics_cluster', system.parts)
WHERE active AND database = 'ecommerce'
GROUP BY hostName(), database, table
ORDER BY hostName(), table;
```

`clusterAllReplicas` cần credentials/cluster config đúng. Row count giữa replicas có thể lệch tạm thời; đối chiếu queue và part checksum/state trước khi kết luận mất dữ liệu.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| shard | Phần ngang dataset | Thêm shard không tự rebalance old parts; capacity mới có thể rảnh trong khi shard cũ vẫn nóng. |
| replica | Bản sao một shard | Replica không phải backup: DROP/mutation lỗi được replicate sang mọi bản sao. |
| `ReplicatedMergeTree` | MergeTree có replication log | Keeper khỏe nhưng disk replica đầy vẫn tạo lag/readonly; monitor cả hai lớp. |
| Keeper | Coordination/quorum metadata | 2-node Keeper không chịu được một node lỗi theo quorum; dùng số lẻ và backup metadata thích hợp. |
| Raft quorum | Đa số Keeper members đồng ý | Ba nodes trải cùng một host/AZ không chịu được failure domain đó dù đủ số lượng. |
| `quorum_reads` | Đưa read qua Raft consensus | Bật để “an toàn hơn” có thể tăng latency/tải quorum; mặc định local read không linearizable phải được hiểu đúng. |
| `server_id` | Identity Raft member | Reuse/duplicate ID hoặc đổi danh sách khác nhau giữa nodes có thể làm member không join/quorum mất ổn định. |
| `ruok` | Kiểm tra process đáp ứng | Trả `imok` không chứng minh leader/quorum/replication log khỏe; phải đọc `mntr`/`stat` và service SLO. |
| Keeper snapshot/log | Trạng thái coordination | Backup data parts mà bỏ Keeper metadata làm restore cluster không đầy đủ; format không thay trực tiếp ZooKeeper. |
| replica path | Identity trong Keeper | Hai tables dùng nhầm path có thể attach sai metadata hoặc readonly; `{uuid}` giảm rename collision. |
| `{shard}`/`{replica}` | Per-node macros | Copy config không đổi replica name làm hai nodes tranh cùng identity. |
| `Distributed` | Router/fan-out table | Query không filter shard key vẫn chạm mọi shard; thêm nodes không giảm coordinator bottleneck tự động. |
| sharding key | Chọn shard cho row | Key nullable/không ổn định hoặc đổi thuật toán làm cùng entity nằm nhiều shards. |
| skew | Phân bố lệch | Hash tenant_id khi một tenant chiếm 40% data tạo hot shard dù hash “đều” theo tenants. |
| distributed queue | Buffer insert tới shard | Disk coordinator đầy khi remote lâu ngày; ACK trước không đồng nghĩa shard đã nhận. |
| foreground insert | Gửi remote trước ACK | Network hiccup tăng tail latency; timeout vẫn có ambiguous commit. |
| `insert_quorum` | Chờ đủ replicas | Timeout không đảm bảo rollback; retry có thể duplicate nếu block/token khác. |
| stale replica | Replica trễ log | Load balancer đọc replica trễ gây read-after-write bất ngờ; consistency setting đổi availability. |
| `GLOBAL JOIN` | Broadcast right side | Dimension lớn nhân theo số shard/replica, gây network/memory spike. |
| coordinator | Node merge distributed results | Group cardinality cao làm coordinator OOM dù từng shard còn nhiều RAM. |
| `ON CLUSTER` | DDL fan-out | Một node offline tạo distributed DDL backlog/schema drift; kiểm tra `system.distributed_ddl_queue`. |

## Bài thực hành

Tự dựng 2 shard × 2 replica + 3 Keeper nodes trên máy lab nếu đủ RAM. Kill từng server, Keeper và network link; ghi lại insert ACK, query result, queue recovery. Không gọi là HA cho tới khi đã chạy failure drill và restore backup.

## Tài liệu chính thức

- [ClickHouse Keeper](https://clickhouse.com/docs/guides/sre/keeper/clickhouse-keeper)
- [Replication and sharding](https://clickhouse.com/docs/architecture/horizontal-scaling)
- [`system.replicas`](https://clickhouse.com/docs/reference/system-tables/replicas)
- [`system.replication_queue`](https://clickhouse.com/docs/reference/system-tables/replication_queue)
