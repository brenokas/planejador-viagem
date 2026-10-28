package br.planejador.trip;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.planejador.common.ApiException;
import br.planejador.common.GlobalExceptionHandler;
import br.planejador.expense.ExpenseRepository;
import br.planejador.trip.TripDtos.MemberResponse;
import br.planejador.trip.TripDtos.TripRequest;
import br.planejador.trip.TripDtos.TripResponse;
import br.planejador.user.User;
import br.planejador.user.UserRepository;

@Service
public class TripService {

	static final int MAX_DIAS = 90;

	private final TripRepository trips;
	private final TripMemberRepository members;
	private final UserRepository users;
	private final TripAccess access;
	private final ExpenseRepository expenses;

	public TripService(TripRepository trips, TripMemberRepository members, UserRepository users, TripAccess access,
			ExpenseRepository expenses) {
		this.trips = trips;
		this.members = members;
		this.users = users;
		this.access = access;
		this.expenses = expenses;
	}

	@Transactional(readOnly = true)
	public List<TripResponse> list(Long userId, boolean arquivadas) {
		List<Trip> found = trips.findForMember(userId, arquivadas);
		if (found.isEmpty()) {
			return List.of();
		}
		Map<Long, List<TripMember>> membersByTrip = members
				.findByTripIdInOrderByEntrouEmAsc(found.stream().map(Trip::getId).toList())
				.stream()
				.collect(Collectors.groupingBy(TripMember::getTripId));
		Map<Long, User> usersById = loadUsers(membersByTrip.values().stream().flatMap(List::stream).toList());
		return found.stream()
				.map(t -> toResponse(t, membersByTrip.getOrDefault(t.getId(), List.of()), usersById, userId))
				.toList();
	}

	@Transactional(readOnly = true)
	public TripResponse get(Long tripId, Long userId) {
		access.requireMember(tripId, userId);
		return toResponse(load(tripId), userId);
	}

	@Transactional
	public TripResponse create(Long userId, TripRequest req) {
		validatePeriod(req);
		Trip trip = new Trip(userId);
		apply(trip, req);
		trips.saveAndFlush(trip);
		members.save(new TripMember(trip.getId(), userId, TripRole.DONO));
		return toResponse(trip, userId);
	}

	@Transactional
	public TripResponse update(Long tripId, Long userId, TripRequest req) {
		access.requireMember(tripId, userId);
		Trip trip = load(tripId);
		if (req.version() != null && req.version() != trip.getVersion()) {
			throw new ApiException(HttpStatus.CONFLICT, GlobalExceptionHandler.CONFLITO);
		}
		validatePeriod(req);
		if (!trip.getMoeda().equalsIgnoreCase(req.moeda()) && expenses.existsByTripId(tripId)) {
			throw ApiException.invalidField("moeda",
					"Não é possível trocar a moeda depois de lançar despesas, pois os valores convertidos ficariam errados.");
		}
		apply(trip, req);
		trips.saveAndFlush(trip);
		return toResponse(trip, userId);
	}

	@Transactional
	public TripResponse setArchived(Long tripId, Long userId, boolean arquivada) {
		access.requireMember(tripId, userId);
		Trip trip = load(tripId);
		trip.setArquivada(arquivada);
		trips.saveAndFlush(trip);
		return toResponse(trip, userId);
	}

	@Transactional
	public void delete(Long tripId, Long userId) {
		access.requireOwner(tripId, userId);
		trips.deleteById(tripId);
	}

	@Transactional
	public void removeMember(Long tripId, Long userId, Long targetUserId) {
		TripMember me = access.requireMember(tripId, userId);
		if (userId.equals(targetUserId)) {
			if (me.isDono()) {
				throw new ApiException(HttpStatus.BAD_REQUEST,
						"Quem criou a viagem não pode sair dela. Se quiser, exclua a viagem.");
			}
			members.delete(me);
			return;
		}
		if (!me.isDono()) {
			throw ApiException.forbidden("Apenas quem criou a viagem pode remover participantes.");
		}
		TripMember target = members.findByTripIdAndUserId(tripId, targetUserId)
				.orElseThrow(() -> ApiException.notFound("Participante não encontrado."));
		members.delete(target);
	}

	TripResponse toResponse(Trip trip, Long userId) {
		List<TripMember> tripMembers = members.findByTripIdOrderByEntrouEmAsc(trip.getId());
		return toResponse(trip, tripMembers, loadUsers(tripMembers), userId);
	}

	private Trip load(Long tripId) {
		return trips.findById(tripId).orElseThrow(() -> ApiException.notFound(TripAccess.NAO_ENCONTRADA));
	}

	private Map<Long, User> loadUsers(List<TripMember> tripMembers) {
		return users.findAllById(tripMembers.stream().map(TripMember::getUserId).distinct().toList())
				.stream()
				.collect(Collectors.toMap(User::getId, Function.identity()));
	}

	private static TripResponse toResponse(Trip t, List<TripMember> tripMembers, Map<Long, User> usersById,
			Long userId) {
		TripRole meuPapel = tripMembers.stream()
				.filter(m -> m.getUserId().equals(userId))
				.map(TripMember::getPapel)
				.findFirst()
				.orElse(null);
		List<MemberResponse> membros = tripMembers.stream()
				.map(m -> {
					User u = usersById.get(m.getUserId());
					return new MemberResponse(m.getUserId(), u.getNome(), u.getAvatarUrl(), m.getPapel());
				})
				.toList();
		return new TripResponse(t.getId(), t.getTitulo(), t.getDestino(), t.getDataInicio(), t.getDataFim(),
				t.getMoeda(), t.getOrcamentoCentavos(), t.getCapaUrl(), t.isArquivada(), meuPapel, membros,
				t.getAtualizadoEm(), t.getVersion());
	}

	private static void apply(Trip trip, TripRequest req) {
		String capa = req.capaUrl() == null || req.capaUrl().isBlank() ? null : req.capaUrl().trim();
		trip.update(req.titulo().trim(), req.destino().trim(), req.dataInicio(), req.dataFim(),
				req.moeda().toUpperCase(Locale.ROOT), req.orcamentoCentavos(), capa);
	}

	private static void validatePeriod(TripRequest req) {
		LocalDate inicio = req.dataInicio();
		LocalDate fim = req.dataFim();
		if (fim.isBefore(inicio)) {
			throw ApiException.invalidField("dataFim", "A volta deve ser depois da ida.");
		}
		if (ChronoUnit.DAYS.between(inicio, fim) + 1 > MAX_DIAS) {
			throw ApiException.invalidField("dataFim", "A viagem pode ter no máximo " + MAX_DIAS + " dias.");
		}
	}
}
