package br.planejador.expense;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import br.planejador.common.ApiException;

/** Cotações de câmbio da open.er-api.com (gratuita, sem chave, atualizada uma vez por dia). */
@Service
public class ExchangeRateService {

	public record Rate(String de, String para, BigDecimal taxa, Instant atualizadoEm) {
	}

	record ErApiResponse(String result, Long time_last_update_unix, Map<String, BigDecimal> rates) {
	}

	private record CachedRates(Map<String, BigDecimal> rates, Instant atualizadoEm, Instant buscadoEm) {
	}

	private static final Logger log = LoggerFactory.getLogger(ExchangeRateService.class);
	private static final Duration VALIDADE_CACHE = Duration.ofHours(6);

	private final RestClient client;
	private final Map<String, CachedRates> cache = new ConcurrentHashMap<>();

	public ExchangeRateService(@Value("${app.exchange.url:https://open.er-api.com/v6}") String baseUrl) {
		var factory = new JdkClientHttpRequestFactory(
				HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
		factory.setReadTimeout(Duration.ofSeconds(8));
		this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
	}

	public Rate rate(String de, String para) {
		if (de.equals(para)) {
			return new Rate(de, para, BigDecimal.ONE, Instant.now());
		}
		CachedRates rates = ratesFor(de);
		BigDecimal taxa = rates.rates().get(para);
		if (taxa == null) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Não há cotação disponível de " + de + " para " + para + ".");
		}
		return new Rate(de, para, taxa, rates.atualizadoEm());
	}

	private CachedRates ratesFor(String base) {
		CachedRates cached = cache.get(base);
		if (cached != null && cached.buscadoEm().plus(VALIDADE_CACHE).isAfter(Instant.now())) {
			return cached;
		}
		try {
			ErApiResponse resp = client.get().uri("/latest/{base}", base).retrieve().body(ErApiResponse.class);
			if (resp == null || !"success".equals(resp.result()) || resp.rates() == null) {
				throw new RestClientException("resposta inválida");
			}
			Instant atualizado = resp.time_last_update_unix() != null
					? Instant.ofEpochSecond(resp.time_last_update_unix())
					: Instant.now();
			CachedRates fresh = new CachedRates(resp.rates(), atualizado, Instant.now());
			cache.put(base, fresh);
			return fresh;
		} catch (RestClientException e) {
			log.warn("Falha ao buscar cotação para {}: {}", base, e.getMessage());
			if (cached != null) {
				return cached;
			}
			throw new ApiException(HttpStatus.BAD_GATEWAY,
					"Não foi possível obter a cotação agora. Informe a taxa de câmbio manualmente.");
		}
	}
}
