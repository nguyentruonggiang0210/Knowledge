package course.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(properties = {
    "course.security.reader-password=reader-pass",
    "course.security.admin-password=admin-pass"
})
@ActiveProfiles("local")
class SecurityIntegrationTest {
    @Autowired WebApplicationContext context;
    MockMvc mvc;

    @BeforeEach void setup() { mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build(); }

    @Test void enforcesAuthenticationAndRole() throws Exception {
        mvc.perform(get("/public")).andExpect(status().isOk());
        mvc.perform(get("/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/admin").with(httpBasic("reader", "reader-pass"))).andExpect(status().isForbidden());
        mvc.perform(get("/admin").with(httpBasic("admin", "admin-pass"))).andExpect(status().isOk());
    }
}
