## Ranh giới của Infrastructure as Code

Terraform mô tả **desired state** và xây dependency graph để lập plan thay đổi hạ tầng. Nó phù hợp provisioning resource có API và lifecycle tương đối rõ; không thay thế configuration management bên trong máy, build image, deploy ứng dụng, database migration hay incident response. Ranh giới tốt thường là:

| Nhu cầu | Công cụ/lớp phù hợp |
|---|---|
| Provision network, IAM, compute, managed service | Terraform |
| Tạo immutable machine/container image | Packer hoặc image pipeline |
| Cấu hình OS/app | cloud-init, Ansible hoặc startup automation |
| Release application | CI/CD, Helm/GitOps hoặc deployment platform |
| Vận hành và phục hồi | Observability, runbook, backup/DR process |

IaC tốt hướng tới idempotency và convergence: chạy lại với cùng input không tạo thay đổi ngoài ý muốn, còn drift được phát hiện và xử lý có chủ đích. Plan không phải bằng chứng tuyệt đối rằng apply an toàn—provider API, unknown value, quota, eventual consistency và concurrent actor vẫn có thể làm kết quả khác dự kiến.

Roadmap nguồn gồm Lesson 00–17: setup; IaC; HCL; CLI/provider; variables; resource graph; state; module; OCI identity; networking; compute/storage; data/LB/DNS; security; testing; CI/CD; advanced patterns; operations; capstone. Học theo evidence: format/validate/test, đọc plan, apply trong sandbox, quan sát state/resource thật, rồi cleanup.

## HCL, type system và interface cấu hình

HCL là ngôn ngữ khai báo có expression, collection và type inference. Cần phân biệt `null`, unknown và sensitive: `null` thường có nghĩa bỏ qua/không đặt; unknown chỉ được biết sau apply; `sensitive` chủ yếu che một số output, không mã hóa state.

Các công cụ data shaping quan trọng gồm `for`, `for_each`, `flatten`, `merge`, `zipmap`, `setproduct`, `try`, `can` và conditional expression. Chuyển list sang set làm mất thứ tự/duplicate; key của `for_each` phải ổn định và biết được lúc plan. Dynamic block chỉ dùng khi schema thực sự lặp, không phải để biến mọi module thành DSL khó đọc.

Một variable contract tốt có type chính xác, default an toàn, description và validation:

```hcl
variable "environment" {
  type        = string
  description = "Tên môi trường được phép triển khai"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment phải là dev, staging hoặc prod."
  }
}
```

`locals` chuẩn hóa/tái sử dụng biểu thức nội bộ; output là public interface và có thể tạo coupling giữa state. Precondition/postcondition/check block diễn đạt invariant ở các thời điểm khác nhau. Không truyền secret qua default, source code, CLI history hoặc output; secret vẫn có thể nằm trong plan/state dù được đánh dấu sensitive.

## CLI workflow, provider và dependency graph

Terraform Core đọc configuration, tải provider, xây graph, so sánh config với state/remote API rồi tạo plan. Provider là plugin quản resource/data source; backend lưu state và có thể cung cấp locking. Pin version bằng constraint hợp lý và commit lock file để build tái lập; upgrade provider phải đọc changelog/upgrade guide và thực hiện riêng với thay đổi hạ tầng lớn.

Workflow an toàn:

```text
fmt -check -> init -> validate -> test/lint/policy
           -> plan lưu artifact có kiểm soát
           -> review -> apply đúng plan -> verify
```

`resource` quản lifecycle; `data` chỉ đọc nhưng vẫn có thể phụ thuộc API và tạo unknown. Implicit dependency qua reference tốt hơn `depends_on`; lạm dụng dependency explicit làm graph tuần tự và che thiết kế sai. `count` hợp với instance đồng nhất theo vị trí; `for_each` hợp identity theo key. Đổi từ count sang for_each mà không có `moved`/state migration có thể khiến destroy-create.

