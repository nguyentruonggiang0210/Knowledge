# Trang thai danh muc nguon (2026-10-12)

TvWeb chi luu poster, ten phim va `source_url`; bam card mo trang phim goc. Khong quet tap, player hay kiem tra link video. Du lieu `episodes` cu trong SQLite duoc giu lai nhung khong con duoc su dung.

- Motchill: sitemap co khoang 10.803 URL phim; checkpoint cu o 21. Cac dot moi tiep tuc tu checkpoint va chi nap metadata, khong mo trang tap. Quet het can nhieu dot hoac chay `--full`.
- TopPhim: sitemap co khoang 33.270 URL phim; dot metadata-only dau tien da nhap duoc 2 phim tren database chinh. Khong truy cap `/xem/`.
- Onflix: API cung cap metadata. Phim trung ten o cac site khac van duoc giu thanh card rieng de nguoi xem chon trang goc.
- Batch thu tren database rieng: 2 phim Motchill + 2 phim TopPhim, 0 tap moi. Browser test tren database chinh o cong 5203: 14/14 pass cho trang chu, tim kiem, redirect URL cu va responsive.

Xem tien do (PowerShell tu thu muc repo):

```powershell
node -e "const db=new (require('node:sqlite').DatabaseSync)('data/tvweb.db',{readOnly:true}); console.log(db.prepare('select k,v from crawl_state where k like ?').all('supplemental:%:offset')); console.log(db.prepare('select count(1) n from films where slug like ?').get('motchill-%')); console.log(db.prepare('select count(1) n from films where slug like ?').get('tophim-%'))"
```

Tiep tuc quet tung dot (khong chay hai tien trinh tren cung DB):

```powershell
$env:DB_PATH = "$PWD\data\tvweb.db"
.\.venv\Scripts\python.exe -u tool\scheduler.py --once --source-url https://motchillv.xyz/ --source-url https://tophim.top/ --limit 25
```

Quet full den het sitemap (co the mat nhieu gio/ngay, tu luu checkpoint):

```powershell
$env:DB_PATH = "$PWD\data\tvweb.db"
.\.venv\Scripts\python.exe -u tool\scheduler.py --once --source-url https://motchillv.xyz/ --source-url https://tophim.top/ --full
```

`--full` chi duoc tinh la hoan tat neu in dong `sitemap complete` va checkpoint quay ve 0. Neu request trang chi tiet loi tam thoi, checkpoint giu lai phim do de thu lai o dot sau. Khong chay hai crawler cung luc tren mot database.