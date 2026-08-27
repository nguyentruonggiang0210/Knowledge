# Lesson 06 — State, backend, locking, import và refactor

## Mục tiêu

- Hiểu state binding, lineage/serial, locking và security.
- Thiết kế native OCI backend có versioning, encryption và least privilege.
- Migrate backend, inspect/move/remove state bằng lệnh an toàn.
- Import brownfield và refactor address không recreate remote object.
- Phát hiện drift và xử lý emergency change.

## State là gì?

State lưu binding một-một giữa resource instance address và remote object, cùng
metadata/attribute dùng để diff và graph. Configuration là desired intent; API là
thực tế; state là trí nhớ của Terraform. Không sửa JSON state bằng editor.

~~~mermaid
flowchart TD
  C[Configuration address] <-->|binding| S[State snapshot]
  S <-->|refresh by provider ID| R[OCI remote object]
  L[Backend lock] --> S
  V[Bucket versioning/backup] --> S
~~~

State và saved plan có thể chứa password, private key, connection string và backend
credential. sensitive chỉ che display. Quyền đọc state thường tương đương quyền
đọc secret của stack.

## Backend production trên OCI

Terraform 1.12+ có native backend oci, lưu state trong OCI Object Storage và hỗ trợ
locking/workspaces. Bật bucket versioning, encryption/KMS phù hợp, private access,
audit và lifecycle retention. Tách key/bucket/quyền theo environment và blast
radius. OCI Resource Manager là lựa chọn managed khác: stack giữ state và serialize
job.

Backend block không dùng variable/local/data source. Dùng partial configuration:

~~~hcl
terraform {
  backend "oci" {}
}
~~~

~~~powershell
terraform init -migrate-state -backend-config="backend.dev.tfbackend"
~~~

Không đưa secret qua backend config file/CLI; backend config được cache trong
.terraform và captured trong plan. Dùng OCI config/environment/principal.

## Locking và recovery

- Một state chỉ có một writer. CI cần concurrency group bên cạnh backend locking.
- Chỉ force-unlock khi đã xác minh writer cũ chết, lock ID đúng và không còn apply.
- Trước migrate/state surgery: ngừng writer, backup state, ghi ticket/change,
  chạy lệnh bằng address chính xác, rồi full plan.
- Bucket state backup không phải backup database/application data.
- Restore version cũ có thể làm state quên resource mới; luôn điều tra serial và
  reconcile, không restore mù.

## State commands

| Command | Dùng để |
|---|---|
| state list/show | Inspect address/object |
| state mv | Đổi binding khi không dùng moved được |
| state rm | Quên binding, không xóa remote object |
| state pull | Backup/diagnostic; bảo vệ output |
| state push | Break-glass nguy hiểm, cần review |
| force-unlock LOCK_ID | Gỡ stale lock sau xác minh |
| plan -refresh-only | Ghi nhận drift mà không đổi config intent |
| apply -refresh-only | Chấp nhận refresh plan có review |

## Import brownfield

1. Xác định ownership và OCID duy nhất.
2. Viết resource configuration tối thiểu đúng provider schema.
3. Dùng import block để review trong code.
4. Plan, bổ sung argument cho đến khi không còn diff ngoài dự kiến.
5. Merge ownership/docs; không bind cùng remote object vào hai address/state.

~~~hcl
import {
  to = oci_core_vcn.existing
  id = "ocid1.vcn..."
}
~~~

Một số Terraform/provider mới hỗ trợ query/bulk import hoặc generate config. Đây
là bootstrap, không phải production-quality code; phải review tên, type, secret,
lifecycle và defaults. OCI Resource Discovery/Resource Manager có thể giúp tạo
configuration nhưng vẫn cần cleanup.

## Refactor

Ưu tiên moved block vì lịch sử migration nằm trong code:

~~~hcl
moved {
  from = oci_core_vcn.main
  to   = module.network.oci_core_vcn.this
}
~~~

Dùng một moved block cho từng instance mapping khi chuyển count sang for_each.
removed block với destroy=false diễn đạt handoff ownership; state rm là thao tác
operator. Khi move giữa hai state, cần runbook/backup/locking hai phía và version
Terraform hỗ trợ; nếu không, import destination rồi remove source rất cẩn thận.

## CLI workspaces

Workspace tạo nhiều state cho cùng configuration nhưng thường dùng chung backend
credential và code. Nó không phải security boundary. Với prod/dev khác quyền,
blast radius, backend và lifecycle, dùng root directory/state/identity tách biệt.
HCP Terraform workspace là khái niệm khác CLI workspace.

## Lab refactor offline

~~~powershell
cd Lessions/06-state-backend-import-refactor/lab/01-before
terraform init
terraform apply
terraform state list

cd ../02-after
Copy-Item ../01-before/terraform.tfstate .
terraform init
terraform plan
terraform apply
terraform state list
~~~

Plan ở 02-after phải không create/destroy nhờ moved block. Đây chỉ là lab copy
local state; production không copy state file tùy tiện.

Backend templates nằm ở thư mục lab. Chỉ thử migration khi đã tạo bucket riêng:

~~~powershell
Copy-Item backend.tf.example backend.tf
terraform init -migrate-state -backend-config="backend.dev.tfbackend.example"
~~~

## Hoạt động

1. Migrate local state thử nghiệm sang native OCI backend và về local có backup.
2. Chạy hai plan/apply để quan sát lock; không force-unlock writer đang sống.
3. Tạo manual drift với một resource lab OCI, chạy plan và refresh-only plan.
4. Import một VCN test có sẵn, đạt plan sạch rồi thêm moved block vào module.
5. Viết runbook recovery khi state object bị xóa nhưng bucket còn version trước.

## Lỗi thường gặp

- Commit state/plan hoặc chia sẻ qua chat.
- Dùng workspace để “cách ly” prod nhưng cùng credential có toàn quyền.
- Import xong dừng ở “Import successful” dù plan muốn replace.
- state rm rồi quên handoff remote object.
- ignore_changes để che mọi manual drift.
- force-unlock vì “pipeline chạy lâu”.

## Tiêu chí hoàn thành

- Refactor lab với 0 add/0 destroy.
- Giải thích native backend, lock, version recovery và blast radius.
- Import object tới clean plan; phân loại drift: revert, accept hay handoff.

## Nguồn chính thức

- Terraform state: https://developer.hashicorp.com/terraform/language/state
- Native OCI backend: https://developer.hashicorp.com/terraform/language/backend/oci
- OCI Object Storage state: https://docs.oracle.com/en-us/iaas/Content/dev/terraform/object-storage-state.htm
- OCI Resource Manager state: https://docs.oracle.com/en-us/iaas/Content/ResourceManager/Concepts/resourcemanager.htm

