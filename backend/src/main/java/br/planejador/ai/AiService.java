package br.planejador.ai;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.planejador.ai.AiDtos.ActivitySuggestion;
import br.planejador.ai.AiDtos.ChatMessage;
import br.planejador.ai.AiDtos.DayRequest;
import br.planejador.ai.AiDtos.ItineraryRequest;
import br.planejador.ai.AiDtos.PackingResponse;
import br.planejador.ai.AiDtos.RawActivities;
import br.planejador.ai.AiDtos.RawActivity;
import br.planejador.ai.AiDtos.RawPacking;
import br.planejador.ai.AiDtos.SuggestionsResponse;
import br.planejador.checklist.ChecklistItem;
import br.planejador.checklist.ChecklistItemRepository;
import br.planejador.checklist.ChecklistType;
import br.planejador.common.ApiException;
import br.planejador.expense.ExpenseService;
import br.planejador.itinerary.Activity;
import br.planejador.itinerary.ActivityCategory;
import br.planejador.itinerary.ActivityRepository;
import br.planejador.trip.Trip;
import br.planejador.trip.TripAccess;
import br.planejador.trip.TripMember;
import br.planejador.trip.TripMemberRepository;
import br.planejador.trip.TripRepository;
import br.planejador.user.User;
import br.planejador.user.UserRepository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Service
public class AiService {

	static final int MAX_DIAS_ROTEIRO = 14;
	private static final int HISTORICO_CHAT = 10;
	private static final Locale PT = Locale.forLanguageTag("pt-BR");
	private static final Logger log = LoggerFactory.getLogger(AiService.class);

	private static final String SISTEMA = """
			Você é um planejador de viagens experiente ajudando um casal brasileiro a organizar uma viagem.
			Responda sempre em português do Brasil. Seja prático e realista: horários factíveis, deslocamentos
			curtos entre atividades do mesmo dia e lugares que existem de verdade. Não invente preços exatos;
			quando estimar custos, use valores aproximados e conservadores.""";

	private final GeminiClient gemini;
	private final ObjectMapper json;
	private final TripAccess access;
	private final TripRepository trips;
	private final TripMemberRepository members;
	private final UserRepository users;
	private final ActivityRepository activities;
	private final ChecklistItemRepository checklist;
	private final ExpenseService expenses;
	private final AiMessageRepository messages;

	public AiService(GeminiClient gemini, ObjectMapper json, TripAccess access, TripRepository trips,
			TripMemberRepository members, UserRepository users, ActivityRepository activities,
			ChecklistItemRepository checklist, ExpenseService expenses, AiMessageRepository messages) {
		this.gemini = gemini;
		this.json = json;
		this.access = access;
		this.trips = trips;
		this.members = members;
		this.users = users;
		this.activities = activities;
		this.checklist = checklist;
		this.expenses = expenses;
		this.messages = messages;
	}

	// ---------------------------------------------------------------- roteiro

