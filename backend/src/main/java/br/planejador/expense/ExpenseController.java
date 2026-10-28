package br.planejador.expense;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.auth.CurrentUser;
import br.planejador.expense.ExpenseDtos.ExpenseRequest;
import br.planejador.expense.ExpenseDtos.ExpenseResponse;
import br.planejador.expense.ExpenseDtos.RateResponse;
import br.planejador.expense.ExpenseDtos.SettleRequest;
import br.planejador.expense.ExpenseDtos.SummaryResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class ExpenseController {

	private final ExpenseService service;

	public ExpenseController(ExpenseService service) {
		this.service = service;
	}

	@GetMapping("/trips/{tripId}/expenses")
	List<ExpenseResponse> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId) {
		return service.list(tripId, CurrentUser.id(jwt));
	}

	@PostMapping("/trips/{tripId}/expenses")
	@ResponseStatus(HttpStatus.CREATED)
	ExpenseResponse create(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId,
			@Valid @RequestBody ExpenseRequest req) {
		return service.create(tripId, CurrentUser.id(jwt), req);
	}

	@PutMapping("/trips/{tripId}/expenses/{id}")
	ExpenseResponse update(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId, @PathVariable Long id,
			@Valid @RequestBody ExpenseRequest req) {
		return service.update(tripId, id, CurrentUser.id(jwt), req);
	}

	@DeleteMapping("/trips/{tripId}/expenses/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId, @PathVariable Long id) {
		service.delete(tripId, id, CurrentUser.id(jwt));
	}

	@GetMapping("/trips/{tripId}/expenses/summary")
	SummaryResponse summary(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId) {
		return service.summary(tripId, CurrentUser.id(jwt));
	}

	@PostMapping("/trips/{tripId}/expenses/settle")
	@ResponseStatus(HttpStatus.CREATED)
	ExpenseResponse settle(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId,
			@Valid @RequestBody SettleRequest req) {
		return service.settle(tripId, CurrentUser.id(jwt), req);
	}

	@GetMapping("/exchange")
	RateResponse rate(@RequestParam String de, @RequestParam String para) {
		var r = service.rate(de, para);
		return new RateResponse(r.de(), r.para(), r.taxa(), r.atualizadoEm());
	}
}
