# Level 4 – Production Engineering

Tổng: **14 câu / 28 điểm**. Câu trả lời phải đề cập blast radius, rollback/recovery và auditability khi phù hợp.

## P01 — Trắc nghiệm (1 điểm) · L06, L14

Lợi ích cốt lõi của remote backend dùng chung cho team là gì?

A. Biến HCL thành imperative script  
B. State tập trung với kiểm soát truy cập; tùy backend có locking/versioning và cơ chế bảo vệ phù hợp  
C. Loại bỏ hoàn toàn nhu cầu backup  
D. Tự động duyệt mọi plan

## P02 — Đúng/Sai (1 điểm) · L12, L14

Saved plan file luôn an toàn để public vì mọi giá trị `sensitive` chắc chắn đã bị xóa khỏi artifact nhị phân.

## P03 — Giải thích locking (2 điểm) · L06, L14, L16

Pipeline bị kẹt lock sau khi runner chết. Mô tả thứ tự kiểm tra trước khi dùng `force-unlock`, rủi ro nếu một apply khác vẫn đang chạy, và bằng chứng audit cần lưu.

## P04 — Thiết kế pipeline (3 điểm) · L12, L13, L14

Thiết kế luồng CI/CD từ pull request đến production gồm format/validate, lint/security/policy check, plan, review/approval và apply. Nêu cách đảm bảo apply đúng commit/đúng reviewed plan, chống hai apply đồng thời và tách quyền plan/apply.

## P05 — Tình huống secret (3 điểm) · L12, L16

Một database password đã xuất hiện trong `terraform.tfvars`, CI log và state remote. Hãy lập kế hoạch xử lý sự cố theo thứ tự: ngăn phát tán, rotate/revoke, làm sạch log/artifact/repository history theo chính sách, kiểm tra state/backend, rồi ngăn tái diễn. Giải thích vì sao chỉ thêm file vào `.gitignore` là chưa đủ.

## P06 — Trắc nghiệm (1 điểm) · L03, L12

Vai trò chính của `.terraform.lock.hcl` là gì?

A. Lock remote state khi apply  
B. Ghi lựa chọn/checksum provider để cài đặt lặp lại và phát hiện package không khớp  
C. Chứa OCI private key  
D. Khóa mọi module source git ở commit hiện tại

## P07 — Giải thích drift (2 điểm) · L06, L14, L16

Phân biệt drift do thay đổi out-of-band với thay đổi code có chủ đích. Đề xuất quy trình phát hiện/triage/remediate drift mà không mù quáng apply production.

## P08 — Trắc nghiệm (1 điểm) · L06, L14

Phát biểu nào an toàn nhất về CLI workspaces?

A. Luôn là ranh giới bảo mật hoàn chỉnh giữa prod/dev  
B. Chia nhiều state cho cùng configuration nhưng không tự tạo separation về credential, backend access hay blast radius  
C. Tự động tạo folder và module khác nhau  
D. Là cách duy nhất quản lý nhiều môi trường

## P09 — Giải thích policy-as-code (2 điểm) · L12, L13

Nêu ba guardrail có thể kiểm tra trên configuration/plan trước apply (ví dụ network, tag, encryption, region/shape/cost), đồng thời giải thích vì sao policy-as-code không thay thế IAM least privilege và review của con người.

## P10 — Debug CI race (3 điểm) · L06, L14

Hai merge gần nhau tạo hai saved plan từ cùng state. Plan A apply trước; job B vẫn định apply plan cũ. Phân tích nguy cơ và thiết kế pipeline để job B bị serialize/re-plan/review đúng cách. Đừng dùng `-lock=false` như giải pháp.

## P11 — Tình huống DR (3 điểm) · L16

State backend hoặc region chính không truy cập được trong một sự cố. Viết runbook cấp cao để xác nhận RTO/RPO, phục hồi state có version kiểm chứng, dựng hạ tầng DR, xử lý provider alias/region và tránh split-brain. Chỉ rõ việc nào phải diễn tập trước sự cố.

## P12 — Trắc nghiệm (1 điểm) · L16

Thay đổi Terraform nào nên bị cảnh báo FinOps mạnh nhất trước apply?

A. Thêm comment  
B. Tăng số lượng/shape compute production và retention backup đáng kể  
C. Chạy `fmt`  
D. Đổi tên local không ảnh hưởng output

## P13 — Giải thích observability (2 điểm) · L16

Ngoài “apply thành công”, cần theo dõi tín hiệu gì để biết thay đổi hạ tầng thực sự an toàn? Nêu ví dụ metric/log/audit/health/SLO và cách gắn deployment/change identifier để điều tra.

## P14 — Tình huống change failure (3 điểm) · L14, L16

Sau apply, health check backend giảm mạnh nhưng Terraform báo success. Mô tả quyết định stop/rollback/roll-forward, cách xác định thay đổi liên quan, giới hạn của “rollback bằng cách revert Git”, và cách bảo toàn bằng chứng/state trong khi phục hồi dịch vụ.