	@Transactional(readOnly = true)
	public SuggestionsResponse itinerary(Long tripId, Long userId, ItineraryRequest req) {
		access.requireMember(tripId, userId);
		Trip trip = trips.findById(tripId).orElseThrow();
		long totalDias = ChronoUnit.DAYS.between(trip.getDataInicio(), trip.getDataFim()) + 1;
		int dias = (int) Math.min(totalDias, MAX_DIAS_ROTEIRO);

		String ritmo = switch (req.ritmo() == null ? AiDtos.Ritmo.EQUILIBRADO : req.ritmo()) {
			case TRANQUILO -> "tranquilo: 2 a 3 atividades por dia, com tempo livre";
			case EQUILIBRADO -> "equilibrado: 3 a 4 atividades por dia";
			case INTENSO -> "intenso: 5 ou mais atividades por dia, aproveitando ao máximo";
		};
		String prompt = """
				%s

				Monte um roteiro para os dias 1 a %d da viagem.
				Ritmo: %s.
				Interesses: %s.
				Observações do casal: %s

				Regras:
				- Inclua refeições (café, almoço ou jantar) quando fizer sentido, com sugestões de lugares.
				- Agrupe no mesmo dia atividades próximas umas das outras.
				- Não repita nada que já está no roteiro atual; complete principalmente os dias vazios ou com pouca coisa.
				- "dia" é o número do dia (1 = %s).
				- Informe lat e lng do local com precisão quando for um lugar conhecido; caso contrário, omita.
				- "custoEstimado" é o custo aproximado para as duas pessoas, em %s; omita se for gratuito ou incerto.
				- "notas" deve ter uma dica curta e útil (reserva, melhor horário, como chegar).
				""".formatted(context(trip, userId), dias, ritmo,
				req.interesses() == null || req.interesses().isEmpty() ? "variados" : String.join(", ", req.interesses()),
				blank(req.observacoes()) ? "nenhuma" : req.observacoes().trim(),
				describeDate(trip.getDataInicio()), trip.getMoeda());

		RawActivities raw = parse(gemini.generateJson(SISTEMA, prompt, activitiesSchema(true)), RawActivities.class);
		List<ActivitySuggestion> sugestoes = toSuggestions(raw, trip, null);
		String aviso = totalDias > MAX_DIAS_ROTEIRO
				? "A viagem tem mais de %d dias; as sugestões cobrem só os primeiros %d. Use “Sugerir para este dia” nos demais."
						.formatted(MAX_DIAS_ROTEIRO, MAX_DIAS_ROTEIRO)
				: null;
		return new SuggestionsResponse(sugestoes, aviso);
	}

	@Transactional(readOnly = true)
	public SuggestionsResponse day(Long tripId, Long userId, DayRequest req) {
		access.requireMember(tripId, userId);
		Trip trip = trips.findById(tripId).orElseThrow();
		if (req.data() != null && (req.data().isBefore(trip.getDataInicio()) || req.data().isAfter(trip.getDataFim()))) {
			throw ApiException.invalidField("data", "O dia precisa estar dentro das datas da viagem.");
		}
		String alvo = req.data() == null
				? "Sugira de 5 a 8 ideias de atividades para a lista de ideias (ainda sem dia definido)."
				: "Sugira de 3 a 5 atividades para o dia " + describeDate(req.data())
						+ ", que combinem com o que já está planejado nesse dia (horários livres, lugares próximos).";
		String prompt = """
				%s

				%s
				Pedido do casal: %s

				Regras:
				- Não repita nada que já está no roteiro.
				- Informe lat e lng do local com precisão quando for um lugar conhecido; caso contrário, omita.
				- "custoEstimado" é o custo aproximado para as duas pessoas, em %s; omita se for gratuito ou incerto.
				- "notas" deve ter uma dica curta e útil.
				""".formatted(context(trip, userId), alvo, blank(req.pedido()) ? "nenhum em especial" : req.pedido().trim(),
				trip.getMoeda());

		RawActivities raw = parse(gemini.generateJson(SISTEMA, prompt, activitiesSchema(false)), RawActivities.class);
		LocalDate data = req.data();
		return new SuggestionsResponse(toSuggestions(raw, trip, data == null ? LocalDate.MIN : data), null);
	}

	// ---------------------------------------------------------------- checklist

	@Transactional(readOnly = true)
	public PackingResponse packing(Long tripId, Long userId) {
		access.requireMember(tripId, userId);
		Trip trip = trips.findById(tripId).orElseThrow();
		String prompt = """
				%s

				Sugira o que levar na mala e o que resolver antes de viajar, pensando no destino, na época do ano
				(clima esperado), na duração e nas atividades planejadas.
				- "bagagem": até 25 itens concretos e específicos para esta viagem (evite o óbvio genérico se já estiver na lista).
				- "tarefas": até 10 tarefas antes da viagem (documentos, vistos, vacinas, reservas, chip de celular, câmbio…).
				- Textos curtos, até 8 palavras cada. Não repita o que já está no checklist.
				""".formatted(context(trip, userId));
		Map<String, Object> schema = obj(Map.of(
				"bagagem", arr(Map.of("type", "string")),
				"tarefas", arr(Map.of("type", "string"))), List.of("bagagem", "tarefas"));
		RawPacking raw = parse(gemini.generateJson(SISTEMA, prompt, schema), RawPacking.class);

		List<ChecklistItem> atuais = checklist.findByTripIdOrderByCriadoEmAscIdAsc(tripId);
		return new PackingResponse(
				cleanList(raw.bagagem(), atuais, ChecklistType.BAGAGEM, 30),
				cleanList(raw.tarefas(), atuais, ChecklistType.TAREFA, 15));
	}

