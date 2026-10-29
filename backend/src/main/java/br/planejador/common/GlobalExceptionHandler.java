package br.planejador.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	public static final String CONFLITO = "Este item foi alterado por outra pessoa. Recarregue e tente novamente.";

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ApiError> handleApi(ApiException ex) {
		return ResponseEntity.status(ex.getStatus()).body(new ApiError(ex.getMessage(), ex.getCampos()));
	}

	@ExceptionHandler(OptimisticLockingFailureException.class)
	ResponseEntity<ApiError> handleConflict(OptimisticLockingFailureException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(CONFLITO));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> campos = new LinkedHashMap<>();
		ex.getBindingResult().getFieldErrors()
				.forEach(e -> campos.putIfAbsent(e.getField(), e.getDefaultMessage()));
		return ResponseEntity.badRequest().body(new ApiError("Dados inválidos.", campos));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex) {
		return ResponseEntity.badRequest().body(new ApiError("Requisição inválida."));
	}

	@ExceptionHandler({ AsyncRequestNotUsableException.class, AsyncRequestTimeoutException.class })
	void handleStreamClosed() {
		// Cliente fechou a conexão SSE ou ela expirou: comportamento normal, nada a responder.
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ApiError> handleUnexpected(Exception ex) {
		if (ex instanceof ErrorResponse er) {
			return ResponseEntity.status(er.getStatusCode()).body(new ApiError("Requisição não atendida."));
		}
		log.error("Erro inesperado", ex);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ApiError("Ocorreu um erro inesperado. Tente novamente."));
	}
}
