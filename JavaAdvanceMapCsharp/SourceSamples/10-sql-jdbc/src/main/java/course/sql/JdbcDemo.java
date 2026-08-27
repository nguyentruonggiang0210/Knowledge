package course.sql;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import javax.sql.DataSource;

public final class JdbcDemo {
    public static void main(String[] args) throws Exception {
        try (var dataSource = createDataSource()) {
            runSchema(dataSource);
            insertInventory(dataSource, "JAVA-21", 2);
            reserveAtomically(dataSource, "JAVA-21", 1);
            System.out.println("stock=" + stockOf(dataSource, "JAVA-21"));

            try {
                insertOrderThenFail(dataSource);
            } catch (SQLException expected) {
                System.out.println("transaction rolled back: " + expected.getMessage());
            }
            if (orderCount(dataSource) != 0) throw new IllegalStateException("rollback leaked an order");
        }
    }

    static HikariDataSource createDataSource() {
        var config = new HikariConfig();
        config.setJdbcUrl("jdbc:h2:mem:course;DB_CLOSE_DELAY=-1");
        config.setUsername("sa");
        config.setPassword("");
        config.setMaximumPoolSize(2);
        config.setMinimumIdle(0);
        config.setConnectionTimeout(1_000);
        config.setPoolName("course-pool");
        return new HikariDataSource(config);
    }

    static void insertInventory(DataSource dataSource, String sku, int stock) throws SQLException {
        try (var connection = dataSource.getConnection();
             var insert = connection.prepareStatement("INSERT INTO inventory(sku, stock) VALUES (?, ?)")) {
            insert.setString(1, sku);
            insert.setInt(2, stock);
            insert.executeUpdate();
        }
    }

    static boolean reserveAtomically(DataSource dataSource, String sku, int quantity) throws SQLException {
        try (var connection = dataSource.getConnection();
             var update = connection.prepareStatement(
                 "UPDATE inventory SET stock = stock - ?, version = version + 1 WHERE sku = ? AND stock >= ?")) {
            update.setQueryTimeout(2);
            update.setInt(1, quantity); update.setString(2, sku); update.setInt(3, quantity);
            return update.executeUpdate() == 1;
        }
    }

    static int stockOf(DataSource dataSource, String sku) throws SQLException {
        try (var connection = dataSource.getConnection();
             var query = connection.prepareStatement("SELECT stock FROM inventory WHERE sku = ?")) {
            query.setQueryTimeout(2);
            query.setString(1, sku);
            try (var rows = query.executeQuery()) {
                if (!rows.next()) throw new IllegalArgumentException("unknown sku");
                return rows.getInt(1);
            }
        }
    }

    static int orderCount(DataSource dataSource) throws SQLException {
        try (var connection = dataSource.getConnection();
             var query = connection.prepareStatement("SELECT COUNT(*) FROM orders");
             var rows = query.executeQuery()) {
            if (!rows.next()) throw new IllegalStateException("COUNT returned no row");
            return rows.getInt(1);
        }
    }

    static void insertOrderThenFail(DataSource dataSource) throws SQLException {
        try (var connection = dataSource.getConnection()) {
            boolean originalAutoCommit = connection.getAutoCommit();
            boolean transactionEnded = false;
            Throwable primaryFailure = null;
            connection.setAutoCommit(false);

            try {
                try (var statement = connection.prepareStatement(
                    "INSERT INTO orders(request_id, customer_id, total) VALUES (?, ?, ?)")) {
                    statement.setString(1, "REQ-1"); statement.setString(2, "CUS-1"); statement.setBigDecimal(3, new java.math.BigDecimal("10.00"));
                    statement.executeUpdate();
                }
                throw new SQLException("simulated failure after first statement");
            } catch (SQLException | RuntimeException failure) {
                primaryFailure = failure;
                try {
                    connection.rollback();
                    transactionEnded = true;
                } catch (SQLException rollbackFailure) {
                    failure.addSuppressed(rollbackFailure);
                }
                throw failure;
            } finally {
                // setAutoCommit(true) while a transaction is active would commit it. If rollback
                // failed, do not restore here; closing lets the pool reset or evict the connection.
                if (transactionEnded && connection.getAutoCommit() != originalAutoCommit) {
                    try {
                        connection.setAutoCommit(originalAutoCommit);
                    } catch (SQLException resetFailure) {
                        if (primaryFailure != null) primaryFailure.addSuppressed(resetFailure);
                        else throw resetFailure;
                    }
                }
            }
        }
    }

    static void runSchema(DataSource dataSource) throws SQLException, IOException {
        try (var stream = JdbcDemo.class.getResourceAsStream("/schema.sql")) {
            if (stream == null) throw new IllegalStateException("schema.sql missing");
            var sql = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
            try (var connection = dataSource.getConnection();
                 var statement = connection.createStatement()) {
                statement.execute(sql);
            }
        }
    }
}
