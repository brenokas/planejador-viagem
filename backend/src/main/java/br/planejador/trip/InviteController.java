package br.planejador.trip;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.auth.CurrentUser;
import br.planejador.realtime.TripChangeInterceptor;
import br.planejador.realtime.TripEventHub;
import br.planejador.trip.TripDtos.InvitePreview;
import br.planejador.trip.TripDtos.TripResponse;

@RestController
@RequestMapping("/api/invites")
public class InviteController {

	private final InviteService invites;
	private final TripEventHub events;

	public InviteController(InviteService invites, TripEventHub events) {
		this.invites = invites;
		this.events = events;
	}

	@GetMapping("/{token}")
	InvitePreview preview(@AuthenticationPrincipal Jwt jwt, @PathVariable String token) {
		return invites.preview(token, CurrentUser.id(jwt));
	}

	@PostMapping("/{token}/accept")
	TripResponse accept(@AuthenticationPrincipal Jwt jwt, @PathVariable String token,
			@RequestHeader(name = TripChangeInterceptor.CLIENT_HEADER, required = false) String origem) {
		TripResponse trip = invites.accept(token, CurrentUser.id(jwt));
		events.publish(trip.id(), "trip", origem);
		return trip;
	}
}
