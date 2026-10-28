package br.planejador.expense;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.planejador.common.ApiException;
import br.planejador.common.GlobalExceptionHandler;
import br.planejador.expense.ExpenseDtos.CategoryTotal;
import br.planejador.expense.ExpenseDtos.ExpenseRequest;
import br.planejador.expense.ExpenseDtos.ExpenseResponse;
import br.planejador.expense.ExpenseDtos.PersonBalance;
import br.planejador.expense.ExpenseDtos.PersonRef;
import br.planejador.expense.ExpenseDtos.SettleRequest;
import br.planejador.expense.ExpenseDtos.Settlement;
import br.planejador.expense.ExpenseDtos.ShareResponse;
import br.planejador.expense.ExpenseDtos.SummaryResponse;
import br.planejador.itinerary.ActivityRepository;
import br.planejador.trip.Trip;
import br.planejador.trip.TripAccess;
import br.planejador.trip.TripMember;
import br.planejador.trip.TripMemberRepository;
import br.planejador.trip.TripRepository;
import br.planejador.user.User;
import br.planejador.user.UserRepository;

@Service
public class ExpenseService {

	private final ExpenseRepository expenses;
	private final TripRepository trips;
	private final TripMemberRepository members;
	private final ActivityRepository activities;
	private final UserRepository users;
	private final TripAccess access;
	private final ExchangeRateService exchange;

	public ExpenseService(ExpenseRepository expenses, TripRepository trips, TripMemberRepository members,
			ActivityRepository activities, UserRepository users, TripAccess access, ExchangeRateService exchange) {
		this.expenses = expenses;
		this.trips = trips;
		this.members = members;
		this.activities = activities;
		this.users = users;
		this.access = access;
		this.exchange = exchange;
	}

	@Transactional(readOnly = true)
	public List<ExpenseResponse> list(Long tripId, Long userId) {
		access.requireMember(tripId, userId);
		return toResponses(expenses.findByTripIdOrderByDataDescIdDesc(tripId));
	}

	@Transactional
	public ExpenseResponse create(Long tripId, Long userId, ExpenseRequest req) {
		access.requireMember(tripId, userId);
		Expense expense = new Expense(tripId, userId);
		apply(expense, req, userId, memberIds(tripId));
		expenses.saveAndFlush(expense);
		return toResponses(List.of(expense)).getFirst();
	}

	@Transactional
	public ExpenseResponse update(Long tripId, Long expenseId, Long userId, ExpenseRequest req) {
		access.requireMember(tripId, userId);
		Expense expense = load(tripId, expenseId);
		if (req.version() != null && req.version() != expense.getVersion()) {
			throw new ApiException(HttpStatus.CONFLICT, GlobalExceptionHandler.CONFLITO);
		}
		// Quem saiu da viagem continua válido nas despesas em que já aparecia.
		Set<Long> permitidos = new HashSet<>(memberIds(tripId));
		permitidos.add(expense.getPagoPor());
		permitidos.addAll(expense.getDivisao().keySet());
		apply(expense, req, userId, permitidos);
		expenses.saveAndFlush(expense);
		return toResponses(List.of(expense)).getFirst();
	}

	@Transactional
	public void delete(Long tripId, Long expenseId, Long userId) {
		access.requireMember(tripId, userId);
		expenses.delete(load(tripId, expenseId));
	}

