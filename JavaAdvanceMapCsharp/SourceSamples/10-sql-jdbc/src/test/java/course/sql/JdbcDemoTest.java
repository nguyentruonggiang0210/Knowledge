package course.sql;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.SQLException;
import org.junit.jupiter.api.Test;

class JdbcDemoTest {
    @Test
    void failureRollsBackInsteadOfBeingCommittedByAutoCommitReset() throws Exception {
        try (var dataSource = JdbcDemo.createDataSource()) {
            JdbcDemo.runSchema(dataSource);
            assertThrows(SQLException.class, () -> JdbcDemo.insertOrderThenFail(dataSource));
            assertEquals(0, JdbcDemo.orderCount(dataSource));
        }
    }
}
