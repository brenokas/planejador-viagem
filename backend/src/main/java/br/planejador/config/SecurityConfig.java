package br.planejador.config;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.web.util.WebUtils;

import br.planejador.auth.AuthCookies;

@Configuration
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, BearerTokenResolver tokenResolver) throws Exception {
		http
				// API stateless com cookie SameSite=Lax e somente JSON; sem CORS habilitado.
				.csrf(csrf -> csrf.disable())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/api/auth/**", "/actuator/health").permitAll()
						.anyRequest().authenticated())
				.oauth2ResourceServer(oauth -> oauth
						.bearerTokenResolver(tokenResolver)
						.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
						.jwt(jwt -> {
						}))
				.exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)));
		return http.build();
	}

	@Bean
	BearerTokenResolver bearerTokenResolver() {
		return request -> {
			// Rotas públicas ignoram o cookie para que um token expirado não bloqueie o login.
			if (request.getRequestURI().startsWith("/api/auth/")) {
				return null;
			}
			var cookie = WebUtils.getCookie(request, AuthCookies.NAME);
			return cookie != null ? cookie.getValue() : null;
		};
	}

	@Bean
	SecretKey jwtSecretKey(AppProperties props) {
		byte[] bytes = props.jwt().secret().getBytes(StandardCharsets.UTF_8);
		if (bytes.length < 32) {
			throw new IllegalStateException("app.jwt.secret deve ter pelo menos 32 caracteres");
		}
		return new SecretKeySpec(bytes, "HmacSHA256");
	}

	@Bean
	JwtEncoder jwtEncoder(SecretKey key) {
		return NimbusJwtEncoder.withSecretKey(key).algorithm(MacAlgorithm.HS256).build();
	}

	@Bean
	JwtDecoder jwtDecoder(SecretKey key) {
		return NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
