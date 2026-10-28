package br.planejador.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import br.planejador.common.ApiException;
import br.planejador.user.User;
import br.planejador.user.UserRepository;

@Component
public class CurrentUser {

	private final UserRepository users;

	public CurrentUser(UserRepository users) {
		this.users = users;
	}

	public static Long id(Jwt jwt) {
		return Long.valueOf(jwt.getSubject());
	}

	public User load(Jwt jwt) {
		return users.findById(id(jwt))
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Sessão inválida."));
	}
}
