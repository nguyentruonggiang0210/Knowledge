# Bài đánh giá thực hành

Các bài này chấm **artifact chạy được + bằng chứng**, không chấm ảnh screenshot đơn lẻ. Dùng repository riêng cho bài làm; không commit secret. Môi trường Kubernetes nên là kind/minikube/k3d hoặc namespace lab được cấp. Mọi thao tác fault injection chỉ thực hiện trên tài nguyên có label `assessment=true`.

## Quy tắc chung

- Mỗi lab 100 điểm. Đạt khi **≥ 75 điểm và qua tất cả cổng bắt buộc**.
- Người chấm phải clone vào máy/cluster sạch và chạy theo `README.md`; “chạy trên máy em” không được tính.
- Bằng chứng gồm command transcript đã xóa secret, test output, manifest/config, quyết định thiết kế và rollback.
- Image phải có tag immutable cho lần chấm; không phụ thuộc `latest`.
- Cấm `--privileged`, host root mount, host network, Docker socket hoặc cluster-admin trừ khi đề rõ ràng yêu cầu và thí sinh chứng minh nhu cầu.

---

## PA-01 — Production image và Compose stack

**Mục tiêu:** containerize một HTTP API nhỏ (ngôn ngữ tùy chọn) cùng PostgreSQL/Redis bằng Compose.

### Yêu cầu

1. API có `/live`, `/ready`, `/version`; trả request ID và log JSON ra stdout.
2. Dockerfile multi-stage, deterministic dependency install, `.dockerignore`, user non-root, exec-form entrypoint, graceful SIGTERM, image cuối không có compiler/source/secret không cần thiết.
3. Tối ưu cache bằng cách copy dependency manifest trước source; build lại sau đổi một file source phải tái dùng dependency layer.
4. Compose có healthcheck, dependency condition phù hợp, named volume DB, network tách frontend/backend nếu hợp lý, resource limit, restart policy có giải thích.
5. Không hard-code credential. Cung cấp `.env.example` chỉ có placeholder; secret thật không xuất hiện trong Git, image history hay `docker inspect` ngoài giới hạn đã giải thích.
6. Test tự động: happy path, dependency chưa ready, restart API, restart DB, graceful shutdown, persistence sau recreate.

### Bằng chứng bắt buộc

```text
docker build --progress=plain ...
docker history --no-trunc IMAGE
docker image inspect IMAGE
docker compose config
docker compose up --wait
docker compose ps
docker inspect ...
docker compose down && docker compose up -d
```

### Rubric

| Hạng mục | Điểm |
|---|---:|
| App/health/log/shutdown đúng | 20 |
| Dockerfile, cache, multi-stage, kích thước | 25 |
| Compose readiness/network/storage | 20 |
| Security và secret hygiene | 20 |
| Test, README, evidence, rollback | 15 |

**Cổng bắt buộc:** chạy non-root; persistence test pass; SIGTERM kết thúc trong grace period; không lộ secret; build/run được từ clone sạch.

---

## PA-02 — Docker networking, storage và khôi phục

**Mục tiêu:** chứng minh hiểu data path, name resolution và backup nhất quán.

### Yêu cầu

1. Tạo ba service `client → api → db`; client không được kết nối trực tiếp DB nhờ network segmentation.
2. Chứng minh DNS service discovery, published port chỉ bind loopback host, và sự khác nhau giữa refused/timeout/DNS failure bằng fault injection có kiểm soát.
3. DB dùng named volume; một config dev dùng bind mount read-only; dữ liệu nhạy cảm tạm dùng tmpfs nếu app hỗ trợ.
4. Viết script/quy trình backup logical hoặc quiesced backup, checksum artifact, restore vào volume mới và xác minh record count/hash.
5. Ghi lại RPO/RTO đo thực tế và các giới hạn của backup.

### Rubric

| Hạng mục | Điểm |
|---|---:|
| Network topology/least exposure | 25 |
| Debug DNS/refused/timeout có evidence | 20 |
| Chọn mount đúng và quyền read-only | 15 |
| Backup/restore nhất quán, checksum | 25 |
| Runbook, RPO/RTO, cleanup an toàn | 15 |

**Cổng bắt buộc:** client không reach DB; restore vào volume mới thành công; không dùng host root path; cleanup không xóa volume ngoài project.

---

## PA-03 — Docker security và incident drill

**Mục tiêu:** harden một container cố tình cấu hình xấu và xử lý sự cố tài nguyên.

### Input cố ý xấu

