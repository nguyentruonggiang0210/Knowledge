package course.collections;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public final class CollectionsDemo {
    static <T> void copy(List<? extends T> source, List<? super T> destination) {
        destination.addAll(source);
    }

    static final class Catalog {
        private final List<String> items;
        Catalog(List<String> items) { this.items = List.copyOf(items); }
        List<String> items() { return items; }
    }

    public static void main(String[] args) {
        List<Integer> integers = List.of(1, 2, 3);
        List<Number> numbers = new ArrayList<>();
        copy(integers, numbers); // producer extends, consumer super

        Map<String, Integer> hits = new ConcurrentHashMap<>();
        List.of("java", "csharp", "java").forEach(k -> hits.merge(k, 1, Integer::sum));

        var mutableInput = new ArrayList<>(List.of("A", "B"));
        var catalog = new Catalog(mutableInput);
        mutableInput.add("C");
        System.out.println(numbers + " " + hits + " snapshot=" + catalog.items());
    }
}
