package br.planejador.common;

import java.util.Map;

public record ApiError(String mensagem, Map<String, String> campos) {

	public ApiError(String mensagem) {
		this(mensagem, Map.of());
	}
}
