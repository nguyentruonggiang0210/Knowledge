# Quiz 02 — Trees, Heaps và Graphs

**Thời gian:** 120 phút · **Tổng:** 120 điểm · **Không mở:** `answer-key.md`

Quy ước: thứ tự neighbor là thứ tự chữ cái/chỉ số tăng dần khi đề yêu cầu kết quả duy nhất. Graph có `V` đỉnh và `E` cạnh.

## Phần A — Multiple choice (TG01–TG16, mỗi câu 2 điểm)

Mỗi câu chọn đúng một đáp án **và viết một câu giải thích**; chỉ khoanh đáp án không nhận điểm theo rubric chung.

### TG01. Traversal

Preorder traversal của binary tree đi theo thứ tự:

A. Left, Root, Right  
B. Root, Left, Right  
C. Left, Right, Root  
D. Theo từng level

### TG02. BST invariant

Inorder của BST cho dãy tăng không giảm khi:

A. Mọi node có đúng hai con  
B. Quy tắc đặt duplicate được định nghĩa nhất quán với invariant BST  
C. Tree là complete  
D. Chỉ khi tree cân bằng

### TG03. Balanced BST

Lookup trong BST cân bằng có time complexity theo số node `n` là:

A. `O(1)`  
B. `O(log n)`  
C. `O(n log n)`  
D. `O(n²)`

### TG04. Trie

Lookup một từ dài `L` trong trie có độ phức tạp chủ yếu là:

A. `O(1)` tuyệt đối  
B. `O(log L)`  
C. `O(L)`  
D. `O(numberOfWords)`

### TG05. Binary heap

Insert vào binary min-heap có `n` phần tử cần:

A. `O(1)` worst-case  
B. `O(log n)` worst-case do sift-up  
C. `O(n)` bắt buộc  
D. `O(n log n)`

### TG06. K-th largest stream

Để duy trì phần tử lớn thứ `k` trong một stream, cấu trúc phù hợp là:

A. Min-heap tối đa `k` phần tử  
B. Max-heap chứa toàn bộ và sort mỗi lần  
C. Stack đơn điệu bắt buộc  
D. Union-find

### TG07. Unweighted shortest path

Đường đi ít cạnh nhất từ một nguồn trong graph không trọng số được tìm bởi:

A. DFS bất kỳ  
B. BFS  
C. Kruskal  
D. Inorder

### TG08. Directed cycle bằng DFS

Trong DFS ba màu (`white/gray/black`), cạnh từ node hiện tại tới node `gray` cho biết:

A. Luôn là cross edge vô hại  
B. Có directed cycle trong DFS đang xét  
C. Graph disconnected  
D. Đã tìm MST

### TG09. Topological order

Một directed graph có topological ordering khi và chỉ khi:

A. Nó connected  
B. Mọi trọng số dương  
C. Nó là DAG  
D. Mỗi node có indegree một

### TG10. Union-find

Với path compression và union by rank/size, chuỗi thao tác union/find có chi phí amortized gần:

A. `O(1)`, chính xác hơn là `O(α(n))`  
B. `O(log² n)`  
C. `O(n)`  
D. `O(EV)`

### TG11. Dijkstra

Dijkstra chuẩn không đảm bảo đúng khi:

A. Graph có self-loop dương  
B. Graph disconnected  
C. Có cạnh trọng số âm reachable  
D. Có nhiều đường cùng chi phí

### TG12. Bellman–Ford

Sau `V-1` vòng relax, nếu một cạnh reachable vẫn relax được ở vòng tiếp theo thì:

A. Graph chắc chắn là DAG  
B. Có negative cycle reachable từ nguồn  
C. MST không duy nhất  
D. Nguồn có indegree 0

### TG13. Kruskal

Kruskal xây MST bằng cách:

A. Sort cạnh tăng theo trọng số và lấy cạnh nối hai component khác nhau  
B. Chọn cạnh lớn nhất từ mỗi đỉnh  
C. BFS từ mọi nguồn  
D. Relax mỗi cạnh `V-1` lần

### TG14. MST uniqueness

Nếu mọi trọng số cạnh trong connected undirected graph đều khác nhau thì:

A. Không tồn tại MST  
B. MST là duy nhất  
C. Mọi spanning tree là MST  
D. Prim và Kruskal phải chọn cạnh theo cùng thứ tự

### TG15. Graph representation

DFS/BFS dùng adjacency list có time complexity:

A. `O(V)` bất kể cạnh  
B. `O(E log V)`  
C. `O(V + E)`  
D. `O(V²)` luôn luôn

### TG16. Tree như một graph

Một undirected graph connected với `V` đỉnh là tree khi nó có:

A. `V` cạnh  
B. `V - 1` cạnh (tương đương connected và acyclic)  
C. `V + 1` cạnh  
D. Mọi đỉnh degree 2

## Phần B — Trace và giải thích (TG17–TG24, mỗi câu 4 điểm)

### TG17. Bốn traversal

Cho tree:

```text
        8
      /   \
     3     10
    / \      \
   1   6      14
      / \     /
     4   7   13
```

Viết preorder, inorder, postorder và level-order. Nếu triển khai iterative, nêu cấu trúc dữ liệu cần dùng.

### TG18. Validate BST bằng bounds

Tree level-order `[5, 1, 7, null, null, 4, 8]` có phải BST không? Trace khoảng `(low, high)` truyền xuống từng node. Giải thích vì sao chỉ so node với parent là chưa đủ và vì sao bounds nên dùng `long` khi value là `int`.

