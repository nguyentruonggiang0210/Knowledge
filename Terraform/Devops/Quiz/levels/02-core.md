# Level 2 – Core Delivery và Runtime

Tổng: **20 câu / 38 điểm**. Câu trả lời phải nêu artifact identity và trust boundary khi phù hợp.

## C01 — Trắc nghiệm (1 điểm) · D07

Terraform state chủ yếu dùng để làm gì?

A. Lưu source code ứng dụng  
B. Ánh xạ resource address/cấu hình với remote object và metadata cần cho plan/apply  
C. Thay database backup  
D. Chứa Docker image layer

## C02 — Đúng/Sai (1 điểm) · D07

Packer thường dùng tạo versioned machine image; Ansible/configuration management có thể cấu hình guest; Terraform phù hợp quản lý hạ tầng và reference giữa các tài nguyên. Một công cụ không nhất thiết thay mọi công cụ còn lại.

## C03 — Trắc nghiệm (1 điểm) · D08

Cách promotion an toàn nhất giữa staging và production là:

A. Build lại cùng branch ở production và hy vọng output giống nhau  
B. Promote đúng immutable artifact digest đã test, kèm provenance/approval  
C. Copy thủ công file từ laptop  
D. Deploy tag `latest` không lưu digest

## C04 — Đúng/Sai (1 điểm) · D08

CI cache và release artifact có cùng yêu cầu toàn vẹn/retention; vì vậy cache dependency có thể dùng trực tiếp làm artifact production mà không cần xác minh.

## C05 — Trắc nghiệm (1 điểm) · D09

Vì sao PID 1 trong container cần xử lý signal/reap child process đúng?

A. Để đổi DNS TTL  
B. Để shutdown grace period và quản lý zombie process đúng khi orchestrator gửi signal  
C. Để image nhỏ hơn  
D. Để bỏ resource limit

## C06 — Trắc nghiệm (1 điểm) · D09

Phát biểu nào đúng?

A. Image là template immutable theo content; container là runtime instance có writable layer/process  
B. Container luôn là VM đầy đủ  
C. Image digest thay đổi theo tên container  
D. Registry tự bảo đảm mọi image không có CVE

## C07 — Trắc nghiệm (1 điểm) · D11

SBOM cung cấp giá trị chính nào?

A. Danh mục thành phần/phụ thuộc để inventory, vulnerability/license/incident analysis  
B. Mã hóa network packet  
C. Thay thế mọi penetration test  
D. Tự rotate secret

## C08 — Đúng/Sai (1 điểm) · D11

Đánh dấu một biến IaC là `sensitive` đồng nghĩa secret chắc chắn không nằm trong state, plan artifact hoặc API log.

## C09 — Giải thích tool boundary (2 điểm) · D07

Cho một dịch vụ trên VM, hãy phân chia trách nhiệm giữa Terraform, Packer, cloud-init và Ansible/configuration management. Nêu dấu hiệu cho thấy đang lạm dụng `remote-exec` hoặc bootstrap quá dài.

## C10 — Giải thích drift/state (2 điểm) · D07

Phân biệt desired configuration, state và remote reality. Khi phát hiện thay đổi thủ công ngoài IaC, hãy nêu các lựa chọn reconcile và vì sao không nên auto-apply một plan destructive.

## C11 — Giải thích pipeline (2 điểm) · D08

Mô tả pipeline build-once/promote-many: source commit, test, package, scan, SBOM, sign/attest, registry, environment approval và deploy theo digest. Bằng chứng nào cho phép truy từ runtime về commit?

## C12 — Giải thích deployment (2 điểm) · D08

So sánh rolling, blue-green và canary về capacity, blast radius, rollback/traffic control và database compatibility. Nêu một tiêu chí chọn chiến lược.

## C13 — Giải thích container isolation (2 điểm) · D09

Namespaces và cgroups giải quyết hai nhóm vấn đề nào? Vì sao container chạy root vẫn là rủi ro và rootless không tự động loại bỏ mọi lỗ hổng kernel/capability/mount?

## C14 — Giải thích threat model (2 điểm) · D11

Với pipeline có quyền deploy production, liệt kê asset, actor, trust boundary, entry point và ít nhất ba threat/control. Phân biệt preventive, detective và responsive control.

## C15 — Debug Dockerfile (3 điểm) · D09, D11

Tìm ít nhất năm vấn đề và đề xuất bản sửa ở mức nguyên tắc:

```dockerfile
FROM ubuntu:latest
COPY . /app
RUN apt-get update && apt-get install -y curl sudo
ENV API_TOKEN=real-token-here
RUN chmod -R 777 /app
WORKDIR /app
CMD python app.py
```

## C16 — Debug pipeline (3 điểm) · D08, D11

Pipeline production dùng action/plugin theo tag `main`, chạy trên pull request từ fork, inject cloud admin key và deploy tag image `latest`. Hãy phân tích trust boundary và thiết kế lại trigger, permission, pinning, identity, artifact/digest và approval.

## C17 — Tình huống config drift (3 điểm) · D07

Golden image có app v1; Ansible cập nhật package; cloud-init lại tải app “mới nhất” mỗi boot; Terraform thay user-data. Sau restart, các node khác phiên bản. Hãy xác định source of truth và đề xuất lifecycle/versioning giúp fleet tái lập được.

## C18 — Tình huống CVE (3 điểm) · D08, D11

Scanner phát hiện CVE nghiêm trọng trong base image đang chạy trên 200 workload. Lập quy trình xác minh exploitability, tìm affected digest bằng SBOM, rebuild/re-sign, staged rollout, exception có hạn và chứng minh đã loại bỏ runtime cũ.

## C19 — Tình huống cloud identity (3 điểm) · D06, D11

CI đang dùng user API key dài hạn có quyền admin trên mọi môi trường. Hãy thiết kế chuyển sang workload/federated short-lived identity, least privilege theo environment, approval, credential rotation và break-glass audit.

## C20 — Tình huống release có DB (3 điểm) · D08, D14

Ứng dụng v2 đổi schema không tương thích với v1 nhưng team muốn canary. Đề xuất expand/contract migration, backward/forward compatibility, feature flag, data backfill, observability và điều kiện rollback/roll-forward.

