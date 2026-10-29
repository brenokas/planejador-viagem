package br.planejador.ai;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import br.planejador.itinerary.ActivityCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AiDtos {

	private AiDtos() {
	}

	public enum Ritmo {
		TRANQUILO,
		EQUILIBRADO,
		INTENSO
	}

	public record ItineraryRequest(
			Ritmo ritmo,
			@Size(max = 10) List<@Size(max = 40) String> interesses,
			@Size(max = 500, message = "Observações muito longas.") String observacoes) {
	}

	/** data nula = sugestões para "Ideias". */
	public record DayRequest(LocalDate data, @Size(max = 300, message = "Pedido muito longo.") String pedido) {
	}

	/** Atividade sugerida, ainda não salva. O usuário escolhe quais aceitar. */
	public record ActivitySuggestion(
			LocalDate data,
			String titulo,
			LocalTime horaInicio,
			LocalTime horaFim,
			ActivityCategory categoria,
			String localNome,
			Double lat,
			Double lng,
			Long custoCentavos,
			String notas) {
	}

	public record SuggestionsResponse(List<ActivitySuggestion> atividades, String aviso) {
	}

	public record PackingResponse(List<String> bagagem, List<String> tarefas) {
	}

	public record ChatRequest(
			@NotBlank(message = "Escreva uma pergunta.") @Size(max = 1000, message = "Pergunta muito longa.") String mensagem) {
	}

	public record ChatMessage(Long id, String role, Long autorId, String autorNome, String conteudo, Instant criadoEm) {
	}

	/** Formato que pedimos ao modelo (validado e convertido em {@link ActivitySuggestion}). */
	record RawActivity(Integer dia, String titulo, String horaInicio, String horaFim, String categoria,
			String localNome, Double lat, Double lng, Double custoEstimado, String notas) {
	}

	record RawActivities(List<RawActivity> atividades) {
	}

	record RawPacking(List<String> bagagem, List<String> tarefas) {
	}
}
