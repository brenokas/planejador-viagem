package br.planejador.trip;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.auth.CurrentUser;
import br.planejador.trip.TripDtos.InvitePreview;
import br.planejador.trip.TripDtos.TripResponse;

@RestController
@RequestMapping("/api/invites")
public class InviteController {

	private final InviteService invites;

	public InviteController(InviteService invites) {
		this.invites = invites;
	}

	@GetMapping("/{token}")
	InvitePreview preview(@AuthenticationPrincipal Jwt jwt, @PathVariable String token) {
		return invites.preview(token, CurrentUser.id(jwt));
	}

	@PostMapping("/{token}/accept")
	TripResponse accept(@AuthenticationPrincipal Jwt jwt, @PathVariable String token) {
		return invites.accept(token, CurrentUser.id(jwt));
	}
}
