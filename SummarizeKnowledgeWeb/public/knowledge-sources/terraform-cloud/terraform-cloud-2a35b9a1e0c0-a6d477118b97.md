# Lesson 09 — OCI networking từ VCN đến hybrid

## Mục tiêu

- Thiết kế CIDR, VCN, regional subnet, route và gateway.
- Phân biệt NSG/Security List, stateful/stateless và return path.
- Dựng public LB subnet + private app subnet an toàn.
- Hiểu Service Gateway, DRG, peering, VPN/FastConnect, DNS và IPv6.

## Topology production cơ bản

~~~mermaid
flowchart TD
  IN[Internet] --> IGW[Internet Gateway]
  IGW --> LB[Public LB subnet / LB NSG]
  LB --> APP[Private app subnet / App NSG]
  APP --> DATA[Private data subnet / Data NSG]
  APP --> NAT[NAT Gateway outbound]
  APP --> SGW[Service Gateway to OCI services]
  DRG[DRG: on-prem/other VCN] --> APP
~~~

Route quyết định đường đi; security rule quyết định được phép; OS firewall và app
listen quyết định cuối. Cần kiểm tra cả forward lẫn return path.

## Thành phần

| Thành phần | Vai trò |
|---|---|
| VCN | Network regional, một/nhiều IPv4 CIDR và có thể IPv6 |
| Subnet | Regional mặc định; public/private quyết định public IP/ingress |
| Route table | Destination prefix → network entity |
| Internet Gateway | Inbound/outbound internet cho public path |
| NAT Gateway | Outbound IPv4 cho private resources, không inbound initiate |
| Service Gateway | Private path tới supported OCI service CIDR |
| DRG | Hub cho VCN, peering, VPN, FastConnect |
| LPG | Local peering legacy/specific design; DRG thường linh hoạt hơn |
| NSG | Rules gắn với VNIC/service membership |
| Security List | Rules gắn với subnet, áp dụng mọi VNIC |

Public subnet không tự làm instance public: VNIC cần public IP, route IGW và
security/OS rule. Private subnet nên prohibit_public_ip_on_vnic=true.

## CIDR design

- Lập IPAM toàn tổ chức trước; tránh overlap với VCN/VPC/VNet/on-prem/partner.
- Dành headroom, nhưng subnet không thể resize đơn giản.
- Chia tier/zone có quy luật bằng cidrsubnet; lưu quyết định trong ADR.
- Kiểm tra reserved addresses và service limits.
- IPv6 cần route/security/DNS/monitoring riêng; NAT IPv4 không phải chiến lược IPv6.

## NSG và Security List

Ưu tiên NSG cho application role: LB → app:8080, app → DB:1522. Source/destination
có thể là NSG OCID trong cùng VCN, tránh CIDR rộng. Security List phù hợp baseline
subnet nhưng dễ cấp quyền quá rộng.

Stateful rule tự cho return traffic. Stateless cần rule chiều ngược với source/
destination port đúng; dùng khi có lý do hiệu năng/kiểm soát và đã test packet flow.
Cho phép ICMP cần thiết cho Path MTU Discovery, không chặn mù.

VCN tạo sẵn default route table/security list/DHCP options. Nếu dùng, quản lý bằng
oci_core_default_* resources hoặc import; không tạo resource “thứ hai” rồi tưởng
đã thay default. Default security list có thể rộng hơn policy tổ chức.

## DNS

VCN/subnet dns_label tạo tên trong oraclevcn.com và không update được. OCI resolver,
private zone/view, forwarding/listening endpoints dùng cho hybrid split-horizon.
Public DNS record cần TTL/health/failover plan; Terraform không thay DNS query test.

## Lab OCI

Lab tạo VCN, public/private subnet, IGW, NSG. NAT Gateway là opt-in vì có thể phát
sinh phí. Public rule chỉ mở HTTP 80, không SSH.

~~~powershell
cd Lessions/09-oci-networking/lab
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
terraform plan
terraform destroy
~~~

Review và destroy ngay sau lab. Nếu enable_nat_gateway=false, private subnet không
có default internet route.

## Hoạt động

1. Vẽ packet path Internet → LB → app và return path.
2. Thêm app→data NSG rule bằng NSG source, không dùng VCN CIDR.
3. Bật NAT, kiểm tra plan/cost; thêm Service Gateway design trên giấy.
4. Cố ý thiếu route hoặc NSG rule, dùng Network Path Analyzer/flow logs để debug.
5. Thiết kế hai VCN có CIDR overlap và giải thích vì sao DRG không “sửa” được.
6. Thêm IPv6 threat model và rule matrix, chưa apply nếu chưa hiểu billing/routing.

## Lỗi thường gặp

- 0.0.0.0/0 port 22/3389 cho admin.
- Cùng một rule vừa nằm NSG vừa Security List, ownership mơ hồ.
- Route tới NAT nhưng NAT disabled/block_traffic hoặc thiếu return path.
- Data subnet có default route internet không cần thiết.
- Hard-code AD cho regional subnet hoặc chọn tên resource không unique.
- Quên DNS/OS firewall/listen address khi network rule đúng.

## Tiêu chí hoàn thành

- Dựng lab, plan lần hai không đổi và destroy sạch.
- Giải thích public/private, IGW/NAT/SGW/DRG và stateful/stateless.
- Review rule matrix theo source role → destination role → protocol/port.

## Nguồn chính thức

- VCN resource: https://registry.terraform.io/providers/oracle/oci/latest/docs/resources/core_vcn
- Subnet resource: https://registry.terraform.io/providers/oracle/oci/latest/docs/resources/core_subnet
- OCI Networking: https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/overview.htm

