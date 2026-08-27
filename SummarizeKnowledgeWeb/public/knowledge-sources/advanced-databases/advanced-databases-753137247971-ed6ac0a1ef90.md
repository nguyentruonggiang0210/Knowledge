# 11 - Security, backup, restore và monitoring

## Mục tiêu

- Áp dụng quyền tối thiểu, row policy, quota và resource profile.
- Backup/restore thật trên disk lab và thực hiện restore drill.
- Xây dashboard/alert cho query, parts, disk, merges, mutation và replication.

## 1. Threat model ngắn

Tài sản cần bảo vệ: dữ liệu analytics/PII, credentials, query logs, backups và availability. Boundary gồm HTTP/native ports, inter-server traffic, Keeper, object storage, BI tools và CI/CD.

Docker lab expose port ra host và dùng password dễ nhớ; tuyệt đối không copy nguyên cấu hình này lên server public.

## 2. Role-based access control

Lab đã bật SQL access management. Tạo analyst:

```sql
CREATE ROLE IF NOT EXISTS ecommerce_analyst;

GRANT SELECT ON ecommerce.events TO ecommerce_analyst;
GRANT SELECT ON ecommerce.daily_sales TO ecommerce_analyst;

CREATE USER IF NOT EXISTS analyst
IDENTIFIED WITH sha256_password BY 'lab_only_change_me';

GRANT ecommerce_analyst TO analyst;
SET DEFAULT ROLE ecommerce_analyst TO analyst;

SHOW GRANTS FOR analyst;
```

Nếu chưa làm bài 07 và `daily_sales` chưa tồn tại, bỏ qua grant đó. Production tạo secret qua secret manager/automation, rotate định kỳ và không lưu password trong history/repository. Ưu tiên TLS/certificate hoặc cơ chế auth tích hợp phù hợp môi trường.

## 3. Row policy và column exposure

```sql
CREATE ROW POLICY IF NOT EXISTS analyst_vn_events
ON ecommerce.events
USING country = 'VN'
TO ecommerce_analyst;

-- Một role riêng chỉ thấy các cột không nhạy cảm.
CREATE ROLE IF NOT EXISTS dashboard_reader;
GRANT SELECT(event_date, event_type, category, price, quantity)
ON ecommerce.events TO dashboard_reader;
```

Test bằng chính user/role mục tiêu, gồm query qua view/dictionary/MV. Policy sai đối tượng hoặc role chưa active dễ tạo leak hoặc trả zero rows.

## 4. Settings profile và quota

```sql
CREATE SETTINGS PROFILE IF NOT EXISTS analyst_limits
SETTINGS
    max_memory_usage = 2000000000,
    max_execution_time = 60,
    max_threads = 4
TO ecommerce_analyst;

CREATE QUOTA IF NOT EXISTS analyst_hourly
KEYED BY user_name
FOR INTERVAL 1 HOUR
MAX queries = 1000, errors = 100, result_rows = 10000000
TO ecommerce_analyst;
```

Quota/settings quá chặt làm BI retry storm; quá rộng để một query ad-hoc chiếm cả cluster. Phân class dashboard, ETL, backfill và admin bằng users/profiles riêng.

## 5. Network, encryption và secrets

- Chỉ mở HTTP/native/inter-server/Keeper trong network cần thiết.
- Dùng TLS cho client và inter-server; xác thực certificate/hostname.
- Không đặt password/query nhạy cảm trong URL vì proxy/log/history.
- Tách user read, ingest, DDL, backup; không dùng `default` không password.
- Mã hóa disk/object storage theo threat model; TLS không bảo vệ data at rest.

Kiểm tra user/quyền:

```sql
SELECT name, id, storage, auth_type, host_names, host_names_regexp
FROM system.users;

SELECT user_name, role_name, access_type, database, table, column
FROM system.grants
ORDER BY user_name, role_name, database, table;
```

## 6. Backup chạy được trong lab

`config.d/ops.xml` khai báo disk `backups`, được mount vào Docker volume riêng.

```sql
-- Tên destination phải chưa tồn tại. Đổi suffix nếu chạy lại.
BACKUP DATABASE ecommerce
TO Disk('backups', 'ecommerce_full_001');

SELECT
    id,
    name,
    status,
    error,
    start_time,
    end_time,
    total_size,
    compressed_size
FROM system.backups
ORDER BY start_time DESC;
```

Restore drill vào database khác:

```sql
CREATE DATABASE IF NOT EXISTS ecommerce_restore;

RESTORE TABLE ecommerce.events AS ecommerce_restore.events
FROM Disk('backups', 'ecommerce_full_001');

SELECT count(), min(event_time), max(event_time)
FROM ecommerce_restore.events;
```

Nếu restore báo table đã tồn tại, dùng database/table đích mới hoặc chủ động dọn **chỉ** dữ liệu lab sau khi xác nhận. Một backup chưa restore/test checksum không phải chiến lược backup.

## 7. Backup production

Định nghĩa:

