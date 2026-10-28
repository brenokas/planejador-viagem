package br.planejador.expense;

import static org.hamcrest.Matchers.hasSize;
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
class ExpenseControllerTest {

	@Autowired
	MockMvc mvc;

	Cookie ana;
	Cookie bruno;
	long anaId;
	long brunoId;
	long tripId;

	@BeforeEach
	void setUp() throws Exception {
		ana = TestUsers.register(mvc, "Ana");
		bruno = TestUsers.register(mvc, "Bruno");
		anaId = id(mvc.perform(get("/api/me").cookie(ana)).andReturn().getResponse().getContentAsString());
		brunoId = id(mvc.perform(get("/api/me").cookie(bruno)).andReturn().getResponse().getContentAsString());

		tripId = id(mvc.perform(post("/api/trips").cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"titulo":"Paris","destino":"Paris","dataInicio":"2027-06-01","dataFim":"2027-06-05",
						 "moeda":"BRL","orcamentoCentavos":1000000}
						"""))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
		String token = JsonPath.read(mvc.perform(post("/api/trips/{t}/invites", tripId).cookie(ana))
				.andReturn().getResponse().getContentAsString(), "$.token");
		mvc.perform(post("/api/invites/{t}/accept", token).cookie(bruno)).andExpect(status().isOk());
	}

	static long id(String json) {
		return ((Number) JsonPath.read(json, "$.id")).longValue();
	}

	String expense(String descricao, long valor, String moeda, String taxa, long pagoPor, String divisao) {
		return """
				{"descricao":"%s","categoria":"ALIMENTACAO","valorCentavos":%d,"moeda":"%s","taxaCambio":%s,
				 "data":"2027-06-02","pagoPor":%d,%s}
				""".formatted(descricao, valor, moeda, taxa, pagoPor, divisao);
	}

	@Test
	void calculaSaldosEAcertos() throws Exception {
		// Ana paga 100,00 dividido igualmente.
		mvc.perform(post("/api/trips/{t}/expenses", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content(expense("Jantar", 10000, "BRL", "null", anaId,
						"\"modoDivisao\":\"IGUAL\",\"participantes\":[%d,%d]".formatted(anaId, brunoId))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.divisao", hasSize(2)))
				.andExpect(jsonPath("$.pagoPor.nome").value("Ana"));

		// Bruno paga 10,00 EUR (taxa 6,1) só para a Ana → 61,00 BRL.
		mvc.perform(post("/api/trips/{t}/expenses", tripId).cookie(bruno).contentType(MediaType.APPLICATION_JSON)
				.content(expense("Presente", 1000, "eur", "6.1", brunoId,
						"\"modoDivisao\":\"VALORES\",\"valores\":{\"%d\":1000}".formatted(anaId))))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.moeda").value("EUR"))
				.andExpect(jsonPath("$.valorConvertidoCentavos").value(6100));

		// Ana: pagou 100, consumiu 50 + 61 = 111 → deve 11 ao Bruno.
		mvc.perform(get("/api/trips/{t}/expenses/summary", tripId).cookie(bruno))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalGastoCentavos").value(16100))
				.andExpect(jsonPath("$.orcamentoCentavos").value(1000000))
				.andExpect(jsonPath("$.porCategoria[0].categoria").value("ALIMENTACAO"))
				.andExpect(jsonPath("$.pessoas[0].nome").value("Ana"))
				.andExpect(jsonPath("$.pessoas[0].saldoCentavos").value(-1100))
				.andExpect(jsonPath("$.acertos", hasSize(1)))
				.andExpect(jsonPath("$.acertos[0].de.nome").value("Ana"))
				.andExpect(jsonPath("$.acertos[0].para.nome").value("Bruno"))
				.andExpect(jsonPath("$.acertos[0].valorCentavos").value(1100));

		// Registrar o acerto zera os saldos e não conta como gasto.
		mvc.perform(post("/api/trips/{t}/expenses/settle", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"de\":%d,\"para\":%d,\"valorCentavos\":1100}".formatted(anaId, brunoId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.categoria").value("ACERTO"));
		mvc.perform(get("/api/trips/{t}/expenses/summary", tripId).cookie(ana))
				.andExpect(jsonPath("$.totalGastoCentavos").value(16100))
				.andExpect(jsonPath("$.acertos", hasSize(0)));

		mvc.perform(get("/api/trips/{t}/expenses", tripId).cookie(ana)).andExpect(jsonPath("$", hasSize(3)));
	}

	@Test
	void validaDivisaoEParticipantes() throws Exception {
		mvc.perform(post("/api/trips/{t}/expenses", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content(expense("Táxi", 5000, "BRL", "null", anaId,
						"\"modoDivisao\":\"VALORES\",\"valores\":{\"%d\":1000}".formatted(anaId))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.valores").exists());

		Cookie carla = TestUsers.register(mvc, "Carla");
		long carlaId = id(mvc.perform(get("/api/me").cookie(carla)).andReturn().getResponse().getContentAsString());
		mvc.perform(post("/api/trips/{t}/expenses", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content(expense("Táxi", 5000, "BRL", "null", carlaId,
						"\"modoDivisao\":\"IGUAL\",\"participantes\":[%d]".formatted(anaId))))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.pagoPor").exists());

		mvc.perform(get("/api/trips/{t}/expenses", tripId).cookie(carla)).andExpect(status().isNotFound());
	}

	@Test
	void naoPermiteTrocarMoedaComDespesas() throws Exception {
		mvc.perform(post("/api/trips/{t}/expenses", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content(expense("Café", 1000, "BRL", "null", anaId,
						"\"modoDivisao\":\"IGUAL\",\"participantes\":[%d]".formatted(anaId))))
				.andExpect(status().isCreated());

		mvc.perform(put("/api/trips/{t}", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"titulo":"Paris","destino":"Paris","dataInicio":"2027-06-01","dataFim":"2027-06-05","moeda":"EUR"}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.moeda").exists());
	}
}
