module course.modules {
    exports course.modules.spi;
    uses course.modules.spi.GreetingService;
    provides course.modules.spi.GreetingService with course.modules.internal.EnglishGreeting;
}
