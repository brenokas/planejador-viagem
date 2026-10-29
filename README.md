# Planejador de Viagem

App web para planejar viagens a dois: roteiro com mapa, orçamento compartilhado com divisão de despesas, checklist de
bagagem e tarefas, sugestões e assistente com IA e atualização em tempo real entre os dois celulares.

Roda no computador de casa e é acessado pelos celulares no mesmo Wi-Fi. Plano e decisões: [PLANO.md](PLANO.md).

| Parte | Tecnologia |
|---|---|
| `frontend/` | React 19 + TypeScript + Vite + Tailwind + TanStack Query + Leaflet |
| `backend/` | Java 21 + Spring Boot 4 + Maven + PostgreSQL 16 + Flyway |
| Infra | Docker Compose: `db`, `backend` e `web` (nginx, porta 8088) |
| Serviços externos | Google Gemini (IA), OpenStreetMap/Nominatim (locais e mapa), open.er-api.com (câmbio) |

## Funcionalidades

- **Contas e viagens:** cadastro por e-mail e senha, perfil, viagens com capa, datas, moeda e orçamento; arquivar e excluir.
- **Colaboração:** convite por link (7 dias, uso único, compartilhável pelo WhatsApp); quem criou pode remover
  participantes; edições simultâneas não se sobrescrevem (aviso de conflito).
- **Roteiro:** atividades por dia ou em "Ideias", ordenadas por horário e por arrastar e soltar; busca de locais;
  mapa com pontos numerados por dia e link "Como chegar".
- **Orçamento:** despesas em qualquer moeda com cotação do dia, divisão igual ou por valor, saldo de cada pessoa e
  acertos sugeridos.
- **Checklist:** bagagem e tarefas, com responsável e prazo.
- **IA:** montar roteiro, sugerir atividades para um dia, sugerir bagagem e tarefas e um assistente que conhece a
  viagem. Tudo passa por revisão antes de salvar.
- **Tempo real:** as telas de uma viagem atualizam sozinhas quando a outra pessoa muda algo, e mostram quem está online.

## Instalação (uma vez)

1. **Docker com permissão para seu usuário:**
   ```bash
   sudo usermod -aG docker $USER   # depois reinicie o computador
   sudo systemctl enable docker    # sobe o Docker junto com o computador
   ```
