# Lessions — mục lục Terraform từ cơ bản đến production

Tên thư mục “Lessions” được giữ đúng theo yêu cầu. Mỗi lesson có cùng nhịp:
**mục tiêu → định nghĩa → mô hình → ví dụ → lab → kiểm tra → lỗi thường gặp →
tiêu chí hoàn thành**.

Tài liệu tra nhanh:

- [Glossary](GLOSSARY.md): định nghĩa Terraform, OCI và production terms.
- [CLI cheatsheet](CHEATSHEET.md): lệnh thường dùng và safety notes.
- [Mastery checklist](MASTERY-CHECKLIST.md): ma trận không bỏ sót chủ đề.

| Chặng | Chủ đề | Kết quả chính |
|---:|---|---|
| 00 | Roadmap và môi trường học | Biết cách học, setup, kiểm soát chi phí |
| 01 | IaC và Terraform foundations | Hiểu declarative IaC, desired/current state |
| 02 | HCL, types, expressions | Viết biểu thức có kiểu và dùng console |
| 03 | CLI workflow và providers | Thực hiện init/validate/plan/apply/destroy |
| 04 | Variables, locals, outputs | Thiết kế interface an toàn, rõ kiểu |
| 05 | Resources, data, graph | Điều khiển quan hệ, meta-arguments, lifecycle |
| 06 | State, backend, import, refactor | Cộng tác và thay đổi địa chỉ không phá hạ tầng |
| 07 | Modules và versioning | Tạo module tái sử dụng, contract và release |
| 08 | OCI identity, auth, governance | Thiết kế tenancy/compartment/IAM/tagging |
| 09 | OCI networking | Tạo VCN public/private, route, NSG |
| 10 | OCI compute và storage | Instance, image/shape, block/object storage |
| 11 | Data, load balancer và DNS | Kiến trúc service/data có tính sẵn sàng |
| 12 | Security, secrets, policy | Least privilege, Vault, policy-as-code |
| 13 | Testing và quality gates | fmt/validate/test/lint/security/cost checks |
| 14 | CI/CD và team workflow | Plan PR, apply có phê duyệt, promotion |
| 15 | Advanced patterns | for_each, dynamic, provider alias, migration |
| 16 | Operations, drift, cost, DR | Day-2 operations và runbook sự cố |
| 17 | Capstone production | Thiết kế và bảo vệ một stack OCI hoàn chỉnh |

## Quy ước

- Root module là entry point chạy bởi người/CI; child module là thư viện.
- Code dùng snake_case, tên resource biểu đạt vai trò, không lặp lại type.
- Variable có type, description, validation; output nhạy cảm phải đánh dấu.
- Không hard-code OCID, credential, region-specific image hoặc public IP.
- Lab mặc định ưu tiên plan/test; apply chỉ khi bài nói rõ và bạn đã kiểm tra phí.
- “Production” trong giáo trình nghĩa là pattern thực tế, không phải quyền apply
  tự động vào môi trường đang phục vụ người dùng.

## Vòng lặp học đề xuất

~~~mermaid
flowchart LR
  A[Đọc định nghĩa] --> B[Vẽ lại mô hình]
  B --> C[Chạy lab]
  C --> D[Thay đổi một biến và dự đoán plan]
  D --> E[Làm Quiz không xem đáp án]
  E --> F[Viết learning journal]
  F --> G{Đạt 80% và giải thích được?}
  G -- Chưa --> A
  G -- Rồi --> H[Lesson tiếp theo]
~~~

Mỗi lần chạy, lưu command, dự đoán, kết quả và giải thích. Khả năng dự đoán plan
chính xác quan trọng hơn thuộc cú pháp.
