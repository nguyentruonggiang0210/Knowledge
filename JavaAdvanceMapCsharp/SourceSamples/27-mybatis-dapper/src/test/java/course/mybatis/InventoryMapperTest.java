package course.mybatis;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.io.IOException;
import org.apache.ibatis.datasource.pooled.PooledDataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class InventoryMapperTest {
    private static final SqlSessionFactory FACTORY;

    static {
        try {
            FACTORY = MyBatisDemo.buildFactory();
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    @BeforeEach
    void reset() {
        MyBatisDemo.resetSchema(FACTORY);
    }

    @AfterAll
    static void closePool() {
        var dataSource = FACTORY.getConfiguration().getEnvironment().getDataSource();
        if (dataSource instanceof PooledDataSource pooled) pooled.forceCloseAll();
    }

    @Test
    void generatedKeyDynamicSearchAndRollbackAreExplicit() {
        var row = new InventoryInsert("JAVA-25", 4);
        try (var session = FACTORY.openSession()) {
            assertEquals(1, session.getMapper(InventoryMapper.class).insert(row));
            session.commit();
        }
        assertNotNull(row.getId());

        try (var session = FACTORY.openSession()) {
            var mapper = session.getMapper(InventoryMapper.class);
            var item = mapper.findBySku("JAVA-25");
            assertEquals(1, mapper.reserve(item.sku(), 2, item.version()));
            session.rollback();
        }

        try (var session = FACTORY.openSession()) {
            var mapper = session.getMapper(InventoryMapper.class);
            assertEquals(4, mapper.findBySku("JAVA-25").stock());
            assertEquals(1, mapper.search("JAVA", 1, true).size());
        }
    }
}
