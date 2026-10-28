package br.planejador.common;

import java.util.Map;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

	private final HttpStatus status;
	private final Map<String, String> campos;

	public ApiException(HttpStatus status, String mensagem) {
		this(status, mensagem, Map.of());
	}

	public ApiException(HttpStatus status, String mensagem, Map<String, String> campos) {
		super(mensagem);
		this.status = status;
		this.campos = campos;
	}

	public static ApiException notFound(String mensagem) {
		return new ApiException(HttpStatus.NOT_FOUND, mensagem);
	}

	public static ApiException forbidden(String mensagem) {
		return new ApiException(HttpStatus.FORBIDDEN, mensagem);
	}

	public static ApiException invalidField(String campo, String mensagem) {
		return new ApiException(HttpStatus.BAD_REQUEST, "Dados inválidos.", Map.of(campo, mensagem));
	}

	public HttpStatus getStatus() {
		return status;
	}

	public Map<String, String> getCampos() {
		return campos;
	}
}
