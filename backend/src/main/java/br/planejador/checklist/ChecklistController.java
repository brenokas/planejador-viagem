package br.planejador.checklist;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.auth.CurrentUser;
import br.planejador.checklist.ChecklistDtos.BulkRequest;
import br.planejador.checklist.ChecklistDtos.DoneRequest;
import br.planejador.checklist.ChecklistDtos.ItemRequest;
import br.planejador.checklist.ChecklistDtos.ItemResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trips/{tripId}/checklist")
public class ChecklistController {

	private final ChecklistService service;

	public ChecklistController(ChecklistService service) {
		this.service = service;
	}

	@GetMapping
	List<ItemResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId) {
		return service.list(tripId, CurrentUser.id(jwt));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	ItemResponse create(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId,
			@Valid @RequestBody ItemRequest req) {
		return service.create(tripId, CurrentUser.id(jwt), req);
	}

	@PostMapping("/bulk")
	@ResponseStatus(HttpStatus.CREATED)
	List<ItemResponse> createMany(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId,
			@Valid @RequestBody BulkRequest req) {
		return service.createMany(tripId, CurrentUser.id(jwt), req);
	}

	@PutMapping("/{id}")
	ItemResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId, @PathVariable Long id,
			@Valid @RequestBody ItemRequest req) {
		return service.update(tripId, id, CurrentUser.id(jwt), req);
	}

	@PatchMapping("/{id}/done")
	ItemResponse setDone(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId, @PathVariable Long id,
			@RequestBody DoneRequest req) {
		return service.setDone(tripId, id, CurrentUser.id(jwt), req.feito());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId, @PathVariable Long id) {
		service.delete(tripId, id, CurrentUser.id(jwt));
	}
}
