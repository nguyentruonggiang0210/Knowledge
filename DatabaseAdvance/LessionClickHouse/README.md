# Lộ trình ClickHouse: từ nhập môn đến production

ClickHouse là hệ quản trị cơ sở dữ liệu phân tích hướng cột (column-oriented OLAP), mã nguồn mở và có thể chạy miễn phí trên máy cá nhân. Bộ bài học này dùng một tình huống xuyên suốt: nền tảng thương mại điện tử cần phân tích event, funnel và doanh thu, đồng thời nhận thay đổi đơn hàng từ PostgreSQL.

> Mục tiêu không phải biến ClickHouse thành PostgreSQL thứ hai. Ta học cách thiết kế dữ liệu append-heavy, đọc theo lát cắt lớn, chấp nhận merge bất đồng bộ và vận hành cụm phân tích an toàn.

## Kết quả đầu ra

Sau lộ trình, bạn có thể:

- giải thích vì sao columnar + vectorized execution phù hợp OLAP;
- thiết kế schema, `PARTITION BY`, sorting key và primary index thưa;
- nạp dữ liệu batch/async có kiểm soát, xử lý trùng lặp và update/delete;
- viết truy vấn funnel, retention, window, aggregate-state;
- chọn materialized view, projection, skipping index, codec đúng tình huống;
- hiểu sharding, replication, consistency và topology cluster;
- dùng dictionary/direct JOIN, chọn JOIN algorithm theo memory và sorting;
- triển khai batch object storage và streaming Kafka có replay/reconciliation;
- đọc `EXPLAIN`, `system.query_log`, parts/merges để tìm bottleneck;
- thiết lập quyền, quota, workload scheduling, query cache, backup và alert;
- rollout schema zero-downtime, data-quality gate và benchmark tái lập;
- lập kế hoạch PostgreSQL CDC;
- hoàn thành capstone có SLO, kiểm thử và runbook.

## Bắt đầu trong 5 phút

Yêu cầu: Docker Desktop hoặc Docker Engine + Compose plugin. Có hai cách chạy:

- **Môi trường tích hợp (khuyến nghị cho toàn khóa):** dùng
  `docker-compose.yml` ở root để chạy cả PostgreSQL và ClickHouse.
- **Môi trường ClickHouse standalone:** dùng `docker-compose.yml` trong thư mục
  này khi chỉ học ClickHouse.

Hai file Compose dùng cùng cổng `8123`, `9000`, `9363`, vì vậy **chỉ chạy một
stack tại một thời điểm**. Các lệnh bên dưới là cho stack standalone và phải
được chạy từ chính thư mục `LessionClickHouse/`:

```bash
docker compose up -d
docker compose ps
docker compose exec clickhouse clickhouse-client \
  --user student --password student_pass \
  --query "SELECT version(), count() FROM ecommerce.events"
```

Mở HTTP endpoint nếu muốn dùng curl:

```bash
curl -u student:student_pass \
  'http://127.0.0.1:8123/?query=SELECT%20count()%20FROM%20ecommerce.events'
```

IPv4 được ghi tường minh vì một số máy Windows resolve `localhost` sang IPv6
trong khi Docker Desktop chỉ publish cổng lab trên IPv4.

Dừng container nhưng giữ dữ liệu:

```bash
docker compose down
```

Xóa cả volume để khởi tạo lại bài lab (mất toàn bộ dữ liệu lab):

```bash
docker compose down -v
docker compose up -d
```

Nếu đã chọn stack ở root, hãy chạy các lệnh `up`, `exec`, `down` từ root thay
vì dùng các lệnh reset ở đây. Đặc biệt, `docker compose down --volumes` tại
root sẽ xóa volume lab của **cả PostgreSQL lẫn ClickHouse**.

Image được ghim ở nhánh LTS `26.3` để bài lab không tự đổi major/minor ngoài ý muốn. Nếu đổi phiên bản, hãy đọc release notes và thử trên volume mới trước.

