# 35. Math và Number Theory cơ bản

## Mục tiêu

- Dùng GCD/LCM, sieve, modular arithmetic và fast power.
- Nhận ra overflow và normalize modulo số âm trong C#.
- Chuyển bài chu kỳ/chia hết thành invariant toán học.

## Công cụ cần thuộc

- Euclid: `gcd(a,b)=gcd(b,a mod b)`.
- `lcm(a,b)=|a/gcd(a,b)·b|` (chia trước để giảm overflow).
- Sieve of Eratosthenes: đánh dấu composite từ `p²`.
- Binary exponentiation: bình phương base, xét từng bit exponent.
- Với modulo prime, nhiều bài dùng Fermat; chỉ áp dụng khi đủ điều kiện.

## C# 12 sample

```csharp
using System;
using System.Collections.Generic;

public static class MathAlgorithms
{
    public static ulong Gcd(long a, long b)
    {
        ulong x = Magnitude(a), y = Magnitude(b);
        while (y != 0) (x, y) = (y, x % y);
        return x;
    }

    private static ulong Magnitude(long value) => value >= 0
        ? (ulong)value
        : (ulong)(-(value + 1)) + 1; // An toàn cả với long.MinValue.

    public static ulong Lcm(long a, long b)
    {
        ulong x = Magnitude(a), y = Magnitude(b);
        if (x == 0 || y == 0) return 0;
        return checked((x / Gcd(a, b)) * y); // Chia trước rồi mới nhân.
    }

    public static long ModPow(long value, long exponent, long modulus)
    {
        if (exponent < 0) throw new ArgumentOutOfRangeException(nameof(exponent));
        if (modulus <= 0) throw new ArgumentOutOfRangeException(nameof(modulus));
        if (modulus > 3_000_000_000L)
            throw new ArgumentOutOfRangeException(
                nameof(modulus),
                "This Int64 sample requires modulus <= 3,000,000,000.");
        long result = 1 % modulus;
        value %= modulus;
        if (value < 0) value += modulus; // Chỉ cộng khi âm để không overflow.
        while (exponent > 0)
        {
            if ((exponent & 1) != 0) result = (result * value) % modulus;
            value = (value * value) % modulus;
            exponent >>= 1;
        }
        return result;
    }

    public static List<int> PrimesUpTo(int n)
    {
        if (n < 2) return new List<int>();
        var composite = new bool[n + 1];
        for (int p = 2; (long)p * p <= n; p++)
            if (!composite[p])
                for (long multiple = (long)p * p; multiple <= n; multiple += p)
                    composite[(int)multiple] = true;

        var primes = new List<int>();
        for (int value = 2; value <= n; value++)
            if (!composite[value]) primes.Add(value);
        return primes;
    }
}
```

## Dry run

`gcd(48,18)`: `(48,18)→(18,12)→(12,6)→(6,0)`, kết quả `6`. `3^13`: exponent bits `1101₂`; chỉ nhân result ở các bit 1, cần `O(log 13)` phép lặp.

## Độ phức tạp

- Euclid: `O(log(1 + min(|a|,|b|)))`; nếu một số bằng `0` thì chỉ cần hằng số bước.
- Fast power: `O(log exponent)`.
- Sieve: `O(n log log n)` time, `O(n)` memory.

## C# và overflow

`Gcd`/`Lcm` trả `ulong` vì `|long.MinValue| = 2^63` không biểu diễn được bằng `long`; hàm `Magnitude` tránh gọi `Math.Abs(long.MinValue)`. `Lcm` chia trước khi nhân và dùng `checked`, nên ném nếu kết quả vẫn vượt `ulong`. Phép `long * long` có thể overflow trước `%`. `ModPow` chủ động reject modulus lớn hơn `3·10^9` để tích của hai residue nằm trong `long`; với modulus 64-bit tổng quát cần `BigInteger` hoặc modular multiplication an toàn.

## Ứng dụng thực tế

- GCD/LCM cho đồng bộ chu kỳ và chia block.
- Sieve/precompute cho nhiều truy vấn prime/factor.
- Modular arithmetic trong hashing, counting và cryptographic building blocks (không tự thiết kế crypto production).

## Lỗi thường gặp

- Bắt đầu sieve từ `2p` thay vì `p²` (đúng nhưng chậm hơn).
- LCM nhân trước rồi mới chia.
- `%` số âm trong C# vẫn âm.
- Áp dụng modular inverse khi gcd khác 1.

## Câu hỏi phỏng vấn

1. Count Primes.
2. Pow(x,n), gồm `n=int.MinValue`.
3. GCD of Strings.
4. Tính tổ hợp modulo prime với precompute factorial.

## Checklist

- [ ] Code Euclid và fast power.
- [ ] Giải thích mốc `p²` trong sieve.
- [ ] Kiểm tra overflow trước khi nhân.
- [ ] Nói rõ giả định của modulo/inverse.
