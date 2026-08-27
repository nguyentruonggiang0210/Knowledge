package course.jvm;

import java.util.LinkedHashMap;
import java.util.Map;

public final class JvmMemoryDemo {
    static final class BoundedCache<K, V> extends LinkedHashMap<K, V> {
        private final int capacity;
        BoundedCache(int capacity) { super(capacity, 0.75f, true); this.capacity = capacity; }
        @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > capacity;
        }
    }

    public static void main(String[] args) {
        Map<Integer, byte[]> cache = new BoundedCache<>(100);
        for (int i = 0; i < 10_000; i++) cache.put(i, new byte[1024]);
        Runtime runtime = Runtime.getRuntime();
        long used = runtime.totalMemory() - runtime.freeMemory();
        System.out.printf("bounded entries=%d, approximate used heap=%d KiB%n", cache.size(), used / 1024);
        System.out.println("For real diagnosis use JFR/heap dump; this number is not a benchmark.");
    }
}
