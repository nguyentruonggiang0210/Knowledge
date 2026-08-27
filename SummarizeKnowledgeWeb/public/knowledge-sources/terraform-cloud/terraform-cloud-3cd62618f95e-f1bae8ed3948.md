# Lesson 04 — Variables, locals, outputs và module interface

## Mục tiêu

- Thiết kế input contract có type, default, validation và description.
- Phân biệt variable, local, output và precedence của input.
- Tránh leak secret và tránh interface khó nâng cấp.
- Dùng precondition/postcondition/check đúng phạm vi.

## Vai trò

- **variable**: API đầu vào của root/child module; không nên dùng để tính lặp.
- **local**: tên cho biểu thức nội bộ; giảm lặp và chuẩn hóa dữ liệu.
- **output**: API đầu ra; cho người dùng, module cha hoặc automation.
- **ephemeral/sensitive**: kiểm soát lưu bền/hiển thị, không thay thế secret manager.

Input precedence của root module có nhiều nguồn và thay đổi theo môi trường chạy.
Đừng dựa vào trí nhớ để trộn quá nhiều nguồn. Team nên chuẩn hóa: defaults không
nhạy cảm + một env tfvars rõ ràng + TF_VAR cho secret/dynamic CI values.

## Interface tốt

~~~hcl
variable "application" {
  description = "Cấu hình application."
  type = object({
    name         = string
    instance_cnt = optional(number, 2)
    public       = optional(bool, false)
  })
  validation {
    condition     = var.application.instance_cnt >= 1
    error_message = "instance_cnt phải >= 1."
  }
}
~~~

Ưu tiên một object khi các field thay đổi cùng nhau, nhưng tránh “mega-object”
chứa toàn bộ hạ tầng. Không expose trực tiếp mọi argument provider; module phải
đưa ra opinion/guardrail có chủ đích.

## Validation layers

| Cơ chế | Dùng khi |
|---|---|
| Variable validation | Chỉ phụ thuộc input, báo lỗi sớm |
| Resource precondition | Điều kiện phải đúng trước operation |
| Resource postcondition | Provider trả về phải thỏa invariant |
| Check block | Health assertion có thể chạy ngoài resource lifecycle |
| Terraform test assert | Kiểm thử hành vi module qua các run |
| Policy as code | Guardrail cấp tổ chức trên plan/config |

## Secret rule

Không đặt password/private key thực trong default, example hay output. sensitive
chỉ redacts UI; state/plan có thể lưu plain value. Đọc secret từ Vault khi cần và
giới hạn state access như quyền đọc secret. Tốt hơn nữa, truyền reference/OCID tới
service thay vì material bí mật nếu API hỗ trợ.

## Lab

~~~powershell
cd Lessions/04-variables-locals-outputs/lab
terraform init
terraform validate
terraform plan -var-file="dev.tfvars"
terraform apply -var-file="dev.tfvars"
terraform output -json
terraform destroy -var-file="dev.tfvars"
~~~

## Hoạt động

1. Đặt environment=production, xem validation fail rồi dùng prod đúng chuẩn.
2. Thêm owner rỗng và tạo validation không cho trimspace(owner) rỗng.
3. Chạy bằng TF_VAR_application JSON thay tfvars.
4. Đánh dấu một output sensitive; so sánh output thường và output -json.
5. Thêm field optional health_path mà không phá caller hiện tại.

## Lỗi thường gặp

- Dùng variable thay local chỉ để caller tùy chỉnh mọi chi tiết.
- Output toàn resource object làm contract phụ thuộc provider schema.
- Lưu secret vào tfvars đã commit hoặc saved plan artifact công khai.
- Validation quá muộn trong provisioner/script.
- Default environment là prod hoặc mặc định public access.

## Tiêu chí hoàn thành

- Thiết kế object type tương thích ngược với optional attribute.
- Biết giá trị nào có thể vào state và bảo vệ đúng.
- Chọn đúng layer validation cho một invariant.

