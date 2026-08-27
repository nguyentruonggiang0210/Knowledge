package course.domain;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

public final class DomainModelDemo {
    record Money(BigDecimal amount, String currency) {
        Money {
            Objects.requireNonNull(amount); Objects.requireNonNull(currency);
            if (amount.signum() < 0) throw new IllegalArgumentException("negative money");
        }
    }

    sealed interface PaymentMethod permits Card, BankTransfer { }
    record Card(String maskedNumber) implements PaymentMethod { }
    record BankTransfer(String bankCode) implements PaymentMethod { }

    record Order(List<Money> lines, PaymentMethod paymentMethod) {
        Order {
            lines = List.copyOf(lines); // defensive snapshot: record is only shallowly final
            if (lines.isEmpty()) throw new IllegalArgumentException("order needs a line");
            Objects.requireNonNull(paymentMethod);
        }
        String routingKey() {
            return switch (paymentMethod) {
                case Card ignored -> "payment.card";
                case BankTransfer bank -> "payment.bank." + bank.bankCode();
            };
        }
    }

    public static void main(String[] args) {
        var order = new Order(
            List.of(new Money(new BigDecimal("19.99"), "USD")), new Card("****4242"));
        System.out.println(order.routingKey() + " " + order.lines());
    }
}
