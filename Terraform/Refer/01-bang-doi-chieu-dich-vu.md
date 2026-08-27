# 01 - Bảng đối chiếu dịch vụ OCI, AWS và Azure

Các dòng dưới đây là ánh xạ theo **mục đích sử dụng gần nhất**. Ký hiệu “không có 1:1” nghĩa là phải thiết kế lại, không nên coi là drop-in replacement.

## Tổ chức tài nguyên và IAM

| Nhu cầu/khái niệm | OCI | AWS | Azure | Khác biệt phải nhớ |
|---|---|---|---|---|
| Gốc danh tính/doanh nghiệp | Tenancy + Identity Domain | AWS Organization + IAM Identity Center | Microsoft Entra tenant + Management Group | Tenancy, Organization và Entra tenant không có cùng ranh giới billing/isolation. |
| Boundary workload | Compartment | AWS Account | Subscription | AWS account và Azure subscription thường mạnh hơn compartment về quota/billing/isolation. |
| Nhóm vòng đời tài nguyên | Compartment hoặc tag | Stack/account/tag | Resource Group | Azure resource bắt buộc thuộc một resource group; AWS không có resource group làm parent bắt buộc. |
| Nhóm người dùng | IAM Group | IAM group / Identity Center group | Entra group | AWS IAM group không nhận role trực tiếp và không phải principal; Identity Center phù hợp workforce hơn. |
| Danh tính cho workload | Dynamic Group + Resource Principal / Instance Principal | IAM Role + instance profile/task role/IRSA | Managed Identity / Workload Identity | Cú pháp trust và cách lấy token khác nhau; ưu tiên credential ngắn hạn. |
| Cấp quyền | OCI Policy dạng câu lệnh | IAM JSON policy, resource policy, SCP/RCP | Azure RBAC role definition + role assignment; Azure Policy cho governance | Azure Policy không thay Azure RBAC; SCP/RCP là guardrail, không tự cấp quyền. |
| Ràng buộc cấp tổ chức | Tenancy/compartment policy, Security Zones | Organizations SCP/RCP, Control Tower guardrails | Management Group + Azure Policy | Deny/inheritance và exception workflow khác nhau. |
| ID tài nguyên | OCID | ARN hoặc service-specific ID | Azure Resource Manager ID | Không parse ID bằng `split` nếu provider đã expose field riêng. |
| Nhãn metadata | Free-form tag, defined tag, tag default | Tag, provider `default_tags`, Organizations tag policy | Tag, Azure Policy, locals/module convention | AzureRM không có cơ chế provider-wide tương đương AWS `default_tags`; không phải resource nào cũng hỗ trợ tag. |

## Network

