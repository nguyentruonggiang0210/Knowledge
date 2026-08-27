# Lesson 10 — OCI compute và storage

## Mục tiêu

- Chọn image, shape, AD/FD và launch option theo workload.
- Dùng cloud-init/immutable image thay provisioner.
- Thiết kế boot/block/object/file storage và backup.
- Biết khi nào dùng instance, instance pool/autoscaling hoặc managed compute.

## Compute mental model

~~~mermaid
flowchart LR
  IMG[Image / golden image] --> I[Compute instance]
  SH[Shape + shape_config] --> I
  AD[AD / FD / capacity] --> I
  SN[Private subnet + NSG] --> V[VNIC] --> I
  CI[cloud-init metadata] --> I
  BV[Boot volume] --> I
  VOL[Block volume] -->|attachment| I
~~~

### Image

Image OCID khác theo region và được cập nhật. Không hard-code một OCID dùng mọi
region. Có ba pattern:

1. Input image_id đã được pipeline image promotion phê duyệt.
2. Data source lọc OS/version/shape rồi sort; pin version rõ, không lấy [0] mù.
3. Golden image từ Packer/Image Builder, promote OCID qua artifact registry/SSM
   nội bộ, có scan/SBOM.

### Shape và capacity

Flexible shape cần OCPU/memory hợp lệ theo shape. Always Free/quota/capacity thay
đổi theo tenancy/region. Plan không giữ chỗ capacity. Production cân nhắc capacity
reservation, dedicated/VM/BM, AMD/Intel/Arm compatibility, live migration, cost
và licensing.

AD name tenancy-specific; lấy bằng data source. Trải instance/pool qua AD/FD theo
RTO/RPO, nhưng region một AD vẫn cần nhiều FD. Không đặt tất cả stateful replica
cùng failure domain.

## Bootstrap

OCI instance metadata nhận ssh_authorized_keys và base64 cloud-init user_data.
Cloud-init nên:

- idempotent, log rõ và fail fast;
- lấy package từ trusted source;
- không chứa long-lived secret;
- chỉ bootstrap agent/app tối thiểu;
- phát health signal cho load balancer/monitoring.

Terraform apply có thể thành công trước cloud-init/app sẵn sàng. Dùng load balancer
health, instance pool lifecycle, monitoring và smoke test thay vì remote-exec.

Private instance không public IP. Admin qua Bastion/VPN/managed access, MFA và
short-lived key; không mở SSH toàn Internet.

## Scaling và immutability

- Một instance: lab/utility, blast radius cao.
- Instance configuration + instance pool: template và nhiều node.
- Autoscaling: metric/schedule, min/max/cooldown.
- OKE/Functions: khi workload phù hợp container/event-driven.

Thay image thường nên rolling replacement qua pool/LB. create_before_destroy trên
một instance không tự tạo zero downtime nếu name/IP/volume/quota không cho phép.

## Storage

| Dịch vụ | Dùng cho | Điều cần thiết kế |
|---|---|---|
| Boot volume | OS disk | backup, encryption, preserve/delete |
| Block Volume | Low-latency attached disk | AD/attachment/performance/backup |
| Object Storage | Object, artifact, log, backup, state | namespace, tier, versioning, lifecycle, private access |
| File Storage | Shared NFS | mount target/export/options/network/backup |
| Local NVMe | Ephemeral high IOPS theo shape | dữ liệu mất khi host/instance lifecycle |

Terraform state backup không thay backup volume/database. Backup policy phải kèm
restore test; snapshot tồn tại không chứng minh RTO/RPO đạt.

KMS encryption: OCI-managed key đơn giản; customer-managed key tăng kiểm soát và
rủi ro mất quyền/key. Thiết kế rotation, deletion protection, IAM và DR của key.

## Lab opt-in

Mặc định create_instance=false và create_bucket=false để không tạo tài nguyên.
Muốn tạo instance cần private subnet, NSG, AD, image OCID và SSH public key. Code
không nhận private key.

~~~powershell
cd Lessions/10-oci-compute-storage/lab
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init
terraform validate
terraform plan
# Chỉ bật từng flag sau khi kiểm tra quota và giá:
terraform apply
terraform plan
terraform destroy
~~~

Tạo bucket cần tên unique trong Object Storage namespace. Bucket versioning làm
destroy có thể thất bại khi còn object/version; cleanup dữ liệu có kiểm soát.

## Hoạt động

1. Query image bằng oci_core_images và chứng minh filter trả đúng một image.
2. Launch private instance, kiểm tra cloud-init log qua Bastion/serial console.
3. Đổi image_id, dự đoán replacement và thiết kế rolling pool thay thế.
4. Attach block volume, tạo file, backup và diễn tập restore sang volume mới.
5. Bật Object Storage versioning, upload hai version, thử lifecycle/delete.
6. Tính chi phí OCPU/memory/boot/NAT/backup trước apply.

## Lỗi thường gặp

- Private key nằm trong repository, metadata hoặc Terraform state.
- Lấy images[0] mà không sort/pin.
- Gắn public IP cho app node sau LB.
- Dùng provisioner SSH để cài toàn bộ app.
- preserve boot volume khi destroy nhưng không có ownership/cleanup.
- Có backup policy nhưng chưa từng restore.

## Tiêu chí hoàn thành

- Instance private, NSG least privilege, cloud-init idempotent và health được kiểm.
- Plan replacement được dự đoán và có rolling strategy.
- Chọn đúng storage, encryption, backup và restore runbook.

## Data-source image mẫu

~~~hcl
data "oci_core_images" "approved" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  operating_system_version = "9"
  shape                    = var.shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}
~~~

Hãy thêm validation/precondition cho số kết quả và policy image tuổi/CVE; không
mặc định dùng phần tử mới nhất ở production nếu chưa qua promotion.

