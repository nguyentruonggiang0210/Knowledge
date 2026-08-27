# D11 - DevSecOps, identity và software supply chain

## Mục tiêu

- Đưa security vào design, build, deploy, runtime và response thay vì gate cuối.
- Threat-model asset/trust boundary/abuse case và ưu tiên theo risk.
- Quản identity, secret, key, certificate và vulnerability theo lifecycle.
- Phân biệt SBOM, provenance, signature, policy và runtime verification.

## Security là thuộc tính của cả hệ thống

~~~mermaid
flowchart LR
  Source[Source control] --> Build[Trusted build]
  Dependency[Dependencies] --> Build
  Build --> Artifact[Artifact registry]
  Artifact --> Deploy[Deployment control]
  Deploy --> Runtime[Runtime]
  Identity[Human and workload identity] -.-> Source
  Identity -.-> Build
  Identity -.-> Deploy
  Evidence[Logs SBOM provenance policy] -.-> Build
  Evidence -.-> Runtime
  Response[Vulnerability and incident response] --> Source
~~~

“Shift left” không có nghĩa chuyển mọi trách nhiệm cho developer. Security cần guardrail
sớm, specialist support và runtime detection/response. “Shift everywhere” phù hợp hơn.

## Threat modeling thực dụng

1. Scope và business outcome.
2. Asset: credential, PII, money, availability, source/artifact, audit evidence.
3. Actors và entry point.
4. Data flow/trust boundary/privilege.
5. Abuse case và failure mode.
6. Existing control, likelihood, impact và residual risk.
7. Mitigation, owner, due date và cách verify.

STRIDE có thể gợi ý spoofing, tampering, repudiation, information disclosure, denial of
service, elevation of privilege; đừng dùng acronym thay suy nghĩ theo domain.

~~~text
Internet -> WAF/LB -> private app -> database
                   -> message broker -> worker
CI runner -> registry -> deployment controller
~~~

Mỗi mũi tên cần authentication, authorization, encryption, rate limit và evidence.

## Identity và access

- Human: enterprise federation, MFA, conditional/JIT access, short session, reviewed role.
- Workload: cloud/Kubernetes workload identity và short-lived token.
- Build: ephemeral runner identity chỉ được publish đúng repository.
- Deploy: environment-scoped identity; production không dùng credential dev.
- Break-glass: hai người/justification/time limit/audit/rotation và rehearsal.

Authentication xác định principal; authorization quyết định action/resource/condition.
Service account shared làm mất attribution. Least privilege phải test cả allow case và deny case.

## Secret, key và certificate lifecycle

Inventory → generate/import → distribute/reference → use → rotate → revoke → destroy/audit.

- Secret manager/KMS không tự sửa app caching/reload/dual-key transition.
- Rotation zero-downtime thường cần overlap old/new ngắn, rollout consumer, verify rồi revoke.
- Certificate cần owner, SAN, chain, renewal monitor và expiry alert đủ sớm.
- Encryption key backup/DR quan trọng như encrypted data; mất key là mất data.
- Không log secret, đưa vào image/state/plan/command-line/artifact.

Nếu lộ secret: revoke/rotate trước, xác định exposure/usage, preserve evidence và sửa đường
leak. Chỉ xóa Git history là chưa đủ.

## Secure SDLC controls

| Lớp | Control ví dụ | Giới hạn |
|---|---|---|
| Source | review, protected branch, signed change | Reviewer/account có thể bị compromise |
| Secret scan | phát hiện pattern/entropy | False positive/negative; không thay rotation |
| SAST | code pattern/data flow | Không thấy runtime/config đầy đủ |
| SCA | dependency/license/CVE | CVE không tự cho biết exploitability |
| IaC/config scan | public access/misconfig | Cần context/policy exception |
| DAST/fuzz | behavior đang chạy/input lạ | Coverage và môi trường |
| Image scan | OS/app packages | DB signature/unknown component |
| Admission/runtime | verify image/policy/detect | Không sửa source root cause |

Gate blocking dùng cho risk rõ, confidence cao và có remediation/exception SLA. Findings khác
được triage theo exploitability, reachability, exposure, asset và business impact—not CVSS
một mình.

## Supply-chain evidence

- SBOM: inventory thành phần; không chứng minh artifact được build an toàn.
- Provenance: artifact xuất phát từ source/input/builder nào.
- Signature: ai/key nào xác nhận bytes/attestation; verifier phải quản trust/revocation.
- Attestation: signed statement về property/process.
- SLSA: specification với track/level tăng dần guarantee cho source/build.
- Policy: quyết định evidence nào đủ cho environment/risk.

Flow production: verify digest + signature + trusted provenance + policy tại deploy, không
chỉ tạo file SBOM rồi lưu quên trong CI.

## Builder/runner hardening

- Ephemeral, patched, isolated network/credential/cache.
- Untrusted PR không chạy privileged hoặc mount container socket.
- Pin action/plugin/compiler/base/dependency; verify checksum/signature.
- Build output không được tự quyết policy kiểm chính nó.
- Provenance do trusted build service tạo; artifact registry immutable.
- Egress allowlist khi phù hợp; monitor unusual package/download.
- Dependency update có test/canary và response process cho compromised package.

## Data security và compliance

Phân loại data, minimization, purpose, residency, retention, backup và deletion. Mã hóa in
transit/at rest, field/tokenization khi cần. Production data không tự được phép sao chép vào
dev. Compliance evidence nên lấy từ source/pipeline/API, có timestamp/owner/retention; một
control “pass” không đồng nghĩa hệ thống không có risk.

## Policy-as-code mẫu

[lab/kubernetes-security.rego](lab/kubernetes-security.rego) minh họa reject Deployment dùng
latest image hoặc thiếu non-root/read-only/capability drop. Fixture cố ý sai nằm ở
[lab/insecure-deployment.json](lab/insecure-deployment.json). Chạy với OPA phù hợp:

~~~bash
opa eval --data lab/kubernetes-security.rego \
  --input lab/insecure-deployment.json \
  "data.devops.kubernetes.deny"
~~~

Kỳ vọng bốn deny. Trong CI, thêm test fixture expected allow/deny và parse từng object nếu
manifest YAML có nhiều document.

## Lab: secret compromise tabletop

1. Threat-model pipeline → registry → OKE workload và database.
2. Cố ý đưa fake token đã vô hiệu vào test fixture; detector phải chặn.
3. Mô phỏng token thật lộ trong CI log: incident role, revoke, audit, rotate, redeploy.
4. Rotation dùng dual credential/workload identity, không downtime.
5. Tạo SBOM/provenance/signature cho image D09; deploy policy từ chối unsigned/wrong source.
6. Thêm một exception có owner, business reason, expiry và compensating control.
7. Viết evidence map từ requirement đến preventive/detective/corrective control.

## Hoàn thành D11 khi

- Threat model có trust boundary, abuse case và verified mitigation.
- Human/build/workload/deploy identity tách scope, không static production key.
- Secret/certificate rotation và compromise response đã rehearsal.
- Giải thích rõ SBOM khác provenance/signature.
- Untrusted source không thể tự tạo trusted production artifact.
- Policy có test allow/deny, exception và owner.

Nguồn: [NIST SSDF SP 800-218](https://csrc.nist.gov/pubs/sp/800/218/final),
[SLSA 1.2](https://slsa.dev/spec/v1.2/),
[OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
và [Kubernetes security](https://kubernetes.io/docs/concepts/security/).

Tiếp theo: [D12 - Observability và OpenTelemetry](../12-observability-opentelemetry/README.md).
