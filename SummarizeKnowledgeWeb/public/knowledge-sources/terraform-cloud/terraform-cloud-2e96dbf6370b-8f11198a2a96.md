# Đáp án Level 3 – OCI

Tổng: **27 điểm**.

## O01 (1 điểm)

**B.** Compartment là ranh giới tổ chức/scope quản trị quan trọng; nó không phải region hay network primitive.

## O02 (1 điểm)

**B — NAT Gateway**, kèm route từ private subnet tới NAT cho Internet egress. Rule outbound/return traffic và host policy vẫn phải phù hợp.

## O03 (1 điểm)

**Sai.** Cần toàn bộ đường đi: public subnet behavior/public IP, route tới Internet Gateway, gateway gắn VCN, NSG/security list, host firewall, service listener và return path.

## O04 (1 điểm)

**B.** NSG áp policy theo tập VNIC/workload; security list áp cho mọi VNIC trong subnet.

## O05 (2 điểm)

- 1 điểm routing: client ↔ public IP/LB; subnet LB có route tới IGW, return path hợp lệ; route nội bộ VCN tới private backend (và các route đặc biệt nếu qua appliance).
- 1 điểm security/application: listener 443, certificate, NSG/security list cho client→LB và LB→backend đúng port; backend listener/host firewall; health check. Route chọn next hop/khả năng reachability, còn security rule cho/không cho traffic; một bên đúng không bù được bên kia.

## O06 (3 điểm)

Mỗi nhóm đúng 0,5 điểm, tối đa 3:

- Service Gateway tồn tại, gắn đúng VCN và dùng đúng service CIDR/label cho Object Storage trong region.
- Route table thực sự gắn private subnet có destination service CIDR và target Service Gateway.
- Egress NSG/security list cho đúng protocol/port/destination; stateful/stateless và return rule phù hợp.
- DNS resolution/endpoint đúng region; ứng dụng không gọi endpoint public sai region/proxy sai.
- IAM authorization (instance principal/dynamic group/policy) tách biệt lỗi network.
- Kiểm tra gateway/subnet/VCN state, flow log/metrics, route/NSG association và thử kết nối có kiểm soát từ instance. Không cần mở inbound Internet.

## O07 (1 điểm)

**B.** Instance principal cấp danh tính workload; dynamic group nhận diện instance và policy cấp action/resource/scope tối thiểu.

## O08 (2 điểm)

- Group thường chứa **user**, membership quản trị trực tiếp; policy như `Allow group ... to ... in compartment ...` cấp quyền.
- Dynamic group chứa resource principal khớp rule (ví dụ instance theo compartment/tag/OCID), không chứa private key người dùng; policy tham chiếu dynamic group để workload gọi API.

Chấm 1 điểm mỗi loại và mối liên hệ policy.

## O09 (3 điểm)

- 0,75: render file/template, base64 khi provider/schema yêu cầu và truyền qua metadata `user_data`; script idempotent, log có kiểm soát.
- 0,75: không nhúng secret tĩnh; workload dùng instance principal để lấy secret từ secret manager/vault khi runtime, giới hạn policy và không log secret.
- 0,75: hiểu thay đổi metadata/user-data không đảm bảo chạy lại an toàn; xem plan/ForceNew behavior, dùng image version/replacement trigger hoặc cơ chế rollout rõ ràng.
- 0,75: bootstrap nhỏ thuộc instance creation; package/config dài hạn nên chuyển sang golden image pipeline hoặc config management khi cần test, version, drift remediation và rollout độc lập.

## O10 (3 điểm)

Khung root:

```hcl
terraform {
  required_providers {
    oci = {
      source = "oracle/oci"
    }
  }
}

provider "oci" {
  region = "ap-singapore-1"
}

provider "oci" {
  alias  = "dr"
  region = "ap-tokyo-1"
}

module "dr_stack" {
  source = "./modules/stack"
  providers = {
    oci = oci.dr
  }
}
```

- 1 điểm: hai provider configuration và alias đúng.
- 1 điểm: map `providers` tại module call đúng; module dùng local provider name `oci` sẽ nhận configuration Tokyo.
- 1 điểm: child khai báo `required_providers` source `oracle/oci`, không tự hard-code credential/region. Nếu child tự tham chiếu alias thì phải khai báo alias được mong đợi (`configuration_aliases`) và root map đúng local name.

## O11 (1 điểm)

**B.** Chính sách cụ thể phụ thuộc RPO/compliance; public write là phản mẫu.

## O12 (2 điểm)

Mỗi nhóm 1 điểm:

- LB config: listener/backend set/protocol/port, backend registration, health checker protocol/port/path/expected status, interval/timeout/retry, TLS/SNI nếu có.
- Network/app: NSG/security list từ LB tới backend và return path, subnet route nếu có appliance, host firewall, service bind đúng interface/port, log/metric health check. Không sửa bằng cách mở mọi port.

## O13 (3 điểm)

- 0,75: LB public; app ở private subnet, nhiều fault domain/AD khi region/shape hỗ trợ; không gắn public IP cho backend.
- 0,75: NSG theo luồng client→LB, LB→app, app→DB; egress qua NAT/Service Gateway phù hợp, route và DNS rõ.
- 0,75: health check + nhiều backend/autoscaling; database managed HA hoặc thiết kế replication/backup, backup được kiểm thử restore; data không đặt trên ephemeral node.
- 0,75: module boundary `network`, `security`, `compute/app`, `lb`, `data`; output ID/subnet/NSG cần thiết, tránh output secret. Có observability và failure-domain test được cộng trong cùng thang.

## O14 (3 điểm)

- 0,5: xác minh exact principal của pipeline, auth method/credential còn hiệu lực; không in private key/token.
- 0,5: xác minh subnet parent (VCN), compartment OCID, tenancy và region bằng lookup/console/audit có thẩm quyền.
- 0,5: kiểm tra policy verb/resource family/scope và inheritance; least privilege cho network operations cần thiết.
- 0,5: phân biệt 404 được che thành authorization: thử read/list có kiểm soát, đối chiếu audit request ID/API error.
- 0,5: kiểm tra provider alias/configuration truyền vào module và endpoint region.
- 0,5: sau policy/resource vừa tạo, cân nhắc propagation/eventual consistency bằng retry giới hạn; không biến sleep vô hạn thành giải pháp. Lưu request ID, timestamp, principal, region, address và redacted plan/log.

