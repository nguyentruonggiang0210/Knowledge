# D08 - CI/CD, artifact lifecycle và release engineering

## Mục tiêu

- Thiết kế pipeline nhanh, tin cậy, tái lập và không mở rộng trust quá mức.
- Build một lần, định danh bằng digest và promote cùng artifact.
- Chọn release strategy theo risk/SLO, không theo thời thượng.
- Xử lý database compatibility, feature flag và partial deployment.

## Pipeline là control plane nhạy cảm

CI có quyền đọc source và tạo artifact được production tin. CD có thể thay production.
Do đó runner, dependency, action/plugin, cache, log và credential đều thuộc supply chain.

~~~mermaid
flowchart LR
  PR[Pull request] --> Fast[Lint unit secret SAST]
  Fast --> Build[Hermetic-ish build]
  Build --> Test[Integration scan policy]
  Test --> Artifact[Registry digest SBOM provenance]
  Artifact --> Dev[Dev]
  Dev --> Stg[Staging]
  Stg --> Gate[Approval and SLO gate]
  Gate --> Canary[Production canary]
  Canary -->|healthy| Full[Full rollout]
  Canary -->|bad| Abort[Abort and recover]
~~~

## CI stages và feedback

Đưa check nhanh/ổn định lên trước:

1. format/lint/schema và secret scan;
2. unit test/type check;
3. build;
4. dependency/SAST/image/IaC scan;
5. contract/integration test;
6. policy/license/compliance;
7. publish khi source được tin cậy.

Flaky test là incident của delivery system: quarantine có owner/deadline, tìm root cause,
không retry vô hạn cho xanh. Cache tăng tốc nhưng phải có key đúng và không được biến output
không tin cậy thành executable trusted.

Test portfolio:

- unit cho logic nhỏ, nhanh và deterministic;
- contract cho compatibility giữa consumer/provider;
- integration cho database/broker/cloud boundary;
- end-to-end chỉ giữ critical journey vì chậm/dễ flaky;
- security/performance/recovery cho non-functional risk;
- production verification bằng canary/synthetic, không dùng user làm tester mù.

Test data được tạo/sanitize, environment tái lập và cleanup; production dump không tự được
phép đưa vào CI.

## Reproducible và immutable artifact

- Pin toolchain/dependency/base; lock file được review.
- Build metadata/provenance nối source commit và builder.
- Artifact repository có immutability, retention, vulnerability response và access audit.
- Tag dễ đọc có thể di chuyển; digest/content hash mới là identity promote.
- Dev/staging/prod nhận cùng digest, chỉ environment config/secret thay đổi.
- Verify signature/provenance/policy trước deploy, không chỉ lúc build.

## Runner và credential

- Untrusted PR/fork không nhận production secret hoặc privileged runner.
- Tách runner/network/cache theo trust; ephemeral runner giảm persistence.
- Dùng OIDC/workload federation và credential ngắn hạn, scope theo environment.
- Pin third-party action/plugin bằng immutable revision và quản update.
- Log/artifact retention theo data classification; redact không thay prevention.
- Concurrency lock ngăn hai deploy cùng environment chồng nhau.

## Deployment/release patterns

| Pattern | Khi phù hợp | Risk/cost |
|---|---|---|
| Recreate | Dev hoặc downtime chấp nhận | Đơn giản, có gián đoạn |
| Rolling | Nhiều replica, version tương thích | Hai version cùng chạy |
| Blue-green | Cutover/rollback traffic nhanh | Gấp đôi capacity, data vẫn khó rollback |
| Canary | Có telemetry và đủ traffic | Phức tạp analysis/segmentation |
| Feature flag | Tách deploy/release | Flag debt và state combination |

Mọi strategy cần health/readiness đúng, abort criteria, timeout và verify user outcome.
Rollback binary không tự rollback data hoặc side effect; thường cần roll-forward.

## Database expand-contract

Một rollout tương thích:

1. Expand: thêm schema mới tương thích với app cũ.
2. Migrate/backfill có rate limit, checkpoint và telemetry.
3. App mới dual-read/write hoặc chuyển behavior có kiểm soát.
4. Verify data và hết consumer cũ.
5. Contract: xóa schema cũ ở release sau.

Không deploy code cần cột mới trước khi schema có mặt; không drop cột khi old replica còn
chạy. Migration phải có lock/latency/disk/capacity model.

## Approval và change evidence

Approval hiệu quả khi reviewer thấy:

- exact artifact digest và source/provenance;
- diff config/IaC và test/policy results;
- user/risk/blast radius;
- current SLO/error budget;
- rollout, abort, recovery và owner/on-call;
- database/data impact.

Approval “bấm nút vì quy trình” không giảm risk. Standard low-risk change có thể tự động;
high-risk/emergency cần control tương xứng và reconcile sau.

## Pipeline pseudocode

Xem [lab/pipeline-pseudocode.yml](lab/pipeline-pseudocode.yml). File cố ý trung lập vendor;
hãy chuyển nó sang CI đang dùng và giữ invariant:

- PR không publish/deploy;
- main chỉ publish sau test/scan;
- digest được truyền giữa job, không rebuild;
- production có concurrency, environment authorization và SLO gate;
- cleanup artifact tạm/sandbox luôn chạy.

## Lab: progressive delivery

1. Containerize app D09 và test local.
2. Pipeline tạo image, SBOM/provenance/signature trong sandbox.
3. Deploy digest vào dev; chạy smoke/contract/security test.
4. Promote cùng digest vào staging và chạy load/data migration rehearsal.
5. Production local cluster: 10% canary, inject latency/error.
6. Analysis tự abort theo error/latency guardrail; thu timeline.
7. Sửa, build digest mới và roll-forward; chứng minh artifact cũ không bị overwrite.
8. Mô phỏng runner từ fork và chứng minh nó không đọc secret/deploy.

## Metrics

Theo dõi năm DORA metrics, pipeline queue/duration/success, flaky rate, time-to-feedback,
rollback/abort, artifact age và security finding remediation. Đừng tối ưu build time bằng
cách bỏ test quan trọng; đo outcome end-to-end.

## Hoàn thành D08 khi

- Pipeline fresh clone tạo cùng logical artifact và provenance.
- Một digest được promote qua ba environment.
- Untrusted code không chạm trusted credential/runner/cache.
- Canary lỗi tự dừng theo user-facing signal, có recovery evidence.
- Database migration chịu old/new version và có contract cleanup.

Nguồn: [DORA Continuous Delivery](https://dora.dev/capabilities/continuous-delivery/),
[SLSA specification](https://slsa.dev/spec/v1.2/) và
[NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final).

Tiếp theo: [D09 - Container và Docker](../09-containers-docker/README.md).
