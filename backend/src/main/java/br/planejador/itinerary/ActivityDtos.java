package br.planejador.itinerary;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public final class ActivityDtos {

	private ActivityDtos() {
	}

	public record ActivityRequest(
			@NotBlank(message = "Informe um título.") @Size(max = 150, message = "Título muito longo.") String titulo,
			LocalDate data,
			LocalTime horaInicio,
			LocalTime horaFim,
			@NotNull(message = "Escolha uma categoria.") ActivityCategory categoria,
			@Size(max = 300, message = "Nome do local muito longo.") String localNome,
			@DecimalMin(value = "-90", message = "Latitude inválida.") @DecimalMax(value = "90", message = "Latitude inválida.") Double lat,
			@DecimalMin(value = "-180", message = "Longitude inválida.") @DecimalMax(value = "180", message = "Longitude inválida.") Double lng,
			@PositiveOrZero(message = "O custo não pode ser negativo.") @Max(value = 100_000_000_00L, message = "Custo muito alto.") Long custoCentavos,
			@Size(max = 5000, message = "Notas muito longas.") String notas,
			Integer version) {
	}

	/** Nova ordem das atividades de um dia (data nula = Ideias). Deve conter todos os ids do dia. */
	public record ReorderRequest(LocalDate data, @NotNull List<Long> ids) {
	}

	/** Várias atividades de uma vez (ex.: sugestões aceitas da IA). */
	public record BulkRequest(
			@NotNull @Size(min = 1, max = 60, message = "Envie entre 1 e 60 atividades.") List<@Valid ActivityRequest> itens) {
	}

	public record ActivityResponse(
			Long id,
			String titulo,
			LocalDate data,
			LocalTime horaInicio,
			LocalTime horaFim,
			ActivityCategory categoria,
			String localNome,
			Double lat,
			Double lng,
			Long custoCentavos,
			String notas,
			int ordem,
			String atualizadoPorNome,
			Instant atualizadoEm,
			int version) {
	}
}
