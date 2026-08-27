# Đáp án Level 2 – Core Delivery và Runtime

Tổng: **38 điểm**.

## C01 (1 điểm)

**B.** State giữ binding/metadata phục vụ diff và lifecycle; phải bảo vệ vì có thể chứa ID và dữ liệu nhạy cảm.

## C02 (1 điểm)

**Đúng.** Boundary nên theo lifecycle: provision infrastructure, bake image, bootstrap tối thiểu và cấu hình guest; tránh một tool làm mọi việc.

## C03 (1 điểm)

**B.** Build một lần và promote exact digest giúp staging đã test cùng bytes với production.

## C04 (1 điểm)

**Sai.** Cache là tối ưu có thể tái tạo/evict; release artifact là evidence đầu ra cần integrity, identity, provenance, retention và access control chặt hơn.

## C05 (1 điểm)

**B.** PID 1 phải forward/handle signal và reap child; nếu không, shutdown có thể bị force-kill và zombie tích tụ.

## C06 (1 điểm)

**A.** Image là content-addressed template/layers; container là runtime process/isolation với writable state tạm.

## C07 (1 điểm)

**A.** SBOM tăng visibility thành phần nhưng không chứng minh artifact sạch hoặc không exploit được.

## C08 (1 điểm)

**Sai.** `sensitive` thường chỉ che display; state/plan/log/API có thể vẫn chứa giá trị. Bảo vệ backend/artifact và ưu tiên runtime secret reference.

## C09 (2 điểm)

- 1 điểm: Terraform tạo network/VM/IAM/reference; Packer bake OS/package/agent/app base thành immutable image; cloud-init bootstrap identity/registration nhỏ; Ansible quản guest/config khi thật sự cần mutable reconciliation.
- 1 điểm: `remote-exec` dài, download `latest`, secret inline, logic không idempotent, timeout khó debug và mỗi boot biến node khác nhau là dấu hiệu boundary sai. Version image/config và rollout thay thế có kiểm soát.

## C10 (2 điểm)

- 1 điểm: configuration là intent; state là binding/last-known metadata; remote API là reality. Refresh/plan phát hiện khác biệt nhưng mỗi field có thể do controller khác sở hữu.
- 1 điểm: chọn revert manual change bằng apply review, cập nhật code để chấp nhận intent mới, import/refactor binding hoặc ignore có lý do/owner. Destructive plan phải triage impact/data/backup, không auto-remediate.

## C11 (2 điểm)

- 1 điểm: commit → deterministic build/test → package → scan/SBOM → provenance/sign → immutable registry digest → environment-specific approval/deploy cùng digest.
- 1 điểm: deployment record chứa digest, signature/attestation, build run, commit SHA, config/version, environment và change ID; runtime label/metadata cho phép truy ngược, audit xác nhận ai/when.

## C12 (2 điểm)

- 1 điểm: rolling tiết kiệm capacity nhưng trộn version; blue-green cần capacity/traffic switch nhanh; canary giảm blast radius và cần metric/traffic segmentation.
- 1 điểm: chọn theo state/data compatibility, capacity, rollback time, risk/SLO. Schema phải expand/contract vì rollback binary không đảo migration destructive.

## C13 (2 điểm)

- 1 điểm: namespaces cô lập view/resource như PID/network/mount/user; cgroups đo/giới hạn/prioritize CPU/memory/IO/pids.
- 1 điểm: root/container capability/mount/socket có thể leo quyền; rootless giảm impact nhưng kernel/shared host, supply chain và misconfiguration vẫn là attack surface. Dùng least capability, seccomp, read-only FS và patching phù hợp.

## C14 (2 điểm)

- 1 điểm: asset gồm source/secret/signing key/artifact/prod; actor developer/fork/runner/admin/attacker; boundary SCM→runner→registry→cloud; entry PR/dependency/plugin/log/artifact.
- 1 điểm: preventive như protected trigger, pin digest, short-lived least privilege; detective như audit/SBOM/signature/anomaly; responsive như revoke, quarantine, rebuild/runbook. Threat model phải ghi assumption/owner.

## C15 (3 điểm)

Mỗi nhóm đúng 0,5, tối đa 3:

- Pin trusted base theo version/digest và có upgrade process; `latest` không reproducible.
- Dùng `.dockerignore`, copy manifest/install dependency trước, không `COPY .` mọi secret/build context.
- Không đặt token trong `ENV`/layer; dùng BuildKit secret/runtime identity/secret mount.
- Cài package tối thiểu, `--no-install-recommends`, cleanup apt metadata cùng layer; tránh `sudo` trong image.
- Tạo non-root user, owner/mode tối thiểu; không `chmod -R 777`.
- Exec-form `CMD ["python", "app.py"]`, pin dependency, multi-stage nếu build; health/readonly/resource config ở runtime. Scan/sign/SBOM ngoài Dockerfile.

## C16 (3 điểm)

- 1 điểm: code/action `main` mutable; fork PR là untrusted input; admin key biến build compromise thành prod takeover; `latest` không xác định bytes.
- 1 điểm: untrusted PR chạy không secret với token read-only/sandbox; pin action/plugin commit/digest và review dependency. Protected branch/environment mới được request deploy.
- 1 điểm: build/sign artifact digest một lần; short-lived workload federation, least privilege theo env, approval/separation, concurrency/audit; deploy exact reviewed digest, verify attestation.

## C17 (3 điểm)

- 1 điểm: hiện có ba writers/source (`image`, Ansible, boot download) nên node không reproducible; inventory version thực tế và freeze mutable writers.
- 1 điểm: chọn immutable image digest/version làm base; Terraform rollout image reference; cloud-init chỉ bootstrap; config version riêng do một controller quản. Không tải `latest`.
- 1 điểm: canary/replace node, health check và instance metadata báo version; drift detection, deprecate image, rollback về image/config pair đã biết.

## C18 (3 điểm)

- 0,5: xác thực CVE/package/version/runtime reachability/exposure và business criticality; không đóng chỉ vì scanner false positive.
- 0,5: query SBOM/provenance/digest/runtime inventory để biết scope chính xác.
- 0,5: patch base/dependency, deterministic rebuild, rescan/test, new SBOM/sign/attest.
- 0,5: canary rồi staged rollout theo SLO; ưu tiên exposed workloads và chuẩn bị rollback.
- 0,5: exception phải có compensating control, owner, expiry/risk acceptance.
- 0,5: admission/inventory xác nhận old digest không còn chạy; revoke artifact nếu cần và lưu evidence.

## C19 (3 điểm)

- 1 điểm: federation/OIDC/workload identity đổi CI job identity thành short-lived token, trust giới hạn repo/branch/environment/audience; không lưu user key.
- 1 điểm: role riêng plan/apply/dev/prod, least resource/action, protected production approval và separation; log principal/session/change.
- 1 điểm: rotate/revoke key cũ sau migration, monitor use; break-glass MFA/vault/time-bound/dual approval/test/audit, không dùng làm pipeline thường trực.

## C20 (3 điểm)

- 1 điểm: expand schema backward-compatible trước (thêm nullable/new table/index online), cả v1/v2 chạy; deploy code hỗ trợ hai schema/feature flag.
- 1 điểm: backfill idempotent/throttled, dual read/write khi cần, measure consistency/lag/error/latency; canary theo cohort.
- 1 điểm: chuyển read/write, quan sát đủ cửa sổ rồi contract ở release sau. Trước contract có thể rollback binary; sau destructive step thường roll-forward/restore cần kế hoạch riêng.

