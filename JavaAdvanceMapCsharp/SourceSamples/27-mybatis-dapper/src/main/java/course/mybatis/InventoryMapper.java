package course.mybatis;

import java.util.List;
import org.apache.ibatis.annotations.Param;

public interface InventoryMapper {
    void createSchema();
    int deleteAll();
    int insert(InventoryInsert row);
    InventoryItem findBySku(@Param("sku") String sku);

    List<InventoryItem> search(
        @Param("skuPrefix") String skuPrefix,
        @Param("minimumStock") Integer minimumStock,
        @Param("sortByStockDescending") boolean sortByStockDescending);

    int reserve(
        @Param("sku") String sku,
        @Param("quantity") int quantity,
        @Param("expectedVersion") int expectedVersion);
}
