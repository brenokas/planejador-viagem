package br.planejador.ai;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

	/** Mais recentes primeiro. */
	List<AiMessage> findByTripIdOrderByIdDesc(Long tripId, Limit limit);

	@Modifying
	@Query("delete from AiMessage m where m.tripId = :tripId")
	void deleteByTripId(Long tripId);
}
