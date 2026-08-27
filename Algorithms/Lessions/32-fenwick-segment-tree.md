# 32. Fenwick Tree và Segment Tree

## Mục tiêu

- Trả lời range query và point/range update trong `O(log n)`.
- Biết khi nào prefix sum tĩnh không đủ.
- Chọn Fenwick đơn giản hay Segment Tree linh hoạt.

## Bảng chọn

| Nhu cầu | Cấu trúc |
|---|---|
| Query nhiều, không update | Prefix sum `O(1)` query |
| Point add + prefix/range sum | Fenwick Tree |
| Range min/max/sum + point update | Segment Tree |
| Range update + range query | Lazy Segment Tree (advanced) |

## Fenwick invariant

Với index 1-based, `tree[i]` giữ tổng một block kết thúc tại `i`, kích thước `lowbit(i)`. Update đi lên bằng `i += i & -i`; prefix query đi xuống bằng `i -= i & -i`.

## C# 12 sample: Fenwick Tree

```csharp
using System;

public sealed class FenwickTree
{
    private readonly long[] _tree;

    public FenwickTree(int length)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(length);
        _tree = new long[length + 1];
    }

    public int Length => _tree.Length - 1;

    public void Add(int zeroBasedIndex, long delta)
    {
        if ((uint)zeroBasedIndex >= (uint)Length)
            throw new ArgumentOutOfRangeException(nameof(zeroBasedIndex));
        for (int i = zeroBasedIndex + 1; i < _tree.Length; i += i & -i)
            _tree[i] = checked(_tree[i] + delta);
    }

    public long PrefixSum(int exclusiveEnd)
    {
        if ((uint)exclusiveEnd > (uint)Length)
            throw new ArgumentOutOfRangeException(nameof(exclusiveEnd));
        long sum = 0;
        for (int i = exclusiveEnd; i > 0; i -= i & -i)
            sum = checked(sum + _tree[i]);
        return sum;
    }

    public long RangeSum(int leftInclusive, int rightExclusive)
    {
        if (leftInclusive < 0 || leftInclusive > rightExclusive || rightExclusive > Length)
            throw new ArgumentOutOfRangeException();
        return checked(PrefixSum(rightExclusive) - PrefixSum(leftInclusive));
    }
}
```

## Dry run

Với length `8`, `Add(2,+5)` chuyển sang index 1-based `3`, cập nhật `tree[3]`, `tree[4]`, `tree[8]`. `PrefixSum(3)` cộng các block bao phủ ba phần tử `[0,3)`.

## Segment Tree trực giác

Mỗi node giữ aggregate của một đoạn; hai con chia đôi đoạn. Point update sửa một leaf rồi recompute đường lên root. Query tách thành các node phủ hoàn toàn range. Phép combine phải associative; sum/min/max/gcd phù hợp.

## C# 12 sample: Segment Tree range sum + point set

Phiên bản iterative dưới đây dùng cùng quy ước `[leftInclusive, rightExclusive)` với Fenwick sample. Leaves nằm tại vùng `_tree[n..2n)`, cha của node `i` là `i / 2`.

```csharp
#nullable enable
using System;

public sealed class SegmentTree
{
    private readonly int _length;
    private readonly long[] _tree;

    public SegmentTree(long[] values)
    {
        ArgumentNullException.ThrowIfNull(values);

        _length = values.Length;
        _tree = new long[Math.Max(1, 2 * _length)];

        for (int i = 0; i < _length; i++)
        {
            _tree[_length + i] = values[i];
        }

        for (int node = _length - 1; node > 0; node--)
        {
            _tree[node] = checked(_tree[2 * node] + _tree[2 * node + 1]);
        }
    }

    public int Length => _length;

    public void Set(int index, long value)
    {
        if ((uint)index >= (uint)_length)
        {
            throw new ArgumentOutOfRangeException(nameof(index));
        }

        int node = index + _length;
        _tree[node] = value;

        for (node /= 2; node > 0; node /= 2)
        {
            _tree[node] = checked(_tree[2 * node] + _tree[2 * node + 1]);
        }
    }

    public long RangeSum(int leftInclusive, int rightExclusive)
    {
        if (leftInclusive < 0 ||
            leftInclusive > rightExclusive ||
            rightExclusive > _length)
        {
            throw new ArgumentOutOfRangeException(nameof(leftInclusive));
        }

        int left = leftInclusive + _length;
        int right = rightExclusive + _length;
        long sum = 0;

        while (left < right)
        {
            if ((left & 1) == 1)
            {
                sum = checked(sum + _tree[left++]);
            }

            if ((right & 1) == 1)
            {
                sum = checked(sum + _tree[--right]);
            }

            left /= 2;
            right /= 2;
        }

        return sum;
    }
}

public static class Program
{
    public static void Main()
    {
        var tree = new SegmentTree([2, 1, 5, 3, 4]);

        Console.WriteLine(tree.RangeSum(1, 4)); // 1 + 5 + 3 = 9
        tree.Set(2, 10);
        Console.WriteLine(tree.RangeSum(1, 4)); // 1 + 10 + 3 = 14
        Console.WriteLine(tree.RangeSum(3, 3)); // Empty range = 0
    }
}
```

Trong query, khi `left` là right-child thì node đó nằm trọn trong kết quả và được lấy rồi tăng `left`. Khi `right` lẻ, giảm `right` trước để lấy left-child nằm trọn ở cuối khoảng. Sau đó cả hai biên đi lên cha.

## Độ phức tạp

- Fenwick: update/query `O(log n)`, memory `O(n)`.
- Segment Tree: build `O(n)`, point set/range query `O(log n)`, memory thường `O(4n)` hoặc iterative `O(2n)` như sample.

## Ứng dụng thực tế

- Leaderboard/count analytics cập nhật liên tục.
- Query metrics trên time buckets.
- Inversion count sau coordinate compression.
- Calendar/resource occupancy với range structures.

## Lỗi thường gặp

- Trộn index 0-based bên ngoài với 1-based bên trong.
- `Add` là delta nhưng truyền nhầm giá trị tuyệt đối.
- Không thống nhất `[l,r]` hay `[l,r)`.
- Với point set, sửa leaf nhưng quên recompute toàn bộ đường lên root.
- Query iterative lấy nhầm `right` như inclusive; sample dùng `rightExclusive`.
- Dùng phép combine không associative hoặc sai identity (`0` cho sum, không phải cho mọi aggregate).
- Để tổng `long` wrap im lặng; sample dùng `checked` để ném `OverflowException` khi contract số học bị vượt.
- Dùng segment tree khi prefix sum hoặc sorted structure đơn giản hơn.

## Câu hỏi phỏng vấn

1. Range Sum Query Mutable.
2. Count of Smaller Numbers After Self.
3. Segment Tree range minimum query.
4. Lazy propagation cho range add + range sum.

## Checklist

- [ ] Giải thích lowbit.
- [ ] Code Fenwick không lỗi index.
- [ ] Chọn aggregate associative.
- [ ] So sánh prefix/Fenwick/segment tree.
