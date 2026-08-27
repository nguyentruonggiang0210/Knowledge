package course.jpa;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class InventoryIntegrationTest {
    @Autowired InventoryRepository repository;
    @Autowired InventoryService service;

    @BeforeEach void reset() {
        repository.deleteAll();
        repository.saveAndFlush(new InventoryItem("JAVA-25", 2));
    }

    @Test void conditionalUpdatePreventsNegativeStock() {
        service.reserve("JAVA-25", 2);
        assertEquals(0, repository.findById("JAVA-25").orElseThrow().getStock());
        assertThrows(IllegalStateException.class, () -> service.reserve("JAVA-25", 1));
    }
}