	/** Registra um pagamento de "de" para "para", que zera (total ou parcialmente) o saldo entre eles. */
	@Transactional
	public ExpenseResponse settle(Long tripId, Long userId, SettleRequest req) {
		access.requireMember(tripId, userId);
		if (req.de().equals(req.para())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "Escolha duas pessoas diferentes.");
		}
		Trip trip = trips.findById(tripId).orElseThrow();
		Map<Long, String> nomes = names(List.of(req.de(), req.para()));
		var acerto = new ExpenseRequest(
				"Acerto: " + nomes.getOrDefault(req.de(), "?") + " → " + nomes.getOrDefault(req.para(), "?"),
				ExpenseCategory.ACERTO, req.valorCentavos(), trip.getMoeda(), BigDecimal.ONE,
				LocalDate.now(), req.de(), SplitMode.VALORES, null, Map.of(req.para(), req.valorCentavos()),
				null);
		return create(tripId, userId, acerto);
	}

	@Transactional(readOnly = true)
	public SummaryResponse summary(Long tripId, Long userId) {
		access.requireMember(tripId, userId);
		Trip trip = trips.findById(tripId).orElseThrow();
		List<Expense> lista = expenses.findByTripIdOrderByDataDescIdDesc(tripId);

		Map<ExpenseCategory, Long> porCategoria = new LinkedHashMap<>();
		Map<Long, Long> pagou = new HashMap<>();
		Map<Long, Long> consumo = new HashMap<>();
		Map<Long, Long> saldo = new HashMap<>();
		long total = 0;

		for (Expense e : lista) {
			boolean acerto = e.getCategoria() == ExpenseCategory.ACERTO;
			saldo.merge(e.getPagoPor(), e.getValorConvertidoCentavos(), Long::sum);
			e.getDivisao().forEach((uid, share) -> saldo.merge(uid, -share.getValorConvertidoCentavos(), Long::sum));
			if (acerto) {
				continue;
			}
			total += e.getValorConvertidoCentavos();
			porCategoria.merge(e.getCategoria(), e.getValorConvertidoCentavos(), Long::sum);
			pagou.merge(e.getPagoPor(), e.getValorConvertidoCentavos(), Long::sum);
			e.getDivisao().forEach((uid, share) -> consumo.merge(uid, share.getValorConvertidoCentavos(), Long::sum));
		}

		// Membros atuais primeiro (na ordem de entrada), depois quem saiu mas ainda tem despesas.
		List<Long> pessoasIds = Stream.concat(memberIds(tripId).stream(), saldo.keySet().stream().sorted())
				.distinct()
				.toList();
		Map<Long, String> nomes = names(pessoasIds);
		List<PersonBalance> pessoas = pessoasIds.stream()
				.map(id -> new PersonBalance(id, nomes.getOrDefault(id, "Ex-participante"),
						pagou.getOrDefault(id, 0L), consumo.getOrDefault(id, 0L), saldo.getOrDefault(id, 0L)))
				.toList();

		List<CategoryTotal> categorias = porCategoria.entrySet().stream()
				.sorted(Map.Entry.<ExpenseCategory, Long>comparingByValue().reversed())
				.map(en -> new CategoryTotal(en.getKey(), en.getValue()))
				.toList();

		return new SummaryResponse(trip.getMoeda(), trip.getOrcamentoCentavos(), total,
				activities.sumCusto(tripId), categorias, pessoas, settlements(pessoas));
	}

	public ExchangeRateService.Rate rate(String de, String para) {
		return exchange.rate(de.toUpperCase(Locale.ROOT), para.toUpperCase(Locale.ROOT));
	}

	private void apply(Expense expense, ExpenseRequest req, Long userId, Set<Long> permitidos) {
		Trip trip = trips.findById(expense.getTripId()).orElseThrow();
		String moeda = req.moeda().toUpperCase(Locale.ROOT);

		if (!permitidos.contains(req.pagoPor())) {
			throw ApiException.invalidField("pagoPor", "Quem pagou precisa participar da viagem.");
		}

		BigDecimal taxa;
		if (moeda.equals(trip.getMoeda())) {
			taxa = BigDecimal.ONE;
		} else if (req.taxaCambio() != null) {
			taxa = req.taxaCambio();
		} else {
			taxa = exchange.rate(moeda, trip.getMoeda()).taxa();
		}
		long convertido = new BigDecimal(req.valorCentavos()).multiply(taxa).setScale(0, RoundingMode.HALF_UP)
				.longValueExact();

		Map<Long, SplitShare> divisao = split(req.modoDivisao(), req.valorCentavos(), convertido,
				req.participantes(), req.valores());
		for (Long uid : divisao.keySet()) {
			if (!permitidos.contains(uid)) {
				throw ApiException.invalidField("participantes", "Só quem participa da viagem pode entrar na divisão.");
			}
		}

		expense.update(req.descricao().trim(), req.categoria(), req.valorCentavos(), moeda,
				taxa.setScale(8, RoundingMode.HALF_UP), convertido, req.data(), req.pagoPor(), req.modoDivisao(),
				divisao, userId);
	}

	/**
	 * Calcula a parte de cada pessoa, na moeda original e convertida. Centavos que sobram do arredondamento vão
	 * para os primeiros participantes, então as partes sempre somam exatamente o total.
	 */
	static Map<Long, SplitShare> split(SplitMode modo, long valor, long convertido, List<Long> participantes,
			Map<Long, Long> valores) {
		Map<Long, Long> original = new LinkedHashMap<>();
		if (modo == SplitMode.IGUAL) {
			List<Long> ids = participantes == null ? List.of()
					: participantes.stream().filter(Objects::nonNull).distinct().sorted().toList();
			if (ids.isEmpty()) {
				throw ApiException.invalidField("participantes", "Escolha quem participa da divisão.");
			}
			original.putAll(distribute(valor, ids));
		} else {
			Map<Long, Long> v = valores == null ? Map.of() : valores;
			if (v.values().stream().anyMatch(x -> x == null || x < 0)) {
				throw ApiException.invalidField("valores", "Os valores não podem ser negativos.");
			}
			if (v.values().stream().mapToLong(Long::longValue).sum() != valor) {
				throw ApiException.invalidField("valores", "A soma das partes deve ser igual ao valor total.");
			}
			v.entrySet().stream()
					.filter(e -> e.getValue() > 0)
					.sorted(Map.Entry.comparingByKey())
					.forEach(e -> original.put(e.getKey(), e.getValue()));
			if (original.isEmpty()) {
				throw ApiException.invalidField("valores", "Informe o valor de pelo menos uma pessoa.");
			}
		}

		// Converte proporcionalmente e distribui a diferença de arredondamento.
		List<Long> ids = new ArrayList<>(original.keySet());
		Map<Long, Long> conv = new LinkedHashMap<>();
		long soma = 0;
		for (Long id : ids) {
			long parte = BigDecimal.valueOf(original.get(id)).multiply(BigDecimal.valueOf(convertido))
					.divide(BigDecimal.valueOf(valor), 0, RoundingMode.DOWN).longValueExact();
			conv.put(id, parte);
			soma += parte;
		}
		for (int i = 0; soma < convertido; i = (i + 1) % ids.size(), soma++) {
			conv.merge(ids.get(i), 1L, Long::sum);
		}

		Map<Long, SplitShare> result = new LinkedHashMap<>();
		for (Long id : ids) {
			result.put(id, new SplitShare(original.get(id), conv.get(id)));
		}
		return result;
	}

	private static Map<Long, Long> distribute(long valor, List<Long> ids) {
		long base = valor / ids.size();
		long resto = valor % ids.size();
		Map<Long, Long> partes = new LinkedHashMap<>();
		for (int i = 0; i < ids.size(); i++) {
			partes.put(ids.get(i), base + (i < resto ? 1 : 0));
		}
		return partes;
	}

	/** Sugere o menor número de pagamentos: quem mais deve paga para quem mais tem a receber. */
	static List<Settlement> settlements(List<PersonBalance> pessoas) {
		record Pos(PersonRef p, long valor) {
		}
		List<Pos> devedores = new ArrayList<>();
		List<Pos> credores = new ArrayList<>();
		for (PersonBalance b : pessoas) {
			var ref = new PersonRef(b.id(), b.nome());
			if (b.saldoCentavos() < 0) {
				devedores.add(new Pos(ref, -b.saldoCentavos()));
			} else if (b.saldoCentavos() > 0) {
				credores.add(new Pos(ref, b.saldoCentavos()));
			}
		}
		devedores.sort(Comparator.comparingLong(Pos::valor).reversed());
		credores.sort(Comparator.comparingLong(Pos::valor).reversed());

		List<Settlement> result = new ArrayList<>();
		int i = 0;
		int j = 0;
		long deve = devedores.isEmpty() ? 0 : devedores.getFirst().valor();
		long recebe = credores.isEmpty() ? 0 : credores.getFirst().valor();
		while (i < devedores.size() && j < credores.size()) {
			long valor = Math.min(deve, recebe);
			if (valor > 0) {
				result.add(new Settlement(devedores.get(i).p(), credores.get(j).p(), valor));
			}
			deve -= valor;
			recebe -= valor;
			if (deve == 0 && ++i < devedores.size()) {
				deve = devedores.get(i).valor();
			}
			if (recebe == 0 && ++j < credores.size()) {
				recebe = credores.get(j).valor();
			}
		}
		return result;
	}

	private Set<Long> memberIds(Long tripId) {
		return members.findByTripIdOrderByEntrouEmAsc(tripId).stream()
				.map(TripMember::getUserId)
				.collect(Collectors.toCollection(LinkedHashSet::new));
	}

	private Expense load(Long tripId, Long expenseId) {
		return expenses.findByIdAndTripId(expenseId, tripId)
				.orElseThrow(() -> ApiException.notFound("Despesa não encontrada."));
	}

	private Map<Long, String> names(Collection<Long> ids) {
		return users.findAllById(ids.stream().filter(Objects::nonNull).distinct().toList()).stream()
				.collect(Collectors.toMap(User::getId, User::getNome));
	}

	private List<ExpenseResponse> toResponses(List<Expense> lista) {
		Set<Long> ids = new HashSet<>();
		for (Expense e : lista) {
			ids.add(e.getPagoPor());
			ids.addAll(e.getDivisao().keySet());
			if (e.getAtualizadoPor() != null) {
				ids.add(e.getAtualizadoPor());
			}
		}
		Map<Long, String> nomes = names(ids);
		return lista.stream()
				.map(e -> new ExpenseResponse(e.getId(), e.getDescricao(), e.getCategoria(), e.getValorCentavos(),
						e.getMoeda(), e.getTaxaCambio(), e.getValorConvertidoCentavos(), e.getData(),
						new PersonRef(e.getPagoPor(), nomes.getOrDefault(e.getPagoPor(), "Ex-participante")),
						e.getModoDivisao(),
						e.getDivisao().entrySet().stream()
								.sorted(Map.Entry.comparingByKey())
								.map(en -> new ShareResponse(en.getKey(),
										nomes.getOrDefault(en.getKey(), "Ex-participante"),
										en.getValue().getValorCentavos(), en.getValue().getValorConvertidoCentavos()))
								.toList(),
						nomes.get(e.getAtualizadoPor()), e.getAtualizadoEm(), e.getVersion()))
				.toList();
	}
}
