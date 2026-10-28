package br.planejador.trip;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.auth.CurrentUser;
import br.planejador.trip.TripDtos.ArchiveRequest;
import br.planejador.trip.TripDtos.InviteResponse;
import br.planejador.trip.TripDtos.TripRequest;
import br.planejador.trip.TripDtos.TripResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trips")
public class TripController {

	private final TripService trips;
	private final InviteService invites;

	public TripController(TripService trips, InviteService invites) {
		this.trips = trips;
		this.invites = invites;
	}

	@GetMapping
	List<TripResponse> list(@AuthenticationPrincipal Jwt jwt,
			@RequestParam(defaultValue = "false") boolean arquivadas) {
		return trips.list(CurrentUser.id(jwt), arquivadas);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	TripResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody TripRequest req) {
		return trips.create(CurrentUser.id(jwt), req);
	}

	@GetMapping("/{id}")
	TripResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return trips.get(id, CurrentUser.id(jwt));
	}

	@PutMapping("/{id}")
	TripResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @Valid @RequestBody TripRequest req) {
		return trips.update(id, CurrentUser.id(jwt), req);
	}

	@PatchMapping("/{id}/archive")
	TripResponse archive(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @RequestBody ArchiveRequest req) {
		return trips.setArchived(id, CurrentUser.id(jwt), req.arquivada());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		trips.delete(id, CurrentUser.id(jwt));
	}

	@DeleteMapping("/{id}/members/{userId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void removeMember(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id, @PathVariable Long userId) {
		trips.removeMember(id, CurrentUser.id(jwt), userId);
	}

	@PostMapping("/{id}/invites")
	@ResponseStatus(HttpStatus.CREATED)
	InviteResponse createInvite(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return invites.create(id, CurrentUser.id(jwt));
	}
}
