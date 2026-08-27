# D02 - Linux và system administration

## Mục tiêu

- Hiểu boot, filesystem, identity, process, service, package, log và time.
- Đọc tín hiệu CPU, memory, disk, network và kernel trước khi kết luận.
- Vận hành service least-privilege, graceful shutdown và resource limit.
- Điều tra có thứ tự: symptom → scope → hypothesis → evidence → mitigation → fix.

## Bản đồ một Linux host

~~~mermaid
flowchart TB
  HW[CPU memory disk NIC] --> Kernel[Kernel drivers scheduler memory network]
  Kernel --> Init[PID 1 systemd]
  Init --> Services[Services and timers]
  Kernel --> FS[Filesystem mounts inodes]
  Kernel --> NS[Namespaces and cgroups]
  Users[Users groups ACL capabilities] --> Services
  Services --> Logs[journald files metrics]
~~~

Boot thường đi qua firmware → bootloader → kernel/initramfs → PID 1 → targets/services.
Biết layer giúp phân biệt máy chưa boot, kernel lỗi, dependency chưa mount và application
không start.

## Filesystem, mount và inode

- Một path đi qua filesystem tree; mount gắn filesystem/device vào một điểm.
- File name nằm trong directory entry, inode giữ metadata và con trỏ data.
- Có thể còn nhiều GB nhưng không tạo file được vì hết inode.
- Hard link cùng inode; symbolic link lưu path tới target.
- Xóa file đang được process mở chưa chắc giải phóng dung lượng cho đến khi descriptor đóng.
- FHS thường gặp: /etc config, /var dữ liệu biến đổi/log, /run runtime, /proc và /sys là
  interface kernel, /tmp là tạm và không nên tin về permission/lifecycle.

~~~bash
df -h
df -i
findmnt
lsblk
du -xhd1 /var
lsof +L1
~~~

Không chạy lệnh xóa hàng loạt trước khi resolve chính xác path, owner và retention.

## Identity và permission

- UID/GID là identity thực; tên chỉ là mapping.
- Mode bits áp dụng cho owner/group/other: read, write, execute.
- Với directory, execute nghĩa traverse; write thường cho phép tạo/xóa entry.
- umask loại quyền mặc định; ACL bổ sung rule chi tiết.
- setuid/setgid/sticky bit có semantics đặc biệt; capability chia nhỏ quyền root.
- Service nên có user riêng, home/shell phù hợp, file chỉ đọc và capability tối thiểu.

~~~bash
id
namei -l /var/lib/myapp/config.yaml
stat /var/lib/myapp/config.yaml
getfacl /var/lib/myapp/config.yaml
getcap /usr/bin/ping
~~~

Không chữa permission bằng chmod 777.

## Process, signal và systemd

Process có PID/PPID, user, environment, file descriptor, namespace và cgroup. Các signal
quan trọng:

- SIGTERM: đề nghị kết thúc có kiểm soát; application phải ngừng nhận việc và flush.
- SIGKILL: kernel dừng ngay, application không cleanup được.
- SIGHUP thường dùng reload, nhưng phải kiểm tra contract của service.
- PID 1 có trách nhiệm reap child và signal semantics đặc biệt trong container.

~~~bash
ps -eo pid,ppid,user,stat,%cpu,%mem,cmd --sort=-%cpu
pstree -ap
systemctl status myapp
journalctl -u myapp --since "30 min ago"
systemctl show myapp -p ActiveState -p SubState -p NRestarts
~~~

Unit tối thiểu:

~~~ini
[Unit]
Description=Demo application
After=network-online.target
Wants=network-online.target

[Service]
User=myapp
Group=myapp
ExecStart=/opt/myapp/bin/server
Restart=on-failure
RestartSec=5s
TimeoutStopSec=30s
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/myapp

[Install]
WantedBy=multi-user.target
~~~

Hardening option có thể làm app không chạy; thêm từng bước và kiểm thử, không copy mù.

## CPU, memory, I/O và pressure

| Signal | Ý nghĩa cần kiểm tra |
|---|---|
| Load average | Runnable hoặc uninterruptible tasks; không đồng nhất với CPU percent |
| CPU user/system/iowait/steal | Code, kernel, chờ I/O hoặc hypervisor contention |
| RSS/VSZ | Resident memory khác virtual address space |
| Page cache | Memory cache có thể reclaim; không mặc định là leak |
| Swap/paging | Áp lực memory; xem rate và latency, không chỉ tổng swap |
| OOM kill | Kernel/cgroup đã chọn process để giải phóng memory |
| Disk latency/queue | Saturation hoặc dependency storage chậm |
| File descriptors | Socket/file mở; chạm limit gây lỗi kỳ lạ |

