# Deploy SummarizeKnowledgeWeb lên Oracle Cloud VM bằng Docker

> Cập nhật và kiểm thử: **28/08/2026**  
> Hệ điều hành áp dụng: **Ubuntu 24.04 LTS 64-bit trên Oracle Cloud Infrastructure (OCI)**  
> Thư mục dự án local: **E:\SourceCode\SummarizeKnowledgeWeb**

Tài liệu này dựa trên bố cục và các nguyên tắc an toàn của
<code>ClaudeArchitectFoundation\guide_deploy.md</code>. File tham chiếu thực tế
nằm ngay dưới <code>ClaudeArchitectFoundation</code>, không nằm trong thư mục
<code>guide\</code>.

Các lệnh bên dưới được viết để copy/paste theo đúng terminal ghi ở đầu mỗi khối.
Dockerfile, Nginx, Compose và Caddyfile đi kèm đã được build và smoke-test thật.
Không tài liệu nào có thể bảo đảm dịch vụ bên ngoài luôn sẵn sàng: OCI có thể hết
capacity, DNS cần thời gian cập nhật, hoặc Docker Hub có thể tạm gián đoạn. Mỗi
giai đoạn vì vậy có checkpoint để dừng đúng chỗ nếu hạ tầng bên ngoài gặp lỗi.

## 1. Kiến trúc triển khai

~~~text
Máy Windows local
  ├─ đồng bộ 10 folder kiến thức nguồn
  ├─ npm ci
  ├─ npm run check
  ├─ tạo dist đã kiểm thử
  └─ đóng gói dist + cấu hình Docker
                 │
                 │ SCP qua SSH
                 ▼
Oracle Cloud VM - Ubuntu 24.04
  └─ Docker Compose
      ├─ gateway: Caddy, public TCP 80/443
      │    └─ tự cấp/gia hạn HTTPS khi có domain
      └─ web: Nginx rootless, chỉ ở mạng Docker :8080
           └─ React SPA + toàn bộ Markdown production
~~~

Lý do build React ở local:

- Lifecycle <code>npm run build</code> tự gọi script đồng bộ và kiểm tra Markdown.
- Các script đó đọc 10 folder kiến thức nằm ngang cấp
  <code>SummarizeKnowledgeWeb</code>.
- VM chỉ nhận bundle deploy nên không có các folder nguồn ngang cấp.
- Docker image là image runtime-only: nó nhận <code>dist</code> đã build và kiểm
  tra ở đúng workspace local.

Thiết kế này tránh lỗi “không tìm thấy source folder” trên VM, giảm lượng dữ liệu
upload và vẫn build image đúng kiến trúc CPU của VM, dù VM là AMD64 hay ARM64.

## 2. File deploy đã có sẵn

| File | Vai trò |
|---|---|
| <code>Dockerfile</code> | Tạo image Nginx chỉ chứa production bundle |
| <code>.dockerignore</code> | Chỉ đưa <code>dist</code> và Nginx config vào build context |
| <code>compose.yaml</code> | Chạy web + gateway, healthcheck, restart và log rotation |
| <code>deploy/nginx.conf</code> | SPA fallback, cache, gzip, healthcheck và security headers |
| <code>deploy/caddy/Caddyfile</code> | Reverse proxy và automatic HTTPS |

Không sửa các file trên VM nếu chưa sửa cùng nội dung ở local. Lần deploy sau sẽ
ghi đè thay đổi chỉ tồn tại trên VM.

## 3. Cảnh báo dữ liệu trước khi public

Website cố ý xuất bản toàn bộ Markdown dưới
<code>dist/knowledge-sources</code>. Bất kỳ ai truy cập website cũng có thể tải
các file này.

Trước khi mở port 80/443, cần bảo đảm Markdown không chứa:

- API key, token, private key hoặc mật khẩu;
- địa chỉ nội bộ, thông tin khách hàng hoặc dữ liệu cá nhân;
- source code hay tài liệu mà bạn không có quyền công khai.

## 4. Tạo VM trên Oracle Cloud

### 4.1 Cấu hình khuyến nghị

Trong OCI Console, chọn **Compute → Instances → Create instance**:

| Thuộc tính | Giá trị |
|---|---|
| Image | Canonical Ubuntu 24.04 LTS, bản thường |
| Shape | VM.Standard.A1.Flex hoặc một shape AMD64 phù hợp |
| Subnet | Public subnet |
| Public IPv4 | Bật |
| SSH key | Upload public key hoặc lưu private key OCI tạo |
| Boot volume | Giữ mặc định 50 GB; không đặt thấp hơn minimum OCI yêu cầu |

Không dùng Minimal Ubuntu trên Ampere A1 cho luồng này. Nếu dùng domain lâu dài,
nên gán **Reserved Public IP** để địa chỉ không phụ thuộc vòng đời VM.

Guide chủ động chọn Ubuntu 24.04 vì Docker Engine có hướng dẫn cài đặt chính thức
cho Ubuntu trên cả AMD64 và ARM64. Nếu VM hiện tại là Oracle Linux 10, hãy tạo lại
VM Ubuntu 24.04 để chạy nguyên văn guide. Không chạy lệnh <code>apt-get</code> trên
Oracle Linux.

### 4.2 Kiểm tra đường ra Internet

Public subnet phải có đủ:

1. VCN có Internet Gateway và gateway đang enabled.
2. Route table của subnet có rule
   <code>0.0.0.0/0 → Internet Gateway</code>.
3. VM có public IPv4.
4. Egress cho phép VM truy cập Internet để chạy APT, pull image và lấy TLS
   certificate.

### 4.3 Tạo Network Security Group

Nên dùng NSG và nhớ gắn NSG vào **Primary VNIC** của VM. NSG mới tạo là rỗng;
chỉ tạo rules mà quên gắn VNIC thì rules không có tác dụng.

Tạo các ingress rule stateful:

| Source | Protocol | Source port | Destination port | Mục đích |
|---|---|---|---|---|
| IP public của máy bạn + <code>/32</code> | TCP | All | 22 | SSH quản trị |
| <code>0.0.0.0/0</code> | TCP | All | 80 | HTTP và ACME challenge |
| <code>0.0.0.0/0</code> | TCP | All | 443 | HTTPS; chỉ thêm trước khi làm mục 9 |

Không mở 3000, 5173 hoặc 8080. Port 8080 chỉ tồn tại trong mạng Docker.

