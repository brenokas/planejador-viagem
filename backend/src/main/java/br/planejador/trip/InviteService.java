package br.planejador.trip;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.planejador.common.ApiException;
import br.planejador.trip.TripDtos.InvitePreview;
import br.planejador.trip.TripDtos.InviteResponse;
import br.planejador.trip.TripDtos.TripResponse;
import br.planejador.user.User;
import br.planejador.user.UserRepository;

@Service
public class InviteService {

	static final Duration VALIDADE = Duration.ofDays(7);

	private static final SecureRandom RANDOM = new SecureRandom();

	private final TripInviteRepository invites;
	private final TripMemberRepository members;
	private final TripRepository trips;
	private final UserRepository users;
	private final TripAccess access;
	private final TripService tripService;

	public InviteService(TripInviteRepository invites, TripMemberRepository members, TripRepository trips,
			UserRepository users, TripAccess access, TripService tripService) {
		this.invites = invites;
		this.members = members;
		this.trips = trips;
		this.users = users;
		this.access = access;
		this.tripService = tripService;
	}

	@Transactional
	public InviteResponse create(Long tripId, Long userId) {
		access.requireMember(tripId, userId);
		TripInvite invite = invites.save(new TripInvite(tripId, newToken(), userId, Instant.now().plus(VALIDADE)));
		return new InviteResponse(invite.getToken(), invite.getExpiraEm());
	}

	@Transactional(readOnly = true)
	public InvitePreview preview(String token, Long userId) {
		TripInvite invite = findInvite(token);
		boolean jaMembro = members.existsByTripIdAndUserId(invite.getTripId(), userId);
		if (!jaMembro) {
			ensureUsable(invite);
		}
		Trip trip = trips.findById(invite.getTripId()).orElseThrow(InviteService::invalid);
		String convidadoPor = users.findById(invite.getCriadoPor()).map(User::getNome).orElse("Alguém");
		return new InvitePreview(trip.getId(), trip.getTitulo(), trip.getDestino(), trip.getDataInicio(),
				trip.getDataFim(), convidadoPor, jaMembro);
	}

	@Transactional
	public TripResponse accept(String token, Long userId) {
		TripInvite invite = findInvite(token);
		Long tripId = invite.getTripId();
		if (!members.existsByTripIdAndUserId(tripId, userId)) {
			ensureUsable(invite);
			members.save(new TripMember(tripId, userId, TripRole.EDITOR));
			invite.markUsed(userId);
		}
		return tripService.get(tripId, userId);
	}

	private TripInvite findInvite(String token) {
		return invites.findByToken(token).orElseThrow(InviteService::invalid);
	}

	private static void ensureUsable(TripInvite invite) {
		if (invite.isUsado()) {
			throw new ApiException(HttpStatus.GONE, "Este convite já foi usado. Peça um novo link.");
		}
		if (invite.isExpirado()) {
			throw new ApiException(HttpStatus.GONE, "Este convite expirou. Peça um novo link.");
		}
	}

	private static ApiException invalid() {
		return ApiException.notFound("Convite inválido.");
	}

	private static String newToken() {
		byte[] bytes = new byte[24];
		RANDOM.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}
}
