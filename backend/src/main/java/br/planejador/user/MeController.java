package br.planejador.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.auth.CurrentUser;

@RestController
@RequestMapping("/api/me")
public class MeController {

	private final CurrentUser currentUser;

	public MeController(CurrentUser currentUser) {
		this.currentUser = currentUser;
	}

	@GetMapping
	UserResponse me(@AuthenticationPrincipal Jwt jwt) {
		return UserResponse.from(currentUser.load(jwt));
	}
}
