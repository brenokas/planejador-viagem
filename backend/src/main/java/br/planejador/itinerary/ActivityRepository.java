package br.planejador.itinerary;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

	@Query("select a from Activity a where a.tripId = :tripId order by a.data asc nulls last, a.ordem asc, a.id asc")
	List<Activity> findAllForTrip(Long tripId);

	List<Activity> findByTripIdAndDataOrderByOrdemAscIdAsc(Long tripId, LocalDate data);

	List<Activity> findByTripIdAndDataIsNullOrderByOrdemAscIdAsc(Long tripId);

	Optional<Activity> findByIdAndTripId(Long id, Long tripId);

	/** Atividades de um dia; data nula = Ideias. */
	default List<Activity> findForDay(Long tripId, LocalDate data) {
		return data == null
				? findByTripIdAndDataIsNullOrderByOrdemAscIdAsc(tripId)
				: findByTripIdAndDataOrderByOrdemAscIdAsc(tripId, data);
	}
}
