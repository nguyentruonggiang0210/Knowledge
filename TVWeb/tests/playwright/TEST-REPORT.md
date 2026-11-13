# Bao cao kiem thu TvWeb

Ngay chay: 2026-10-12. Moi truong: Windows, Chromium headless qua Playwright, trang dang chay tai `http://localhost:5125`, database local hien tai. Lenh: `cd tests/playwright; npm ci; npx playwright install chromium; $env:TVWEB_URL='http://localhost:5125'; npm test`.

## Ket qua

Lan chay day du: **20 passed, 0 failed, 0 skipped** (41.4 giay). Bao cao may doc duoc: [results.json](reports/results.json). Bao cao HTML tai may: `reports/html/index.html`; anh responsive: `reports/responsive-375.png`, `reports/responsive-768.png`, `reports/responsive-1440.png`; anh trang chu: `reports/home-web.png`, `reports/home-tv.png`, `reports/home-mobile.png`. Trace, video va screenshot khi that bai o `reports/artifacts/`.

| Case | Ky vong | Ket qua |
| --- | --- | --- |
| Trang chu, danh muc, tim ten phim, chi tiet, vao trang xem | Dieu huong dung, co player | PASS |
| Mo ta phim | 3 trang dai dien khong hien the `<p>`; kiem tra du lieu 1538 phim, 801 mo ta co markup, 0 the con sot sau khi chuyen doan | PASS |
| Anh bi loi tren card, chi tiet, banner va player | Chuyen ve anh TvWeb dung ty le | PASS |
| Poster card va anh chi tiet (375/1440 px) | Khung 2:3 cao deu, `object-fit: contain`, khong keo gian/cat anh | PASS |
| Rail "Moi cap nhat" tren web / TV / mobile | Card cung chieu rong va khung 2:3 cao deu, khong meo anh | PASS / PASS / PASS |
| Doi tap | Tap active, tieu de va localStorage dong bo | PASS |
| Server/tap khong hop le | Chuyen ve nguon/tap hop le | PASS |
| Phim khong ton tai, tim kiem rong | 404, danh sach rong va giu truy van | PASS |
| Loc trang thai va the loai | Ket qua phu hop bo loc | PASS |
| TV mode | Focus tap va di chuyen bang mui ten | PASS |
| Video HLS | Co hinh thuc player, `playing`, currentTime tang, tua va het `seeking` | PASS |
| HLS tai theo nhu cau | Khong co request playlist/segment truoc Play; sau Play moi tai | PASS |
| Iframe tai theo nhu cau | Chua co `src` truoc khi bam Phat phim; sau khi bam moi nap iframe | PASS |
| Dieu Gợi Nhớ Về Anh: nguon HLS loi | Sau 12 giay cho hoac loi player, hien canh bao, thu lai va doi may chu | PASS (UI; nguon ngoai van loi) |
| Series 50 tap | Tai HTML < 5s, Play den `playing` < 30s | PASS |
| UI 375 / 768 / 1440 px | Menu mobile, player trong viewport, khong tran ngang | PASS / PASS / PASS |

Fixture phim: `tu-khi-toi-lam-gia-su-cho-ke-thu` (50 tap, HLS); co the doi qua `TVWEB_SERIES_SLUG`. Fixture iframe: `bac-si-x-mafia-ao-trang`; co the doi qua `TVWEB_IFRAME_SLUG`. Lan chay cuoi: HTML cua trang xem **354 ms**, Play den `playing` **635 ms**. Day la mau don le tren may local, khong phai p95 hay cam ket CDN. Tai theo nhu cau lam trang mo nhe hon nhung co the tang thoi gian cho sau khi bam Play; khong tang toc do mang/CDN. Test khong mo phong moi nguon/tap va khong danh gia chat luong hinh anh/am thanh cua phim. Console JS va HTTP 5xx noi bo duoc kiem tra trong tung case.

## Gioi han va case tiep theo


Khong co loi ung dung nao tai hien trong cac case da chay; khong the ket luan website tuyet doi khong loi ngoai pham vi tren.