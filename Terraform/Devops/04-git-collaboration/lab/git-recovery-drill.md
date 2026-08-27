# Git recovery drill

Thực hiện trong repository tạm mới, không dùng repository công việc.

## 1. Object graph và branch

~~~bash
git init
git config user.name "DevOps Learner"
git config user.email "learner@example.invalid"
printf 'v1\n' > app.txt
git add app.txt
git commit -m "feat: initial app"
git switch -c feature
printf 'feature\n' >> app.txt
git commit -am "feat: add feature"
git switch -
git switch -c hotfix
printf 'hotfix\n' >> fix.txt
git add fix.txt
git commit -m "fix: urgent correction"
git log --oneline --graph --decorate --all
~~~

Vẽ commit/tree/branch/HEAD trước khi merge.

## 2. Conflict

Trên hai branch, sửa cùng dòng app.txt theo hai intent khác nhau. Merge, đọc ba phía, tạo
kết quả đúng, chạy một test tự viết rồi commit. Thử git merge --abort trong một lần khác.

## 3. Regression và bisect

Tạo ít nhất năm commit; một commit đổi expected content. Viết script trả 0 khi đúng, 1 khi
sai. Dùng:

~~~bash
git bisect start
git bisect bad
git bisect good <known-good-commit>
git bisect run <your-test-command>
git bisect reset
~~~

Revert bad commit và giải thích vì sao không reset shared history.

## 4. Reflog

Tạo commit trên branch tạm, ghi hash, xóa branch, chuyển sang branch khác. Tìm lại bằng
git reflog và tạo branch recovery trỏ tới commit đó. Không dựa vào reflog như backup dài hạn.

## 5. Release và review

- Tạo annotated tag v1.0.0.
- Thêm backward-compatible feature và tag v1.1.0.
- Mô tả change nào bắt buộc v2.0.0.
- Viết PR description gồm intent, test, risk, rollout và recovery.
- Nhờ người khác review hoặc tự review lần hai dựa trên diff, không chỉ commit message.

## Evidence

Lưu graph trước/sau, bisect output, reflog recovery, release notes và review checklist.
Không lưu credential, remote token hoặc dữ liệu thật.
