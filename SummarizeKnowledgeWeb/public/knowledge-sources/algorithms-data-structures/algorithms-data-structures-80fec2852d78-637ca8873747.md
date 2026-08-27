# 30. Bit Manipulation

## Mục tiêu

- Test/set/clear/toggle bit và dùng bitmask biểu diễn tập nhỏ.
- Vận dụng XOR, lowbit và duyệt subset.
- Tránh lỗi signed shift, precedence và overflow trong C#.

## Công thức nền tảng

Với `mask` kiểu `ulong` và bit `i` trong `[0,63]` (đếm từ 0):

- Test: `(mask & (1UL << i)) != 0`
- Set: `mask | (1UL << i)`
- Clear: `mask & ~(1UL << i)`
- Toggle: `mask ^ (1UL << i)`
- Xóa bit 1 thấp nhất: `x & (x - 1)`
- Lấy lowbit (unsigned): `x & (~x + 1)`

XOR có `x^x=0`, `x^0=x`, giao hoán và kết hợp.

## C# 12 sample

```csharp
using System;
using System.Collections.Generic;

public static class BitAlgorithms
{
    public static bool IsBitSet(ulong mask, int bit)
    {
        ValidateBit(bit);
        return (mask & (1UL << bit)) != 0;
    }

    public static ulong SetBit(ulong mask, int bit)
    {
        ValidateBit(bit);
        return mask | (1UL << bit);
    }

    public static ulong ClearBit(ulong mask, int bit)
    {
        ValidateBit(bit);
        return mask & ~(1UL << bit);
    }

    public static ulong ToggleBit(ulong mask, int bit)
    {
        ValidateBit(bit);
        return mask ^ (1UL << bit);
    }

    // Mọi phần tử xuất hiện hai lần, trừ một phần tử.
    public static int SingleNumber(IEnumerable<int> values)
    {
        ArgumentNullException.ThrowIfNull(values);
        int answer = 0;
        foreach (int value in values) answer ^= value;
        return answer;
    }

    public static int PopCount(uint value)
    {
        int count = 0;
        while (value != 0)
        {
            value &= value - 1;
            count++;
        }
        return count;
    }

    // Duyệt mọi submask của mask, có gồm 0.
    public static IEnumerable<uint> EnumerateSubmasks(uint mask)
    {
        uint submask = mask;
        while (true)
        {
            yield return submask;
            if (submask == 0) yield break;
            submask = (submask - 1) & mask;
        }
    }

    public static bool IsPowerOfTwo(uint value) => value != 0 && (value & (value - 1)) == 0;

    private static void ValidateBit(int bit)
    {
        if ((uint)bit >= 64)
            throw new ArgumentOutOfRangeException(nameof(bit), "Bit must be in [0, 63].");
    }
}
```

## Dry run

`[4,1,2,1,2]`: do các cặp triệt tiêu bất kể thứ tự, XOR cuối là `4`. Với mask `10110₂`, `mask & (mask-1)` xóa bit 1 phải nhất thành `10100₂`.

## Độ phức tạp

- XOR scan: `O(n)`, `O(1)` space.
- Brian Kernighan popcount: `O(number of set bits)`.
- Duyệt mọi subset của `n` bit: `O(2^n)`; duyệt mọi submask của một mask: `O(2^k)` với `k` bit được set.

## Ứng dụng thực tế

- Flags/permissions và feature masks.
- Compact DP state, subset search khi `n` nhỏ.
- Bitmap/index, bloom filter (kết hợp hashing), protocol fields.

## Lỗi thường gặp

- Dùng `1 << i` khi `i>=31`; dùng `1L << i` hoặc `1UL << i`.
- Right shift số âm là arithmetic shift; dùng `uint/ulong` khi cần logical bits.
- Quên ngoặc do precedence.
- Dùng bitmask khi số item vượt số bit của kiểu.

## Câu hỏi phỏng vấn

1. Single Number II/III.
2. Counting Bits.
3. Sum of Two Integers không dùng `+`.
4. Bitmask DP cho Traveling Salesperson nhỏ.

## Checklist

- [ ] Thuộc 6 phép cơ bản.
- [ ] Giải thích XOR cancellation.
- [ ] Duyệt subset/submask.
- [ ] Chọn đúng signed/unsigned và độ rộng kiểu.
