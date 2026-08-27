package course.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@Import(OAuthResourceServerSecurityTest.DecoderConfiguration.class)
class OAuthResourceServerSecurityTest {
    @Autowired WebApplicationContext context;
    MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void defaultProfileUsesBearerScopeAuthorization() throws Exception {
        mvc.perform(get("/public")).andExpect(status().isOk());
        mvc.perform(get("/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/admin").with(jwt())).andExpect(status().isForbidden());
        mvc.perform(get("/admin").with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_admin"))))
            .andExpect(status().isOk());
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class DecoderConfiguration {
        @Bean
        JwtDecoder jwtDecoder() {
            // MockMvc's jwt() installs Authentication directly; this bean only satisfies production wiring.
            return token -> { throw new UnsupportedOperationException("not called by jwt() test support"); };
        }
    }
}