OCI cộng quyền từ mọi Security List của subnet và mọi NSG gắn vào VNIC; NSG không
có deny rule. Vì vậy rule SSH <code>/32</code> không thể ghi đè một rule
<code>0.0.0.0/0:22</code> rộng hơn. Hãy kiểm tra tất cả Security List/NSG đang áp
dụng và xóa hoặc thu hẹp mọi rule TCP 22 public thành IP quản trị
<code>/32</code>.

Nếu phải tự tạo egress rule cho NSG, dùng:

| Thuộc tính | Giá trị |
|---|---|
| Direction | Egress |
| Stateful | Yes |
| Destination type | CIDR |
| Destination | <code>0.0.0.0/0</code> |
| IP Protocol | All Protocols |

Default Security List thường đã có allow-all egress và OCI sẽ cộng các rule. Nếu
dùng IPv6, cần rules IPv6 riêng; guide này chỉ dùng IPv4.

### 4.4 Không bật UFW trên OCI Ubuntu

Không chạy <code>sudo ufw enable</code>. Oracle cảnh báo UFW có thể làm hỏng các
essential firewall rules của platform image; Docker cũng cảnh báo published port
có thể đi vòng qua rules UFW. Guide dùng OCI NSG làm lớp ingress và giữ nguyên
iptables do OCI/Docker quản lý.

## 5. Build và kiểm tra ở Windows local

Mở **PowerShell**, không dùng cửa sổ SSH cho phần này.

### 5.1 Kiểm tra tool và Node.js

~~~powershell
$ErrorActionPreference = "Stop"
$projectPath = "E:\SourceCode\SummarizeKnowledgeWeb"
Set-Location -LiteralPath $projectPath

$requiredCommands = @("node", "npm", "tar", "ssh", "ssh-keygen", "scp")
foreach ($commandName in $requiredCommands) {
    Get-Command $commandName -ErrorAction Stop | Out-Null
}

$nodeVersionText = (node --version).TrimStart("v")
if ($LASTEXITCODE -ne 0) {
    throw "Không đọc được phiên bản Node.js."
}

$nodeParts = $nodeVersionText.Split(".")
$nodeMajor = [int]$nodeParts[0]
$nodeMinor = [int]$nodeParts[1]
$supportedNode = (
    ($nodeMajor -eq 20 -and $nodeMinor -ge 19) -or
    ($nodeMajor -eq 22 -and $nodeMinor -ge 13) -or
    ($nodeMajor -ge 24)
)

if (-not $supportedNode) {
    throw "Node.js $nodeVersionText không khớp package.json. Hãy dùng Node 20.19+, 22.13+ hoặc 24+."
}

Write-Host "Node.js hợp lệ: $nodeVersionText"
~~~

Giải thích:

| Dòng/lệnh | Ý nghĩa |
|---|---|
| <code>$ErrorActionPreference = "Stop"</code> | Dừng PowerShell khi cmdlet phát sinh lỗi |
| <code>Set-Location</code> | Chuyển đúng vào project |
| <code>Get-Command</code> | Kiểm tra executable bắt buộc trước khi bắt đầu |
| <code>node --version</code> | Đọc phiên bản Node đang dùng |
| Khối <code>$supportedNode</code> | Áp dụng chính xác trường engines trong package.json |
| <code>throw</code> | Dừng ngay, không để bước sau chạy trên môi trường sai |

### 5.2 Đồng bộ kiến thức, test và build

~~~powershell
npm ci
if ($LASTEXITCODE -ne 0) {
    throw "npm ci thất bại."
}

npm run check
if ($LASTEXITCODE -ne 0) {
    throw "Lint, test, content validation hoặc production build thất bại."
}
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>npm ci</code> | Cài đúng dependency đã khóa trong package-lock.json |
| Kiểm tra <code>$LASTEXITCODE</code> | Native command không luôn tuân theo ErrorActionPreference |
| <code>npm run check</code> | Chạy lint, test, đồng bộ/validate Markdown và production build |

Không dùng <code>npm install</code> cho deploy vì lệnh đó có thể cập nhật lockfile.

### 5.3 Kiểm tra bundle không thiếu Markdown

~~~powershell
$requiredPaths = @(
    "dist\index.html",
    "dist\assets",
    "dist\knowledge-sources",
    "Dockerfile",
    "compose.yaml",
    "deploy\nginx.conf",
    "deploy\caddy\Caddyfile"
)

foreach ($requiredPath in $requiredPaths) {
    if (-not (Test-Path -LiteralPath $requiredPath)) {
        throw "Thiếu file hoặc folder bắt buộc: $requiredPath"
    }
}

$publicMarkdownCount = @(
    Get-ChildItem -LiteralPath "public\knowledge-sources" -Filter "*.md" -File -Recurse
).Count

$distMarkdownCount = @(
    Get-ChildItem -LiteralPath "dist\knowledge-sources" -Filter "*.md" -File -Recurse
).Count

if ($publicMarkdownCount -le 0) {
    throw "Không có Markdown đã đồng bộ trong public\knowledge-sources."
}

if ($distMarkdownCount -ne $publicMarkdownCount) {
    throw "dist có $distMarkdownCount Markdown nhưng public có $publicMarkdownCount."
}

$distBytes = (
    Get-ChildItem -LiteralPath "dist" -File -Recurse |
    Measure-Object -Property Length -Sum
).Sum

Write-Host "PASS: $distMarkdownCount Markdown, dist = $distBytes bytes."
~~~

| Dòng/lệnh | Ý nghĩa |
|---|---|
| <code>$requiredPaths</code> | Danh sách artifact bắt buộc cho image và Compose |
| <code>Test-Path</code> | Dừng trước khi đóng gói nếu thiếu artifact |
| Hai lệnh <code>Get-ChildItem</code> | Đếm Markdown ở đầu vào đã sync và đầu ra production |
| So sánh hai count | Bắt lỗi build quên copy source Markdown |
| <code>Measure-Object</code> | Cho biết kích thước thật sẽ upload |

Ở trạng thái hiện tại kết quả phải có **376 Markdown**. Khi thêm kiến thức mới,
con số có thể tăng; điều kiện quan trọng là count ở <code>public</code> và
<code>dist</code> bằng nhau.

## 6. Đóng gói và upload lên VM

### 6.1 Tạo deploy bundle

Tiếp tục trong **PowerShell local**:

~~~powershell
$bundlePath = Join-Path $env:TEMP "summarize-knowledge-web.tar.gz"

if (Test-Path -LiteralPath $bundlePath) {
    Remove-Item -LiteralPath $bundlePath -Force
}

tar -czf $bundlePath Dockerfile .dockerignore compose.yaml deploy dist
if ($LASTEXITCODE -ne 0) {
    throw "Không tạo được deploy bundle."
}

