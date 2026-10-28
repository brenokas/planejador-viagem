package br.planejador.itinerary;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.auth.CurrentUser;
import br.planejador.itinerary.ActivityDtos.ActivityRequest;
import br.planejador.itinerary.ActivityDtos.ActivityResponse;
import br.planejador.itinerary.ActivityDtos.ReorderRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trips/{tripId}/activities")
public class ActivityController {

	private final ActivityService service;

	public ActivityController(ActivityService service) {
		this.service = service;
	}

	@GetMapping
	List<ActivityResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId) {
		return service.list(tripId, CurrentUser.id(jwt));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	ActivityResponse create(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId,
			@Valid @RequestBody ActivityRequest req) {
		return service.create(tripId, CurrentUser.id(jwt), req);
	}

	@PutMapping("/{id}")
	ActivityResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId, @PathVariable Long id,
			@Valid @RequestBody ActivityRequest req) {
		return service.update(tripId, id, CurrentUser.id(jwt), req);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId, @PathVariable Long id) {
		service.delete(tripId, id, CurrentUser.id(jwt));
	}

	@PutMapping("/order")
	List<ActivityResponse> reorder(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId,
			@Valid @RequestBody ReorderRequest req) {
		return service.reorder(tripId, CurrentUser.id(jwt), req);
	}
}
