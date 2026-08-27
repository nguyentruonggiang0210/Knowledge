package course.mybatis;

public final class InventoryInsert {
    private Long id;
    private final String sku;
    private final int stock;

    public InventoryInsert(String sku, int stock) {
        if (sku == null || sku.isBlank()) throw new IllegalArgumentException("sku is required");
        if (stock < 0) throw new IllegalArgumentException("stock must be non-negative");
        this.sku = sku;
        this.stock = stock;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSku() { return sku; }
    public int getStock() { return stock; }
}
