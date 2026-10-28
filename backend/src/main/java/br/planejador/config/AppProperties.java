package br.planejador.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cookie cookie) {

	public record Jwt(String secret, Duration expiration) {
	}

	public record Cookie(boolean secure) {
	}
}
