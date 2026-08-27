using System;
using System.Collections.Immutable;
using System.Linq;

record Money(decimal Amount, string Currency);
record Line(string Sku, int Quantity, Money UnitPrice);
record PlaceOrder(string RequestId, string CustomerId, ImmutableArray<Line> Lines);

static class CapstoneMapping
{
    public static Money Total(PlaceOrder command)
    {
        var currency = command.Lines[0].UnitPrice.Currency;
        return new(command.Lines.Sum(x => x.UnitPrice.Amount * x.Quantity), currency);
    }
    // TODO mirrors Java capstone: one transaction for stock + order + idempotency + outbox.
}
