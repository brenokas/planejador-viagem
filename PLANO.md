# Plano: Planejador de Viagem

Aplicação web (responsiva, usada no celular via atalho na tela inicial) para planejar viagens a dois:
roteiro, orçamento compartilhado, checklist e sugestões com IA. Uso pessoal, hospedagem local,
acesso apenas pela rede Wi-Fi de casa.

## Decisões

| Item | Escolha |
|---|---|
| Frontend | React + TypeScript + Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, dnd-kit, Leaflet (OSM), Recharts |
| Backend | Java 21 + Spring Boot 4 + Maven, Spring Web, Spring Data JPA, Spring Security (JWT em cookie httpOnly), Validation, Flyway |
| Banco | PostgreSQL 16 |
| IA | Google Gemini (plano gratuito), modelos Flash via Interactions API (REST direto, com fallback entre modelos) |
| Tempo real | SSE (Server-Sent Events) |
| Auth | Apenas e-mail e senha (BCrypt) |
| Hospedagem | Local, Docker Compose (`db`, `backend`, `web` = nginx, porta 8088 no host) |
| Acesso | Somente rede Wi-Fi local, via HTTP (sem PWA/service worker) |
| Idioma | Português |

## Arquitetura

```
Navegador / celular (Wi-Fi de casa)
      │  http://192.168.0.X
   [nginx :8088]── serve o build do React
      │            └─ /api/** → backend  (mesma origem: sem CORS)
 [Spring Boot :8080] ──► Gemini API
      │
 [PostgreSQL :5432]  (somente na rede interna do Docker; volume persistente)
```

- SSE pelo nginx exige `proxy_buffering off`.
- Cookie de auth: `httpOnly`, `SameSite=Lax`, sem `Secure` (configurável por propriedade).
- Atalho na tela inicial: `manifest.webmanifest` + meta tags `apple-touch-icon` / `apple-mobile-web-app-capable`.
- Aviso: em HTTP a senha trafega sem criptografia na rede local — não reutilizar senhas importantes.

## Escopo do MVP

| Módulo | Funcionalidades |
|---|---|
| Conta | Cadastro/login com e-mail e senha, perfil simples |
| Viagens | CRUD (destino, datas, moeda, orçamento, capa), arquivar |
| Colaboração | Convite por link, ambos editam, "criado/alterado por", atualização em tempo real |
| Roteiro | Dias gerados pelas datas, atividades (horário, local, categoria, custo, notas), arrastar e soltar |
| Orçamento | Despesas com "quem pagou" + divisão, saldo "quem deve quem", totais por categoria, câmbio |
| Checklist | Bagagem e tarefas, com responsável |
| Mapa | Atividades do dia no mapa (Leaflet + Nominatim) |
| IA | Gerar roteiro, sugerir atividades do dia, lista de bagagem, chat sobre a viagem — sempre com prévia antes de salvar |

Pós-MVP: offline, exportar PDF, clima integrado, upload de documentos.

## Modelo de dados

```
User          (id, nome, email, senhaHash, avatarUrl)
Trip          (id, titulo, destino, dataInicio, dataFim, moeda, orcamento, capaUrl, criadoPor, version)
TripMember    (tripId, userId, papel: DONO|EDITOR)
TripInvite    (id, tripId, token, expiraEm, usadoPor)

Activity      (id, tripId, data?, horaInicio, horaFim, local, lat, lng, categoria, custoCentavos, notas, ordem, criadoPor, atualizadoPor, version)
Expense       (id, tripId, descricao, categoria, valorCentavos, moeda, taxaCambio, valorConvertidoCentavos, data, pagoPor, modoDivisao)
ExpenseSplit  (expenseId, userId, valorCentavos, valorConvertidoCentavos)
ChecklistItem (id, tripId, texto, feito, tipo: BAGAGEM|TAREFA, responsavelId, prazo, feitoPor)
AiMessage     (id, tripId, userId?, role, conteudo, criadoEm)
```

## API REST (resumo)

```
POST /api/auth/register | /api/auth/login | /api/auth/logout     GET /api/me
GET/POST /api/trips          GET/PUT/DELETE /api/trips/{id}
POST /api/trips/{id}/invites   POST /api/invites/{token}/accept
CRUD /api/trips/{id}/days/{dayId}/activities   PATCH .../reorder
CRUD /api/trips/{id}/expenses   GET /api/trips/{id}/balance
CRUD /api/trips/{id}/checklist
GET  /api/trips/{id}/events   (SSE)
POST /api/trips/{id}/ai/itinerary | /ai/day-suggestions | /ai/packing-list | /ai/chat
```

Toda rota `/api/trips/{id}/**` verifica se o usuário é membro da viagem.

## Fases

1. ✅ **Fundação** — repositório, Docker Compose, autenticação ponta a ponta, layout mobile-first, nginx com proxy `/api`, manifest.
   *Pronto quando:* do celular, no Wi-Fi, abre `http://192.168.0.X:8088`, cria conta, faz login e adiciona à tela inicial.
2. ✅ **Viagens + convites** (controle de acesso por membro)
3. ✅ **Roteiro + mapa** — atividades guardam a data diretamente (sem tabela `Day`); data nula = "Ideias"; atividades fora do período da viagem ficam visíveis numa seção própria.
4. ✅ **Orçamento + divisão de despesas + câmbio** — câmbio pela open.er-api.com (cobre ARS/CLP/UYU, que a Frankfurter não tem), com taxa editável; acertos registrados como despesas da categoria `ACERTO`; moeda da viagem fica travada após a primeira despesa.
5. ✅ **Checklist** — abas Bagagem e Tarefas, responsável e prazo opcionais, lista básica para começar e inclusão em lote (que a IA usará na fase 6).
6. ✅ **IA com Gemini** — Interactions API chamada direto com `RestClient` (sem Spring AI, para não depender de uma biblioteca que talvez ainda não suporte a API nova e o Boot 4; não verificado); lista de modelos com fallback (o plano gratuito alterna entre sobrecarga e falta de cota); saída JSON validada, prévia com seleção e aceite; chat compartilhado com histórico.
7. **Tempo real (SSE)**
8. **Acabamento** — responsividade, testes, backup (`pg_dump`), README da rede local

## Pontos de atenção

- Gemini gratuito: limites de requisição (tratar 429); prompts podem ser usados pelo Google — não enviar dados sensíveis.
- Dinheiro sempre em centavos (`long`) com moeda explícita.
- Datas com `LocalDate`/`LocalTime` no fuso do destino.
- Conflitos: "última escrita vence" + `@Version` (lock otimista) + tempo real.
- Rede local: IP fixo via reserva DHCP no roteador, `ufw allow 8088/tcp`, `restart: unless-stopped`, Docker habilitado no boot.
- Postgres sem porta publicada para a rede.
