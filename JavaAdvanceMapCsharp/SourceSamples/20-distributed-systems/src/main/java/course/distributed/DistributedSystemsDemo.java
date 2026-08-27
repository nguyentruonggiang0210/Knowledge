package course.distributed;

import java.util.concurrent.ConcurrentHashMap;

public final class DistributedSystemsDemo {
    // Process-local model of optimistic version semantics; it is not a distributed store or consensus proof.
    record VersionedValue(String value, long version) { }
    static final class StaleWrite extends RuntimeException {
        StaleWrite(long expected, long actual) { super("expected version " + expected + " but was " + actual); }
    }

    static final class VersionedStore {
        private final ConcurrentHashMap<String, VersionedValue> data = new ConcurrentHashMap<>();

        VersionedValue create(String key, String value) {
            var created = new VersionedValue(value, 1);
            if (data.putIfAbsent(key, created) != null) throw new IllegalStateException("already exists");
            return created;
        }

        VersionedValue update(String key, long expectedVersion, String value) {
            return data.compute(key, (ignored, current) -> {
                if (current == null) throw new IllegalArgumentException("not found");
                if (current.version() != expectedVersion) throw new StaleWrite(expectedVersion, current.version());
                return new VersionedValue(value, current.version() + 1);
            });
        }
    }

    public static void main(String[] args) {
        var store = new VersionedStore();
        var first = store.create("profile:42", "email=v1@example.com");
        var second = store.update("profile:42", first.version(), "email=v2@example.com");
        System.out.println(second);
        try {
            store.update("profile:42", first.version(), "stale overwrite");
        } catch (StaleWrite conflict) {
            System.out.println("rejected stale writer: " + conflict.getMessage());
        }
    }
}
