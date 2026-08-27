# 02 — MVCC, isolation, lock và deadlock

Các ví dụ có nhãn **Session A/B** cần hai kết nối `psql` đến cùng database.

## Scenario và trade-off map

| Knowledge item | Scenario production | Trade-off cần quyết định |
|---|---|---|
| MVCC/snapshot | reader và writer chạy đồng thời | Ít blocking nhưng giữ nhiều row version; transaction dài tạo vacuum debt |
| `READ COMMITTED` | CRUD/API transaction ngắn | Fresh theo statement, throughput tốt; check-then-act dễ race |
| `REPEATABLE READ` | báo cáo/logic cần snapshot ổn định | Tránh non-repeatable view nhưng vẫn có write skew và serialization failure khi update conflict |
| `SERIALIZABLE` | quota/booking/invariant nhiều row | Correctness gần serial execution; cần retry toàn transaction và chịu SSI overhead |
| Row lock | pessimistic state transition | Dễ reason về row nóng nhưng tạo queue/deadlock nếu giữ lock lâu |
| `SKIP LOCKED` | nhiều worker lấy job | Giảm contention; cố ý cho view không nhất quán/starvation và cần lease |
| Table lock/DDL | migration schema | DDL atomic nhưng lock queue có thể gây outage; cần lock budget/fail-fast |
| Deadlock/lock ordering | transfer nhiều account | Database phát hiện/abort; application phải retry và mọi path phải cùng thứ tự |
| Advisory lock | serialize resource không có row | Nhanh/linh hoạt nhưng database không enforce convention và pool dễ rò session lock |
| Blocker observability | lock incident | Catalog cho evidence tức thời nhưng terminate sai blocker có rollback blast radius |

## 1. MVCC và snapshot

MVCC (Multi-Version Concurrency Control) giữ nhiều phiên bản logic của một row. Reader thường không chặn writer; mỗi statement/transaction đọc phiên bản phù hợp snapshot của mình.

```sql
DROP SCHEMA IF EXISTS mvcc_lab CASCADE;
CREATE SCHEMA mvcc_lab;

CREATE TABLE mvcc_lab.account (
    account_id bigint PRIMARY KEY,
    balance numeric(14,2) NOT NULL CHECK (balance >= 0)
);

INSERT INTO mvcc_lab.account VALUES (1, 1000), (2, 1000);

SELECT account_id, balance, xmin, xmax, ctid
FROM mvcc_lab.account;

UPDATE mvcc_lab.account
SET balance = balance + 10
WHERE account_id = 1;

SELECT account_id, balance, xmin, xmax, ctid
FROM mvcc_lab.account
WHERE account_id = 1;
```

`xmin`, `xmax`, `ctid` là system columns hữu ích để học/điều tra, nhưng không phải business identifier.

**Tình huống thực tế:** Trong lúc báo cáo dài đang đọc snapshot cũ, API vẫn update row. PostgreSQL tạo row version mới thay vì sửa đè tại chỗ.

> **Bug ẩn / production — MVCC:** Transaction mở lâu giữ `xmin` cũ, khiến vacuum chưa thể dọn dead tuples; bloat và nguy cơ transaction ID wraparound tăng. Theo dõi `xact_start`, tránh trạng thái `idle in transaction`, đặt `idle_in_transaction_session_timeout` hợp lý.

> **Bug ẩn / production — `ctid`:** `ctid` đổi khi row được update hoặc di chuyển và có thể được tái sử dụng. Không lưu nó làm ID lâu dài.

## 2. `READ COMMITTED`: snapshot theo từng statement

Đây là isolation mặc định. Hai lần `SELECT` trong cùng transaction có thể thấy dữ liệu khác nếu transaction khác commit giữa chúng.

```sql
-- Session A
BEGIN ISOLATION LEVEL READ COMMITTED;
SELECT balance FROM mvcc_lab.account WHERE account_id = 1;
-- Chờ Session B commit, rồi chạy lại:
SELECT balance FROM mvcc_lab.account WHERE account_id = 1;
COMMIT;
```

```sql
-- Session B
UPDATE mvcc_lab.account
SET balance = balance + 100
WHERE account_id = 1;
```

**Tình huống thực tế:** Phù hợp API CRUD ngắn, nơi mỗi statement được phép thấy trạng thái commit mới nhất.

> **Bug ẩn / production — check-then-act:** `SELECT balance`, kiểm tra ở application, rồi `UPDATE` là race condition. Hai request có thể cùng vượt qua bước kiểm tra. Gộp invariant vào statement:

```sql
UPDATE mvcc_lab.account
SET balance = balance - 200
WHERE account_id = 1
  AND balance >= 200
RETURNING account_id, balance;
```

Không có row trả về nghĩa là không đủ tiền hoặc account không tồn tại; application phải phân biệt nếu nghiệp vụ cần.

## 3. `REPEATABLE READ`: snapshot theo transaction và write skew

