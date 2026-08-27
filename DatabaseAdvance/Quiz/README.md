# Hệ thống tự kiểm tra

Thư mục này là một bộ đánh giá có thể dùng lặp lại, không phải tài liệu đọc thêm. Đề và đáp án được tách riêng để bạn có thể làm bài trong điều kiện gần với phỏng vấn hoặc incident production.

## Bản đồ tài liệu

| Mục tiêu | Làm bài | Chấm/đối chiếu |
|---|---|---|
| Diagnostic đầu vào, 22 câu | [ENTRY_DIAGNOSTIC_QUESTIONS.md](ENTRY_DIAGNOSTIC_QUESTIONS.md) | [ENTRY_DIAGNOSTIC_ANSWERS.md](ENTRY_DIAGNOSTIC_ANSWERS.md) |
| PostgreSQL nâng cao | [POSTGRESQL_ADVANCED_QUESTIONS.md](POSTGRESQL_ADVANCED_QUESTIONS.md) | [POSTGRESQL_ADVANCED_ANSWERS.md](POSTGRESQL_ADVANCED_ANSWERS.md) |
| ClickHouse từ cơ bản đến nâng cao | [CLICKHOUSE_QUESTIONS.md](CLICKHOUSE_QUESTIONS.md) | [CLICKHOUSE_ANSWERS.md](CLICKHOUSE_ANSWERS.md) |
| Lab chạy trên Docker | [PRACTICAL_LABS.md](PRACTICAL_LABS.md) | [PRACTICAL_LABS_SOLUTIONS.md](PRACTICAL_LABS_SOLUTIONS.md) |
| Dự án cuối khóa | [CAPSTONE.md](CAPSTONE.md) | [CAPSTONE_RUBRIC.md](CAPSTONE_RUBRIC.md) |
| Lesson → assessment traceability | [COVERAGE_MATRIX.md](COVERAGE_MATRIX.md) | ID và giới hạn coverage |

Quy mô hiện tại:

- diagnostic: PG-D01..PG-D10 và CH-D01..CH-D12, có bốn SQL gates;
- PostgreSQL advanced: 45 questions, 150 điểm;
- ClickHouse: 45 questions, 150 điểm;
- practical labs: 15 lab gồm 7 PostgreSQL, 7 ClickHouse và 1 cross-database; CH-L07 là optional/resource-heavy;
- capstone: 6 failure drills và rubric 100 điểm.

## Các dạng câu hỏi

- MCQ: chọn đáp án và giải thích vì sao các lựa chọn còn lại sai.
- Explain why: diễn giải cơ chế, không chỉ nêu định nghĩa.
- Hidden bug: tìm lỗi có thể chỉ xuất hiện khi tải lớn, retry, failover hoặc dữ liệu lệch phân phối.
- SQL writing: viết query chạy được và nêu giả định.
- Plan analysis: đọc execution plan hoặc system table, chỉ ra bằng chứng và bước kiểm chứng tiếp theo.
- Lab/capstone: tạo sản phẩm có tiêu chí nghiệm thu và rollback.

## Luật làm bài

1. Tạo một branch hoặc thư mục ghi chép riêng; không sửa file đề/đáp án.
2. Advanced bank được chia core 01–30 và expansion 31–45; làm hai phiên theo thời gian ghi ở đầu đề. Lab thường 90–180 phút, lab migration/streaming có thể dài hơn.
3. Không mở file ANSWERS trước khi hết giờ.
4. Mỗi câu trả lời phải có confidence từ 1 đến 5. Confidence cao nhưng sai là tín hiệu cần ôn sâu.
5. Với SQL có tác dụng ghi, thử trên database lab. EXPLAIN ANALYZE cho lệnh ghi phải nằm trong transaction có ROLLBACK.
6. Khi query phụ thuộc dữ liệu hoặc phiên bản, ghi rõ giả định và cách xác minh bằng SELECT version(), SHOW hoặc system catalog.

