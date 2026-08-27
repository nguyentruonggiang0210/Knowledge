# Lesson 03 — CLI workflow, providers và OCI authentication

## Mục tiêu

- Hiểu provider source address, configuration, alias và lock file.
- Dùng CLI workflow an toàn cho local và automation.
- Xác thực OCI mà không đưa credential vào code.
- Đọc provider schema và tài liệu resource.

## Terraform Core, provider và backend

~~~mermaid
flowchart LR
  CLI[Terraform Core/CLI] -->|RPC + schema| PR[oracle/oci provider]
  PR -->|OCI API| OCI[OCI resources]
  CLI --> BE[Backend: state + lock]
~~~

Provider quản lý resource API; backend lưu state. Provider requirement thuộc mọi
module cần provider; provider configuration thường chỉ ở root module và được
truyền xuống child module.

## Version constraints và lock file

~~~hcl
terraform {
  required_version = ">= 1.7.0, < 2.0.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 8.0.0, < 9.0.0"
    }
  }
}
~~~

Constraint chọn tập version được phép. .terraform.lock.hcl ghi version/checksum đã
chọn; commit lock file ở deployable root module. terraform init -upgrade chỉ chạy
trong PR nâng dependency riêng, đọc changelog và test plan trước merge.

## CLI workflow

| Command | Mục đích | Lưu ý production |
|---|---|---|
| fmt -check -recursive | Format gate | Không chứng minh logic đúng |
| init | Backend, module, provider | Dùng -input=false trong CI |
| validate | Syntax/schema nội bộ | Chưa gọi API đầy đủ |
| plan -out=tfplan | Refresh + diff + lưu plan | Plan có thể chứa secret |
| show tfplan | Review | Dùng show -json cho policy tooling |
| apply tfplan | Apply đúng saved plan | Saved plan đã apply không tái sử dụng |
| destroy | Plan/apply phá toàn stack | Không dùng mù trong shared/prod |
| providers/schema | Debug dependency/schema | Hữu ích khi nâng version |
| graph | Xuất dependency graph | Kết hợp Graphviz |

Detailed exit code cho CI: 0 = không đổi, 1 = lỗi, 2 = có diff. Đừng viết pipeline
coi mọi non-zero là lỗi.

## OCI authentication

OCI provider hỗ trợ API Key, Instance Principal, Resource Principal, Security
Token và OKE Workload Identity. Chọn theo execution environment:

| Nơi chạy | Khuyến nghị |
|---|---|
| Laptop | OCI config profile/API key hoặc security token ngắn hạn |
| OCI Compute runner | Instance Principal + dynamic group |
| OCI Functions/Resource Manager | Resource/managed principal thích hợp |
| OKE workload | Workload Identity |
| CI ngoài OCI | Federation/dynamic credential nếu có; nếu buộc dùng key, vault + rotate |

Lab dùng config_file_profile; file config/private key nằm ngoài repo.

## Lab read-only OCI

Lab đọc Availability Domains, không tạo resource nhưng cần quyền inspect.

~~~powershell
cd Lessions/03-cli-workflow-providers/lab
Copy-Item terraform.tfvars.example terraform.tfvars
# Chỉ điền region, compartment OCID và profile; file đã bị gitignore.
terraform init
terraform providers
terraform validate
terraform plan
terraform output
~~~

Nếu chưa có OCI, vẫn chạy terraform init -backend=false và terraform validate;
plan sẽ dừng ở authentication/data-source read.

## Hoạt động

1. Xóa lock file, init và so sánh; sau đó khôi phục/commit lock file.
2. Chạy terraform providers schema -json và tìm schema của data source.
3. Cố ý đặt constraint không tồn tại để đọc solver diagnostic rồi sửa lại.
4. Tạo provider alias cho region DR trên giấy; chưa tạo resource.
5. So sánh plan thường với plan -refresh=false và giải thích rủi ro.

## Lỗi thường gặp

- Cấu hình provider trong child module, làm alias khó truyền và credential phân tán.
- Ghi credential vào provider/backend block hay tfvars.
- Dùng constraint mở hoàn toàn hoặc nâng provider tự động ngay trước apply.
- Dùng apply -auto-approve trên máy cá nhân với production.
- Tưởng validate xác nhận quota, IAM, OCID và cloud API.

## Tiêu chí hoàn thành

- Giải thích source address, constraint và lock file.
- Chọn đúng auth cho laptop, OCI runner và OKE.
- Chạy được read-only plan hoặc giải thích chính xác điểm thiếu credential.

## Nguồn chính thức

- OCI provider registry: https://registry.terraform.io/providers/oracle/oci/latest/docs
- OCI authentication: https://docs.oracle.com/en-us/iaas/Content/dev/terraform/configuring.htm
- Terraform init: https://developer.hashicorp.com/terraform/cli/init
- Plan: https://developer.hashicorp.com/terraform/cli/commands/plan

