package br.planejador.checklist;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChecklistItemRepository extends JpaRepository<ChecklistItem, Long> {

	List<ChecklistItem> findByTripIdOrderByCriadoEmAscIdAsc(Long tripId);

	Optional<ChecklistItem> findByIdAndTripId(Long id, Long tripId);
}
