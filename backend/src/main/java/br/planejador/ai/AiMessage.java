package br.planejador.ai;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "ai_messages")
public class AiMessage {

	public static final String USER = "user";
	public static final String ASSISTANT = "assistant";

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "trip_id", nullable = false, updatable = false)
	private Long tripId;

	@Column(name = "user_id", updatable = false)
	private Long userId;

	@Column(nullable = false, updatable = false)
	private String role;

	@Column(nullable = false, updatable = false)
	private String conteudo;

	@Column(name = "criado_em", nullable = false, updatable = false)
	private Instant criadoEm = Instant.now();

	protected AiMessage() {
	}

	public AiMessage(Long tripId, Long userId, String role, String conteudo) {
		this.tripId = tripId;
		this.userId = userId;
		this.role = role;
		this.conteudo = conteudo;
	}

	public Long getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public String getRole() {
		return role;
	}

	public String getConteudo() {
		return conteudo;
	}

	public Instant getCriadoEm() {
		return criadoEm;
	}
}
