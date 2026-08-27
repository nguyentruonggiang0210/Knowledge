using System;
using System.Reflection;

[AttributeUsage(AttributeTargets.Method)]
sealed class AuditedAttribute(string action) : Attribute { public string Action { get; } = action; }
sealed class Checkout
{
    [Audited("place-order")]
    public string Place(string id) => $"placed:{id}";
}
static class Program
{
    public static void Main()
    {
        var method = typeof(Checkout).GetMethod(nameof(Checkout.Place))!;
        Console.WriteLine(method.GetCustomAttribute<AuditedAttribute>()!.Action);
        Console.WriteLine(method.Invoke(new Checkout(), ["ORD-42"]));
    }
}
