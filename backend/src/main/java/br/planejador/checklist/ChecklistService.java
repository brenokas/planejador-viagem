package br.planejador.checklist;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.planejador.checklist.ChecklistDtos.BulkRequest;
import br.planejador.checklist.ChecklistDtos.ItemRequest;
import br.planejador.checklist.ChecklistDtos.ItemResponse;
import br.planejador.common.ApiException;
import br.planejador.common.GlobalExceptionHandler;
import br.planejador.trip.TripAccess;
import br.planejador.trip.TripMemberRepository;
import br.planejador.user.User;
import br.planejador.user.UserRepository;

@Service
public class ChecklistService {

	private final ChecklistItemRepository items;
	private final TripMemberRepository members;
	private final UserRepository users;
	private final TripAccess access;

	public ChecklistService(ChecklistItemRepository items, TripMemberRepository members, UserRepository users,
			TripAccess access) {
		this.items = items;
		this.members = members;
		this.users = users;
		this.access = access;
	}

	@Transactional(readOnly = true)
	public List<ItemResponse> list(Long tripId, Long userId) {
		access.requireMember(tripId, userId);
		return toResponses(items.findByTripIdOrderByCriadoEmAscIdAsc(tripId));
	}

	@Transactional
	public ItemResponse create(Long tripId, Long userId, ItemRequest req) {
		access.requireMember(tripId, userId);
		validateResponsavel(tripId, req.responsavelId(), null);
		ChecklistItem item = new ChecklistItem(tripId, req.tipo(), req.texto().trim(), userId);
		item.update(req.tipo(), req.texto().trim(), req.responsavelId(), req.prazo());
		items.saveAndFlush(item);
		return toResponses(List.of(item)).getFirst();
	}

	/** Adiciona vários itens de uma vez (lista sugerida, sugestões da IA). Ignora textos repetidos. */
	@Transactional
	public List<ItemResponse> createMany(Long tripId, Long userId, BulkRequest req) {
		access.requireMember(tripId, userId);
		var existentes = items.findByTripIdOrderByCriadoEmAscIdAsc(tripId).stream()
				.filter(i -> i.getTipo() == req.tipo())
				.map(i -> normalize(i.getTexto()))
				.collect(Collectors.toSet());
		List<ChecklistItem> novos = req.textos().stream()
				.map(String::trim)
				.filter(t -> existentes.add(normalize(t)))
				.map(t -> new ChecklistItem(tripId, req.tipo(), t, userId))
				.toList();
		items.saveAllAndFlush(novos);
		return toResponses(novos);
	}

	@Transactional
	public ItemResponse update(Long tripId, Long itemId, Long userId, ItemRequest req) {
		access.requireMember(tripId, userId);
		ChecklistItem item = load(tripId, itemId);
		if (req.version() != null && req.version() != item.getVersion()) {
			throw new ApiException(HttpStatus.CONFLICT, GlobalExceptionHandler.CONFLITO);
		}
		validateResponsavel(tripId, req.responsavelId(), item.getResponsavelId());
		item.update(req.tipo(), req.texto().trim(), req.responsavelId(), req.prazo());
		items.saveAndFlush(item);
		return toResponses(List.of(item)).getFirst();
	}

	/** Marcar/desmarcar não verifica versão: o resultado é o mesmo, não importa quem clicou primeiro. */
	@Transactional
	public ItemResponse setDone(Long tripId, Long itemId, Long userId, boolean feito) {
		access.requireMember(tripId, userId);
		ChecklistItem item = load(tripId, itemId);
		item.setFeito(feito, userId);
		items.saveAndFlush(item);
		return toResponses(List.of(item)).getFirst();
	}

	@Transactional
	public void delete(Long tripId, Long itemId, Long userId) {
		access.requireMember(tripId, userId);
		items.delete(load(tripId, itemId));
	}

	private void validateResponsavel(Long tripId, Long responsavelId, Long atual) {
		if (responsavelId != null && !responsavelId.equals(atual)
				&& !members.existsByTripIdAndUserId(tripId, responsavelId)) {
			throw ApiException.invalidField("responsavelId", "O responsável precisa participar da viagem.");
		}
	}

	private ChecklistItem load(Long tripId, Long itemId) {
		return items.findByIdAndTripId(itemId, tripId)
				.orElseThrow(() -> ApiException.notFound("Item não encontrado."));
	}

	private static String normalize(String texto) {
		return texto.trim().toLowerCase(Locale.ROOT);
	}

	private List<ItemResponse> toResponses(List<ChecklistItem> lista) {
		Map<Long, String> nomes = users
				.findAllById(lista.stream().map(ChecklistItem::getFeitoPor).filter(Objects::nonNull).distinct().toList())
				.stream()
				.collect(Collectors.toMap(User::getId, User::getNome));
		return lista.stream()
				.map(i -> new ItemResponse(i.getId(), i.getTipo(), i.getTexto(), i.isFeito(), i.getResponsavelId(),
						i.getPrazo(), nomes.get(i.getFeitoPor()), i.getVersion()))
				.toList();
	}
}
