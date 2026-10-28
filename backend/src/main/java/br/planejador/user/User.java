package br.planejador.user;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String nome;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(name = "senha_hash", nullable = false)
	private String senhaHash;

	@Column(name = "avatar_url")
	private String avatarUrl;

	@Column(name = "criado_em", nullable = false, updatable = false)
	private Instant criadoEm = Instant.now();

	protected User() {
	}

	public User(String nome, String email, String senhaHash) {
		this.nome = nome;
		this.email = email;
		this.senhaHash = senhaHash;
	}

	public Long getId() {
		return id;
	}

	public String getNome() {
		return nome;
	}

	public String getEmail() {
		return email;
	}

	public String getSenhaHash() {
		return senhaHash;
	}

	public String getAvatarUrl() {
		return avatarUrl;
	}

	public Instant getCriadoEm() {
		return criadoEm;
	}
}
