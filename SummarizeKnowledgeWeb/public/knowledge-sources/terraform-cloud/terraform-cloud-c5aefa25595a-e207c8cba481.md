# 06 - Nguồn chính thức và phiên bản kiểm tra

Tài liệu trong `Refer` được rà soát ngày **2026-08-27**. Đây là mốc tham khảo, không phải cam kết rằng giá, quota, region hay provider minor version vẫn giữ nguyên khi bạn đọc.

## Phiên bản tại thời điểm rà soát

| Thành phần | Phiên bản/nhánh quan sát | Cách sample giới hạn |
|---|---:|---|
| Terraform CLI | `1.16.0` | `~> 1.16.0` |
| OCI provider | `8.29.0` | Tài liệu đối chiếu; lab chính nằm trong `Lessions` nếu có |
| AWS provider | `6.62.0` | `~> 6.0` + dependency lock file |
| AzureRM provider | `5.2.0` | `~> 5.0` + dependency lock file |

Luôn kiểm tra registry/changelog và chạy upgrade có kiểm soát. AzureRM 5.0 là major có breaking changes và đổi mặc định Resource Provider registration sang `none`.

## Terraform core

- [Cài Terraform và phiên bản hiện hành](https://developer.hashicorp.com/terraform/install)
- [Provider requirements và version constraints](https://developer.hashicorp.com/terraform/language/providers/requirements)
- [Dependency lock file](https://developer.hashicorp.com/terraform/language/files/dependency-lock)
- [State và khuyến nghị remote backend](https://developer.hashicorp.com/terraform/language/state)
- [State locking](https://developer.hashicorp.com/terraform/language/state/locking)
- [S3 backend](https://developer.hashicorp.com/terraform/language/backend/s3)
- [AzureRM backend](https://developer.hashicorp.com/terraform/language/backend/azurerm)
- [Providers trong module](https://developer.hashicorp.com/terraform/language/modules/develop/providers)
- [Terraform style guide](https://developer.hashicorp.com/terraform/language/style)

## Provider registry và upgrade guide

- [OCI provider](https://registry.terraform.io/providers/oracle/oci/latest)
- [AWS provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [AzureRM provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest)
- [AzureRM 5.0 upgrade guide](https://registry.terraform.io/providers/hashicorp/azurerm/5.0.0/docs/guides/5.0-upgrade-guide)

## OCI

- [OCI Terraform provider configuration/authentication](https://docs.oracle.com/en-us/iaas/Content/dev/terraform/configuring.htm)
- [OCI Terraform provider examples](https://docs.oracle.com/en-us/iaas/Content/dev/terraform/tutorials.htm)
- [Managing Compartments](https://docs.oracle.com/en-us/iaas/Content/Identity/compartments/managingcompartments.htm)
- [Regions, Availability Domains và Fault Domains](https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm)
- [OCI native backend/Object Storage state](https://docs.oracle.com/en-us/iaas/Content/dev/terraform/object-storage-state.htm)
- [OCI Resource Manager](https://docs.oracle.com/en-us/iaas/Content/ResourceManager/Concepts/resourcemanager.htm)
- [OCI Architecture Center](https://docs.oracle.com/solutions/)
- [OCI Cloud Adoption Framework](https://docs.oracle.com/en-us/iaas/Content/cloud-adoption-framework/home.htm)
- [OCI Pricing](https://www.oracle.com/cloud/price-list/)

## AWS

- [AWS provider authentication/configuration](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#authentication-and-configuration)
- [AWS Organizations và OU](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html)
- [AWS Account là isolation boundary](https://docs.aws.amazon.com/accounts/latest/reference/accounts-welcome.html)
- [IAM policies và permissions](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html)
- [AWS Regions và Availability Zones](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-availability-zones.html)
- [AWS AZ IDs](https://docs.aws.amazon.com/global-infrastructure/latest/regions/az-ids.html)
- [AWS Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html)
- [AWS Architecture Center](https://aws.amazon.com/architecture/)
- [AWS Pricing Calculator](https://calculator.aws/)

## Azure

- [Authenticate Terraform to Azure](https://learn.microsoft.com/en-us/azure/developer/terraform/authenticate/authenticate-to-azure)
- [Azure Resource Manager scope: Management Group, Subscription, Resource Group, Resource](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview)
- [Azure Management Groups](https://learn.microsoft.com/en-us/azure/governance/management-groups/overview)
- [Azure Availability Zones và logical/physical mapping](https://learn.microsoft.com/en-us/azure/availability-zones/az-overview)
- [Azure resource naming rules](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules)
- [Azure naming convention](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming)
- [Store Terraform state in Azure Storage](https://learn.microsoft.com/en-us/azure/developer/terraform/store-state-in-azure-storage)
- [Azure Well-Architected Framework](https://learn.microsoft.com/en-us/azure/well-architected/)
- [Azure Cloud Adoption Framework](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/)
- [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

## Quy trình xác minh trước mỗi production change

1. Mở registry của provider và upgrade guide từ version đang lock tới version dự kiến.
2. Kiểm tra service availability/SKU/quota tại đúng account/subscription/tenancy và region.
3. Kiểm tra pricing page/calculator hiện tại, gồm IPv4, NAT, log và egress.
4. Chạy upgrade/no-op plan ở sandbox, sau đó nonprod.
5. Review `.terraform.lock.hcl`, plan JSON/policy findings và replacement.
6. Canary production theo state nhỏ; chỉ rollout tiếp khi telemetry ổn định.

Nếu tài liệu học và provider schema mâu thuẫn, provider registry/official upgrade guide ở version đã lock là nguồn quyết định cho code; cloud product documentation là nguồn quyết định cho semantics/SLA/quota.
