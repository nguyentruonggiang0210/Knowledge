# 34. Graph nâng cao: Bipartite, SCC, Bridge

## Mục tiêu

- Kiểm tra graph bipartite bằng 2-coloring.
- Hiểu Strongly Connected Components (SCC) trong directed graph.
- Tìm bridge bằng discovery/low-link và hiểu articulation point như follow-up.

## Chọn pattern

- “Chia thành hai nhóm, kẻ thù/khác phía”: bipartite.
- “Đi được hai chiều theo đường directed”, gom dependency cycles: SCC.
- “Bỏ một cạnh/node làm mạng tách”: bridge/articulation point.

## C# 12 sample: bipartite trên graph disconnected

```csharp
using System;
using System.Collections.Generic;

public static class AdvancedGraph
{
    public static bool IsBipartite(IReadOnlyList<int>[] graph)
    {
        // Precondition: graph vô hướng, adjacency chứa cả hai chiều của mỗi edge.
        ArgumentNullException.ThrowIfNull(graph);
        for (int from = 0; from < graph.Length; from++)
        {
            if (graph[from] is null)
                throw new ArgumentException("Every adjacency list must be non-null.", nameof(graph));
            foreach (int to in graph[from])
                if ((uint)to >= (uint)graph.Length)
                    throw new ArgumentException("Edge endpoint is outside the graph.", nameof(graph));
        }

        var color = new int[graph.Length]; // 0=uncolored, 1/-1=hai phía.
        var queue = new Queue<int>();

        for (int start = 0; start < graph.Length; start++)
        {
            if (color[start] != 0) continue;
            color[start] = 1;
            queue.Enqueue(start);

            while (queue.Count > 0)
            {
                int node = queue.Dequeue();
                foreach (int next in graph[node])
                {
                    if (color[next] == 0)
                    {
                        color[next] = -color[node];
                        queue.Enqueue(next);
                    }
                    else if (color[next] == color[node])
                    {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
```

## SCC trực giác

- **Kosaraju:** DFS lấy finish order; đảo mọi edge; DFS theo thứ tự finish giảm dần. Hai pass `O(V+E)` nhưng cần transpose graph.
- **Tarjan:** một DFS, dùng `discovery`, `low`, stack và cờ `onStack`. Khi `low[u]==discovery[u]`, `u` là root của một SCC.

Sau khi co mỗi SCC thành một node, condensation graph luôn là DAG — có thể topological sort.

## C# 12 sample: Kosaraju SCC trên graph disconnected

Sample chạy DFS từ **mọi** đỉnh ở cả hai pha, nên giữ được SCC là đỉnh cô lập và các component không nối với đỉnh 0.

```csharp
#nullable enable
using System;
using System.Collections.Generic;

public static class KosarajuScc
{
    public static List<int[]> FindComponents(IReadOnlyList<int>[] graph)
    {
        ArgumentNullException.ThrowIfNull(graph);

        int vertexCount = graph.Length;
        var transpose = new List<int>[vertexCount];
        for (int node = 0; node < vertexCount; node++)
        {
            transpose[node] = new List<int>();
        }

        for (int from = 0; from < vertexCount; from++)
        {
            foreach (int to in graph[from])
            {
                if ((uint)to >= (uint)vertexCount)
                {
                    throw new ArgumentException("Edge chứa đỉnh ngoài graph.", nameof(graph));
                }

                transpose[to].Add(from);
            }
        }

        var visited = new bool[vertexCount];
        var finishOrder = new List<int>(vertexCount);
        for (int start = 0; start < vertexCount; start++)
        {
            if (!visited[start])
            {
                FillFinishOrder(start, graph, visited, finishOrder);
            }
        }

        Array.Fill(visited, false);
        var components = new List<int[]>();
        for (int i = finishOrder.Count - 1; i >= 0; i--)
        {
            int start = finishOrder[i];
            if (visited[start])
            {
                continue;
            }

            var component = new List<int>();
            CollectComponent(start, transpose, visited, component);
            components.Add(component.ToArray());
        }

        return components;
    }

    private static void FillFinishOrder(
        int node,
        IReadOnlyList<int>[] graph,
        bool[] visited,
        List<int> finishOrder)
    {
        visited[node] = true;
        foreach (int next in graph[node])
        {
            if (!visited[next])
            {
                FillFinishOrder(next, graph, visited, finishOrder);
            }
        }

        finishOrder.Add(node); // Thêm sau khi xử lý mọi edge đi ra.
    }

    private static void CollectComponent(
        int node,
        List<int>[] transpose,
        bool[] visited,
        List<int> component)
    {
        visited[node] = true;
        component.Add(node);

        foreach (int next in transpose[node])
        {
            if (!visited[next])
            {
                CollectComponent(next, transpose, visited, component);
            }
        }
    }
}

public static class Program
{
    public static void Main()
    {
        IReadOnlyList<int>[] graph =
        {
            new[] { 1 },       // 0 -> 1
            new[] { 2 },       // 1 -> 2
            new[] { 0, 3 },    // SCC {0,1,2}, rồi edge sang SCC kế
            new[] { 4 },
            new[] { 3 },       // SCC {3,4}
            Array.Empty<int>() // SCC cô lập {5}
        };

        foreach (int[] component in KosarajuScc.FindComponents(graph))
        {
            Console.WriteLine($"SCC: {string.Join(", ", component)}");
        }
    }
}
```

## Bridge invariant

