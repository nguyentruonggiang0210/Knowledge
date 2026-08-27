package course.jpa;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import org.hibernate.annotations.Check;

@Entity
@Check(constraints = "stock >= 0")
public class InventoryItem {
    @Id private String sku;
    private int stock;
    @Version private long version;

    protected InventoryItem() { }
    public InventoryItem(String sku, int stock) {
        if (stock < 0) throw new IllegalArgumentException("negative stock");
        this.sku = sku; this.stock = stock;
    }
    public String getSku() { return sku; }
    public int getStock() { return stock; }
    public long getVersion() { return version; }
}
