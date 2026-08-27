# Hướng dẫn deploy web React/Vite lên Oracle Cloud (Oracle Linux)

Tài liệu này dành riêng cho **Oracle Linux 10** trên Oracle Cloud, với frontend nằm trong thư mục `web` của dự án. Các lệnh phía server giả định bạn đăng nhập bằng user mặc định `opc`.

```text
Máy của bạn                    Oracle Cloud VM
┌─────────────────┐            ┌────────────────────────────┐
│ npm run build   │  SSH/SCP   │ Nginx                      │
│ web/dist        │ ─────────► │ /var/www/ccar-learning     │
└─────────────────┘            │          │                 │
                               │          ▼                 │
Người học ── HTTP/HTTPS ─────► │ index.html + assets        │
                               └────────────────────────────┘
```

Đây là web tĩnh nên production **không cần chạy `npm run dev`, Node.js hoặc PM2 trên server**. Ta build ở máy local, upload kết quả trong `dist`, rồi dùng Nginx phục vụ qua cổng 80/443.

## 1. Thông tin cần chuẩn bị

Thay các giá trị mẫu sau bằng thông tin thật của bạn:

| Giá trị mẫu | Ý nghĩa | Ví dụ |
|---|---|---|
| `<PUBLIC_IP>` | Public IPv4 của Oracle Cloud VM | `129.146.x.x` |
| `<SSH_KEY>` | Đường dẫn private key trên máy local | `C:\Keys\oracle.key` |
| `<DOMAIN>` | Tên miền, nếu có | `learn.example.com` |

Bạn cần có:

- Oracle Cloud Compute Instance đang chạy và có Public IP.
- Private SSH key tương ứng với public key đã thêm khi tạo máy.
- Node.js/npm trên máy local để build frontend.
- Tên miền là tùy chọn; chỉ bắt buộc nếu muốn HTTPS bằng chứng chỉ công cộng dễ dàng.

Sau khi SSH vào server, có thể xác nhận phiên bản Oracle Linux bằng:

```bash
cat /etc/oracle-release
```

## 2. Mở cổng mạng trên Oracle Cloud

Trên OCI Console, tìm VCN/subnet của Compute Instance và kiểm tra **Network Security Group (NSG)** hoặc **Security List** đang áp dụng cho VNIC.

Thêm các ingress rule sau. Để rule ở dạng **stateful**, tức là không chọn ô `Stateless`:

| Source CIDR | Protocol | Source port | Destination port | Stateless | Mục đích |
|---|---|---|---:|---|---|
| IP công cộng của bạn `/32` | TCP | All | 22 | Không chọn | SSH quản trị server |
| `0.0.0.0/0` | TCP | All | 80 | Không chọn | HTTP công cộng |
| `0.0.0.0/0` | TCP | All | 443 | Không chọn | HTTPS công cộng |

Ví dụ IP hiện tại của bạn là `203.0.113.10`, source cho SSH nên là `203.0.113.10/32`.

> Không nên mở cổng SSH 22 cho `0.0.0.0/0` nếu không cần thiết. Cổng 80/443 phải mở cho Internet nếu website dành cho công chúng. Nếu VM dùng IPv6, thêm rule tương ứng với source `::/0` cho 80/443.

Với Security List, đường dẫn trên OCI Console thường là:

```text
Networking → Virtual Cloud Networks → chọn VCN
→ Security Lists → chọn Security List của subnet
→ Add Ingress Rules
```

Nếu bạn dùng NSG, đi theo đường dẫn:

```text
Compute → Instances → chọn VM
→ Attached VNICs → chọn VNIC
→ Network Security Groups
→ chọn NSG đang gắn với VNIC
→ Add Security Rules
```

Ví dụ rule HTTP đầy đủ:

```text
Direction:              Ingress
Stateless:              Không chọn
Source Type:            CIDR
Source CIDR:            0.0.0.0/0
IP Protocol:            TCP
Source Port Range:      All
Destination Port Range: 80
Description:            Allow HTTP
```

Điểm thường bị nhập nhầm là **Source Port phải để `All`**, còn **Destination Port mới là `80`**. Đồng thời, rule phải nằm trong đúng NSG đang được gắn vào VNIC của VM.

Nếu chỉ muốn thử nghiệm từ máy cá nhân, có thể tạm dùng IP công cộng của máy bạn `/32` cho port 80. Khi muốn website phục vụ công khai, đổi source của port 80/443 thành `0.0.0.0/0`. Port 443 có thể mở sau, khi bắt đầu cấu hình HTTPS.

## 3. Build frontend trên máy local

Mở PowerShell tại máy Windows:

```powershell
cd E:\SourceCode\ClaudeArchitectFoundation\web
npm ci
npm run build
```

Build thành công sẽ tạo:

```text
web/dist/
├── index.html
├── assets/
└── agent-learning-hero.png
```

Kiểm tra nhanh trước khi deploy:

```powershell
npm run preview -- --host 127.0.0.1
```

Sau đó truy cập URL mà Vite hiển thị, thường là `http://127.0.0.1:4173`. Nhấn `Ctrl+C` để dừng sau khi kiểm tra.

> Website hiện được thiết kế để chạy ở gốc domain, ví dụ `https://learn.example.com/`. Không nên đặt vào subpath như `https://example.com/ccar/` nếu chưa chỉnh `base` của Vite và các đường dẫn ảnh tuyệt đối.

## 4. SSH vào Oracle Cloud VM

### 4.1. Siết quyền private key trên Windows

Windows OpenSSH sẽ từ chối private key nếu file có thể được nhiều tài khoản đọc và hiển thị lỗi:

```text
WARNING: UNPROTECTED PRIVATE KEY FILE!
Load key "...": bad permissions
```

Mở PowerShell bằng tài khoản Windows đang sử dụng rồi chạy:

```powershell
$keyPath = "D:\Download\ssh-key-2026-07-04.key"
$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

icacls $keyPath /inheritance:r
icacls $keyPath /grant:r "${currentUser}:(R)"
icacls $keyPath
```

Ý nghĩa:

- `/inheritance:r`: loại bỏ quyền được kế thừa từ thư mục cha.
- `/grant:r`: chỉ cấp lại quyền đọc cho tài khoản Windows hiện tại.
- Lệnh `icacls` cuối cùng dùng để kiểm tra quyền sau khi chỉnh.

Thay giá trị `$keyPath` bằng đường dẫn private key thật của bạn. Không dùng file public key có đuôi `.pub`.

