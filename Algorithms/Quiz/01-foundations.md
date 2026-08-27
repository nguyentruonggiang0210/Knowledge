# Quiz 01 — Foundations

**Thời gian:** 90 phút · **Tổng:** 100 điểm · **Không mở:** `answer-key.md`

Ghi đáp án MCQ, bảng trace và code C# vào file/giấy riêng. Với mọi câu coding, nêu time/space complexity và ít nhất 4 test trước khi chạy.

## Phần A — Multiple choice (F01–F16, mỗi câu 2 điểm)

Mỗi câu chọn đúng một đáp án **và viết một câu giải thích**; chỉ khoanh đáp án không nhận điểm theo rubric chung.

### F01. Big-O của vòng lặp

```csharp
for (int i = n; i > 1; i /= 2)
    for (int j = 0; j < n; j++)
        count++;
```

Với `n > 1`, time complexity chặt nhất là:

A. `O(log n)`  
B. `O(n)`  
C. `O(n log n)`  
D. `O(n²)`

### F02. Amortized analysis

Thao tác thêm vào cuối một dynamic array như `List<int>` (không vượt giới hạn bộ nhớ) có độ phức tạp nào?

A. Luôn `O(1)` worst-case  
B. `O(1)` amortized, một số lần resize là `O(n)`  
C. Luôn `O(log n)`  
D. `O(n)` amortized

### F03. Hash table

Phát biểu đúng nhất về `Dictionary<TKey,TValue>` là:

A. Lookup luôn `O(1)` trong mọi trường hợp  
B. Lookup expected/amortized thường `O(1)`, nhưng worst-case có thể `O(n)`  
C. Lookup luôn `O(log n)` vì key được sắp xếp  
D. Lookup không phụ thuộc chất lượng hash function

### F04. Array

Chèn một phần tử vào chỉ số `0` của array đặc kích thước `n`, giả sử đã có chỗ trống, cần:

A. `O(1)` time, `O(1)` space  
B. `O(log n)` time  
C. `O(n)` time do phải dịch phần tử  
D. `O(n²)` time

### F05. Two pointers

Với array số nguyên **đã tăng dần**, cần tìm hai số có tổng bằng target. Cách tối ưu thông thường là:

A. Hai vòng lặp, `O(n²)`  
B. Hai con trỏ ở hai đầu, `O(n)` time và `O(1)` extra space  
C. Sort lại rồi DFS  
D. Sliding window luôn đúng kể cả số âm

### F06. Sliding window

Vì sao bài “độ dài nhỏ nhất của subarray có tổng ≥ target” thường dùng sliding window tuyến tính khi mọi phần tử **dương**?

A. Tổng cửa sổ chỉ biến đổi theo hướng dự đoán được khi mở rộng/thu hẹp  
B. Array dương luôn đã được sắp xếp  
C. Hashing không dùng được với số dương  
D. Sliding window thử mọi subarray

### F07. Linked list cycle

Floyd slow/fast pointer phát hiện chu trình trong singly linked list với:

A. `O(n)` time, `O(1)` extra space  
B. `O(n²)` time, `O(1)` space  
C. `O(n)` time, `O(n)` space bắt buộc  
D. `O(log n)` time

### F08. Monotonic stack

Để tìm “next greater element” cho mọi phần tử trong `O(n)`, stack thường duy trì:

A. Chỉ số chưa có đáp án theo thứ tự giá trị giảm dần  
B. Mọi phần tử đã sort tăng dần  
C. Prefix sum  
D. Hai queue cân bằng

### F09. Queue bằng hai stack

Queue dùng một stack nhận (`in`) và một stack xuất (`out`), chỉ chuyển khi `out` rỗng, có `Enqueue`/`Dequeue`:

A. Cả hai luôn worst-case `O(1)`  
B. Amortized `O(1)` mỗi thao tác; một lần `Dequeue` có thể `O(n)`  
C. `O(log n)` mỗi thao tác  
D. `O(n)` amortized mỗi thao tác

### F10. Binary search boundary

`lower_bound(target)` trên array tăng dần trả về:

A. Phần tử cuối cùng `< target`  
B. Chỉ số đầu tiên có giá trị `>= target`, hoặc `n` nếu không có  
C. Bất kỳ chỉ số có giá trị bằng target  
D. Chỉ số cuối cùng `<= target`

### F11. Stable sorting

Trong các thuật toán chuẩn dưới đây, thuật toán nào vốn có thể stable theo cách cài đặt điển hình?

A. Heap sort  
B. In-place selection sort  
C. Merge sort  
D. In-place quicksort

### F12. Lower bound của comparison sort

Trong mô hình chỉ so sánh, mọi thuật toán sort tổng quát có lower bound worst-case:

A. `Ω(n)`  
B. `Ω(log n)`  
C. `Ω(n log n)`  
D. `Ω(n²)`

### F13. Bit manipulation

Với số nguyên dương `x`, biểu thức `x & (x - 1)`:

A. Bật bit 0 thấp nhất  
B. Xóa bit `1` thấp nhất  
C. Đảo mọi bit  
D. Dịch phải một bit

### F14. Intervals

Bước đầu phổ biến để merge tất cả interval giao nhau là:

A. Sort theo `start` tăng dần  
B. Sort theo độ dài giảm dần  
C. Đưa tất cả vào hash set  
D. Chạy binary search trên từng endpoint

### F15. Kadane

Để Kadane trả đúng với array toàn số âm, nên:

A. Khởi tạo `best = 0` và luôn cho phép subarray rỗng  
B. Khởi tạo từ phần tử đầu (hoặc `-∞`) và yêu cầu subarray không rỗng  
C. Xóa mọi số âm trước  
D. Sort array trước

