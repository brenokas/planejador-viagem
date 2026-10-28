package br.planejador.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.planejador.auth.AuthDtos.LoginRequest;
import br.planejador.auth.AuthDtos.RegisterRequest;
import br.planejador.user.User;
import br.planejador.user.UserResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;
	private final TokenService tokenService;
	private final AuthCookies cookies;

	public AuthController(AuthService authService, TokenService tokenService, AuthCookies cookies) {
		this.authService = authService;
		this.tokenService = tokenService;
		this.cookies = cookies;
	}

	@PostMapping("/register")
	ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest req) {
		return withToken(HttpStatus.CREATED, authService.register(req));
	}

	@PostMapping("/login")
	ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest req) {
		return withToken(HttpStatus.OK, authService.login(req));
	}

	@PostMapping("/logout")
	ResponseEntity<Void> logout() {
		return ResponseEntity.noContent()
				.header(HttpHeaders.SET_COOKIE, cookies.clear().toString())
				.build();
	}

	private ResponseEntity<UserResponse> withToken(HttpStatus status, User user) {
		return ResponseEntity.status(status)
				.header(HttpHeaders.SET_COOKIE, cookies.create(tokenService.generate(user)).toString())
				.body(UserResponse.from(user));
	}
}
