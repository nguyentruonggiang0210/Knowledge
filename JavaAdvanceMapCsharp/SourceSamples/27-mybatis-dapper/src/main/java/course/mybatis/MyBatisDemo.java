package course.mybatis;

import java.io.IOException;
import org.apache.ibatis.datasource.pooled.PooledDataSource;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;

public final class MyBatisDemo {
    public static void main(String[] args) throws IOException {
        var factory = buildFactory();
        try {
            resetSchema(factory);

            var row = new InventoryInsert("JAVA-21", 5);
            try (var session = factory.openSession()) {
                int affectedRows = session.getMapper(InventoryMapper.class).insert(row);
                session.commit();
                System.out.printf("insert affected=%d, generated id=%d%n", affectedRows, row.getId());
            }

            // SqlSession owns the transaction and is intentionally short-lived/not shared.
            try (var session = factory.openSession()) {
                var mapper = session.getMapper(InventoryMapper.class);
                var before = mapper.findBySku("JAVA-21");
                int affected = mapper.reserve("JAVA-21", 2, before.version());
                System.out.println("reserve before rollback affected=" + affected);
                session.rollback();
            }

            try (var session = factory.openSession()) {
                var mapper = session.getMapper(InventoryMapper.class);
                System.out.println("after rollback=" + mapper.findBySku("JAVA-21"));
                System.out.println("dynamic search=" + mapper.search("JAVA", 1, true));
            }
        } finally {
            var dataSource = factory.getConfiguration().getEnvironment().getDataSource();
            if (dataSource instanceof PooledDataSource pooled) pooled.forceCloseAll();
        }
    }

    public static SqlSessionFactory buildFactory() throws IOException {
        try (var config = Resources.getResourceAsStream("mybatis-config.xml")) {
            return new SqlSessionFactoryBuilder().build(config);
        }
    }

    public static void resetSchema(SqlSessionFactory factory) {
        try (var session = factory.openSession()) {
            var mapper = session.getMapper(InventoryMapper.class);
            mapper.createSchema();
            mapper.deleteAll();
            session.commit();
        }
    }

    private MyBatisDemo() { }
}
