package br.planejador.trip;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "trip_invites")
public class TripInvite {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "trip_id", nullable = false, updatable = false)
	private Long tripId;

	@Column(nullable = false, unique = true, updatable = false)
	private String token;

	@Column(name = "criado_por", nullable = false, updatable = false)
	private Long criadoPor;

	@Column(name = "criado_em", nullable = false, updatable = false)
	private Instant criadoEm = Instant.now();

	@Column(name = "expira_em", nullable = false)
	private Instant expiraEm;

	@Column(name = "usado_por")
	private Long usadoPor;

	@Column(name = "usado_em")
	private Instant usadoEm;

	protected TripInvite() {
	}

	public TripInvite(Long tripId, String token, Long criadoPor, Instant expiraEm) {
		this.tripId = tripId;
		this.token = token;
		this.criadoPor = criadoPor;
		this.expiraEm = expiraEm;
	}

	public boolean isExpirado() {
		return Instant.now().isAfter(expiraEm);
	}

	public boolean isUsado() {
		return usadoPor != null;
	}

	public void markUsed(Long userId) {
		this.usadoPor = userId;
		this.usadoEm = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public Long getTripId() {
		return tripId;
	}

	public String getToken() {
		return token;
	}

	public Long getCriadoPor() {
		return criadoPor;
	}

	public Instant getExpiraEm() {
		return expiraEm;
	}

	public Long getUsadoPor() {
		return usadoPor;
	}
}
