package br.planejador.ai;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import br.planejador.common.ApiException;

/**
 * Cliente da Interactions API do Gemini. Não guarda estado no Google ({@code store=false}). Tenta os modelos
 * configurados em ordem: se um estiver sobrecarregado, sem cota ou demorar demais, passa para o próximo.
 */
@Service
public class GeminiClient {

	record Content(String type, String text) {
	}

	record Step(String type, List<Content> content) {
	}

	record Usage(Integer total_tokens) {
	}

	record InteractionResponse(String status, List<Step> steps, Usage usage) {
	}

	private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
	private static final List<String> MODELOS_PADRAO = List.of("gemini-3.5-flash-lite", "gemini-3.8-flash",
			"gemini-flash-latest");

	private final RestClient client;
	private final String apiKey;
	private final List<String> models;

	public GeminiClient(@Value("${app.ai.url}") String baseUrl, @Value("${app.ai.api-key:}") String apiKey,
			@Value("${app.ai.models}") String models) {
		var factory = new JdkClientHttpRequestFactory(
				HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
		factory.setReadTimeout(Duration.ofSeconds(40));
		this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
		this.apiKey = apiKey == null ? "" : apiKey.trim();
		List<String> lista = Arrays.stream(models.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
		this.models = lista.isEmpty() ? MODELOS_PADRAO : lista;
	}

	/** Gera JSON que segue o schema informado. */
	public String generateJson(String system, String input, Map<String, Object> schema) {
		return generate(system, input, Map.of("type", "text", "mime_type", "application/json", "schema", schema));
	}

	/** Gera texto livre. */
	public String generateText(String system, String input) {
		return generate(system, input, null);
	}

	private String generate(String system, String input, Map<String, Object> responseFormat) {
		if (apiKey.isEmpty()) {
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
					"A IA não está configurada. Defina GEMINI_API_KEY no arquivo .env.");
		}
		boolean semCota = false;
		for (String model : models) {
			Map<String, Object> body = new LinkedHashMap<>();
			body.put("model", model);
			body.put("store", false);
			body.put("system_instruction", system);
			body.put("input", input);
			if (responseFormat != null) {
				body.put("response_format", responseFormat);
			}
			try {
				InteractionResponse resp = client.post()
						.uri("/interactions")
						.header("x-goog-api-key", apiKey)
						.body(body)
						.retrieve()
						.body(InteractionResponse.class);
				String text = outputText(resp);
				if (text != null && !text.isBlank()) {
					log.info("IA respondeu com {} ({} tokens)", model,
							resp.usage() != null ? resp.usage().total_tokens() : "?");
					return text;
				}
				log.warn("IA: resposta vazia de {}", model);
			} catch (HttpStatusCodeException e) {
				int status = e.getStatusCode().value();
				if (status == 429) {
					semCota = true;
				}
				if (status == 429 || status == 404 || status >= 500) {
					log.warn("IA: {} indisponível ({}), tentando o próximo modelo", model, status);
					continue;
				}
				log.error("IA: requisição rejeitada por {} ({}): {}", model, status, e.getResponseBodyAsString());
				throw new ApiException(HttpStatus.BAD_GATEWAY, "A IA recusou o pedido. Tente reformular.");
			} catch (ResourceAccessException e) {
				log.warn("IA: {} não respondeu a tempo, tentando o próximo modelo", model);
			}
		}
		if (semCota) {
			throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
					"O limite gratuito da IA foi atingido. Tente de novo em alguns minutos.");
		}
		throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
				"A IA está sobrecarregada no momento. Tente de novo em instantes.");
	}

	private static String outputText(InteractionResponse resp) {
		if (resp == null || resp.steps() == null) {
			return null;
		}
		StringBuilder sb = new StringBuilder();
		for (Step step : resp.steps()) {
			if ("model_output".equals(step.type()) && step.content() != null) {
				for (Content c : step.content()) {
					if ("text".equals(c.type()) && c.text() != null) {
						sb.append(c.text());
					}
				}
			}
		}
		return sb.toString();
	}
}
