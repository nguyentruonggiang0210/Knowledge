# Quiz 03 — Backtracking, Greedy, DP và String Algorithms

**Thời gian:** 120 phút · **Tổng:** 120 điểm · **Không mở:** `answer-key.md`

Với câu DP, bắt buộc viết state definition, base case, transition và thứ tự tính. Với greedy, bắt buộc nêu proof idea hoặc counterexample.

## Phần A — Multiple choice (DA01–DA16, mỗi câu 2 điểm)

Mỗi câu chọn đúng một đáp án **và viết một câu giải thích**; chỉ khoanh đáp án không nhận điểm theo rubric chung.

### DA01. Recursion

Một recursive algorithm đúng cần base case chủ yếu để:

A. Tăng branching factor  
B. Bảo đảm tiến tới trạng thái dừng  
C. Loại bỏ mọi auxiliary space  
D. Tự động memoize

### DA02. Backtracking invariant

Trong mẫu `choose -> explore -> unchoose`, bước `unchoose` có mục đích:

A. Sort kết quả  
B. Khôi phục shared state cho nhánh kế tiếp  
C. Giảm mọi bài xuống `O(n)`  
D. Thay thế base case

### DA03. Duplicate permutations

Với array đã sort và mảng `used`, điều kiện skip phổ biến để sinh unique permutations là:

A. Bỏ mọi phần tử giống phần tử trước  
B. Nếu `a[i] == a[i-1]` và `used[i-1] == false`, bỏ `i` ở cùng level  
C. Nếu `used[i-1] == true`, luôn bỏ `i`  
D. Chỉ dùng hash của permutation sau khi sinh toàn bộ

### DA04. Greedy proof

Exchange argument thường chứng minh:

A. Mọi local choice đều tối ưu cho mọi bài  
B. Một nghiệm tối ưu có thể biến đổi để chứa greedy choice mà không xấu hơn  
C. DP không bao giờ cần thiết  
D. Greedy luôn có `O(1)` space

### DA05. Interval scheduling

Để chọn nhiều interval không overlap nhất (unweighted), greedy đúng là sort theo:

A. Start sớm nhất  
B. Độ dài ngắn nhất  
C. Finish sớm nhất  
D. Profit lớn nhất

### DA06. Coin change

Với coins `{1,3,4}`, target `6`, lấy coin lớn nhất trước:

A. Luôn tối ưu với 2 coin  
B. Cho 3 coin (`4+1+1`), trong khi tối ưu là 2 (`3+3`)  
C. Không tìm được nghiệm  
D. Tương đương BFS trên mọi hệ coin

### DA07. Memoization complexity

Ước lượng time của top-down DP thường bằng:

A. Số state duy nhất × chi phí transition mỗi state  
B. Chỉ recursion depth  
C. Luôn `2^n`  
D. Kích thước output bất kể state

### DA08. 0/1 knapsack

Khi tối ưu space xuống `dp[capacity]`, phải duyệt capacity:

A. Tăng dần để dùng item nhiều lần  
B. Giảm dần để item hiện tại không bị tái sử dụng  
C. Thứ tự nào cũng được  
D. Ngẫu nhiên

### DA09. Unbounded knapsack

Nếu mỗi item được dùng không giới hạn, với DP một chiều thường duyệt capacity:

A. Tăng dần để state hiện tại có thể tái dùng item  
B. Giảm dần bắt buộc  
C. Không cần loop capacity  
D. Chỉ các capacity nguyên tố

### DA10. LIS `O(n log n)`

Array `tails` trong thuật toán patience sorting:

A. Luôn chính là một LIS hợp lệ hoàn chỉnh  
B. Lưu tail nhỏ nhất có thể cho subsequence của từng độ dài; `tails.Length` là độ dài LIS  
C. Là prefix sum  
D. Chỉ đúng khi input không duplicate

### DA11. LCS state

State chuẩn `dp[i,j]` cho LCS thường biểu diễn:

A. Số substring chung  
B. Độ dài LCS của hai prefix có độ dài `i` và `j`  
C. Edit distance của hai suffix bắt buộc  
D. Số permutation

### DA12. Edit distance

Levenshtein distance chuẩn cho phép mỗi bước:

A. Chỉ swap hai ký tự kề nhau  
B. Insert, delete hoặc replace một ký tự  
C. Chỉ delete  
D. Reverse substring miễn phí

### DA13. Kadane recurrence

Với subarray không rỗng, recurrence đúng là:

A. `end[i] = max(a[i], end[i-1] + a[i])`  
B. `end[i] = min(a[i], end[i-1])`  
C. `end[i] = prefix[i] * prefix[i-1]`  
D. `end[i] = max(end[i-1], 0)` và bỏ `a[i]`

### DA14. KMP

Mảng LPS của KMP giúp:

A. Hash toàn bộ text  
B. Khi mismatch, tái dùng độ dài prefix cũng là suffix để không đọc lại text  
C. Sort pattern  
D. Bảo đảm `O(1)` space

### DA15. Rabin–Karp

Khi rolling hash của window bằng hash pattern, implementation đúng cần:

A. Kết luận match ngay trong mọi trường hợp  
B. Verify ký tự để loại hash collision (trừ khi chấp nhận xác suất)  
C. Reset hash về 0  
D. Sort window

### DA16. Bitmask enumeration

Enumerate mọi subset của tập `n` phần tử bằng mask từ `0` tới `(1<<n)-1` có:

A. `n` subset  
B. `n²` subset  
C. `2^n` subset  
D. `log n` subset

