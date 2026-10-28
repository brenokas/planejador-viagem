package br.planejador.trip;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@Table(name = "trip_members")
@IdClass(TripMember.Key.class)
public class TripMember {

	public static class Key implements Serializable {
		private Long tripId;
		private Long userId;

		public Key() {
		}

		public Key(Long tripId, Long userId) {
			this.tripId = tripId;
			this.userId = userId;
		}

		@Override
		public boolean equals(Object o) {
			return o instanceof Key k && Objects.equals(tripId, k.tripId) && Objects.equals(userId, k.userId);
		}

		@Override
		public int hashCode() {
			return Objects.hash(tripId, userId);
		}
	}

	@Id
	@Column(name = "trip_id")
	private Long tripId;

	@Id
	@Column(name = "user_id")
	private Long userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TripRole papel;

	@Column(name = "entrou_em", nullable = false, updatable = false)
	private Instant entrouEm = Instant.now();

	protected TripMember() {
	}

	public TripMember(Long tripId, Long userId, TripRole papel) {
		this.tripId = tripId;
		this.userId = userId;
		this.papel = papel;
	}

	public Long getTripId() {
		return tripId;
	}

	public Long getUserId() {
		return userId;
	}

	public TripRole getPapel() {
		return papel;
	}

	public boolean isDono() {
		return papel == TripRole.DONO;
	}

	public Instant getEntrouEm() {
		return entrouEm;
	}
}
