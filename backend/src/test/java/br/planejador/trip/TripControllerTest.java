package br.planejador.trip;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

import br.planejador.TestUsers;
import br.planejador.TestcontainersConfiguration;
import jakarta.servlet.http.Cookie;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class TripControllerTest {

	static final String LISBOA = """
			{"titulo":"Lua de mel","destino":"Lisboa, Portugal","dataInicio":"2027-05-10",
			 "dataFim":"2027-05-17","moeda":"eur","orcamentoCentavos":500000}
			""";

	@Autowired
	MockMvc mvc;

	Cookie ana;
	Cookie bruno;

	@BeforeEach
	void setUp() throws Exception {
		ana = TestUsers.register(mvc, "Ana");
		bruno = TestUsers.register(mvc, "Bruno");
	}

	long createTrip(Cookie user) throws Exception {
		String body = mvc.perform(post("/api/trips").cookie(user).contentType(MediaType.APPLICATION_JSON).content(LISBOA))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.moeda").value("EUR"))
				.andExpect(jsonPath("$.meuPapel").value("DONO"))
				.andExpect(jsonPath("$.membros", hasSize(1)))
				.andReturn().getResponse().getContentAsString();
		return ((Number) JsonPath.read(body, "$.id")).longValue();
	}

	String createInvite(Cookie user, long tripId) throws Exception {
		String body = mvc.perform(post("/api/trips/{id}/invites", tripId).cookie(user))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.token");
	}

	@Test
	void criarListarEEditar() throws Exception {
		long id = createTrip(ana);

		mvc.perform(get("/api/trips").cookie(ana))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(1)))
				.andExpect(jsonPath("$[0].dataInicio").value("2027-05-10"));

		mvc.perform(put("/api/trips/{id}", id).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content(LISBOA.replace("Lua de mel", "Férias").replace("}", ",\"version\":0}")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.titulo").value("Férias"))
				.andExpect(jsonPath("$.version").value(1));

		// Versão desatualizada → conflito.
		mvc.perform(put("/api/trips/{id}", id).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content(LISBOA.replace("}", ",\"version\":0}")))
				.andExpect(status().isConflict());
	}

	@Test
	void validaPeriodo() throws Exception {
		mvc.perform(post("/api/trips").cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content(LISBOA.replace("2027-05-17", "2027-05-01")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.dataFim").value("A volta deve ser depois da ida."));
	}

	@Test
	void naoMembroNaoVeAViagem() throws Exception {
		long id = createTrip(ana);

		mvc.perform(get("/api/trips/{id}", id).cookie(bruno)).andExpect(status().isNotFound());
		mvc.perform(put("/api/trips/{id}", id).cookie(bruno).contentType(MediaType.APPLICATION_JSON).content(LISBOA))
				.andExpect(status().isNotFound());
		mvc.perform(post("/api/trips/{id}/invites", id).cookie(bruno)).andExpect(status().isNotFound());
		mvc.perform(get("/api/trips").cookie(bruno)).andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void conviteAdicionaParticipante() throws Exception {
		long id = createTrip(ana);
		String token = createInvite(ana, id);

		mvc.perform(get("/api/invites/{token}", token).cookie(bruno))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.titulo").value("Lua de mel"))
				.andExpect(jsonPath("$.convidadoPor").value("Ana"))
				.andExpect(jsonPath("$.jaMembro").value(false));

		mvc.perform(post("/api/invites/{token}/accept", token).cookie(bruno))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.meuPapel").value("EDITOR"))
				.andExpect(jsonPath("$.membros", hasSize(2)));

		// Aceitar de novo é idempotente para quem já é membro.
		mvc.perform(post("/api/invites/{token}/accept", token).cookie(bruno)).andExpect(status().isOk());

		// Um terceiro não pode reutilizar o convite.
		Cookie carla = TestUsers.register(mvc, "Carla");
		mvc.perform(post("/api/invites/{token}/accept", token).cookie(carla)).andExpect(status().isGone());

		// Bruno agora edita, mas não pode excluir.
		mvc.perform(get("/api/trips/{id}", id).cookie(bruno)).andExpect(status().isOk());
		mvc.perform(delete("/api/trips/{id}", id).cookie(bruno)).andExpect(status().isForbidden());
	}

	@Test
	void conviteInexistente() throws Exception {
		mvc.perform(get("/api/invites/{token}", "nao-existe").cookie(bruno)).andExpect(status().isNotFound());
	}

	@Test
	void arquivarEExcluir() throws Exception {
		long id = createTrip(ana);

		mvc.perform(patch("/api/trips/{id}/archive", id).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"arquivada\":true}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.arquivada").value(true));
		mvc.perform(get("/api/trips").cookie(ana)).andExpect(jsonPath("$", hasSize(0)));
		mvc.perform(get("/api/trips?arquivadas=true").cookie(ana)).andExpect(jsonPath("$", hasSize(1)));

		mvc.perform(delete("/api/trips/{id}", id).cookie(ana)).andExpect(status().isNoContent());
		mvc.perform(get("/api/trips/{id}", id).cookie(ana)).andExpect(status().isNotFound());
	}

	@Test
	void participanteSaiEDonoNao() throws Exception {
		long id = createTrip(ana);
		mvc.perform(post("/api/invites/{token}/accept", createInvite(ana, id)).cookie(bruno)).andExpect(status().isOk());

		String me = mvc.perform(get("/api/me").cookie(bruno)).andReturn().getResponse().getContentAsString();
		long brunoId = ((Number) JsonPath.read(me, "$.id")).longValue();
		String anaMe = mvc.perform(get("/api/me").cookie(ana)).andReturn().getResponse().getContentAsString();
		long anaId = ((Number) JsonPath.read(anaMe, "$.id")).longValue();

		mvc.perform(delete("/api/trips/{id}/members/{u}", id, anaId).cookie(ana)).andExpect(status().isBadRequest());
		mvc.perform(delete("/api/trips/{id}/members/{u}", id, brunoId).cookie(bruno)).andExpect(status().isNoContent());
		mvc.perform(get("/api/trips/{id}", id).cookie(bruno)).andExpect(status().isNotFound());
	}
}