### TG19. Heap operations

Min-heap được lưu bằng array `[2, 5, 3, 9, 7, 8]`.

1. Insert `1`, ghi array sau mỗi swap.
2. Từ heap kết quả, extract-min, ghi array sau khi thay root và sau mỗi swap.
3. Nêu công thức parent/left/right cho chỉ số zero-based.

### TG20. Trie semantics

Ban đầu trie rỗng; lần lượt insert `"cat"`, `"car"`, `"dog"`. Trả kết quả và giải thích node/flag được đọc bởi:

```text
Search("ca")
StartsWith("ca")
Search("car")
StartsWith("")
```

Nêu khác biệt giữa “đường đi tồn tại” và “từ hoàn chỉnh tồn tại”.

### TG21. BFS trace

Undirected graph có adjacency theo alphabet:

```text
A: B, C
B: A, D
C: A, D, E
D: B, C, F
E: C, F
F: D, E
```

BFS từ `A`. Ghi queue sau mỗi lần xử lý, thứ tự dequeue, `distance` và `parent` của từng node. Reconstruct một shortest path từ `A` tới `F`.

### TG22. DFS cycle colors

Directed graph:

```text
A -> B, C
B -> D
C -> D
D -> B
```

DFS từ `A`, neighbor theo alphabet. Ghi màu của node khi enter/exit, chỉ ra cạnh chứng minh cycle và giải thích vì sao cạnh tới node `black` không tự động chứng minh cycle.

### TG23. Kahn topological sort

Các cạnh: `5->2`, `5->0`, `4->0`, `4->1`, `2->3`, `3->1`. Dùng min-heap cho tập node indegree 0. Ghi indegree ban đầu, heap và output sau mỗi bước. Topological order duy nhất theo tie-break này là gì? Làm sao phát hiện cycle?

### TG24. Kruskal + union-find

Undirected graph có cạnh:

```text
AB:1, BC:2, AC:3, BD:4, CD:5
```

Trace thứ tự xét cạnh, quyết định chọn/bỏ, component sau mỗi cạnh và tổng trọng số MST. Nêu lý do cạnh bị bỏ không làm mất nghiệm tối ưu.

## Phần C — Coding (TG25–TG31, mỗi câu 8 điểm)

### TG25. Validate Binary Search Tree

```csharp
bool IsValidBST(TreeNode? root)
```

Mọi key phải **strictly** khác nhau. `TreeNode.val` là `int`. Mục tiêu `O(n)` time, `O(h)` stack. Test `int.MinValue`, `int.MaxValue`, violation nằm sâu và tree rỗng.

### TG26. Trie

```csharp
sealed class Trie
{
    public void Insert(string word);
    public bool Search(string word);
    public bool StartsWith(string prefix);
}
```

Input chỉ gồm `a`–`z`, cho phép chuỗi rỗng. Mỗi thao tác `O(L)`. Nêu trade-off giữa `TrieNode?[26]` và `Dictionary<char,TrieNode>`.

### TG27. Top K frequent

```csharp
int[] TopKFrequent(int[] nums, int k)
```

Trả về `k` giá trị có tần suất lớn nhất; nếu bằng tần suất, giá trị nhỏ hơn đứng trước. Output phải theo `(frequency desc, value asc)`. `1 <= k <= số giá trị distinct`. Hãy phân tích heap size `k`; follow-up: bucket sort có complexity gì?

### TG28. Number of Islands

```csharp
int NumIslands(char[][] grid)
```

`'1'` là đất, nối 4 hướng; grid có thể rỗng nhưng nếu không rỗng thì hình chữ nhật. Không sửa input. Mục tiêu `O(rows * cols)`. So sánh DFS recursive, DFS iterative và BFS về rủi ro stack.

### TG29. Course Schedule II

```csharp
int[] FindOrder(int numCourses, int[][] prerequisites)
```

Mỗi cặp `[course, prerequisite]`. Trả một thứ tự hợp lệ; để output deterministic, luôn lấy course nhỏ nhất đang có indegree 0. Nếu cycle, trả array rỗng. Có thể có duplicate edge—hãy định nghĩa cách xử lý để indegree không sai.

### TG30. Network Delay Time

```csharp
long NetworkDelayTime(int n, int[][] times, int source)
```

Mỗi cạnh `[u,v,w]`, node đánh số `1..n`, `w >= 0`; có thể có parallel edges. Trả thời gian để mọi node nhận tín hiệu, hoặc `-1` nếu không tới được. Tổng đường đi có thể vượt `int`. Với `PriorityQueue` lazy duplicate của .NET, dùng bound tổng quát `O((V+E) log E)`; giải thích khi nào có thể viết gọn thành `O((V+E) log V)`.

### TG31. Min Cost to Connect Points

```csharp
long MinCostConnectPoints(int[][] points)
```

Chi phí nối hai điểm là Manhattan distance. Trả chi phí nhỏ nhất để mọi điểm connected. `0 <= n <= 2_000`, tọa độ toàn miền `int`; tránh overflow khi trừ. Một lời giải Prim `O(n²)` time, `O(n)` space được chấp nhận; giải thích vì sao không cần materialize `O(n²)` cạnh.

## Phiếu tự nộp

- Điểm MCQ: `/32`
- Điểm trace/giải thích: `/32`
- Điểm coding: `/56`
- Tổng: `/120`
- Câu cần retest sau 48 giờ:
- Thuật toán graph tôi chưa thể giải thích invariant:
