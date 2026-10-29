package br.planejador.checklist;

import static org.hamcrest.Matchers.contains;
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
class ChecklistControllerTest {

	@Autowired
	MockMvc mvc;

	Cookie ana;
	long anaId;
	long tripId;

	@BeforeEach
	void setUp() throws Exception {
		ana = TestUsers.register(mvc, "Ana");
		anaId = id(mvc.perform(get("/api/me").cookie(ana)).andReturn().getResponse().getContentAsString());
		tripId = id(mvc.perform(post("/api/trips").cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"titulo":"Praia","destino":"Salvador","dataInicio":"2027-01-10","dataFim":"2027-01-15","moeda":"BRL"}
						"""))
				.andReturn().getResponse().getContentAsString());
	}

	static long id(String json) {
		return ((Number) JsonPath.read(json, "$.id")).longValue();
	}

	@Test
	void criaMarcaEditaEExclui() throws Exception {
		long item = id(mvc.perform(post("/api/trips/{t}/checklist", tripId).cookie(ana)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"TAREFA\",\"texto\":\"Renovar passaporte\",\"responsavelId\":%d,\"prazo\":\"2026-12-01\"}"
						.formatted(anaId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.feito").value(false))
				.andExpect(jsonPath("$.responsavelId").value(anaId))
				.andReturn().getResponse().getContentAsString());

		mvc.perform(patch("/api/trips/{t}/checklist/{i}/done", tripId, item).cookie(ana)
				.contentType(MediaType.APPLICATION_JSON).content("{\"feito\":true}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.feito").value(true))
				.andExpect(jsonPath("$.feitoPorNome").value("Ana"));

		mvc.perform(put("/api/trips/{t}/checklist/{i}", tripId, item).cookie(ana)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"TAREFA\",\"texto\":\"Renovar passaporte e RG\",\"responsavelId\":null}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.texto").value("Renovar passaporte e RG"))
				.andExpect(jsonPath("$.feito").value(true))
				.andExpect(jsonPath("$.responsavelId").doesNotExist());

		mvc.perform(delete("/api/trips/{t}/checklist/{i}", tripId, item).cookie(ana)).andExpect(status().isNoContent());
		mvc.perform(get("/api/trips/{t}/checklist", tripId).cookie(ana)).andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void adicionaVariosIgnorandoRepetidos() throws Exception {
		mvc.perform(post("/api/trips/{t}/checklist/bulk", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"BAGAGEM\",\"textos\":[\"Protetor solar\",\"Chinelo\"]}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$", hasSize(2)));

		mvc.perform(post("/api/trips/{t}/checklist/bulk", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"BAGAGEM\",\"textos\":[\"protetor solar \",\"Óculos de sol\",\"Óculos de sol\"]}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$[*].texto").value(contains("Óculos de sol")));

		mvc.perform(get("/api/trips/{t}/checklist", tripId).cookie(ana)).andExpect(jsonPath("$", hasSize(3)));
	}

	@Test
	void validaResponsavelEAcesso() throws Exception {
		Cookie bruno = TestUsers.register(mvc, "Bruno");
		long brunoId = id(mvc.perform(get("/api/me").cookie(bruno)).andReturn().getResponse().getContentAsString());

		mvc.perform(post("/api/trips/{t}/checklist", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"BAGAGEM\",\"texto\":\"Mala\",\"responsavelId\":%d}".formatted(brunoId)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.responsavelId").exists());

		mvc.perform(get("/api/trips/{t}/checklist", tripId).cookie(bruno)).andExpect(status().isNotFound());
	}
}