2. **Configuração:**
   ```bash
   cp .env.example .env
   ```
   Preencha `DB_PASSWORD`, `JWT_SECRET` (gere com `openssl rand -base64 48`) e `GEMINI_API_KEY`
   ([Google AI Studio](https://aistudio.google.com/apikey), plano gratuito).
3. **Subir:**
   ```bash
   docker compose up -d --build
   ```
4. **Backup diário às 03:00:**
   ```bash
   ./scripts/agendar-backup.sh            # para desfazer: ./scripts/agendar-backup.sh remover
   ```

### Acesso pelos celulares

1. **IP do computador:** `hostname -I` (ex.: `192.168.0.50`). O app fica em `http://192.168.0.50:8088`.
2. **IP fixo:** no painel do roteador, faça uma *reserva de DHCP* para o computador, assim o endereço não muda.
3. **Firewall:** `sudo ufw allow 8088/tcp` (se o ufw estiver ativo).
4. **Atalho na tela inicial:** no Android (Chrome), menu ⋮ → *Adicionar à tela inicial*; no iPhone (Safari),
   Compartilhar → *Adicionar à Tela de Início*.

> A porta 80 fica livre para o Apache do sistema; para mudar a porta, ajuste `WEB_PORT` no `.env`.
>
> O acesso é por HTTP: a senha trafega sem criptografia na rede local. Use só em uma rede de confiança, não reutilize
> senhas importantes e não abra portas no roteador.

## Operação

| Tarefa | Comando |
|---|---|
| Atualizar depois de mudanças no código | `docker compose up -d --build` |
| Ver logs | `docker compose logs -f backend` |
| Parar / iniciar | `docker compose stop` / `docker compose start` |
| Backup manual | `./scripts/backup.sh` → `backups/planejador-AAAA-MM-DD_HHMM.sql.gz` (guarda os 30 mais recentes) |
| Restaurar backup | `gunzip -c backups/<arquivo>.sql.gz \| docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" planejador'` |

Os backups ficam no próprio computador. Para se proteger de falha de disco, copie de vez em quando a pasta
`backups/` para outro lugar (pendrive, nuvem).

## Desenvolvimento

```bash
docker compose -f docker-compose.dev.yml up -d   # banco na porta 5433 (a 5432 é do PostgreSQL do sistema)
cd backend && ./mvnw spring-boot:run             # http://localhost:8080
cd frontend && npm install && npm run dev        # http://localhost:5173 (também na rede, para testar no celular)
```

### Testes

```bash
cd backend && ./mvnw test                               # integração com Testcontainers (precisa do Docker)
cd frontend && npm test && npm run build && npm run lint
```

Convenções de código e de commits (Conventional Commits em português): [AGENTS.md](AGENTS.md).

## Arquitetura

```
Celular / navegador ──HTTP──► nginx :8088 ──► build do React (cada tela carregada sob demanda)
                                   └─ /api ──► Spring Boot :8080 ──► PostgreSQL (rede interna do Docker)
                                                     ├─► Gemini (IA)
                                                     ├─► Nominatim (busca de locais)
                                                     └─► open.er-api.com (câmbio)
```

- **Autenticação:** JWT em cookie `httpOnly` (`token`, 30 dias). Sessão expirada leva de volta ao login.
- **Acesso:** toda rota `/api/trips/{id}/**` exige participar da viagem; quem não participa recebe 404.
- **Concorrência:** entidades editáveis têm `version`; o cliente envia a versão que viu e recebe 409 se outra pessoa
  alterou antes.
- **Dinheiro:** sempre em centavos, com a moeda explícita.

### Tempo real

`GET /api/trips/{id}/events` abre um stream SSE. Depois de qualquer alteração bem-sucedida numa viagem, quem está com
ela aberta recebe `{tipo, origem}` (`trip`, `activities`, `expenses`, `checklist` ou `chat`) e recarrega só aquela parte
pela API; o evento não carrega dados. O frontend envia `X-Client-Id` em toda requisição para ignorar os próprios
eventos. O evento `presenca` traz os ids de quem está com a viagem aberta.

### IA (Gemini)

- Usa a Interactions API com `store=false` e tenta os modelos de `GEMINI_MODELS` em ordem (padrão
  `gemini-3.5-flash-lite,gemini-3.8-flash,gemini-flash-latest`), pulando para o próximo em caso de sobrecarga (503),
  limite de cota (429) ou demora.
- As rotas de IA só sugerem: nada é salvo sem o usuário aceitar. A saída do modelo é validada (itens inválidos são
  descartados).
- No plano gratuito, o Google pode usar os prompts para melhorar os modelos. O contexto enviado tem só os primeiros
  nomes, o roteiro, o orçamento e o checklist; evite dados sensíveis (documentos, códigos de reserva) nas notas.

## API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | `{nome, email, senha}` → cria conta e define o cookie |
| POST | `/api/auth/login` | `{email, senha}` → define o cookie |
| POST | `/api/auth/logout` | limpa o cookie |
| GET / PUT | `/api/me` | usuário logado / `{nome}` |
| PUT | `/api/me/senha` | `{senhaAtual, novaSenha}` |
| GET | `/api/trips?arquivadas=false` | viagens das quais participo |
| POST | `/api/trips` | cria viagem (quem cria vira `DONO`) |
| GET / PUT | `/api/trips/{id}` | detalhes / edita (envie `version`; conflito → 409) |
| PATCH | `/api/trips/{id}/archive` | `{arquivada}` |
| DELETE | `/api/trips/{id}` | exclui (só o dono) |
| DELETE | `/api/trips/{id}/members/{userId}` | dono remove alguém, ou o próprio usuário sai |
| POST | `/api/trips/{id}/invites` | gera link de convite (7 dias, uso único) |
| GET | `/api/invites/{token}` | prévia do convite |
| POST | `/api/invites/{token}/accept` | entra na viagem como `EDITOR` |
| GET | `/api/trips/{id}/activities` | roteiro (ordenado por dia e posição) |
| POST | `/api/trips/{id}/activities` | cria atividade (`data` nula = Ideias); entra na posição pelo horário |
| POST | `/api/trips/{id}/activities/bulk` | `{itens[]}`: várias de uma vez (aceitar sugestões) |
| PUT / DELETE | `/api/trips/{id}/activities/{aid}` | edita / exclui |
| PUT | `/api/trips/{id}/activities/order` | `{data, ids}`: nova ordem de um dia |
| GET | `/api/geo/search?q=` | busca de locais (Nominatim, com cache e limite de 1 req/s) |
| GET | `/api/trips/{id}/expenses` | despesas (mais recentes primeiro) |
| POST | `/api/trips/{id}/expenses` | lança despesa; `modoDivisao` `IGUAL` (`participantes`) ou `VALORES` (`valores`); sem `taxaCambio`, usa a cotação do dia |
| PUT / DELETE | `/api/trips/{id}/expenses/{eid}` | edita / exclui |
| GET | `/api/trips/{id}/expenses/summary` | total gasto, previsto no roteiro, por categoria, saldos e acertos sugeridos |
| POST | `/api/trips/{id}/expenses/settle` | `{de, para, valorCentavos}`: registra um acerto |
| GET | `/api/exchange?de=EUR&para=BRL` | cotação (cache de 6 h) |
| GET | `/api/trips/{id}/checklist` | itens de bagagem e tarefas |
| POST | `/api/trips/{id}/checklist` | `{tipo, texto, responsavelId?, prazo?}` |
| POST | `/api/trips/{id}/checklist/bulk` | `{tipo, textos[]}`: vários de uma vez, ignorando repetidos |
| PUT / DELETE | `/api/trips/{id}/checklist/{iid}` | edita / exclui |
| PATCH | `/api/trips/{id}/checklist/{iid}/done` | `{feito}` |
| POST | `/api/trips/{id}/ai/itinerary` | `{ritmo, interesses[], observacoes}` → atividades sugeridas (até 14 dias) |
| POST | `/api/trips/{id}/ai/day-suggestions` | `{data, pedido}` → sugestões para um dia (`data` nula = Ideias) |
| POST | `/api/trips/{id}/ai/packing-list` | → `{bagagem[], tarefas[]}` sem repetir o checklist |
| GET / POST / DELETE | `/api/trips/{id}/ai/chat` | histórico / nova pergunta `{mensagem}` / limpar |
| GET | `/api/trips/{id}/events` | stream SSE de mudanças e presença |
