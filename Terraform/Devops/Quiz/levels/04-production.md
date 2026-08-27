# Level 4 – Production Operations

Tổng: **20 câu / 38 điểm**. Mọi scenario cần đề cập customer impact, dữ liệu, evidence và recovery.

## P01 — Trắc nghiệm (1 điểm) · D13

SLI là gì?

A. Phép đo định lượng một khía cạnh reliability mà người dùng quan tâm  
B. Mọi dashboard CPU  
C. Hợp đồng pháp lý duy nhất  
D. Danh sách server

## P02 — Đúng/Sai (1 điểm) · D13

Error budget biến khoảng không tin cậy được phép bởi SLO thành tín hiệu cân bằng tốc độ thay đổi và reliability; nó không phải quyền cố ý gây lỗi.

## P03 — Trắc nghiệm (1 điểm) · D14

Cache-aside có rủi ro điển hình nào?

A. Stale data và cache stampede khi key nóng hết hạn  
B. Tự cung cấp transaction serializable cho mọi datastore  
C. Loại bỏ nhu cầu invalidation  
D. Bảo đảm dữ liệu không bao giờ mất

## P04 — Đúng/Sai (1 điểm) · D14, D19

Trong hệ phân tán thực tế, “exactly once” end-to-end thường cần làm rõ phạm vi; idempotency key/deduplication và transaction boundary vẫn quan trọng khi message có thể redeliver.

## P05 — Trắc nghiệm (1 điểm) · D16

Metric FinOps nào giúp so sánh hiệu quả khi traffic tăng?

A. Chi phí trên một đơn vị business như request/order/customer hoạt động  
B. Tổng số tag màu xanh  
C. Số dashboard  
D. Chỉ hóa đơn tuyệt đối, không normalize

## P06 — Trắc nghiệm (1 điểm) · D17

Trong major incident, vai trò Incident Commander chủ yếu là:

A. Tự tay debug mọi component  
B. Điều phối mục tiêu, vai trò, quyết định, giao tiếp và nhịp cập nhật  
C. Xóa log để giảm nhiễu  
D. Tìm người chịu lỗi

## P07 — Đúng/Sai (1 điểm) · D18

Backup job báo “success” là bằng chứng đầy đủ rằng RTO/RPO sẽ đạt khi thảm họa xảy ra, không cần restore test.

## P08 — Trắc nghiệm (1 điểm) · D18

RPO 15 phút mô tả điều gì?

A. Mức mất dữ liệu theo thời gian tối đa mục tiêu khoảng 15 phút  
B. Dịch vụ phải phục hồi trong 15 phút  
C. Alert phải gửi sau 15 phút  
D. Backup phải giữ 15 năm

## P09 — Giải thích signals (2 điểm) · D12, D13

Áp dụng RED cho service và USE cho resource. Nêu metric/log/trace nào giúp liên hệ symptom người dùng với saturation phía dưới, đồng thời tránh alert mọi metric.

## P10 — Giải thích SLO (2 điểm) · D13

Viết SLO mẫu cho API theo population, good event, cửa sổ và target. Nêu cách xử lý request không hợp lệ/planned maintenance và vì sao target 100% thường gây trade-off xấu.

## P11 — Giải thích data migration (2 điểm) · D14

Mô tả expand/migrate/contract cho thay đổi schema lớn. Nêu dual-read/write hoặc backfill, kiểm tra consistency, observability và cách tránh rollback app vào schema không tương thích.

## P12 — Giải thích platform (2 điểm) · D15

Phân biệt portal tự phục vụ với platform-as-product. Một golden path tốt cần contract, guardrail, escape hatch, documentation, support và metric adoption/outcome nào?

## P13 — Giải thích FinOps (2 điểm) · D16

Phân biệt showback/chargeback, budget/forecast/anomaly và right-sizing/commitment. Nêu một trường hợp giảm cost làm reliability hoặc carbon tệ hơn, cần đánh giá toàn hệ thống.

## P14 — Giải thích postmortem (2 điểm) · D17

Một blameless postmortem tốt gồm impact, timeline, detection, contributing factors, response và action item thế nào? Phân biệt root-cause label đơn giản với phân tích điều kiện hệ thống.

## P15 — Tình huống latency (3 điểm) · D12, D13

p99 latency tăng, average CPU bình thường, error rate chưa cao. Lập kế hoạch điều tra queue depth, thread/connection pool, downstream, lock/GC, network, tail trace và saturation theo instance. Nêu stop condition trước khi retry/scale mù quáng.

## P16 — Debug migration (3 điểm) · D08, D14, D17

Deploy mới đã chạy migration `DROP COLUMN`; canary lỗi và rollback binary cũ cũng lỗi. Phân tích failure, kế hoạch khôi phục dữ liệu/service và thiết kế release/migration guardrail để không lặp lại.

## P17 — Tình huống platform adoption (3 điểm) · D15, D20

Platform team xây portal nhiều tính năng nhưng đội sản phẩm vẫn dùng script riêng. Hãy điều tra developer journey/toil, chọn một golden path nhỏ, đồng thiết kế, đo lead time/adoption/reliability và quản lý exception thay vì ép dùng bằng mandate đơn thuần.

## P18 — Tình huống cost anomaly (3 điểm) · D16

Hóa đơn egress và log ingest tăng 4 lần sau release. Lập quy trình phân bổ theo tag/account/service, đối chiếu change, kiểm tra retry/telemetry/cardinality/data path, containment và tối ưu mà không làm mất forensic evidence/SLO.

## P19 — Tình huống region failure (3 điểm) · D18, D19

Region chính mất kết nối một phần; replica DR trễ 20 phút trong khi RPO cam kết 5 phút. Ai quyết định failover? Nêu đánh giá consistency/data loss, traffic/DNS, split-brain, communication, failback và evidence cần diễn tập trước.

## P20 — Debug restore (3 điểm) · D14, D18

Backup database giải mã được nhưng restore sandbox mất 14 giờ, vượt RTO 2 giờ và application không chạy do thiếu schema/key dependency. Lập corrective plan cho backup chain, dependency inventory, parallelism, restore automation, verification và game day.

