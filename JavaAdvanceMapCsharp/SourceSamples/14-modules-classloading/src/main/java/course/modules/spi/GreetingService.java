package course.modules.spi;

public interface GreetingService {
    String language();
    String greet(String name);
}
