using System;
using System.Collections.Generic;

record Money(long Cents, string Currency);
sealed class Box { public int Value { get; set; } public Box(int value) => Value = value; }

static class Demo
{
    static void MutateAndReassign(Box box) { box.Value = 42; box = new Box(999); }
    public static void Main()
    {
        var box = new Box(1); MutateAndReassign(box);
        Console.WriteLine(box.Value); // 42: reference itself was passed by value
        var values = new HashSet<Money> { new(1000, "USD") };
        Console.WriteLine(values.Contains(new(1000, "USD"))); // record value equality
    }
}
