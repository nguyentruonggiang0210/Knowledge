package course.architecture;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public final class ArchitectureDemo {
    record OrderId(String value) { OrderId { Objects.requireNonNull(value); } }
    record Order(OrderId id, BigDecimal total) { }
    record PlaceOrder(String requestId, BigDecimal total) { }

    interface OrderRepository {
        Optional<Order> findByRequestId(String requestId);
        void save(String requestId, Order order);
    }
    interface IdGenerator { OrderId next(); }

    static final class PlaceOrderHandler {
        private final OrderRepository repository;
        private final IdGenerator ids;
        PlaceOrderHandler(OrderRepository repository, IdGenerator ids) {
            this.repository = repository; this.ids = ids;
        }
        Order handle(PlaceOrder command) {
            if (command.total().signum() < 0) throw new IllegalArgumentException("negative total");
            return repository.findByRequestId(command.requestId()).orElseGet(() -> {
                var order = new Order(ids.next(), command.total());
                repository.save(command.requestId(), order);
                return order;
            });
        }
    }

    static final class InMemoryOrders implements OrderRepository {
        private final Map<String, Order> data = new HashMap<>();
        public Optional<Order> findByRequestId(String requestId) { return Optional.ofNullable(data.get(requestId)); }
        public void save(String requestId, Order order) { data.put(requestId, order); }
    }

    public static void main(String[] args) {
        var handler = new PlaceOrderHandler(new InMemoryOrders(), () -> new OrderId("ORD-42"));
        var first = handler.handle(new PlaceOrder("REQ-1", new BigDecimal("25.00")));
        var retry = handler.handle(new PlaceOrder("REQ-1", new BigDecimal("25.00")));
        System.out.println("idempotent=" + first.equals(retry) + ", order=" + first);
    }
}
