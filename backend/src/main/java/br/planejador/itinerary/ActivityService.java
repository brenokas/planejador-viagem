package br.planejador.itinerary;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.planejador.common.ApiException;
import br.planejador.common.GlobalExceptionHandler;
import br.planejador.itinerary.ActivityDtos.ActivityRequest;
import br.planejador.itinerary.ActivityDtos.ActivityResponse;
import br.planejador.itinerary.ActivityDtos.ReorderRequest;
import br.planejador.trip.Trip;
import br.planejador.trip.TripAccess;
import br.planejador.trip.TripRepository;
import br.planejador.user.User;
import br.planejador.user.UserRepository;

@Service
public class ActivityService {

	private final ActivityRepository activities;
	private final TripRepository trips;
	private final UserRepository users;
	private final TripAccess access;

	public ActivityService(ActivityRepository activities, TripRepository trips, UserRepository users,
			TripAccess access) {
		this.activities = activities;
		this.trips = trips;
		this.users = users;
		this.access = access;
	}

	@Transactional(readOnly = true)
	public List<ActivityResponse> list(Long tripId, Long userId) {
		access.requireMember(tripId, userId);
		return toResponses(activities.findAllForTrip(tripId));
	}

	@Transactional
	public ActivityResponse create(Long tripId, Long userId, ActivityRequest req) {
		access.requireMember(tripId, userId);
		validate(tripId, req);
		Activity activity = new Activity(tripId, userId);
		apply(activity, req, userId);
		place(activity);
		activities.saveAndFlush(activity);
		return toResponses(List.of(activity)).getFirst();
	}

	@Transactional
	public List<ActivityResponse> createMany(Long tripId, Long userId, List<ActivityRequest> itens) {
		access.requireMember(tripId, userId);
		List<Activity> criadas = new ArrayList<>();
		for (ActivityRequest req : itens) {
			validate(tripId, req);
			Activity activity = new Activity(tripId, userId);
			apply(activity, req, userId);
			place(activity);
			activities.saveAndFlush(activity);
			criadas.add(activity);
		}
		return toResponses(criadas);
	}

	@Transactional
	public ActivityResponse update(Long tripId, Long activityId, Long userId, ActivityRequest req) {
		access.requireMember(tripId, userId);
		Activity activity = load(tripId, activityId);
		if (req.version() != null && req.version() != activity.getVersion()) {
			throw new ApiException(HttpStatus.CONFLICT, GlobalExceptionHandler.CONFLITO);
		}
		validate(tripId, req);
		boolean reposicionar = !Objects.equals(activity.getData(), req.data())
				|| !Objects.equals(activity.getHoraInicio(), req.horaInicio());
		apply(activity, req, userId);
		if (reposicionar) {
			place(activity);
		}
		activities.saveAndFlush(activity);
		return toResponses(List.of(activity)).getFirst();
	}

	@Transactional
	public void delete(Long tripId, Long activityId, Long userId) {
		access.requireMember(tripId, userId);
		activities.delete(load(tripId, activityId));
	}

	@Transactional
	public List<ActivityResponse> reorder(Long tripId, Long userId, ReorderRequest req) {
		access.requireMember(tripId, userId);
		List<Activity> dia = activities.findForDay(tripId, req.data());
		Map<Long, Activity> porId = dia.stream().collect(Collectors.toMap(Activity::getId, Function.identity()));
		if (req.ids().size() != dia.size() || !porId.keySet().equals(new HashSet<>(req.ids()))) {
			throw new ApiException(HttpStatus.CONFLICT, GlobalExceptionHandler.CONFLITO);
		}
		for (int i = 0; i < req.ids().size(); i++) {
			porId.get(req.ids().get(i)).setOrdem(i);
		}
		activities.flush();
		return toResponses(activities.findAllForTrip(tripId));
	}

	/**
	 * Coloca a atividade no seu dia: antes da primeira atividade com horário posterior ou, se não houver, no fim.
	 * Renumera a ordem do dia.
	 */
	private void place(Activity activity) {
		List<Activity> dia = new ArrayList<>(activities.findForDay(activity.getTripId(), activity.getData()));
		dia.removeIf(a -> a.getId() != null && a.getId().equals(activity.getId()));
		int pos = dia.size();
		if (activity.getHoraInicio() != null) {
			for (int i = 0; i < dia.size(); i++) {
				var hora = dia.get(i).getHoraInicio();
				if (hora != null && hora.isAfter(activity.getHoraInicio())) {
					pos = i;
					break;
				}
			}
		}
		dia.add(pos, activity);
		for (int i = 0; i < dia.size(); i++) {
			dia.get(i).setOrdem(i);
		}
	}

	private void validate(Long tripId, ActivityRequest req) {
		if (req.data() != null) {
			Trip trip = trips.findById(tripId).orElseThrow();
			if (req.data().isBefore(trip.getDataInicio()) || req.data().isAfter(trip.getDataFim())) {
				throw ApiException.invalidField("data", "O dia precisa estar dentro das datas da viagem.");
			}
		}
		if (req.horaInicio() != null && req.horaFim() != null && req.horaFim().isBefore(req.horaInicio())) {
			throw ApiException.invalidField("horaFim", "O término deve ser depois do início.");
		}
		if ((req.lat() == null) != (req.lng() == null)) {
			throw ApiException.invalidField("lat", "Informe latitude e longitude juntas.");
		}
	}

	private Activity load(Long tripId, Long activityId) {
		return activities.findByIdAndTripId(activityId, tripId)
				.orElseThrow(() -> ApiException.notFound("Atividade não encontrada."));
	}

	private static void apply(Activity a, ActivityRequest req, Long userId) {
		a.update(req.titulo().trim(), req.data(), req.horaInicio(), req.horaFim(), req.categoria(),
				blankToNull(req.localNome()), req.lat(), req.lng(), req.custoCentavos(), blankToNull(req.notas()),
				userId);
	}

	private static String blankToNull(String s) {
		return s == null || s.isBlank() ? null : s.trim();
	}

	private List<ActivityResponse> toResponses(List<Activity> list) {
		Map<Long, String> nomes = users
				.findAllById(list.stream().map(Activity::getAtualizadoPor).filter(Objects::nonNull).distinct().toList())
				.stream()
				.collect(Collectors.toMap(User::getId, User::getNome));
		return list.stream()
				.map(a -> new ActivityResponse(a.getId(), a.getTitulo(), a.getData(), a.getHoraInicio(),
						a.getHoraFim(), a.getCategoria(), a.getLocalNome(), a.getLat(), a.getLng(),
						a.getCustoCentavos(), a.getNotas(), a.getOrdem(), nomes.get(a.getAtualizadoPor()),
						a.getAtualizadoEm(), a.getVersion()))
				.toList();
	}
}
