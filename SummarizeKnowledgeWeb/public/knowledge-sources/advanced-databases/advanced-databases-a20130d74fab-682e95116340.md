# Database Advance — PostgreSQL nâng cao và ClickHouse

Kho học này giúp bạn đi từ nền tảng PostgreSQL tối thiểu cần thiết đến khả năng thiết kế, tối ưu và vận hành PostgreSQL trong production; đồng thời học ClickHouse từ đầu theo hướng xây dựng hệ thống phân tích dữ liệu thực tế. Mọi ví dụ đều ưu tiên chạy được trên máy cá nhân bằng Docker và không yêu cầu dịch vụ trả phí.

> Tên thư mục Lession được giữ đúng theo yêu cầu của khóa học. Trong nội dung, thuật ngữ chuẩn vẫn là lesson và PostgreSQL.

## Kết quả đầu ra

Sau khi hoàn thành, bạn có thể:

- đọc EXPLAIN (ANALYZE, BUFFERS) và chứng minh một thay đổi tối ưu PostgreSQL;
- chọn index, transaction isolation, partitioning, vacuum và chiến lược concurrency phù hợp;
- nhận diện các lỗi ẩn như generic plan, index không dùng được, lock queue, table bloat và connection storm;
- thiết kế schema ClickHouse theo access pattern, chọn engine, partition key, ORDER BY và codec;
- hiểu tính eventually consistent của mutation, deduplication và materialized view trong ClickHouse;
- xây pipeline OLTP sang OLAP, đặt SLO và điều tra truy vấn chậm bằng system tables;
- giải thích quyết định kỹ thuật qua quiz, lab và capstone thay vì chỉ ghi nhớ cú pháp.

## Điều kiện đầu vào

Bạn nên biết SQL cơ bản: SELECT, JOIN, GROUP BY, INSERT/UPDATE/DELETE, khóa chính/khóa ngoại và khái niệm transaction. Nếu chưa chắc, đọc duy nhất bài ôn tập cơ bản ở đầu roadmap PostgreSQL rồi làm phần kiểm tra nhanh trước khi vào bài nâng cao.

Công cụ cần có:

- Docker Desktop hoặc Docker Engine + Docker Compose;
- một SQL client tùy chọn: DBeaver Community, VS Code extension hoặc client chạy trong container;
- tối thiểu 4 GB RAM trống, khuyến nghị 8 GB;
- Git và trình soạn thảo Markdown.

## Cài môi trường miễn phí bằng Docker

File [docker-compose.yml](docker-compose.yml) ở root là cách khởi động được khuyến nghị. Nó pin PostgreSQL 17.11 và ClickHouse 26.3 LTS, tạo volume bền vững và tự nạp dataset ClickHouse của bài học. Mật khẩu chỉ dành cho máy học local, không dùng trong production.

Thư mục `LessionClickHouse` cũng có một Compose standalone để học riêng
ClickHouse. Đây là **phương án thay thế**, không chạy đồng thời với Compose ở
root vì cả hai dùng các cổng `8123`, `9000`, `9363`. Luôn chạy lệnh `down` hoặc
reset từ đúng thư mục/Compose mà bạn đã dùng để khởi động.

### 1. Khởi động cả hai database

~~~powershell
docker compose up -d
docker compose ps
~~~

Chờ cột health chuyển sang healthy, sau đó kết nối:

~~~powershell
docker exec -it database-advance-postgres psql -U student -d lab
docker exec -it database-advance-clickhouse clickhouse-client --user student --password student_pass --database ecommerce
~~~

Chuỗi kết nối PostgreSQL từ host: postgresql://student:student@localhost:5432/lab

ClickHouse native endpoint: `127.0.0.1:9000`. HTTP endpoint:
`http://127.0.0.1:8123`. Dùng IPv4 tường minh để tránh một số máy Windows
resolve `localhost` sang IPv6 trong khi Docker chỉ publish IPv4. Kiểm tra nhanh:

~~~powershell
curl.exe -u student:student_pass "http://127.0.0.1:8123/?query=SELECT%20version()"
~~~

### 2. Dừng và chạy lại

~~~powershell
docker compose stop
docker compose start
~~~

docker compose down chỉ xóa container/network và mặc định vẫn giữ named volumes. Chỉ thêm --volumes khi thực sự muốn xóa toàn bộ dữ liệu lab; đây là thao tác phá hủy, không thể hoàn tác nếu chưa backup.

~~~powershell
docker compose down
docker compose down --volumes
~~~

## Cấu trúc khóa học

- [LessionPostresql/README.md](LessionPostresql/README.md): một bài ôn PostgreSQL cơ bản, sau đó tập trung hoàn toàn vào nội dung nâng cao.
- [LessionClickHouse/README.md](LessionClickHouse/README.md): roadmap ClickHouse đầy đủ từ nhập môn đến thiết kế và vận hành production.
- [Quiz/README.md](Quiz/README.md): cách tự kiểm tra, rubric, question bank, lab và capstone cho cả hai nhánh.
- [Quiz/ENTRY_DIAGNOSTIC_QUESTIONS.md](Quiz/ENTRY_DIAGNOSTIC_QUESTIONS.md): gate đầu vào PostgreSQL và ClickHouse trước khi học advanced.
- [Quiz/COVERAGE_MATRIX.md](Quiz/COVERAGE_MATRIX.md): mapping từng lesson sang question, lab và capstone, kèm giới hạn coverage.

