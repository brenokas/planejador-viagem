package br.planejador.expense;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

	List<Expense> findByTripIdOrderByDataDescIdDesc(Long tripId);

	Optional<Expense> findByIdAndTripId(Long id, Long tripId);

	boolean existsByTripId(Long tripId);
}
