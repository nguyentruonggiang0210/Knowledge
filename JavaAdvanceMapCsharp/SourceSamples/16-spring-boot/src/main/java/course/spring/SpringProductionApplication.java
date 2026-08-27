package course.spring;

import java.time.Clock;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableConfigurationProperties(OrderProperties.class)
public class SpringProductionApplication {
    @Bean Clock applicationClock() { return Clock.systemUTC(); }

    public static void main(String[] args) {
        SpringApplication.run(SpringProductionApplication.class, args);
    }
}