- RPO: tối đa mất bao nhiêu phút/giờ dữ liệu;
- RTO: khôi phục dịch vụ trong bao lâu;
- full + incremental chain, retention và immutable/offsite copies;
- encryption/key recovery, IAM và audit;
- schema/RBAC/config/Keeper metadata cần bảo vệ ngoài data parts;
- restore drill định kỳ trên cluster cô lập.

Replica không thay backup vì accidental delete/mutation/schema error được replicate.

## 8. Monitoring SQL

### Query errors và latency

```sql
SELECT
    toStartOfMinute(event_time) AS minute,
    type,
    count() AS queries,
    quantile(0.95)(query_duration_ms) AS p95_ms
FROM system.query_log
WHERE event_time >= now() - INTERVAL 1 HOUR
  AND type IN ('QueryFinish', 'ExceptionWhileProcessing', 'ExceptionBeforeStart')
GROUP BY minute, type
ORDER BY minute, type;
```

### Disk và parts

```sql
SELECT
    name,
    round(100 * free_space / greatest(total_space, 1), 2) AS free_percent,
    formatReadableSize(free_space) AS free
FROM system.disks;

SELECT database, table, count() AS active_parts
FROM system.parts
WHERE active
GROUP BY database, table
ORDER BY active_parts DESC
LIMIT 20;
```

### Errors counters

```sql
SELECT name, value, last_error_time, last_error_message
FROM system.errors
WHERE value > 0
ORDER BY last_error_time DESC
LIMIT 30;
```

### Replication (cluster only)

```sql
SELECT database, table, is_readonly, absolute_delay,
       queue_size, inserts_in_queue, merges_in_queue,
       total_replicas, active_replicas
FROM system.replicas
ORDER BY absolute_delay DESC;
```

## 9. Prometheus endpoint lab

Compose expose `9363` theo `ops.xml`:

```bash
curl http://127.0.0.1:9363/metrics
```

Trong production, không public endpoint; Prometheus scrape qua private network/auth proxy phù hợp. Metric names có thể đổi khi upgrade—validate dashboard trên staging.

## 10. Alert khởi điểm

Điều chỉnh theo baseline/SLO, không copy ngưỡng mù quáng:

- disk free và tốc độ giảm; dự báo thời gian đầy thay vì chỉ alert 10%;
- active parts/partition và insert delayed/rejected;
- merge/mutation age, queue, failure reason;
- replica readonly, active replica thiếu, absolute delay/queue age;
- query error rate, p95/p99 theo workload class;
- memory pressure, killed queries, CPU/iowait;
- backup age/status và restore-drill age;
- CDC lag/reconciliation mismatch.

## Keywords và bug ẩn production

| Keyword | Ý nghĩa | Bug ẩn / tình huống thực tế |
|---|---|---|
| RBAC | Quyền theo role | Grant role nhưng quên default/active role khiến app fail; grant rộng để chữa nhanh tạo privilege creep. |
| least privilege | Chỉ quyền cần thiết | Ingest user có ALTER/DROP biến credential leak thành mất toàn bộ data. |
| row policy | Filter server-side | Policy chỉ áp dụng user/role được liệt kê; view/dictionary/path khác cần test chống bypass. |
| column grant | Chỉ expose cột | `SELECT *` của BI fail sau siết quyền; data nhạy cảm vẫn có thể suy ra qua aggregate nếu threat model bỏ qua. |
| settings profile | Resource guardrail | Giới hạn theo query nhưng 100 queries đồng thời vẫn vượt tổng cluster capacity. |
| quota | Giới hạn theo interval | BI tự retry mỗi lỗi làm dùng quota nhanh hơn và tạo thundering herd. |
| TLS | Encryption in transit | Client không verify certificate vẫn dễ MITM; inter-server/Keeper cũng cần bảo vệ. |
| backup | Bản sao phục hồi độc lập | Backup cùng disk/region/credential có thể mất cùng sự cố/ransomware. |
| incremental backup | Chỉ delta so base | Mất một mắt xích/base khiến restore chain hỏng; retention phải dependency-aware. |
| restore drill | Chứng minh khả năng phục hồi | Restore thành công nhưng query/schema/RBAC không hoạt động vẫn chưa đạt RTO. |
| `system.backups` | Trạng thái backup job | Status success không thay checksum/business validation và offsite verification. |
| replica | HA copy | DROP/TTL/mutation lỗi replicate; không phải point-in-time recovery. |
| query log | Audit/performance source | Có literals/PII và retention tốn disk; bảo vệ quyền + TTL. |
| Prometheus endpoint | Export metrics | Expose public làm rò topology/query/error info và tạo attack surface. |
| alert threshold | Ngưỡng cảnh báo | Ngưỡng tĩnh không thấy disk fill rate hoặc seasonality; alert quá nhiều bị bỏ qua. |

## Bài thực hành

Tạo analyst chỉ xem events Việt Nam, chứng minh không đọc được cột ngoài grant. Backup database, cố tình tạo table restore mới và đối chiếu row count + aggregate checksum. Viết runbook cho disk 85%, replica lag 10 phút và backup fail 24 giờ.