	// ---------------------------------------------------------------- chat

	@Transactional(readOnly = true)
	public List<ChatMessage> history(Long tripId, Long userId) {
		access.requireMember(tripId, userId);
		List<AiMessage> lista = new ArrayList<>(messages.findByTripIdOrderByIdDesc(tripId, Limit.of(50)));
		Collections.reverse(lista);
		return toChat(lista);
	}

	@Transactional
	public List<ChatMessage> chat(Long tripId, Long userId, String mensagem) {
		access.requireMember(tripId, userId);
		Trip trip = trips.findById(tripId).orElseThrow();

		List<AiMessage> anteriores = new ArrayList<>(
				messages.findByTripIdOrderByIdDesc(tripId, Limit.of(HISTORICO_CHAT)));
		Collections.reverse(anteriores);
		Map<Long, String> nomes = names(anteriores.stream().map(AiMessage::getUserId).toList());
		String conversa = anteriores.stream()
				.map(m -> (AiMessage.USER.equals(m.getRole())
						? firstName(nomes.getOrDefault(m.getUserId(), "Viajante"))
						: "Assistente") + ": " + m.getConteudo())
				.collect(Collectors.joining("\n"));
		String autor = firstName(users.findById(userId).map(User::getNome).orElse("Viajante"));

		String prompt = """
				%s

				Conversa até agora:
				%s

				Nova pergunta de %s: %s

				Responda de forma direta e concisa (até cerca de 150 palavras), em texto simples.
				Use listas com "-" quando ajudar. Não use títulos nem negrito. Se não souber algo com certeza
				(horários, preços, regras de entrada), diga isso e sugira onde confirmar.
				""".formatted(context(trip, userId), conversa.isBlank() ? "(início da conversa)" : conversa, autor, mensagem.trim());

		String resposta = gemini.generateText(SISTEMA, prompt).trim();
		AiMessage pergunta = messages.save(new AiMessage(tripId, userId, AiMessage.USER, mensagem.trim()));
		AiMessage respostaMsg = messages.save(new AiMessage(tripId, null, AiMessage.ASSISTANT, resposta));
		return toChat(List.of(pergunta, respostaMsg));
	}

	@Transactional
	public void clearChat(Long tripId, Long userId) {
		access.requireMember(tripId, userId);
		messages.deleteByTripId(tripId);
	}

	// ---------------------------------------------------------------- contexto

	/** Resumo da viagem enviado ao modelo. Só primeiros nomes; nada de e-mails ou dados pessoais. */
	String context(Trip trip, Long userId) {
		Long tripId = trip.getId();
		long dias = ChronoUnit.DAYS.between(trip.getDataInicio(), trip.getDataFim()) + 1;
		List<String> viajantes = names(members.findByTripIdOrderByEntrouEmAsc(tripId).stream()
				.map(TripMember::getUserId).toList()).values().stream().map(AiService::firstName).toList();

		var sb = new StringBuilder();
		sb.append("Hoje é ").append(describeDate(LocalDate.now())).append(".\n");
		sb.append("Viagem: ").append(trip.getTitulo()).append('\n');
		sb.append("Destino: ").append(trip.getDestino()).append('\n');
		sb.append("Período: ").append(describeDate(trip.getDataInicio())).append(" a ")
				.append(describeDate(trip.getDataFim())).append(" (").append(dias).append(dias == 1 ? " dia" : " dias")
				.append(")\n");
		sb.append("Viajantes: ").append(viajantes.isEmpty() ? "casal" : String.join(" e ", viajantes)).append('\n');
		sb.append("Moeda da viagem: ").append(trip.getMoeda()).append('\n');

		var resumo = expenses.summary(tripId, userId);
		sb.append("Orçamento: ")
				.append(trip.getOrcamentoCentavos() == null ? "não definido" : money(trip.getOrcamentoCentavos(), trip.getMoeda()))
				.append("; gasto até agora: ").append(money(resumo.totalGastoCentavos(), trip.getMoeda())).append('\n');

		List<Activity> roteiro = activities.findAllForTrip(tripId);
		sb.append("\nRoteiro atual:\n");
		if (roteiro.isEmpty()) {
			sb.append("(vazio)\n");
		}
		Map<LocalDate, List<Activity>> porDia = new LinkedHashMap<>();
		for (Activity a : roteiro) {
			porDia.computeIfAbsent(a.getData(), k -> new ArrayList<>()).add(a);
		}
		porDia.forEach((data, lista) -> {
			sb.append(data == null ? "Ideias sem dia" : "Dia " + (ChronoUnit.DAYS.between(trip.getDataInicio(), data) + 1)
					+ " (" + describeDate(data) + ")").append(": ");
			sb.append(lista.stream().map(a -> (a.getHoraInicio() != null ? a.getHoraInicio() + " " : "") + a.getTitulo()
					+ (a.getLocalNome() != null ? " @ " + a.getLocalNome() : "")).collect(Collectors.joining("; ")));
			sb.append('\n');
		});

		List<ChecklistItem> itens = checklist.findByTripIdOrderByCriadoEmAscIdAsc(tripId);
		if (!itens.isEmpty()) {
			sb.append("\nChecklist (").append(itens.stream().filter(ChecklistItem::isFeito).count()).append(" de ")
					.append(itens.size()).append(" prontos): ");
			sb.append(itens.stream().limit(60).map(ChecklistItem::getTexto).collect(Collectors.joining("; ")));
			sb.append('\n');
		}
		return sb.toString();
	}

