# Đáp án Diagnostic

Không xem file này trước khi hoàn thành `01-diagnostic.md`. Mỗi câu 1 điểm; câu mở được điểm khi chứa đủ ý cốt lõi, không bắt buộc đúng nguyên văn.

## A. Docker

| ID | Đáp án và giải thích |
|---|---|
| DG-D01 | **B.** Container cô lập process nhưng dùng chung kernel host; VM thường ảo hóa phần cứng và chạy guest kernel. Điều này không tự động kết luận loại nào an toàn hơn trong mọi threat model. |
| DG-D02 | Namespace cô lập “thấy được gì” (PID, mount, network, IPC, UTS, user...); cgroup đo, accounting và giới hạn/phân bổ CPU, memory, I/O, PID... |
| DG-D03 | **B.** PID 1 là process chính; khi nó thoát, container chuyển sang stopped dù child khác còn trong namespace. |
| DG-D04 | Image là template immutable theo layer; container là instance runtime có writable layer/process; registry lưu và phân phối image artifacts/manifests. |
| DG-D05 | **B.** Copy dependency manifests và cài trước; thay source không làm mất layer cache dependency. |
| DG-D06 | Stage build chứa compiler/dependencies; stage runtime chỉ copy artifact cần chạy, giảm kích thước và attack surface. |
| DG-D07 | **C, D.** Build secret/SSH mounts chỉ expose trong build instruction cần thiết. `ARG`/`ENV` có nguy cơ nằm trong metadata/history/layer/cache. |
| DG-D08 | Tag là con trỏ mutable; registry owner có thể đẩy manifest khác vào cùng tag. Digest là content-addressed immutable reference. |
| DG-D09 | **B.** Named volume do Docker quản lý, tồn tại độc lập với container, phù hợp data DB. |
| DG-D10 | Bind mount trỏ path host, phụ thuộc layout/quyền host và host quản lý; named volume do daemon quản lý, ít gắn path host và portable hơn trong Docker workflow. |
| DG-D11 | **C.** User-defined network cung cấp embedded DNS theo tên/alias; `localhost` luôn là network namespace hiện tại. |
| DG-D12 | `EXPOSE` là metadata/documentation về port dự kiến; `-p` tạo mapping/publish host port tới container port. |
| DG-D13 | **B.** Health condition xử lý readiness ở Compose; app vẫn cần retry/backoff vì dependency có thể fail sau startup. [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/). |
| DG-D14 | Docker stop gửi signal để app ngừng nhận việc, drain/flush; PID 1 cần forward/handle signal và reap zombie child. Dùng exec form, handler đúng hoặc init nhỏ (`--init`) khi cần. |
| DG-D15 | **A, C, D.** `privileged` phá nhiều lớp isolation, chỉ dành ngoại lệ đã threat-model. |
| DG-D16 | Docker socket thường tương đương quyền điều khiển daemon/host: tạo privileged container, mount host filesystem, lấy secret; compromise container có thể thành host compromise. |
| DG-D17 | **B.** `128+9=137`, thường SIGKILL; phải xác minh `OOMKilled`, daemon/kernel logs hoặc tác nhân kill, không khẳng định OOM chỉ từ code. |
| DG-D18 | `ps -a/inspect` (state, exit, OOM, health, restart count) → current/previous logs → events → config/env/mount/entrypoint → resources/kernel/daemon → reproduce với cùng image/config; xác nhận fix bằng ổn định và health. |
| DG-D19 | **A.** `docker compose config` render merge/interpolation để bắt config thực tế. |
| DG-D20 | Ví dụ: scan OS/app CVE + policy; verify signature/provenance/digest; SBOM/license; pin immutable digest; registry access/promotion. Hai ý hợp lệ được điểm. |

## B. Kubernetes

