# 00 — Roadmap, tiền đề và môi trường lab

## Mục tiêu

Sau bài này bạn có một cluster local có thể phá/xây lại, biết nhịp học 14 tuần và hiểu điều kiện để chuyển sang production.

## Kiến thức tiền đề

Kubernetes không thay thế các nền tảng dưới đây; nó làm cho lỗi nền tảng khó nhìn hơn. Hãy bù lỗ hổng trước hoặc song song:

- Linux: process, signal, PID 1, cgroup, namespace, mount, permission, filesystem, OOM.
- Container: image layers, registry, tag so với digest, ENTRYPOINT/CMD, OCI runtime, CRI.
- Mạng: IP/CIDR, route, NAT, TCP/UDP, DNS, HTTP/TLS, L4/L7, load balancing.
- Dữ liệu: stateless/stateful, replication, quorum, backup/restore, RPO/RTO.
- Git, YAML/JSON, shell/PowerShell, HTTP API và TLS certificate.
- SRE cơ bản: SLI/SLO, saturation, error budget, incident và postmortem.

Tự kiểm tra: giải thích điều gì xảy ra khi gõ một URL từ DNS lookup đến TCP/TLS/HTTP; giải thích vì sao process PID 1 phải xử lý `SIGTERM`; phân biệt backup với replica.

## Môi trường học

Ưu tiên `kind` vì cluster nằm trong container, tạo/xóa nhanh và hỗ trợ multi-node. `minikube`, `k3d` hoặc Docker Desktop Kubernetes vẫn dùng được, nhưng lệnh và add-on có thể khác.

Yêu cầu:

- Docker Engine/Desktop còn ít nhất 4 CPU, 8 GiB RAM, 15 GiB disk trống.
- `kubectl`; `kind`; tùy bài có `helm`.
- Git và một terminal.

Làm theo [CodeSample/kubernetes/README.md](../../CodeSample/kubernetes/README.md). Kiểm tra tối thiểu:

```powershell
docker version
kind version
kubectl version --client
kind create cluster --config CodeSample/kubernetes/kind-config.yaml
kubectl cluster-info --context kind-deep-k8s
kubectl get nodes -o wide
```

Không dùng cluster công ty cho chaos lab. Local cluster không mô phỏng đầy đủ cloud load balancer, multi-AZ storage, IAM hay failure domain thật.

## Lịch 14 tuần

| Tuần | Học | Thực hành bắt buộc | Gate |
|---:|---|---|---|
| 1 | Kiến trúc, API, `kubectl` | trace object, Events, owner reference | Vẽ và thuyết minh reconciliation |
| 2 | Pod, Deployment, Job | rollout, rollback, termination | Không quản lý Pod trần |
| 3 | Scheduling/resources | requests/limits, taint, spread | Chẩn đoán Pod Pending |
| 4 | Networking | Service/DNS/NetworkPolicy | Trace client → Pod |
| 5 | Ingress/Gateway/TLS | routing và failure test | Phân biệt data/control plane |
| 6 | Storage | PVC/StatefulSet/backup | Restore được dữ liệu |
| 7 | Config/Secret/probes | rotate config, probe failure | Không làm liveness sai |
| 8 | Autoscaling/resilience | load HPA, drain/PDB | Giải thích metric → replica |
| 9 | Security | RBAC, PSA, NetworkPolicy | Least privilege qua `auth can-i` |
| 10 | Kustomize/Helm/GitOps | render, diff, rollback | Git là source of truth |
| 11 | Observability/debug | incident drills | Timeline dựa trên bằng chứng |
| 12 | Cluster operations | upgrade/HA/DR tabletop | Có runbook, RPO/RTO |
| 13 | Capstone | deploy đầy đủ và game day | Pass readiness review |
| 14 | Ôn/checklist | teach-back, quiz/interview | Mọi mục có artifact chứng minh |

### Nhịp mỗi buổi 90 phút

1. 20 phút đọc mental model và nguồn chính thức.
2. 35 phút làm happy-path lab.
3. 20 phút inject một lỗi và debug không nhìn đáp án.
4. 10 phút ghi decision log: quyết định, trade-off, bằng chứng.
5. 5 phút tự giải thích lại bằng lời.

## Capstone xuyên suốt

Project mẫu là HTTP service nhỏ trong [CodeSample/kubernetes/app](../../CodeSample/kubernetes/app):

- `GET /` trả hostname/version; `GET /livez`; `GET /readyz`; `GET /metrics`.
- Chạy non-root, immutable root filesystem, resources/probes đầy đủ.
- Deployment + Service; overlay dev/prod; HPA; PDB; NetworkPolicy; RBAC.
- Có dashboard/runbook ở mức khái niệm và các failure drill.

Mỗi tuần thêm một khả năng. Không đợi đến cuối mới “production hóa”.

## Thang đánh giá cho mỗi lab

| Mức | Bằng chứng |
|---|---|
| 0 — Chưa biết | Chỉ copy lệnh, không dự đoán kết quả |
| 1 — Biết làm | Happy path chạy nhưng không giải thích được |
| 2 — Hiểu | Dự đoán status/Events và giải thích controller nào tác động |
| 3 — Vận hành | Tự tạo lỗi, khoanh vùng, sửa và kiểm chứng |
| 4 — Thiết kế | So sánh phương án theo SLO, rủi ro, chi phí, vận hành |

Mục tiêu tối thiểu: mọi mục checklist đạt mức 2; nhóm production/security/DR đạt mức 3.

## Những điều local lab không chứng minh được

- `LoadBalancer` của cloud, IAM workload identity, managed control plane.
- Latency và partition giữa availability zones.
- CSI snapshot/restore thực, volume attachment fencing.
- Nâng cấp managed cluster, quota cloud, autoscaling node thực.
- Khả năng chịu tải hoặc DR production.

Với các mục này, làm tabletop + sandbox cloud riêng, có budget/cảnh báo chi phí và IaC review.

## Bài tập mở đầu

1. Tạo cluster; lưu output của `kubectl get nodes -o yaml`.
2. Tìm `.spec`, `.status`, `metadata.resourceVersion`, `metadata.managedFields`.
3. Xóa một worker container của kind, quan sát `NodeReady`; khởi động lại và ghi timeline. Không xóa cluster đang chứa dữ liệu cần giữ.
4. Viết 5 giả định của local cluster không đúng với production.

Nguồn: [kind Quick Start](https://kind.sigs.k8s.io/docs/user/quick-start/), [kubectl install](https://kubernetes.io/docs/tasks/tools/), [Kubernetes learning environment](https://kubernetes.io/docs/setup/learning-environment/).
