# Đáp án Quiz Docker

Đề: `02-docker-module-quiz.md`. Điểm thô tối đa **64**. Với câu `[2đ]`, 1 điểm cho cơ chế đúng, 1 điểm cho trade-off/code/evidence đúng.

## Module 1 — Nền tảng

**D01.** Docker CLI → **Docker daemon/Engine API (`dockerd`)** → thường `containerd` → OCI runtime như `runc` → kernel. Chi tiết implementation có thể đổi; điều cần hiểu là API/daemon tách khỏi lifecycle/runtime thấp.

**D02.** `pid`, `net`, `mnt`, `uts`, `user` namespace; còn có `ipc`, `cgroup`, time tùy kernel.

**D03.** Accounting/control CPU, memory, I/O, PIDs và một số tài nguyên khác; Docker flags cuối cùng cấu hình cgroup/kernel scheduler.

**D04.** Sai. Container là các process bị cô lập, thông thường chia sẻ kernel của host; “VM nhẹ” chỉ là ẩn dụ dễ gây hiểu sai isolation/compatibility.

**D05.** PID 1 có default signal behavior khác một số process thường và phải `wait()` child để tránh zombie. Dùng exec-form để app thành PID 1 + cài SIGTERM handler/reap; hoặc dùng init nhỏ (`docker run --init`, `tini`) khi app sinh child và không reap/forward tốt.

**D06.** Client gửi API; daemon quản image/network/volume/container; registry lưu/phân phối image. Client, daemon và registry đều có thể ở máy khác; context/`DOCKER_HOST` chọn daemon.

**D07.** Sai. Xóa container không xóa image; named volume không tự xóa, anonymous volume chỉ bị xóa trong một số lệnh/flag như `--rm`/`-v`. Luôn kiểm tra semantics cụ thể.

**D08.** CLI parse và gọi daemon; daemon pull manifest/layers nếu thiếu, tạo writable layer/config, namespace/cgroup/network/mount, nhờ runtime tạo process. Publish port lập dataplane/NAT hoặc proxy từ host `8080` tới IP container `:80`; request tới host port được chuyển vào network namespace tới nginx. `--rm` xóa container khi dừng, không có nghĩa xóa image/named volume.

## Module 2 — Build và supply chain

**D09.** Image là chuỗi layer read-only content-addressed; container thêm writable copy-on-write layer. Ghi/xóa không thay image; recreate mất writable data trừ mount ngoài.

**D10.** `ENTRYPOINT` đặt executable ổn định, `CMD` cung cấp default args (hoặc default command nếu không có ENTRYPOINT). `docker run IMAGE args` thay `CMD` nhưng giữ ENTRYPOINT; `--entrypoint` mới thay ENTRYPOINT.

**D11.** Exec form không qua shell, argv/signal trực tiếp, không shell-expand `$VAR`; shell form chạy qua `/bin/sh -c`, có interpolation/globbing nhưng shell thường là PID 1 và có thể không forward signal đúng.

