package br.planejador.geo;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import br.planejador.common.ApiException;

/**
 * Busca de locais no Nominatim (OpenStreetMap). A política de uso pede no máximo 1 requisição por segundo
 * e um User-Agent identificável, então as chamadas são serializadas e os resultados ficam em cache.
 */
@Service
public class GeoService {

	public record GeoPlace(String nome, String endereco, double lat, double lng) {
	}

	record NominatimPlace(String name, String display_name, String lat, String lon) {
	}

	private static final Logger log = LoggerFactory.getLogger(GeoService.class);
	private static final long INTERVALO_MS = 1100;
	private static final int MAX_CACHE = 500;

	private final RestClient client;
	private final Map<String, List<GeoPlace>> cache = Collections.synchronizedMap(
			new LinkedHashMap<>(16, 0.75f, true) {
				@Override
				protected boolean removeEldestEntry(Map.Entry<String, List<GeoPlace>> eldest) {
					return size() > MAX_CACHE;
				}
			});
	private long ultimaChamada;

	public GeoService(@Value("${app.geo.nominatim-url:https://nominatim.openstreetmap.org}") String baseUrl) {
		var factory = new JdkClientHttpRequestFactory(
				HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
		factory.setReadTimeout(Duration.ofSeconds(8));
		this.client = RestClient.builder()
				.baseUrl(baseUrl)
				.requestFactory(factory)
				.defaultHeader("User-Agent", "planejador-de-viagem/1.0 (uso pessoal)")
				.defaultHeader("Accept-Language", "pt-BR,pt;q=0.9,en;q=0.5")
				.build();
	}

	public List<GeoPlace> search(String query) {
		String q = query == null ? "" : query.trim();
		if (q.length() < 3) {
			return List.of();
		}
		String chave = q.toLowerCase(Locale.ROOT);
		List<GeoPlace> cached = cache.get(chave);
		if (cached != null) {
			return cached;
		}
		List<GeoPlace> result = fetch(q);
		cache.put(chave, result);
		return result;
	}

	private synchronized List<GeoPlace> fetch(String q) {
		esperarIntervalo();
		try {
			List<NominatimPlace> places = client.get()
					.uri(b -> b.path("/search")
							.queryParam("q", q)
							.queryParam("format", "jsonv2")
							.queryParam("limit", 6)
							.build())
					.retrieve()
					.body(new ParameterizedTypeReference<List<NominatimPlace>>() {
					});
			if (places == null) {
				return List.of();
			}
			return places.stream().map(GeoService::toPlace).toList();
		} catch (RestClientException e) {
			log.warn("Falha ao consultar o Nominatim: {}", e.getMessage());
			throw new ApiException(HttpStatus.BAD_GATEWAY, "A busca de locais está indisponível no momento.");
		} finally {
			ultimaChamada = System.currentTimeMillis();
		}
	}

	private void esperarIntervalo() {
		long espera = ultimaChamada + INTERVALO_MS - System.currentTimeMillis();
		if (espera > 0) {
			try {
				Thread.sleep(espera);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
			}
		}
	}

	private static GeoPlace toPlace(NominatimPlace p) {
		String nome = p.name() != null && !p.name().isBlank() ? p.name() : p.display_name().split(",")[0];
		return new GeoPlace(nome, p.display_name(), Double.parseDouble(p.lat()), Double.parseDouble(p.lon()));
	}
}
