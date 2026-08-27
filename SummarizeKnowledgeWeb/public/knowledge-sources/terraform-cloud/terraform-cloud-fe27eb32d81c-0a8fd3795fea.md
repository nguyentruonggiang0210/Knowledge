# Đáp án Level 1 – Foundation

Chỉ mở sau khi đã nộp phiếu trả lời. Tổng: **17 điểm**.

## F01 (1 điểm)

**B.** Terraform dùng configuration khai báo desired state, xây dependency graph và lập kế hoạch hành động để hạ tầng hội tụ. Nó không thay thế mọi công cụ cấu hình OS/application.

## F02 (1 điểm)

**Sai.** `plan` đọc configuration/state và thường refresh/đọc remote objects qua provider để lập kế hoạch, nhưng mặc định không thực hiện các hành động create/update/delete được đề xuất.

## F03 (1 điểm)

**B — `terraform init`.** Lệnh khởi tạo backend, tải module/provider dependency và chuẩn bị working directory.

## F04 (2 điểm)

- 0,5: đây là `resource` block, type `oci_core_subnet`, local name `app`.
- 0,5: `vcn_id` và `cidr_block` là argument.
- 1,0: `oci_core_vcn.main.id` là reference; nó cho Terraform biết subnet phụ thuộc VCN, không cần dựa vào thứ tự file.

## F05 (3 điểm)

Một cách sửa hợp lệ:

```hcl
terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 6.0, < 7.0"
    }
  }
}
```

- 1,5: cấu trúc object đúng (`source`, `version`).
- 0,75: `source` xác định namespace/type provider cần cài từ registry.
- 0,75: constraint mô tả dải tương thích; giới hạn major giảm nguy cơ nhận breaking change. Lock file sẽ ghi lựa chọn/checksum cụ thể. Constraint khác vẫn đạt nếu hợp lệ và có lập luận.

## F06 (1 điểm)

**B — `set(string)`.** Set biểu diễn phần tử duy nhất, không cam kết thứ tự có ý nghĩa.

## F07 (1 điểm)

**Sai.** `sensitive` chủ yếu che hiển thị trong CLI/UI theo propagation; giá trị vẫn có thể nằm trong state và plan artifact. Phải bảo vệ backend và tránh đưa secret vào Terraform nếu có lựa chọn tốt hơn.

## F08 (2 điểm)

- 1 điểm: cùng một desired state có thể áp dụng lặp lại; công cụ chỉ thực hiện delta cần thiết để hội tụ, không lặp mù quáng hành động tạo.
- 1 điểm: khi code, input, state/remote objects không đổi, plan kỳ vọng báo không có thay đổi. Nếu có thay đổi thì cần điều tra drift, nondeterministic input hoặc provider behavior.

## F09 (2 điểm)

- `+`: create; `~`: update in-place; `-`: destroy; `-/+`: replace (destroy rồi create; thứ tự có thể đổi bởi lifecycle).
- Replacement có thể gây downtime/mất dữ liệu/đổi identifier. Cần xem thuộc tính nào ép thay thế, dependency bị ảnh hưởng và lifecycle/backup trước duyệt.

Chấm 1 điểm cho ký hiệu, 1 điểm cho phân tích rủi ro.

## F10 (1 điểm)

**B — `data` block.** Nó đọc thông tin đối tượng tồn tại mà stack không nhận quản lý vòng đời đối tượng đó.

## F11 (1 điểm)

**A — `terraform fmt -recursive`.**

## F12 (1 điểm)

**Sai.** `validate` kiểm tra syntax và internal consistency trong configuration/module đã khởi tạo; nó không chứng minh credentials/quota/policy/region hay mọi điều kiện runtime của API đều hợp lệ.

