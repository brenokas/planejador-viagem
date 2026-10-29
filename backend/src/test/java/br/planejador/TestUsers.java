package br.planejador;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import br.planejador.auth.AuthCookies;
import jakarta.servlet.http.Cookie;

public final class TestUsers {

	private TestUsers() {
	}

	/** Cadastra um usuário com e-mail único e retorna o cookie de autenticação. */
	public static Cookie register(MockMvc mvc, String nome) throws Exception {
		String email = nome.toLowerCase().replaceAll("\\s+", ".") + "-" + UUID.randomUUID() + "@teste.com";
		var result = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"nome":"%s","email":"%s","senha":"senha-forte"}
						""".formatted(nome, email)))
				.andExpect(status().isCreated())
				.andReturn();
		return result.getResponse().getCookie(AuthCookies.NAME);
	}
}
