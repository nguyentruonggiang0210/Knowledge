# 01 — First container

Sample nhỏ nhất để quan sát build context → image → container → published port.

## Chạy

```bash
docker compose config
docker compose up --build -d
docker compose ps
```

Mở <http://localhost:8080> hoặc:

```bash
curl http://localhost:8080
docker compose logs web
docker compose exec web sh -c 'id; ps; ls -l /usr/share/nginx/html'
```

Container được đặt tên cố định `docker-first-web` chỉ để lệnh lab dễ đọc. Trong dự án cần scale/mở nhiều project, bỏ `container_name` và dùng service name `web`.

## Quan sát bất biến

Sửa `site/index.html`, reload trình duyệt: nội dung **chưa đổi** vì file đã được `COPY` vào image, không bind mount. Sau đó:

```bash
docker compose build
docker compose up -d
```

Image/container mới có nội dung mới. Xem metadata:

```bash
docker image history deep-docker/first-web:dev
docker inspect docker-first-web
docker diff docker-first-web
```

## Dừng và dọn đúng scope

```bash
docker compose down
```

Lab dùng moving tag `nginx:alpine` cho dễ chạy. Production phải chọn tag/digest base đã được tổ chức kiểm thử và có quy trình cập nhật.

Liên quan: [Bài 01](../../../Lessions/Docker/01-mental-model-va-kien-truc.md), [Bài 02](../../../Lessions/Docker/02-cli-va-vong-doi-container.md).
