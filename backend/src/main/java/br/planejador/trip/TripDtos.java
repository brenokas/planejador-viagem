package br.planejador.trip;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public final class TripDtos {

	private TripDtos() {
	}

	public record TripRequest(
			@NotBlank(message = "Informe um título.") @Size(max = 120, message = "Título muito longo.") String titulo,
			@NotBlank(message = "Informe o destino.") @Size(max = 200, message = "Destino muito longo.") String destino,
			@NotNull(message = "Informe a data de ida.") LocalDate dataInicio,
			@NotNull(message = "Informe a data de volta.") LocalDate dataFim,
			@NotBlank(message = "Informe a moeda.") @Pattern(regexp = "[A-Za-z]{3}", message = "Moeda inválida.") String moeda,
			@PositiveOrZero(message = "O orçamento não pode ser negativo.") @Max(value = 100_000_000_00L, message = "Orçamento muito alto.") Long orcamentoCentavos,
			@Size(max = 1000, message = "URL muito longa.") @Pattern(regexp = "^(https?://.*)?$", message = "Use um endereço http(s).") String capaUrl,
			Integer version) {
	}

	public record ArchiveRequest(boolean arquivada) {
	}

	public record MemberResponse(Long id, String nome, String avatarUrl, TripRole papel) {
	}

	public record TripResponse(
			Long id,
			String titulo,
			String destino,
			LocalDate dataInicio,
			LocalDate dataFim,
			String moeda,
			Long orcamentoCentavos,
			String capaUrl,
			boolean arquivada,
			TripRole meuPapel,
			List<MemberResponse> membros,
			Instant atualizadoEm,
			int version) {
	}

	public record InviteResponse(String token, Instant expiraEm) {
	}

	public record InvitePreview(
			Long tripId,
			String titulo,
			String destino,
			LocalDate dataInicio,
			LocalDate dataFim,
			String convidadoPor,
			boolean jaMembro) {
	}
}