| Nhu cầu | OCI | AWS | Azure | Khác biệt phải nhớ |
|---|---|---|---|---|
| Mạng riêng | Virtual Cloud Network (VCN) | Virtual Private Cloud (VPC) | Virtual Network (VNet) | Đều regional nhưng defaults, DNS và quota khác nhau. |
| Phân đoạn mạng | Regional/AD-specific Subnet | Subnet gắn một AZ | Subnet regional | Không copy mô hình “1 subnet = 1 AZ” từ AWS sang OCI/Azure một cách vô thức. |
| Firewall gắn workload | Network Security Group (NSG) | Security Group (SG) | Network Security Group (NSG) | Cả ba thường stateful ở lớp này, nhưng target và rule semantics khác. |
| Firewall gắn subnet | Security List | Network ACL (NACL) | NSG gắn subnet | AWS NACL stateless; OCI Security List rule có thể stateful/stateless; Azure NSG stateful. |
| Chọn workload theo nhãn để làm rule | NSG membership | SG-to-SG reference | Application Security Group (ASG) + NSG | Azure ASG không phải firewall độc lập. |
| Route | Route Table/Route Rule | Route Table/Route | Route Table/User Defined Route | System/default routes khác nhau; route propagation cũng khác. |
| Internet ingress/egress | Internet Gateway | Internet Gateway | Public IP trên frontend/NIC/LB; system routing | Azure không có một resource IGW gắn VNet tương đương trực tiếp. |
| Egress IPv4 private | NAT Gateway | NAT Gateway | NAT Gateway | Đều tính phí; scope gắn và HA model khác. |
| Egress-only IPv6 | Internet Gateway + IPv6 route/rules | Egress-only Internet Gateway | NSG/route với public IPv6 tùy kiến trúc | Không có mapping Azure 1:1. |
| Kết nối service nội bộ | Service Gateway | Gateway VPC Endpoint; Interface Endpoint/PrivateLink | Service Endpoint hoặc Private Endpoint/Private Link | Service Endpoint không tạo private IP riêng như Private Endpoint. |
| Peering | Local/Remote Peering Gateway | VPC Peering | VNet Peering | Không transitive mặc định; DNS/routing phải cấu hình riêng. |
| Transit hub | Dynamic Routing Gateway (DRG) | Transit Gateway / Cloud WAN | Virtual WAN hub hoặc hub VNet + gateway | Route domain, attachment và pricing khác mạnh. |
| Kết nối on-prem | Site-to-Site VPN / FastConnect | Site-to-Site VPN / Direct Connect | VPN Gateway / ExpressRoute | BGP, redundancy, provider circuit và encryption khác. |
| DNS resolver riêng | DNS Resolver endpoint/rules | Route 53 Resolver | Azure DNS Private Resolver | Chi phí endpoint và rule sharing khác. |
| Flow log | VCN Flow Logs | VPC Flow Logs | NSG Flow Logs/Virtual Network Flow Logs | Schema, sampling/destination và lifecycle khác. |
| IP inventory/address planning | IP Address Insights (inventory/utilization/overlap) | Amazon VPC IPAM | Azure Virtual Network Manager IPAM | OCI capability hiện thiên về insights/inventory, không phải drop-in replacement cho mọi pool/allocation workflow của AWS/Azure. |

## Compute, container và serverless

| Nhu cầu | OCI | AWS | Azure | Khác biệt phải nhớ |
|---|---|---|---|---|
| Máy ảo | Compute Instance | EC2 Instance | Azure Virtual Machine | Shape/type/size, disk mặc định, metadata service và billing granularity khác. |
| Cấu hình CPU/RAM linh hoạt | Flexible Shape + OCPU/memory | Một số flexible instance; chủ yếu instance type cố định | VM size cố định; một số series/tính năng tùy chỉnh | OCI OCPU không nên quy đổi 1:1 sang AWS vCPU/Azure vCPU mà không benchmark. |
| Image | Platform/Custom Image | AMI | Marketplace/Shared Image Gallery image | ID image có scope và lifecycle khác; tránh hard-code image “latest” không kiểm soát. |
| Scale group | Instance Pool + Autoscaling | Auto Scaling Group | Virtual Machine Scale Set | Health check, rolling update, mixed capacity và zone behavior khác. |
| Dedicated host | Dedicated VM Host | Dedicated Host/Instance | Dedicated Host | License mobility và placement khác. |
| Spot/preemptible | Preemptible Instance | EC2 Spot | Azure Spot VM | Cơ chế eviction, price/capacity và SLA khác. |
| Kubernetes managed | OKE | EKS | AKS | IAM integration, CNI, upgrade channel, control-plane pricing khác. |
| Container không quản cluster | Container Instances | ECS on Fargate / App Runner | Container Apps / Container Instances | Chọn theo networking, scaling và long-running vs job. |
| Functions | OCI Functions | AWS Lambda | Azure Functions | Runtime, cold start, event source, timeout và concurrency khác. |
| Batch | OCI Batch | AWS Batch | Azure Batch | Scheduler, pool model và image pipeline khác. |

## Storage và backup

