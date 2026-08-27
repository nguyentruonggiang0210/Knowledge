# Lesson 01 — IaC và Terraform foundations

## Mục tiêu

- Phân biệt imperative và declarative.
- Hiểu configuration, provider, resource, state, plan và dependency graph.
- Chạy vòng đời đầu tiên mà không tạo cloud resource.
- Biết Terraform làm gì và không làm gì.

## Định nghĩa cốt lõi

**Infrastructure as Code (IaC)** là quản lý hạ tầng bằng file có version, review,
test và automation được. **Declarative** mô tả trạng thái mong muốn; Terraform tự
tính hành động chuyển từ trạng thái hiện tại sang trạng thái đó. Script imperative
thường mô tả từng bước phải thực hiện.

| Khái niệm | Ý nghĩa | Không nên hiểu nhầm |
|---|---|---|
| Configuration | Tập file .tf biểu đạt desired state | Thứ tự file không phải thứ tự chạy |
| Provider | Plugin nói chuyện với API | Provider không phải backend |
| Resource | Đối tượng Terraform quản lý vòng đời | Không đồng nghĩa mọi object có sẵn |
| Data source | Đọc object, không sở hữu vòng đời | Không nên dùng thay remote state tùy tiện |
| State | Ánh xạ address ↔ remote object + metadata | Không phải nguồn chân lý để sửa tay |
| Plan | Bản đề xuất thay đổi tại thời điểm chạy | Không bảo đảm tương lai không đổi |
| Apply | Thực thi plan và cập nhật state | Không phải transaction toàn cục |
| Module | Một thư mục các file .tf | File lẻ không phải module độc lập |

## Mô hình reconcile

~~~mermaid
flowchart LR
  C[Configuration: desired] --> T[Terraform Core]
  S[State: known mapping] --> T
  P[Provider refresh/API] --> T
  T --> PL[Execution plan]
  PL -->|approve| A[Provider API calls]
  A --> R[Real infrastructure]
  A --> S2[New state snapshot]
~~~

Terraform xây graph rồi chạy song song những node không phụ thuộc. Nó không đảm
bảo rollback toàn bộ nếu API call thứ ba thất bại; chạy plan lại, sửa nguyên nhân
và roll-forward thường an toàn hơn.

## Idempotency và convergence

- Cùng configuration + cùng input + không drift → plan không đổi.
- Apply thành công chưa đủ; chạy plan lần hai phải báo không có thay đổi.
- Provider/API có eventual consistency; một resource vừa tạo có thể chưa đọc được
  ngay. Provider thường retry nhưng module vẫn phải thiết kế dependency đúng.

## Lab offline

Lab ở [lab](lab) chỉ dùng resource tích hợp terraform_data, không gọi OCI và không
phát sinh phí.

~~~powershell
cd Lessions/01-iac-terraform-foundations/lab
terraform fmt -check
terraform init
terraform validate
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
terraform plan
terraform output -json
terraform destroy
~~~

Quan sát các artifact .terraform, .terraform.lock.hcl, terraform.tfstate và
tfplan. Không commit runtime directory, state hay plan; nên commit lock file của
root module.

## Hoạt động

1. Trước plan, viết dự đoán số resource sẽ tạo.
2. Apply, sau đó plan lại và giải thích “No changes”.
3. Đổi environment từ dev sang prod. Dự đoán update hay replace rồi kiểm chứng.
4. Mở state chỉ để quan sát, không sửa. Tìm resource address và input.
5. Xóa configuration của resource nhưng chưa apply; đọc plan destroy.
6. Khôi phục code và xác nhận plan trở lại không đổi.

## Terraform không thay thế

- Configuration management bên trong OS chuyên sâu (Ansible, cloud-init…).
- Application deployment strategy hoàn chỉnh.
- Monitoring, backup verification, incident response hay security governance.
- Kiến thức cloud/network/IAM. Terraform khuếch đại cả thiết kế tốt lẫn thiết kế xấu.

## Lỗi thường gặp

- Tin rằng file main.tf chạy trước network.tf: mọi file cùng module được hợp nhất.
- Dùng target trong workflow thường ngày: nó tạo plan không đầy đủ.
- Apply trực tiếp không đọc replacement/destroy.
- Cho rằng sensitive output mã hóa state: nó chỉ che CLI/UI, state vẫn cần bảo vệ.

## Tiêu chí hoàn thành

- Tự vẽ lại mô hình reconcile và giải thích từng input.
- Chạy đủ init → validate → plan → apply → plan → destroy.
- Giải thích idempotency, partial failure và vì sao state là dữ liệu nhạy cảm.

