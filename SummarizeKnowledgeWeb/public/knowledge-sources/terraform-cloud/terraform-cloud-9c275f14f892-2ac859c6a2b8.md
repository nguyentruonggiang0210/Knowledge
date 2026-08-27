# Level 5 – Expert Terraform / DevOps

Tổng: **12 câu / 27 điểm**. Không có một đáp án kiến trúc duy nhất; điểm nằm ở lập luận, kiểm soát rủi ro và quy trình có thể diễn tập.

## E01 — Trắc nghiệm (1 điểm) · L06

Khi đổi address từ `oci_core_vcn.main` sang `module.network.oci_core_vcn.this` nhưng giữ nguyên VCN thật, cơ chế declarative phù hợp để ghi nhận refactor là:

A. `moved` block  
B. `taint` mọi resource  
C. `-target`  
D. Xóa state và apply

## E02 — Đúng/Sai (1 điểm) · L05, L16

`-target` là workflow production mặc định nên dùng ở mọi apply vì nó luôn tạo plan đầy đủ và loại bỏ mọi dependency ngoài target.

## E03 — Trắc nghiệm (1 điểm) · L03, L12

Provider version constraint và dependency lock file kết hợp nhằm mục đích chính nào?

A. Quản lý IAM policy OCI  
B. Giới hạn phiên bản được phép và ghi lựa chọn/checksum cụ thể để build lặp lại  
C. Mã hóa input variable  
D. Thay remote backend

## E04 — Giải thích abstraction (2 điểm) · L07, L15, L17, Refer

Khi nào một “mega-module” đa cloud với hàng chục boolean trở thành abstraction gây hại? Nêu tiêu chí tách module theo capability/lifecycle và cách giữ interface nhất quán mà không che mất khác biệt quan trọng của OCI/AWS/Azure.

## E05 — Giải thích scale (2 điểm) · L06, L07, L14

Một root state quản lý hàng nghìn resource bắt đầu plan chậm và blast radius lớn. Phân tích cách chia state theo ownership/lifecycle/dependency, cách trao đổi output giữa stack, và trade-off consistency/coupling/security khi dùng remote-state data hoặc registry/service discovery.

## E06 — Giải thích provider alias (2 điểm) · L03, L07, L15

Giải thích vì sao child module tái sử dụng tốt không nên tự hard-code region/credential. Mô tả cách root truyền provider configuration/alias và lưu ý khi module có nhiều instance hoặc nhiều region.

## E07 — Brownfield adoption (3 điểm) · L06, L16

Bạn nhận một compartment OCI có hàng trăm tài nguyên tạo thủ công. Lập chiến lược đưa vào Terraform theo từng đợt: inventory/ownership, code generation hoặc viết code, import, plan-only baseline, drift normalization, freeze/change window và tiêu chí rollback. Làm sao tránh một plan “xóa sạch” vì configuration thiếu?

## E08 — Refactor state (3 điểm) · L05, L06, L15

Module production đang dùng `count`, phải đổi sang `for_each` mà không recreate instance. Cho ví dụ ánh xạ address index → key bằng `moved` block hoặc quy trình state move được review; mô tả backup, plan kỳ vọng, cách xử lý key không tương ứng và cách rollback nếu mapping sai.

## E09 — Backend migration (3 điểm) · L06, L14, L16

Team cần chuyển state backend sang vị trí mới. Viết change plan gồm maintenance window/concurrency freeze, backup và checksum, cấu hình backend, `terraform init -migrate-state`, xác minh lineage/resource count/plan, quyền truy cập và rollback. Nêu rủi ro khi hai backend cùng tiếp tục nhận ghi.

## E10 — Debug dependency cycle (3 điểm) · L05, L07

Module network cần IP của load balancer để tạo rule; module load balancer lại cần subnet output của network, tạo cycle. Giải thích vì sao thêm `depends_on` không phá được cycle dữ liệu và đề xuất ít nhất hai cách thay đổi boundary/data flow để tạo DAG hợp lệ.

## E11 — Multi-cloud platform design (3 điểm) · L07, L12, L15, L17, Refer

Thiết kế interface nền tảng cho dịch vụ web chạy được trên OCI/AWS/Azure. Chỉ ra phần có thể chuẩn hóa (input/output, tags, SLO, policy) và phần không nên ép đồng nhất (IAM semantics, network/LB/database capabilities). Đề xuất cấu trúc repository/module, kiểm thử contract và cách pin/version từng implementation.

## E12 — State incident (3 điểm) · L06, L12, L16

Sau một thao tác thủ công sai, state mất binding của vài resource nhưng hạ tầng vẫn chạy. Hãy trình bày quy trình incident: dừng writer, sao lưu state/log, so sánh inventory, chọn restore version hay import lại, kiểm tra serial/lineage, chạy plan không phá hủy, peer review và khôi phục pipeline. Nêu các hành động nguy hiểm cần tránh.
