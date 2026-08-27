# 23. Minimum Spanning Tree: Kruskal và Prim

## Mục tiêu

Sau bài này, bạn có thể:

- Nhận diện bài toán cần nối mọi đỉnh với tổng chi phí nhỏ nhất.
- Phân biệt Minimum Spanning Tree (MST) với shortest path.
- Giải thích cut property, chạy Kruskal bằng Union-Find và lựa chọn Prim khi phù hợp.
- Xử lý đúng cạnh song song, trọng số âm và graph không liên thông.

## Nhận diện bài toán

MST áp dụng cho **đồ thị vô hướng có trọng số** khi cần chọn một tập cạnh:

- Nối tất cả `V` đỉnh.
- Không tạo chu trình.
- Có đúng `V - 1` cạnh nếu graph liên thông.
- Có tổng trọng số nhỏ nhất.

Từ khóa thường gặp: nối các thành phố/máy chủ/điểm với chi phí thấp nhất, xây hạ tầng tối thiểu, hoặc nối các điểm bằng khoảng cách Manhattan.

MST không tối thiểu hóa đường đi từ một nguồn đến từng đỉnh. Một cây có tổng trọng số nhỏ nhất vẫn có thể tạo đường từ `s` đến `t` dài hơn đường đi ngắn nhất trong graph gốc.

## Trực giác và invariant

### Cut property

Chia các đỉnh thành hai tập. Với một lát cắt tôn trọng forest đã chọn, một cạnh nhẹ nhất băng qua lát cắt đó là cạnh an toàn: forest vẫn có thể được mở rộng thành một MST chứa cạnh ấy. Đây là cơ sở của cả Kruskal và Prim.

### Kruskal

Xét cạnh từ nhẹ đến nặng. Chỉ nhận cạnh nối hai component khác nhau.

Invariant: các cạnh đã chọn tạo thành một forest không chu trình và forest này có thể mở rộng thành một MST. Union-Find trả lời nhanh hai đầu cạnh đã cùng component hay chưa.

### Prim

Bắt đầu từ một đỉnh, duy trì cây đã nối. Mỗi lần chọn cạnh nhẹ nhất đi từ cây sang một đỉnh bên ngoài. Prim thường thuận tiện với adjacency list và priority queue; Kruskal thường thuận tiện khi đầu vào đã là danh sách cạnh.

## Các bước Kruskal

1. Sắp xếp toàn bộ cạnh tăng dần theo trọng số.
2. Khởi tạo mỗi đỉnh là một component riêng.
3. Với từng cạnh `(u, v)`:
   - Nếu `u` và `v` đã cùng component, bỏ qua để tránh chu trình.
   - Nếu khác component, chọn cạnh và union hai component.
4. Dừng khi đã chọn `V - 1` cạnh.
5. Nếu chưa đủ `V - 1` cạnh, graph không liên thông; kết quả là minimum spanning forest.

## Dry run

Các cạnh: `0-1(1), 1-2(2), 0-2(3), 2-3(4), 1-3(5)`.

| Cạnh đang xét | Quyết định | Các component sau bước |
|---|---|---|
| `0-1(1)` | Chọn | `{0,1}, {2}, {3}` |
| `1-2(2)` | Chọn | `{0,1,2}, {3}` |
| `0-2(3)` | Bỏ, tạo chu trình | Không đổi |
| `2-3(4)` | Chọn và dừng | `{0,1,2,3}` |

MST có tổng trọng số `1 + 2 + 4 = 7`.

## C# 12 sample độc lập: Kruskal

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

public readonly record struct Edge(int U, int V, long Weight);

public sealed record MstResult(
    long TotalWeight,
    IReadOnlyList<Edge> SelectedEdges,
    bool IsConnected);

public sealed class DisjointSetUnion
{
    private readonly int[] parent;
    private readonly int[] size;

    public DisjointSetUnion(int count)
    {
        if (count < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(count));
        }

        parent = new int[count];
        size = new int[count];
        for (int i = 0; i < count; i++)
        {
            parent[i] = i;
            size[i] = 1;
        }
    }

    public int Find(int vertex)
    {
        ValidateVertex(vertex);
        int root = vertex;
        while (root != parent[root])
        {
            root = parent[root];
        }

        while (vertex != root)
        {
            int next = parent[vertex];
            parent[vertex] = root;
            vertex = next;
        }

        return root;
    }

    public bool Union(int first, int second)
    {
        int rootA = Find(first);
        int rootB = Find(second);
        if (rootA == rootB)
        {
            return false;
        }

        if (size[rootA] < size[rootB])
        {
            (rootA, rootB) = (rootB, rootA);
        }

        parent[rootB] = rootA;
        size[rootA] += size[rootB];
        return true;
    }

    private void ValidateVertex(int vertex)
    {
        if (vertex < 0 || vertex >= parent.Length)
        {
            throw new ArgumentOutOfRangeException(nameof(vertex));
        }
    }
}

