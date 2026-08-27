package course.runtime;

import java.util.HashSet;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

public final class RuntimeTypesDemo {
    record Money(long cents, String currency) {
        Money {
            if (cents < 0) throw new IllegalArgumentException("cents must be non-negative");
            Objects.requireNonNull(currency);
        }
    }

    static final class Box {
        int value;
        Box(int value) { this.value = value; }
    }

    static void mutateAndReassign(Box box) {
        box.value = 42;       // caller sees mutation
        box = new Box(999);   // caller does not see reassignment
    }

    static Optional<String> displayName(String id) {
        return "42".equals(id) ? Optional.of("Ada") : Optional.empty();
    }

    public static void main(String[] args) {
        Integer a = 1000, b = 1000;
        System.out.println("identity=" + (a == b) + ", value=" + a.equals(b));

        var box = new Box(1);
        mutateAndReassign(box);
        System.out.println("pass-by-value reference, box.value=" + box.value);

        Set<Money> prices = new HashSet<>();
        prices.add(new Money(1_000, "USD"));
        System.out.println("record equality/hash lookup=" + prices.contains(new Money(1_000, "USD")));
        System.out.println(displayName("missing").orElse("anonymous"));
    }
}