PostgreSQL triển khai snapshot isolation ở mức `REPEATABLE READ`: các lần đọc thường thấy cùng snapshot, nhưng vẫn có thể xảy ra write skew khi hai transaction sửa hai row khác nhau dựa trên cùng invariant.

```sql
CREATE TABLE mvcc_lab.on_call (
    doctor_id bigint PRIMARY KEY,
    on_call boolean NOT NULL
);
INSERT INTO mvcc_lab.on_call VALUES (1, true), (2, true);
```

```sql
-- Session A
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM mvcc_lab.on_call WHERE on_call; -- 2
UPDATE mvcc_lab.on_call SET on_call = false WHERE doctor_id = 1;
-- Chờ Session B UPDATE rồi COMMIT, sau đó:
COMMIT;
```

```sql
-- Session B, chạy song song
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM mvcc_lab.on_call WHERE on_call; -- 2
UPDATE mvcc_lab.on_call SET on_call = false WHERE doctor_id = 2;
COMMIT;
```

Cả hai có thể commit và invariant “ít nhất một bác sĩ trực” bị phá.

> **Bug ẩn / production — `REPEATABLE READ`:** Không đồng nghĩa serial execution. Invariant trải trên nhiều row vẫn có write skew. Dùng `SERIALIZABLE`, lock một row đại diện, hoặc mô hình constraint hóa invariant.

## 4. `SERIALIZABLE` và retry

Serializable Snapshot Isolation theo dõi dependency nguy hiểm và abort một transaction với SQLSTATE `40001` khi không thể xếp lịch tương đương tuần tự.

```sql
TRUNCATE mvcc_lab.on_call;
INSERT INTO mvcc_lab.on_call VALUES (1, true), (2, true);

-- Chạy lại hai workflow ở trên, nhưng mỗi session bắt đầu bằng:
BEGIN ISOLATION LEVEL SERIALIZABLE;
```

Một session có thể nhận `could not serialize access due to read/write dependencies among transactions`.

**Tình huống thực tế:** Đặt chỗ, cấp quota, lịch trực, ledger workflow có invariant phức tạp nhưng transaction vẫn đủ ngắn.

> **Bug ẩn / production — retry:** Serialization failure và deadlock (`40P01`) là kết quả được dự kiến trong cạnh tranh, không phải luôn là server hỏng. Retry **toàn bộ transaction** với backoff ngẫu nhiên và giới hạn số lần; chỉ retry một statement sẽ dùng logic/snapshot không còn hợp lệ. Side effect ngoài DB (gửi email, gọi payment) cần idempotency/outbox.

Pseudo-code:

```text
for attempt in 1..5:
    begin transaction serializable
    run every read and write of the unit of work
    try commit
    if SQLSTATE not in ('40001', '40P01'): fail
    rollback; sleep(jittered_exponential_backoff)
fail with retriable error
```

## 5. Row-level lock

```sql
-- Session A
BEGIN;
SELECT *
FROM mvcc_lab.account
WHERE account_id = 1
FOR UPDATE;
-- Giữ transaction mở để quan sát Session B.
```

```sql
-- Session B: sẽ chờ cho đến khi A COMMIT/ROLLBACK hoặc timeout.
SET lock_timeout = '2s';
UPDATE mvcc_lab.account
SET balance = balance + 1
WHERE account_id = 1;
```

- `FOR UPDATE`: mạnh nhất cho row, chặn các thay đổi/lock xung đột.
- `FOR NO KEY UPDATE`: thường đủ khi update không đổi key được FK tham chiếu.
- `FOR SHARE`, `FOR KEY SHARE`: lock chia sẻ với mức xung đột nhẹ hơn.

**Tình huống thực tế:** Lock account trước khi thực hiện nhiều phép kiểm tra và thay đổi phải cùng dựa trên một row hiện hành.

> **Bug ẩn / production — row lock:** Lock giữ tới cuối transaction, không tới cuối statement. Gọi HTTP hoặc chờ người dùng khi đang giữ lock kéo dài hàng chờ. Đặt transaction boundary sát phần DB và luôn có timeout.

> **Bug ẩn / production — `LIMIT`:** `SELECT ... FOR UPDATE LIMIT 1` không có `ORDER BY` chọn row không xác định. Với queue phải có thứ tự ổn định.

## 6. Job queue với `SKIP LOCKED`

```sql
CREATE TABLE mvcc_lab.job (
    job_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'ready',
    available_at timestamptz NOT NULL DEFAULT now(),
    claimed_at timestamptz
);

INSERT INTO mvcc_lab.job (payload)
VALUES ('{"task":"a"}'), ('{"task":"b"}'), ('{"task":"c"}');

CREATE INDEX job_ready_idx
ON mvcc_lab.job (available_at, job_id)
WHERE status = 'ready';

BEGIN;
WITH picked AS (
    SELECT job_id
    FROM mvcc_lab.job
    WHERE status = 'ready'
      AND available_at <= now()
    ORDER BY available_at, job_id
    FOR UPDATE SKIP LOCKED
    LIMIT 1
)
UPDATE mvcc_lab.job AS j
SET status = 'running', claimed_at = clock_timestamp()
FROM picked
WHERE j.job_id = picked.job_id
RETURNING j.*;
COMMIT;
```