Lifecycle meta-arguments cần dùng có mục đích. `create_before_destroy` cần quota/naming cho hai bản cùng tồn tại; `prevent_destroy` là guardrail chứ không phải backup; `ignore_changes` dễ che drift thật; `replace_triggered_by` làm replacement contract rõ. Provisioner là phương án cuối vì khó idempotent, khó quan sát và không nằm trọn trong resource model.

Authentication local và CI phải khác nhau: local ưu tiên profile/CLI federation; CI ưu tiên workload identity/OIDC hoặc dynamic identity ngắn hạn. Không nhúng credential dài hạn vào provider block, tfvars hay repository. Trước apply phải xác minh account/tenancy, region, compartment/subscription và identity thực tế.

## State, backend, import và refactor

State ánh xạ resource address trong configuration với object từ xa; nó có thể chứa ID và dữ liệu nhạy cảm. Production cần remote backend, encryption, versioning, access control, audit và locking phù hợp. Lock ngăn hai writer hợp tác chạy đồng thời, nhưng không ngăn console/manual actor hoặc pipeline dùng backend khác.

Quy trình xử lý state:

- Backup/version state trước thao tác nguy hiểm; không sửa JSON bằng tay.
- Xác minh workspace/backend/account và serial/lineage trước migrate hoặc push.
- Dùng `import` block/command đưa brownfield vào state, sau đó viết config khớp và đọc plan đến khi không còn thay đổi bất ngờ.
- Dùng `moved` block cho rename/refactor address; `removed` block khi bỏ quản lý có chủ đích.
- `state mv/rm` là thao tác phẫu thuật có review, không phải workflow thường ngày.
- `-target` chỉ dùng recovery/trường hợp đặc biệt; `-lock=false` không phải cách sửa lock contention.

CLI workspace là nhiều state dùng chung configuration, hữu ích cho vài môi trường tương tự nhưng không nên là security boundary duy nhất. State topology nên theo blast radius, ownership, rate of change và dependency; một state toàn enterprise tạo lock contention và failure domain khổng lồ, còn chia quá nhỏ tạo remote-state coupling.

Backend migration phải có maintenance/concurrency gate, backup, `init -migrate-state`, kiểm tra destination và kế hoạch rollback. State incident cần dừng writer, bảo toàn evidence, xác định state authoritative, refresh/plan và chỉ phục hồi khi hiểu rõ delta với resource thật.

## Module engineering và abstraction ổn định

Module là unit đóng gói có contract, không chỉ folder chứa `.tf`. Module tốt có input/output tối thiểu, type/validation, naming rõ, provider requirement, examples, tests, versioning và upgrade note. Root module composition giữ policy/environment; child module không nên tự cấu hình provider mặc định hoặc phụ thuộc account context ẩn.

Nguyên tắc thiết kế:

- Abstract theo capability ổn định, không expose toàn bộ schema provider qua hàng chục biến.
- Không tạo “mega-module” với `var.cloud` rồi nhồi OCI/AWS/Azure vào một graph điều kiện.
- Provider alias được truyền explicit cho multi-region/account; tránh provider binding bất ngờ.
- Module source production cần version immutable; Git branch mutable làm build không tái lập.
- Output chỉ công bố contract cần thiết, tránh dùng `terraform_remote_state` như database tích hợp.

Stable identity quan trọng hơn cú pháp ngắn. Key `for_each`, tên resource, module address và output phải được thiết kế để refactor không kéo theo replacement. Khi đổi abstraction, thêm `moved` block/test plan và migration guide; provider major upgrade nên tách khỏi migration production để giảm biến số.

## OCI foundation: identity, network, compute và data

OCI tổ chức resource trong tenancy/compartment; IAM policy dùng subject, verb, resource-type và location. Compartment là scope tổ chức/IAM, không tương đương hoàn toàn AWS account hay Azure resource group. Provider có thể dùng alias cho nhiều region; governance gồm tag namespace/default tag, quota, budget, policy và guardrail.

Networking bắt đầu từ CIDR không chồng lấn, VCN/subnet, route table, internet/NAT/service gateway, NSG/security list và DNS. Subnet OCI thường regional. Security List áp dụng theo subnet; NSG gắn theo VNIC/resource và thường biểu đạt workload boundary tốt hơn. Một packet path phải đúng cả forward route, return route, stateful/stateless rule, DNS và service/listener.

