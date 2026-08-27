# Lesson 07 — Module engineering, composition và versioning

## Mục tiêu

- Phân biệt root/child module và thiết kế module contract.
- Tổ chức module chuẩn, composition thay vì mega-module.
- Truyền provider alias đúng cách.
- Version/release/nâng cấp module an toàn.
- Test compatibility và deprecate interface có lộ trình.

## Module là gì?

Mỗi thư mục .tf là một module. Root module là working directory Terraform chạy;
child module được gọi bằng module block. Module nên đóng gói một capability có
cohesion, không chỉ là wrapper 1:1 mọi argument của một resource.

~~~mermaid
flowchart TD
  R[Root: environment + provider + backend] --> N[network module]
  R --> A[application module]
  N --> A
  R --> O[observability module]
  A --> O
~~~

Root sở hữu backend, provider configuration và wiring. Child module reusable khai
báo required_providers nhưng không cấu hình credential/provider block.

## Standard module shape

~~~text
modules/network/
├── README.md
├── versions.tf
├── variables.tf
├── main.tf
├── outputs.tf
├── tests/
└── examples/
~~~

Tên file chỉ giúp người đọc; Terraform hợp nhất file cùng folder. Nested folder
không tự được load. Đặt examples là root modules độc lập.

## Contract

- Input type cụ thể, validation, description và safe default.
- Output nhỏ, ổn định theo use case; tránh output toàn provider resource.
- Naming/tagging invariant nằm trong module, caller cung cấp context.
- Không đọc remote state/secret ẩn bên trong nếu có thể truyền dependency rõ ràng.
- Không tạo provider/compartment tùy ý ngoài ownership đã mô tả.

Một module tốt cho phép composition: network output subnet IDs; application nhận
subnet IDs. Tránh module “create_everything” làm mọi thay đổi có blast radius lớn.

## Provider inheritance và alias

Default provider có thể được child kế thừa, nhưng production nên wiring rõ. Child
module dùng alias phải khai báo configuration_aliases:

~~~hcl
terraform {
  required_providers {
    oci = {
      source                = "oracle/oci"
      configuration_aliases = [oci.replica]
    }
  }
}
~~~

Root:

~~~hcl
module "database" {
  source = "./modules/database"
  providers = {
    oci         = oci
    oci.replica = oci.dr
  }
}
~~~

Đừng đặt provider block trong reusable module; nó cản for_each/count/destroy và
làm auth khó kiểm soát.

## Source và version

| Source | Cách pin |
|---|---|
| Registry | version = "~> 2.3" |
| Git | ref là immutable tag/commit; tránh branch |
| Local | version cùng repository, không có version argument |
| Private registry | SemVer + access token ngoài code |

Lock file khóa provider selection, không khóa remote module version như dependency
lock đầy đủ. Vì vậy luôn có constraint/ref rõ và dependency update PR có plan/test.

SemVer: major phá contract, minor thêm backward-compatible, patch sửa bug. Cloud
resource behavior có thể vẫn tạo replacement; SemVer không loại bỏ yêu cầu đọc
plan. Publish changelog, upgrade guide và deprecation ít nhất một chu kỳ.

## Lab offline

Lab gọi naming module bằng for_each rồi dùng output làm resource input.

~~~powershell
cd Lessions/07-modules-versioning/lab
terraform init
terraform validate
terraform plan
terraform apply
terraform output
terraform destroy
~~~

## Hoạt động

1. Thêm component worker và xác nhận stable module address.
2. Thêm optional suffix backward-compatible; caller cũ vẫn validate.
3. Đổi output name thành full_name mà không migration; xem consumer fail rồi thiết
   kế deprecation output cũ.
4. Vẽ module graph cho network/app/observability, loại dependency vòng.
5. Viết changelog v1.1.0 và upgrade guide v2.0.0 giả lập.
6. Đề xuất test matrix Terraform 1.12/1.15 và OCI provider major được hỗ trợ.

## Anti-patterns

- Module chỉ rename mọi provider argument mà không thêm abstraction/guardrail.
- Mega-module với hàng trăm flags và conditional resources.
- Caller truyền provider credential vào variables.
- Output sensitive object rộng; consumer phải đọc cả state.
- Dùng relative path vượt nhiều repository hoặc Git branch mutable.
- Nâng module/provider và application change trong cùng PR lớn.

## Tiêu chí hoàn thành

- Thiết kế module API nhỏ, typed, documented và composition được.
- Giải thích provider alias wiring và module/provider version khác nhau.
- Nâng module minor không phá caller; major có migration plan.

