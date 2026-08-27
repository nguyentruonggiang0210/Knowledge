package course.streams;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class StreamDemo {
    record Order(String customer, String category, BigDecimal total) { }

    public static void main(String[] args) {
        var orders = List.of(
            new Order("Ada", "book", new BigDecimal("40.00")),
            new Order("Ada", "tool", new BigDecimal("70.00")),
            new Order("Linus", "book", new BigDecimal("25.00")));

        Map<String, BigDecimal> spendByCustomer = orders.stream()
            .filter(o -> o.total().compareTo(new BigDecimal("30")) >= 0)
            .collect(Collectors.toMap(Order::customer, Order::total, BigDecimal::add));

        Map<String, List<Order>> byCategory = orders.stream()
            .collect(Collectors.groupingBy(Order::category));

        System.out.println(spendByCustomer);
        byCategory.forEach((category, rows) -> System.out.println(category + "=" + rows.size()));
    }
}
