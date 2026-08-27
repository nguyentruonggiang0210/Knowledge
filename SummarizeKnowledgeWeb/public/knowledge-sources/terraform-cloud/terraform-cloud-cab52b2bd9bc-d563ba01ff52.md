# Lesson 15 — Advanced patterns và migration

## Mục tiêu

- Biến đổi collection phức tạp thành stable resource graph.
- Dùng dynamic block, provider alias và multi-region có kiểm soát.
- Migrate count/for_each/module/provider address không churn.
- Biết giới hạn của tính năng mới và version-gate đúng.

## Stable identity trước cú pháp

Mọi resource instance cần business key bền. Index không phải identity nếu list có
thể reorder. Xây map:

~~~hcl
locals {
  deployments = {
    for pair in setproduct(keys(var.apps), keys(var.regions)) :
    "${pair[0]}@${pair[1]}" => {
      app    = pair[0]
      region = pair[1]
    }
    if var.apps[pair[0]].enabled && var.regions[pair[1]].enabled
  }
}
~~~

Key phải known ở plan và không sensitive. Đừng đưa computed OCID vào key; dùng
business name làm key, OCID làm value.

## Data shaping toolkit

- for/filter/group (...), flatten, setproduct cho cross-product.
- merge cho tag layers; thứ tự quyết định precedence.
- zipmap nối hai list đã kiểm cùng length.
- try chỉ bắt dynamic access/conversion error; đừng che lỗi thiết kế.
- can phù hợp validation; không dùng khắp code để nuốt schema issue.
- distinct/sort/toset/tolist có thể đổi ordering/type; hiểu trước khi làm address.
- transpose/matchkeys/chunklist dùng khi thật sự làm code rõ hơn.

Giữ transformation trong locals có tên và output/test nhỏ; một expression 20 dòng
khó review hơn vài bước typed.

## Dynamic block

dynamic sinh nested blocks, không sinh top-level resource và không sinh lifecycle/
provider meta-block. Dùng khi nested blocks thật sự lặp; nếu chỉ 1–2 block rõ ràng,
viết trực tiếp dễ đọc hơn.

~~~hcl
dynamic "route_rules" {
  for_each = var.routes
  iterator = route
  content {
    destination       = route.value.destination
    destination_type  = route.value.destination_type
    network_entity_id = route.value.target_id
  }
}
~~~

Keys/nested set ordering vẫn ảnh hưởng diff theo provider schema.

## Multi-region và provider alias

Provider configurations không tạo động bằng for_each. Khai báo alias tĩnh cho các
region/account được hỗ trợ, truyền xuống module:

~~~hcl
provider "oci" { region = var.primary_region }
provider "oci" { alias = "dr"; region = var.dr_region }

module "primary" {
  source    = "./modules/stack"
  providers = { oci = oci }
}

module "dr" {
  source    = "./modules/stack"
  providers = { oci = oci.dr }
}
~~~

Nếu số region tùy ý, cân nhắc mỗi region là root/state/pipeline instance thay vì
ép provider alias động. Multi-region state chung làm failure/lock/blast radius
liên kết; chọn boundary theo RTO/ownership.

## Migration patterns

### count → for_each

~~~hcl
moved {
  from = oci_core_instance.app[0]
  to   = oci_core_instance.app["api-a"]
}
~~~

Cần mapping từng instance. Plan phải 0 create/0 destroy nếu chỉ đổi address. Giữ
moved blocks đủ lâu để consumer đi qua upgrade path; xóa có release note.

### Đưa resource vào module

~~~hcl
moved {
  from = oci_core_vcn.main
  to   = module.network.oci_core_vcn.this
}
~~~

### Provider source đổi namespace

terraform state replace-provider dùng trong migration có backup/review; không sửa
provider address JSON. Nâng major provider tách PR, init -upgrade có lock diff,
schema/changelog/test và production rollout nhỏ trước.

### Handoff ownership

removed block với destroy=false ghi intent trong code khi Terraform không còn quản
lý object. Destination owner phải import và đạt clean plan trước/đúng change window.

## Unknown và evaluation

Terraform cần biết count/for_each keys, provider config và nhiều structural choice
ở plan. Nếu keys phụ thuộc resource ID, tách stack/layer hoặc chọn key từ input.
depends_on quá rộng làm module outputs unknown nhiều hơn. Không dùng target để né
unknown trong workflow thường xuyên.

## Tính năng mới

Ephemeral/write-only, configuration generation, bulk query/import, action/action
trigger và các cú pháp mới phụ thuộc Terraform/provider version. Trước dùng:

1. đọc tài liệu/changelog version cụ thể;
2. đặt required_version/provider constraint;
3. xem schema hỗ trợ attribute;
4. test state/plan/upgrade behavior;
5. có fallback/migration cho runner/OCI Resource Manager cũ.

Không đưa syntax mới vào reusable module nếu support matrix chưa nâng.

## Lab offline

~~~powershell
cd Lessions/15-advanced-patterns/lab
terraform init
terraform validate
terraform plan
terraform apply
terraform output -json
terraform destroy
~~~

Lab tạo cross-product app × region bằng stable composite key, không gọi cloud.

## Hoạt động

1. Reorder app/region maps, chứng minh address giữ nguyên.
2. Disable một region, dự đoán đúng instance keys bị destroy.
3. Migrate một count list sang map bằng moved blocks.
4. Viết dynamic route rules và test duplicate destination.
5. Tách DR region thành state riêng; thiết kế output contract và pipeline.
6. Nâng provider major giả lập: lock diff, schema diff, plan và rollback decision.

## Lỗi thường gặp

- Key là index, hash của cả object hoặc OCID computed.
- dynamic block cho mọi thứ làm module khó đọc.
- try(..., null) che typo/contract lỗi.
- Một multi-region mega-state giữ cả primary và DR.
- Xóa moved block trước khi mọi caller nâng.
- Dùng tính năng mới mà không required_version/compatibility test.

## Tiêu chí hoàn thành

- Cross-product graph stable và giải thích lifecycle mỗi key.
- Refactor address với 0 create/destroy.
- Multi-region/provider/version strategy có boundary và support matrix.

