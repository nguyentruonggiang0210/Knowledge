# Deploy SummarizeKnowledgeWeb trên Oracle Cloud

VM đang dùng Nginx cho `ccar-foundations-giang.duckdns.org`, vì vậy website này chạy trong Docker tại `127.0.0.1:8081` và Nginx route bằng một domain mới.

## 1. Tạo domain mới

Tạo một subdomain DuckDNS mới và trỏ về `207.211.147.64`, ví dụ:

```text
knowledge-giang.duckdns.org
```

Không dùng lại `ccar-foundations-giang.duckdns.org`. Giữ port `80/443` mở; không mở port `8081`.

## 2. Build và upload bằng PowerShell

Chạy nguyên khối trong PowerShell:

```powershell
$key = "D:\Download\ssh-key-2026-07-04.key"
$vmIp = "207.211.147.64"
$sshUser = "opc"

Set-Location "E:\SourceCode\SummarizeKnowledgeWeb"
npm ci
npm run build
tar -czf "$env:TEMP\summarize-knowledge-web.tar.gz" Dockerfile .dockerignore compose.yaml deploy dist
scp -i "$key" "$env:TEMP\summarize-knowledge-web.tar.gz" "${sshUser}@${vmIp}:/tmp/"
ssh -i "$key" "${sshUser}@${vmIp}"
```

## 3. Chạy container trên VM

Chạy trong terminal SSH:

```bash
APP="$HOME/apps/summarize-knowledge-web"
mkdir -p "$APP"
rm -rf "$APP/dist"
tar -xzf /tmp/summarize-knowledge-web.tar.gz -C "$APP"
cd "$APP"
sudo docker compose up -d --build --remove-orphans
```

Container chỉ mở tại `127.0.0.1:8081`, không chiếm port `80/443` của website CCAR.

## 4. Thêm domain vào Nginx một lần

Thay domain giống mục 2 rồi chạy trên VM:

```bash
DOMAIN="knowledge-giang.duckdns.org"
cd "$HOME/apps/summarize-knowledge-web"
sed "s/__DOMAIN__/$DOMAIN/g" deploy/host-nginx.conf | sudo tee /etc/nginx/conf.d/summarize-knowledge.conf >/dev/null
sudo setsebool -P httpd_can_network_connect 1
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d "$DOMAIN" --redirect
```

Mở website tại:

```text
https://knowledge-giang.duckdns.org
```

## 5. Deploy bản cập nhật

Chạy trong PowerShell:

```powershell
$key = "D:\Download\ssh-key-2026-07-04.key"
$vmIp = "207.211.147.64"
$sshUser = "opc"

Set-Location "E:\SourceCode\SummarizeKnowledgeWeb"
npm ci
npm run build
tar -czf "$env:TEMP\summarize-knowledge-web.tar.gz" Dockerfile .dockerignore compose.yaml deploy dist
scp -i "$key" "$env:TEMP\summarize-knowledge-web.tar.gz" "${sshUser}@${vmIp}:/tmp/"
ssh -i "$key" "${sshUser}@${vmIp}" "cd ~/apps/summarize-knowledge-web && rm -rf dist && tar -xzf /tmp/summarize-knowledge-web.tar.gz -C . && sudo docker compose up -d --build --force-recreate --remove-orphans"
```

## 6. Docker và reverse proxy hiện hoạt động như thế nào

Luồng truy cập:

```text
Trình duyệt
    │ HTTPS theo domain
    ▼
Nginx trên Oracle VM :443
    │ reverse proxy
    ▼
127.0.0.1:8081 trên VM
    │ Docker port mapping
    ▼
Nginx trong container :8080
    │
    ▼
React production bundle trong dist/
```

Ý nghĩa của từng phần:

- `npm run build` chạy ở máy Windows vì quá trình build cần đọc các folder kiến thức nằm cạnh `SummarizeKnowledgeWeb`. Kết quả cuối cùng nằm trong `dist/`.
- `.dockerignore` chỉ đưa `Dockerfile`, cấu hình Nginx và `dist/` vào Docker build context; source và `node_modules` không đi vào image.
- `Dockerfile` dùng `nginx:stable-alpine`, copy `dist/` vào image và chạy Nginx bằng user `nginx` trên port nội bộ `8080`.
- `compose.yaml` chỉ map `127.0.0.1:8081:8080`. Vì bind vào loopback nên Internet không thể gọi trực tiếp port `8081`.
- Nginx cài trên VM là điểm vào duy nhất giữ port `80/443`. Nó chọn website theo domain: domain CCAR tiếp tục vào website cũ, domain knowledge được proxy tới `127.0.0.1:8081`.
- Certbot cấp và gia hạn HTTPS tại Nginx của VM. Container không cần giữ certificate và không cần chạy thêm Caddy.
- `httpd_can_network_connect` cho phép Nginx kết nối tới container khi SELinux đang ở chế độ Enforcing.
- Container dùng filesystem chỉ đọc, bỏ Linux capabilities, bật healthcheck, tự khởi động lại và giới hạn dung lượng log.

Thiết kế này cho phép nhiều website dùng chung một Public IP mà không tranh port `80/443`. Khi cập nhật, chỉ `dist/` và Docker image được thay; cấu hình reverse proxy và website CCAR không bị đụng tới.
