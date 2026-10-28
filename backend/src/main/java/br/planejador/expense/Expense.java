package br.planejador.expense;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "expenses")
public class Expense {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "trip_id", nullable = false, updatable = false)
	private Long tripId;

	@Column(nullable = false)
	private String descricao;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ExpenseCategory categoria;

	@Column(name = "valor_centavos", nullable = false)
	private long valorCentavos;

	@Column(nullable = false, length = 3)
	private String moeda;

	@Column(name = "taxa_cambio", nullable = false, precision = 20, scale = 8)
	private BigDecimal taxaCambio;

	@Column(name = "valor_convertido_centavos", nullable = false)
	private long valorConvertidoCentavos;

	@Column(nullable = false)
	private LocalDate data;

	@Column(name = "pago_por", nullable = false)
	private Long pagoPor;

	@Enumerated(EnumType.STRING)
	@Column(name = "modo_divisao", nullable = false)
	private SplitMode modoDivisao;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "expense_splits", joinColumns = @JoinColumn(name = "expense_id"))
	@MapKeyColumn(name = "user_id")
	private Map<Long, SplitShare> divisao = new LinkedHashMap<>();

	@Column(name = "criado_por", updatable = false)
	private Long criadoPor;

	@Column(name = "atualizado_por")
	private Long atualizadoPor;

	@Column(name = "criado_em", nullable = false, updatable = false)
	private Instant criadoEm = Instant.now();

	@Column(name = "atualizado_em", nullable = false)
	private Instant atualizadoEm = Instant.now();

	@Version
	private int version;

	protected Expense() {
	}

	public Expense(Long tripId, Long criadoPor) {
		this.tripId = tripId;
		this.criadoPor = criadoPor;
	}

	@PreUpdate
	void onUpdate() {
		atualizadoEm = Instant.now();
	}

	public void update(String descricao, ExpenseCategory categoria, long valorCentavos, String moeda,
			BigDecimal taxaCambio, long valorConvertidoCentavos, LocalDate data, Long pagoPor, SplitMode modoDivisao,
			Map<Long, SplitShare> divisao, Long atualizadoPor) {
		this.descricao = descricao;
		this.categoria = categoria;
		this.valorCentavos = valorCentavos;
		this.moeda = moeda;
		this.taxaCambio = taxaCambio;
		this.valorConvertidoCentavos = valorConvertidoCentavos;
		this.data = data;
		this.pagoPor = pagoPor;
		this.modoDivisao = modoDivisao;
		this.divisao.clear();
		this.divisao.putAll(divisao);
		this.atualizadoPor = atualizadoPor;
	}

	public Long getId() {
		return id;
	}

	public Long getTripId() {
		return tripId;
	}

	public String getDescricao() {
		return descricao;
	}

	public ExpenseCategory getCategoria() {
		return categoria;
	}

	public long getValorCentavos() {
		return valorCentavos;
	}

	public String getMoeda() {
		return moeda;
	}

	public BigDecimal getTaxaCambio() {
		return taxaCambio;
	}

	public long getValorConvertidoCentavos() {
		return valorConvertidoCentavos;
	}

	public LocalDate getData() {
		return data;
	}

	public Long getPagoPor() {
		return pagoPor;
	}

	public SplitMode getModoDivisao() {
		return modoDivisao;
	}

	public Map<Long, SplitShare> getDivisao() {
		return divisao;
	}

	public Long getAtualizadoPor() {
		return atualizadoPor;
	}

	public Instant getAtualizadoEm() {
		return atualizadoEm;
	}

	public int getVersion() {
		return version;
	}
}