if (-not (Test-Path -LiteralPath $bundlePath)) {
    throw "tar báo thành công nhưng bundle không tồn tại."
}

Write-Host "Bundle: $bundlePath"
Get-Item -LiteralPath $bundlePath | Select-Object FullName, Length, LastWriteTime
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>Join-Path $env:TEMP</code> | Tạo archive trong thư mục tạm của Windows |
| <code>Remove-Item</code> | Chỉ xóa đúng archive tạm cũ, không đụng source |
| <code>tar -czf</code> | Nén đúng thành phần deploy; không gửi node_modules |
| <code>Get-Item</code> | Xác nhận bundle tồn tại và xem kích thước |

### 6.2 Khai báo key và IP một lần

~~~powershell
$keyPath = (Read-Host "Nhập đường dẫn private key OCI, không phải file .pub").Trim('"')
$vmIp = (Read-Host "Nhập public IPv4 của VM").Trim()
$sshUser = "ubuntu"

if (-not (Test-Path -LiteralPath $keyPath -PathType Leaf)) {
    throw "Không tìm thấy private key: $keyPath"
}

if ([IO.Path]::GetExtension($keyPath) -eq ".pub") {
    throw "Bạn đang chọn public key. SSH cần private key."
}

$parsedIp = $null
if (
    -not [Net.IPAddress]::TryParse($vmIp, [ref]$parsedIp) -or
    $parsedIp.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork
) {
    throw "Public IPv4 không hợp lệ: $vmIp"
}

ssh-keygen -y -f $keyPath | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Private key không đọc được. Hãy kiểm tra định dạng/quyền ACL theo block kế tiếp rồi chạy lại mục này."
}
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>Read-Host</code> | Tránh để placeholder bị chạy nhầm |
| <code>Test-Path</code> | Xác nhận key tồn tại |
| Kiểm tra <code>.pub</code> | Ngăn dùng nhầm public key |
| <code>IPAddress.TryParse</code> | Bắt lỗi IP trước khi chờ SSH timeout |
| <code>ssh-keygen -y</code> | Xác nhận private key OpenSSH hợp lệ |

Nếu OpenSSH báo private key có quyền quá rộng, chạy:

~~~powershell
$currentWindowsUser = [Security.Principal.WindowsIdentity]::GetCurrent().Name
icacls $keyPath /inheritance:r
if ($LASTEXITCODE -ne 0) { throw "Không bỏ được ACL kế thừa." }

icacls $keyPath /grant:r ($currentWindowsUser + ":(R)")
if ($LASTEXITCODE -ne 0) { throw "Không cấp được quyền đọc private key." }
~~~

Hai lệnh lần lượt bỏ quyền kế thừa và chỉ cấp quyền đọc cho tài khoản Windows hiện
tại. Chỉ chạy khi key thuộc quyền sở hữu của bạn.

### 6.3 Test SSH rồi upload

~~~powershell
ssh -o IdentitiesOnly=yes -i $keyPath "$sshUser@$vmIp" "printf 'SSH_OK\n'; uname -m"
if ($LASTEXITCODE -ne 0) {
    throw "SSH chưa hoạt động. Không upload."
}

$remoteBundlePath = "$sshUser@$vmIp" + ":/tmp/summarize-knowledge-web.tar.gz"
scp -o IdentitiesOnly=yes -i $keyPath $bundlePath $remoteBundlePath
if ($LASTEXITCODE -ne 0) {
    throw "Upload deploy bundle thất bại."
}
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>IdentitiesOnly=yes</code> | Ép SSH dùng đúng key đã chỉ định |
| <code>printf SSH_OK</code> | Xác nhận đăng nhập và command execution |
| <code>uname -m</code> | Hiện aarch64 trên Ampere hoặc x86_64 trên AMD |
| <code>$remoteBundlePath</code> | Ghép remote path mà không làm PowerShell hiểu sai dấu hai chấm |
| <code>scp</code> | Upload archive vào file tạm cố định trên VM |

Ở lần kết nối đầu, OpenSSH sẽ hỏi xác nhận host fingerprint. Đối chiếu fingerprint
với thông tin VM rồi nhập <code>yes</code>; không chấp nhận nếu IP/fingerprint
không đúng VM vừa tạo.

## 7. Cài Docker Engine trên VM

Đăng nhập VM từ **PowerShell local**:

~~~powershell
ssh -o IdentitiesOnly=yes -i $keyPath "$sshUser@$vmIp"
~~~

Từ đây đến khi ghi khác, mọi lệnh chạy trong **Bash trên VM**.

### 7.1 Xác nhận đúng hệ điều hành

~~~bash
set -Eeuo pipefail
. /etc/os-release

printf 'OS=%s VERSION=%s CODENAME=%s\n' "$ID" "$VERSION_ID" "$VERSION_CODENAME"
printf 'KERNEL_ARCH=%s DEB_ARCH=%s\n' "$(uname -m)" "$(dpkg --print-architecture)"

if [ "$ID" != "ubuntu" ] || [ "$VERSION_ID" != "24.04" ]; then
    echo "Guide này chỉ áp dụng nguyên văn cho Ubuntu 24.04 LTS." >&2
    exit 1
fi

df -h /
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>set -Eeuo pipefail</code> | Dừng khi command lỗi, biến thiếu hoặc pipeline lỗi |
| <code>. /etc/os-release</code> | Nạp metadata hệ điều hành |
| Hai lệnh <code>printf</code> | Hiện OS và kiến trúc để chẩn đoán |
| Khối <code>if</code> | Không cho lệnh Ubuntu chạy nhầm trên Oracle Linux |
| <code>df -h /</code> | Kiểm tra dung lượng boot volume |

### 7.2 Cập nhật bảo mật hệ điều hành

~~~bash
sudo apt-get update
sudo apt-get upgrade -y

if [ -f /var/run/reboot-required ]; then
    echo "Kernel hoặc package hệ thống yêu cầu reboot. Hãy SSH lại rồi tiếp tục mục 7.3."
    sudo reboot
fi
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>apt-get update</code> | Làm mới package index Ubuntu |
| <code>apt-get upgrade -y</code> | Cài security/bug-fix update hiện có |
| <code>reboot-required</code> | Chỉ reboot khi package hệ thống yêu cầu |
| <code>sudo reboot</code> | SSH sẽ ngắt; chờ VM lên rồi đăng nhập lại |

Sau khi SSH lại, chạy lại mục 7.1 để xác nhận OS rồi tiếp tục.

### 7.3 Cài Docker từ repository chính thức

