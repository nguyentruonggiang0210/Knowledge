# 16. Trie (Prefix Tree)

## Mục tiêu

- Thiết kế insert/search/prefix search theo ký tự.
- Hiểu trade-off tốc độ theo độ dài từ và chi phí bộ nhớ.
- Kết hợp trie với DFS/backtracking cho word search.

## Khi dùng

Nhiều truy vấn prefix/autocomplete trên cùng tập từ; cần duyệt tất cả từ có chung tiền tố; hoặc cần match từng ký tự khi đi trên grid. Nếu chỉ cần exact lookup, hash set thường đơn giản hơn.

## C# 12 sample

```csharp
using System;
using System.Collections.Generic;

public sealed class Trie
{
    private sealed class Node
    {
        public Dictionary<char, Node> Children { get; } = new();
        public bool IsWord { get; set; }
    }

    private readonly Node _root = new();

    public void Insert(string word)
    {
        ArgumentNullException.ThrowIfNull(word);
        Node current = _root;
        foreach (char c in word)
        {
            if (!current.Children.TryGetValue(c, out Node? next))
            {
                next = new Node();
                current.Children[c] = next;
            }
            current = next;
        }
        current.IsWord = true;
    }

    public bool Search(string word) => FindNode(word)?.IsWord == true;

    public bool StartsWith(string prefix) => FindNode(prefix) is not null;

    private Node? FindNode(string text)
    {
        ArgumentNullException.ThrowIfNull(text);
        Node current = _root;
        foreach (char c in text)
        {
            if (!current.Children.TryGetValue(c, out Node? next)) return null;
            current = next;
        }
        return current;
    }
}
```

## Dry run

Insert `car` rồi `cat`: hai từ chia sẻ node `c→a`; từ đó tách `r` và `t`. `StartsWith("ca")` là true, nhưng `Search("ca")` là false vì node `a` chưa đánh dấu kết thúc từ.

## Độ phức tạp

Insert/search/prefix: `O(L)` expected với dictionary, trong đó `L` là độ dài chuỗi. Bộ nhớ `O(total characters)` ở worst case, nhưng constant lớn do node và dictionary.

## Lựa chọn cấu trúc con

- Alphabet nhỏ/cố định (`a-z`): `Node?[26]` nhanh, dễ dự đoán bộ nhớ.
- Unicode/sparse alphabet: `Dictionary<char,Node>` tiết kiệm slot rỗng.
- Production autocomplete: có thể lưu top suggestions/count tại node và normalize Unicode/case.

## Ứng dụng thực tế

- Autocomplete, spell-check, routing theo prefix.
- Từ điển, tìm kiếm từ trên bàn phím/grid.
- IP longest-prefix match dùng biến thể bitwise trie/radix tree.

## Lỗi thường gặp

- Nhầm prefix tồn tại với whole word tồn tại.
- Không thống nhất lowercase/Unicode normalization.
- Xóa từ làm mất prefix dùng chung.
- Dùng trie khi dataset nhỏ và hash set đủ tốt.

## Câu hỏi phỏng vấn

1. Implement Trie.
2. Design Add and Search Words (wildcard `.`).
3. Word Search II.
4. Autocomplete top-k theo tần suất.

## Checklist

- [ ] Code insert/search/startsWith trong 15 phút.
- [ ] Giải thích `IsWord`.
- [ ] So sánh array children và dictionary.
- [ ] Biết cách DFS thu thập từ theo prefix.

