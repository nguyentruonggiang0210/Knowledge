# TvWeb — Danh mục phim từ Onflix, Motchill và TopPhim

Web **ASP.NET Core MVC** hiển thị poster, trang chi tiết và trang xem phim trên TVWeb. Card, banner và bookmark cũ không chuyển sang trang phim gốc. Tool Python lưu metadata và `source_url`; các tập/link phát đã có trong database vẫn có thể xem trên TVWeb.

## Kiến trúc

```
tool/            Python scraper (httpx + BeautifulSoup + APScheduler)
  config.yaml    base_url, interval 3h, delay, blocklist QC
  crawler.py     API Onflix -> metadata phim
  supplemental.py sitemap Motchill/TopPhim -> metadata phim
  scheduler.py   chạy mỗi 3h, `--once` chạy 1 lần
  schema.sql     bảng films / episodes (dữ liệu cũ) / crawl_state
src/TvWeb/       ASP.NET Core 9 MVC + Dapper + SQLite
  Controllers/   Home (hero+rows), Phim (list/detail/watch), Api (JSON)
  Views/         dark Netflix-like, responsive mobile/desktop/TV (?tv=1)
data/tvweb.db    SQLite dùng chung (volume Docker)
```

## 1. Chạy local

### 1.1. Cào thử (Python 3.11+)
```powershell
cd tool
pip install -r requirements.txt
$env:DB_PATH = "..\data\tvweb.db"
python scheduler.py --once --limit 10
```
Kiểm tra bảng `films`: mỗi bản ghi có poster, tên và `source_url` trỏ tới trang phim gốc. Quét lại không tạo bản ghi trùng slug. Dữ liệu `episodes` đã có được giữ nguyên và dùng cho trang xem khi có nguồn phát.

Quét toàn bộ catalogue (có checkpoint, chạy lại sẽ tiếp tục đúng phim đang dở):
```powershell
python scheduler.py --once --full
```

Có thể thêm `--limit N` để chạy từng đợt. Checkpoint gồm `full_page` và
`full_offset` trong bảng `crawl_state`; chỉ reset sau khi đã đọc hết API.
`--repair` và `--refresh-links` không còn dùng. Để lấy phim Onflix chưa có,
chạy `--once --full`; lượt 3 giờ chỉ lấy phần đầu catalogue.

### Nguồn phim bổ sung

Lịch 3 giờ hiện quét thêm `motchillv.xyz` và `tophim.top` từ sitemap, tối đa
100 phim/site/lượt; vị trí lưu trong `crawl_state` để lần sau tiếp tục. Quét
theo URL thủ công (dùng `--limit` để thử trước):

```powershell
python tool/scheduler.py --once --source-url https://motchillv.xyz/ --source-url https://tophim.top/ --limit 10
python tool/scheduler.py --once --source-url https://motchillv.xyz/ --full
```

`--full` quét hết sitemap và có thể chạy rất lâu; kiểm tra trên DB riêng bằng
`$env:DB_PATH='.../data/verify-supplemental.db'` trước khi chạy trên DB chính.
Mỗi nguồn được giữ thành card riêng, kể cả phim cùng tên; bấm card mở trang
chi tiết nội bộ. Tool chỉ tải trang chi tiết để lấy tên, poster, năm và
`source_url`, không truy cập trang xem hay giải mã token player. Các domain
mới vẫn cần adapter để đọc metadata và sitemap tương ứng.

### 1.2. Web (.NET 9 SDK)
```powershell
$env:DB_PATH = "$PWD\data\tvweb.db"
dotnet run --project src/TvWeb/TvWeb.csproj
```
Mở http://localhost:5000 — trang chủ hoặc tìm kiếm → bấm poster/tên → trang chi tiết TVWeb. Bookmark `/phim/{slug}` và `/xem-phim/{slug}` cũ cũng mở trang nội bộ. Khi chưa có tập/link phát, trang chi tiết thông báo chờ cập nhật. CSS Bootstrap và jQuery phục vụ từ TVWeb để tránh phụ thuộc CDN trên trình duyệt TV; Video.js vẫn tải từ CDN khi dùng player HLS.

TVWeb không tải HTML/CSS hay quảng cáo của trang phim gốc khi duyệt catalogue. Nếu tập chỉ có player nhúng (`iframe`) từ nhà cung cấp, quảng cáo và CSS bên trong iframe vẫn do nhà cung cấp kiểm soát; TVWeb không thể gỡ chúng hoặc sửa CSS khác domain. Ưu tiên nguồn HLS trực tiếp khi có; player nhúng có thể không tương thích một số TV browser.

### 1.3. Lịch 3h local (không Docker)
```powershell
cd tool; python scheduler.py   # chạy nền, mỗi 3h cào 1 vòng
```

## 2. Chạy Docker Compose (khuyến nghị)

```powershell
docker compose up --build -d
docker compose logs -f crawler   # xem lịch cào
docker compose logs -f web       # web :5000
```
- Web: http://localhost:5000
- DB persits ở `./data/tvweb.db` (volume mount, restart không mất)
- TV mode: mở `http://<host>:5000/?tv=1` trên trình duyệt TV, dùng remote/D-pad (←→↑↓/Enter)

## 3. Deploy Oracle Cloud Free (Ubuntu 22.04)

```bash
# 1. Tạo instance Ampere/VM (1 OCPU, 6GB RAM đủ), mở Ingress 80/443/5000
# 2. SSH vào, cài Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu && newgrp docker
sudo apt install -y git

# 3. Clone + chạy
git clone <repo-url> tvweb && cd tvweb
docker compose up --build -d
docker compose logs -f crawler   # xác nhận cào lần đầu OK

# 4. (Tùy chọn) Nginx + HTTPS
sudo apt install -y nginx certbot python3-certbot-nginx
# /etc/nginx/sites-enabled/tvweb:
#   server { listen 80; server_name phim.example.com;
#     location / { proxy_pass http://127.0.0.1:5000; proxy_set_header Host $host; } }
sudo certbot --nginx -d phim.example.com
```

Bảo trì: `docker compose pull` (không cần), `docker compose restart crawler` ép cào ngay (scheduler chạy 1 vòng lúc start).

## 4. Ghi chú pháp lý & kỹ thuật

- TvWeb không re-host hoặc phát video; việc phát và chất lượng phụ thuộc trang gốc.
- Chưa gồm: login, bình luận, tìm kiếm full-text — để giai đoạn 2.