## Roadmap đề xuất (16 tuần)

| Tuần | Bài | Sản phẩm phải làm được |
|---:|---|---|
| 1 | [00 - Cài đặt và dataset](00-cai-dat-va-dataset.md) | Chạy server, client, import/query dataset |
| 1 | [01 - Kiến trúc columnar/OLAP](01-kien-truc-columnar-olap.md) | Phân biệt OLTP/OLAP, part/merge/vectorization |
| 2 | [02 - Kiểu dữ liệu và schema](02-kieu-du-lieu-schema.md) | Chọn type chính xác, tránh nullable/type bloat |
| 3 | [03 - MergeTree, key và granule](03-mergetree-key-partition-granule.md) | Thiết kế table theo query pattern |
| 4 | [04 - Ingestion](04-ingestion-batch-async.md) | Nạp batch/async, kiểm soát part và retry |
| 5 | [05 - Truy vấn phân tích](05-query-aggregation-window.md) | Funnel, retention, window, JOIN/ASOF |
| 6 | [06 - Tối ưu lưu trữ](06-lowcardinality-nullable-codec.md) | LowCardinality, Nullable, codec, Map/JSON |
| 7 | [07 - MV, projection, skip index](07-mv-projection-skip-index.md) | Pre-aggregation và data skipping có đo lường |
| 8 | [08 - Mutation, TTL, dedup](08-mutation-ttl-dedup.md) | Update/delete đúng kỳ vọng merge bất đồng bộ |
| 9 | [09 - Distributed, shard, replica](09-distributed-sharding-replication.md) | Thiết kế topology HA và truy vấn distributed |
| 10 | [10 - Hiệu năng và quan sát](10-performance-explain-system.md) | Triage query chậm bằng evidence |
| 11 | [11 - Security, backup, monitoring](11-security-backup-monitoring.md) | Quyền tối thiểu, backup/restore drill, alerts |
| 11 | [12 - PostgreSQL CDC và tích hợp](12-postgres-cdc-integration.md) | Thiết kế pipeline snapshot + WAL + reconcile |
| 12 | [14 - Dictionary và JOIN strategy](14-dictionary-external-join.md) | Lookup dimension đúng semantic, chọn JOIN theo evidence |
| 13 | [15 - Kafka, object storage, table functions](15-kafka-object-storage-table-functions.md) | Import/backfill/stream có retry, DLQ và reconcile |
| 14 | [16 - Query cache và resource governance](16-query-cache-resource-governance.md) | Cache có freshness contract, cô lập dashboard/backfill |
| 15 | [17 - Schema evolution, quality, testing](17-schema-evolution-quality-testing.md) | Migration zero-downtime, quality gate, regression benchmark |
| 16 | [13 - Capstone production](13-capstone.md) | Demo, benchmark, SLO, runbook hoàn chỉnh |

Bài 13 được giữ tên/số file cũ để các link hiện có không gãy, nhưng nên học sau bài 17 vì capstone tổng hợp toàn bộ lộ trình.

Nhịp học tốt cho mỗi bài: đọc khái niệm → chạy query → cố tình tái hiện “bug ẩn” → giải thích bằng system tables → ghi lại quyết định thiết kế.

## Dataset xuyên suốt

- `ecommerce.events`: event web/app, `MergeTree`, tối ưu cho lát cắt theo ngày + loại event.
- `ecommerce.orders`: nhiều phiên bản của một order, `ReplacingMergeTree(version)` để mô phỏng CDC.
- `ecommerce.order_items`: chi tiết sản phẩm, `MergeTree` tối ưu theo category/product.

Kiểm tra dữ liệu:

```sql
SHOW TABLES FROM ecommerce;

SELECT event_type, count() AS events
FROM ecommerce.events
GROUP BY event_type
ORDER BY events DESC;

-- Có thể thấy 1 hoặc 2 physical rows cho order 5001 tùy background merge
-- đã chạy hay chưa; không được viết correctness dựa trên timing này.
SELECT order_id, status, version
FROM ecommerce.orders
WHERE order_id = 5001
ORDER BY version;
```