	// ---------------------------------------------------------------- validação da saída do modelo

	/**
	 * Converte e valida as atividades sugeridas. Itens com dia, categoria ou título inválidos são descartados;
	 * horários e coordenadas inválidos são ignorados. dataFixa = LocalDate.MIN significa "Ideias".
	 */
	List<ActivitySuggestion> toSuggestions(RawActivities raw, Trip trip, LocalDate dataFixa) {
		if (raw == null || raw.atividades() == null) {
			return List.of();
		}
		List<ActivitySuggestion> result = new ArrayList<>();
		for (RawActivity r : raw.atividades()) {
			if (r == null || blank(r.titulo())) {
				continue;
			}
			LocalDate data;
			if (dataFixa != null) {
				data = dataFixa.equals(LocalDate.MIN) ? null : dataFixa;
			} else {
				if (r.dia() == null) {
					continue;
				}
				data = trip.getDataInicio().plusDays(r.dia() - 1L);
				if (data.isBefore(trip.getDataInicio()) || data.isAfter(trip.getDataFim())) {
					continue;
				}
			}
			ActivityCategory categoria;
			try {
				categoria = ActivityCategory.valueOf(r.categoria() == null ? "OUTRO" : r.categoria().trim().toUpperCase(Locale.ROOT));
			} catch (IllegalArgumentException e) {
				categoria = ActivityCategory.OUTRO;
			}
			LocalTime inicio = time(r.horaInicio());
			LocalTime fim = time(r.horaFim());
			if (inicio != null && fim != null && fim.isBefore(inicio)) {
				fim = null;
			}
			boolean coordsOk = r.lat() != null && r.lng() != null && Math.abs(r.lat()) <= 90 && Math.abs(r.lng()) <= 180
					&& !(r.lat() == 0 && r.lng() == 0);
			Long custo = r.custoEstimado() != null && r.custoEstimado() > 0 && r.custoEstimado() < 10_000_000
					? Math.round(r.custoEstimado() * 100)
					: null;
			result.add(new ActivitySuggestion(data, truncate(r.titulo(), 150), inicio, fim, categoria,
					truncate(r.localNome(), 300), coordsOk ? r.lat() : null, coordsOk ? r.lng() : null, custo,
					truncate(r.notas(), 1000)));
		}
		return result;
	}

	private static List<String> cleanList(List<String> sugestoes, List<ChecklistItem> atuais, ChecklistType tipo,
			int max) {
		if (sugestoes == null) {
			return List.of();
		}
		Set<String> vistos = new HashSet<>();
		atuais.stream().filter(i -> i.getTipo() == tipo).forEach(i -> vistos.add(normalize(i.getTexto())));
		return sugestoes.stream()
				.filter(Objects::nonNull)
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.map(s -> truncate(s, 200))
				.filter(s -> vistos.add(normalize(s)))
				.limit(max)
				.toList();
	}

