package br.planejador.realtime;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Depois de qualquer alteração bem-sucedida em /api/trips/{id}/..., avisa quem está com a viagem aberta.
 * Roda após o controller, quando a transação do serviço já foi confirmada.
 */
@Component
public class TripChangeInterceptor implements HandlerInterceptor {

	public static final String CLIENT_HEADER = "X-Client-Id";

	private static final Pattern ROTA = Pattern.compile("^/api/trips/(\\d+)(?:/([a-z-]+))?(?:/([a-z-]+))?.*$");

	private final TripEventHub hub;

	public TripChangeInterceptor(TripEventHub hub) {
		this.hub = hub;
	}

	@Override
	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler,
			Exception ex) {
		if (ex != null || "GET".equals(request.getMethod()) || response.getStatus() >= 400) {
			return;
		}
		Matcher m = ROTA.matcher(request.getRequestURI());
		if (!m.matches()) {
			return;
		}
		String tipo = tipo(m.group(2), m.group(3));
		if (tipo != null) {
			hub.publish(Long.valueOf(m.group(1)), tipo, request.getHeader(CLIENT_HEADER));
		}
	}

	/** Qual parte da viagem mudou; null quando a requisição não altera nada visível (ex.: gerar sugestões). */
	static String tipo(String recurso, String subrecurso) {
		if (recurso == null) {
			return "trip";
		}
		return switch (recurso) {
			case "archive", "members" -> "trip";
			case "activities" -> "activities";
			case "expenses" -> "expenses";
			case "checklist" -> "checklist";
			case "ai" -> "chat".equals(subrecurso) ? "chat" : null;
			default -> null;
		};
	}
}
