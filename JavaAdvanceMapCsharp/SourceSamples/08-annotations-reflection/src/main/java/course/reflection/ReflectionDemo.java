package course.reflection;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;

public final class ReflectionDemo {
    @Retention(RetentionPolicy.RUNTIME)
    @Target(ElementType.METHOD)
    @interface Audited { String action(); }

    interface Checkout { String place(String orderId); }

    static final class CheckoutService implements Checkout {
        @Override @Audited(action = "place-order")
        public String place(String orderId) { return "placed:" + orderId; }
    }

    static Checkout audited(CheckoutService target) {
        return (Checkout) Proxy.newProxyInstance(
            Checkout.class.getClassLoader(), new Class<?>[] { Checkout.class },
            (proxy, interfaceMethod, args) -> {
                var implementation = target.getClass().getMethod(interfaceMethod.getName(), interfaceMethod.getParameterTypes());
                var audit = implementation.getAnnotation(Audited.class);
                if (audit != null) System.out.println("audit action=" + audit.action());
                try {
                    return implementation.invoke(target, args);
                } catch (InvocationTargetException e) {
                    throw e.getCause();
                }
            });
    }

    public static void main(String[] args) {
        Checkout service = audited(new CheckoutService());
        System.out.println(service.place("ORD-42"));
        System.out.println("proxy class=" + service.getClass().getName());
    }
}