### F16. String trong C#

Phát biểu đúng về `string[i]` trong C#/.NET là:

A. Luôn trả về một Unicode grapheme hoàn chỉnh  
B. Trả về một byte UTF-8  
C. Trả về một UTF-16 code unit (`char`); một Unicode scalar có thể cần surrogate pair  
D. Time complexity luôn phụ thuộc độ dài chuỗi

## Phần B — Trace và giải thích (F17–F24, mỗi câu 4 điểm)

### F17. Two Sum bằng hash map

Trace từng bước với `nums = [2, 7, 11, 15]`, `target = 9`. Ở mỗi chỉ số, ghi `need`, trạng thái map **trước** khi insert, và thời điểm trả kết quả. Giải thích vì sao nên kiểm tra complement trước khi insert phần tử hiện tại.

### F18. Sliding window có duplicate

Trace thuật toán longest substring without repeating characters trên `s = "abba"`. Ghi `left`, `right`, ký tự, `lastSeen` và `best` sau mỗi bước. Giải thích vì sao khi gặp ký tự cũ cần dùng:

```text
left = max(left, lastSeen[c] + 1)
```

thay vì gán trực tiếp.

### F19. Reverse linked list

Với `1 -> 2 -> 3 -> null`, trace ba biến `prev`, `current`, `next` sau từng vòng lặp của thuật toán đảo list iterative. Head cuối là node nào? Nêu loop invariant.

### F20. MinStack

Thiết kế stack hỗ trợ `Push`, `Pop`, `Top`, `GetMin` đều `O(1)`. Trace min sau chuỗi:

```text
Push(3), Push(5), Push(2), Push(2), Pop(), Pop(), GetMin()
```

Giải thích cách xử lý hai giá trị minimum bằng nhau.

### F21. Lower bound

Trace binary search trên khoảng nửa mở `[lo, hi)` để tìm chỉ số đầu tiên `>= 2` trong `[1, 2, 2, 2, 4]`. Ghi `(lo, hi, mid, a[mid])` mỗi vòng và nêu invariant của hai phía.

### F22. Merge step

Merge hai nửa đã sort `[1, 4, 7]` và `[2, 2, 6]`. Ghi output sau từng lần chọn, số phép so sánh giữa phần tử hai nửa, và giải thích điều kiện chọn bên trái khi bằng nhau để giữ tính stable.

### F23. Kadane trace

Với `[-2, 1, -3, 4, -1, 2, 1, -5, 4]`, lập bảng `i`, `bestEndingHere`, `bestSoFar`. Trả về tổng lớn nhất và đoạn chỉ số tương ứng.

### F24. XOR cancellation

Array `[4, 1, 2, 1, 2]` chứa đúng một số xuất hiện một lần, các số khác xuất hiện hai lần. Trace accumulator XOR và giải thích bằng ba tính chất đại số vì sao kết quả đúng.

## Phần C — Coding (F25–F28, mỗi câu 9 điểm)

### F25. Longest substring without repeats

```csharp
int LengthOfLongestSubstring(string s)
```

Trả về độ dài lớn nhất của substring không có UTF-16 `char` lặp lại.

- `0 <= s.Length <= 200_000`.
- Mục tiêu: `O(n)` time.
- Ví dụ: `"abcabcbb" -> 3`, `"bbbbb" -> 1`, `"" -> 0`, `"abba" -> 2`.
- Follow-up: nếu yêu cầu theo Unicode scalar thay vì `char`, thiết kế thay đổi thế nào?

### F26. LRU Cache

```csharp
sealed class LruCache
{
    public LruCache(int capacity);
    public int Get(int key);       // -1 nếu không tồn tại
    public void Put(int key, int value);
}
```

`Get` và `Put` phải `O(1)` expected. Khi đầy, xóa key ít được dùng gần đây nhất. `Put` cập nhật key hiện có cũng làm key đó thành gần đây nhất. `1 <= capacity <= 100_000`.

Dry-run bắt buộc: capacity `2`; `Put(1,1)`, `Put(2,2)`, `Get(1)`, `Put(3,3)`, `Get(2)`, `Put(1,10)`, `Get(1)`.

### F27. First and last position

```csharp
int[] SearchRange(int[] nums, int target)
```

Array tăng không giảm. Trả `[first,last]` của target, hoặc `[-1,-1]`.

- `0 <= nums.Length <= 1_000_000`.
- Mục tiêu: `O(log n)` time, `O(1)` extra space.
- Ví dụ: `[5,7,7,8,8,10], 8 -> [3,4]`; `[], 1 -> [-1,-1]`.
- Không cộng `target + 1` nếu cách đó có thể overflow; hãy dùng boundary predicate an toàn.

### F28. Merge intervals

```csharp
int[][] Merge(int[][] intervals)
```

Mỗi interval đóng `[start,end]`, `start <= end`. Merge cả các interval chạm nhau tại endpoint.

- `0 <= intervals.Length <= 200_000`.
- Endpoint nằm trong toàn miền `int`.
- Mục tiêu: `O(n log n)` time do sort, không sửa các inner array của input.
- Ví dụ: `[[1,3],[2,6],[8,10],[10,18]] -> [[1,6],[8,18]]`.
- Test thêm duplicate, interval bị chứa hoàn toàn, input rỗng và endpoint `int.MinValue`/`int.MaxValue`.

## Phiếu tự nộp

- Điểm MCQ: `/32`
- Điểm trace/giải thích: `/32`
- Điểm coding: `/36`
- Tổng: `/100`
- Câu cần retest sau 48 giờ:
- Hai lỗi có khả năng lặp lại trong phỏng vấn:
