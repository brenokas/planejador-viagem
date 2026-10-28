package br.planejador.trip;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TripMemberRepository extends JpaRepository<TripMember, TripMember.Key> {

	Optional<TripMember> findByTripIdAndUserId(Long tripId, Long userId);

	List<TripMember> findByTripIdOrderByEntrouEmAsc(Long tripId);

	List<TripMember> findByTripIdInOrderByEntrouEmAsc(Collection<Long> tripIds);

	boolean existsByTripIdAndUserId(Long tripId, Long userId);
}
