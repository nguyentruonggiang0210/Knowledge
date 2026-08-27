using System;
using System.Collections.Generic;

record OrderId(string Value);
record Order(OrderId Id, decimal Total);
interface IOrderRepository { Order? Find(string requestId); void Save(string requestId, Order order); }
sealed class PlaceOrderHandler(IOrderRepository repository, Func<OrderId> nextId)
{
    public Order Handle(string requestId, decimal total)
    {
        if (total < 0) throw new ArgumentOutOfRangeException(nameof(total));
        var existing = repository.Find(requestId);
        if (existing is not null) return existing;
        var order = new Order(nextId(), total); repository.Save(requestId, order); return order;
    }
}
