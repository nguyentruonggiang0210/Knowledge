# D09 - Containers, images và Docker

## Mục tiêu

- Hiểu container bằng Linux namespaces/cgroups và OCI specifications.
- Build image nhỏ, immutable, non-root, có provenance và graceful shutdown.
- Vận hành network/volume/resource/health và debug OOM/PID 1.
- Phân biệt Open Container Initiative (OCI) với Oracle Cloud Infrastructure (cũng OCI).

## Container là gì?

Container là process được cô lập view bằng namespaces và kiểm soát tài nguyên bằng cgroups;
nó vẫn chia sẻ kernel host. Image là package read-only theo layer chứa filesystem/config để
tạo container. Runtime triển khai OCI Image/Runtime specs; Docker là một trải nghiệm/toolset,
không phải định nghĩa duy nhất của container.

~~~mermaid
flowchart TB
  Image[OCI image manifest plus layers] --> Runtime[Container runtime]
  Runtime --> P[Isolated process]
  Kernel[Shared host kernel] --> P
  NS[PID mount net user namespaces] --> P
  CG[cgroups CPU memory IO pids] --> P
  Sec[Capabilities seccomp LSM] --> P
~~~

VM có guest kernel; container thường nhẹ hơn nhưng isolation boundary khác. Có thể chạy
container bên trong cloud VM.

## Image, layer, tag và digest

- Dockerfile instruction thường tạo layer; thứ tự ảnh hưởng cache và size.
- Tag là mutable pointer thuận tiện cho người; digest là immutable content identity.
- Multi-stage build giữ compiler/tool khỏi runtime stage.
- Base image càng nhỏ không tự càng an toàn; phải patch, scan, debug/support được.
- Không đưa secret vào ARG, ENV, COPY hay layer rồi “xóa ở layer sau”: dữ liệu vẫn ở history.
- .dockerignore giảm context và nguy cơ gửi secret/source thừa cho builder.

Local sample dùng tag để dễ học. Production CI phải truyền approved base theo digest, lưu
SBOM/provenance và promote output image bằng digest.

## Process lifecycle và PID 1

Container sống theo process chính:

- entrypoint dạng exec giúp signal tới đúng process;
- app cần xử lý SIGTERM, ngừng readiness/nhận việc, drain và thoát trước grace period;
- SIGKILL không cho cleanup;
- PID 1 cần reap zombie child; dùng init nhỏ nếu app sinh child mà không reap;
- không chạy sshd/systemd/many unrelated daemons trong một container nếu không có lý do rõ.

Probe không thay lifecycle đúng. Liveness sai có thể tạo restart storm; readiness chỉ điều
khiển nhận traffic; startup bảo vệ app khởi động chậm.

## Runtime security

Defense in depth:

- non-root UID cụ thể và user namespace/rootless khi phù hợp;
- drop Linux capabilities, no-new-privileges, seccomp/AppArmor/SELinux;
- read-only root filesystem, writable volume/tmpfs đúng path;
- không mount Docker socket/host root hoặc privileged tùy tiện;
- giới hạn CPU/memory/PID và theo dõi throttling/OOM;
- image verify, vulnerability policy và patch SLA;
- secret mount/runtime identity, không image/env/log.

Container root không mặc định bằng host root, nhưng misconfiguration/runtime/kernel bug có
thể phá isolation.

## Network và storage

- Container network namespace có interface/route/DNS riêng; publish port mở đường từ host.
- Bridge/overlay/proxy có MTU/NAT/conntrack riêng cần debug.
- Container writable layer là ephemeral; persistent data dùng volume/storage service.
- Bind mount gắn chặt host path/permission; named volume giảm coupling nhưng vẫn cần backup.
- Không chạy production database chỉ vì Compose làm nó dễ; hiểu durability/restore/upgrade.

## Resource semantics

Memory limit là hard boundary; vượt có thể bị cgroup OOM kill. CPU limit thường throttling,
request/guarantee phụ thuộc orchestrator. App đọc host CPU/memory có thể sai nếu không hiểu
cgroup. Đặt limit từ load test/SLO, theo dõi working set, throttling, OOM và queue.

~~~bash
docker stats
docker inspect devops-demo
docker events
docker logs --since 10m devops-demo
docker exec devops-demo cat /proc/1/status
~~~

Debug image bằng ephemeral debug container/tool khi runtime image không có shell; đừng thêm
tool nguy hiểm vào production image chỉ để “phòng khi”.

## Sample chạy local

~~~powershell
Set-Location .\lab
docker compose build
docker compose up -d
Invoke-RestMethod http://localhost:8080/healthz
docker compose ps
docker compose logs
docker compose down
~~~

~~~bash
cd lab
docker compose build
docker compose up -d
curl --fail http://localhost:8080/healthz
docker compose ps
docker compose logs
docker compose down
~~~

Sample gồm Python standard-library HTTP server, Dockerfile non-root/read-only và Compose
resource/security controls. Không có cloud resource hay phí.

## Lab break/fix

1. Build hai lần và giải thích layer nào cache; thay source rồi so sánh.
2. Inspect image history; chứng minh không có secret.
3. Gửi SIGTERM khi có request chậm; đo graceful stop.
4. Hạ memory limit, tạo allocation test trong branch lab và nhận diện OOM.
5. Chạy read-only filesystem; xác định path nào thật sự cần ghi.
6. Cố ý dùng wrong architecture/tag mutable; sửa bằng multi-platform/digest strategy.
7. Generate SBOM, scan image, ghi triage theo reachability/exposure.
8. Push sandbox registry, deploy bằng digest rồi đổi tag; chứng minh deployment không đổi.

## Dockerfile review checklist

- Base/repository trusted và digest/version được pin trong production.
- Multi-stage, context nhỏ, dependency lock và reproducible build tốt nhất có thể.
- USER non-root; COPY ownership đúng.
- Exec-form ENTRYPOINT/CMD; SIGTERM/drain được test.
- Không secret, package cache, compiler hoặc unnecessary shell/tool.
- Health check có timeout và không gây load/dependency cascade.
- Labels/source/version/SBOM/provenance nối được commit.

## Hoàn thành D09 khi

- Vẽ image → runtime → process → kernel và giải thích isolation boundary.
- Image sample chạy non-root, read-only, drop capabilities và có limit.
- SIGTERM graceful; OOM/throttling có evidence.
- Registry deploy theo digest, không tin tag mutable.
- Biết khi VM/serverless phù hợp hơn container.

Nguồn: [Docker container concepts](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/),
[OCI specifications](https://specs.opencontainers.org/) và
[CNCF container security whitepaper](https://github.com/cncf/tag-security/tree/main/security-whitepaper).

Tiếp theo: [D10 - Kubernetes, Helm và GitOps](../10-kubernetes-helm-gitops/README.md).