- root user, writable rootfs, capabilities rộng, public port, embedded token, không limit, tag mutable, dependency cũ.
- workload tạo spike CPU/memory và sinh log nhanh.

### Yêu cầu

1. Threat model ngắn: asset, trust boundary, attacker path, blast radius.
2. Sửa non-root, read-only rootfs + tmpfs nơi cần ghi, drop/add capability tối thiểu, `no-new-privileges`, seccomp mặc định, secret injection, immutable image reference.
3. Đặt/test CPU và memory constraints; phân biệt throttling/OOM và lấy exit/health/events/log.
4. Tạo SBOM, scan vulnerability, triage ít nhất ba finding theo reachability/fix availability/severity; ghi exception có hạn dùng nếu cần.
5. Viết incident timeline cho token compromise: contain, rotate, eradicate, recover, lessons learned.

### Rubric

| Hạng mục | Điểm |
|---|---:|
| Threat model và ưu tiên rủi ro | 15 |
| Runtime hardening | 30 |
| Resource experiment/evidence | 20 |
| SBOM/scan/triage | 20 |
| Incident response/runbook | 15 |

**Cổng bắt buộc:** không privileged/socket/host root mount; app vẫn chạy sau hardening; secret đã rotate và không còn trong artifact mới; thí nghiệm không ảnh hưởng ngoài lab.

---

## PA-04 — Kubernetes application baseline

**Mục tiêu:** deploy API stateless lên cluster sạch bằng manifest declarative.

### Yêu cầu

1. Namespace, Deployment ≥3 replicas, ClusterIP Service, ConfigMap, Secret placeholder/injection, ServiceAccount riêng.
2. `startupProbe`, `readinessProbe`, `livenessProbe` với endpoint đúng; resources requests/limits; securityContext đạt Restricted ở mức app có thể hỗ trợ.
3. Rolling update không downtime trong test tải nhẹ; revision history/rollback được chứng minh.
4. `topologySpreadConstraints` hoặc anti-affinity phân tán replicas; PDB phù hợp; graceful termination.
5. Labels/annotations nhất quán; không dùng Pod trần; YAML qua server-side dry-run/schema lint nếu môi trường cho phép.

### Bằng chứng tối thiểu

```text
kubectl apply --server-side -f ...
kubectl get all -n ... -o wide
kubectl rollout status deployment/... -n ...
kubectl get endpointslice -n ...
kubectl auth can-i ... --as=system:serviceaccount:...
kubectl describe ...
```

### Rubric

| Hạng mục | Điểm |
|---|---:|
| Object model/selectors/service discovery | 20 |
| Probe/resources/shutdown | 20 |
| Security identity/config | 20 |
| HA/rollout/PDB/topology | 25 |
| Validation/README/evidence | 15 |

**Cổng bắt buộc:** Service có endpoints Ready; rollout/rollback pass; Pod non-root; selectors đúng; xóa một Pod không làm dịch vụ gián đoạn quan sát được trong ngưỡng test.

---

## PA-05 — Kubernetes traffic và zero-trust baseline

**Mục tiêu:** triển khai `frontend → api → db` và giới hạn traffic/identity.

### Yêu cầu

1. Mỗi tier có ServiceAccount và labels riêng; Service chỉ expose port cần thiết.
2. Default-deny ingress và egress trong namespace; allow đúng luồng, DNS và endpoint ngoài nếu thật sự cần.
3. Expose frontend bằng Ingress hoặc Gateway (tùy addon có sẵn), TLS bằng certificate test; redirect HTTP nếu controller hỗ trợ.
4. RBAC: frontend không cần API token; một reporter chỉ `get/list` Pod và `get pods/log` theo yêu cầu, không wildcard.
5. Positive/negative connectivity tests từ ephemeral test Pod; ghi rõ CNI/controller được dùng.

### Rubric

| Hạng mục | Điểm |
|---|---:|
| Service/DNS/routing/TLS | 25 |
| Default-deny + allow-list chính xác | 30 |
| RBAC/ServiceAccount least privilege | 20 |
| Negative tests/evidence | 15 |
| Portability và tài liệu assumptions | 10 |

**Cổng bắt buộc:** network policy thật sự được CNI enforce; đường hợp lệ pass, đường cấm fail; `kubectl auth can-i` chứng minh least privilege; không dùng default ServiceAccount token không cần thiết.

---

## PA-06 — Stateful workload, backup và restore

**Mục tiêu:** vận hành một stateful service trên cluster lab, hiểu rõ giới hạn của StatefulSet.

### Yêu cầu

