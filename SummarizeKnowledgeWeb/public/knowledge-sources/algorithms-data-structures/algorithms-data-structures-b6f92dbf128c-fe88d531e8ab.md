# Quiz 05 — Advanced Coverage Checkpoint

Quiz này lấp các chủ đề không được kiểm tra sâu trong Quiz 01–03. Làm **closed-book**, không mở `answer-key.md`. Tổng điểm: **100**. Thời gian gợi ý: 110 phút.

## Phần A — Nhận diện và trade-off (AC01–AC12, mỗi câu 2 điểm)

Chọn một đáp án và viết thêm một câu giải thích. Theo rubric chung, chỉ khoanh mà không giải thích được 0 điểm.

### AC01. Difference array

Có mảng độ dài `n=10^7`, nhận `q=2·10^5` phép cộng `delta` lên đoạn `[l,r]`. Chỉ cần xuất mảng cuối sau toàn bộ update. Lựa chọn tốt nhất?

A. Cập nhật từng phần tử của mỗi đoạn  
B. Difference array rồi prefix một lần  
C. Binary search từng đoạn  
D. Dijkstra

### AC02. Monotonic deque

Trong Sliding Window Maximum, khi thêm `a[right]`, deque nên loại phần tử nào ở phía sau?

A. Mọi index nhỏ hơn `right-k+1`  
B. Mọi giá trị nhỏ hơn hoặc bằng `a[right]` nếu chỉ cần maximum value  
C. Mọi giá trị lớn hơn `a[right]`  
D. Luôn xóa toàn bộ deque

### AC03. Sweep line tie-break

Meeting dùng interval nửa mở `[start,end)`. Tại cùng timestamp, sự kiện nào phải xử lý trước để cuộc họp vừa kết thúc có thể nhường phòng?

A. Start `+1`  
B. End `-1`  
C. Không quan trọng  
D. Event có duration dài hơn

### AC04. All-pairs shortest path

Graph directed dày, `V=350`, có cạnh âm nhưng không có negative cycle; cần distance mọi cặp. Lựa chọn trực tiếp phù hợp nhất?

A. DFS từ mọi node  
B. Dijkstra một lần  
C. Floyd–Warshall  
D. Union-Find

### AC05. 0–1 BFS

Graph chỉ có edge weight `0` hoặc `1`. Khi relax thành công edge weight `0`, node được đưa vào đâu?

A. Cuối deque  
B. Đầu deque  
C. Stack khác  
D. Không enqueue

### AC06. Fenwick Tree

Fenwick Tree chuẩn phù hợp trực tiếp nhất với contract nào?

A. Point add + prefix/range sum  
B. Xóa arbitrary edge khỏi graph  
C. Exact string search  
D. Range mode query tổng quát

### AC07. Segment Tree

Điều kiện quan trọng của phép `combine` trong segment tree là:

A. Luôn commutative  
B. Associative để ghép các đoạn theo grouping khác nhau  
C. Luôn dùng phép cộng  
D. Có inverse

### AC08. SCC

Sau khi co mỗi strongly connected component của directed graph thành một node, graph kết quả luôn là:

A. Complete graph  
B. Tree  
C. DAG  
D. Undirected graph

### AC09. Bridge

Trong undirected DFS tree, tree edge `(u,v)` là bridge theo điều kiện nào?

A. `low[v] > discovery[u]`  
B. `low[v] == 0`  
C. `degree[v] == 1` trong mọi trường hợp  
D. `discovery[v] < discovery[u]`

### AC10. Bipartite

Một undirected graph là bipartite khi và chỉ khi:

A. Không có cycle  
B. Mọi degree chẵn  
C. Không có odd cycle  
D. Liên thông

### AC11. Sieve

Vì sao khi xử lý prime `p` trong Sieve of Eratosthenes có thể bắt đầu đánh dấu từ `p²`?

A. Các bội nhỏ hơn `p²` đã có prime factor nhỏ hơn `p` đánh dấu  
B. `p²` luôn là prime  
C. Để giảm memory xuống `O(1)`  
D. Chỉ số mảng bắt đầu ở 1

### AC12. Reservoir sampling

Ở item thứ `i` của stream (đếm từ 1), reservoir sampling `k=1` thay sample hiện tại với xác suất:

A. `1/2`  
B. `1/i`  
C. `i/n`, cần biết trước `n`  
D. `1/log i`

## Phần B — Trace, invariant và tìm bug (AC13–AC20, mỗi câu 4 điểm)

### AC13. Difference array trace

Mảng ban đầu `[0,0,0,0,0]`. Thực hiện add `+3` lên `[1,3]` và add `-2` lên `[2,4]` (đều inclusive). Viết difference array sau khi ghi cả hai update và mảng cuối sau prefix sum. Sau đó dựng static prefix `prefix[0]=0` cho mảng cuối và trả range sum `[1,4)` bằng hiệu hai prefix.

### AC14. Monotonic deque trace

Với `a=[1,3,-1,-3,5,3,6,7]`, `k=3`, ghi deque **index** sau mỗi `right` và output maximum khi window đủ lớn. Nêu hai invariant của deque.

### AC15. Floyd–Warshall trace

