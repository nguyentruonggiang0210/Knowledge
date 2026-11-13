# 06 — Runtime security hardening

App Python stdlib cho phép kiểm chứng UID/GID, read-only rootfs và tmpfs bằng hành vi thật.

## Chạy

```bash
docker compose config
docker compose up --build -d --wait
curl http://localhost:8084/identity
curl -X POST http://localhost:8084/write-root
curl -X POST http://localhost:8084/write-tmp
```

Kỳ vọng:

- `/identity`: UID/GID là `10001`.
- `/write-root`: HTTP 403 vì root filesystem read-only.
- `/write-tmp`: HTTP 200 vì `/tmp` là tmpfs có size/mode rõ.

## Xác minh runtime config

```bash
docker compose exec app id
docker compose exec app sh -c 'grep -E "NoNewPrivs|Cap(Eff|Bnd)" /proc/1/status'
docker inspect docker-security-app --format '{{.Config.User}} readonly={{.HostConfig.ReadonlyRootfs}} caps={{json .HostConfig.CapDrop}} security={{json .HostConfig.SecurityOpt}} pids={{.HostConfig.PidsLimit}} memory={{.HostConfig.Memory}}'
```

`CapEff` kỳ vọng không có capability hiệu lực. `NoNewPrivs` kỳ vọng bật. Đừng thêm capability/privileged để “thử cho vui” trên host chứa dữ liệu thật.

## Failure drill

Tạm bỏ tmpfs rồi recreate: endpoint `/write-tmp` phải fail. Thêm lại. Thử đổi port app xuống 80: non-root không nên được “sửa” bằng privileged; dùng port cao hoặc capability hẹp chỉ khi thật cần.

```bash
docker compose down
```

Liên quan: [Bài 09](../../../Lessions/Docker/09-security-hardening.md), [Bài 10](../../../Lessions/Docker/10-reliability-va-tai-nguyen.md).
