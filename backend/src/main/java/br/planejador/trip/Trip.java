package br.planejador.trip;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "trips")
public class Trip {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String titulo;

	@Column(nullable = false)
	private String destino;

	@Column(name = "data_inicio", nullable = false)
	private LocalDate dataInicio;

	@Column(name = "data_fim", nullable = false)
	private LocalDate dataFim;

	@Column(nullable = false, length = 3)
	private String moeda;

	@Column(name = "orcamento_centavos")
	private Long orcamentoCentavos;

	@Column(name = "capa_url")
	private String capaUrl;

	@Column(nullable = false)
	private boolean arquivada;

	@Column(name = "criado_por", nullable = false, updatable = false)
	private Long criadoPor;

	@Column(name = "criado_em", nullable = false, updatable = false)
	private Instant criadoEm = Instant.now();

	@Column(name = "atualizado_em", nullable = false)
	private Instant atualizadoEm = Instant.now();

	@Version
	private int version;

	protected Trip() {
	}

	public Trip(Long criadoPor) {
		this.criadoPor = criadoPor;
	}

	@PreUpdate
	void onUpdate() {
		atualizadoEm = Instant.now();
	}

	public void update(String titulo, String destino, LocalDate dataInicio, LocalDate dataFim, String moeda,
			Long orcamentoCentavos, String capaUrl) {
		this.titulo = titulo;
		this.destino = destino;
		this.dataInicio = dataInicio;
		this.dataFim = dataFim;
		this.moeda = moeda;
		this.orcamentoCentavos = orcamentoCentavos;
		this.capaUrl = capaUrl;
	}

	public void setArquivada(boolean arquivada) {
		this.arquivada = arquivada;
	}

	public Long getId() {
		return id;
	}

	public String getTitulo() {
		return titulo;
	}

	public String getDestino() {
		return destino;
	}

	public LocalDate getDataInicio() {
		return dataInicio;
	}

	public LocalDate getDataFim() {
		return dataFim;
	}

	public String getMoeda() {
		return moeda;
	}

	public Long getOrcamentoCentavos() {
		return orcamentoCentavos;
	}

	public String getCapaUrl() {
		return capaUrl;
	}

	public boolean isArquivada() {
		return arquivada;
	}

	public Long getCriadoPor() {
		return criadoPor;
	}

	public Instant getCriadoEm() {
		return criadoEm;
	}

	public Instant getAtualizadoEm() {
		return atualizadoEm;
	}

	public int getVersion() {
		return version;
	}
}