`SKIP LOCKED` cho nhiều worker claim job khác nhau mà không chờ nhau.

> **Bug ẩn / production — queue:** Worker chết sau khi claim làm job mắc ở `running`. Cần lease timeout, retry count, idempotent handler và dead-letter policy. `SKIP LOCKED` cũng có thể gây starvation; không dùng nó cho truy vấn cần ảnh chụp nhất quán chung.

## 7. Table locks và DDL

```sql
BEGIN;
LOCK TABLE mvcc_lab.account IN SHARE MODE;
SELECT count(*) FROM mvcc_lab.account;
COMMIT;
```

Nhiều DDL cần `ACCESS EXCLUSIVE`, xung đột với mọi table lock mode. Một câu `ALTER TABLE` “nhanh” vẫn có thể chờ sau transaction dài, rồi chặn các request phía sau.

> **Bug ẩn / production — lock queue:** Khi DDL đang chờ lock mạnh, các truy vấn mới tương thích với holder hiện tại vẫn có thể xếp sau DDL để tránh starvation, tạo outage bất ngờ. Với migration, đặt `lock_timeout` ngắn, giám sát blocker và retry có kiểm soát.

```sql
SET lock_timeout = '1s';
ALTER TABLE mvcc_lab.account
    ADD COLUMN IF NOT EXISTS note text;
```

## 8. Deadlock: thứ tự lock không nhất quán

Đặt lại balance nếu cần, rồi chạy:

```sql
-- Session A
BEGIN;
UPDATE mvcc_lab.account SET balance = balance + 1 WHERE account_id = 1;
-- Sau khi Session B đã lock account 2:
UPDATE mvcc_lab.account SET balance = balance + 1 WHERE account_id = 2;
```

```sql
-- Session B
BEGIN;
UPDATE mvcc_lab.account SET balance = balance + 1 WHERE account_id = 2;
-- Sau khi Session A đã lock account 1:
UPDATE mvcc_lab.account SET balance = balance + 1 WHERE account_id = 1;
```

PostgreSQL phát hiện vòng chờ, abort một transaction với `40P01`.

**Cách phòng:** Luôn lock account theo cùng thứ tự ID.

```sql
BEGIN;
SELECT account_id
FROM mvcc_lab.account
WHERE account_id IN (1, 2)
ORDER BY account_id
FOR UPDATE;
-- Thực hiện thay đổi sau khi đã lock theo thứ tự.
COMMIT;
```

> **Bug ẩn / production — deadlock:** Deadlock không chỉ đến từ hai `UPDATE`; foreign key, trigger và upsert cũng lấy lock. Đọc log deadlock và toàn bộ transaction path. Giảm `deadlock_timeout` bừa bãi làm tăng chi phí detector; nó không sửa nguyên nhân.

## 9. Advisory lock

Advisory lock là lock do ứng dụng tự quy ước, phù hợp serialize tác vụ không ánh xạ đẹp vào một row.

```sql
BEGIN;
SELECT pg_advisory_xact_lock(42, 1001);
-- Chỉ một transaction dùng cùng cặp key đi qua tại một thời điểm.
SELECT 'rebuild tenant cache' AS work;
COMMIT;
```

> **Bug ẩn / production — advisory lock:** Database không biết ý nghĩa key và không tự buộc code khác tôn trọng lock. Session-level `pg_advisory_lock` còn sống đến khi explicit unlock hoặc connection đóng; với pool rất dễ rò lock. Ưu tiên bản transaction-level `pg_advisory_xact_lock`.

## 10. Quan sát blocker

```sql
SELECT
    a.pid,
    a.usename,
    a.state,
    a.xact_start,
    a.query_start,
    pg_blocking_pids(a.pid) AS blocking_pids,
    left(a.query, 120) AS query
FROM pg_stat_activity AS a
WHERE a.datname = current_database()
  AND (cardinality(pg_blocking_pids(a.pid)) > 0
       OR a.state = 'idle in transaction')
ORDER BY a.xact_start NULLS LAST;
```

> **Bug ẩn / production — terminate:** Không tự động `pg_terminate_backend` mọi blocker. Blocker có thể là migration hoặc transaction quan trọng; terminate sẽ rollback, đôi khi rất lâu. Xác định owner, tác động và rollback cost trước.

## Bài tập

1. Tạo lost-update-prone workflow rồi sửa bằng atomic `UPDATE ... WHERE ... RETURNING`.
2. Tái hiện write skew ở `REPEATABLE READ`, sau đó chứng minh `SERIALIZABLE` abort một bên.
3. Chạy ba worker claim queue bằng `SKIP LOCKED` và chứng minh không claim trùng.
4. Tạo deadlock, lưu SQLSTATE/log và viết nguyên tắc lock ordering.
