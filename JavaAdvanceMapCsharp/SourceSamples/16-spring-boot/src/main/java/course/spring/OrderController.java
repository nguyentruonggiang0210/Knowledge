package course.spring;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
final class OrderController {
    record CreateOrder(@NotBlank String requestId,
                       @NotNull @DecimalMin(value = "0.00") BigDecimal total) { }

    private final OrderService service;
    OrderController(OrderService service) { this.service = service; }

    @PostMapping
    ResponseEntity<OrderService.Order> create(@Valid @RequestBody CreateOrder request) {
        return ResponseEntity.status(201).body(service.create(request.requestId(), request.total()));
    }

    @GetMapping("/by-request/{requestId}")
    ResponseEntity<OrderService.Order> byRequest(@PathVariable String requestId) {
        return service.findByRequest(requestId).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
