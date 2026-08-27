# DevOps Investigation Cheatsheet

Không paste lệnh mù vào production. Trước hết xác định environment, quyền, scope, dữ liệu
nhạy cảm và side effect. Cheatsheet giúp nhớ điểm bắt đầu, không thay runbook.

## Triage loop

~~~text
Symptom/user impact/time/scope
-> recent change and dependency
-> hypotheses ordered by likelihood and blast radius
-> query one layer, preserve evidence
-> smallest safe mitigation
-> verify user and data outcome
-> root/system fix, reconcile and learn
~~~

## Linux

~~~bash
uptime
ps -eo pid,ppid,user,stat,%cpu,%mem,cmd --sort=-%cpu
systemctl status <service>
journalctl -u <service> --since "-30 min"
df -h
df -i
free -h
vmstat 1
iostat -xz 1
ss -lntup
lsof +L1
journalctl -k | grep -i -E "oom|killed|error"
timedatectl
~~~

Hỏi: CPU, memory/page/OOM, disk/inode/deleted-open, I/O, fd, time, permission, process/signal
hay dependency?

## Windows/PowerShell

~~~powershell
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
Get-Service
Get-WinEvent -LogName System -MaxEvents 50
Get-Volume
Get-NetIPConfiguration
Get-NetRoute
Get-NetTCPConnection -State Listen
Test-NetConnection example.com -Port 443 -InformationLevel Detailed
Resolve-DnsName example.com
~~~

## Network, DNS, HTTP và TLS

~~~bash
ip addr
ip route
ip neigh
dig +trace example.com
dig @1.1.1.1 example.com A
tracepath example.com
curl -v --connect-timeout 3 --max-time 10 https://example.com/health
openssl s_client -connect example.com:443 -servername example.com -showcerts
tcpdump -ni any 'host 192.0.2.10 and port 443'
~~~

Đi theo DNS → address/route/NAT/return → policy → TCP/QUIC → TLS/SNI → HTTP/proxy → app/data.
Packet capture có thể chứa secret/PII.

## Git

~~~bash
git status
git diff
git diff --cached
git log --oneline --graph --decorate --all
git switch -c <branch>
git add -p
git fetch --prune
git rebase origin/main
git revert <shared-commit>
git reflog
git bisect start
~~~

Xem diff trước restore/reset; dùng revert cho shared history; rotate credential nếu từng commit.

## Script/API

Checklist: validate input, literal path, stdout/stderr, exit code, timeout/deadline, bounded
retry + backoff/jitter, pagination, 429/Retry-After, idempotency, lock/concurrency, checkpoint,
structured log/redaction, dry-run/test/cleanup.

~~~bash
curl --fail --silent --show-error \
  --connect-timeout 3 --max-time 10 \
  -H 'Accept: application/json' https://api.example.invalid/health
~~~

## Docker

~~~bash
docker build -t devops-demo:local .
docker run --rm --read-only --cap-drop ALL --memory 128m devops-demo:local
docker ps --no-trunc
docker inspect <container>
docker logs --since 10m <container>
docker stats
docker history --no-trunc <image>
docker image inspect <image> --format '{{json .RepoDigests}}'
docker compose up -d
docker compose down
~~~

Kiểm PID1/signal, user/capability/seccomp, image digest/layer/secret, network/volume, OOM/throttle.

## Kubernetes

~~~bash
kubectl get deploy,rs,pod,svc,endpointslice -A -o wide
kubectl describe pod -n <namespace> <pod>
kubectl logs -n <namespace> <pod> --previous
kubectl get events -n <namespace> --sort-by=.lastTimestamp
kubectl top pod -n <namespace>
kubectl auth can-i -n <namespace> --as=<principal> <verb> <resource>
kubectl rollout status -n <namespace> deployment/<name>
kubectl rollout history -n <namespace> deployment/<name>
kubectl diff -k <path>
kubectl explain deployment.spec.template.spec
~~~

Pending → scheduling/PVC; ImagePull → image/auth; CrashLoop → command/config/permission/probe;
Service → selector/EndpointSlice/port/readiness/policy; OOM → limit/workload.

## Terraform

~~~bash
terraform fmt -check -recursive
terraform init
terraform validate
terraform test
terraform plan -out=tfplan
terraform show tfplan
terraform state list
terraform providers
terraform graph
~~~

Plan/state có thể chứa secret. State/force-unlock/target/import/refactor cần theo
[Terraform lessons](../Lessions/README.md); không commit tfplan/state.

## PostgreSQL

~~~sql
SELECT now(), pg_is_in_recovery();
SELECT pid, state, wait_event_type, wait_event, query_start
FROM pg_stat_activity
ORDER BY query_start;

SELECT locktype, mode, granted, pid
FROM pg_locks
WHERE NOT granted;
~~~

Kiểm pool, lock, query plan, replication lag, disk/WAL và business invariant. Không kill query
hay chạy DDL trước khi hiểu transaction/impact.

## Observability/SRE

- RED: rate, errors, duration.
- USE: utilization, saturation, errors.
- SLI = good/valid events; error budget = 1 - SLO.
- Correlate version/deploy → SLO → trace → log → resource/data.
- Page theo user symptom/burn, có owner/runbook; ticket cho việc không urgent.
- Kiểm dropped telemetry, collector queue/export error và cardinality.

## Incident update

~~~text
Time UTC:
Severity/status:
User/business/data impact:
Known/unknown:
Mitigation and result:
Next actions/risks:
Next update:
~~~

Ghi exact command/change/result, một Incident Commander, hypothesis/evidence. Restore rồi
validate user/data; emergency change phải reconcile.

## Backup/DR

- RTO/RPO và recovery point đã được business duyệt?
- Backup/version/key ở failure scope khác?
- Restore clean-room và integrity/reconciliation?
- Identity/DNS/certificate/quota/dependency hoạt động?
- Traffic cutover/session/cache?
- New writes và failback/resync/conflict?
- Actual time/data loss so với target, owner cho gap?

## Safety stop conditions

Dừng/escalate khi target/environment không chắc, command mở rộng ngoài scope, không có backup/
recovery cho destructive data change, credential/PII xuất hiện, SLO đang cháy mạnh, quorum/
fencing không rõ, hoặc người thực hiện không có authority.
