# Đáp án Level 2 – Core Terraform

Tổng: **25 điểm**.

## C01 (1 điểm)

**B.** Reference tới attribute của VCN tạo cạnh trong dependency graph.

## C02 (2 điểm)

- 0,75: implicit dependency đến từ expression tham chiếu output/attribute tài nguyên khác; Terraform biết chính xác dữ liệu và thường lập plan tốt hơn.
- 0,75: `depends_on` mô tả dependency hành vi không thể hiện qua data reference, ví dụ policy phải tồn tại trước workload dù workload không dùng attribute policy.
- 0,5: lạm dụng làm graph bảo thủ, tạo nhiều unknown value, giảm parallelism và che thiết kế interface kém.

## C03 (1 điểm)

**Sai.** File chỉ để tổ chức source. Trong cùng module, address vẫn là `oci_core_...<type>.<name>` nếu type/name và instance key không đổi.

## C04 (3 điểm)

Ví dụ:

```hcl
variable "subnets" {
  type = map(object({ cidr = string }))
}

resource "oci_core_subnet" "this" {
  for_each     = var.subnets
  display_name = each.key
  cidr_block   = each.value.cidr
  # ...
}
```

- 1 điểm: map/key ổn định; thêm key không dịch index của phần tử khác.
- 0,75: address từ dạng `oci_core_subnet.this[0]` sang `oci_core_subnet.this["web"]`.
- 1,25: trước apply production phải backup state và khai báo mapping bằng `moved` block (mỗi index → key) hoặc `terraform state mv` được review; plan phải chỉ ra không create/destroy ngoài ý muốn. Đổi key sau này vẫn là đổi address và cần `moved` tương ứng.

## C05 (1 điểm)

**B.** State là dữ liệu vận hành nhạy cảm và là mapping giữa address với remote object.

## C06 (3 điểm)

Cách sửa tối thiểu:

```hcl
for_each     = toset(var.subnet_names)
display_name = each.value
```

Hoặc dùng `{ for name in var.subnet_names : name => name }`. Chấm:

- 1 điểm: `toset(...)`/map hợp lệ.
- 1 điểm: key tạo address như `...["web"]`; thêm `app2` không làm đổi address `web` như index có thể làm.
- 1 điểm: set loại phần tử trùng; đổi `web` thành `frontend` bị hiểu là xóa/tạo mới nếu không dùng `moved`/state migration. Với object phức tạp nên dùng map có key identity tách khỏi display name.

## C07 (2 điểm)

```hcl
variable "environment" {
  type    = string
  default = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}
```

- 1 điểm: code đúng.
- 1 điểm: validation/type check thất bại sớm trong quá trình đánh giá configuration, trước khi create resource; interface rõ giúp phát hiện input sai và hỗ trợ tooling/refactor.

## C08 (2 điểm)

Module network nên expose contract tối thiểu như `vcn_id`, map `private_subnet_ids`, `public_subnet_ids`, có thể NSG ID cần thiết. Compute nhận output qua input của nó. Tham chiếu xuyên implementation detail tạo coupling, phá encapsulation, làm refactor network khó và thậm chí không hợp lệ qua module boundary. Chấm 1 điểm cho contract, 1 điểm cho lý do.

## C09 (1 điểm)

**B — `prevent_destroy`.** Đây là guard, không phải backup và cũng không bảo vệ trước xóa ngoài Terraform.

## C10 (1 điểm)

**Đúng.** `moved` cập nhật quan hệ address trong cấu hình/state khi refactor; migration vật lý region/cloud là một quy trình riêng.

## C11 (1 điểm)

**B.** Lock bảo vệ thao tác ghi đồng thời. Khả năng/cách locking phụ thuộc backend.

## C12 (3 điểm)

```hcl
locals {
  cidr_by_name = { for s in var.subnets : s.name => s.cidr }
}
```

- 1 điểm: dùng `=>` đúng.
- 0,75: duplicate key gây lỗi (trừ khi cố ý dùng grouping `...`, khi đó value thành nhóm/list).
- 1,25: nên đổi input thành `map(object({ cidr = string }))`, hoặc validation so sánh `length(distinct([...]))` với độ dài list. Ví dụ:

```hcl
validation {
  condition     = length(distinct([for s in var.subnets : s.name])) == length(var.subnets)
  error_message = "Subnet names must be unique."
}
```

## C13 (1 điểm)

**A — `can(...)`.** Nó trả boolean dựa trên việc expression có đánh giá thành công hay không.

## C14 (3 điểm)

- 0,75: inventory đúng VCN/OCID/compartment/region; backup và khóa/serialize writer state.
- 0,75: viết resource address/configuration tối thiểu rồi dùng `import` block + plan/apply, hoặc `terraform import ADDRESS OCID`.
- 1 điểm: chạy plan, bổ sung arguments theo desired state, phân biệt computed/default; không duyệt destroy/replace bất ngờ, review và test theo change window.
- 0,5: import chỉ bind remote ID vào address/state. Nó không tự xác định đầy đủ intent/desired configuration; công cụ generate config (nếu dùng) vẫn cần review và chỉnh sửa.

