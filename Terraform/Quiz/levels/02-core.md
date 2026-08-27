# Level 2 – Core Terraform

Tổng: **14 câu / 25 điểm**. Với bài debug/refactor, phải nêu ảnh hưởng đến resource address và state.

## C01 — Trắc nghiệm (1 điểm) · L05

Terraform thường suy ra thứ tự tạo subnet sau VCN từ yếu tố nào?

A. Thứ tự file `.tf` theo alphabet  
B. Reference `vcn_id = oci_core_vcn.main.id`  
C. Thứ tự block trong cùng file  
D. Tên local resource bắt đầu bằng `main`

## C02 — Giải thích dependency (2 điểm) · L05

Phân biệt implicit dependency và explicit dependency (`depends_on`). Nêu một trường hợp hợp lệ phải dùng `depends_on` và một tác hại khi lạm dụng.

## C03 — Đúng/Sai (1 điểm) · L01, L05

Di chuyển một resource block từ `network.tf` sang `main.tf` trong **cùng module**, giữ nguyên type và local name, mặc định sẽ làm đổi resource address.

## C04 — Tình huống refactor (3 điểm) · L05, L06, L15

Bạn quản lý ba subnet bằng `count` từ một list. Chèn subnet mới vào đầu list khiến plan đổi index và thay thế sai tài nguyên. Hãy đề xuất cấu trúc input và `for_each` ổn định hơn; minh họa resource address trước/sau và nêu bước bảo vệ state khi chuyển đổi tài nguyên đã tồn tại.

## C05 — Trắc nghiệm (1 điểm) · L06, L12

Đâu là mô tả đúng nhất về state?

A. Chỉ là cache, mất cũng không ảnh hưởng  
B. Có thể chứa identifier và dữ liệu nhạy cảm; cần kiểm soát truy cập, mã hóa, versioning/backup phù hợp  
C. Nên commit vào Git để mọi người cùng sửa  
D. Chỉ remote state mới chứa secret

## C06 — Debug code (3 điểm) · L02, L05

Đoạn sau lỗi vì `for_each` không nhận list string trực tiếp. Sửa lỗi, rồi giải thích vì sao dùng tên làm key có thể ổn định hơn `count` và rủi ro khi đổi tên key.

```hcl
variable "subnet_names" {
  type    = list(string)
  default = ["web", "app"]
}

resource "oci_core_subnet" "tier" {
  for_each     = var.subnet_names
  display_name = each.value
  # ...
}
```

## C07 — Giải thích type/validation (2 điểm) · L02, L04

Viết khai báo variable `environment` kiểu string, mặc định `dev`, chỉ chấp nhận `dev`, `staging`, `prod`. Giải thích validation xảy ra trước hay sau khi tạo resource và lợi ích của type constraint rõ ràng.

## C08 — Giải thích module interface (2 điểm) · L07

Một module network nên expose output gì để module compute sử dụng? Vì sao module compute không nên tham chiếu xuyên qua implementation detail bên trong module network?

## C09 — Trắc nghiệm (1 điểm) · L05

Meta-argument nào chặn plan xóa một resource, kể cả khi code vô tình yêu cầu xóa, cho đến khi guard đó được thay đổi?

A. `create_before_destroy`  
B. `prevent_destroy`  
C. `ignore_changes`  
D. `replace_triggered_by`

## C10 — Đúng/Sai (1 điểm) · L06

`moved` block dùng để mô tả việc đổi địa chỉ resource/module trong state khi refactor; nó không tự di chuyển tài nguyên thật giữa hai cloud/region.

## C11 — Trắc nghiệm (1 điểm) · L06

Mục tiêu chính của state locking là gì?

A. Mã hóa mọi secret trong code  
B. Ngăn hai thao tác ghi state đồng thời gây race/corruption  
C. Cấm mọi người chạy `plan`  
D. Pin phiên bản provider

## C12 — Debug expression (3 điểm) · L02, L05

Code sau muốn tạo map `tên => CIDR` nhưng cú pháp sai. Sửa expression, nêu hành vi nếu hai phần tử có cùng `name`, và đề xuất validation hoặc data model để ngăn lỗi.

```hcl
variable "subnets" {
  type = list(object({
    name = string
    cidr = string
  }))
}

locals {
  cidr_by_name = { for s in var.subnets : s.name = s.cidr }
}
```

## C13 — Trắc nghiệm (1 điểm) · L02, L04

Hàm nào phù hợp để kiểm tra một conversion/expression có thể đánh giá mà không phát sinh lỗi, thường dùng trong validation?

A. `can(...)`  
B. `file(...)`  
C. `timestamp()`  
D. `coalesce(...)`

## C14 — Tình huống import (3 điểm) · L06

Một VCN được tạo thủ công cần đưa vào Terraform mà không tạo lại. Mô tả quy trình an toàn từ backup state, viết resource/import block hoặc chạy `terraform import`, đối chiếu plan, đến xử lý các thuộc tính khác biệt. Nêu rõ vì sao **import không tự viết đầy đủ cấu hình mong muốn** cho bạn.
