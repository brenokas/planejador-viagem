package br.planejador.auth;

import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.planejador.auth.AuthDtos.LoginRequest;
import br.planejador.auth.AuthDtos.RegisterRequest;
import br.planejador.common.ApiException;
import br.planejador.user.User;
import br.planejador.user.UserRepository;

@Service
public class AuthService {

	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;

	public AuthService(UserRepository users, PasswordEncoder passwordEncoder) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public User register(RegisterRequest req) {
		String email = normalize(req.email());
		if (users.existsByEmail(email)) {
			throw new ApiException(HttpStatus.CONFLICT, "Já existe uma conta com este e-mail.");
		}
		return users.save(new User(req.nome().trim(), email, passwordEncoder.encode(req.senha())));
	}

	@Transactional(readOnly = true)
	public User login(LoginRequest req) {
		return users.findByEmail(normalize(req.email()))
				.filter(u -> passwordEncoder.matches(req.senha(), u.getSenhaHash()))
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos."));
	}

	private static String normalize(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}