Trong undirected DFS tree, edge `(u,v)` với `u` là cha của `v` là bridge khi `low[v] > discovery[u]`: cây con `v` không có back-edge nào về `u` hay ancestor của `u`. Phải phân biệt parent edge với back-edge; multigraph cần edge ID.

### Articulation point (follow-up)

Với node **không phải DFS root**, `u` là articulation point nếu tồn tại tree child `v` có `low[v] >= discovery[u]`: cây con đó không thể đi vòng lên ancestor khi bỏ `u`. DFS root là trường hợp riêng và chỉ là articulation point khi có hơn một DFS-tree child. Dấu `>=` khác điều kiện bridge `>` vì bài toán xóa node thay vì xóa riêng edge.

## C# 12 sample: Tarjan bridges trên graph disconnected

Adjacency lưu `(neighbor, edgeId)`. Bỏ qua đúng **cạnh cha** thay vì bỏ qua mọi cạnh đi tới parent; nhờ vậy parallel edges không bị báo bridge sai.

```csharp
#nullable enable
using System;
using System.Collections.Generic;

public readonly record struct UndirectedEdge(int From, int To);

public static class TarjanBridges
{
    public static List<UndirectedEdge> FindBridges(
        int vertexCount,
        IReadOnlyList<UndirectedEdge> edges)
    {
        if (vertexCount < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(vertexCount));
        }

        ArgumentNullException.ThrowIfNull(edges);

        var adjacency = new List<(int To, int EdgeId)>[vertexCount];
        for (int node = 0; node < vertexCount; node++)
        {
            adjacency[node] = new List<(int To, int EdgeId)>();
        }

        for (int edgeId = 0; edgeId < edges.Count; edgeId++)
        {
            UndirectedEdge edge = edges[edgeId];
            if ((uint)edge.From >= (uint)vertexCount ||
                (uint)edge.To >= (uint)vertexCount)
            {
                throw new ArgumentException("Edge chứa đỉnh ngoài graph.", nameof(edges));
            }

            adjacency[edge.From].Add((edge.To, edgeId));
            adjacency[edge.To].Add((edge.From, edgeId));
        }

        var discovery = new int[vertexCount];
        var low = new int[vertexCount];
        Array.Fill(discovery, -1);

        int time = 0;
        var bridges = new List<UndirectedEdge>();

        void DepthFirstSearch(int node, int parentEdgeId)
        {
            discovery[node] = low[node] = time++;

            foreach ((int next, int edgeId) in adjacency[node])
            {
                if (edgeId == parentEdgeId)
                {
                    continue;
                }

                if (discovery[next] == -1)
                {
                    DepthFirstSearch(next, edgeId);
                    low[node] = Math.Min(low[node], low[next]);

                    if (low[next] > discovery[node])
                    {
                        bridges.Add(edges[edgeId]);
                    }
                }
                else
                {
                    low[node] = Math.Min(low[node], discovery[next]);
                }
            }
        }

        for (int start = 0; start < vertexCount; start++)
        {
            if (discovery[start] == -1)
            {
                DepthFirstSearch(start, parentEdgeId: -1);
            }
        }

        return bridges;
    }
}

public static class Program
{
    public static void Main()
    {
        UndirectedEdge[] edges =
        {
            new(0, 1), new(1, 2), new(2, 0), // Triangle: không có bridge.
            new(1, 3),                       // Bridge của component đầu.
            new(4, 5)                        // Bridge ở component disconnected.
        };

        foreach (UndirectedEdge edge in TarjanBridges.FindBridges(7, edges))
        {
            Console.WriteLine($"Bridge: {edge.From} - {edge.To}");
        }
    }
}
```

## Dry run

Triangle `0-1-2-0` là bipartite false vì odd cycle. Graph `0-1-2` là bipartite true; cả hai cạnh đều là bridge. Thêm `2-0` làm low-link quay về ancestor và không còn bridge.

## Độ phức tạp

Bipartite, Kosaraju, Tarjan SCC và bridge đều `O(V+E)` time. Kosaraju sample dùng thêm transpose `O(V+E)` và state `O(V)`; bridge dùng adjacency `O(V+E)` cùng discovery/low `O(V)`. Cả hai chạy vòng ngoài qua mọi đỉnh để xử lý disconnected graph. Recursive DFS sâu có thể stack overflow trên .NET; production graph lớn nên cân nhắc iterative hoặc kiểm soát depth.

## Ứng dụng thực tế

- Phát hiện dependency cycle và gom module mutually reachable.
- Tìm single point of failure trong topology network.
- Chia lịch/đối tượng thành hai nhóm xung đột.

## Lỗi thường gặp

- Chỉ chạy từ node 0 trên graph disconnected.
- Dùng low-link rule directed/undirected lẫn nhau.
- Quên self-loop làm graph không bipartite.
- Coi mọi DFS tree edge là bridge.
- Ở Kosaraju, duyệt transpose không theo thứ tự finish **giảm dần**.
- Với multigraph, bỏ qua mọi edge tới parent thay vì chỉ edge ID đã dùng để đi xuống; cạnh song song là một back-edge hợp lệ.
- Dùng điều kiện bridge `low[child] >= discovery[parent]`; bridge cần dấu `>`.

## Câu hỏi phỏng vấn

1. Is Graph Bipartite? / Possible Bipartition.
2. Critical Connections in a Network.
3. Tìm SCC rồi tạo condensation DAG.
4. Articulation points khác bridge ở điều kiện root thế nào?

## Checklist

- [ ] 2-color mọi component.
- [ ] Giải thích discovery và low-link.
- [ ] Phân biệt SCC với connected component thường.
- [ ] Cảnh báo recursion depth.
