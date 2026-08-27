package course.security;

import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@Profile("local")
class SecurityConfiguration {
    @Bean PasswordEncoder passwordEncoder() { return PasswordEncoderFactories.createDelegatingPasswordEncoder(); }

    @Bean UserDetailsService users(
            PasswordEncoder encoder,
            @Value("${course.security.reader-password}") String readerPassword,
            @Value("${course.security.admin-password}") String adminPassword) {
        return new InMemoryUserDetailsManager(
            User.withUsername("reader").password(encoder.encode(readerPassword)).roles("USER").build(),
            User.withUsername("admin").password(encoder.encode(adminPassword)).roles("USER", "ADMIN").build());
    }

    @Bean SecurityFilterChain api(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public").permitAll()
                .requestMatchers("/admin").hasRole("ADMIN")
                .anyRequest().authenticated())
            .httpBasic(withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Local API demo only: no cookie session. Revisit CSRF for browser/cookie authentication.
            .csrf(csrf -> csrf.disable())
            .build();
    }
}

@Configuration
@Profile("!local")
class OAuthResourceServerConfiguration {
    @Bean SecurityFilterChain oauthApi(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public").permitAll()
                .requestMatchers("/admin").hasAuthority("SCOPE_admin")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth -> oauth.jwt(withDefaults()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // Stateless bearer-token API; a cookie/browser flow needs a separate CSRF decision.
            .csrf(csrf -> csrf.disable())
            .build();
    }
}
