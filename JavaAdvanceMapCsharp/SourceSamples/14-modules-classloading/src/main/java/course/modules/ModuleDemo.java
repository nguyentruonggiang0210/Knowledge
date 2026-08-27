package course.modules;

import course.modules.spi.GreetingService;
import java.util.ServiceLoader;

public final class ModuleDemo {
    public static void main(String[] args) {
        ServiceLoader.load(GreetingService.class).stream().forEach(provider -> {
            var service = provider.get();
            System.out.println(service.language() + ": " + service.greet("Senior Engineer"));
            System.out.println("defined by=" + service.getClass().getClassLoader());
            System.out.println("module=" + service.getClass().getModule().getName());
        });
    }
}
