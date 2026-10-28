package br.planejador.itinerary;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class ActivityControllerTest {

	@Autowired
	MockMvc mvc;

	Cookie ana;
	long tripId;

	@BeforeEach
	void setUp() throws Exception {
		ana = TestUsers.register(mvc, "Ana");
		String body = mvc.perform(post("/api/trips").cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"titulo":"Roma","destino":"Roma, Itália","dataInicio":"2027-03-01",
						 "dataFim":"2027-03-03","moeda":"EUR"}
						"""))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		tripId = ((Number) JsonPath.read(body, "$.id")).longValue();
	}

	long create(String json) throws Exception {
		String body = mvc.perform(post("/api/trips/{t}/activities", tripId).cookie(ana)
				.contentType(MediaType.APPLICATION_JSON).content(json))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return ((Number) JsonPath.read(body, "$.id")).longValue();
	}

	static String activity(String titulo, String data, String hora) {
		return """
				{"titulo":"%s","data":%s,"horaInicio":%s,"categoria":"PASSEIO"}
				""".formatted(titulo, data == null ? "null" : "\"" + data + "\"",
				hora == null ? "null" : "\"" + hora + "\"");
	}

	@Test
	void ordenaPorHorarioAoCriar() throws Exception {
		create(activity("Coliseu", "2027-03-01", "14:00"));
		create(activity("Café", "2027-03-01", "08:30"));
		create(activity("Jantar", "2027-03-01", null));
		create(activity("Fontana di Trevi", null, null));

		mvc.perform(get("/api/trips/{t}/activities", tripId).cookie(ana))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].titulo").value(contains("Café", "Coliseu", "Jantar", "Fontana di Trevi")))
				.andExpect(jsonPath("$[0].horaInicio").value("08:30:00"))
				.andExpect(jsonPath("$[0].atualizadoPorNome").value("Ana"))
				.andExpect(jsonPath("$[3].data").doesNotExist());
	}

	@Test
	void validaDiaDentroDaViagemEHorarios() throws Exception {
		mvc.perform(post("/api/trips/{t}/activities", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content(activity("Fora", "2027-04-01", null)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.data").exists());

		mvc.perform(post("/api/trips/{t}/activities", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"titulo":"X","data":"2027-03-01","horaInicio":"10:00","horaFim":"09:00","categoria":"OUTRO"}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.horaFim").exists());
	}

	@Test
	void reordenarEditarEExcluir() throws Exception {
		long a = create(activity("A", "2027-03-02", null));
		long b = create(activity("B", "2027-03-02", null));
		long c = create(activity("C", "2027-03-02", null));

		mvc.perform(put("/api/trips/{t}/activities/order", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"data\":\"2027-03-02\",\"ids\":[%d,%d,%d]}".formatted(c, a, b)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].titulo").value(contains("C", "A", "B")));

		// Lista incompleta → conflito (alguém mudou o dia enquanto isso).
		mvc.perform(put("/api/trips/{t}/activities/order", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"data\":\"2027-03-02\",\"ids\":[%d,%d]}".formatted(a, b)))
				.andExpect(status().isConflict());

		// Mover para Ideias.
		mvc.perform(put("/api/trips/{t}/activities/{a}", tripId, a).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"titulo":"A2","data":null,"categoria":"REFEICAO","localNome":"Trastevere","lat":41.88,"lng":12.47}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.titulo").value("A2"))
				.andExpect(jsonPath("$.lat").value(41.88));

		mvc.perform(delete("/api/trips/{t}/activities/{b}", tripId, b).cookie(ana)).andExpect(status().isNoContent());
		mvc.perform(get("/api/trips/{t}/activities", tripId).cookie(ana))
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[*].titulo").value(contains("C", "A2")));
	}

	@Test
	void naoMembroNaoAcessa() throws Exception {
		long a = create(activity("A", null, null));
		Cookie bruno = TestUsers.register(mvc, "Bruno");
		mvc.perform(get("/api/trips/{t}/activities", tripId).cookie(bruno)).andExpect(status().isNotFound());
		mvc.perform(delete("/api/trips/{t}/activities/{a}", tripId, a).cookie(bruno)).andExpect(status().isNotFound());
	}
}