**D12.** `COPY` chỉ copy, semantics rõ và ít surprise. `ADD` còn có thể fetch URL/Git hoặc auto-extract local tar tùy source; chỉ dùng khi chủ ý cần khả năng đó. Xem [Dockerfile reference](https://docs.docker.com/reference/dockerfile/).

**D13.** Nó loại file khỏi build context trước khi gửi builder: giảm transfer/cache churn và tránh vô tình cho `.git`, secret, dependency/cache vào build. Không phải biện pháp cứu secret đã `COPY`/commit vào layer.

**D14.** Một đáp án:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .
CMD ["node", "server.js"]
```

Đổi source chỉ invalidates từ `COPY . .`; đổi lockfile mới chạy lại `npm ci`. Production thực còn phải non-root, pin base theo policy, test và tránh copy file thừa.

**D15.** Khung hợp lệ:

```dockerfile
# syntax=docker/dockerfile:1
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/app

FROM alpine:3.22
RUN addgroup -S app && adduser -S -G app -u 10001 app
COPY --from=build --chown=app:app /out/app /usr/local/bin/app
USER 10001:10001
ENTRYPOINT ["/usr/local/bin/app"]
```

Distroless/scratch cũng được nếu binary, CA/timezone và debug strategy phù hợp. [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/).

**D16.** Nếu tách layer, cached `apt-get update` có thể dùng index cũ khi install; gộp giữ index và install nhất quán. Xóa `/var/lib/apt/lists/*` trong **cùng layer** giảm bytes cuối; dùng `--no-install-recommends`/pin phù hợp.

**D17.** Khi layer miss, các instruction sau thường phải rebuild. Đặt dependency manifest/step ít đổi trước; copy source đổi thường xuyên sau. BuildKit cache mounts có thể giữ package cache mà không bake vào layer.

**D18.** Tag là tên mutable; digest xác định manifest content. Pin digest chống tag drift và tăng reproducibility/audit, nhưng phải có automation cập nhật digest để nhận security patches và quản lý multi-arch manifest đúng.

**D19.** Build args/env có thể xuất hiện ở metadata/history/cache, và ENV tồn tại runtime. Dùng `docker build --secret id=x,src=...` với `RUN --mount=type=secret,id=x ...`, hoặc SSH mount; secret chỉ có trong instruction. [Build secrets](https://docs.docker.com/build/building/secrets/).

**D20.** Một tag/digest index có manifests cho nhiều OS/architecture. `buildx` builder chạy `--platform=linux/amd64,linux/arm64`, build/push các image và manifest list/index. Có thể native multi-node, cross-compile hoặc QEMU emulation (chậm hơn và có khác biệt); runtime chọn manifest phù hợp node.

**D21.** Auth trả lời “ai được pull/push”; signing/provenance verification trả lời artifact có đúng publisher/policy/source/build đã tin hay không. Registry private không tự chứng minh image không bị thay/compromise.

**D22.** SBOM là inventory component/package/version/relationship. Nó hỗ trợ CVE/license/incident lookup nhưng không tự chứng minh không có lỗ hổng, provenance đúng, artifact không tamper hay code an toàn.

**D23.** Không bỏ qua ngay. Xác minh package/version/layer, exploitability/reachability, runtime exposure/config, severity/fix, base ownership; nâng/rebuild/remove nếu có thể. Nếu accept risk phải có evidence, owner, compensating controls, expiry và rescan.

**D24.** Commit pinned → lint/unit/integration → deterministic BuildKit build từ reviewed Dockerfile/base → SBOM + vuln/license/secret scan → test image → sign/attest provenance → push registry immutable digest → promote **cùng digest** qua environments với policy/approval → verify signature/digest khi deploy → observe/rollback. Không rebuild riêng cho production.

## Module 3 — Runtime

**D25.** `create`: tạo stopped container; `start`: chạy container đã tạo; `run`: pull/create/start (+ attach tùy flags); `stop`: signal rồi force sau timeout; `kill`: gửi signal ngay (mặc định KILL); `rm`: xóa stopped container (hoặc force có rủi ro).

**D26.** `exec` tạo process mới trong namespaces/cgroup của container đang chạy, không thay entrypoint. File change vào writable layer có thể sống đến khi container đó bị xóa, nhưng mất khi recreate; không phải config/deploy bền vững.

**D27.** Không. Health status chỉ `healthy/unhealthy`; standalone Engine không tự restart chỉ vì unhealthy. Restart policy thường dựa process exit/daemon restart. Orchestrator/load balancer có thể dùng health khác nhau.

**D28.** `STOPSIGNAL` chọn signal mặc định (thường SIGTERM). `docker stop -t N` gửi signal, chờ N giây, rồi SIGKILL nếu PID 1 chưa thoát. App cần ngừng nhận request, drain/flush, kết thúc trước deadline; SIGKILL không cleanup.

**D29.** `0`: thành công; `1`: lỗi generic; `126`: tìm thấy nhưng không execute/permission; `127`: command not found; `137`: SIGKILL; `143`: SIGTERM. Đây là quy ước shell `128+signal`; phải đối chiếu state/log.

**D30.** Ưu tiên stdout/stderr để runtime logging driver/collector xử lý lifecycle/rotation. File riêng cần volume, rotation, shipper và disk budget; file không rotate dễ đầy writable layer/host.

**D31.** App ghi file/syslog thay stdout; logging driver không hỗ trợ `docker logs` hoặc cấu hình remote; process khác/đã recreate; buffering; đang xem sai container/context; output bị redirect. Ba giả thuyết + lệnh inspect/log config được điểm.

**D32.** Quota/`--cpus` là trần thời gian CPU; shares/weight chỉ chia tương đối khi contention, không là reservation/trần; cpuset giới hạn core cụ thể process được schedule lên.

**D33.** Memory hard limit có thể dẫn kernel OOM-kill process container khi pressure/charge vượt; swap cho phép vượt RAM trong tổng limit tùy cgroup/config nhưng chậm. Tắt OOM killer không có hard limit có thể khiến host cạn memory và kill/treo process quan trọng. [Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/).

**D34.** `stats`: usage live CPU/memory/net/I/O; `inspect`: desired/runtime config + state/mount/network/health; `top`: process list; `events`: timeline daemon object lifecycle/actions.

## Module 4 — Storage/network

**D35.** Writable layer mất khi container xóa, phù hợp ephemeral writes; named volume daemon-managed/persistent, DB/data; bind mount host-path/persistent nhưng host-coupled, source/config dev; tmpfs ở memory/ephemeral, cache hoặc secret tạm không cần disk. [Docker storage](https://docs.docker.com/engine/storage/).

**D36.** Mount che nội dung sẵn có tại target; dữ liệu image vẫn ở lower layer nhưng không nhìn thấy trong container đó. Recreate không mount hoặc mount nơi khác rồi copy có chủ ý; không thể unmount dễ bên trong container managed.

**D37.** Quiesce/transaction-consistent snapshot hoặc dùng native dump (`pg_dump`/backup protocol), ghi vào artifact/volume độc lập, checksum/encrypt/copy off-host, rồi restore vào volume/container mới và query validate. Tar files khi DB đang ghi có thể chụp các file/WAL ở thời điểm khác nhau, không crash/application-consistent.

**D38.** User-defined bridge có automatic DNS by container/name/alias và isolation theo network; default bridge cũ kém thuận tiện, thường dựa legacy link/IP. Tách networks giới hạn reachability.

**D39.** Loopback của chính container. Nếu app chỉ listen `127.0.0.1`, packet tới container interface IP từ port mapping/peer không được accept; bind `0.0.0.0`/interface cần thiết và giới hạn exposure ở publish/firewall.

**D40.** Host IP `127.0.0.1`, host port `8080`, container port `80`, TCP. Chỉ client trên host truy cập mapping này (trừ các đặc thù platform/proxy), tránh expose mọi interface.

**D41.** Bridge: app cùng host; host: cần host stack/performance/port semantics và chấp nhận mất isolation; none: không network; overlay: multi-daemon/Swarm; macvlan: container xuất hiện như host L2/MAC cho legacy/underlay. [Network drivers](https://docs.docker.com/engine/network/drivers/).

**D42.** Xác nhận scope/time → `inspect` state/health/network → app B listen đúng address/port (`ss`, log) → A resolve B (`getent`) → TCP test từ A → network membership/IP/alias → host firewall/iptables/nftables/DOCKER-USER → resource saturation/conntrack/MTU nếu intermittent. Mỗi bước nói kết quả nào phân nhánh; validate request end-to-end sau sửa.

**D43.** Refused: DNS/routing tới host được và nhận RST, thường không listener/sai port/app down/policy reject kiểu RST. Timeout: packet/reply bị drop, route/firewall/policy/app hang. Không tuyệt đối; packet capture/log giúp xác minh.

## Module 5 — Compose

**D44.** `up`: create/reconcile/start (foreground); `-d`: detach; `stop`: dừng giữ containers; `rm`: xóa stopped containers; `down`: dừng/xóa project containers/networks mặc định, giữ named volume; `down -v`: **xóa named/anonymous volumes của project**, nguy cơ mất data.

**D45.** `started`: chỉ cần process/container chạy; `healthy`: dependency phải pass healthcheck; `completed_successfully`: one-shot migration/init job exit 0. App vẫn phải chịu dependency restart sau đó.

**D46.** Ví dụ:

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD:?set DB_PASSWORD}
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 12
      start_period: 10s
    volumes:
      - db-data:/var/lib/postgresql/data
  api:
    build: .
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
volumes:
  db-data:
```

Trong production tránh secret trong inspect/env nếu threat model yêu cầu; dùng Compose secrets/app secret provider và rotate. API vẫn retry kết nối.

**D47.** Profiles bật nhóm service tùy use case (debug/observability); override files thay delta môi trường; project name namespacing resource để nhiều stack không collision. Render config trước khi deploy.

**D48.** Nó hiển thị model sau merge, defaults/interpolation và environment dùng cho interpolation, bắt biến thiếu, đường path, port/volume override hoặc type coercion. Output có thể chứa giá trị nhạy cảm; redact trước chia sẻ.

## Module 6 — Security/production

**D49.** Không hoàn toàn là một trục duy nhất: `privileged` rộng nhất/nguy hiểm nhất; root trong container còn nhiều quyền; non-root giảm impact; non-root + drop-all/add capability tối thiểu tốt hơn; rootless daemon giảm rủi ro daemon/root host nhưng có compatibility/performance/port/cgroup trade-off. Defense-in-depth kết hợp rootless, non-root, seccomp, read-only, capabilities. [Rootless](https://docs.docker.com/engine/security/rootless/) và [seccomp](https://docs.docker.com/engine/security/seccomp/).

**D50.** Các finding hợp lệ (cần ít nhất sáu và fix tương ứng):

1. `latest` mutable → pin version/digest và promotion.
2. `privileged` → bỏ; chỉ add capability/device cụ thể nếu evidence bắt buộc.
3. UID 0 → image/user non-root.
4. Public `0.0.0.0` → bind loopback/reverse proxy/firewall hoặc chỉ internal network tùy use case.
5. Mount `/` read-write → loại bỏ; nếu thật sự cần, mount subtree tối thiểu read-only (vẫn rủi ro).
6. Docker socket → loại bỏ/proxy API allow-list; socket thường host-root equivalent.
7. Password hard-code → rotate ngay, secret store/file mount; kiểm tra Git/image/log history.
8. Không read-only rootfs/tmpfs/cap drop/no-new-privileges → thêm theo app.
9. Không CPU/memory/PID/log constraints → đặt và load-test/right-size.
10. `restart: always` có thể che crash loop → health/alert/backoff/runbook; policy không thay root-cause fix.
11. Không network segmentation/healthcheck → thêm networks/health và dependency retry.

Không cho đủ điểm nếu chỉ xóa từng dòng mà không xác minh app requirement/rollback.