### 4.2. Kiểm tra kết nối SSH

Thử đăng nhập trước khi upload:

```powershell
ssh -i $keyPath opc@<PUBLIC_IP>
```

Ví dụ:

```powershell
ssh -i $keyPath opc@207.211.147.64
```

Địa chỉ phải viết liền là `opc@<PUBLIC_IP>`:

```text
Sai:  opc\@207.211.147.64
Đúng: opc@207.211.147.64
```

Nếu đăng nhập thành công, chạy `exit` để quay lại PowerShell. Nếu không còn lỗi `bad permissions` nhưng vẫn nhận `Permission denied (publickey)`, hãy kiểm tra private key có đúng là key tương ứng với public key của VM hay không.

Tuyệt đối không upload, chia sẻ hoặc commit private key vào source code.

## 5. Cài Nginx và mở firewalld trên Oracle Linux

```bash
sudo dnf install -y nginx
sudo systemctl enable --now nginx.service
sudo systemctl status nginx --no-pager
```

Oracle Linux thường bật `firewalld` mặc định. Kiểm tra trạng thái và default zone:

```bash
sudo firewall-cmd --state
sudo firewall-cmd --get-active-zones
sudo firewall-cmd --get-default-zone
```

Với OCI Oracle Linux thông thường, interface mạng chính như `enp0s6` nằm trong zone `public`. Nếu kết quả là `running`, mở HTTP và HTTPS trong zone này:

```bash
sudo firewall-cmd --zone=public --permanent --add-service=http
sudo firewall-cmd --zone=public --permanent --add-service=https
sudo firewall-cmd --reload
sudo firewall-cmd --zone=public --list-services
sudo firewall-cmd --zone=public --query-service=http
```

Lệnh `query-service` cần trả về `yes`. Nếu interface mạng chính thuộc zone khác, thay `public` trong các lệnh trên bằng tên zone xuất hiện trong `get-active-zones`.

OCI ingress rule và firewall trong hệ điều hành là hai lớp khác nhau. Nếu firewall của hệ điều hành đang bật, cả hai lớp đều phải cho phép 80/443.

## 6. Tạo nơi chứa website trên server

```bash
sudo mkdir -p /var/www/ccar-learning/releases
sudo chown -R opc:opc /var/www/ccar-learning
```

Cấu trúc release giúp cập nhật và quay lại phiên bản cũ an toàn hơn:

```text
/var/www/ccar-learning/
├── current -> releases/20260821-210000
└── releases/
    ├── 20260820-180000/
    └── 20260821-210000/
```

## 7. Đóng gói và upload bản build

### 7.1. Trên máy local

Chạy tại thư mục `web` sau khi `npm run build` thành công:

```powershell
tar -czf ccar-web.tar.gz -C .\dist .
scp -i $keyPath .\ccar-web.tar.gz opc@<PUBLIC_IP>:/tmp/ccar-web.tar.gz
```

Ví dụ:

```powershell
scp -i $keyPath .\ccar-web.tar.gz opc@207.211.147.64:/tmp/ccar-web.tar.gz
```

Biến `$keyPath` phải được khai báo trong cửa sổ PowerShell hiện tại như bước 4.1. Nếu đã đóng cửa sổ đó, khai báo lại biến trước khi chạy `scp`.

### 7.2. Trên server

Quay lại phiên SSH và chạy:

```bash
DEPLOY_RELEASE="$(date +%Y%m%d-%H%M%S)"
DEPLOY_TARGET="/var/www/ccar-learning/releases/$DEPLOY_RELEASE"

mkdir -p "$DEPLOY_TARGET"
tar -xzf /tmp/ccar-web.tar.gz -C "$DEPLOY_TARGET"
find "$DEPLOY_TARGET" -type d -exec chmod 755 {} +
find "$DEPLOY_TARGET" -type f -exec chmod 644 {} +
sudo restorecon -Rv /var/www/ccar-learning
ln -sfn "$DEPLOY_TARGET" /var/www/ccar-learning/current

echo "Đã kích hoạt release: $DEPLOY_RELEASE"
```

Kiểm tra file:

```bash
ls -la /var/www/ccar-learning/current/
```

Phải thấy ít nhất `index.html` và thư mục `assets`.

## 8. Cấu hình Nginx trên Oracle Linux

Oracle Linux Minimal có thể chưa cài trình soạn thảo `nano`. Cài một lần bằng:

```bash
sudo dnf install -y nano
```

Oracle Linux nạp các site tùy chỉnh từ `/etc/nginx/conf.d/`. Sau đó tạo file:

```bash
sudo nano /etc/nginx/conf.d/ccar-learning.conf
```

Nếu không muốn cài `nano`, có thể dùng `vi` thường có sẵn:

```bash
sudo vi /etc/nginx/conf.d/ccar-learning.conf
```

Với `vi`: nhấn `i` để bắt đầu nhập, dán cấu hình, nhấn `Esc`, gõ `:wq`, rồi nhấn `Enter` để lưu và thoát.

### Nội dung cấu hình

Nếu chưa có domain, thay `<SERVER_NAME>` bằng Public IP. Nếu đã có domain, dùng domain, ví dụ `learn.example.com`.