Không nên đọc tuyến tính mọi tài liệu trong một lần. Chu trình học hiệu quả cho mỗi chủ đề là:

~~~text
Đọc khái niệm -> chạy query -> dự đoán kết quả/plan -> đo -> gây lỗi có chủ đích -> sửa -> làm quiz không nhìn đáp án -> ghi lại bằng chứng
~~~

## Lịch học gợi ý trong 20 tuần

Mỗi tuần 6–8 giờ, chia thành ba buổi. Nếu đã vận hành PostgreSQL thực tế, có thể bỏ qua tuần 1 nhưng vẫn nên làm diagnostic quiz.

| Tuần | Trọng tâm | Sản phẩm cần nộp |
|---:|---|---|
| 1 | Diagnostic + PostgreSQL 00 | pass gates và query nền tảng |
| 2 | PostgreSQL 01–02: advanced SQL, MVCC/lock | báo cáo SQL + kịch bản hai session |
| 3 | PostgreSQL 03–04: index, optimizer/statistics | plan trước/sau có buffers |
| 4 | PostgreSQL 05–06: partition, JSONB/FTS | lifecycle + search benchmark |
| 5 | PostgreSQL 07: function/trigger/RLS | security test matrix |
| 6 | PostgreSQL 08: pooling/vacuum/bloat | maintenance evidence |
| 7 | PostgreSQL 09–10: HA/observability | restore + incident runbook |
| 8 | PostgreSQL 11–12: integrity, WAL/durability | invariant + WAL/checkpoint report |
| 9 | PostgreSQL 13: zero-downtime migration | PG-L06 |
| 10 | PostgreSQL 14–15: upgrade/capacity/deadline | PG-L07 + upgrade ADR |
| 11 | PostgreSQL 16 capstone checkpoint | OLTP/outbox/recovery review |
| 12 | ClickHouse 00–02: setup, architecture, types | diagnostic SQL + schema |
| 13 | ClickHouse 03–04: MergeTree/ingestion | parts/batching benchmark |
| 14 | ClickHouse 05–06: analytical SQL/storage | funnel + codec/type evidence |
| 15 | ClickHouse 07–08: MV/projection/mutation | serving aggregate + retention |
| 16 | ClickHouse 09–10: distributed/performance | triage report, cluster blueprint |
| 17 | ClickHouse 11–12: security/backup/CDC | restore + reconciliation |
| 18 | ClickHouse 14–15: dictionary/JOIN/Kafka/S3 | CH-L06; CH-L07 nếu đủ tài nguyên |
| 19 | ClickHouse 16–17: cache/governance/evolution | stale-cache + quality cutover |
| 20 | ClickHouse 13 học cuối + integrated capstone | demo, failure drills, rubric |

## Cách dùng Quiz đúng mục đích

1. Làm entry diagnostic trước; sau đó làm file QUESTIONS tương ứng khi chưa mở file ANSWERS.
2. Với câu SQL, luôn chạy query và lưu cả output lẫn EXPLAIN; đáp án chỉ là một lời giải tham khảo.
3. Với câu debug, viết ba phần: triệu chứng, bằng chứng, nguyên nhân gốc. Không chấm điểm cho phỏng đoán thiếu bằng chứng.
4. Chấm theo rubric trong [Quiz/README.md](Quiz/README.md). Câu sai phải ghi thêm một production pitfall của chính bạn.
5. Sau 48–72 giờ, làm lại câu sai bằng database sạch hoặc dữ liệu khác phân phối.
6. Kết thúc mỗi nhánh bằng lab; kết thúc cả khóa bằng capstone.

## Nguyên tắc khi đọc ví dụ

- Không tin một tối ưu nếu chưa có số đo trước/sau trên dữ liệu đủ lớn.
- EXPLAIN ANALYZE thực sự chạy câu lệnh. Với UPDATE/DELETE, bọc trong BEGIN và ROLLBACK khi thử nghiệm.
- Dữ liệu ít có thể khiến planner cố ý chọn sequential scan; điều đó không tự động là lỗi.
- ORDER BY trong PostgreSQL và ORDER BY của MergeTree mang ý nghĩa rất khác nhau.
- ClickHouse tối ưu cho analytical workload, không phải bản thay thế mặc định cho OLTP PostgreSQL.
- Mọi keyword quan trọng trong bài học nên được đọc cùng mục “bẫy production”; quiz được thiết kế để kiểm tra đúng các bẫy này.

## Cách chứng minh đã học được

Một chủ đề được xem là hoàn thành khi bạn có đủ bốn bằng chứng:

- giải thích được bằng lời của mình;
- có query tái hiện được;
- có output/plan hoặc metric trước và sau;
- nêu được ít nhất một tình huống giải pháp đó phản tác dụng.

Các câu trả lời tốt không chỉ nói “dùng index”, “tăng RAM” hay “thêm replica”; chúng phải nêu access pattern, trade-off, cách đo và phương án rollback.

## Tài liệu đối chiếu chính thức

- [PostgreSQL 17 Documentation](https://www.postgresql.org/docs/17/index.html)
- [PostgreSQL Versioning Policy](https://www.postgresql.org/support/versioning/)
- [ClickHouse Documentation](https://clickhouse.com/docs)
- [ClickHouse: cài bằng Docker](https://clickhouse.com/docs/get-started/setup/self-managed/docker)
- [ClickHouse official packages và các nhánh stable/LTS](https://packages.clickhouse.com/)
