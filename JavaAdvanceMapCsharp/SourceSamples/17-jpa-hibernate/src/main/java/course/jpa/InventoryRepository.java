package course.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryRepository extends JpaRepository<InventoryItem, String> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update InventoryItem i set i.stock = i.stock - :quantity, i.version = i.version + 1 " +
           "where i.sku = :sku and i.stock >= :quantity")
    int reserveAtomically(@Param("sku") String sku, @Param("quantity") int quantity);
}
