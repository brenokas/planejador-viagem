package br.planejador.auth;

import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import br.planejador.config.AppProperties;

@Component
public class AuthCookies {

	public static final String NAME = "token";

	private final AppProperties props;

	public AuthCookies(AppProperties props) {
		this.props = props;
	}

	public ResponseCookie create(String token) {
		return build(token, props.jwt().expiration());
	}

	public ResponseCookie clear() {
		return build("", Duration.ZERO);
	}

	private ResponseCookie build(String value, Duration maxAge) {
		return ResponseCookie.from(NAME, value)
				.httpOnly(true)
				.secure(props.cookie().secure())
				.sameSite("Lax")
				.path("/")
				.maxAge(maxAge)
				.build();
	}
}