## Phần B — Trace và giải thích (DA17–DA26, mỗi câu 4 điểm)

### DA17. Subsets recursion tree

Với `[1,2,3]`, dùng DFS tại mỗi phần tử theo thứ tự nhánh **không chọn trước, chọn sau**. Liệt kê output đúng thứ tự DFS và số node/leaf trong recursion tree. Nêu time/space bao gồm kích thước output.

### DA18. Unique permutations

Sinh mọi permutation duy nhất của `[1,1,2]`. Trace `path` và `used` ở level đầu, liệt kê output, và giải thích chính xác điều kiện skip duplicate không làm mất nghiệm.

### DA19. Greedy counterexample

Dùng coins `{1,3,4}`, target `6` để bác bỏ chiến lược “luôn lấy coin lớn nhất có thể”. Một counterexample hợp lệ cần chỉ ra những gì? Đề xuất state và transition DP đúng.

### DA20. Interval scheduling trace

Các half-open interval: `(1,3)`, `(2,5)`, `(4,7)`, `(6,9)`, `(8,10)`. Trace greedy finish-time: thứ tự sau sort, interval được chọn/bỏ, giá trị `lastEnd`, và số interval tối đa.

### DA21. House Robber 1D DP

Với `[2,7,9,3,1]`, định nghĩa `dp[i]`, lập bảng và reconstruct các index được chọn. Sau đó tối ưu xuống hai biến và nêu invariant của chúng.

### DA22. Coin Change DP

Với coins `[1,3,4]`, amount `6`, lập `dp[0..6]` là số coin ít nhất. Ghi giá trị sau khi xét đủ mọi coin cho từng amount, nghiệm cuối và một tổ hợp tối ưu. Vì sao sentinel phải tránh overflow khi cộng 1?

### DA23. 0/1 knapsack direction

Capacity `5`; items `(weight,value)` là `(2,3)`, `(3,4)`, `(4,5)`. Trace mảng `dp[0..5]` sau từng item khi duyệt capacity giảm dần. Nghiệm tối ưu là gì? Cho counterexample cho việc duyệt tăng dần trong 0/1.

### DA24. LIS tails

Trace `tails` sau từng số trong `[10,9,2,5,3,7,101,18]`, dùng lower bound phần tử đầu tiên `>= x`. Trả độ dài LIS và nêu một LIS thực tế. Giải thích vì sao nội dung `tails` cuối không nhất thiết là subsequence của input trong mọi trường hợp.

### DA25. LCS 2D

Với `a = "abcde"`, `b = "ace"`, định nghĩa `dp[i,j]`, viết base case và hai nhánh transition. Lập ma trận đầy đủ (kể cả hàng/cột 0), trả LCS length và reconstruct một LCS.

### DA26. KMP prefix table

Tính LPS cho pattern `"ababaca"`. Trace `(i, len)` khi match và mismatch, đặc biệt tại ký tự `c`. Khi mismatch trong lúc tìm text, giải thích cách dùng `lps[j-1]` thay vì tăng text index ngay.

## Phần C — Coding (DA27–DA32, mỗi câu 8 điểm)

### DA27. Combination Sum II

```csharp
IList<IList<int>> CombinationSum2(int[] candidates, int target)
```

Mỗi input element chỉ được dùng một lần; input có duplicate; output không có combination trùng và mỗi combination không giảm. Mọi số dương. Phân tích pruning sau khi sort và độ phức tạp theo output.

### DA28. Jump Game

```csharp
bool CanJump(int[] nums)
```

`nums[i]` là bước nhảy tối đa, mọi số không âm. Trả liệu có tới chỉ số cuối. Mục tiêu greedy `O(n)` time, `O(1)` space. Nêu invariant của `farthest` và thời điểm có thể kết luận thất bại/thành công.

### DA29. Word Break

```csharp
bool WordBreak(string s, IList<string> wordDict)
```

Một từ có thể dùng nhiều lần. `s` có thể rỗng; dictionary có thể chứa duplicate nhưng không chứa chuỗi rỗng. Viết DP 1D, giảm transition bằng `maxWordLength`, và phân tích chi phí substring trong .NET thay vì mặc định coi nó `O(1)`.

### DA30. 0/1 Knapsack

```csharp
long Knapsack01(int[] weights, int[] values, int capacity)
```

Mỗi item dùng tối đa một lần; `weights[i] > 0`, value có thể âm, capacity không âm. Có thể chọn rỗng. Dùng `O(capacity)` space, tránh dùng một item nhiều lần, và nói khi nào cách này không khả thi vì capacity quá lớn.

### DA31. Longest Increasing Subsequence

```csharp
int LengthOfLIS(int[] nums)
```

Subsequence phải strictly increasing. Mục tiêu `O(n log n)` time, `O(n)` space. Tự cài lower bound, test duplicate và array giảm dần. Follow-up: muốn reconstruct LIS thì cần thêm metadata gì?

### DA32. KMP substring search

```csharp
int StrStrKmp(string text, string pattern)
```

Trả index match đầu tiên, `-1` nếu không có; pattern rỗng trả `0`. Mục tiêu `O(n+m)` time. Không dùng `IndexOf`. Test overlap (`"aaaaa","aaa"`), fallback nhiều lần và pattern dài hơn text.

## Phiếu tự nộp

- Điểm MCQ: `/32`
- Điểm trace/giải thích: `/40`
- Điểm coding: `/48`
- Tổng: `/120`
- Câu cần retest sau 48 giờ:
- DP state hoặc greedy proof tôi diễn đạt chưa rõ:
