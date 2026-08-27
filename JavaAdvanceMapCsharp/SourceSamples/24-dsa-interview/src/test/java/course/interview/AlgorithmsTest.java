package course.interview;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;

class AlgorithmsTest {
    @Test void twoSumUsesDifferentIndicesAndHandlesOverflow() {
        assertArrayEquals(new int[] { 0, 2 }, Algorithms.twoSum(new int[] { 3, 3, 4 }, 7));
        assertArrayEquals(new int[0], Algorithms.twoSum(new int[] { Integer.MIN_VALUE, 1 }, Integer.MAX_VALUE));
    }

    @Test void topologicalOrderDetectsCycle() {
        assertTrue(Algorithms.topologicalOrder(2, new int[][] {{0, 1}, {1, 0}}).hasCycle());
        assertFalse(Algorithms.topologicalOrder(0, new int[0][]).hasCycle());
        int[][] edges = {{0, 1}, {0, 2}, {1, 3}, {2, 3}};
        var result = Algorithms.topologicalOrder(4, edges);
        assertFalse(result.hasCycle());
        assertEquals(4, result.order().size());
        for (int[] edge : edges)
            assertTrue(result.order().indexOf(edge[0]) < result.order().indexOf(edge[1]));
    }

    @Test void slidingWindowCountsUnicodeCodePoints() {
        assertEquals(3, Algorithms.longestUniqueCodePointSubstring("a😀b😀c"));
        assertEquals(0, Algorithms.longestUniqueCodePointSubstring(""));
    }

    @Test void heapTreeAndTrieCoverCoreDataStructures() {
        assertEquals(List.of(9, 9, 7), Algorithms.kLargest(new int[] {3, 9, 1, 9, 7}, 3));
        var tree = new Algorithms.TreeNode(1,
            new Algorithms.TreeNode(2, new Algorithms.TreeNode(3, null, null), null),
            new Algorithms.TreeNode(4, null, null));
        assertEquals(3, Algorithms.maxDepth(tree));
        var trie = new Algorithms.Trie();
        trie.insert("java😀");
        assertTrue(trie.startsWith("java"));
        assertTrue(trie.contains("java😀"));
        assertFalse(trie.contains("java"));
    }

    @Test void unionFindAndDijkstraCoverGraphVariations() {
        assertEquals(2, Algorithms.connectedComponents(5, new int[][] {{0, 1}, {1, 2}, {3, 4}}));
        long[] distances = Algorithms.shortestPaths(4,
            new int[][] {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 1}, {2, 3, 5}}, 0);
        assertArrayEquals(new long[] {0, 3, 1, 4}, distances);
        assertThrows(IllegalArgumentException.class,
            () -> Algorithms.shortestPaths(2, new int[][] {{0, 1, -1}}, 0));
    }

    @Test void backtrackingCopiesStateAndDynamicProgrammingHandlesImpossibleCase() {
        var subsets = Algorithms.subsets(new int[] {1, 2});
        assertEquals(4, subsets.size());
        assertTrue(subsets.contains(List.of()));
        assertTrue(subsets.contains(List.of(1, 2)));
        assertEquals(2, Algorithms.minimumCoins(new int[] {1, 3, 4}, 6));
        assertEquals(-1, Algorithms.minimumCoins(new int[] {2}, 3));
        assertThrows(IllegalArgumentException.class, () -> Algorithms.minimumCoins(new int[] {0}, 0));
    }
}