> Chữ `nginx` nằm sau ba dấu backtick trong tài liệu chỉ là nhãn để tô màu code. Khi dùng `nano` hoặc `vi`, chỉ dán nội dung từ `server {` đến dấu `}` cuối cùng; không dán chữ `nginx` hoặc các dấu backtick vào file `.conf`.

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name <SERVER_NAME>;

    root /var/www/ccar-learning/current;
    index index.html;

    # File do Vite tạo có hash trong tên nên có thể cache lâu.
    location /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Các file tĩnh không có hash chỉ cache ngắn hạn.
    location ~* \.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$ {
        try_files $uri =404;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Giữ index.html luôn cập nhật sau mỗi lần deploy.
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    # Fallback hỗ trợ ứng dụng một trang và deep-link trong tương lai.
    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Ví dụ chưa có domain:

```nginx
server_name 129.146.x.x;
```

Ví dụ đã có domain:

```nginx
server_name learn.example.com;
```

Lưu file trong `nano`: nhấn `Ctrl+O`, `Enter`, rồi `Ctrl+X`.

Kiểm tra cấu hình trước khi áp dụng:

```bash
sudo nginx -t
```

Chỉ khi thấy thông báo `syntax is ok` và `test is successful`, mới reload:

```bash
sudo systemctl reload nginx
```

Kiểm tra ngay trên server:

```bash
curl -I http://127.0.0.1
```

Sau đó mở trên máy cá nhân:

```text
http://<PUBLIC_IP>
```

## 9. Lấy domain miễn phí bằng DuckDNS

### 9.1. Hiểu đúng về domain miễn phí

Phương án dễ dùng cho bài lab là [DuckDNS](https://www.duckdns.org/). Dịch vụ này cung cấp miễn phí một **subdomain** dạng:

```text
<TEN_BAN_CHON>.duckdns.org
```

Ví dụ:

```text
ccar-foundations-giang.duckdns.org
```

Tên ví dụ có thể đã được người khác sử dụng; bạn cần chọn một tên còn trống trên DuckDNS. Đây không phải domain riêng mà bạn sở hữu. Với website thương mại hoặc cần thương hiệu ổn định, nên mua một domain riêng.

Domain giúp người dùng không phải nhớ địa chỉ IP. Luồng truy cập sau khi cấu hình sẽ là:

```text
Người dùng nhập domain
        │
        ▼
DNS/DuckDNS đổi domain thành 207.211.147.64
        │
        ▼
OCI NSG → firewalld → Nginx → React/Vite trong /var/www
```

DuckDNS chỉ làm nhiệm vụ **domain → IP**. DuckDNS không chứa source code, không phục vụ website và không thay thế Nginx.

### 9.2. Tạo subdomain DuckDNS

1. Truy cập <https://www.duckdns.org/>.
2. Đăng nhập bằng một phương thức mà DuckDNS hỗ trợ.
3. Trong ô tạo domain, nhập phần tên mong muốn, **không nhập** `.duckdns.org`.
4. Nhấn `add domain`.
5. Tại domain vừa tạo, đặt `current ip` thành Public IP của Oracle Cloud VM, ví dụ `207.211.147.64`.
6. Nhấn `update ip` và xác nhận IP hiển thị đúng.

`current ip` phải là Public IP của **Oracle Cloud VM**, không phải IP của máy Windows đang mở DuckDNS. Nếu nhập IP máy cá nhân, domain sẽ trỏ sai nơi và Certbot không thể xác minh server.

DuckDNS hiển thị một `token` trong tài khoản. Token này có thể thay đổi bản ghi DNS của bạn, vì vậy không chia sẻ, không đưa vào Git và không chụp màn hình công khai.

### 9.3. Kiểm tra domain đã trỏ đúng IP

Từ PowerShell trên Windows:

```powershell
nslookup <TEN_BAN_CHON>.duckdns.org
```

Hoặc:

```powershell
Resolve-DnsName <TEN_BAN_CHON>.duckdns.org
```

Kết quả phải chứa Public IP của VM. DNS có thể cần vài phút để cập nhật. Không chạy Certbot cho đến khi domain trả về đúng IP.

Ví dụ kết quả đúng:

```text
Name:    ccar-foundations-giang.duckdns.org
Address: 207.211.147.64
```

Kiểm tra HTTP bằng domain:

```powershell
curl.exe -I http://<TEN_BAN_CHON>.duckdns.org
```

### 9.4. Đổi `server_name` trong Nginx

`server_name` cho Nginx biết server block nào phải xử lý request dựa trên hostname mà trình duyệt gửi lên. Certbot cũng dựa vào giá trị này để tìm đúng server block cần gắn certificate. Vì vậy, DNS đúng nhưng `server_name` vẫn là IP thì website HTTP có thể chạy, còn Certbot vẫn có thể cấp certificate nhưng không tự cài được vào Nginx.

Trên Oracle Linux:

```bash
sudo nano /etc/nginx/conf.d/ccar-learning.conf
```

Đổi dòng Public IP hiện tại:

```nginx
server_name 207.211.147.64;
```

thành domain DuckDNS của bạn:

```nginx
server_name <TEN_BAN_CHON>.duckdns.org;
```

Không để nguyên dấu `<` và `>` trong cấu hình thật. Ví dụ hoàn chỉnh:

```nginx
server_name ccar-foundations-giang.duckdns.org;
```

Kiểm tra và reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -I -H 'Host: <TEN_BAN_CHON>.duckdns.org' http://127.0.0.1
```

Sau đó mở:

```text
http://<TEN_BAN_CHON>.duckdns.org
```

Chỉ tiếp tục cài SSL khi URL HTTP này hoạt động từ Internet.

> Nếu Public IP của VM thay đổi, hãy cập nhật lại `current ip` trong DuckDNS. Với hệ thống dùng lâu dài, nên gán Reserved Public IP trong OCI hoặc cấu hình DuckDNS updater theo [API chính thức](https://www.duckdns.org/spec.jsp).

## 10. Cài SSL miễn phí với Let's Encrypt và Certbot

Let's Encrypt cấp chứng chỉ miễn phí; Certbot dùng Nginx plugin để xác minh domain qua port 80, cài chứng chỉ và cấu hình chuyển hướng sang HTTPS.

Toàn bộ quá trình gồm các bước độc lập:

```text
1. DNS đúng          Domain trỏ về Oracle VM
        ↓
2. HTTP hoạt động    Let's Encrypt truy cập port 80 để xác minh
        ↓
3. Cấp certificate   Lưu fullchain.pem và privkey.pem
        ↓
4. Cài vào Nginx     Thêm listen 443 và đường dẫn certificate
        ↓
5. Redirect          Chuyển HTTP sang HTTPS
        ↓
6. Auto-renew        Gia hạn certificate trước khi hết hạn
```

“Cấp certificate” và “cài certificate vào Nginx” là hai việc khác nhau. Vì thế có trường hợp certificate đã được cấp thành công nhưng bước cài đặt vẫn thất bại do `server_name` không khớp.

### 10.1. Mở port 443

Trong đúng OCI NSG đang gắn với VNIC, thêm rule:

```text
Direction:              Ingress
Stateless:              Không chọn
Source Type:            CIDR
Source CIDR:            0.0.0.0/0
IP Protocol:            TCP
Source Port Range:      All
Destination Port Range: 443
Description:            Allow HTTPS
```

Giữ port 80 mở vì Let's Encrypt cần truy cập HTTP để xác minh và gia hạn chứng chỉ.

- Port 80 phục vụ HTTP và ACME challenge dùng để chứng minh bạn kiểm soát domain.
- Port 443 phục vụ lưu lượng HTTPS sau khi certificate được cài.
- OCI NSG là firewall ở hạ tầng cloud; `firewalld` là firewall bên trong hệ điều hành. Cả hai lớp đều phải cho phép traffic.

Mở HTTPS trong `firewalld`:

```bash
sudo firewall-cmd --zone=public --permanent --add-service=https
sudo firewall-cmd --reload
sudo firewall-cmd --zone=public --query-service=https
```

Lệnh cuối cần trả về `yes`.

### 10.2. Cài Certbot trên Oracle Linux 10

Kiểm tra phiên bản hệ điều hành:

```bash
cat /etc/oracle-release
```

Nếu output chứa `.el10`, server đang chạy Oracle Linux 10. Không dùng package `el9` hoặc repository `ol9_developer_EPEL` vì chúng không tồn tại trên máy này.

Cài package cấu hình EPEL dành cho OL10:

```bash
sudo dnf install -y oracle-epel-release-el10 dnf-plugins-core
sudo dnf repolist --all | grep -i epel
```

Ý nghĩa các thành phần:

- `oracle-epel-release-el10`: thêm file cấu hình repository EPEL dành cho Oracle Linux 10.
- `dnf-plugins-core`: cung cấp lệnh `dnf config-manager` để bật/tắt repository.
- EPEL: kho bổ sung chứa `certbot` và `python3-certbot-nginx`, vốn không có trong repository mặc định của image này.
- `repolist --all`: hiển thị cả repository đang bật và đang tắt; chữ `disabled` nghĩa là DNF chưa được phép tìm package trong repository đó.

Oracle Linux 10 có thể hiển thị repository chuẩn `ol10_developer_EPEL` hoặc một ID gắn với update release như `ol10_u1_developer_EPEL`. Nếu repository hiển thị `disabled`, bật **đúng ID vừa được liệt kê**. Ví dụ với ID chuẩn:

```bash
sudo dnf config-manager --set-enabled ol10_developer_EPEL
```

Nếu danh sách của máy hiển thị ID khác, ví dụ `ol10_u1_developer_EPEL`, dùng chính ID đó:

```bash
sudo dnf config-manager --set-enabled ol10_u1_developer_EPEL
```

Trên server đã triển khai trong tài liệu này, output thực tế là:

```text
ol10_u1_developer_EPEL  Oracle Linux 10.1 EPEL Packages for Development  disabled
```

Do đó lệnh đúng là `--set-enabled ol10_u1_developer_EPEL`. Dấu `\_` đôi khi xuất hiện khi nội dung được định dạng trong chat; không nhập dấu `\` vào terminal.

Làm mới metadata rồi cài Certbot và Nginx plugin:

```bash
sudo dnf clean metadata
sudo dnf makecache --refresh
sudo dnf install -y certbot python3-certbot-nginx
```

- `clean metadata`: bỏ metadata repository cũ, không xóa package đã cài.
- `makecache --refresh`: tải lại danh sách package mới sau khi bật EPEL.
- `certbot`: công cụ đăng ký, cấp và gia hạn certificate.
- `python3-certbot-nginx`: plugin cho phép Certbot đọc và chỉnh cấu hình Nginx tự động.

Kiểm tra:

```bash
certbot --version
sudo nginx -t
```

### 10.3. Kiểm tra điều kiện trước khi xin chứng chỉ

Thay `<DOMAIN>` bằng domain DuckDNS thật:

```bash
curl -I http://<DOMAIN>
```

`curl -I` chỉ lấy HTTP headers nên kiểm tra nhanh mà không tải toàn bộ website. Phản hồi `HTTP/1.1 200 OK` chứng minh Nginx đang phục vụ domain qua HTTP.

Từ PowerShell:

```powershell
Resolve-DnsName <DOMAIN>
Test-NetConnection <DOMAIN> -Port 80
```

Trước khi chạy Certbot:

- DNS phải trả về đúng Public IP của VM.
- `http://<DOMAIN>` phải truy cập được từ Internet.
- Port 80 và 443 phải đi qua OCI NSG và `firewalld`.
- `server_name` trong Nginx phải đúng domain.

Mỗi kiểm tra trả lời một câu hỏi khác nhau:

| Kiểm tra | Xác nhận điều gì? |
|---|---|
| `Resolve-DnsName` | Domain có đổi thành đúng Public IP không? |
| `Test-NetConnection ... -Port 80` | Port 80 có đi qua OCI NSG và firewalld không? |
| `curl -I http://...` | Nginx có thực sự phục vụ domain không? |
| `server_name` | Certbot có tìm được đúng Nginx server block không? |

### 10.4. Sao lưu cấu hình Nginx

Certbot khuyến nghị sao lưu cấu hình trước khi để plugin chỉnh Nginx:

```bash
sudo cp --preserve=all /etc/nginx/conf.d/ccar-learning.conf /etc/nginx/conf.d/ccar-learning.conf.before-certbot
```

File backup không kết thúc bằng `.conf`, vì vậy Nginx sẽ không nạp nó như một cấu hình site thứ hai.

`--preserve=all` giữ lại quyền sở hữu, permission và timestamp. Backup này hữu ích nếu Certbot chỉnh cấu hình không như mong muốn.

### 10.5. Xin và cài chứng chỉ

Chạy với đúng một domain DuckDNS bạn đã tạo:

```bash
sudo certbot --nginx -d <DOMAIN> --redirect
```

Ví dụ:

```bash
sudo certbot --nginx -d ccar-foundations-giang.duckdns.org --redirect
```

Certbot sẽ yêu cầu:

1. Email để nhận thông báo quan trọng.
2. Đồng ý điều khoản dịch vụ của Let's Encrypt: phải chọn `Y` để tiếp tục.
3. Chia sẻ email với EFF: tùy chọn, chọn `Y` hoặc `N` đều không ảnh hưởng việc cấp certificate.

Ý nghĩa lệnh:

- `--nginx`: dùng Nginx plugin để xác minh và cài certificate.
- `-d`: domain sẽ xuất hiện trên certificate.
- `--redirect`: cấu hình HTTP tự chuyển sang HTTPS.

Không thêm `www` khi dùng DuckDNS, trừ khi bạn đã tự cấu hình và xác minh hostname đó.

Khi thành công hoàn toàn, Certbot thực hiện ba việc:

1. Đăng ký ACME account nếu đây là lần đầu.
2. Lưu certificate và private key trong `/etc/letsencrypt/live/<DOMAIN>/`.
3. Chỉnh Nginx để dùng certificate, đồng thời tạo scheduled task gia hạn nền.

Private key tại `/etc/letsencrypt/live/<DOMAIN>/privkey.pem` là bí mật của server. Không tải xuống, chia sẻ hoặc commit file này.

### 10.6. Hiểu output của Certbot

| Output | Ý nghĩa |
|---|---|
| `Account registered` | ACME account đã được tạo bằng email bạn cung cấp. |
| `Successfully received certificate` | Let's Encrypt đã xác minh domain và cấp certificate thành công. |
| `fullchain.pem` | Certificate công khai của domain kèm chuỗi chứng thực trung gian để gửi cho trình duyệt. |
| `privkey.pem` | Private key bí mật dùng để chứng minh danh tính server trong TLS handshake. |
| `This certificate expires on ...` | Ngày certificate hiện tại hết hạn; Certbot cần gia hạn trước ngày này. |
| `scheduled task ... automatically renew` | Certbot đã thiết lập tác vụ nền để kiểm tra và gia hạn định kỳ. |
| `Deploying certificate` | Certbot đang tìm Nginx server block và gắn certificate vào đó. |
| `Could not install certificate` | Certificate đã được cấp nhưng chưa gắn được vào Nginx; thường do `server_name` không khớp. |

### 10.7. Xác nhận HTTPS hoạt động

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certificates
curl -I https://<DOMAIN>
```

`certbot certificates` hiển thị domain, ngày hết hạn và đường dẫn certificate. `curl -I https://...` xác nhận Nginx đã nghe port 443 và có thể hoàn tất TLS handshake.

Từ PowerShell, xác nhận cổng HTTPS đã hoạt động:

```powershell
Test-NetConnection <DOMAIN> -Port 443
curl.exe -I https://<DOMAIN>
```

Từ trình duyệt mở:

```text
https://<DOMAIN>
```

Trình duyệt phải hiển thị biểu tượng ổ khóa và không cảnh báo chứng chỉ.

Kiểm tra thêm việc chuyển hướng HTTP:

```bash
curl -I http://<DOMAIN>
```

Nếu redirect được cài đúng, response thường là `301` hoặc `308` và có header `Location: https://<DOMAIN>/`.

### 10.8. Kiểm tra tự động gia hạn

```bash
sudo certbot renew --dry-run
systemctl list-timers --all | grep -i certbot
```

`renew --dry-run` phải hoàn tất thành công. Package có thể dùng systemd timer hoặc cron tùy phiên bản; kiểm tra thêm bằng:

```bash
sudo systemctl status certbot-renew.timer --no-pager
sudo ls -la /etc/cron.d/ | grep -i certbot
```

Nếu một trong hai lệnh kiểm tra timer/cron báo không tồn tại nhưng cơ chế còn lại có mặt thì vẫn bình thường. Không chạy `--force-renewal` thường xuyên vì có thể chạm giới hạn cấp chứng chỉ.

`renew --dry-run` dùng môi trường thử nghiệm của Let's Encrypt để mô phỏng gia hạn, không thay certificate thật. Scheduled task sẽ chạy định kỳ; Certbot chỉ gia hạn khi certificate gần hết hạn rồi để Nginx dùng certificate mới.

### 10.9. Nếu Certbot thất bại

- `NXDOMAIN`: domain DuckDNS chưa tồn tại hoặc nhập sai.
- Domain trả sai IP: cập nhật `current ip` tại DuckDNS và chờ DNS cập nhật.
- `Timeout during connect`: kiểm tra OCI NSG và `firewalld` cho port 80.
- Nginx plugin không tìm thấy domain: kiểm tra `server_name` và chạy lại `sudo nginx -t`.
- `certbot: command not found`: Certbot chưa được cài; thực hiện đầy đủ bước 10.2.
- `No match for argument: oracle-epel-release-el9`: máy là Oracle Linux 10 nhưng đang dùng sai package; đổi sang `oracle-epel-release-el10`.
- `No matching repo to modify: ol9_developer_EPEL`: đang dùng sai repository; liệt kê EPEL và bật đúng ID của OL10 như bước 10.2.
- `No match for argument: certbot`: EPEL chưa được bật hoặc metadata chưa được làm mới; kiểm tra `dnf repolist --all | grep -i epel`.
- Không nên thử xin chứng chỉ liên tục; sửa nguyên nhân rồi mới chạy lại để tránh rate limit.

#### Đã cấp certificate nhưng không cài được vào Nginx

Nếu Certbot báo:

```text
Successfully received certificate.
Could not install certificate.
Could not automatically find a matching server block for <DOMAIN>.
```

thì certificate đã được cấp và lưu trong `/etc/letsencrypt/live/<DOMAIN>/`; không xin certificate mới. Nguyên nhân là chưa có Nginx server block với `server_name` khớp chính xác domain.

Tìm các `server_name` hiện có:

```bash
sudo grep -Rni "server_name" /etc/nginx/nginx.conf /etc/nginx/conf.d/
```

Mở site config:

```bash
sudo nano /etc/nginx/conf.d/ccar-learning.conf
```

Đặt domain chính xác, không kèm `http://`, `https://` hoặc đường dẫn:

```nginx
server_name <DOMAIN>;
```

Ví dụ:

```nginx
server_name ccar-foundations-giang.duckdns.org;
```

Kiểm tra và reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Sau đó yêu cầu Certbot cài certificate đã có, không cấp lại:

```bash
sudo certbot install --cert-name <DOMAIN>
```

Ví dụ:

```bash
sudo certbot install --cert-name ccar-foundations-giang.duckdns.org
```

`certbot install` sử dụng certificate đã có trong `/etc/letsencrypt`; nó không yêu cầu Let's Encrypt cấp lại certificate, vì vậy tránh tạo request không cần thiết.

Cuối cùng kiểm tra:

```bash
sudo nginx -t
sudo certbot certificates
curl -I https://<DOMAIN>
```

Nếu HTTPS đã hoạt động nhưng HTTP chưa tự chuyển hướng, chạy lại Nginx plugin với `--redirect`:

```bash
sudo certbot --nginx -d <DOMAIN> --redirect
```

## 11. Deploy lần 2 trở đi — chỉ build và cập nhật frontend

Các thông tin thực tế đang sử dụng:

```text
Project: E:\SourceCode\ClaudeArchitectFoundation\web
SSH key: D:\Download\ssh-key-2026-07-04.key
SSH user: opc
Server IP: 207.211.147.64
Domain: ccar-foundations-giang.duckdns.org
```

Không cần chạy lại `dnf`, cấu hình NSG, Nginx, DuckDNS hoặc Certbot.

### 11.1. PowerShell trên Windows — build và upload

Mở PowerShell rồi copy toàn bộ block sau:

```powershell
cd E:\SourceCode\ClaudeArchitectFoundation\web

$keyPath = "D:\Download\ssh-key-2026-07-04.key"

npm ci
npm run build

if (-not (Test-Path -LiteralPath ".\dist\index.html")) {
    throw "Build lỗi: không tìm thấy dist\index.html"
}

if (-not (Test-Path -LiteralPath ".\dist\assets")) {
    throw "Build lỗi: không tìm thấy dist\assets"
}

tar -czf ccar-web.tar.gz -C .\dist .
scp -i $keyPath .\ccar-web.tar.gz opc@207.211.147.64:/tmp/ccar-web.tar.gz
```

Sau khi `scp` hoàn tất, vẫn trong cửa sổ PowerShell đó, chạy:

```powershell
ssh -i $keyPath opc@207.211.147.64
```

### 11.2. Oracle Linux — tạo và kích hoạt release

Sau khi đã SSH vào VM, copy toàn bộ block sau:

```bash
PREVIOUS_RELEASE="$(readlink -f /var/www/ccar-learning/current)"
DEPLOY_RELEASE="$(date +%Y%m%d-%H%M%S)"
DEPLOY_TARGET="/var/www/ccar-learning/releases/$DEPLOY_RELEASE"

mkdir -p "$DEPLOY_TARGET"
tar -xzf /tmp/ccar-web.tar.gz -C "$DEPLOY_TARGET"

test -f "$DEPLOY_TARGET/index.html" || {
  echo "Lỗi: release không có index.html"
  exit 1
}

test -d "$DEPLOY_TARGET/assets" || {
  echo "Lỗi: release không có thư mục assets"
  exit 1
}

find "$DEPLOY_TARGET" -type d -exec chmod 755 {} +
find "$DEPLOY_TARGET" -type f -exec chmod 644 {} +
sudo restorecon -Rv "$DEPLOY_TARGET"

ln -sfn "$DEPLOY_TARGET" /var/www/ccar-learning/current

echo "Release cũ: $PREVIOUS_RELEASE"
echo "Release mới: $DEPLOY_TARGET"
```

### 11.3. Oracle Linux — kiểm tra release vừa deploy

Chạy ngay sau block trên:

```bash
readlink -f /var/www/ccar-learning/current
ls -la /var/www/ccar-learning/current/

curl -I -H 'Host: ccar-foundations-giang.duckdns.org' http://127.0.0.1
curl -I https://ccar-foundations-giang.duckdns.org
curl -s https://ccar-foundations-giang.duckdns.org | grep -E 'og:title|og:image|og:description'
curl -I https://ccar-foundations-giang.duckdns.org/social-preview.png
```

Kết quả mong đợi:

```text
readlink: trỏ tới release mới
HTTP: 301/308 nếu chuyển hướng sang HTTPS
HTTPS: 200 OK
social-preview.png: 200 OK
```

Không chạy lại `sudo certbot --nginx`. Không cần reload Nginx khi chỉ cập nhật file trong `dist`.

Thoát khỏi server:

```bash
exit
```

Mở website và nhấn `Ctrl+F5`:

```text
https://ccar-foundations-giang.duckdns.org
```

Nếu cần kiểm tra link preview mới mà ứng dụng chat vẫn cache bản cũ:

```text
https://ccar-foundations-giang.duckdns.org/?preview=2
```

### 11.4. Khi nào cần chạy thêm lệnh Nginx hoặc Certbot?

| Loại thay đổi | Cần làm thêm? |
|---|---|
| React, CSS, bài học, ảnh, Open Graph metadata | Không cần reload Nginx; không chạy Certbot |
| Đổi file `/etc/nginx/conf.d/ccar-learning.conf` | Chạy `sudo nginx -t` rồi `sudo systemctl reload nginx` |
| Đổi sang domain khác | Sửa DNS, `server_name` và cấp certificate cho domain mới |
| Certificate hiện tại gần hết hạn | Scheduled task của Certbot tự xử lý; kiểm tra bằng `sudo certbot renew --dry-run` |

### 11.5. Rollback ngay trong phiên SSH hiện tại

Nếu chưa chạy `exit` và release mới có lỗi, chạy:

```bash
ln -sfn "$PREVIOUS_RELEASE" /var/www/ccar-learning/current
readlink -f /var/www/ccar-learning/current
curl -I https://ccar-foundations-giang.duckdns.org
```

Nếu đã thoát SSH và mất biến `$PREVIOUS_RELEASE`, dùng hướng dẫn tại mục 12.

## 12. Rollback khi bản mới có lỗi

Xem các release và release hiện tại:

```bash
ls -la /var/www/ccar-learning/releases
readlink -f /var/www/ccar-learning/current
```

Chọn một `<OLD_RELEASE_ID>` đã chạy tốt rồi đổi lại symlink:

```bash
ln -sfn "/var/www/ccar-learning/releases/<OLD_RELEASE_ID>" /var/www/ccar-learning/current
```

Reload trình duyệt bằng `Ctrl+F5`. Không cần reload Nginx vì cấu hình không đổi.

Không xóa release cũ cho đến khi bạn đã xác nhận phiên bản mới hoạt động ổn định.

## 13. Kiểm tra và xử lý lỗi

### Windows báo `EPERM` khi chạy `npm ci`

Ví dụ lỗi:

```text
EPERM: operation not permitted, unlink
node_modules/@rolldown/.../rolldown-binding.win32-x64-msvc.node
```

Nguyên nhân thường là Vite, Node.js, terminal dev server hoặc một tiến trình khác đang giữ file native `.node`. `npm ci` cần xóa `node_modules` trước khi cài lại nhưng Windows không cho xóa file đang được sử dụng. Sau khi `npm ci` thất bại giữa chừng, `npm run build` có thể báo `vite is not recognized` vì dependency đã bị xóa một phần.

#### Bước 1: dừng dev server

Tại mọi terminal đang chạy `npm run dev` hoặc `npm run preview`, nhấn:

```text
Ctrl+C
```

Đóng các terminal cũ của project nếu không còn sử dụng.

#### Bước 2: tìm đúng tiến trình Node đang giữ file

Trong PowerShell:

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Select-Object ProcessId, CommandLine
```

Nếu lệnh trên báo `Access denied`, dùng lệnh dự phòng sau để lấy PID, đường dẫn Node và thời điểm tiến trình được khởi động:

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue |
    Select-Object Id, ProcessName, Path, StartTime
```

Nếu có nhiều tiến trình Node và không xác định được tiến trình nào thuộc project, hãy đóng các terminal/dev server đang dùng trước. Chỉ dừng những PID vừa được project khởi động; không dừng dịch vụ Node của ứng dụng khác.

Chỉ dừng PID có `CommandLine` trỏ đến project `ClaudeArchitectFoundation\web`:

```powershell
Stop-Process -Id <PID_CUA_PROJECT> -Force
```

Ví dụ PID là `12345`:

```powershell
Stop-Process -Id 12345 -Force
```

Không chạy lệnh kill toàn bộ `node.exe` nếu máy đang có project hoặc dịch vụ Node khác.

#### Bước 3: xóa `node_modules` bị cài dở

Đoạn dưới xác minh đúng project path trước khi xóa thư mục:

```powershell
cd E:\SourceCode\ClaudeArchitectFoundation\web

$webProjectPath = (Resolve-Path -LiteralPath ".").Path
$expectedWebPath = "E:\SourceCode\ClaudeArchitectFoundation\web"

if ($webProjectPath -ne $expectedWebPath) {
    throw "Đang đứng sai thư mục: $webProjectPath"
}

$nodeModulesPath = Join-Path $webProjectPath "node_modules"

if (Test-Path -LiteralPath $nodeModulesPath) {
    Remove-Item -LiteralPath $nodeModulesPath -Recurse -Force
}
```

Lệnh chỉ xóa `web/node_modules`, không xóa source code hoặc `package-lock.json`.

#### Bước 4: cài sạch và build lại

```powershell
npm cache verify
npm ci
npm run build
```

Chỉ tiếp tục đóng gói/deploy khi `npm ci` và `npm run build` đều kết thúc thành công.

Nếu `Remove-Item` vẫn báo `EPERM`, file vẫn đang bị khóa. Khởi động lại Windows, chưa mở Vite/dev server, rồi thực hiện lại bước 3 và bước 4. Không cần tắt antivirus hoặc chạy PowerShell bằng Administrator trong trường hợp thông thường.

### SCP/SSH báo `port 22: Connection timed out`

Ví dụ:

```text
ssh: connect to host <PUBLIC_IP> port 22: Connection timed out
lost connection
```

Lỗi này xảy ra trước bước xác thực SSH key: máy Windows chưa kết nối được đến cổng 22 của VM. Vì vậy, chưa cần đổi private key. Nếu NSG chỉ cho phép IP cá nhân truy cập SSH, nguyên nhân thường gặp nhất là public IP của mạng nhà đã thay đổi.

#### Bước 1: kiểm tra cổng 22 từ Windows

```powershell
Test-NetConnection <PUBLIC_IP> -Port 22
```

Nếu `TcpTestSucceeded` là `False`, tiếp tục các bước dưới đây.

#### Bước 2: lấy public IP hiện tại của máy cá nhân

```powershell
$myPublicIp = (Invoke-RestMethod -Uri "https://api.ipify.org").Trim()
$myPublicIp
```

Giá trị này là IP nguồn mà OCI nhìn thấy. Nó không phải địa chỉ nội bộ dạng `192.168.x.x`.

#### Bước 3: cập nhật ingress SSH trong OCI NSG

Trong OCI Console, mở NSG đang gắn với VNIC của VM và thêm hoặc sửa rule:

```text
Direction:              Ingress
Stateless:              Không chọn
Source Type:            CIDR
Source CIDR:            <PUBLIC_IP_MAY_CA_NHAN>/32
IP Protocol:            TCP
Source Port Range:      All
Destination Port Range: 22
Description:            Allow SSH from my current public IP
```

Ví dụ public IP máy cá nhân là `203.0.113.25` thì nhập `203.0.113.25/32`. Hậu tố `/32` nghĩa là chỉ cho phép đúng một địa chỉ IP, an toàn hơn `0.0.0.0/0`. Không thay rule HTTP/HTTPS: port 80 và 443 vẫn cần mở công khai để người học truy cập website.

Xác nhận NSG này thực sự được gắn vào VNIC của Compute Instance. Nếu hệ thống dùng Security List thay cho NSG, thêm cùng rule vào Security List của subnet.

#### Bước 4: xác nhận địa chỉ VM và thử lại

Trong trang chi tiết Compute Instance, xác nhận:

- Instance đang ở trạng thái `Running`.
- Public IPv4 của VM vẫn là địa chỉ đang dùng trong lệnh `scp`.

Sau khi lưu rule, kiểm tra:

```powershell
Test-NetConnection <PUBLIC_IP> -Port 22
```

Khi kết quả là `TcpTestSucceeded : True`, gửi file lại:

```powershell
scp -i $keyPath .\ccar-web.tar.gz opc@<PUBLIC_IP>:/tmp/ccar-web.tar.gz
```

Nếu public IP máy cá nhân đúng, NSG/Security List đúng và cổng 22 vẫn timeout, kiểm tra `firewalld` và dịch vụ `sshd` bằng OCI Console Connection/Serial Console:

```bash
sudo systemctl is-active sshd
sudo ss -ltnp | grep ':22'
sudo firewall-cmd --zone=public --query-service=ssh
```

Kết quả mong đợi lần lượt là `active`, có dòng lắng nghe cổng 22 và `yes`.

### Website không truy cập được từ Internet

Kiểm tra theo đúng thứ tự từng lớp sau:

```text
Trình duyệt → OCI NSG/Security List → firewalld → Nginx → file frontend
```

#### Bước 1: Nginx và frontend trên server

Chạy trên server, thay `<PUBLIC_IP>` bằng IP thật:

```bash
sudo systemctl is-active nginx
sudo nginx -t
sudo ss -ltnp | grep ':80'
curl -I -H 'Host: <PUBLIC_IP>' http://127.0.0.1
```

Kết quả tốt cần có `active`, dòng `LISTEN` tại `0.0.0.0:80` và phản hồi `HTTP/1.1 200 OK`. Nếu ba kiểm tra này thành công thì Nginx, cấu hình và frontend đều hoạt động; không cần sửa Nginx nữa.

#### Bước 2: firewalld trên Oracle Linux

```bash
sudo firewall-cmd --state
sudo firewall-cmd --get-active-zones
sudo firewall-cmd --zone=public --query-service=http
sudo firewall-cmd --zone=public --list-services
```

`firewalld` cần trả về `running`, interface mạng chính cần thuộc zone đang kiểm tra và `query-service=http` cần trả về `yes`.

#### Bước 3: kiểm tra từ máy Windows

```powershell
Test-NetConnection <PUBLIC_IP> -Port 80
curl.exe -I http://<PUBLIC_IP>
```

- Nếu `TcpTestSucceeded : True`: đường mạng đã thông; mở `http://<PUBLIC_IP>` trong trình duyệt.
- Nếu server trả HTTP 200 nhưng `TcpTestSucceeded : False`: kiểm tra OCI NSG/Security List, đặc biệt là ingress TCP destination port 80 và NSG có thực sự gắn vào VNIC hay không.
- Hãy dùng `http://`, chưa dùng `https://` trước khi hoàn tất chứng chỉ và cấu hình port 443.
- Nếu dùng domain: kiểm tra `nslookup <DOMAIN>` có trả đúng Public IP không.

### Lỗi 403 Forbidden

Kiểm tra Nginx có quyền đọc đường dẫn và file:

```bash
namei -l /var/www/ccar-learning/current/index.html
ls -la /var/www/ccar-learning/current/
```

Các thư mục cần quyền đọc/traverse cho Nginx; bước upload ở trên đã đặt thư mục `755` và file `644`.

Oracle Linux bật SELinux mặc định. Nếu quyền Unix đã đúng nhưng vẫn bị 403, kiểm tra và khôi phục SELinux context:

```bash
getenforce
ls -lZ /var/www/ccar-learning/current/index.html
sudo restorecon -Rv /var/www/ccar-learning
sudo systemctl reload nginx
```

Không nên tắt SELinux để xử lý lỗi này.

### Lỗi 404 hoặc trang trắng

```bash
ls -la /var/www/ccar-learning/current/
ls -la /var/www/ccar-learning/current/assets/
sudo tail -n 100 /var/log/nginx/error.log
```

Mở Developer Tools của trình duyệt → tab Network/Console để xem file nào bị 404. Đảm bảo bạn đã upload **nội dung bên trong `dist`**, để `index.html` nằm trực tiếp tại `/var/www/ccar-learning/current/index.html`.

### Cấu hình Nginx lỗi sau khi sửa

Không reload khi `sudo nginx -t` chưa thành công. Xem log:

```bash
sudo journalctl -u nginx -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

### HTTPS không cấp được chứng chỉ

Kiểm tra lần lượt:

- Domain đã trỏ đúng Public IP.
- Website HTTP trên cổng 80 truy cập được từ Internet.
- OCI đã mở cả cổng 80 và 443.
- Firewall trong server đã mở HTTP/HTTPS.
- `server_name` trùng chính xác domain xin chứng chỉ.

## 14. Checklist hoàn tất

- [ ] `npm run build` chạy thành công ở local.
- [ ] `dist/index.html` và `dist/assets` tồn tại.
- [ ] OCI cho phép TCP 80/443; TCP 22 chỉ giới hạn cho IP quản trị.
- [ ] Firewall hệ điều hành cho phép HTTP/HTTPS nếu đang bật.
- [ ] Nginx đang ở trạng thái `active (running)`.
- [ ] `sudo nginx -t` thành công.
- [ ] `current` trỏ đến đúng release.
- [ ] Truy cập được bằng Public IP hoặc domain.
- [ ] Domain DuckDNS phân giải về đúng Public IP của VM.
- [ ] `server_name` của Nginx khớp chính xác domain.
- [ ] HTTPS hoạt động và `certbot renew --dry-run` thành công nếu dùng domain.
- [ ] Nội dung, hình ảnh, menu bài học và chức năng chuyển ngôn ngữ hoạt động bình thường.

## 15. Lưu ý bảo mật và vận hành

- Không chạy Vite development server (`npm run dev`) ra Internet.
- Không mở cổng 5173 trên OCI.
- Không đưa SSH private key vào repository hoặc gửi cho người khác.
- Giới hạn cổng SSH 22 theo IP quản trị nếu có thể.
- Cập nhật hệ điều hành và Nginx định kỳ.
- Giữ lại ít nhất một release cũ đã chạy tốt để rollback.
- Nếu website quan trọng, nên dùng Reserved Public IP của OCI để tránh IP thay đổi khi hạ tầng được tạo lại.

## Tài liệu chính thức tham khảo

- Oracle Cloud — kết nối SSH vào Linux instance: <https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/connect-to-linux-instance.htm>
- Oracle Cloud — cấu hình Security List/ingress: <https://docs.oracle.com/en-us/iaas/Content/Security/Reference/configuration_tasks.htm>
- Oracle Cloud — ví dụ mở cổng HTTP/HTTPS: <https://docs.oracle.com/en/learn/publish-webserver-using-oci/index.html>
- Oracle Linux — cài Nginx và cấu hình firewalld: <https://docs.oracle.com/en/learn/ol-nginx/index.html>
- Oracle Linux — danh sách repository, gồm `ol10_developer_EPEL`: <https://docs.oracle.com/en/operating-systems/oracle-linux/software-management/sfw-mgmt-AvailableYumRepositories.html>
- Oracle Linux Yum Server — package `oracle-epel-release-el10`: <https://yum.oracle.com/repo/OracleLinux/OL10/baseos/latest/x86_64/>
- Fedora Packages — Certbot Nginx plugin cho EPEL 10: <https://packages.fedoraproject.org/pkgs/certbot/python3-certbot-nginx/>
- Nginx — phục vụ nội dung tĩnh: <https://nginx.org/en/docs/beginners_guide.html>
- Nginx — chỉ thị `try_files`: <https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files>
- DuckDNS — dịch vụ Dynamic DNS miễn phí: <https://www.duckdns.org/>
- DuckDNS — API cập nhật IP chính thức: <https://www.duckdns.org/spec.jsp>
- Certbot — cài đặt và cấu hình HTTPS cho Nginx: <https://certbot.eff.org/instructions>
- Certbot — tài liệu Nginx plugin và sao lưu cấu hình: <https://github.com/certbot/certbot/blob/main/certbot/docs/using.rst>