| Nhu cầu | OCI | AWS | Azure | Khác biệt phải nhớ |
|---|---|---|---|---|
| Object storage | Object Storage | Amazon S3 | Azure Blob Storage | Namespace, consistency feature, policy, replication và egress khác. |
| Archive/cold tier | Archive Storage / tiering | S3 Glacier classes | Blob Archive/Cool/Cold tiers | Minimum storage duration và retrieval latency/fee khác. |
| Block disk | Block Volume | EBS | Managed Disk | Performance unit, attachment, snapshot và zone scope khác. |
| Shared file | File Storage | EFS / FSx | Azure Files / Azure NetApp Files | Protocol, throughput mode và AD integration khác. |
| Backup orchestration | Block Volume backup, Recovery Service | AWS Backup | Azure Backup | Coverage matrix và vault immutability khác. |
| Disaster recovery orchestration | Full Stack DR | Elastic Disaster Recovery + service-specific | Azure Site Recovery + service-specific | Không có 1:1 cho mọi workload. |
| Data transfer appliance | Data Transfer Appliance | Snow Family | Azure Data Box | Logistics, encryption và vùng hỗ trợ khác. |

## Database, cache và analytics

| Nhu cầu | OCI | AWS | Azure | Khác biệt phải nhớ |
|---|---|---|---|---|
| Oracle Database managed | Base Database Service / Exadata Database Service | RDS for Oracle; EC2; Oracle Database@AWS (Exadata) khi khả dụng | Oracle Database@Azure; Azure VM | Feature/RAC/Exadata, license, region availability và operational boundary không tương đương. |
| Autonomous database | Autonomous Database | Không có 1:1; Aurora/RDS + automation | Không có 1:1; Azure SQL/managed DB + automation | Đánh giá lại engine compatibility, autonomous operations và license. |
| Managed MySQL | MySQL HeatWave | RDS/Aurora MySQL | Azure Database for MySQL | HeatWave analytics accelerator không tương đương mặc định. |
| Managed PostgreSQL | OCI Database with PostgreSQL | RDS/Aurora PostgreSQL | Azure Database for PostgreSQL | Extension, major upgrade, replica/failover khác. |
| NoSQL key-value/document | OCI NoSQL Database | DynamoDB / DocumentDB tùy model | Cosmos DB | API/data model, partition key và consistency model khác lớn. |
| Cache | OCI Cache | ElastiCache / MemoryDB | Azure Managed Redis | Persistence, clustering, SLA và network integration khác. |
| Data warehouse | Autonomous Data Warehouse | Redshift | Fabric Warehouse / Synapse dedicated SQL pool | Tách compute/storage, concurrency và ecosystem khác. |
| Streaming | Streaming | Kinesis Data Streams / MSK | Event Hubs | Partition, retention, Kafka compatibility và throughput unit khác. |
| Queue | Queue | SQS | Service Bus Queue / Storage Queue | Delivery semantics, ordering và dead-letter khác. |

## Load balancing, DNS, edge và API

| Nhu cầu | OCI | AWS | Azure | Khác biệt phải nhớ |
|---|---|---|---|---|
| L4 load balancer | Network Load Balancer / Flexible LB tùy mode | Network Load Balancer | Azure Load Balancer | Client IP, health probe, static IP và cross-zone semantics khác. |
| L7 regional | Flexible Load Balancer | Application Load Balancer | Application Gateway | WAF/TLS/backend routing là feature/tier riêng. |
| Global HTTP edge | OCI Load Balancer + DNS steering/WAF | CloudFront + Global Accelerator/ALB | Azure Front Door | Không phải một resource tương đương; origin/edge architecture khác. |
| DNS authoritative | OCI DNS | Route 53 Hosted Zone | Azure DNS Zone | Resolver/private zone, health check và traffic policy khác. |
| Traffic steering | Traffic Management Steering Policy | Route 53 routing policies / Global Accelerator | Traffic Manager / Front Door | DNS-based khác proxy/anycast-based. |
| CDN | Không có general-purpose mapping 1:1; Media Streams Edge CDN cho video hoặc CDN partner | CloudFront | Front Door/CDN | Đừng coi CDN chuyên video/partner integration là drop-in replacement cho general web CDN; availability và WAF integration khác. |
| WAF | OCI Web Application Firewall | AWS WAF | Web Application Firewall on Front Door/Application Gateway | Rule engine, managed rules và scope khác. |
| API gateway | API Gateway | Amazon API Gateway | API Management | Developer portal, policy engine, pricing tier và private mode khác. |

