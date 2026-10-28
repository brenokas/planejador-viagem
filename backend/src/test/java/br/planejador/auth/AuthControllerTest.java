package br.planejador.auth;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import br.planejador.TestcontainersConfiguration;
import jakarta.servlet.http.Cookie;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

	@Autowired
	MockMvc mvc;

	@Test
	void cadastroLoginEMe() throws Exception {
		String body = """
				{"nome":"Ana","email":"Ana@Email.com","senha":"senha-forte"}
				""";

		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.email").value("ana@email.com"))
				.andExpect(header().string("Set-Cookie", containsString("HttpOnly")));

		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
				.andExpect(status().isConflict());

		var login = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"email":"ana@email.com","senha":"senha-forte"}
						"""))
				.andExpect(status().isOk())
				.andReturn();
		Cookie token = login.getResponse().getCookie(AuthCookies.NAME);

		mvc.perform(get("/api/me").cookie(token))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nome").value("Ana"));
	}

	@Test
	void loginComSenhaErrada() throws Exception {
		mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"email":"ninguem@email.com","senha":"qualquer-coisa"}
						"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.mensagem").value("E-mail ou senha incorretos."));
	}

	@Test
	void cadastroInvalido() throws Exception {
		mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"nome":"","email":"invalido","senha":"123"}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.email").value("E-mail inválido."))
				.andExpect(jsonPath("$.campos.senha").exists());
	}

	@Test
	void meSemLoginRetorna401() throws Exception {
		mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
	}
}