public static class MinimumSpanningTree
{
    public static MstResult Kruskal(
        int vertexCount,
        IReadOnlyList<Edge> edges)
    {
        if (vertexCount < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(vertexCount));
        }

        ArgumentNullException.ThrowIfNull(edges);
        foreach (Edge edge in edges)
        {
            if (edge.U < 0 || edge.U >= vertexCount ||
                edge.V < 0 || edge.V >= vertexCount)
            {
                throw new ArgumentException("Cạnh chứa đỉnh không hợp lệ.");
            }
        }

        var dsu = new DisjointSetUnion(vertexCount);
        var selected = new List<Edge>(Math.Max(0, vertexCount - 1));
        long totalWeight = 0;

        foreach (Edge edge in edges.OrderBy(edge => edge.Weight))
        {
            if (!dsu.Union(edge.U, edge.V))
            {
                continue;
            }

            selected.Add(edge);
            totalWeight = checked(totalWeight + edge.Weight);

            if (selected.Count == vertexCount - 1)
            {
                break;
            }
        }

        bool isConnected =
            vertexCount <= 1 || selected.Count == vertexCount - 1;

        return new MstResult(totalWeight, selected, isConnected);
    }
}

public static class Program
{
    public static void Main()
    {
        Edge[] edges =
        [
            new(0, 1, 1),
            new(1, 2, 2),
            new(0, 2, 3),
            new(2, 3, 4),
            new(1, 3, 5)
        ];

        MstResult result = MinimumSpanningTree.Kruskal(4, edges);

        Console.WriteLine($"Connected: {result.IsConnected}");
        Console.WriteLine($"Total: {result.TotalWeight}");
        foreach (Edge edge in result.SelectedEdges)
        {
            Console.WriteLine($"{edge.U} - {edge.V}: {edge.Weight}");
        }
    }
}
```

Kết quả:

```text
Connected: True
Total: 7
0 - 1: 1
1 - 2: 2
2 - 3: 4
```

## C# 12 sample độc lập: Prim với adjacency list

Sample chạy Prim từ mọi seed chưa thăm, nên graph disconnected trả minimum spanning **forest** cùng số component. Adjacency của graph vô hướng phải chứa cả hai chiều của mỗi cạnh.

```csharp
using System;
using System.Collections.Generic;

public readonly record struct Neighbor(int To, long Weight);
public readonly record struct SelectedEdge(int From, int To, long Weight);
public sealed record PrimResult(
    long TotalWeight,
    IReadOnlyList<SelectedEdge> SelectedEdges,
    int ComponentCount);

public static class PrimAlgorithm
{
    public static PrimResult MinimumSpanningForest(IReadOnlyList<Neighbor>[] graph)
    {
        ArgumentNullException.ThrowIfNull(graph);
        for (int from = 0; from < graph.Length; from++)
        {
            if (graph[from] is null)
                throw new ArgumentException("Every adjacency list must be non-null.", nameof(graph));
            foreach (Neighbor edge in graph[from])
                if ((uint)edge.To >= (uint)graph.Length)
                    throw new ArgumentException("Edge endpoint is outside the graph.", nameof(graph));
        }

        var visited = new bool[graph.Length];
        var selected = new List<SelectedEdge>();
        var queue = new PriorityQueue<SelectedEdge, long>();
        long totalWeight = 0;
        int componentCount = 0;

        for (int seed = 0; seed < graph.Length; seed++)
        {
            if (visited[seed]) continue;
            componentCount++;
            visited[seed] = true;
            EnqueueOutgoing(seed);

            while (queue.TryDequeue(out SelectedEdge edge, out _))
            {
                if (visited[edge.To]) continue;
                visited[edge.To] = true;
                selected.Add(edge);
                totalWeight = checked(totalWeight + edge.Weight);
                EnqueueOutgoing(edge.To);
            }
        }

        return new PrimResult(totalWeight, selected, componentCount);

        void EnqueueOutgoing(int from)
        {
            foreach (Neighbor edge in graph[from])
                if (!visited[edge.To])
                    queue.Enqueue(new SelectedEdge(from, edge.To, edge.Weight), edge.Weight);
        }
    }
}

