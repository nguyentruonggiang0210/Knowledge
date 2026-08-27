# D07 - Infrastructure as Code, configuration và image

## Mục tiêu

- Chọn đúng Terraform, cloud-init, Ansible, Packer, Kubernetes hoặc script.
- Hiểu desired/current state, convergence, immutability, drift và lifecycle.
- Xây pipeline từ source đến image/infrastructure có test, policy và recovery.
- Không biến Terraform provisioner/remote-exec thành configuration manager.

## Ranh giới công cụ

| Nhu cầu | Công cụ/pattern thường phù hợp | Lý do |
|---|---|---|
| Tạo cloud resource/quan hệ | Terraform/OpenTofu hoặc cloud IaC | Graph, state, plan |
| First-boot tối thiểu | cloud-init/user data | Bootstrap instance mới |
| Cấu hình guest/fleet | Ansible hoặc config manager | Convergence, inventory, handlers |
| Golden machine image | Packer/image pipeline | Build/test immutable artifact |
| Container image | Docker/BuildKit/build tool | Package app/runtime |
| Kubernetes workload | Manifest/Helm/Kustomize + controller | Reconciliation liên tục |
| One-off API glue | Script/SDK | Logic procedural ngắn |

Đây là default, không phải luật tuyệt đối. Quyết định dựa trên ownership, failure/retry,
drift, secret, audit, scale và lifecycle.

## Ba kiểu thực thi

- Declarative with state: Terraform so config, state và remote rồi lập graph/action.
- Declarative reconciliation: Kubernetes/GitOps controller liên tục đưa actual về desired.
- Procedural/convergent: Ansible/script chạy task theo thứ tự, module nên idempotent.

~~~mermaid
flowchart LR
  Source[Versioned source] --> Validate[Test lint scan policy]
  Validate --> Image[Build golden image]
  Image --> ImageTest[Boot and integration test]
  ImageTest --> Registry[Immutable image version]
  Registry --> Plan[Terraform plan]
  Plan --> Apply[Approved apply]
  Apply --> Runtime[New instances]
  Runtime --> Observe[Smoke SLO drift]
  Observe --> Source
~~~

## Terraform production essentials

Track đầy đủ nằm ở [Lessions](../../Lessions/README.md). DevOps engineer phải nắm:

- provider/module/core version và lock file;
- stable resource identity, graph và lifecycle/replacement;
- remote state encryption/versioning/locking, environment isolation;
- plan review, saved plan, policy, test và apply concurrency;
- import brownfield, moved/refactor, refresh-only/drift và break-glass;
- state/plan có thể chứa secret dù output đánh dấu sensitive;
- partial apply không tự rollback; chạy plan lại và roll-forward có kiểm soát.

Workspace không phải security boundary. Tách state/account/credential theo blast radius.
Provisioner chỉ là last resort vì Terraform khó mô hình trạng thái bên trong guest.

## Golden image và configuration lifecycle

Image pipeline:

1. pin base image bằng immutable ID;
2. cài package từ repository đã verify;
3. harden và cấu hình phần chung, không nhúng environment secret;
4. scan CVE/malware/config;
5. boot, test service và negative test;
6. publish version + metadata/SBOM/provenance;
7. canary instance pool rồi promote;
8. deprecate image cũ theo deadline.

Immutable không có nghĩa “không patch”: rebuild image từ source mới và replace instance.
Emergency hotfix trong host phải được ghi nhận, giới hạn thời gian và reconcile về source.

Ansible/config manager vẫn hữu ích cho legacy/fleet, nhưng cần:

- inventory rõ ownership; credential ngắn hạn;
- role/collection versioned; check mode không được coi là guarantee;
- handler chỉ chạy khi change; run thứ hai không đổi;
- rolling batch/failure threshold; reboot/connection strategy;
- log/audit nhưng không lộ secret;
- test role trên image/OS matrix.

## Environment và secret

Artifact/image/module dùng chung qua môi trường; configuration chỉ chứa khác biệt cần thiết.
Secret lấy ở runtime qua workload identity/secret manager, không bake vào image, state,
cloud-init log hoặc CI artifact. Bootstrap token phải ngắn hạn và xóa/revoke sau exchange.

## Pipeline gate

~~~text
PR: format -> validate -> unit -> security -> policy -> plan
main: build image -> scan -> test -> sign/attest -> publish immutable ID
dev: apply -> smoke -> observe
staging: promote same ID -> integration/load/recovery
prod: approval -> canary -> SLO gate -> expand or abort
scheduled: drift -> dependency/image rebuild -> restore test
~~~

Không apply lại source khác với plan được review. Không rebuild image cho từng environment.

## Lab: cùng một app, ba responsibility

Sử dụng OCI sandbox hoặc local mock:

1. Packer/image tool tạo image có OS/runtime và user service, không secret.
2. cloud-init chỉ inject endpoint/reference và start bootstrap.
3. Terraform tạo network, identity, instance/pool và truyền image ID.
4. Ansible track tùy chọn cấu hình một legacy host; run hai lần, lần hai 0 change.
5. Cố ý sửa host bằng tay; phát hiện drift ở layer phù hợp.
6. Rebuild v2, canary rồi replace; đo downtime và rollback/roll-forward.
7. Ghi matrix: layer nào sở hữu config nào, source of truth, detection và recovery.

Có thể tái dùng [Terraform OCI capstone](../../Lessions/17-capstone-production/README.md).

## Anti-pattern

- Một Terraform root quản lý tenancy, DB, app và mọi environment.
- latest image/package/provider mà không pin/verify.
- SSH vào production chỉnh tay rồi không reconcile.
- Packer nhúng private key/secret hoặc dữ liệu environment.
- Ansible luôn báo changed vì command không idempotent.
- cloud-init quá lớn, không retry/telemetry và chỉ debug được bằng recreate mù.
- Policy chặn mọi thứ nhưng không có reason/owner/exception path.

## Hoàn thành D07 khi

- Có decision matrix và ownership boundary giữa năm lớp công cụ.
- Pipeline tạo immutable image có test/scan/version/deprecation.
- Terraform plan/apply idempotent, state an toàn và refactor không recreate.
- Run thứ hai của configuration không đổi; manual drift được reconcile.
- Secret không có trong source/image/state/log/artifact.

Nguồn: [Terraform language](https://developer.hashicorp.com/terraform/language),
[Packer docs](https://developer.hashicorp.com/packer/docs),
[Ansible introduction](https://docs.ansible.com/projects/ansible/latest/getting_started/introduction.html)
và [cloud-init docs](https://cloudinit.readthedocs.io/).

Tiếp theo: [D08 - CI/CD, artifact và release](../08-cicd-artifacts-release/README.md).
