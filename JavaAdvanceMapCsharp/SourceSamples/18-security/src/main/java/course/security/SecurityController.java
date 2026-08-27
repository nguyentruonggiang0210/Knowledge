package course.security;

import java.security.Principal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class SecurityController {
    @GetMapping("/public") String publicEndpoint() { return "public"; }
    @GetMapping("/me") String me(Principal principal) { return principal.getName(); }
    @GetMapping("/admin") String admin() { return "admin"; }
}
