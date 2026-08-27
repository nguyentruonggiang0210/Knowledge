using System;
using System.Collections.Immutable;

public sealed record Money(decimal Amount, string Currency);
public abstract record PaymentMethod;
public sealed record Card(string MaskedNumber) : PaymentMethod;
public sealed record BankTransfer(string BankCode) : PaymentMethod;
public sealed record Order(ImmutableArray<Money> Lines, PaymentMethod Payment);

static class Program
{
    public static void Main()
    {
        var order = new Order([new(19.99m, "USD")], new Card("****4242"));
        var route = order.Payment switch
        {
            Card => "payment.card",
            BankTransfer b => $"payment.bank.{b.BankCode}",
            _ => throw new InvalidOperationException("Unknown payment method")
        };
        Console.WriteLine(route);
    }
}
