package br.planejador.expense;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import br.planejador.common.ApiException;
import br.planejador.expense.ExpenseDtos.PersonBalance;

class ExpenseSplitTest {

	@Test
	void divideIgualDistribuindoCentavosQueSobram() {
		var r = ExpenseService.split(SplitMode.IGUAL, 1000, 1000, List.of(3L, 1L, 2L), null);
		assertThat(r.keySet()).containsExactly(1L, 2L, 3L);
		assertThat(r.values()).extracting(SplitShare::getValorCentavos).containsExactly(334L, 333L, 333L);
		assertThat(r.values().stream().mapToLong(SplitShare::getValorConvertidoCentavos).sum()).isEqualTo(1000);
	}

	@Test
	void converteProporcionalmenteSemPerderCentavos() {
		// 10,01 EUR a 6,1234 → 61,29 BRL
		var r = ExpenseService.split(SplitMode.IGUAL, 1001, 6129, List.of(1L, 2L), null);
		assertThat(r.get(1L).getValorCentavos()).isEqualTo(501);
		assertThat(r.get(2L).getValorCentavos()).isEqualTo(500);
		assertThat(r.get(1L).getValorConvertidoCentavos() + r.get(2L).getValorConvertidoCentavos()).isEqualTo(6129);
	}

	@Test
	void valoresPersonalizadosPrecisamSomarOTotal() {
		var r = ExpenseService.split(SplitMode.VALORES, 1000, 1000, null, Map.of(1L, 700L, 2L, 300L, 3L, 0L));
		assertThat(r.keySet()).containsExactly(1L, 2L);

		assertThatThrownBy(() -> ExpenseService.split(SplitMode.VALORES, 1000, 1000, null, Map.of(1L, 600L)))
				.isInstanceOf(ApiException.class)
				.hasMessage("Dados inválidos.");
		assertThatThrownBy(() -> ExpenseService.split(SplitMode.IGUAL, 1000, 1000, List.of(), null))
				.isInstanceOf(ApiException.class);
	}

	@Test
	void sugereOMenorNumeroDeAcertos() {
		var acertos = ExpenseService.settlements(List.of(
				new PersonBalance(1L, "Ana", 0, 0, 9000),
				new PersonBalance(2L, "Bruno", 0, 0, -6000),
				new PersonBalance(3L, "Carla", 0, 0, -3000)));
		assertThat(acertos).hasSize(2);
		assertThat(acertos.get(0).de().nome()).isEqualTo("Bruno");
		assertThat(acertos.get(0).para().nome()).isEqualTo("Ana");
		assertThat(acertos.get(0).valorCentavos()).isEqualTo(6000);
		assertThat(acertos.get(1).de().nome()).isEqualTo("Carla");
		assertThat(acertos.get(1).valorCentavos()).isEqualTo(3000);

		assertThat(ExpenseService.settlements(List.of(new PersonBalance(1L, "Ana", 10, 10, 0)))).isEmpty();
	}
}
