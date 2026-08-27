# Lesson 08 — OCI identity, authentication và governance

## Mục tiêu

- Hiểu tenancy, region, AD/FD, compartment, identity domain và OCID.
- Viết IAM policy least privilege, dynamic group và chọn auth đúng nơi chạy.
- Thiết kế naming/tagging, budget/quota/limit và separation of duties.
- Tránh hard-code dữ liệu phụ thuộc tenancy/region.

## OCI organization model

~~~mermaid
flowchart TD
  T[Tenancy / root compartment] --> S[shared-services]
  T --> N[network]
  T --> SEC[security]
  T --> E[environments]
  E --> D[dev]
  E --> P[prod]
  D --> A1[application compartments]
  P --> A2[application compartments]
~~~

- **Tenancy**: ranh giới OCI account và root compartment.
- **Compartment**: container phân cấp dùng cho IAM/organization; resource có thể
  phụ thuộc resource ở compartment khác nếu policy cho phép.
- **Region**: vùng địa lý; tenancy có home region và subscribed regions.
- **Availability Domain (AD)**: miền lỗi độc lập trong region; tên AD có prefix
  theo tenancy, nên lấy bằng data source.
- **Fault Domain (FD)**: nhóm lỗi phần cứng trong một AD.
- **OCID**: định danh toàn cục; không suy diễn bằng tên.
- **Identity Domain**: quản lý user/group/app và federation; phân biệt với IAM
  policy cấp quyền lên OCI resources.

Compartment không tự là billing account hay network boundary. Kết hợp hierarchy,
IAM, quota, budget, tags và state/credential isolation.

## IAM policy

Mô hình câu lệnh:

~~~text
Allow <subject> to <verb> <resource-type> in <location> where <condition>
~~~

Verb tăng dần inspect → read → use → manage. Resource family tiện nhưng rộng;
production nên tra policy reference và thu hẹp resource/compartment/condition.

~~~text
Allow group tf-network-operators to manage virtual-network-family
  in compartment id ocid1.compartment...
Allow dynamic-group tf-runners to read secret-family
  in compartment security
~~~

Policy propagation có thể trễ. depends_on policy không đảm bảo API authorization
đã propagate; provider retry hoặc pipeline wait/retry có giới hạn, không sleep mù.

### User/group và workload

- Human: identity domain group, SSO/MFA; không cấp trực tiếp từng user.
- OCI Compute: dynamic group + Instance Principal.
- OCI service: Resource Principal khi dịch vụ hỗ trợ.
- OKE: Workload Identity để pod có identity riêng.
- Laptop: Security Token ngắn hạn hoặc API Key profile được rotate.

Matching rule của dynamic group là security boundary; review compartment/instance
conditions để không vô tình cho mọi compute trong tenancy quyền deploy.

## Provider đa region

~~~hcl
provider "oci" {
  region = var.primary_region
}

provider "oci" {
  alias  = "dr"
  region = var.dr_region
}
~~~

IAM resources có yêu cầu home-region tùy loại/API. Tạo alias home rõ ràng và dùng
provider = oci.home; không giả định region đang deploy app là home region.

## Governance

| Control | Mục tiêu |
|---|---|
| Defined/default tags | Ownership, cost center, environment, expiry |
| Free-form tags | Linh hoạt lab; không enforce schema |
| Budgets/alerts | Cảnh báo chi phí, không mặc định chặn spend |
| Quotas | Giới hạn khả năng consume service theo compartment |
| Service limits | Capacity ceiling cấp tenancy/region |
| Security Zones | Ngăn cấu hình vi phạm recipe |
| Cloud Guard | Detect/respond posture issue |
| Audit/Logging | Truy vết control/data plane phù hợp |

Naming không chứa email, customer data hay secret. Display name thường không
unique; dùng tags/OCID cho automation. expires_at chỉ hữu ích nếu có cleanup job.

## Lab

Mặc định create_compartment=false nên lab chỉ model governance, không tạo object.
Chỉ bật khi identity có quyền quản lý compartment và bạn đang ở tenancy lab.

~~~powershell
cd Lessions/08-oci-identity-auth-governance/lab
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init
terraform validate
terraform plan
# Sau khi review và chủ động đặt create_compartment=true:
terraform apply
terraform destroy
~~~

Identity policy template nằm ở iam-policy.tf.example để review, không tự load.

## Hoạt động

1. Vẽ compartment tree cho công ty có shared/network/security/dev/staging/prod.
2. Viết policy cho network team chỉ manage VCN trong dev, không quản lý IAM.
3. Viết dynamic group rule chỉ match CI runner compartment riêng.
4. Threat-model API key bị lộ; liệt kê rotate/revoke/audit/state actions.
5. Dùng data source AD thay hard-code; giải thích vì sao “AD-1” không portable.
6. Tạo tag matrix owner/cost_center/environment/data_classification/expires_at.

## Lỗi thường gặp

- Policy “manage all-resources in tenancy” cho CI.
- Dùng user API key production trong pipeline.
- Hard-code AD name, image OCID hoặc home region.
- Cho rằng budget tự dừng tài nguyên khi vượt ngưỡng.
- Đặt resource theo display name mà không kiểm tra uniqueness/ownership.
- Xóa compartment trước khi di chuyển/xóa hết child resources.

## Tiêu chí hoàn thành

- Chọn auth least-privilege cho ba execution environments.
- Viết policy đủ dùng và giải thích verb/resource/location/condition.
- Thiết kế governance tree, tags, budget, quota và audit path.

