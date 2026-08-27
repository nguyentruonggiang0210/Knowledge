package course.jpa;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {
    private final InventoryRepository repository;
    public InventoryService(InventoryRepository repository) { this.repository = repository; }

    @Transactional
    public void reserve(String sku, int quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("quantity must be positive");
        if (repository.reserveAtomically(sku, quantity) != 1)
            throw new IllegalStateException("unknown SKU or insufficient stock");
    }
}
