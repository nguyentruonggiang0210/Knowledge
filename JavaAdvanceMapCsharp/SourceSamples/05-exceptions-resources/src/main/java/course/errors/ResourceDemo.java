package course.errors;

public final class ResourceDemo {
    static final class DemoResource implements AutoCloseable {
        private final String name;
        DemoResource(String name) { this.name = name; }
        void use() { System.out.println("using " + name); }
        @Override public void close() { throw new IllegalStateException("close failed: " + name); }
    }

    static void operation() {
        try (var first = new DemoResource("first"); var second = new DemoResource("second")) {
            first.use(); second.use();
            throw new IllegalArgumentException("business operation failed");
        }
    }

    public static void main(String[] args) {
        try {
            operation();
        } catch (RuntimeException error) {
            System.out.println("primary=" + error.getMessage());
            for (Throwable suppressed : error.getSuppressed())
                System.out.println("suppressed=" + suppressed.getMessage());
        }
    }
}
