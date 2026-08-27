package course.interview;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.PriorityQueue;

public final class Algorithms {
    private Algorithms() { }

    public record TopologicalResult(List<Integer> order, boolean hasCycle) {
        public TopologicalResult { order = List.copyOf(order); }
    }

    public record TreeNode(int value, TreeNode left, TreeNode right) { }

    private record WeightedEdge(int to, int weight) { }
    private record NodeDistance(int node, long distance) { }

    public static int[] twoSum(int[] values, int target) {
        Map<Integer, Integer> indexByValue = new HashMap<>();
        for (int i = 0; i < values.length; i++) {
            long complement = (long) target - values[i];
            if (complement >= Integer.MIN_VALUE && complement <= Integer.MAX_VALUE) {
                var previous = indexByValue.get((int) complement);
                if (previous != null) return new int[] { previous, i };
            }
            indexByValue.putIfAbsent(values[i], i);
        }
        return new int[0];
    }

    public static TopologicalResult topologicalOrder(int nodes, int[][] edges) {
        if (nodes < 0) throw new IllegalArgumentException("nodes must not be negative");
        List<List<Integer>> graph = new ArrayList<>(nodes);
        for (int i = 0; i < nodes; i++) graph.add(new ArrayList<>());
        int[] indegree = new int[nodes];
        for (var edge : edges) {
            requireEdge(edge, 2, nodes);
            graph.get(edge[0]).add(edge[1]);
            indegree[edge[1]]++;
        }
        var ready = new ArrayDeque<Integer>();
        for (int i = 0; i < nodes; i++) if (indegree[i] == 0) ready.add(i);
        var order = new ArrayList<Integer>(nodes);
        while (!ready.isEmpty()) {
            int current = ready.remove();
            order.add(current);
            for (int next : graph.get(current)) if (--indegree[next] == 0) ready.add(next);
        }
        boolean hasCycle = order.size() != nodes;
        return new TopologicalResult(hasCycle ? List.of() : order, hasCycle);
    }

    public static int longestUniqueCodePointSubstring(String text) {
        int[] codePoints = Objects.requireNonNull(text, "text").codePoints().toArray();
        Map<Integer, Integer> lastSeen = new HashMap<>();
        int left = 0;
        int best = 0;
        for (int right = 0; right < codePoints.length; right++) {
            Integer previous = lastSeen.put(codePoints[right], right);
            if (previous != null && previous >= left) left = previous + 1;
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    public static List<Integer> kLargest(int[] values, int k) {
        Objects.requireNonNull(values, "values");
        if (k < 0 || k > values.length) throw new IllegalArgumentException("k out of range");
        PriorityQueue<Integer> top = new PriorityQueue<>(Math.max(1, k));
        for (int value : values) {
            if (top.size() < k) top.add(value);
            else if (k > 0 && value > top.element()) {
                top.remove();
                top.add(value);
            }
        }
        var result = new ArrayList<>(top);
        result.sort(Comparator.reverseOrder());
        return List.copyOf(result);
    }

    public static int maxDepth(TreeNode root) {
        if (root == null) return 0;
        return 1 + Math.max(maxDepth(root.left()), maxDepth(root.right()));
    }

    public static final class Trie {
        private static final class Node {
            final Map<Integer, Node> children = new HashMap<>();
            boolean terminal;
        }

        private final Node root = new Node();

        public void insert(String word) {
            Node current = root;
            for (int codePoint : Objects.requireNonNull(word, "word").codePoints().toArray())
                current = current.children.computeIfAbsent(codePoint, ignored -> new Node());
            current.terminal = true;
        }

        public boolean contains(String word) {
            Node node = find(word);
            return node != null && node.terminal;
        }

        public boolean startsWith(String prefix) { return find(prefix) != null; }

        private Node find(String text) {
            Node current = root;
            for (int codePoint : Objects.requireNonNull(text, "text").codePoints().toArray()) {
                current = current.children.get(codePoint);
                if (current == null) return null;
            }
            return current;
        }
    }

    public static int connectedComponents(int nodes, int[][] undirectedEdges) {
        if (nodes < 0) throw new IllegalArgumentException("nodes must not be negative");
        var unionFind = new UnionFind(nodes);
        for (int[] edge : undirectedEdges) {
            requireEdge(edge, 2, nodes);
            unionFind.union(edge[0], edge[1]);
        }
        return unionFind.components;
    }

    public static long[] shortestPaths(int nodes, int[][] directedEdges, int source) {
        if (nodes < 0) throw new IllegalArgumentException("nodes must not be negative");
        requireNode(source, nodes);
        List<List<WeightedEdge>> graph = new ArrayList<>(nodes);
        for (int i = 0; i < nodes; i++) graph.add(new ArrayList<>());
        for (int[] edge : directedEdges) {
            requireEdge(edge, 3, nodes);
            if (edge[2] < 0) throw new IllegalArgumentException("Dijkstra requires non-negative weights");
            graph.get(edge[0]).add(new WeightedEdge(edge[1], edge[2]));
        }

        long[] distance = new long[nodes];
        Arrays.fill(distance, Long.MAX_VALUE);
        distance[source] = 0;
        var ready = new PriorityQueue<NodeDistance>(Comparator.comparingLong(NodeDistance::distance));
        ready.add(new NodeDistance(source, 0));
        while (!ready.isEmpty()) {
            NodeDistance current = ready.remove();
            if (current.distance() != distance[current.node()]) continue; // stale heap entry
            for (WeightedEdge edge : graph.get(current.node())) {
                long candidate = Math.addExact(current.distance(), edge.weight());
                if (candidate < distance[edge.to()]) {
                    distance[edge.to()] = candidate;
                    ready.add(new NodeDistance(edge.to(), candidate));
                }
            }
        }
        return distance;
    }

    public static List<List<Integer>> subsets(int[] values) {
        Objects.requireNonNull(values, "values");
        var result = new ArrayList<List<Integer>>();
        buildSubsets(values, 0, new ArrayList<>(), result);
        return List.copyOf(result);
    }

    private static void buildSubsets(int[] values, int index, List<Integer> current,
                                     List<List<Integer>> result) {
        if (index == values.length) {
            result.add(List.copyOf(current));
            return;
        }
        buildSubsets(values, index + 1, current, result);
        current.add(values[index]);
        buildSubsets(values, index + 1, current, result);
        current.remove(current.size() - 1);
    }

    public static int minimumCoins(int[] coins, int amount) {
        Objects.requireNonNull(coins, "coins");
        if (amount < 0) throw new IllegalArgumentException("amount must not be negative");
        if (amount == Integer.MAX_VALUE) throw new IllegalArgumentException("amount is too large for array DP");
        for (int coin : coins)
            if (coin <= 0) throw new IllegalArgumentException("coins must be positive");
        int unreachable = amount + 1;
        int[] best = new int[amount + 1];
        Arrays.fill(best, unreachable);
        best[0] = 0;
        for (int subtotal = 1; subtotal <= amount; subtotal++) {
            for (int coin : coins) {
                if (coin <= subtotal && best[subtotal - coin] != unreachable)
                    best[subtotal] = Math.min(best[subtotal], best[subtotal - coin] + 1);
            }
        }
        return best[amount] == unreachable ? -1 : best[amount];
    }

    private static void requireEdge(int[] edge, int length, int nodes) {
        if (edge == null || edge.length != length) throw new IllegalArgumentException("invalid edge shape");
        requireNode(edge[0], nodes);
        requireNode(edge[1], nodes);
    }

    private static void requireNode(int node, int nodes) {
        if (node < 0 || node >= nodes) throw new IllegalArgumentException("node out of range");
    }

    private static final class UnionFind {
        private final int[] parent;
        private final byte[] rank;
        private int components;

        UnionFind(int size) {
            parent = new int[size];
            rank = new byte[size];
            components = size;
            for (int i = 0; i < size; i++) parent[i] = i;
        }

        int find(int node) {
            if (parent[node] != node) parent[node] = find(parent[node]);
            return parent[node];
        }

        void union(int left, int right) {
            int leftRoot = find(left);
            int rightRoot = find(right);
            if (leftRoot == rightRoot) return;
            if (rank[leftRoot] < rank[rightRoot]) parent[leftRoot] = rightRoot;
            else if (rank[leftRoot] > rank[rightRoot]) parent[rightRoot] = leftRoot;
            else {
                parent[rightRoot] = leftRoot;
                rank[leftRoot]++;
            }
            components--;
        }
    }
}
