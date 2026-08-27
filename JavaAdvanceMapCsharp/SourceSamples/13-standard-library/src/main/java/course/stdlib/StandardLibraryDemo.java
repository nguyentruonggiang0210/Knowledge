package course.stdlib;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Currency;
import java.util.HashSet;
import java.util.Locale;
import java.util.Objects;

public final class StandardLibraryDemo {
    record Money(BigDecimal amount, String currency) {
        Money {
            if (currency == null || currency.isBlank()) throw new IllegalArgumentException("currency required");
            Currency unit;
            try { unit = Currency.getInstance(currency.toUpperCase(Locale.ROOT)); }
            catch (IllegalArgumentException invalidCode) { throw new IllegalArgumentException("ISO currency required", invalidCode); }
            int scale = unit.getDefaultFractionDigits();
            if (scale < 0) throw new IllegalArgumentException("currency has no fixed fraction policy");
            try {
                // This sample rejects excess precision. A real domain may choose an explicit rounding policy instead.
                amount = Objects.requireNonNull(amount, "amount").setScale(scale, RoundingMode.UNNECESSARY);
            } catch (ArithmeticException excessPrecision) {
                throw new IllegalArgumentException("amount exceeds currency fraction digits", excessPrecision);
            }
            currency = unit.getCurrencyCode();
            if (amount.signum() < 0) throw new IllegalArgumentException("negative money");
        }
    }

    public static void main(String[] args) throws Exception {
        demonstrateMoneyAndUnicode();
        demonstrateTimeAndBuffer();
        demonstrateExplicitEncoding();
    }

    private static void demonstrateMoneyAndUnicode() {
        var raw = new HashSet<BigDecimal>();
        raw.add(new BigDecimal("10.0"));
        System.out.println("raw BigDecimal equality=" + raw.contains(new BigDecimal("10.00")));

        var money = new HashSet<Money>();
        money.add(new Money(new BigDecimal("10.0"), "USD"));
        System.out.println("canonical money equality=" + money.contains(new Money(new BigDecimal("10.00"), "USD")));

        var text = "A😀";
        System.out.println("UTF-16 units=" + text.length() + ", code points=" + text.codePointCount(0, text.length()));
        try {
            Math.addExact(Integer.MAX_VALUE, 1);
        } catch (ArithmeticException overflow) {
            System.out.println("overflow detected explicitly");
        }
    }

    private static void demonstrateTimeAndBuffer() {
        var zone = ZoneId.of("America/New_York");
        var localInDstGap = LocalDateTime.of(2026, 3, 8, 2, 30);
        ZonedDateTime resolved = localInDstGap.atZone(zone);
        System.out.println("DST gap resolved to=" + resolved);

        var buffer = ByteBuffer.allocate(16);
        buffer.putInt(42).putInt(7);
        System.out.println("before flip position=" + buffer.position() + ", limit=" + buffer.limit());
        buffer.flip();
        System.out.println("after flip position=" + buffer.position() + ", limit=" + buffer.limit() + ", first=" + buffer.getInt());
    }

    private static void demonstrateExplicitEncoding() throws Exception {
        var file = Files.createTempFile("java-course-", ".txt");
        try {
            Files.writeString(file, "Tiếng Việt 😀", StandardCharsets.UTF_8);
            System.out.println(Files.readString(file, StandardCharsets.UTF_8));
        } finally {
            Files.deleteIfExists(file);
        }
    }
}
