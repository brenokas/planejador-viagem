package br.planejador.trip;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TripRepository extends JpaRepository<Trip, Long> {

	@Query("""
			select t from Trip t
			where t.arquivada = :arquivada
			  and exists (select 1 from TripMember m where m.tripId = t.id and m.userId = :userId)
			order by t.dataInicio asc, t.id asc
			""")
	List<Trip> findForMember(Long userId, boolean arquivada);
}
