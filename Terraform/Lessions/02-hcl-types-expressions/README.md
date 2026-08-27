# Lesson 02 — HCL, type system và expressions

## Mục tiêu

- Đọc/viết block, argument, reference và expression.
- Dùng đúng primitive/collection/structural types.
- Làm chủ for, splat, conditional, function, null, unknown và sensitive.
- Dùng terraform console để thử biểu thức trước khi đưa vào module.

## Cú pháp

~~~hcl
block_type "label_1" "label_2" {
  argument_name = expression

  nested_block {
    enabled = true
  }
}
~~~

Resource có address dạng resource_type.local_name; instance dùng for_each có
address resource_type.local_name["key"]. Reference tạo dependency ngầm khi một
giá trị của resource A dùng attribute của B.

## Type system

| Nhóm | Type | Ghi chú |
|---|---|---|
| Primitive | string, number, bool | Terraform có thể convert khi không mơ hồ |
| Collection | list(T), set(T), map(T) | Set không có index/thứ tự ổn định |
| Structural | tuple([...]), object({...}) | Mỗi phần tử/attribute có type riêng |
| Special | any, null | any là constraint placeholder, không phải bỏ kiểm tra |

Khai báo type cụ thể ở module boundary. Dùng optional(T, default) cho attribute
tùy chọn. Tránh list(any) nếu một object contract rõ ràng hơn.

## Các giá trị cần phân biệt

- **null**: cố ý không đặt giá trị; provider có thể dùng default hoặc coi là bỏ qua.
- **unknown**: chỉ biết sau apply; plan hiển thị known after apply.
- **sensitive**: có metadata che hiển thị; vẫn tồn tại trong state/plan.
- **ephemeral**: với nơi Terraform hỗ trợ, giá trị không được lưu bền; phải kiểm
  tra compatibility của provider/resource trước khi dùng.

Không dùng count/for_each dựa trên giá trị unknown. Keys phải biết tại plan time
và không nên chứa secret vì chúng xuất hiện trong address/UI.

## Expressions quan trọng

~~~hcl
locals {
  production = var.environment == "prod"
  names      = [for s in var.services : lower(s.name)]
  enabled    = { for s in var.services : s.name => s if s.enabled }
  ports      = toset(flatten([for s in var.services : s.ports]))
  owner      = try(var.metadata.owner, "platform")
  cidr_ok    = can(cidrnetmask(var.vcn_cidr))
}
~~~

Học các function theo nhóm thay vì thuộc lòng: string, numeric, collection,
encoding, filesystem, date/time, IP network, type conversion. Chú ý file()/fileset()
đọc lúc cấu hình được đánh giá, không tạo dependency với file do resource sinh ra.

## Lab

~~~powershell
cd Lessions/02-hcl-types-expressions/lab
terraform init
terraform validate
terraform console -var-file="example.tfvars"
terraform plan -var-file="example.tfvars"
terraform apply -var-file="example.tfvars"
terraform destroy -var-file="example.tfvars"
~~~

Trong console thử:

~~~hcl
local.enabled_services
local.all_ports
jsonencode(local.enabled_services)
setproduct(["dev", "prod"], ["api", "web"])
cidrsubnet("10.20.0.0/16", 8, 10)
~~~

## Hoạt động

1. Thêm service worker disabled và xác nhận không có resource instance.
2. Đổi key for_each từ name sang index, xem address và giải thích rủi ro reorder.
3. Tạo duplicate port; so sánh list và set.
4. Làm input sai type, sai port validation và đọc diagnostic path.
5. Biến đổi services thành map dùng group-by symbol (...) khi tên trùng.

## Lỗi thường gặp

- Dùng set rồi mong output giữ đúng thứ tự input.
- Trộn nhiều object có shape khác nhau khiến inferred type khó hiểu.
- Dùng tostring/tonumber để che một module interface thiết kế sai.
- Đặt timestamp() vào resource input làm plan thay đổi mỗi lần.
- Dùng index count cho danh sách có thể chèn/xóa giữa.

## Tiêu chí hoàn thành

- Dự đoán type và kết quả của các local trong lab.
- Giải thích null/unknown/sensitive khác nhau thế nào.
- Tự viết for expression filter và map cho for_each có stable key.

