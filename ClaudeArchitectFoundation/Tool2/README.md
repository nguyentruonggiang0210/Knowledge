# CCAR-F documentation scraper

Tool này render trang SPA bằng Playwright, đọc `.docs-sidebar`, click từng domain và từng section, sau đó lưu mỗi domain thành một file Markdown riêng trong `Output/`.

## Cài đặt

```powershell
cd Tool2
python -m pip install -r requirements.txt
python -m playwright install chromium
```

Nếu máy đã cài Microsoft Edge, script sẽ ưu tiên dùng Edge và thường không cần tải Chromium riêng.

## Chạy

```powershell
python scrape_docs.py --verbose
```

Các tùy chọn hữu ích:

```powershell
# Hiện cửa sổ browser
python scrape_docs.py --headed --verbose

# Kiểm tra DOM nếu website thay đổi class/selector
python scrape_docs.py --inspect

# Đổi thư mục kết quả hoặc timeout
python scrape_docs.py --output Output --timeout 90
```

Kết quả gồm:

- `ALL_DOMAINS.md`: toàn bộ nội dung của năm domain trong một file.
- `D1-....md` đến `D5-....md`: mỗi domain trong một file riêng.
- `manifest.json`: số section dự kiến/thực tế và trạng thái từng domain.

Script trả exit code `2` nếu số section không khớp hoặc có domain lỗi, giúp phát hiện việc crawl thiếu nội dung.