~~~bash
for package_name in docker.io docker-doc docker-compose docker-compose-v2 docker-buildx podman-docker containerd runc; do
    if dpkg -s "$package_name" >/dev/null 2>&1; then
        sudo apt-get remove -y "$package_name"
    fi
done

sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

DOCKER_CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")
DOCKER_ARCH=$(dpkg --print-architecture)

sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $DOCKER_CODENAME
Components: stable
Architectures: $DOCKER_ARCH
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
~~~

| Lệnh | Ý nghĩa |
|---|---|
| Vòng <code>for</code> | Chỉ gỡ package xung đột nếu package thực sự đang cài |
| <code>apt-get update</code> | Làm mới package index |
| <code>ca-certificates curl</code> | Cho phép tải repository key qua HTTPS |
| <code>install -m 0755 -d</code> | Tạo keyring directory với quyền chuẩn |
| <code>curl -fsSL</code> | Tải Docker signing key và fail nếu network lỗi |
| <code>chmod a+r</code> | Cho APT đọc signing key |
| <code>DOCKER_CODENAME</code> | Lấy codename Noble từ OS |
| <code>DOCKER_ARCH</code> | Tự chọn amd64 hoặc arm64 |
| Khối <code>tee</code> | Tạo repository theo định dạng deb822 |
| <code>docker-ce...</code> | Cài Engine, CLI, containerd, Buildx và Compose v2 |
| <code>systemctl enable --now</code> | Start Docker và enable sau reboot |

Guide giữ <code>sudo docker</code> thay vì thêm user vào group <code>docker</code>,
vì membership của group này tương đương quyền root.

### 7.4 Kiểm tra cài đặt

~~~bash
sudo docker version
sudo docker compose version
sudo docker run --rm hello-world

test "$(sudo systemctl is-active docker)" = "active"
test "$(sudo systemctl is-enabled docker)" = "enabled"

echo "DOCKER_OK"
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>docker version</code> | Kiểm tra cả client và daemon |
| <code>docker compose version</code> | Xác nhận Compose v2 |
| <code>hello-world</code> | Test DNS, pull image, create và run container |
| Hai lệnh <code>systemctl</code> | Docker phải active và enabled |
| <code>--rm</code> | Tự xóa test container |

## 8. Deploy lần đầu bằng Docker Compose

### 8.1 Kiểm tra bundle và port

~~~bash
set -Eeuo pipefail

BUNDLE_PATH="/tmp/summarize-knowledge-web.tar.gz"
test -s "$BUNDLE_PATH"
tar -tzf "$BUNDLE_PATH" >/dev/null

if sudo ss -H -ltnp | awk '$4 ~ /:(80|443)$/ { found=1 } END { exit !found }'; then
    echo "Port 80 hoặc 443 đang bị process khác sử dụng:" >&2
    sudo ss -ltnp | awk 'NR == 1 || $4 ~ /:(80|443)$/'
    exit 1
fi

echo "BUNDLE_AND_PORTS_OK"
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>test -s</code> | File phải tồn tại và không rỗng |
| <code>tar -tzf</code> | Kiểm tra archive trước khi extract |
| <code>ss</code> + <code>awk</code> | Dừng nếu process khác chiếm 80/443 |
| <code>-H -ltnp</code> | Chỉ xem TCP listener, không in header |

Nếu port đang bận, xác định rõ service rồi dừng service đó. Không kill PID tùy ý.

### 8.2 Tạo release bất biến

~~~bash
set -Eeuo pipefail

APP_ROOT="$HOME/apps/summarize-knowledge-web"
BUNDLE_PATH="/tmp/summarize-knowledge-web.tar.gz"
RELEASE_TAG=$(date -u +%Y%m%dT%H%M%SZ)
RELEASE_DIR="$APP_ROOT/releases/$RELEASE_TAG"

test -s "$BUNDLE_PATH"

if [ -e "$RELEASE_DIR" ]; then
    echo "Release đã tồn tại: $RELEASE_DIR" >&2
    exit 1
fi

mkdir -p "$RELEASE_DIR"
tar -xzf "$BUNDLE_PATH" -C "$RELEASE_DIR"
cd "$RELEASE_DIR"

test -f Dockerfile
test -f compose.yaml
test -f dist/index.html
test -f deploy/nginx.conf
test -f deploy/caddy/Caddyfile

MARKDOWN_COUNT=$(find dist/knowledge-sources -type f -name '*.md' | wc -l)
test "$MARKDOWN_COUNT" -gt 0

umask 077
printf 'IMAGE_TAG=%s\nSITE_ADDRESS=:80\nHTTP_PORT=80\nHTTPS_PORT=443\n' "$RELEASE_TAG" > .env
printf '%s\n' "$RELEASE_TAG" > "$APP_ROOT/pending-release"

printf 'RELEASE=%s MARKDOWN=%s\n' "$RELEASE_TAG" "$MARKDOWN_COUNT"
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>APP_ROOT</code> | Root cố định trong home của user Ubuntu |
| <code>date -u</code> | Tạo image/release tag duy nhất theo UTC |
| Khối <code>if</code> | Không trộn file với release đã tồn tại |
| <code>tar -xzf</code> | Extract bundle vào release mới |
| Các lệnh <code>test -f</code> | Bắt bundle thiếu file trước Docker build |
| <code>find ... wc -l</code> | Xác nhận production bundle có Markdown |
| <code>umask 077</code> | File cấu hình mới chỉ user hiện tại đọc/ghi |
| <code>.env</code> | Chốt image tag, HTTP mode và public ports |
| <code>pending-release</code> | Lưu candidate để block sau vẫn chạy được nếu SSH reconnect |

### 8.3 Validate, build và start

~~~bash
set -Eeuo pipefail

APP_ROOT="$HOME/apps/summarize-knowledge-web"
RELEASE_TAG=$(cat "$APP_ROOT/pending-release")
RELEASE_DIR="$APP_ROOT/releases/$RELEASE_TAG"

test -d "$RELEASE_DIR"
cd "$RELEASE_DIR"

sudo docker compose config --quiet
sudo docker compose build --pull web
sudo docker image inspect "summarize-knowledge-web:$RELEASE_TAG" >/dev/null
sudo docker compose up -d --no-build

DEPLOY_OK=0
for attempt in $(seq 1 30); do
    if [ "$(curl -fsS http://127.0.0.1/healthz)" = "healthy" ]; then
        DEPLOY_OK=1
        break
    fi
    sleep 2
done

if [ "$DEPLOY_OK" -ne 1 ]; then
    sudo docker compose ps
    sudo docker compose logs --tail=200
    exit 1
