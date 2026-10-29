package br.planejador.realtime;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import br.planejador.auth.CurrentUser;
import br.planejador.trip.TripAccess;
import jakarta.servlet.http.HttpServletResponse;

@RestController
public class RealtimeController {

	private final TripEventHub hub;
	private final TripAccess access;

	public RealtimeController(TripEventHub hub, TripAccess access) {
		this.hub = hub;
		this.access = access;
	}

	@GetMapping(path = "/api/trips/{tripId}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	SseEmitter events(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId, HttpServletResponse response) {
		Long userId = CurrentUser.id(jwt);
		access.requireMember(tripId, userId);
		// Garante que o nginx não segure os eventos em buffer.
		response.setHeader("X-Accel-Buffering", "no");
		response.setHeader("Cache-Control", "no-cache");
		return hub.subscribe(tripId, userId);
	}
}
