# 20. Union-Find (Disjoint Set Union - DSU)

## Mục tiêu

- Hỗ trợ `Find` và `Union` gần như hằng số amortized.
- Dùng path compression + union by size/rank.
- Giải dynamic connectivity, cycle và component count.

## Khi dùng

Các cạnh được thêm dần và cần hỏi hai node có cùng component không. DSU không trả đường đi cụ thể và không thuận tiện cho xóa cạnh; BFS/DFS phù hợp hơn nếu cần traversal/path.

## Invariant

Mỗi component là một cây có root đại diện; `parent[root] == root`. `Find(x)` trả cùng đại diện cho mọi node trong component.

## C# 12 sample

```csharp
using System;

public sealed class DisjointSetUnion
{
    private readonly int[] _parent;
    private readonly int[] _size;
    public int ComponentCount { get; private set; }

    public DisjointSetUnion(int count)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(count);
        _parent = new int[count];
        _size = new int[count];
        ComponentCount = count;
        for (int i = 0; i < count; i++) { _parent[i] = i; _size[i] = 1; }
    }

    public int Find(int x)
    {
        while (x != _parent[x])
        {
            _parent[x] = _parent[_parent[x]]; // Path halving.
            x = _parent[x];
        }
        return x;
    }

    public bool Union(int a, int b)
    {
        int rootA = Find(a), rootB = Find(b);
        if (rootA == rootB) return false;
        if (_size[rootA] < _size[rootB]) (rootA, rootB) = (rootB, rootA);
        _parent[rootB] = rootA;
        _size[rootA] += _size[rootB];
        ComponentCount--;
        return true;
    }

    public bool Connected(int a, int b) => Find(a) == Find(b);
}
```

## Dry run

Ban đầu `{0},{1},{2},{3}`. `Union(0,1)` và `Union(2,3)` còn 2 component. `Union(1,3)` nối hai root, còn 1. Lần `Union(0,2)` sau trả false, có thể dùng để phát hiện cạnh tạo cycle.

## Độ phức tạp

Với cả hai tối ưu, chuỗi `m` thao tác tốn `O(m α(n))`; `α(n)` tăng cực chậm và gần hằng số trong thực tế. Bộ nhớ `O(n)`.

## Ứng dụng thực tế

- Account/email merge và clustering.
- Theo dõi network connectivity khi thêm link.
- Kruskal MST và phát hiện cycle undirected.

## Lỗi thường gặp

- Union trực tiếp `a,b` thay vì root của chúng.
- Quên giảm component count chỉ khi merge thành công.
- Mô tả `O(1)` tuyệt đối thay vì amortized `O(α(n))`.
- Dùng DSU để phát hiện cycle directed graph.

## Câu hỏi phỏng vấn

1. Number of Provinces.
2. Redundant Connection.
3. Accounts Merge.
4. Number of Islands II.

## Checklist

- [ ] Code Find với compression.
- [ ] Code Union by size/rank.
- [ ] Giải thích false khi cùng root.
- [ ] Biết giới hạn khi xóa cạnh/truy vấn path.

