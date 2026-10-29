package br.planejador.user;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.auth.CurrentUser;
import br.planejador.common.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/me")
public class MeController {

	public record ProfileRequest(
			@NotBlank(message = "Informe seu nome.") @Size(max = 100, message = "Nome muito longo.") String nome) {
	}

	public record PasswordRequest(
			@NotBlank(message = "Informe a senha atual.") String senhaAtual,
			@NotBlank(message = "Informe a nova senha.") @Size(min = 8, max = 72, message = "A senha deve ter entre 8 e 72 caracteres.") String novaSenha) {
	}

	private final CurrentUser currentUser;
	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;

	public MeController(CurrentUser currentUser, UserRepository users, PasswordEncoder passwordEncoder) {
		this.currentUser = currentUser;
		this.users = users;
		this.passwordEncoder = passwordEncoder;
	}

	@GetMapping
	UserResponse me(@AuthenticationPrincipal Jwt jwt) {
		return UserResponse.from(currentUser.load(jwt));
	}

	@PutMapping
	@Transactional
	UserResponse update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ProfileRequest req) {
		User user = currentUser.load(jwt);
		user.setNome(req.nome().trim());
		return UserResponse.from(users.save(user));
	}

	@PutMapping("/senha")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Transactional
	void changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody PasswordRequest req) {
		User user = currentUser.load(jwt);
		if (!passwordEncoder.matches(req.senhaAtual(), user.getSenhaHash())) {
			throw ApiException.invalidField("senhaAtual", "Senha atual incorreta.");
		}
		user.setSenhaHash(passwordEncoder.encode(req.novaSenha()));
		users.save(user);
	}
}
