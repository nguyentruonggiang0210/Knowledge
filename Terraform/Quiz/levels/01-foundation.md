# Level 1 – Foundation

Làm bài không mở thư mục `answers/`. Tổng: **12 câu / 17 điểm**.

## F01 — Trắc nghiệm (1 điểm) · L01

Mô tả nào đúng nhất về cách Terraform làm việc?

A. Chạy tuần tự mọi lệnh shell do người dùng viết  
B. Khai báo trạng thái mong muốn, lập dependency graph và đề xuất thay đổi để hội tụ về trạng thái đó  
C. Chỉ tạo tài nguyên, không cập nhật hoặc xóa  
D. Thay thế hoàn toàn mọi công cụ cấu hình bên trong hệ điều hành

## F02 — Đúng/Sai (1 điểm) · L01, L03

`terraform plan` mặc định thay đổi hạ tầng thật để kiểm tra xem provider có quyền ghi hay không.

## F03 — Trắc nghiệm (1 điểm) · L03

Sau khi clone một root module có khai báo provider, lệnh nào thường phải chạy trước `validate`/`plan`?

A. `terraform output`  
B. `terraform init`  
C. `terraform state rm`  
D. `terraform force-unlock`

## F04 — Giải thích HCL (2 điểm) · L02, L05

Trong đoạn sau, chỉ ra: (a) loại block, (b) hai argument, và (c) reference tạo implicit dependency.

```hcl
resource "oci_core_subnet" "app" {
  vcn_id     = oci_core_vcn.main.id
  cidr_block = "10.0.10.0/24"
}
```

## F05 — Debug code (3 điểm) · L03

Đoạn cấu hình sau không đúng cú pháp `required_providers`. Viết lại cho đúng và giải thích mục đích của `source` và version constraint.

```hcl
terraform {
  required_providers {
    oci = "oracle/oci >= 6.0"
  }
}
```

Không cần chọn một version OCI provider “mới nhất”; chỉ cần dùng constraint hợp lệ và giải thích trade-off.

## F06 — Trắc nghiệm (1 điểm) · L02

Kiểu nào phù hợp nhất khi mỗi tên availability domain phải duy nhất và thứ tự không mang ý nghĩa?

A. `list(string)`  
B. `set(string)`  
C. `tuple([string])`  
D. `map(number)`

## F07 — Đúng/Sai (1 điểm) · L04, L06, L12

Đặt `sensitive = true` cho một variable đảm bảo giá trị đó không bao giờ xuất hiện trong Terraform state.

## F08 — Giải thích (2 điểm) · L01, L03

Giải thích tính **idempotent/hội tụ** trong IaC. Sau một lần `apply` thành công, điều gì được kỳ vọng khi chạy lại `plan` mà code, input và hạ tầng không đổi?

## F09 — Giải thích plan (2 điểm) · L03, L05

Trong execution plan, phân biệt ý nghĩa tổng quát của `+`, `~`, `-` và `-/+`. Vì sao phải xem chi tiết thuộc tính “forces replacement” trước khi duyệt?

## F10 — Trắc nghiệm (1 điểm) · L05

Khi muốn **tra cứu** một OCI image đã tồn tại mà không quản lý vòng đời của nó trong stack hiện tại, nên ưu tiên gì?

A. `resource` block  
B. `data` block  
C. `output` block  
D. `moved` block

## F11 — Trắc nghiệm (1 điểm) · L03, L13

Lệnh nào vừa chuẩn hóa định dạng HCL trong toàn bộ module con dưới thư mục hiện tại?

A. `terraform fmt -recursive`  
B. `terraform validate -json`  
C. `terraform show -recursive`  
D. `terraform providers lock -recursive`

## F12 — Đúng/Sai (1 điểm) · L03, L13

Nếu `terraform validate` thành công thì có thể kết luận chắc chắn credentials OCI hợp lệ và mọi tài nguyên sẽ tạo được.