## Observability, security và secrets

| Nhu cầu | OCI | AWS | Azure | Khác biệt phải nhớ |
|---|---|---|---|---|
| Metrics/alarms | Monitoring + Alarms | CloudWatch Metrics/Alarms | Azure Monitor Metrics/Alerts | Metric dimension, retention và custom metric pricing khác. |
| Log platform | Logging / Logging Analytics | CloudWatch Logs / OpenSearch | Log Analytics Workspace / Azure Monitor Logs | Query language và ingestion/retention pricing khác. |
| Audit control plane | Audit | CloudTrail | Azure Activity Log | Data-plane audit thường cần bật riêng. |
| APM/tracing | Application Performance Monitoring | X-Ray / CloudWatch Application Signals | Application Insights | SDK/OpenTelemetry support và sampling khác. |
| Posture management | Cloud Guard / Security Zones | Security Hub / GuardDuty / Config | Defender for Cloud / Azure Policy | Một số là detect, một số là enforce; không gộp vai trò. |
| KMS/HSM | Vault Keys / Dedicated KMS | KMS / CloudHSM | Key Vault Keys / Managed HSM | Key hierarchy, rotation, custom key store và pricing khác. |
| Secret store | Vault Secrets | Secrets Manager / Systems Manager Parameter Store | Key Vault Secrets | Rotation integration, size/quota và network endpoint khác. |
| Certificate | Certificates | ACM / Private CA | Key Vault Certificates / App Service certificates | Exportability/private CA và integration khác. |
| Vulnerability/container scan | Vulnerability Scanning / Registry scan | Inspector / ECR scanning | Defender for Cloud / ACR scanning | Coverage và activation/pricing khác. |

## DevOps và Terraform managed service

| Nhu cầu | OCI | AWS | Azure | Khác biệt phải nhớ |
|---|---|---|---|---|
| Git/build/deploy | OCI DevOps | CodeCommit/CodeBuild/CodePipeline hoặc đối tác | Azure Repos/Pipelines hoặc GitHub | Terraform không phụ thuộc CI vendor; ưu tiên OIDC/federation. |
| Container registry | Container Registry (OCIR) | Elastic Container Registry (ECR) | Azure Container Registry (ACR) | Login token, replication và retention khác. |
| Terraform service native | OCI Resource Manager | Không có AWS-native Terraform runner tương đương; dùng HCP Terraform/CI/Control Tower integrations | Không có Azure-native Terraform runner tương đương; dùng HCP Terraform/CI | CloudFormation/Bicep là IaC native nhưng không quản Terraform state. |
| Artifact registry | Artifact Registry | CodeArtifact / S3/ECR | Azure Artifacts / ACR | Chọn theo package type, policy và replication. |

## Cách dùng bảng đúng

Trước khi chọn dịch vụ đích, hãy trả lời tối thiểu:

1. Service đích hỗ trợ engine/protocol/API nào mà ứng dụng đang dùng?
2. Resource là global, regional, zonal hay scope đặc biệt?
3. SLA có yêu cầu nhiều instance/multi-zone do khách hàng tự triển khai không?
4. IAM grant ở identity hay resource, có explicit deny/guardrail nào ở parent scope?
5. Backup có restore được sang account/subscription/region khác không?
6. Chi phí gồm compute, storage, request, IP, NAT, log ingestion và **egress** chưa?

Nguồn nền tảng và registry được tập hợp tại [06 - Nguồn chính thức](./06-nguon-chinh-thuc.md).