| ID | Đáp án và giải thích |
|---|---|
| DG-K01 | API server là cổng API; etcd lưu cluster data; scheduler bind Pod chưa có node; controller manager chạy reconciliation controllers. [Kubernetes components](https://kubernetes.io/docs/concepts/overview/components/). |
| DG-K02 | **B.** Kubelet nhận PodSpec đã assign, phối hợp runtime/mount/network để container chạy và báo status/health về API. |
| DG-K03 | Người dùng khai báo desired state; controllers quan sát actual state và lặp lại hành động để hội tụ, kể cả sau failure/drift. |
| DG-K04 | **B. Deployment.** Nó quản ReplicaSet, replicas và rollout/rollback cho stateless workload. |
| DG-K05 | **C. DaemonSet.** Nó bảo đảm một Pod trên tất cả hoặc nhóm node phù hợp. |
| DG-K06 | StatefulSet cho stable identity/network/storage và ordered lifecycle; hợp với workload cần các thuộc tính đó, không phải chỉ vì “có volume”. |
| DG-K07 | **A.** Service thường select Ready Pods qua labels để tạo EndpointSlice; selector/label mismatch là lỗi phổ biến. |
| DG-K08 | ClusterIP nội bộ; NodePort mở port trên node; LoadBalancer yêu cầu implementation/provider cấp LB bên ngoài (thường dựa trên NodePort hoặc dataplane riêng). |
| DG-K09 | **A, B, C.** Không nên để liveness phụ thuộc downstream vì outage downstream sẽ restart hàng loạt app khỏe. [Probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/). |
| DG-K10 | Request dùng trong scheduling/reservation và làm mẫu số HPA resource utilization; limits được runtime/kernel enforce (CPU throttle, memory có thể OOM kill). |
| DG-K11 | **A.** Kiểm tra event và bin-packing theo request; right-size hoặc thêm capacity, không chỉnh probe. |
| DG-K12 | CrashLoopBackOff: container chạy rồi chết lặp và backoff; ImagePullBackOff: không lấy được image; Pending: Pod chưa hoàn tất schedule/start, xem conditions/events để biết nhánh. |
| DG-K13 | **B.** ConfigMap cho config không bí mật. |
| DG-K14 | Secret thường chỉ base64 ở API và mặc định có thể không encrypt at rest; ai đọc API/etcd hoặc có quyền tạo Pod phù hợp có thể lấy. Cần encryption at rest, least-privilege RBAC, rotation/audit/external store theo rủi ro. [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/). |
| DG-K15 | **C.** Role + RoleBinding giới hạn namespace. Có thể dùng ClusterRole tái sử dụng nhưng bind bằng RoleBinding trong namespace. |
| DG-K16 | Chỉ hiệu lực nếu network plugin enforce NetworkPolicy. Pod mặc định non-isolated cho ingress/egress cho đến khi policy có loại tương ứng select nó; rules allow được cộng dồn. |
| DG-K17 | **A.** Dùng `describe pvc`, events, StorageClass/provisioner/CSI logs, access mode/capacity/topology/quota. |
| DG-K18 | Taint đẩy/repel Pod; toleration chỉ cho phép vượt taint, không thu hút. Affinity chọn/ưu tiên nơi đặt; có thể kết hợp cả hai. |
| DG-K19 | **A.** Metrics pipeline phải cung cấp metrics và CPU utilization cần requests để tính tỷ lệ. |
| DG-K20 | PDB hạn chế **voluntary API evictions**; không ngăn node crash, OOM, liveness restart, direct delete hoặc mọi involuntary disruption. [PDB](https://kubernetes.io/docs/tasks/run-application/configure-pdb/). |
| DG-K21 | **A.** Quan sát `rollout status/history`, events/logs; pause/undo theo blast radius rồi xác minh. |
| DG-K22 | Client/DNS/TLS/LB → ingress/gateway address/controller/rules → Service selector/ports → EndpointSlice/Ready → Pod listener/probe → NetworkPolicy/CNI; test từng hop từ trong và ngoài. |
| DG-K23 | **A, B, C.** Metrics cho đại lượng theo thời gian, logs cho sự kiện chi tiết, traces cho đường đi request. |
| DG-K24 | etcd snapshot bảo vệ Kubernetes API/control-plane state; PVC/database backup bảo vệ application data. Git manifests không chứa mọi status/Secret/data, còn etcd không thay thế backup volume nhất quán. |

## C. Vận hành

| ID | Dấu hiệu câu trả lời đạt |
|---|---|
| DG-O01 | Nghi image build sai CPU/OS architecture; kiểm tra node `uname -m`, image manifest (`docker buildx imagetools inspect`/registry), Pod node, binary `file`; build/publish multi-arch hoặc đúng platform và pin digest. Cũng chấp nhận shebang/line-ending nếu có bằng chứng. |
| DG-O02 | Ít nhất bốn lớp: traffic/request mix; app threads/event loop/GC; CPU throttling dù node CPU thấp; memory/I/O; connection pool/queue; downstream/DB/cache; DNS/network/TLS; load balancing/hot shard; traces và saturation. Scale chỉ khi bottleneck/capacity model ủng hộ. |
| DG-O03 | Writable layer ephemeral, drift không audit/reproducible và mất khi reschedule. Mitigate nếu cần, sửa source/config declarative, build image mới, test/scan, rollout canary, observe và rollback; không “bake” thay đổi thủ công. |
| DG-O04 | Bất kỳ năm ý: triệu chứng/scope/severity; prerequisites/access; dashboard/query/lệnh evidence; decision tree; mitigation/rollback; escalation/owner; communication; safety/abort; validation; post-incident/follow-up. |

## Tài liệu đối chiếu nhanh

- [Docker build best practices](https://docs.docker.com/build/building/best-practices/)
- [Docker storage](https://docs.docker.com/engine/storage/)
- [Docker networking drivers](https://docs.docker.com/engine/network/drivers/)
- [Kubernetes Services](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes resource management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Kubernetes RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/)
