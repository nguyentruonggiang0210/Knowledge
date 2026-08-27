package course.spring;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
final class ApiErrorHandler {
    @ExceptionHandler(OrderService.IdempotencyConflict.class)
    ProblemDetail conflict(OrderService.IdempotencyConflict error) {
        var detail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, error.getMessage());
        detail.setProperty("code", "IDEMPOTENCY_CONFLICT");
        return detail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validation(MethodArgumentNotValidException error) {
        var detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed");
        detail.setProperty("code", "INVALID_REQUEST");
        return detail;
    }
}