fi

sudo docker compose ps
[ "$(curl -fsS http://127.0.0.1/healthz)" = "healthy" ]
curl -fsSI http://127.0.0.1/
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>compose config --quiet</code> | Parse, interpolate và validate Compose |
| <code>build --pull web</code> | Pull Nginx base và build runtime image |
| <code>image inspect</code> | Xác nhận image có đúng release tag |
| <code>up -d --no-build</code> | Chạy web + Caddy nền, không build lại |
| Vòng <code>seq 1 30</code> | Chờ tối đa 60 giây cho health endpoint |
| <code>curl -f</code> | Trả lỗi nếu status HTTP từ 400 trở lên |
| Nhánh lỗi | In trạng thái và 200 log cuối rồi dừng |

Caddy ở chế độ <code>SITE_ADDRESS=:80</code> chỉ phục vụ HTTP. Warning “server is
listening only on the HTTP port” lúc này là đúng hành vi, không phải lỗi.

### 8.4 Đánh dấu release hiện tại

Chỉ chạy sau khi healthcheck thành công:

~~~bash
set -Eeuo pipefail

APP_ROOT="$HOME/apps/summarize-knowledge-web"
RELEASE_TAG=$(cat "$APP_ROOT/pending-release")
RELEASE_DIR="$APP_ROOT/releases/$RELEASE_TAG"

test -d "$RELEASE_DIR"
cd "$RELEASE_DIR"
[ "$(curl -fsS http://127.0.0.1/healthz)" = "healthy" ]

ln -sfn "$RELEASE_DIR" "$APP_ROOT/current"
printf '%s\n' "$RELEASE_TAG" > "$APP_ROOT/current-tag"
rm -f "$APP_ROOT/pending-release"

readlink -f "$APP_ROOT/current"
cat "$APP_ROOT/current-tag"
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>ln -sfn</code> | Chuyển con trỏ vận hành sang release chạy tốt |
| <code>current-tag</code> | Lưu image tag để update/rollback |
| <code>readlink -f</code> | Xác nhận symlink trỏ đúng release |

### 8.5 Test từ Windows

Thoát SSH hoặc mở một **PowerShell local** khác:

~~~powershell
$ErrorActionPreference = "Stop"
$vmIp = (Read-Host "Nhập public IPv4 của VM").Trim()
$parsedIp = $null

if (
    -not [Net.IPAddress]::TryParse($vmIp, [ref]$parsedIp) -or
    $parsedIp.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork
) {
    throw "Public IPv4 không hợp lệ: $vmIp"
}

if (-not (Test-NetConnection $vmIp -Port 22 -InformationLevel Quiet)) {
    throw "Không kết nối được TCP 22."
}

if (-not (Test-NetConnection $vmIp -Port 80 -InformationLevel Quiet)) {
    throw "Không kết nối được TCP 80."
}

curl.exe -fsSI "http://$vmIp/"
if ($LASTEXITCODE -ne 0) { throw "HTTP headers check thất bại." }

curl.exe -fsS "http://$vmIp/healthz"
if ($LASTEXITCODE -ne 0) { throw "Public healthcheck thất bại." }
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>Test-NetConnection 22</code> | Kiểm tra đường SSH qua OCI NSG |
| <code>Test-NetConnection 80</code> | Kiểm tra public HTTP listener |
| <code>curl -I</code> | Đọc response headers mà không tải body |
| <code>/healthz</code> | Test hoàn chỉnh OCI → Caddy → Nginx |

Mở <code>http://PUBLIC_IP</code> trên desktop và điện thoại. Kiểm tra đủ tab kiến
thức, mở Markdown, QA, reload trang và responsive ở màn hình nhỏ.

## 9. Gắn domain và bật HTTPS tự động

Có thể bỏ qua phần này nếu chỉ cần HTTP qua IP. Trình duyệt production nên dùng
domain + HTTPS.

### 9.1 Tạo DNS record

Tại nhà cung cấp DNS, tạo:

| Type | Name | Value |
|---|---|---|
| A | Ví dụ <code>learn</code> | Reserved/Public IPv4 của VM |

Không bật proxy của nhà cung cấp DNS trong lần cấp certificate đầu tiên nếu chưa
chắc proxy cho phép ACME HTTP challenge.

Kiểm tra từ **PowerShell local**:

~~~powershell
$ErrorActionPreference = "Stop"
$vmIp = (Read-Host "Nhập public IPv4 của VM").Trim()
$parsedIp = $null

if (
    -not [Net.IPAddress]::TryParse($vmIp, [ref]$parsedIp) -or
    $parsedIp.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork
) {
    throw "Public IPv4 không hợp lệ: $vmIp"
}

$domain = (Read-Host "Nhập domain đầy đủ, ví dụ learn.example.com").Trim().ToLowerInvariant()

if ($domain -notmatch '^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$') {
    throw "Domain không hợp lệ: $domain"
}

$dnsResult = Resolve-DnsName -Name $domain -Type A -ErrorAction Stop |
    Where-Object { $_.IPAddress } |
    Select-Object -ExpandProperty IPAddress

if ($dnsResult -notcontains $vmIp) {
    throw "DNS chưa trỏ về $vmIp. Kết quả hiện tại: $($dnsResult -join ', ')"
}

Write-Host "DNS_OK: $domain -> $vmIp"
~~~

| Lệnh | Ý nghĩa |
|---|---|
| Regex domain | Ngăn ghi giá trị rỗng hoặc ký tự không hợp lệ vào Caddy |
| <code>Resolve-DnsName -Type A</code> | Kiểm tra DNS công khai từ ngoài VM |
| <code>-notcontains</code> | Chỉ tiếp tục khi A record trả đúng IP |

### 9.2 Chuyển Caddy sang HTTPS

SSH lại VM, sau đó chạy trong **Bash trên VM**. Thay giá trị ở dòng
<code>DOMAIN</code> bằng domain vừa kiểm tra:

Trước khi chạy, thêm ingress stateful TCP 443 từ <code>0.0.0.0/0</code> vào OCI
NSG nếu chưa thêm, rồi xác nhận NSG vẫn gắn đúng Primary VNIC.

~~~bash
set -Eeuo pipefail

DOMAIN="learn.example.com"

if ! printf '%s' "$DOMAIN" | grep -Eq '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'; then
    echo "Domain không hợp lệ: $DOMAIN" >&2
    exit 1
fi

APP_ROOT="$HOME/apps/summarize-knowledge-web"
CURRENT_DIR=$(readlink -f "$APP_ROOT/current")
CURRENT_TAG=$(cat "$APP_ROOT/current-tag")

