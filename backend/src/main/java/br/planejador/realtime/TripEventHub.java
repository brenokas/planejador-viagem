package br.planejador.realtime;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Conexões SSE abertas por viagem. Os eventos só avisam o que mudou; o cliente busca os dados de novo pela API,
 * então nenhuma informação da viagem trafega por aqui.
 */
@Component
public class TripEventHub {

	/** tipo: trip, activities, expenses, checklist, chat ou presenca. origem: id da aba que fez a mudança. */
	public record TripEvent(String tipo, String origem, List<Long> online) {
	}

	private record Subscriber(Long userId, SseEmitter emitter) {
	}

	static final Duration TIMEOUT = Duration.ofMinutes(30);
	private static final Logger log = LoggerFactory.getLogger(TripEventHub.class);

	private final Map<Long, Set<Subscriber>> porViagem = new ConcurrentHashMap<>();

	public SseEmitter subscribe(Long tripId, Long userId) {
		SseEmitter emitter = new SseEmitter(TIMEOUT.toMillis());
		Subscriber sub = new Subscriber(userId, emitter);
		porViagem.computeIfAbsent(tripId, k -> new CopyOnWriteArraySet<>()).add(sub);

		Runnable remover = () -> {
			Set<Subscriber> subs = porViagem.get(tripId);
			if (subs != null && subs.remove(sub)) {
				if (subs.isEmpty()) {
					porViagem.remove(tripId, subs);
				}
				publishPresence(tripId);
			}
		};
		emitter.onCompletion(remover);
		emitter.onTimeout(remover);
		emitter.onError(e -> remover.run());

		// Reconexão automática do navegador em 3 s se a conexão cair.
		send(sub, SseEmitter.event().reconnectTime(3000).comment("conectado"));
		publishPresence(tripId);
		return emitter;
	}

	public void publish(Long tripId, String tipo, String origem) {
		broadcast(tripId, new TripEvent(tipo, origem, null));
	}

	public List<Long> online(Long tripId) {
		return porViagem.getOrDefault(tripId, Set.of()).stream().map(Subscriber::userId).distinct().sorted().toList();
	}

	/** Mantém a conexão viva através de proxies (nginx) e detecta clientes que sumiram. */
	@Scheduled(fixedRate = 25_000)
	void heartbeat() {
		porViagem.values().forEach(subs -> subs.forEach(s -> send(s, SseEmitter.event().comment("ping"))));
	}

	private void publishPresence(Long tripId) {
		broadcast(tripId, new TripEvent("presenca", null, online(tripId)));
	}

	private void broadcast(Long tripId, TripEvent event) {
		Set<Subscriber> subs = porViagem.get(tripId);
		if (subs == null) {
			return;
		}
		for (Subscriber s : subs) {
			send(s, SseEmitter.event().data(event, MediaType.APPLICATION_JSON));
		}
	}

	private void send(Subscriber sub, SseEmitter.SseEventBuilder event) {
		// SseEmitter não é seguro para envios simultâneos.
		synchronized (sub.emitter()) {
			try {
				sub.emitter().send(event);
			} catch (IOException | IllegalStateException e) {
				log.debug("Conexão SSE encerrada: {}", e.getMessage());
				sub.emitter().completeWithError(e);
			}
		}
	}
}
