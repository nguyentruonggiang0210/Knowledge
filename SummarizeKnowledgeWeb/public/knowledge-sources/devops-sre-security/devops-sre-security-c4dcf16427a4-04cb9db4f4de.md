# D04 - Git và collaboration

## Mục tiêu

- Hiểu object model để không sợ branch, merge, rebase và recovery.
- Tạo commit nhỏ, lịch sử rõ và pull request reviewable.
- Chọn đúng revert/reset/restore/reflog/bisect.
- Thiết kế branch protection, CODEOWNERS, release/tag và secret hygiene.

## Ba vùng và object graph

~~~mermaid
flowchart LR
  W[Working tree] -->|git add| I[Index staging]
  I -->|git commit| R[Local object database]
  R -->|git push| O[Remote refs]
  O -->|fetch| R
  R -->|restore or checkout| W
~~~

Git lưu snapshot bằng object:

- blob chứa nội dung file;
- tree ánh xạ tên tới blob/tree;
- commit trỏ tới tree, parent và metadata;
- tag có thể là reference đơn giản hoặc annotated object;
- branch là movable reference tới commit; HEAD cho biết vị trí hiện tại.

Commit hash định danh content/metadata graph, không phải “số phiên bản tăng dần”.

## Workflow hằng ngày

~~~bash
git status
git switch -c feat/health-check
git add -p
git diff --cached
git commit -m "feat: add bounded health check"
git fetch --prune
git rebase origin/main
git push -u origin feat/health-check
~~~

Trước commit: không có secret/generated artifact, test/lint đạt, diff có một intent. Trước
push/rebase shared history: hiểu policy team.

## Merge, rebase và squash

- Merge giữ topology và tạo merge commit khi lịch sử phân nhánh.
- Rebase phát lại commit trên base mới, làm đổi commit identity.
- Squash gộp nhiều commit thành một; tiện cho lịch sử nhưng mất bước trung gian.
- Không rebase lịch sử public/shared nếu không phối hợp vì người khác đang dựa vào commit cũ.
- Chọn strategy theo nhu cầu traceability/release, không tranh luận theo sở thích.

Trunk-based thường dùng branch sống ngắn, merge nhỏ và feature flag. Long-lived environment
branch dễ tạo drift; promotion nên dùng cùng artifact và environment config, không rebuild
từ branch khác.

## Undo decision table

| Tình huống | Công cụ thường phù hợp | Lưu ý |
|---|---|---|
| Bỏ thay đổi file chưa stage | git restore file | Mất thay đổi local; xem diff trước |
| Bỏ stage nhưng giữ nội dung | git restore --staged file | Working tree còn nguyên |
| Sửa commit local cuối | git commit --amend | Commit hash thay đổi |
| Hủy tác động commit đã share | git revert commit | Tạo commit ngược, audit rõ |
| Di chuyển branch local | git reset --soft/mixed/hard | hard làm mất working changes |
| Tìm commit tưởng đã mất | git reflog | Retention hữu hạn; tạo branch ngay |
| Tìm commit gây regression | git bisect | Cần test trả pass/fail tin cậy |

Không dùng force push mặc định. Nếu workflow cho phép, force-with-lease an toàn hơn force vì
nó từ chối ghi đè remote đã đổi ngoài dự kiến.

## Conflict và review

Conflict không phải Git “hỏng”; hai change chạm cùng intent. Quy trình:

1. hiểu cả base/ours/theirs và yêu cầu, không xóa marker máy móc;
2. sửa kết quả mong muốn, chạy test;
3. git diff và git status để chắc không còn marker;
4. tiếp tục merge/rebase; abort nếu assumption sai.

PR tốt có context, scope nhỏ, cách test, risk, rollout/recovery, screenshot/log đã sanitize.
Reviewer kiểm correctness, security, reliability, operability, cost và maintainability; không
chỉ format. CODEOWNERS định tuyến review nhưng không tự đảm bảo review chất lượng.

## Protected delivery

- Main không push trực tiếp; require review và status checks theo risk.
- Quyền admin/bypass/break-glass phải tối thiểu và audit.
- CI từ fork/untrusted PR không được nhận production secret.
- Tag release dùng SemVer khi contract phù hợp; annotated/signed tag tăng traceability.
- Release record nối source commit, build provenance, artifact digest và deployment.

~~~bash
git tag -s v1.2.0 -m "Release v1.2.0"
git show v1.2.0
git verify-tag v1.2.0
~~~

Chữ ký chỉ có giá trị khi verifier quản lý trust/key lifecycle đúng.

## Secret đã commit

Xóa file khỏi commit mới không xóa lịch sử hoặc clone/artifact. Hành động đúng:

1. revoke/rotate credential trước;
2. xác định exposure và audit usage;
3. dùng secret-scanning/pre-commit/CI để ngăn lặp;
4. rewrite history chỉ khi có kế hoạch phối hợp, backup và force-update rõ;
5. xem mọi bản copy cũ là đã lộ.

## Lab

Làm [Git recovery drill](lab/git-recovery-drill.md). Lab yêu cầu:

- tạo feature và hotfix song song, merge rồi rebase một branch local;
- cố ý conflict và giải bằng test;
- tạo bad commit, tìm bằng bisect và revert;
- khôi phục commit dangling qua reflog;
- phát hành v1.0.0, v1.1.0 và mô tả breaking v2.0.0;
- review một PR bằng checklist production.

## Hoàn thành D04 khi

- Vẽ được blob/tree/commit/ref/HEAD và ba vùng Git.
- Chọn đúng revert/reset/restore/reflog trong scenario.
- Bisect tự động tìm regression bằng test.
- PR/release nối được commit tới artifact và deployment.
- Biết credential rotation quan trọng hơn lịch sử “trông sạch”.

Nguồn: [Pro Git](https://git-scm.com/book/en/v2) và
[Git reference](https://git-scm.com/docs).

Tiếp theo: [D05 - Scripting và automation](../05-scripting-automation/README.md).