Compute gồm shape, image, availability/fault domain, boot volume, VNIC, metadata và cloud-init. Bootstrap nên ngắn, idempotent và observable; application image immutable giúp scale/rollback đáng tin hơn script dài. Block volume, file/object storage có durability, attachment, throughput và lifecycle khác nhau. Mọi lab compute mặc định nên opt-in sau khi kiểm tra quota/giá.

Data/service layer yêu cầu lựa chọn Autonomous Database/DB System/NoSQL/Object Storage theo consistency, engine, operations và cost. Load Balancer khác Network Load Balancer ở protocol/feature; health check phải phản ánh readiness. DNS record/TTL liên quan rollout và failover. Terraform tạo resource nhưng backup policy, restore drill, schema/data migration và application compatibility vẫn là trách nhiệm riêng.

## Security, testing và CI/CD cho Terraform

Threat model của Terraform tập trung vào credential, state/plan artifact, provider/module supply chain, pipeline runner và quyền apply. Defense in depth gồm identity ngắn hạn, least privilege, backend tách quyền đọc/ghi, encryption/versioning, secret manager, signed/verified source, protected branch và approval theo environment.

Testing pyramid:

| Tầng | Ví dụ | Mục tiêu |
|---|---|---|
| Static | `fmt`, `validate`, lint, docs | Cú pháp, convention, lỗi sớm |
| Unit/contract | `terraform test`, mock provider, variable checks | Module behavior không cần cloud thật |
| Policy | OPA/Conftest hoặc platform policy | Chặn public ingress, thiếu tag, resource bị cấm |
| Plan review | Saved plan + machine-readable checks | Xem create/update/replace/destroy và unknown |
| Live integration | Sandbox có TTL/budget | Xác minh API/permission/behavior thật |

Pipeline production phải khóa concurrency theo state, dùng identity riêng, lưu plan artifact đúng retention, apply đúng plan đã review và verify sau apply. Exit code của `plan -detailed-exitcode` phân biệt no-change/change/error. Không auto-approve production chỉ vì policy pass; destructive/replacement và thay đổi IAM/network/data cần reviewer phù hợp.

OCI Resource Manager có thể quản stack/job/state nhưng vẫn cần version pin, variable/secret discipline, drift/process và ownership. Repository boundary không nhất thiết trùng state boundary; monorepo vẫn có nhiều root/state độc lập.

## Advanced patterns, drift, cost và disaster recovery

Multi-region dùng provider alias và module composition; không giả định resource/API giống nhau ở mọi region. Unknown value phải được giữ trong expression thay vì ép thành string/list biết trước. Optional attribute, import/moved/removed block và test mocking giúp config hiện đại hơn, nhưng chỉ dùng sau khi kiểm tra version target.

Migration an toàn theo chuỗi: inventory → import/adopt → đạt no-op plan → refactor address bằng moved/state operation → thay đổi nhỏ → verify. Brownfield resource thường chứa default/behavior ngoài config; import thành công không có nghĩa apply tiếp theo an toàn.

Drift có thể do manual change, controller khác, provider default hoặc API normalization. Triage theo tầng: config → input → state → provider → remote API. Chỉ sửa sau khi quyết định nguồn sự thật là code hay remote. `ignore_changes` không nên dùng để im lặng hóa ownership conflict chưa được giải quyết.

FinOps gồm estimate trước plan, tag/allocation, budget/anomaly, unit cost và cleanup. “Resource rỗng” vẫn có thể tính phí; NAT gateway, LB, database, public IP/disk/snapshot và egress cần được kiểm tra riêng. `destroy` thành công không chứng minh mọi chi phí đã hết nếu còn resource ngoài state hoặc retention.

DR cho IaC phải phân biệt **khôi phục configuration/state** với **khôi phục dữ liệu/service**. Backup backend state, module/provider artifact và credential bootstrap; test khả năng dựng control plane ở region/account dự phòng. DNS, identity, quota, image, secret và data replication đều có thể là dependency ngoài Terraform. Upgrade core/provider và DR drill cần rollback/fail-forward plan cùng evidence.

