package course.spring;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Clock;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class OrderControllerTest {
    @Test
    void nullTotalIsRejectedAtHttpBoundary() throws Exception {
        var mvc = MockMvcBuilders
            .standaloneSetup(new OrderController(new OrderService(Clock.systemUTC())))
            .setControllerAdvice(new ApiErrorHandler())
            .build();

        mvc.perform(post("/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"requestId\":\"REQ-NULL\",\"total\":null}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }
}
