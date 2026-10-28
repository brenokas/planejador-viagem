package br.planejador.trip;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.planejador.common.ApiException;

/** Verifica se o usuário tem acesso à viagem. Usado por todas as rotas /api/trips/{id}/**. */
@Component
public class TripAccess {

	static final String NAO_ENCONTRADA = "Viagem não encontrada.";

	private final TripMemberRepository members;

	public TripAccess(TripMemberRepository members) {
		this.members = members;
	}

	/** Retorna 404 (e não 403) para não revelar a existência de viagens de outras pessoas. */
	@Transactional(readOnly = true)
	public TripMember requireMember(Long tripId, Long userId) {
		return members.findByTripIdAndUserId(tripId, userId)
				.orElseThrow(() -> ApiException.notFound(NAO_ENCONTRADA));
	}

	@Transactional(readOnly = true)
	public TripMember requireOwner(Long tripId, Long userId) {
		TripMember member = requireMember(tripId, userId);
		if (!member.isDono()) {
			throw ApiException.forbidden("Apenas quem criou a viagem pode fazer isso.");
		}
		return member;
	}
}
