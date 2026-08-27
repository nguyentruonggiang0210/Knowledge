# Bộ đánh giá Docker & Kubernetes

Thư mục này dùng để đo năng lực, không thay thế phần bài học. Không có một bộ câu hỏi hữu hạn nào có thể bảo đảm bao phủ mọi runtime, CNI, CSI, cloud provider và phiên bản; bộ này đặt một **baseline production** đủ rộng, đồng thời buộc người học tra API/tài liệu theo phiên bản đang chạy.

## Cách dùng

1. Làm `01-diagnostic.md` khi chưa ôn, đóng tất cả tài liệu.
2. Học từng module rồi làm `02-docker-module-quiz.md` và `03-kubernetes-module-quiz.md`.
3. Làm `04-scenarios-troubleshooting.md`: luôn ghi giả thuyết, bằng chứng cần thu thập, lệnh kiểm tra, cách sửa và cách phòng ngừa.
4. Hoàn thành các lab trong `05-practical-assessments.md` trên môi trường disposable (Docker Desktop, Linux VM, kind/minikube/k3d). Không chạy thử nghiệm phá hoại trên cluster dùng chung.
5. Chỉ sau đó mở các file `90`–`93` đáp án; tự chấm bằng `99-scoring-competency-matrix.md`.
6. Sau 7 ngày, làm lại chỉ những câu sai; sau 30 ngày, làm lại một đề ngẫu nhiên và ít nhất một lab.

## Danh mục

| File | Mục đích | Thời lượng gợi ý |
|---|---|---:|
| `01-diagnostic.md` | Xác định lỗ hổng ban đầu | 75 phút |
| `02-docker-module-quiz.md` | Kiểm tra Docker theo module | 100 phút |
| `03-kubernetes-module-quiz.md` | Kiểm tra Kubernetes theo module | 130 phút |
| `04-scenarios-troubleshooting.md` | Tình huống production và quy trình debug | 120 phút |
| `05-practical-assessments.md` | Bài thi thực hành có rubric pass/fail | 8–16 giờ |
| `90-answer-key.md` | Đáp án diagnostic | Sau khi làm bài |
| `91-docker-answer-key.md` | Đáp án quiz Docker | Sau khi làm bài |
| `92-kubernetes-answer-key.md` | Đáp án quiz Kubernetes | Sau khi làm bài |
| `93-scenario-answer-key.md` | Gợi ý chấm tình huống | Sau khi làm bài |
| `99-scoring-competency-matrix.md` | Quy đổi điểm thành năng lực và kế hoạch bù lỗ hổng | 20 phút |

## Ma trận bao phủ

| Miền kiến thức | Diagnostic | Quiz | Scenario | Lab |
|---|:---:|:---:|:---:|:---:|
| Linux process, namespace, cgroup, signal/PID 1 | ✓ | Docker | ✓ | ✓ |
| Image, layer, registry, BuildKit/cache/multi-platform/SBOM | ✓ | Docker | ✓ | ✓ |
| Container lifecycle, logs, exec, health, resources | ✓ | Docker | ✓ | ✓ |
| Bridge/DNS/port/NAT/overlay; volume/bind/tmpfs | ✓ | Docker | ✓ | ✓ |
| Compose, dependency readiness, profiles, config/secrets | ✓ | Docker | ✓ | ✓ |
| Least privilege, capabilities, seccomp, rootless, socket risk | ✓ | Docker | ✓ | ✓ |
| Kubernetes API, desired state, control plane/node/CRI | ✓ | K8s | ✓ | ✓ |
| Pod/controller/rollout/Job/CronJob/StatefulSet/DaemonSet | ✓ | K8s | ✓ | ✓ |
| Service/DNS/EndpointSlice/Ingress/Gateway/NetworkPolicy | ✓ | K8s | ✓ | ✓ |
| ConfigMap/Secret/ServiceAccount/RBAC/admission/securityContext | ✓ | K8s | ✓ | ✓ |
| Request/limit/QoS/scheduling/taint/affinity/topology/eviction | ✓ | K8s | ✓ | ✓ |
| PV/PVC/StorageClass/CSI/snapshot/backup/restore | ✓ | K8s | ✓ | ✓ |
| Probe, rollout, HPA, PDB, autoscaling, availability | ✓ | K8s | ✓ | ✓ |
| Logs/metrics/traces/events/audit/SLO/capacity/cost | ✓ | K8s | ✓ | ✓ |
| Helm/Kustomize/GitOps/CI-CD/upgrade/DR/multi-tenancy | — | K8s | ✓ | ✓ |

## Quy ước làm bài

- Trắc nghiệm một đáp án ghi `A/B/C/D`; câu “chọn tất cả” phải chọn đủ và không chọn thừa.
- Câu ngắn: trả lời tối đa 5 dòng, trừ khi đề yêu cầu manifest/lệnh.
- Không cho điểm câu chỉ nêu lệnh sửa mà không chỉ ra bằng chứng xác nhận nguyên nhân.
- Lệnh có tính phá hoại (`prune`, xóa PVC/namespace, `drain`, thay firewall) phải nêu phạm vi, ảnh hưởng và rollback.
- Với Kubernetes, kiểm tra API thật bằng `kubectl api-resources`, `kubectl explain` và tài liệu đúng minor version; không học thuộc YAML mù quáng.

## Tài liệu chuẩn để đối chiếu

- Docker: [Dockerfile best practices](https://docs.docker.com/build/building/best-practices/), [storage](https://docs.docker.com/engine/storage/), [network drivers](https://docs.docker.com/engine/network/drivers/), [resource constraints](https://docs.docker.com/engine/containers/resource_constraints/), [rootless mode](https://docs.docker.com/engine/security/rootless/) và [build secrets](https://docs.docker.com/build/building/secrets/).
- Kubernetes: [cluster components](https://kubernetes.io/docs/concepts/overview/components/), [workloads](https://kubernetes.io/docs/concepts/workloads/), [networking](https://kubernetes.io/docs/concepts/services-networking/), [storage](https://kubernetes.io/docs/concepts/storage/), [resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/), [security](https://kubernetes.io/docs/concepts/security/) và [observability](https://kubernetes.io/docs/concepts/cluster-administration/observability/).

Các trang chính thức thay đổi theo phiên bản. Nếu đáp án trong repo khác tài liệu của cluster đang dùng, ghi lại phiên bản và ưu tiên tài liệu versioned của cluster.
