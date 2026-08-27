package course.modules.internal;

import course.modules.spi.GreetingService;

public final class EnglishGreeting implements GreetingService {
    public EnglishGreeting() { }
    @Override public String language() { return "en"; }
    @Override public String greet(String name) { return "Hello, " + name; }
}
