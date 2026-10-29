package br.planejador.realtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.jayway.jsonpath.JsonPath;

import br.planejador.TestUsers;
import br.planejador.TestcontainersConfiguration;
import jakarta.servlet.http.Cookie;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class RealtimeTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	TripEventHub hub;

	@Test
	void mapeiaRotasParaOTipoDeMudanca() {
		assertThat(TripChangeInterceptor.tipo(null, null)).isEqualTo("trip");
		assertThat(TripChangeInterceptor.tipo("archive", null)).isEqualTo("trip");
		assertThat(TripChangeInterceptor.tipo("members", null)).isEqualTo("trip");
		assertThat(TripChangeInterceptor.tipo("activities", "bulk")).isEqualTo("activities");
		assertThat(TripChangeInterceptor.tipo("expenses", "settle")).isEqualTo("expenses");
		assertThat(TripChangeInterceptor.tipo("checklist", null)).isEqualTo("checklist");
		assertThat(TripChangeInterceptor.tipo("ai", "chat")).isEqualTo("chat");
		assertThat(TripChangeInterceptor.tipo("ai", "itinerary")).isNull();
		assertThat(TripChangeInterceptor.tipo("invites", null)).isNull();
	}

	@Test
	void avisaQuemEstaComAViagemAberta() throws Exception {
		Cookie ana = TestUsers.register(mvc, "Ana");
		Cookie bruno = TestUsers.register(mvc, "Bruno");
		long tripId = ((Number) JsonPath.read(mvc.perform(post("/api/trips").cookie(ana)
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"titulo":"Rio","destino":"Rio de Janeiro","dataInicio":"2027-02-01","dataFim":"2027-02-03","moeda":"BRL"}
						"""))
				.andReturn().getResponse().getContentAsString(), "$.id")).longValue();

		// Quem não participa não consegue assinar.
		mvc.perform(get("/api/trips/{t}/events", tripId).cookie(bruno)).andExpect(status().isNotFound());

		MvcResult stream = mvc.perform(get("/api/trips/{t}/events", tripId).cookie(ana))
				.andExpect(request().asyncStarted())
				.andReturn();
		assertThat(hub.online(tripId)).hasSize(1);

		// Leitura (GET) não gera evento; alteração gera, com a origem informada pela aba.
		mvc.perform(get("/api/trips/{t}/activities", tripId).cookie(ana)).andExpect(status().isOk());
		mvc.perform(post("/api/trips/{t}/activities", tripId).cookie(ana).header("X-Client-Id", "aba-123")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"titulo\":\"Cristo Redentor\",\"data\":null,\"categoria\":\"PASSEIO\"}"))
				.andExpect(status().isCreated());
		// Requisição com erro também não gera evento.
		mvc.perform(post("/api/trips/{t}/checklist", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"BAGAGEM\",\"texto\":\"\"}"))
				.andExpect(status().isBadRequest());

		String recebido = stream.getResponse().getContentAsString();
		assertThat(recebido)
				.contains("\"tipo\":\"presenca\"")
				.contains("\"tipo\":\"activities\",\"origem\":\"aba-123\"")
				.doesNotContain("\"tipo\":\"checklist\"")
				.doesNotContain("Cristo Redentor");
	}
}
