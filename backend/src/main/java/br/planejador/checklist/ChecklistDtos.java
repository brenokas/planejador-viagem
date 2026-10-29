package br.planejador.checklist;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ChecklistDtos {

	private ChecklistDtos() {
	}

	public record ItemRequest(
			@NotNull(message = "Escolha o tipo.") ChecklistType tipo,
			@NotBlank(message = "Escreva o item.") @Size(max = 200, message = "Texto muito longo.") String texto,
			Long responsavelId,
			LocalDate prazo,
			Integer version) {
	}

	public record BulkRequest(
			@NotNull(message = "Escolha o tipo.") ChecklistType tipo,
			@NotEmpty(message = "Informe pelo menos um item.") @Size(max = 100, message = "Itens demais de uma vez.") List<@NotBlank @Size(max = 200) String> textos) {
	}

	public record DoneRequest(boolean feito) {
	}

	public record ItemResponse(
			Long id,
			ChecklistType tipo,
			String texto,
			boolean feito,
			Long responsavelId,
			LocalDate prazo,
			String feitoPorNome,
			int version) {
	}
}