public static class Program
{
    public static void Main()
    {
        IReadOnlyList<Neighbor>[] graph =
        [
            [new(1, 1), new(2, 3)],
            [new(0, 1), new(2, 2), new(3, 5)],
            [new(0, 3), new(1, 2), new(3, 4)],
            [new(1, 5), new(2, 4)]
        ];

        PrimResult result = PrimAlgorithm.MinimumSpanningForest(graph);
        Console.WriteLine(result.TotalWeight);    // 7
        Console.WriteLine(result.ComponentCount); // 1
    }
}
```

## Độ phức tạp

- Sắp xếp cạnh: `O(E log E)`.
- Mỗi `Find/Union` có thời gian khấu hao `O(α(V))` với path compression và union by size.
- Tổng thời gian Kruskal: `O(E log E)`.
- Bộ nhớ phụ: `O(V + E)` nếu tính bản sao do sắp xếp LINQ và danh sách kết quả.

Prim với indexed heap thường có thời gian `O(E log V)`. Sample lazy-edge phía trên có heap tối đa theo số edge nên bound tổng quát là `O(E log E)` time, `O(V+E)` memory; trên simple graph, `log E = O(log V)`.

## Giới hạn thuật toán

- MST chuẩn chỉ định nghĩa cho graph vô hướng. Với graph có hướng, bài toán gần nhất là minimum arborescence và cần thuật toán khác.
- Nếu graph không liên thông, không tồn tại một spanning tree phủ mọi đỉnh; Kruskal trả về minimum spanning forest và `IsConnected = false`.
- MST có thể không duy nhất khi có các cạnh cùng trọng số, dù tổng trọng số tối ưu giống nhau.
- Trọng số âm vẫn hợp lệ với MST; điều này khác nhiều trực giác về shortest path.
- Graph động có thêm/xóa cạnh liên tục cần cấu trúc nâng cao; chạy lại Kruskal mỗi lần có thể quá chậm.
- Code trên không ép kết quả phải liên thông; caller phải kiểm tra `IsConnected`.

## Ứng dụng thực tế

- Lập phương án sơ bộ để nối cáp, đường ống hoặc mạng với tổng chi phí cạnh thấp.
- Single-linkage clustering: dừng Kruskal trước khi còn một component để tạo cụm.
- Xấp xỉ một số bài toán mạng và là thành phần trong thuật toán approximation cho metric TSP.
- Tạo maze hoặc topology ngẫu nhiên dựa trên spanning tree.

Mô hình thật thường có thêm capacity, redundancy, hướng, rủi ro và nhiều mục tiêu; khi đó MST thuần túy có thể không đủ.

## Lỗi thường gặp

- Dùng shortest-path tree thay cho MST hoặc ngược lại.
- Quên sort cạnh trước Kruskal.
- Chọn cạnh chỉ vì nó nhẹ mà không kiểm tra chu trình.
- Cài DSU không path compression/union by size rồi tuyên bố độ phức tạp tối ưu.
- Giả định graph luôn liên thông và trả về một “MST” thiếu cạnh.
- Nhân đôi cạnh vô hướng nhưng xử lý sai self-loop/cạnh song song.
- Dùng phép trừ trong comparer, có thể tràn số.
- Cho rằng trọng số âm làm Kruskal sai.

## Câu hỏi luyện tập

1. Chứng minh cut property bằng exchange argument.
2. Viết Prim với `PriorityQueue<TElement, TPriority>` của .NET.
3. Trả về minimum spanning forest và số component của graph.
4. Bài “Min Cost to Connect All Points” nên dựng toàn bộ cạnh hay có cách tiết kiệm hơn?
5. Làm sao kiểm tra MST có duy nhất hay không?
6. Nếu đã có các cạnh được nối miễn phí, cần thay đổi mô hình thế nào?

## Checklist phỏng vấn

- [ ] Tôi xác nhận graph vô hướng và hỏi graph có liên thông không.
- [ ] Tôi nói được cut property và invariant “forest có thể mở rộng thành MST”.
- [ ] Tôi phân biệt MST với shortest path bằng một phản ví dụ.
- [ ] Tôi cài được DSU có path compression và union by size/rank.
- [ ] Tôi kiểm tra `V - 1` cạnh và trạng thái disconnected.
- [ ] Tôi nêu đúng `O(E log E)` cho Kruskal.
- [ ] Tôi test một đỉnh, cạnh song song, self-loop, trọng số âm và graph disconnected.

Nắm vững bài này là một phần của quá trình chuẩn bị; nó không tạo cam kết tuyệt đối về điểm số hoặc kết quả phỏng vấn.