test -d "$CURRENT_DIR"
cd "$CURRENT_DIR"

BACKUP_ENV="$APP_ROOT/env-before-https"
cp .env "$BACKUP_ENV"

restore_previous_gateway() {
    cp "$BACKUP_ENV" .env
    sudo docker compose config --quiet
    sudo docker compose up -d --no-build --force-recreate gateway
}

umask 077
printf 'IMAGE_TAG=%s\nSITE_ADDRESS=%s\nHTTP_PORT=80\nHTTPS_PORT=443\n' "$CURRENT_TAG" "$DOMAIN" > .env

if ! sudo docker compose config --quiet; then
    cp "$BACKUP_ENV" .env
    exit 1
fi

if ! sudo docker compose up -d --no-build --force-recreate gateway; then
    restore_previous_gateway
    exit 1
fi

HTTPS_OK=0
for attempt in $(seq 1 60); do
    if [ "$(curl -fsS --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/healthz")" = "healthy" ]; then
        HTTPS_OK=1
        break
    fi
    sleep 2
done

if [ "$HTTPS_OK" -ne 1 ]; then
    sudo docker compose logs --tail=200 gateway
    restore_previous_gateway
    exit 1
fi

curl -fsSI --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/"
rm -f "$BACKUP_ENV"
sudo docker compose ps
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>DOMAIN=...</code> | Giá trị duy nhất cần thay |
| Regex Bash | Chặn domain lỗi trước khi restart gateway |
| <code>readlink</code> + <code>current-tag</code> | Lấy release/image đang chạy tốt |
| Ghi <code>.env</code> | Đưa hostname vào Caddyfile qua Compose |
| <code>BACKUP_ENV</code> | Giữ cấu hình HTTP cũ để tự phục hồi nếu ACME lỗi |
| <code>config --quiet</code> | Validate interpolation mới |
| <code>--force-recreate gateway</code> | Chỉ tạo lại TLS gateway; web không rebuild |
| Vòng 120 giây | Cho DNS/ACME thời gian cấp certificate |
| <code>curl --resolve</code> | Kiểm tra đúng SNI/domain/certificate qua loopback, không phụ thuộc NAT hairpin |
| <code>restore_previous_gateway</code> | Khôi phục HTTP nếu config, recreate hoặc cấp TLS lỗi |

Caddy tự xin, lưu và gia hạn certificate. Hai named volume
<code>summarize-knowledge-web_caddy_data</code> và
<code>summarize-knowledge-web_caddy_config</code> tồn tại xuyên qua container
recreate.

**Không chạy <code>docker compose down -v</code>**. Tùy chọn <code>-v</code> xóa
volume chứa certificate và private key.

## 10. Deploy bản cập nhật

### 10.1 Local: build lại và upload

Sau khi thêm/sửa folder kiến thức, chạy lại toàn bộ mục 5 và 6. Tối thiểu:

~~~powershell
$ErrorActionPreference = "Stop"
$projectPath = "E:\SourceCode\SummarizeKnowledgeWeb"
$keyPath = (Read-Host "Nhập đường dẫn private key OCI").Trim('"')
$vmIp = (Read-Host "Nhập public IPv4 của VM").Trim()
$sshUser = "ubuntu"
$parsedIp = $null

if (-not (Test-Path -LiteralPath $keyPath -PathType Leaf)) {
    throw "Không tìm thấy private key: $keyPath"
}

if (
    -not [Net.IPAddress]::TryParse($vmIp, [ref]$parsedIp) -or
    $parsedIp.AddressFamily -ne [Net.Sockets.AddressFamily]::InterNetwork
) {
    throw "Public IPv4 không hợp lệ: $vmIp"
}

Set-Location -LiteralPath $projectPath

npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci thất bại." }

npm run check
if ($LASTEXITCODE -ne 0) { throw "npm run check thất bại." }

$publicMarkdownCount = @(
    Get-ChildItem -LiteralPath "public\knowledge-sources" -Filter "*.md" -File -Recurse
).Count

$distMarkdownCount = @(
    Get-ChildItem -LiteralPath "dist\knowledge-sources" -Filter "*.md" -File -Recurse
).Count

if ($distMarkdownCount -le 0 -or $distMarkdownCount -ne $publicMarkdownCount) {
    throw "Markdown count không hợp lệ: public=$publicMarkdownCount, dist=$distMarkdownCount"
}

$bundlePath = Join-Path $env:TEMP "summarize-knowledge-web.tar.gz"
if (Test-Path -LiteralPath $bundlePath) {
    Remove-Item -LiteralPath $bundlePath -Force
}

tar -czf $bundlePath Dockerfile .dockerignore compose.yaml deploy dist
if ($LASTEXITCODE -ne 0) { throw "Tạo bundle thất bại." }

$remoteBundlePath = "$sshUser@$vmIp" + ":/tmp/summarize-knowledge-web.tar.gz"
scp -o IdentitiesOnly=yes -i $keyPath $bundlePath $remoteBundlePath
if ($LASTEXITCODE -ne 0) { throw "Upload thất bại." }
~~~

Các lệnh giống deploy đầu: build từ toàn workspace, so count, thay đúng archive
tạm và upload. Không copy riêng vài file vào <code>dist</code>.

### 10.2 VM: build release mới, healthcheck rồi mới commit

~~~bash
set -Eeuo pipefail

APP_ROOT="$HOME/apps/summarize-knowledge-web"
BUNDLE_PATH="/tmp/summarize-knowledge-web.tar.gz"
CURRENT_DIR=$(readlink -f "$APP_ROOT/current")
PREVIOUS_TAG=$(cat "$APP_ROOT/current-tag")
SITE_ADDRESS_VALUE=$(sed -n 's/^SITE_ADDRESS=//p' "$CURRENT_DIR/.env")

test -s "$BUNDLE_PATH"
tar -tzf "$BUNDLE_PATH" >/dev/null
test -n "$SITE_ADDRESS_VALUE"

RELEASE_TAG=$(date -u +%Y%m%dT%H%M%SZ)
RELEASE_DIR="$APP_ROOT/releases/$RELEASE_TAG"
test ! -e "$RELEASE_DIR"

mkdir -p "$RELEASE_DIR"
tar -xzf "$BUNDLE_PATH" -C "$RELEASE_DIR"
cd "$RELEASE_DIR"

test -f dist/index.html
MARKDOWN_COUNT=$(find dist/knowledge-sources -type f -name '*.md' | wc -l)
test "$MARKDOWN_COUNT" -gt 0

umask 077
printf 'IMAGE_TAG=%s\nSITE_ADDRESS=%s\nHTTP_PORT=80\nHTTPS_PORT=443\n' "$RELEASE_TAG" "$SITE_ADDRESS_VALUE" > .env

sudo docker compose config --quiet
sudo docker compose build --pull web
sudo docker compose up -d --no-build

UPDATE_OK=0
for attempt in $(seq 1 30); do
    if curl -fsS http://127.0.0.1/healthz >/dev/null; then
        UPDATE_OK=1
        break
    fi
    sleep 2
done

if [ "$UPDATE_OK" -ne 1 ]; then
    sudo docker compose logs --tail=200
    cd "$CURRENT_DIR"
    sudo docker compose up -d --no-build
    echo "Update lỗi; đã quay lại release $PREVIOUS_TAG." >&2
    exit 1
fi

ln -sfn "$RELEASE_DIR" "$APP_ROOT/current"
printf '%s\n' "$RELEASE_TAG" > "$APP_ROOT/current-tag"

printf 'DEPLOY_OK release=%s markdown=%s previous=%s\n' "$RELEASE_TAG" "$MARKDOWN_COUNT" "$PREVIOUS_TAG"
sudo docker compose ps
~~~

| Lệnh/khối | Ý nghĩa |
|---|---|
| <code>CURRENT_DIR</code>, <code>PREVIOUS_TAG</code> | Ghi nhớ release tốt để tự rollback |
| <code>SITE_ADDRESS_VALUE</code> | Giữ nguyên HTTP mode hoặc domain HTTPS |
| Release timestamp mới | Không ghi đè source của release cũ |
| Image timestamp mới | Image cũ còn nguyên để rollback |
| Health loop | Chỉ commit symlink sau request xuyên gateway thành công |
| Nhánh lỗi | Chạy lại Compose từ release cũ rồi dừng |
| <code>ln -sfn</code> cuối | Commit release sau khi chứng minh hoạt động |

## 11. Rollback thủ công

Liệt kê release và image trước:

~~~bash
APP_ROOT="$HOME/apps/summarize-knowledge-web"
ls -1 "$APP_ROOT/releases"
sudo docker image ls summarize-knowledge-web
cat "$APP_ROOT/current-tag"
~~~

Chọn timestamp có cả release directory và image. Thay đúng dòng
<code>ROLLBACK_TAG</code>:

~~~bash
set -Eeuo pipefail

APP_ROOT="$HOME/apps/summarize-knowledge-web"
ROLLBACK_TAG="20260828T120000Z"
CURRENT_DIR=$(readlink -f "$APP_ROOT/current")
SITE_ADDRESS_VALUE=$(sed -n 's/^SITE_ADDRESS=//p' "$CURRENT_DIR/.env")
ROLLBACK_DIR="$APP_ROOT/releases/$ROLLBACK_TAG"

test -d "$ROLLBACK_DIR"
test -n "$SITE_ADDRESS_VALUE"
sudo docker image inspect "summarize-knowledge-web:$ROLLBACK_TAG" >/dev/null

cd "$ROLLBACK_DIR"
umask 077
printf 'IMAGE_TAG=%s\nSITE_ADDRESS=%s\nHTTP_PORT=80\nHTTPS_PORT=443\n' "$ROLLBACK_TAG" "$SITE_ADDRESS_VALUE" > .env

sudo docker compose config --quiet
sudo docker compose up -d --no-build
curl -fsS http://127.0.0.1/healthz

ln -sfn "$ROLLBACK_DIR" "$APP_ROOT/current"
printf '%s\n' "$ROLLBACK_TAG" > "$APP_ROOT/current-tag"

echo "ROLLBACK_OK: $ROLLBACK_TAG"
~~~

Các lệnh <code>test</code> ngăn rollback tới release/image không tồn tại. Domain
hiện tại được giữ lại, nên rollback nội dung không vô tình tắt HTTPS.

## 12. Reboot và vận hành thường ngày

### 12.1 Test tự khởi động sau reboot

~~~bash
sudo reboot
~~~

SSH sẽ ngắt. Chờ khoảng một phút, đăng nhập lại rồi chạy:

~~~bash
cd "$(readlink -f "$HOME/apps/summarize-knowledge-web/current")"
sudo systemctl is-active docker
sudo docker compose ps
curl -fsS http://127.0.0.1/healthz
~~~

Docker service được enable và container có
<code>restart: unless-stopped</code>, nên cả stack phải tự trở lại.

### 12.2 Xem log và tài nguyên

~~~bash
cd "$(readlink -f "$HOME/apps/summarize-knowledge-web/current")"
sudo docker compose logs --tail=100
sudo docker compose stats --no-stream
df -h /
sudo docker system df
~~~

| Lệnh | Ý nghĩa |
|---|---|
| <code>logs --tail=100</code> | Xem log gần nhất của cả stack |
| <code>stats --no-stream</code> | Snapshot CPU/RAM, không giữ terminal mở |
| <code>df -h</code> | Dung lượng filesystem |
| <code>docker system df</code> | Dung lượng image, container, volume và cache |

Compose giới hạn mỗi container tối đa 3 log file x 10 MB. Không dùng
<code>docker system prune -a</code> theo thói quen vì có thể xóa image rollback.

## 13. Troubleshooting theo từng lớp

### 13.1 SSH timeout

Kiểm tra theo thứ tự:

1. VM đang Running và có public IPv4.
2. Subnet là public subnet.
3. Route có <code>0.0.0.0/0 → Internet Gateway</code>.
4. NSG đã gắn vào đúng Primary VNIC.
5. Ingress TCP 22 dùng đúng public IP máy bạn + <code>/32</code>.
6. Username là <code>ubuntu</code>.
7. Key là private key, không phải file <code>.pub</code>.

Từ PowerShell:

~~~powershell
$keyPath = (Read-Host "Nhập đường dẫn private key OCI").Trim('"')
$vmIp = (Read-Host "Nhập public IPv4 của VM").Trim()
$sshUser = "ubuntu"

Test-NetConnection $vmIp -Port 22
ssh -vvv -o IdentitiesOnly=yes -i $keyPath "$sshUser@$vmIp"
~~~

<code>-vvv</code> in quá trình chọn key và handshake.

### 13.2 Docker repository hoặc pull lỗi

~~~bash
. /etc/os-release
printf '%s %s %s\n' "$ID" "$VERSION_ID" "$VERSION_CODENAME"
dpkg --print-architecture
curl -fsSI https://download.docker.com/
REGISTRY_STATUS=$(curl -sS -o /dev/null -w '%{http_code}' https://registry-1.docker.io/v2/)
printf 'Docker Registry HTTP status: %s (401 là bình thường)\n' "$REGISTRY_STATUS"
test "$REGISTRY_STATUS" = "401"
timedatectl status
~~~

- Sai OS: tạo lại Ubuntu 24.04 hoặc dùng guide riêng cho OS đó.
- DNS/network lỗi: kiểm tra egress, route và Internet Gateway.
- Certificate “not yet valid”: kiểm tra giờ hệ thống.
- OCI “out of host capacity”: đổi Availability Domain/shape hoặc thử lại sau;
  đây không phải lỗi command.

### 13.3 Port 80/443 đã được dùng

~~~bash
sudo ss -ltnp | awk 'NR == 1 || $4 ~ /:(80|443)$/'
sudo systemctl --type=service --state=running
~~~

Nếu đã cài host Nginx/Apache từ guide cũ, dừng và disable đúng service trước khi
chạy stack Docker. Không chạy host web server và Caddy trên cùng port.

### 13.4 Container web unhealthy

~~~bash
cd "$(readlink -f "$HOME/apps/summarize-knowledge-web/current")"
sudo docker compose ps
sudo docker compose logs --tail=200 web
sudo docker compose exec -T web nginx -t
sudo docker compose exec -T web id
sudo docker compose exec -T web wget -qO- http://127.0.0.1:8080/healthz
~~~

Kết quả mong đợi:

- <code>nginx -t</code>: syntax is ok, test is successful;
- <code>id</code>: user <code>nginx</code>, không phải root;
- health body: <code>healthy</code>.

### 13.5 Gateway trả 502

~~~bash
cd "$(readlink -f "$HOME/apps/summarize-knowledge-web/current")"
sudo docker compose logs --tail=200 gateway
sudo docker compose exec -T gateway wget -qO- http://web:8080/healthz
sudo docker network inspect summarize-knowledge-web_default
~~~

Nếu gateway gọi được <code>web:8080</code> nhưng browser vẫn lỗi, kiểm tra Caddy
config và public port. Nếu không gọi được, kiểm tra web health và Docker network.

### 13.6 Localhost chạy nhưng public IP không vào được

Nếu lệnh này trên VM thành công:

~~~bash
curl -fsS http://127.0.0.1/healthz
~~~

nhưng Windows không vào được, lỗi nằm trước container. Kiểm tra:

1. public IPv4;
2. Internet Gateway;
3. route table;
4. NSG đã gắn VNIC;
5. ingress TCP 80;
6. không bật UFW;
7. <code>docker compose ps</code> có mapping public port 80.

### 13.7 HTTPS không cấp được certificate

~~~bash
cd "$(readlink -f "$HOME/apps/summarize-knowledge-web/current")"
grep '^SITE_ADDRESS=' .env
sudo docker compose logs --tail=300 gateway
getent ahostsv4 "$(sed -n 's/^SITE_ADDRESS=//p' .env)"
date -u
~~~

Kiểm tra A record, TCP 80/443, AAAA record sai, proxy DNS, Caddy data volume và
giờ UTC của VM.

### 13.8 Markdown 404 hoặc QA thiếu nội dung

Trên local:

~~~powershell
Set-Location -LiteralPath "E:\SourceCode\SummarizeKnowledgeWeb"
npm run check
if ($LASTEXITCODE -ne 0) { throw "npm run check thất bại." }
~~~

Trên VM:

~~~bash
CURRENT_DIR=$(readlink -f "$HOME/apps/summarize-knowledge-web/current")
find "$CURRENT_DIR/dist/knowledge-sources" -type f -name '*.md' | wc -l

cd "$CURRENT_DIR"
sudo docker compose exec -T web sh -c "find /usr/share/nginx/html/knowledge-sources -type f -name '*.md' | wc -l"
~~~

Hai count trong release và container phải bằng count local đã in sau
<code>npm run check</code>.

## 14. Checklist hoàn tất

- [ ] VM là Ubuntu 24.04 LTS và có public IPv4.
- [ ] Public subnet có Internet Gateway và default route.
- [ ] NSG gắn đúng VNIC.
- [ ] Mọi Security List/NSG chỉ mở SSH 22 cho IP quản trị <code>/32</code>.
- [ ] TCP 80 mở public; TCP 443 chỉ mở nếu dùng HTTPS; không mở 3000/5173/8080.
- [ ] Không bật UFW.
- [ ] <code>npm ci</code> và <code>npm run check</code> pass ở full workspace.
- [ ] Count Markdown trong public và dist bằng nhau.
- [ ] Đã rà soát secret/dữ liệu nhạy cảm trong Markdown.
- [ ] <code>docker compose config --quiet</code> pass.
- [ ] Web container healthy và chạy bằng user nginx.
- [ ] <code>http://PUBLIC_IP/healthz</code> trả <code>healthy</code>.
- [ ] Nếu dùng domain, DNS A record đúng và HTTPS pass.
- [ ] Caddy named volumes còn nguyên.
- [ ] Đã test desktop, mobile, tab kiến thức và QA.
- [ ] Đã biết release tag gần nhất để rollback.

## 15. Tài liệu chính thức đã đối chiếu

- [Docker Engine trên Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose plugin trên Linux](https://docs.docker.com/compose/install/linux/)
- [Docker Compose production](https://docs.docker.com/compose/how-tos/production/)
- [Docker và firewall/packet filtering](https://docs.docker.com/engine/network/packet-filtering-firewalls/)
- [Docker json-file log rotation](https://docs.docker.com/engine/logging/drivers/json-file/)
- [Caddy Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [Caddy HTTPS quick start](https://caddyserver.com/docs/quick-starts/https)
- [Caddy official Docker image](https://hub.docker.com/_/caddy)
- [OCI Platform Images và essential firewall rules](https://docs.oracle.com/en-us/iaas/Content/Compute/References/images.htm)
- [OCI Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)
- [OCI Public IP Addresses](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/managingpublicIPs.htm)
- [OCI Network Security Groups](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/networksecuritygroups.htm)
- [OCI Security Lists](https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/securitylists.htm)
- [OCI Internet Gateway](https://docs.oracle.com/en-us/iaas/Content/Network/Tasks/managingIGs.htm)
- [Kết nối Linux instance bằng SSH](https://docs.oracle.com/en-us/iaas/Content/Compute/Tasks/connect-to-linux-instance.htm)
- [Docker Linux post-install](https://docs.docker.com/engine/install/linux-postinstall/)