## Quy ước học và đo lường

1. Chạy query trên dữ liệu mẫu để hiểu cú pháp.
2. Sinh ít nhất 10–100 triệu dòng ở bài hiệu năng; dataset 10 dòng không thể chứng minh tối ưu.
3. So sánh `read_rows`, `read_bytes`, duration và peak memory, không chỉ nhìn thời gian một lần.
4. Dùng timezone UTC trong storage; đổi timezone ở lớp hiển thị.
5. Mọi tối ưu phải bắt đầu từ query pattern và bằng chứng từ system tables.

## Bảng cảnh báo nhanh

| Keyword | Bug ẩn production cần nhớ |
|---|---|
| `ORDER BY` | Là sorting key, **không** phải UNIQUE/PRIMARY KEY kiểu OLTP. |
| `PRIMARY KEY` | Là sparse index; không ép duy nhất và thường là prefix của sorting key. |
| `PARTITION BY` | Cardinality cao tạo quá nhiều partition/part, làm merge và metadata nghẽn. |
| `ReplacingMergeTree` | Dedup chỉ xảy ra khi merge; kết quả thường chưa unique nếu không xử lý lúc đọc. |
| `FINAL` | Cho kết quả đã collapse/dedup khi đọc nhưng có thể tốn CPU/RAM/I/O lớn. |
| materialized view | Chỉ xử lý block mới đi vào source; không tự backfill lịch sử. |
| skipping index | Chỉ bỏ qua granule; không giống B-tree lookup từng row. |
| replica | Tăng HA/read capacity, không tự động là backup và không nhân đôi dung lượng logic để shard. |
| mutation | Rewrite parts, bất đồng bộ và có thể tranh I/O với ingest/query. |
| TTL | Thực thi trong merge, không bảo đảm xóa đúng tại giây hết hạn. |
| dictionary | Key trùng có thể bị giữ một giá trị âm thầm; refresh cache không cung cấp lịch sử “as-of-event”. |
| Kafka offset | Insert và commit offset không phải một transaction end-to-end; crash đúng boundary có thể nạp trùng. |
| query cache | Insert/mutation không invalidate result cache; chỉ dùng khi có freshness contract. |
| `EXCHANGE TABLES` | Đổi hai tên atomic trên Atomic/Shared, nhưng dependencies và writes sau cutover vẫn cần kế hoạch rollback. |

## Cấu trúc file

```text
LessionClickHouse/
├── docker-compose.yml
├── docker-compose.integrations.yml
├── sql/00_init.sql
├── README.md
└── 00...17-*.md
```

Các lệnh cluster ở bài 09 là blueprint và cần topology nhiều node. Bài 15 dùng Compose profile `streaming` tùy chọn; base lab một node không tự khởi động Redpanda. Các phần gọi bucket/service ngoài đều ghi rõ prerequisite.

## Tự kiểm tra theo từng bài

- Làm [entry diagnostic](../Quiz/ENTRY_DIAGNOSTIC_QUESTIONS.md) trước khi chuyển từ bài nhập môn sang các bài thiết kế; nếu trượt gate, quay lại đúng bài 00–02 được chỉ ra trong đáp án.
- Dùng [coverage matrix](../Quiz/COVERAGE_MATRIX.md) để tìm câu hỏi, lab và giới hạn kiểm thử của từng bài 00–17; bài 13 vẫn được học cuối như roadmap ở trên.
- Làm [đề ClickHouse](../Quiz/CLICKHOUSE_QUESTIONS.md) trước khi mở [đáp án](../Quiz/CLICKHOUSE_ANSWERS.md).
- [Practical Labs](../Quiz/PRACTICAL_LABS.md) có bảy lab ClickHouse; `CH-L07` cần profile Redpanda tùy chọn, các lab còn lại chạy được với môi trường cơ sở.
