package br.planejador.trip;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TripInviteRepository extends JpaRepository<TripInvite, Long> {

	Optional<TripInvite> findByToken(String token);
}
