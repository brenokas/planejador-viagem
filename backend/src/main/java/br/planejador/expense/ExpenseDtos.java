package br.planejador.expense;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public final class ExpenseDtos {

	private ExpenseDtos() {
	}

	public record ExpenseRequest(
			@NotBlank(message = "Informe uma descrição.") @Size(max = 150, message = "Descrição muito longa.") String descricao,
			@NotNull(message = "Escolha uma categoria.") ExpenseCategory categoria,
			@NotNull(message = "Informe o valor.") @Positive(message = "O valor deve ser maior que zero.") @Max(value = 100_000_000_00L, message = "Valor muito alto.") Long valorCentavos,
			@NotBlank(message = "Informe a moeda.") @Pattern(regexp = "[A-Za-z]{3}", message = "Moeda inválida.") String moeda,
			/** Opcional: se ausente e a moeda for diferente da viagem, usa a cotação do dia. */
			@DecimalMin(value = "0.00000001", message = "Taxa inválida.") BigDecimal taxaCambio,
			@NotNull(message = "Informe a data.") LocalDate data,
			@NotNull(message = "Informe quem pagou.") Long pagoPor,
			@NotNull(message = "Escolha como dividir.") SplitMode modoDivisao,
			/** Modo IGUAL: quem participa da divisão. */
			List<Long> participantes,
			/** Modo VALORES: valor (na moeda da despesa) de cada pessoa; a soma deve ser o total. */
			Map<Long, Long> valores,
			Integer version) {
	}

	public record PersonRef(Long id, String nome) {
	}

	public record ShareResponse(Long userId, String nome, long valorCentavos, long valorConvertidoCentavos) {
	}

	public record ExpenseResponse(
			Long id,
			String descricao,
			ExpenseCategory categoria,
			long valorCentavos,
			String moeda,
			BigDecimal taxaCambio,
			long valorConvertidoCentavos,
			LocalDate data,
			PersonRef pagoPor,
			SplitMode modoDivisao,
			List<ShareResponse> divisao,
			String atualizadoPorNome,
			Instant atualizadoEm,
			int version) {
	}

	public record CategoryTotal(ExpenseCategory categoria, long totalCentavos) {
	}

	/** pagou − consumo = saldo (positivo: tem a receber; negativo: deve). */
	public record PersonBalance(Long id, String nome, long pagouCentavos, long consumoCentavos, long saldoCentavos) {
	}

	public record Settlement(PersonRef de, PersonRef para, long valorCentavos) {
	}

	public record SummaryResponse(
			String moeda,
			Long orcamentoCentavos,
			long totalGastoCentavos,
			long previstoRoteiroCentavos,
			List<CategoryTotal> porCategoria,
			List<PersonBalance> pessoas,
			List<Settlement> acertos) {
	}

	public record RateResponse(String de, String para, BigDecimal taxa, Instant atualizadoEm) {
	}

	public record SettleRequest(@NotNull Long de, @NotNull Long para, @NotNull @Positive Long valorCentavos) {
	}
}
