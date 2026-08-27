# 08 — BuildKit secret mount

Lab chứng minh secret có mặt trong đúng một build step nhưng không được copy vào image/config/history. Token dùng ở đây là dữ liệu giả.

## Tạo token local (đã được `.gitignore`)

PowerShell:

```powershell
Set-Content -NoNewline -Path ./demo-token.txt -Value 'training-token-not-real'
```

Bash:

```bash
printf %s 'training-token-not-real' > demo-token.txt
chmod 600 demo-token.txt
```

## Build

```bash
docker build --secret id=demo_token,src=demo-token.txt -t deep-docker/build-secret:dev .
docker run --rm deep-docker/build-secret:dev
docker history --no-trunc deep-docker/build-secret:dev
```

Output runtime chỉ có `credential_was_available=true`. Tìm token trong filesystem image (lệnh được kỳ vọng không in token):

```bash
docker run --rm deep-docker/build-secret:dev sh -c 'grep -R "training-token-not-real" / 2>/dev/null || true'
```

Build không có `--secret` phải fail vì `required=true`:

```bash
docker build -t deep-docker/build-secret:should-fail .
```

Xóa `demo-token.txt` sau lab. Secret mount tránh bake credential, nhưng Dockerfile/build script độc hại vẫn có thể gửi nó qua network; chỉ build source tin cậy và dùng token least-privilege/ngắn hạn.

Liên quan: [Bài 05](../../../Lessions/Docker/05-buildkit-buildx.md), [Bài 09](../../../Lessions/Docker/09-security-hardening.md).
