package course.capstone;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

public final class CapstoneDemo {
    record Money(BigDecimal amount, String currency) {
        Money { Objects.requireNonNull(amount); Objects.requireNonNull(currency); if (amount.signum() < 0) throw new IllegalArgumentException("negative money"); }
        Money add(Money other) {
            if (!currency.equals(other.currency)) throw new IllegalArgumentException("currency mismatch");
            return new Money(amount.add(other.amount), currency);
        }
    }
    record Line(String sku, int quantity, Money unitPrice) {
        Line { if (quantity <= 0) throw new IllegalArgumentException("quantity must be positive"); }
        Money subtotal() { return new Money(unitPrice.amount().multiply(BigDecimal.valueOf(quantity)), unitPrice.currency()); }
    }
    record PlaceOrder(String requestId, String customerId, List<Line> lines) {
        PlaceOrder { lines = List.copyOf(lines); if (lines.isEmpty()) throw new IllegalArgumentException("empty order"); }
    }
    record Order(String id, Money total, Instant placedAt) { }

    interface OrderTransaction {
        Order executeIdempotently(PlaceOrder command, Instant now);
        // TODO: atomically reserve stock, save order/idempotency key and append outbox event.
    }

    static final class PlaceOrderHandler {
        private final OrderTransaction transaction; private final Clock clock;
        PlaceOrderHandler(OrderTransaction transaction, Clock clock) { this.transaction = transaction; this.clock = clock; }
        Order handle(PlaceOrder command) { return transaction.executeIdempotently(command, clock.instant()); }
    }

    static Money totalOf(List<Line> lines) {
        String currency = lines.getFirst().unitPrice().currency();
        return lines.stream().map(Line::subtotal).reduce(new Money(BigDecimal.ZERO, currency), Money::add);
    }

    public static void main(String[] args) {
        var lines = List.of(new Line("JAVA-21", 2, new Money(new BigDecimal("19.95"), "USD")));
        System.out.println("starter total=" + totalOf(lines));
        System.out.println("Next: implement OrderTransaction with JDBC and tests from the capstone lesson.");
    }
}
