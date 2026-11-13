# 04 — Named volume, backup và restore

Writer ghi một dòng mỗi 5 giây vào named volume. Mục tiêu là chứng minh data sống qua recreate và tập restore vào **volume mới**, không ghi đè nguồn.

## Chạy và recreate

```bash
docker compose up -d
docker compose exec writer tail /data/events.log
docker compose down
docker compose up -d
docker compose exec writer tail /data/events.log
```

Các dòng cũ vẫn còn. `docker compose down` mặc định không xóa named volume; `down -v` sẽ xóa và vì vậy không dùng ở lab này trước khi backup.

## Backup

PowerShell:

```powershell
./backup.ps1
```

Bash:

```bash
sh ./backup.sh
```

Hai script mount source volume read-only và tạo `backups/app-data.tgz` trên host.

## Restore drill

PowerShell:

```powershell
./restore.ps1
```

Bash:

```bash
sh ./restore.sh
```

Script tạo volume `docker-storage-lab_restore-data`, giải nén rồi in các dòng cuối. Có thể xóa **chính volume drill** sau khi xác nhận exact name:

```bash
docker volume rm docker-storage-lab_restore-data
```

## Cảnh báo consistency

Tar volume phù hợp data file đơn giản khi writer được dừng/quiesce. Không coi đây là PostgreSQL/MySQL hot backup. Database thật cần tool/native snapshot consistency và restore verification.

```bash
docker compose down
```

Liên quan: [Bài 07](../../../Lessions/Docker/07-storage-va-du-lieu.md).
