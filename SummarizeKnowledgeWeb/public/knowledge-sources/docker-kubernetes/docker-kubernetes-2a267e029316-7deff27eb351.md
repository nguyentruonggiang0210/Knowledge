# 17 — Cheat sheet và ma trận quyết định

Cheat sheet dùng để nhớ cú pháp, không thay hiểu biết. Trước mutation, xác nhận context và exact target.

## Context và inventory

```bash
docker context ls
docker context show
docker version
docker info
docker system df -v
```

## Container lifecycle/debug

```bash
docker container ls -a
docker run --name app -d -p 127.0.0.1:8080:8080 IMAGE
docker logs --since 10m --tail 200 -f app
docker top app
docker stats app --no-stream
docker inspect app
docker exec -it app sh
docker stop --time 30 app
docker rm app
docker events --since 30m --filter container=app
```

Useful formats:

```bash
docker inspect app --format '{{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}}'
docker inspect app --format 'user={{.Config.User}} image={{.Image}}'
docker inspect app --format '{{json .Mounts}}'
docker inspect app --format '{{json .NetworkSettings.Networks}}'
```

## Image/build/registry

```bash
docker build -t example/app:dev .
docker buildx build --progress=plain --target runtime -t example/app:dev .
docker history --no-trunc example/app:dev
docker image inspect example/app:dev
docker image ls --digests
docker tag example/app:dev registry.example.com/team/app:git-a1b2c3d
docker push registry.example.com/team/app:git-a1b2c3d
docker buildx imagetools inspect registry.example.com/team/app:git-a1b2c3d
```

Multi-platform/cache/attestation:

```bash
docker buildx build --platform linux/amd64,linux/arm64 --sbom=true \
  --provenance=mode=max -t REGISTRY/APP:TAG --push .
docker buildx du
```

## Network

```bash
docker network ls
docker network create app-net
docker network inspect app-net
docker network connect app-net CONTAINER
docker port CONTAINER
docker run --rm --network app-net busybox nslookup SERVICE
```

| Nhu cầu | Chọn |
|---|---|
| Service cùng một host, DNS/isolation | User-defined bridge |
| Không network | `none` |
| Chia sẻ host stack có chủ đích | `host` + security review |
| Swarm nhiều host | overlay |
| Legacy như thiết bị L2 | macvlan/ipvlan + network review |

## Storage

```bash
docker volume create app-data
docker volume inspect app-data
docker run --rm --mount type=volume,src=app-data,dst=/data IMAGE
docker run --rm --mount type=bind,src=/exact/host/path,dst=/data,readonly IMAGE
docker run --rm --mount type=tmpfs,dst=/tmp,tmpfs-size=64m IMAGE
docker volume ls
```

| Data | Chọn |
|---|---|
| DB/uploads bền qua recreate | Named volume/managed volume + backup |
| Source/config host cần thấy | Bind mount, ưu tiên readonly |
| Cache/secret tạm không ghi disk | tmpfs có size limit |
| Scratch không quan trọng | Writable layer |

## Compose

```bash
docker compose config
docker compose config --environment
docker compose up -d --build --wait
docker compose ps -a
docker compose logs -f --tail 100
docker compose exec api sh
docker compose run --rm migrate
docker compose --profile debug up -d
docker compose down --remove-orphans
# docker compose down -v xóa volume project: chỉ dùng khi thật sự muốn xóa data
```

Production merge:

```bash
docker compose -f compose.yaml -f compose.production.yaml config
docker compose -f compose.yaml -f compose.production.yaml pull
docker compose -f compose.yaml -f compose.production.yaml up -d --no-build --wait
```

## Security baseline

```yaml
user: "10001:10001"
read_only: true
cap_drop: [ALL]
security_opt: ["no-new-privileges:true"]
tmpfs: ["/tmp:rw,noexec,nosuid,size=64m"]
pids_limit: 100
mem_limit: 256m
cpus: 0.5
```

Không thêm `privileged`, Docker socket, host network/PID, device hoặc capability rộng nếu chưa có threat-model review và evidence.

## Triage theo trạng thái

| Trạng thái | Đầu tiên xem |
|---|---|
| Không build | plain progress, context, `.dockerignore`, base/dependency/secret/platform |
| Created không start | daemon error, command, mount/port conflict |
| Exited | logs, exit/OOM/error, events, signal |
| Running unhealthy | health output, timeout/start period, app readiness |
| Running không reachable | listen interface → peer DNS/network → publish → firewall |
| Running chậm | app RED, stats, dependency, throttle/OOM/disk |
| Data mất | exact mounts, project name, volumes, deploy timeline |

## “Khi nào dùng gì?”

| Quyết định | Chọn A khi | Chọn B khi |
|---|---|---|
| Container vs VM | Cùng kernel, đóng gói app nhẹ | Kernel/isolation/OS đầy đủ riêng |
| `CMD` vs `ENTRYPOINT` | Default dễ thay | Executable cố định + CMD args |
| Env vs secret file | Config không nhạy cảm | Credential/token/cert private |
| Tag vs digest | UX/release alias | Deploy/verify bất biến |
| Exec vs shell form | Signal/args rõ | Cần shell expansion/pipeline có chủ đích |
| Compose vs Kubernetes | Một host/dev/CI, SLO phù hợp | Multi-node scheduler/HA/policy/ecosystem |
| Rootless vs rootful | Giảm daemon privilege, features đủ | Feature/operation bắt buộc và host hardening mạnh |

## Dọn dẹp an toàn

Inventory trước:

```bash
docker system df -v
docker container ls -a
docker image ls
docker volume ls
docker buildx du
```

Các lệnh `prune`, `compose down -v`, xóa registry tag/manifest hoặc volume đều là mutation có thể làm mất evidence/data/cache. Xác nhận owner, backup và exact scope trước khi chạy.