## OCI, AWS và Azure: ánh xạ nhưng không đồng nhất

Terraform chuẩn hóa workflow, không chuẩn hóa semantics cloud. OCI tenancy/compartment, AWS Organization/account và Azure tenant/subscription/resource group có security, billing, quota và lifecycle boundary khác nhau. OCI/Azure subnet thường regional; AWS subnet gắn với Availability Zone. OCI NSG/Security List, AWS Security Group/NACL và Azure NSG khác điểm gắn/statefulness.

Khi chuyển cloud, so sánh theo capability:

- Identity federation, policy model và administrative boundary.
- Region/AZ/fault domain, SLA và quota.
- Packet path, NAT/egress, private endpoint và DNS.
- Compute image/shape, autoscaling và bootstrap.
- Storage durability, consistency, replication và backup.
- Managed database compatibility, extension, migration và RPO/RTO.
- Remote state/locking, CI identity, provider behavior và cost/egress.

Thiết kế multi-cloud chỉ hợp lý khi driver đủ mạnh: regulation, acquisition, customer locality, vendor risk hoặc DR đã định lượng. Chuẩn hóa contract/observability/identity federation nơi có lợi, nhưng giữ implementation cloud-native bên dưới. Active/active multi-cloud cần giải quyết conflict/order/data ownership; chỉ dựng cùng stack ở hai cloud không tạo resilience.

Migration là re-platform có kiểm soát: discovery → landing zone → mapping/gap → Terraform đích → data/app integration → rehearsal → cutover → rollback/failback → decommission. Tránh đổi prefix resource, một module khổng lồ, wildcard IAM, hard-code zone/image, admin role cả ba cloud và nâng provider major cùng lúc cutover.

## Thực hành, capstone và safety gate

Lab nên mặc định local/read-only hoặc network-only; resource tính phí phải có flag opt-in. Trước mọi apply:

- [ ] Xác minh identity, account/tenancy, region, backend và workspace.
- [ ] Đọc config/script; chạy format, validate, test và policy.
- [ ] Đọc toàn plan, đặc biệt replace/destroy, IAM, public ingress và unknown.
- [ ] Kiểm tra quota, budget, TTL, naming và khả năng cleanup.
- [ ] Có backup/state version, monitoring và rollback/roll-forward.
- [ ] Không commit key, tfstate, plan nhạy cảm hoặc tfvars chứa secret.

Capstone OCI production kết hợp module network/compute/load balancer/environment, state backend, provider alias, safe defaults, test, CI/CD, threat model, observability, cost và DR. Acceptance không chỉ là `apply` thành công: workload phải reachable đúng đường, policy/ingress đúng, test pass, drift/recovery được diễn tập và cleanup được xác nhận.

Quiz đi theo năm level Foundation, Core, OCI, Production và Expert; đáp án tách riêng để luyện closed-book. Các câu state/security bằng 0 điểm là hard gap dù tổng điểm cao. Mastery checklist yêu cầu evidence từ plan, test, migration, incident drill và oral defense.

## Nguồn đã gom và quan hệ với DevOps/SRE

`sourceFolders` của topic gồm `Terraform/Lessions`, `Terraform/Quiz`, `Terraform/Refer` và `Terraform/scripts`. Nguồn canonical là roadmap Lesson 00–17, cheatsheet/glossary/mastery checklist, lab `.tf`/`.tftest.hcl`, quiz/capstone và bộ tham chiếu OCI → AWS/Azure. Các tài liệu version-sensitive phải được đối chiếu lại với nguồn chính thức trước production change.

Ranh giới gom nội dung: tab này chịu trách nhiệm **mô hình IaC, HCL, provider, graph, state, module và cloud resource lifecycle**. CI/CD, observability, SLO, incident command, software supply chain và tổ chức vận hành đầy đủ nằm ở tab DevOps/SRE/Security; ở đây chúng chỉ xuất hiện khi trực tiếp tạo guardrail cho một thay đổi Terraform.
