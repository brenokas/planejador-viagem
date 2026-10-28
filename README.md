# Planejador de Viagem

App web para planejar viagens a dois: roteiro, orçamento compartilhado, checklist e sugestões com IA.
Roda localmente e é acessado pelos celulares na mesma rede Wi-Fi.

Plano completo: [PLANO.md](PLANO.md).

| Parte | Tecnologia |
|---|---|
| `frontend/` | React + TypeScript + Vite + Tailwind + TanStack Query |
| `backend/` | Java 21 + Spring Boot 4 + Maven + PostgreSQL + Flyway |
| Infra | Docker Compose (`db`, `backend`, `web` com nginx na porta 8088) |

## Pré-requisitos

- Docker com permissão para seu usuário (uma vez só):
  ```bash
  sudo usermod -aG docker $USER   # depois saia e entre na sessão de novo
  ```
- Para desenvolver: Java 21 e Node 24.

## Rodar em "produção" (rede local)

```bash
cp .env.example .env        # preencha DB_PASSWORD e JWT_SECRET
docker compose up -d --build
```

Acesse em `http://localhost:8088` (no PC) ou `http://<IP-do-PC>:8088` (no celular).

> A porta 80 fica livre para o Apache do sistema. Para mudar, ajuste `WEB_PORT` no `.env`.

### Deixar acessível para os celulares

1. **Descobrir o IP do PC:** `hostname -I` (ex.: `192.168.0.50`).
2. **IP fixo:** no painel do roteador, faça uma *reserva de DHCP* para o PC, assim o endereço não muda.
3. **Firewall:** `sudo ufw allow 8088/tcp` (se o ufw estiver ativo).
4. **Subir com o PC:** `sudo systemctl enable docker` — os containers usam `restart: unless-stopped`.
5. **Atalho na tela inicial:**
   - Android (Chrome): menu ⋮ → *Adicionar à tela inicial*.
   - iPhone (Safari): Compartilhar → *Adicionar à Tela de Início*.

> O acesso é por HTTP, então a senha trafega sem criptografia na rede local. Use apenas em uma rede
> de confiança e não reutilize senhas importantes. Não abra portas no roteador.

### Backup

```bash
./scripts/backup.sh                     # gera backups/planejador-AAAA-MM-DD_HHMM.sql.gz
```

Restaurar:

```bash
gunzip -c backups/<arquivo>.sql.gz | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" planejador'
```

Sugestão: agendar no `crontab -e` → `0 3 * * * /caminho/para/planejador-de-viagem/scripts/backup.sh`.

## Desenvolvimento

```bash
# 1. Banco (porta 5433)
docker compose -f docker-compose.dev.yml up -d

# 2. Backend (http://localhost:8080)
cd backend && ./mvnw spring-boot:run

# 3. Frontend (http://localhost:5173, faz proxy de /api para o backend)
cd frontend && npm install && npm run dev
```

O Vite também escuta na rede (`http://<IP-do-PC>:5173`) para testar no celular.

### Testes

```bash
cd backend && ./mvnw test      # usa Testcontainers (precisa do Docker)
cd frontend && npm run build && npm run lint
```

## API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | `{nome, email, senha}` → cria conta e define o cookie |
| POST | `/api/auth/login` | `{email, senha}` → define o cookie |
| POST | `/api/auth/logout` | limpa o cookie |
| GET | `/api/me` | usuário logado |
| GET | `/api/trips?arquivadas=false` | viagens das quais participo |
| POST | `/api/trips` | cria viagem (quem cria vira `DONO`) |
| GET / PUT | `/api/trips/{id}` | detalhes / edita (envie `version` para detectar conflito → 409) |
| PATCH | `/api/trips/{id}/archive` | `{arquivada}` |
| DELETE | `/api/trips/{id}` | exclui (só o dono) |
| DELETE | `/api/trips/{id}/members/{userId}` | dono remove alguém, ou o próprio usuário sai |
| POST | `/api/trips/{id}/invites` | gera link de convite (7 dias, uso único) |
| GET | `/api/invites/{token}` | prévia do convite |
| POST | `/api/invites/{token}/accept` | entra na viagem como `EDITOR` |
| GET | `/api/trips/{id}/activities` | roteiro (ordenado por dia e posição) |
| POST | `/api/trips/{id}/activities` | cria atividade (`data` nula = Ideias); entra na posição pelo horário |
| PUT / DELETE | `/api/trips/{id}/activities/{aid}` | edita / exclui |
| PUT | `/api/trips/{id}/activities/order` | `{data, ids}` — nova ordem de um dia |
| GET | `/api/geo/search?q=` | busca de locais (OpenStreetMap/Nominatim, com cache e limite de 1 req/s) |

Quem não participa de uma viagem recebe 404 em qualquer rota dela.

A autenticação usa um JWT em cookie `httpOnly` (`token`), válido por 30 dias.