1. StatefulSet + headless Service + `volumeClaimTemplates`; chọn StorageClass/access mode/reclaim policy có giải thích.
2. Anti-affinity/topology và PDB phù hợp với quorum hoặc giới hạn của app.
3. Backup application-consistent (logical dump, quiesce hoặc cơ chế vendor), snapshot CSI nếu cluster hỗ trợ, copy backup ra nơi độc lập.
4. Restore sang namespace/instance mới; kiểm tra checksum/record và đo RTO. Không “restore” đè bản gốc trước khi xác minh.
5. Diễn tập Pod delete, node unavailable giả lập trong khả năng lab, PVC expansion nếu hỗ trợ; ghi failure mode chưa giải quyết.

### Rubric

| Hạng mục | Điểm |
|---|---:|
| Stateful identity/storage đúng | 20 |
| Availability/quorum/topology | 20 |
| Consistent backup + external copy | 25 |
| Restore test và data validation | 25 |
| Runbook/RPO/RTO/limitations | 10 |

**Cổng bắt buộc:** restore mới đọc đúng dữ liệu; giải thích được reclaim policy; không coi snapshot duy nhất là backup; không xóa PVC gốc.

---

## PA-07 — Reliability, autoscaling và observability game day

**Mục tiêu:** chứng minh hệ thống phát hiện và chịu được failure có kiểm soát.

### Yêu cầu

1. Dashboard hoặc query cho traffic, errors, latency, saturation; log có correlation ID; trace một request nếu stack cho phép.
2. SLO và error budget đơn giản; ít nhất hai alert: symptom page-worthy và capacity ticket-worthy.
3. HPA dựa resource hoặc custom metric, có requests và behavior/stabilization hợp lý; load test chứng minh scale-out/scale-in.
4. Game day: kill Pod, làm readiness fail, tạo CPU/memory pressure trong limit, chặn một network path, drain node lab nếu có nhiều node.
5. Mỗi thử nghiệm có hypothesis, abort condition, observation, recovery, lesson và cleanup.

### Rubric

| Hạng mục | Điểm |
|---|---:|
| Signals/dashboard/correlation | 20 |
| SLO và alert chất lượng | 15 |
| Autoscale hoạt động, không flapping | 20 |
| Fault experiments và recovery | 30 |
| Runbook/evidence/safety | 15 |

**Cổng bắt buộc:** có abort condition; không fault ngoài namespace/lab; ít nhất bốn experiment pass/recover; alert dựa triệu chứng người dùng chứ không chỉ CPU.

---

## PA-08 — Capstone: delivery và disaster recovery

**Mục tiêu:** giao một dịch vụ từ source đến Kubernetes theo đường production-like.

### Yêu cầu

1. CI: lint/test, deterministic multi-platform build nếu cần, cache, SBOM, vulnerability/policy gate, immutable tag/digest, provenance/signature theo tool lựa chọn.
2. CD/GitOps hoặc pipeline declarative: cùng image digest được promote dev → staging → prod; config tách biệt; approval và audit trail; canary/blue-green hoặc rolling có quality gate.
3. Policy: resource/security/registry/label baseline; exception được ghi owner và expiry.
4. Observability/SLO/runbook/on-call handoff; capacity và cost assumption.
5. Backup/restore manifests, keys/secrets strategy và application data; diễn tập khôi phục ở cluster/namespace mới.
6. Architecture decision records cho ít nhất ba trade-off (Compose vs K8s, Helm vs Kustomize, managed vs self-managed hoặc tương đương).

### Rubric

| Hạng mục | Điểm |
|---|---:|
| CI và supply-chain | 20 |
| Promotion/deployment/rollback | 20 |
| Kubernetes production baseline/policy | 20 |
| Observability/SLO/runbook | 15 |
| DR restore đã diễn tập | 20 |
| ADR và tài liệu | 5 |

**Cổng bắt buộc:** không rebuild giữa môi trường; rollback chạy được; artifact có định danh immutable; restore được dữ liệu kiểm chứng; không lộ secret; toàn bộ từ clone sạch có hướng dẫn tái tạo.

## Phiếu nghiệm thu cuối

- [ ] Người khác chạy lại từ README trên môi trường sạch.
- [ ] Tất cả cổng bắt buộc đã có evidence.
- [ ] Không có credential trong Git/history/image/log nộp bài.
- [ ] Cleanup chỉ target tài nguyên có project/namespace/label lab.
- [ ] Có rollback và restore **đã chạy**, không chỉ mô tả.
- [ ] Ghi rõ phiên bản Docker, Kubernetes, CNI, CSI và ingress/gateway controller.
