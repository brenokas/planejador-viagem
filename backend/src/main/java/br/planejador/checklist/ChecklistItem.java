package br.planejador.checklist;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "checklist_items")
public class ChecklistItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "trip_id", nullable = false, updatable = false)
	private Long tripId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ChecklistType tipo;

	@Column(nullable = false)
	private String texto;

	@Column(nullable = false)
	private boolean feito;

	@Column(name = "responsavel_id")
	private Long responsavelId;

	private LocalDate prazo;

	@Column(name = "feito_por")
	private Long feitoPor;

	@Column(name = "criado_por", updatable = false)
	private Long criadoPor;

	@Column(name = "criado_em", nullable = false, updatable = false)
	private Instant criadoEm = Instant.now();

	@Column(name = "atualizado_em", nullable = false)
	private Instant atualizadoEm = Instant.now();

	@Version
	private int version;

	protected ChecklistItem() {
	}

	public ChecklistItem(Long tripId, ChecklistType tipo, String texto, Long criadoPor) {
		this.tripId = tripId;
		this.tipo = tipo;
		this.texto = texto;
		this.criadoPor = criadoPor;
	}

	@PreUpdate
	void onUpdate() {
		atualizadoEm = Instant.now();
	}

	public void update(ChecklistType tipo, String texto, Long responsavelId, LocalDate prazo) {
		this.tipo = tipo;
		this.texto = texto;
		this.responsavelId = responsavelId;
		this.prazo = prazo;
	}

	public void setFeito(boolean feito, Long userId) {
		if (this.feito != feito) {
			this.feito = feito;
			this.feitoPor = feito ? userId : null;
		}
	}

	public Long getId() {
		return id;
	}

	public Long getTripId() {
		return tripId;
	}

	public ChecklistType getTipo() {
		return tipo;
	}

	public String getTexto() {
		return texto;
	}

	public boolean isFeito() {
		return feito;
	}

	public Long getResponsavelId() {
		return responsavelId;
	}

	public LocalDate getPrazo() {
		return prazo;
	}

	public Long getFeitoPor() {
		return feitoPor;
	}

	public Instant getCriadoEm() {
		return criadoEm;
	}

	public int getVersion() {
		return version;
	}
}
