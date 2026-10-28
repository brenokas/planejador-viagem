package br.planejador.itinerary;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

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
@Table(name = "activities")
public class Activity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "trip_id", nullable = false, updatable = false)
	private Long tripId;

	@Column(nullable = false)
	private String titulo;

	private LocalDate data;

	@Column(name = "hora_inicio")
	private LocalTime horaInicio;

	@Column(name = "hora_fim")
	private LocalTime horaFim;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ActivityCategory categoria;

	@Column(name = "local_nome")
	private String localNome;

	private Double lat;

	private Double lng;

	@Column(name = "custo_centavos")
	private Long custoCentavos;

	private String notas;

	@Column(nullable = false)
	private int ordem;

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

	protected Activity() {
	}

	public Activity(Long tripId, Long criadoPor) {
		this.tripId = tripId;
		this.criadoPor = criadoPor;
		this.atualizadoPor = criadoPor;
	}

	@PreUpdate
	void onUpdate() {
		atualizadoEm = Instant.now();
	}

	public void update(String titulo, LocalDate data, LocalTime horaInicio, LocalTime horaFim,
			ActivityCategory categoria, String localNome, Double lat, Double lng, Long custoCentavos, String notas,
			Long atualizadoPor) {
		this.titulo = titulo;
		this.data = data;
		this.horaInicio = horaInicio;
		this.horaFim = horaFim;
		this.categoria = categoria;
		this.localNome = localNome;
		this.lat = lat;
		this.lng = lng;
		this.custoCentavos = custoCentavos;
		this.notas = notas;
		this.atualizadoPor = atualizadoPor;
	}

	public void setOrdem(int ordem) {
		this.ordem = ordem;
	}

	public Long getId() {
		return id;
	}

	public Long getTripId() {
		return tripId;
	}

	public String getTitulo() {
		return titulo;
	}

	public LocalDate getData() {
		return data;
	}

	public LocalTime getHoraInicio() {
		return horaInicio;
	}

	public LocalTime getHoraFim() {
		return horaFim;
	}

	public ActivityCategory getCategoria() {
		return categoria;
	}

	public String getLocalNome() {
		return localNome;
	}

	public Double getLat() {
		return lat;
	}

	public Double getLng() {
		return lng;
	}

	public Long getCustoCentavos() {
		return custoCentavos;
	}

	public String getNotas() {
		return notas;
	}

	public int getOrdem() {
		return ordem;
	}

	public Long getCriadoPor() {
		return criadoPor;
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