~~~bash
uptime
vmstat 1
pidstat -dur 1
iostat -xz 1
free -h
ss -s
ulimit -n
cat /proc/pressure/{cpu,memory,io}
journalctl -k | grep -i -E "oom|killed process"
~~~

Đọc trend và workload context. Một snapshot CPU 90% không tự chứng minh root cause.

## Package, log, time và SSH

- Pin/approve repository, verify package signature, có patch window và rollback plan.
- journald và log file cần retention/rotation; structured log dùng timestamp, level,
  service, environment, request/trace ID; không ghi token/PII.
- Time sync ảnh hưởng TLS, distributed trace, token và incident timeline. Theo dõi clock
  offset; timezone hiển thị nên tách khỏi UTC lưu trữ.
- SSH: dùng key/SSO hoặc certificate, tắt password/root login khi phù hợp, bastion/JIT,
  host-key verification, audit và rotation. Private key permission phải chặt.

~~~bash
timedatectl
journalctl --disk-usage
logrotate --debug /etc/logrotate.conf
sshd -T
last -a
~~~

## Namespace và cgroup

Namespaces cô lập view như PID, mount, network, IPC, UTS và user. Cgroups đo/giới hạn CPU,
memory, I/O và số process. Container sử dụng hai cơ chế này nhưng không phải VM: container
chia sẻ kernel host. Dùng systemd-cgls/systemd-cgtop hoặc đọc cgroup v2 để liên hệ lesson
container sau này.

## Windows operations track

Linux là runtime phổ biến của cloud-native nhưng Senior DevOps cũng phải nhận diện Windows:

- NTFS ACL/inheritance, local/domain identity, UAC và gMSA/service account;
- Windows Service, Service Control Manager, Scheduled Task và reboot semantics;
- Event Log/ETW, Performance Counter, process/handle và crash dump;
- Registry/config, PowerShell remoting/WinRM và certificate store;
- Windows Update/Defender/firewall, patch ring và rollback;
- Active Directory/DNS/time dependency và Group Policy.

Map theo capability thay vì dịch lệnh một-một. systemd unit khác Windows Service; POSIX mode
bits khác NTFS ACL. Dùng [system-audit.ps1](lab/system-audit.ps1) làm baseline rồi tạo một
Windows service sandbox, least-privilege identity, log/health và patch/reboot drill nếu môi
trường công việc có Windows.

## Playbook điều tra service down

1. Xác nhận symptom từ góc nhìn user, thời điểm và scope.
2. Kiểm tra change/deploy gần nhất và dependency.
3. Host reachable? DNS/route/TLS đúng? Port có listen?
4. systemd state, exit code, restart loop và log đầu tiên trước chuỗi lỗi.
5. Disk/inode/memory/OOM/fd/time/certificate.
6. Mitigate an toàn: giảm traffic, rollback/roll-forward, scale hoặc restart có điều kiện.
7. Verify bằng user-facing check và telemetry; ghi timeline/evidence.
8. Sửa nguyên nhân hệ thống và test failure, không dừng ở “restart là hết”.

## Lab

Chạy script read-only phù hợp hệ điều hành:

~~~powershell
.\lab\system-audit.ps1
~~~

~~~bash
chmod +x lab/system-audit.sh
./lab/system-audit.sh
~~~

Sau đó trên Linux sandbox:

1. Tạo service HTTP chạy bằng user riêng và unit mẫu.
2. Cố ý gây bốn lỗi: sai permission, port conflict, hết inode giả lập trong filesystem nhỏ,
   và memory limit/OOM.
3. Với mỗi lỗi, viết symptom, ba hypothesis, lệnh lấy evidence, mitigation và fix.
4. Gửi SIGTERM dưới load; chứng minh request đang xử lý hoàn tất trước timeout.
5. Chạy service hai lần/reboot; trạng thái không phụ thuộc thao tác tay.

## Hoàn thành D02 khi

- Phân biệt disk full với inode full và tìm deleted-open file.
- Giải thích load average, page cache, OOM và file descriptor.
- Tạo service least-privilege có restart/stop semantics rõ.
- Debug được bốn failure bằng evidence và có runbook.
- Không dùng reboot/chmod 777/SIGKILL như phản xạ đầu tiên.

Nguồn: [Linux kernel admin guide](https://www.kernel.org/doc/html/latest/admin-guide/),
[systemd manuals](https://www.freedesktop.org/software/systemd/man/latest/) và
[Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html).

Tiếp theo: [D03 - Networking, DNS, HTTP và TLS](../03-networking-dns-http-tls/README.md).