Ban đầu `d[0,2]=10`, `d[0,1]=3`, `d[1,2]=4`. Khi cho phép node `1` làm intermediate, `d[0,2]` thành bao nhiêu? Viết recurrence tổng quát và guard cần có khi dùng sentinel infinity để tránh overflow.

### AC16. Fenwick indexes

Fenwick length 8, API ngoài 0-based nhưng tree trong 1-based. Với `Add(2,+5)`, liệt kê các cell `tree[]` được cập nhật. `RangeSum(2,5)` theo quy ước `[left,right)` được tính từ hai prefix nào?

### AC17. Segment Tree bug

Một implementation query dùng đoạn inclusive `[l,r]`, nhưng caller truyền `[l,r)` mà không chuyển đổi. Cho ví dụ nhỏ chứng minh sai và nêu một cách thiết kế API để loại lỗi này.

### AC18. Low-link

Undirected graph có edges `0-1, 1-2, 2-0, 1-3`. Chọn root DFS `0`, neighbor theo thứ tự tăng dần. Edge nào là bridge? Giải thích bằng `discovery/low`, không chỉ nhìn hình.

### AC19. Modular arithmetic

Trong C#, `-3 % 5` cho kết quả gì? Viết biểu thức normalize vào `[0,modulus)` và giải thích vì sao `(a*b)%modulus` vẫn có thể sai dù `a,b,modulus` đều là `long`.

### AC20. RandomizedSet bug

Khi remove value tại index `i`, code ghi phần tử cuối vào `items[i]` rồi `RemoveAt(last)`, nhưng không cập nhật dictionary của phần tử vừa swap. Cho một chuỗi thao tác làm lỗi lộ ra, nêu invariant phải giữ và bản sửa `O(1)` expected.

## Phần C — Coding (AC21–AC24, mỗi câu 11 điểm)

Mỗi bài được chấm: làm rõ contract 1đ, approach/invariant 2đ, correctness 4đ, complexity 1đ, edge tests 2đ, giao tiếp 1đ.

### AC21. Range Addition

```csharp
long[] ApplyRangeAdds(int length, IList<(int Left, int Right, long Delta)> updates)
```

`Left/Right` inclusive, `length >= 0`; validate bounds và không mutate input. Mục tiêu `O(length + updates.Count)` time, `O(length)` output/auxiliary. Test: length 0, update phủ toàn mảng, overlap, delta âm, tổng vượt `int`.

### AC22. Zero-One Shortest Paths

```csharp
long[] ZeroOneBfs(IReadOnlyList<(int To, int Weight)>[] graph, int source)
```

Weight chỉ là 0/1; reject weight khác. Node unreachable trả `long.MaxValue`. Mục tiêu `O(V+E)` time. Nêu cách tránh xử lý entry cũ hoặc chứng minh mỗi relax được quản lý đúng.

### AC23. Mutable Range Sum

Thiết kế một trong hai API sau và tự cài, không dùng package ngoài:

```csharp
sealed class Fenwick
{
    public Fenwick(int length);
    public void Add(int index, long delta);
    public long Sum(int leftInclusive, int rightExclusive);
}
```

hoặc Segment Tree có `Set(index,value)` và `Sum(leftInclusive,rightExclusive)`. Mỗi operation `O(log n)`, memory `O(n)`. Test length 0, single item, full range, repeated update, invalid range.

### AC24. Critical Connections

```csharp
IList<(int U, int V)> Bridges(int nodeCount, IList<(int U, int V)> edges)
```

Graph undirected, có thể disconnected; giả sử không có parallel edge/self-loop. Trả mỗi bridge với endpoint nhỏ trước, kết quả sort lexicographic. Mục tiêu `O(V+E)` trước bước sort output. Phải giải thích `discovery` và `low`, và cảnh báo recursion depth trên .NET.

## Cổng phủ bắt buộc — không cộng vào 100 điểm

Ba câu `CG` là pass/fail để xác nhận các lesson có pattern riêng không bị che bởi điểm tổng. Muốn công nhận Quiz 05 đạt, phải đúng **3/3** ngoài điều kiện tổng điểm.

### CG01. Static Prefix Sum

Với `a=[-2,4,1,-3,5]`, dựng prefix length 6 theo quy ước `prefix[i] = sum(a[0..i))`. Dùng đúng hai cell prefix để tính tổng `[1,4)`. Nêu build time, query time và vì sao `long` có thể cần thiết.

### CG02. Grid DP

Cho cost grid `[[1,3,1],[1,5,1],[4,2,1]]`; chỉ đi phải hoặc xuống từ góc trái tới góc phải dưới. Định nghĩa `dp[r,c]`, base case, recurrence và tính minimum cost. Nếu nén còn một hàng, phải update cột theo chiều nào và vì sao?

### CG03. GCD và Fast Power

Trace Euclid cho `gcd(84,30)`, viết công thức `lcm` giảm nguy cơ overflow, rồi tính `3^13 mod 100` bằng binary exponentiation. Nêu time complexity theo exponent và rủi ro của phép nhân trước modulo.

## Phiếu tự nộp

- Điểm A: `__/24`
- Điểm B: `__/32`
- Điểm C: `__/44`
- Tổng: `__/100`
- Cổng phủ CG: `__/3` (phải đạt 3/3)
- Câu sai/chậm: `________________`
- Pattern cần ôn và ngày retest: `________________`
