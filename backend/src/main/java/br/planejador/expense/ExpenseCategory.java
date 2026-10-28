package br.planejador.expense;

public enum ExpenseCategory {
	HOSPEDAGEM,
	TRANSPORTE,
	ALIMENTACAO,
	PASSEIOS,
	COMPRAS,
	OUTROS,
	/** Pagamento entre os participantes para quitar saldos; não conta como gasto da viagem. */
	ACERTO
}
