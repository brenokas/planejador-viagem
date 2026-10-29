package br.planejador.ai;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.ai.AiDtos.ChatMessage;
import br.planejador.ai.AiDtos.ChatRequest;
import br.planejador.ai.AiDtos.DayRequest;
import br.planejador.ai.AiDtos.ItineraryRequest;
import br.planejador.ai.AiDtos.PackingResponse;
import br.planejador.ai.AiDtos.SuggestionsResponse;
import br.planejador.auth.CurrentUser;
import jakarta.validation.Valid;

/** Sugestões da IA. Nada é salvo automaticamente: o usuário revisa e aceita pelos endpoints normais. */
@RestController
@RequestMapping("/api/trips/{tripId}/ai")
public class AiController {

	private final AiService ai;

	public AiController(AiService ai) {
		this.ai = ai;
	}

	@PostMapping("/itinerary")
	SuggestionsResponse itinerary(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId,
			@Valid @RequestBody ItineraryRequest req) {
		return ai.itinerary(tripId, CurrentUser.id(jwt), req);
	}

	@PostMapping("/day-suggestions")
	SuggestionsResponse day(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId,
			@Valid @RequestBody DayRequest req) {
		return ai.day(tripId, CurrentUser.id(jwt), req);
	}

	@PostMapping("/packing-list")
	PackingResponse packing(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId) {
		return ai.packing(tripId, CurrentUser.id(jwt));
	}

	@GetMapping("/chat")
	List<ChatMessage> history(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId) {
		return ai.history(tripId, CurrentUser.id(jwt));
	}

	@PostMapping("/chat")
	List<ChatMessage> chat(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId,
			@Valid @RequestBody ChatRequest req) {
		return ai.chat(tripId, CurrentUser.id(jwt), req.mensagem());
	}

	@DeleteMapping("/chat")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void clearChat(@AuthenticationPrincipal Jwt jwt, @PathVariable Long tripId) {
		ai.clearChat(tripId, CurrentUser.id(jwt));
	}
}