	private <T> T parse(String texto, Class<T> tipo) {
		String limpo = texto.strip();
		if (limpo.startsWith("```")) {
			limpo = limpo.replaceFirst("^```(json)?", "").replaceFirst("```$", "").strip();
		}
		try {
			return json.readValue(limpo, tipo);
		} catch (JacksonException e) {
			log.warn("IA devolveu JSON inválido: {}", e.getOriginalMessage());
			throw new ApiException(HttpStatus.BAD_GATEWAY, "A IA respondeu num formato inesperado. Tente de novo.");
		}
	}

	private static Map<String, Object> activitiesSchema(boolean comDia) {
		Map<String, Object> props = new LinkedHashMap<>();
		if (comDia) {
			props.put("dia", Map.of("type", "integer", "description", "Número do dia da viagem, começando em 1"));
		}
		props.put("titulo", Map.of("type", "string", "description", "O que fazer, curto"));
		props.put("horaInicio", Map.of("type", "string", "description", "HH:MM, 24 horas"));
		props.put("horaFim", Map.of("type", "string", "description", "HH:MM, 24 horas"));
		props.put("categoria", Map.of("type", "string", "enum",
				List.of("PASSEIO", "REFEICAO", "TRANSPORTE", "HOSPEDAGEM", "COMPRAS", "OUTRO")));
		props.put("localNome", Map.of("type", "string", "description", "Nome do lugar"));
		props.put("lat", Map.of("type", "number"));
		props.put("lng", Map.of("type", "number"));
		props.put("custoEstimado", Map.of("type", "number"));
		props.put("notas", Map.of("type", "string"));
		List<String> required = comDia ? List.of("dia", "titulo", "categoria") : List.of("titulo", "categoria");
		return obj(Map.of("atividades", arr(obj(props, required))), List.of("atividades"));
	}

	private static Map<String, Object> obj(Map<String, Object> props, List<String> required) {
		return Map.of("type", "object", "properties", props, "required", required);
	}

	private static Map<String, Object> arr(Map<String, Object> items) {
		return Map.of("type", "array", "items", items);
	}

	// ---------------------------------------------------------------- utilitários

	private List<ChatMessage> toChat(List<AiMessage> lista) {
		Map<Long, String> nomes = names(lista.stream().map(AiMessage::getUserId).toList());
		return lista.stream()
				.map(m -> new ChatMessage(m.getId(), m.getRole(),
						m.getUserId() == null ? null : nomes.get(m.getUserId()), m.getConteudo(), m.getCriadoEm()))
				.toList();
	}

	private Map<Long, String> names(List<Long> ids) {
		List<Long> validos = ids.stream().filter(Objects::nonNull).distinct().toList();
		Map<Long, String> porId = users.findAllById(validos).stream()
				.collect(Collectors.toMap(User::getId, User::getNome));
		Map<Long, String> ordenado = new LinkedHashMap<>();
		validos.forEach(id -> {
			if (porId.containsKey(id)) {
				ordenado.put(id, porId.get(id));
			}
		});
		return ordenado;
	}

	static String describeDate(LocalDate d) {
		DayOfWeek dow = d.getDayOfWeek();
		return d + " (" + dow.getDisplayName(TextStyle.FULL, PT) + ")";
	}

	private static String money(long centavos, String moeda) {
		return moeda + " " + String.format(PT, "%,.2f", centavos / 100.0);
	}

	private static LocalTime time(String s) {
		if (blank(s)) {
			return null;
		}
		try {
			return LocalTime.parse(s.trim().length() == 4 ? "0" + s.trim() : s.trim());
		} catch (DateTimeParseException e) {
			return null;
		}
	}

	private static String firstName(String nome) {
		return nome.trim().split("\\s+")[0];
	}

	private static boolean blank(String s) {
		return s == null || s.isBlank();
	}

	private static String truncate(String s, int max) {
		if (blank(s)) {
			return null;
		}
		String t = s.trim();
		return t.length() <= max ? t : t.substring(0, max);
	}

	private static String normalize(String s) {
		return s.trim().toLowerCase(Locale.ROOT);
	}
}
