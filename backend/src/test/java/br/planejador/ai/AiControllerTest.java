package br.planejador.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

import br.planejador.TestUsers;
import br.planejador.TestcontainersConfiguration;
import br.planejador.common.ApiException;
import jakarta.servlet.http.Cookie;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class AiControllerTest {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	GeminiClient gemini;

	Cookie ana;
	long tripId;

	@BeforeEach
	void setUp() throws Exception {
		ana = TestUsers.register(mvc, "Ana Souza");
		tripId = ((Number) JsonPath.read(mvc.perform(post("/api/trips").cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"titulo":"Lisboa","destino":"Lisboa, Portugal","dataInicio":"2027-05-10","dataFim":"2027-05-12","moeda":"EUR"}
						"""))
				.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
		mvc.perform(post("/api/trips/{t}/activities", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"titulo\":\"Torre de Belém\",\"data\":\"2027-05-10\",\"categoria\":\"PASSEIO\"}"))
				.andExpect(status().isCreated());
	}

	@Test
	void roteiroValidaASaidaDaIaEUsaOContexto() throws Exception {
		when(gemini.generateJson(anyString(), anyString(), any())).thenReturn("""
				{"atividades":[
				  {"dia":1,"titulo":"Pastéis de Belém","horaInicio":"9:30","categoria":"REFEICAO","localNome":"Pastéis de Belém",
				   "lat":38.6975,"lng":-9.2033,"custoEstimado":8.5,"notas":"Chegue cedo"},
				  {"dia":2,"titulo":"Alfama","horaInicio":"25:00","horaFim":"12:00","categoria":"INVALIDA","lat":0,"lng":0},
				  {"dia":9,"titulo":"Fora da viagem","categoria":"PASSEIO"},
				  {"dia":3,"titulo":"  ","categoria":"PASSEIO"}
				]}
				""");

		mvc.perform(post("/api/trips/{t}/ai/itinerary", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"ritmo\":\"TRANQUILO\",\"interesses\":[\"gastronomia\"]}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.atividades", hasSize(2)))
				.andExpect(jsonPath("$.atividades[0].data").value("2027-05-10"))
				.andExpect(jsonPath("$.atividades[0].horaInicio").value("09:30:00"))
				.andExpect(jsonPath("$.atividades[0].custoCentavos").value(850))
				.andExpect(jsonPath("$.atividades[1].data").value("2027-05-11"))
				.andExpect(jsonPath("$.atividades[1].categoria").value("OUTRO"))
				.andExpect(jsonPath("$.atividades[1].horaInicio").doesNotExist())
				.andExpect(jsonPath("$.atividades[1].lat").doesNotExist());

		ArgumentCaptor<String> prompt = ArgumentCaptor.forClass(String.class);
		verify(gemini).generateJson(anyString(), prompt.capture(), any());
		assertThat(prompt.getValue())
				.contains("Lisboa, Portugal", "Torre de Belém", "Viajantes: Ana", "tranquilo", "gastronomia")
				.doesNotContain("@teste.com");
	}

	@Test
	void sugestoesAceitasViramAtividades() throws Exception {
		mvc.perform(post("/api/trips/{t}/activities/bulk", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"itens":[
						  {"titulo":"Jantar","data":"2027-05-10","horaInicio":"20:00","categoria":"REFEICAO"},
						  {"titulo":"Sintra","data":null,"categoria":"PASSEIO","lat":38.79,"lng":-9.39}
						]}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$", hasSize(2)));
		mvc.perform(get("/api/trips/{t}/activities", tripId).cookie(ana))
				.andExpect(jsonPath("$[*].titulo").value(contains("Torre de Belém", "Jantar", "Sintra")));
	}

	@Test
	void listaDeBagagemRemoveOQueJaExiste() throws Exception {
		mvc.perform(post("/api/trips/{t}/checklist", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"tipo\":\"BAGAGEM\",\"texto\":\"Guarda-chuva\"}"))
				.andExpect(status().isCreated());
		when(gemini.generateJson(anyString(), anyString(), any())).thenReturn("""
				{"bagagem":["guarda-chuva","Tênis confortável","Tênis confortável"],"tarefas":["Comprar chip eSIM"]}
				""");

		mvc.perform(post("/api/trips/{t}/ai/packing-list", tripId).cookie(ana))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.bagagem").value(contains("Tênis confortável")))
				.andExpect(jsonPath("$.tarefas").value(contains("Comprar chip eSIM")));
	}

	@Test
	void chatGuardaHistoricoELimpa() throws Exception {
		when(gemini.generateText(anyString(), anyString())).thenReturn("Use o elétrico 28.");

		mvc.perform(post("/api/trips/{t}/ai/chat", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"mensagem\":\"Como chego em Alfama?\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[0].role").value("user"))
				.andExpect(jsonPath("$[0].autorNome").value("Ana Souza"))
				.andExpect(jsonPath("$[1].conteudo").value("Use o elétrico 28."));

		mvc.perform(get("/api/trips/{t}/ai/chat", tripId).cookie(ana)).andExpect(jsonPath("$", hasSize(2)));
		mvc.perform(delete("/api/trips/{t}/ai/chat", tripId).cookie(ana)).andExpect(status().isNoContent());
		mvc.perform(get("/api/trips/{t}/ai/chat", tripId).cookie(ana)).andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void erroDaIaNaoSalvaAPergunta() throws Exception {
		when(gemini.generateText(anyString(), anyString())).thenThrow(
				new ApiException(HttpStatus.TOO_MANY_REQUESTS, "O limite gratuito da IA foi atingido."));

		mvc.perform(post("/api/trips/{t}/ai/chat", tripId).cookie(ana).contentType(MediaType.APPLICATION_JSON)
				.content("{\"mensagem\":\"Oi\"}"))
				.andExpect(status().isTooManyRequests())
				.andExpect(jsonPath("$.mensagem").value("O limite gratuito da IA foi atingido."));
		mvc.perform(get("/api/trips/{t}/ai/chat", tripId).cookie(ana)).andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void naoMembroNaoUsaAIa() throws Exception {
		Cookie bruno = TestUsers.register(mvc, "Bruno");
		mvc.perform(post("/api/trips/{t}/ai/packing-list", tripId).cookie(bruno)).andExpect(status().isNotFound());
		mvc.perform(get("/api/trips/{t}/ai/chat", tripId).cookie(bruno)).andExpect(status().isNotFound());
	}
}