## Cách chấm

Diagnostic dùng pass gate riêng: PostgreSQL tối thiểu 8/10, ClickHouse tối thiểu 10/12 và bắt buộc qua hai SQL gates của từng nhánh. Không cộng điểm advanced để bù diagnostic trượt.

Mỗi câu lý thuyết/MCQ tối đa 2 điểm:

- 1 điểm cho kết luận đúng;
- 1 điểm cho cơ chế, bằng chứng hoặc production pitfall đúng.

Mỗi câu SQL/debug/plan tối đa 4 điểm:

- 1 điểm tái hiện/đọc đúng triệu chứng;
- 1 điểm xác định nguyên nhân;
- 1 điểm query hoặc biện pháp xử lý đúng;
- 1 điểm có kiểm chứng và nêu rủi ro/rollback.

Mức sẵn sàng:

| Tỷ lệ | Ý nghĩa | Hành động |
|---:|---|---|
| dưới 60% | kiến thức còn rời rạc | đọc lại bài và chạy lại ví dụ |
| 60–74% | hiểu cơ chế chính | tập trung câu debug/plan bị sai |
| 75–89% | có thể áp dụng có giám sát | làm practical lab với dữ liệu lớn hơn |
| 90% trở lên | sẵn sàng cho capstone | tự đặt thêm failure scenario |

Không cộng điểm nếu lời giải tối ưu chỉ dựa trên phỏng đoán mà không có phép đo.

## Ma trận năng lực

| Năng lực | PostgreSQL | ClickHouse | Bài kiểm chứng |
|---|---|---|---|
| Data modeling | constraints, normalization, JSONB | denormalization, types, MergeTree | SQL writing, capstone |
| Storage/index | B-tree/GIN/BRIN, HOT, bloat | sparse primary index, parts, codecs | plan analysis, lab |
| Consistency | MVCC, isolation, locks | async merge, dedup, eventual mutation | hidden bug |
| Performance | planner, stats, work_mem | pruning, PREWHERE, aggregation | benchmark lab |
| Operations | vacuum, PITR, replication | merge pressure, TTL, replica/distributed | runbook checklist |
| Reliability | retry, idempotency, failover | insert retry, quorum, distributed DDL | capstone drill |

## Nhật ký học tập tối thiểu

Với mỗi câu sai, ghi một dòng theo mẫu:

~~~text
Ngày | Mã câu | Tôi đã nghĩ gì | Bằng chứng bác bỏ | Quy tắc mới | Ngày làm lại
~~~

Với mỗi benchmark, ghi:

~~~text
Phiên bản | schema | số hàng | phân phối dữ liệu | query | cold/warm | median/p95 | bytes/rows read | plan | kết luận
~~~

Thiếu phân phối dữ liệu hoặc số hàng thì benchmark rất khó tái lập.

## Lộ trình kiểm tra gợi ý

1. Làm [entry diagnostic](ENTRY_DIAGNOSTIC_QUESTIONS.md); ôn đúng lesson nếu trượt gate.
2. Tra [coverage matrix](COVERAGE_MATRIX.md), làm IDs tương ứng sau mỗi lesson.
3. Làm MCQ/Explain why trước, sau một ngày làm Hidden bug + SQL writing.
4. Cuối tuần làm plan/system-table analysis và practical lab được map.
5. Sau cả hai roadmap, làm capstone và tự chấm bằng rubric.

## Reset an toàn

Ưu tiên DROP SCHEMA lab_name CASCADE rồi tạo lại schema thay vì xóa cả Docker volume. Kiểm tra database hiện tại trước mọi thao tác:

~~~sql
-- PostgreSQL
SELECT current_database(), current_user;

-- ClickHouse
SELECT currentDatabase(), currentUser();
~~~

Không chạy lệnh reset trên endpoint production. Các solution là lời giải tham khảo; một lời giải khác vẫn đạt điểm nếu đúng, đo được và mô tả trade-off rõ ràng.
