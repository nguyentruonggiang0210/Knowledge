# Glossary Terraform và OCI

## Terraform/IaC

| Thuật ngữ | Định nghĩa thực dụng |
|---|---|
| Infrastructure as Code | Quản lý hạ tầng bằng code có version, review, test và automation |
| Declarative | Mô tả trạng thái mong muốn thay vì chuỗi lệnh từng bước |
| Configuration | Tập file .tf trong một module biểu đạt desired state |
| Root module | Working directory mà người/CI chạy Terraform |
| Child module | Module được root/module khác gọi để tái sử dụng/composition |
| Provider requirement | Source address và version constraint của plugin |
| Provider configuration | Region/auth/alias cụ thể được root truyền cho resource/module |
| Resource | Object Terraform sở hữu vòng đời create/read/update/delete |
| Data source | Object chỉ đọc; Terraform không sở hữu vòng đời |
| Resource address | Địa chỉ logic như module.app.oci_core_instance.this["api-a"] |
| Provider ID | ID remote (ví dụ OCID) được bind với address trong state |
| State | Snapshot binding address ↔ remote object và metadata/attributes |
| Backend | Nơi lưu state và có thể hỗ trợ locking/workspaces/remote execution |
| State lock | Mutual exclusion ngăn hai writer sửa cùng state |
| Dependency graph | DAG Terraform dùng để xác định thứ tự và chạy song song |
| Implicit dependency | Edge sinh từ reference attribute |
| Explicit dependency | Edge bằng depends_on khi quan hệ hành vi không có reference |
| Plan | Đề xuất diff configuration/state/remote tại thời điểm chạy |
| Saved plan | Artifact binary áp dụng đúng actions đã lập; có thể chứa secret |
| Apply | Provider API calls theo plan và ghi state snapshot mới |
| Refresh | Đọc remote để cập nhật hiểu biết trước diff |
| Drift | Remote khác configuration/state expectation do thay đổi ngoài workflow |
| Import | Bind object đã tồn tại vào một resource address |
| moved block | Migration address có lịch sử trong code, tránh recreate |
| removed block | Gỡ ownership có chủ đích; destroy=false giữ remote object |
| Idempotency | Apply xong, chạy plan lại không có thay đổi nếu không drift |
| Convergence | Hệ thống tiến tới desired state sau các lần reconcile |
| Partial apply | Một số action thành công trước khi action khác lỗi; không rollback toàn cục |
| Unknown | Giá trị chỉ biết sau apply; khác null |
| null | Cố ý omitted/không đặt; ý nghĩa cuối phụ thuộc schema |
| Sensitive | Metadata che display; không tự mã hóa/loại khỏi state |
| Ephemeral | Giá trị không lưu bền ở nơi tính năng hỗ trợ |
| Write-only | Provider argument chỉ nhận vào, không đọc lại/lưu theo schema hỗ trợ |
| Meta-argument | count, for_each, depends_on, provider, lifecycle… |
| Stable key | Identity bền cho for_each, không đổi khi input reorder |
| Dynamic block | Sinh lặp nested blocks từ collection |
| Lifecycle | create_before_destroy, prevent_destroy, ignore_changes, replace_triggered_by |
| Condition/check | Validation, pre/postcondition hoặc health assertion |
| Provisioner | Script local/remote last-resort, khó mô hình/idempotent |
| Dependency lock file | .terraform.lock.hcl khóa provider version/checksum đã chọn |
| Workspace | Một state instance trong backend; CLI workspace không phải security boundary |
| Policy as code | Rule tổ chức kiểm config/plan độc lập với module |
| Blast radius | Phạm vi ảnh hưởng khi state/identity/module/apply lỗi |
| Immutable infrastructure | Thay instance/image thay vì sửa dần tại chỗ |

## OCI

| Thuật ngữ | Định nghĩa thực dụng |
|---|---|
| Tenancy | Ranh giới OCI account và root compartment |
| Compartment | Container phân cấp cho organization/IAM/quota; không tự là network boundary |
| Identity Domain | User/group/app/federation domain |
| Home region | Region gốc cho một số IAM operations |
| Subscribed region | Region tenancy đã bật để dùng resources |
| Availability Domain | Failure domain cấp data-center group trong region, tên theo tenancy |
| Fault Domain | Nhóm lỗi phần cứng trong một AD |
| OCID | Oracle Cloud Identifier của resource |
| VCN | Virtual Cloud Network regional |
| Subnet | IP segment regional hoặc AD-specific theo thiết kế/API |
| VNIC | Network interface của compute/service |
| Internet Gateway | Route Internet hai chiều cho public path khi security/public IP cho phép |
| NAT Gateway | Outbound IPv4 từ private subnet, không nhận inbound initiation |
| Service Gateway | Private path tới supported OCI services |
| DRG | Dynamic Routing Gateway cho VCN/hybrid/peering hub |
| NSG | Security rules gắn theo role/membership VNIC/service |
| Security List | Security rules gắn với subnet |
| Stateful rule | Return traffic tự được cho phép |
| Stateless rule | Phải thiết kế cả hai chiều/ports |
| OCI Vault/KMS | Secret và key management; khác nhau giữa secret material và encryption key |
| Work Request | Async OCI operation status cần theo dõi khi provision |
| Resource Manager | OCI managed Terraform stack/job/state service |
| Defined tag | Tag có namespace/key schema quản trị |
| Default tag | Tag rule tự áp khi resource được tạo |
| Free-form tag | Key/value linh hoạt, không enforce namespace |
| Instance Principal | Compute instance xác thực qua dynamic group |
| Resource Principal | OCI service/workload xác thực mà không mang user API key |
| OKE Workload Identity | Identity cho Kubernetes workload |

## Production/SRE

| Thuật ngữ | Định nghĩa |
|---|---|
| SLI/SLO | Chỉ số thực tế/mục tiêu reliability |
| RPO | Lượng dữ liệu tối đa chấp nhận mất |
| RTO | Thời gian tối đa khôi phục service |
| Roll-forward | Sửa nguyên nhân rồi tiếp tục từ current state |
| Rollback | Quay application/config; không đồng nghĩa restore state cũ |
| Break-glass | Quy trình khẩn cấp, quyền/thao tác ngắn hạn có audit |
| Least privilege | Chỉ cấp action/resource/scope/thời gian cần thiết |
| Separation of duties | Tách người/quyền tạo code, approve và apply critical change |
| FinOps | Ownership, visibility và tối ưu cost dựa trên giá trị/SLO |

Đối chiếu thuật ngữ OCI với AWS/Azure tại [Refer](../Refer/README.md).

