# Lesson 05 — Resources, data sources, graph và lifecycle

## Mục tiêu

- Đọc resource schema: required, optional, computed và replacement.
- Chọn count/for_each với identity ổn định.
- Dự đoán dependency graph và unknown propagation.
- Dùng lifecycle, condition, check và explicit dependency có chủ đích.

## Resource, instance và address

~~~hcl
resource "oci_core_subnet" "app" {
  for_each       = var.app_subnets
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  cidr_block     = each.value.cidr
}
~~~

- Block address: oci_core_subnet.app
- Instance address: oci_core_subnet.app["private-a"]
- Provider ID: OCID do OCI trả về, được lưu trong state

Tên local không đổi remote display name trừ khi argument dùng nó. Đổi address mà
không có moved/state mv làm Terraform thấy “xóa object cũ + tạo object mới”.

## Resource và data source

Resource khai báo quyền sở hữu vòng đời. Data source đọc object bên ngoài và có
thể được refresh ở plan hoặc trì hoãn tới apply nếu input unknown. Một data source
đọc theo display name không unique có thể gây lỗi/đổi kết quả; ưu tiên OCID hoặc
filter chặt và postcondition.

## count hay for_each?

| Tình huống | Chọn |
|---|---|
| Bật/tắt đúng một object | count với 0/1 có thể chấp nhận |
| Nhiều object có identity tự nhiên | for_each trên map/set string |
| List mà chèn/xóa/reorder được | Chuyển thành map stable key rồi for_each |
| Key chưa biết đến apply | Thiết kế lại; for_each key phải known |

Không dùng secret làm key. Không đổi count index sang for_each key mà thiếu moved
blocks vì mọi address thay đổi.

## Dependency graph

Reference vcn_id = oci_core_vcn.main.id tạo edge ngầm chính xác. depends_on chỉ
dùng cho dependency hành vi không thể biểu đạt bằng data reference, ví dụ IAM
policy phải propagate trước khi một API khác chạy. depends_on cả module làm graph
quá rộng, nhiều value thành unknown và giảm song song.

~~~mermaid
flowchart LR
  V[VCN] --> RT[Route table]
  V --> S[Subnet]
  RT --> S
  S --> I1[App instance A]
  S --> I2[App instance B]
  I1 --> B[LB backend set]
  I2 --> B
~~~

Chạy terraform graph -type=plan rồi Graphviz để quan sát, nhưng graph lớn nên kết
hợp terraform show -json và address cụ thể khi debug.

## Lifecycle

- create_before_destroy: tạo mới trước xóa cũ; vẫn cần quota, unique name và API
  cho phép hai object cùng tồn tại.
- prevent_destroy: chặn destroy trong config hiện tại; xóa cả block khỏi config
  cũng xóa luôn guard, nên không phải policy tổ chức.
- ignore_changes: giao ownership attribute cho hệ thống khác; có thể che drift.
- replace_triggered_by: thay resource khi resource/expression liên quan đổi.
- precondition/postcondition: invariant gắn với resource/data/output.

Dùng -replace=ADDRESS cho một lần thay có kiểm soát; không dùng taint trong workflow
mới. -target chỉ dành cho recovery đặc biệt rồi phải chạy full plan.

## Provisioner

Provisioner/local-exec/remote-exec là last resort: khó idempotent, cần network/
credential, lỗi giữa chừng khó mô hình trong state. Ưu tiên cloud-init, image build,
configuration management hoặc API provider chuyên dụng. never đưa private key vào
connection block/state.

## Lab offline

~~~powershell
cd Lessions/05-resources-data-graph/lab
terraform init
terraform validate
terraform plan
terraform graph -type=plan
terraform apply
terraform state list
terraform plan
terraform destroy
~~~

## Hoạt động

1. Reorder map input và xác nhận address không đổi.
2. Xóa key worker, đọc chính xác instance bị destroy.
3. Đổi release, quan sát replace_triggered_by/triggers_replace.
4. Bỏ reference network_id và dùng depends_on; giải thích vì sao value không còn
   truyền dữ liệu dù thứ tự vẫn có thể được ép.
5. Thêm prevent_destroy, thử plan destroy rồi gỡ guard có chủ đích.
6. Dự đoán tác động khi dùng timestamp() làm triggers_replace.

## Lỗi thường gặp

- depends_on để “sửa” một reference sai hoặc eventual consistency không hiểu rõ.
- ignore_changes = all để plan sạch giả tạo.
- for_each từ set object hoặc computed list không ổn định.
- create_before_destroy mà không tính quota/name collision/capacity.
- Data source query quá rộng và chọn phần tử [0].

## Tiêu chí hoàn thành

- Nhìn plan và giải thích chính xác address nào create/update/replace/destroy.
- Vẽ graph của lab và chỉ ra implicit edge.
- Chọn stable key và lifecycle mà không che drift.

