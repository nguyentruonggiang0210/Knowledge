# Terraform CLI cheatsheet an toàn

## Vòng lặp local

~~~powershell
terraform version
terraform fmt -check -recursive
terraform init
terraform validate
terraform test
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
terraform plan
~~~

Không lưu/commit tfplan hoặc state. Chỉ destroy sau khi xác minh đúng root/backend/
workspace/account:

~~~powershell
terraform plan -destroy -out=destroy.tfplan
terraform show destroy.tfplan
terraform apply destroy.tfplan
~~~

## Automation

~~~powershell
terraform init -input=false
terraform plan -input=false -detailed-exitcode -out=tfplan
terraform show -json tfplan
terraform apply -input=false tfplan
~~~

Exit code plan: 0 no change, 1 error, 2 has changes.

## Inspect

~~~powershell
terraform providers
terraform providers schema -json
terraform state list
terraform state show 'module.app.oci_core_instance.this["api-a"]'
terraform output
terraform output -json
terraform show -json tfplan
terraform graph -type=plan
terraform console
~~~

## State/backend

~~~powershell
terraform state pull
terraform init -migrate-state -backend-config="backend.dev.tfbackend"
terraform init -reconfigure -backend-config="backend.dev.tfbackend"
terraform plan -refresh-only
terraform apply -refresh-only
~~~

state mv/rm/push, force-unlock và backend migration là change operations. Trước
chạy: dừng writers, backup, xác minh exact address/state/lock, peer review và full
plan sau thao tác.

~~~powershell
terraform state mv 'old_address' 'new_address'
terraform state rm 'address_to_handoff'
terraform force-unlock LOCK_ID
~~~

Ưu tiên moved/removed/import blocks trong code thay manual state command.

## Import/refactor

~~~hcl
import {
  to = oci_core_vcn.existing
  id = "ocid1.vcn..."
}

moved {
  from = oci_core_vcn.main
  to   = module.network.oci_core_vcn.this
}
~~~

Import thành công chưa đủ; plan phải sạch/được giải thích.

## Replacement và recovery

~~~powershell
terraform plan -replace='oci_core_instance.app["api-a"]'
terraform apply -replace='oci_core_instance.app["api-a"]'
~~~

-replace rõ intent hơn taint. -target chỉ dùng break-glass/recovery, sau đó luôn
chạy full plan. Không dùng ignore_changes để làm drift “biến mất”.

## Provider/module upgrade

~~~powershell
terraform init -upgrade
terraform providers lock -platform=windows_amd64 -platform=linux_amd64
terraform providers mirror ./provider-mirror
~~~

Chỉ init -upgrade trong dependency PR, review changelog/lock/plan/test. version
argument khóa Registry module; lock file không khóa remote module đầy đủ.

## OCI variables local

~~~powershell
$env:OCI_CLI_PROFILE = "TF-LEARNING"
$env:TF_VAR_region = "ap-singapore-1"
$env:TF_VAR_compartment_id = "ocid1.compartment..."
~~~

~~~bash
export OCI_CLI_PROFILE="TF-LEARNING"
export TF_VAR_region="ap-singapore-1"
export TF_VAR_compartment_id="ocid1.compartment..."
~~~

Không ghi private key/token/password vào history, tfvars, provider/backend block
hoặc CI log.

## Đọc plan

| Ký hiệu | Ý nghĩa |
|---|---|
| + | create |
| ~ | update in-place |
| - | destroy |
| -/+ hoặc +/- | replace; thứ tự destroy/create phụ thuộc lifecycle |
| <= | read data source |
| known after apply | unknown tại plan |

Checklist review: đúng state/account/region; create/update/replace/delete counts;
replacement path; public exposure; secret; cost/quota; unknown; dependency; test/
policy; rollback/roll-forward; cleanup.

