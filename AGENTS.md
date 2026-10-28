# Instruções para agentes

Planejador de viagem para uso pessoal (casal), rodando localmente. Plano completo e fases: [PLANO.md](PLANO.md).

## Commits (obrigatório)

Sempre que concluir uma alteração ou uma fase de desenvolvimento, **faça commit e push** para
`origin` (`git@github.com:brenokas/planejador-viagem.git`), branch `main`, sem precisar pedir.

- Use **Conventional Commits em português**, com a descrição no imperativo e em minúsculas:
  `tipo(escopo): descrição curta`
  - Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `perf`, `build`, `chore`, `ci`.
  - Escopos usuais: `auth`, `viagens`, `convites`, `roteiro`, `mapa`, `orcamento`, `checklist`, `ia`,
    `tempo-real`, `infra`, `backend`, `frontend`.
  - Exemplos: `feat(roteiro): adiciona arrastar e soltar entre atividades`,
    `fix(convites): corrige expiração do link`, `docs: atualiza plano da fase 4`.
- Corpo opcional (em português) explicando o porquê e listando mudanças relevantes.
- Um commit por mudança lógica; numa fase grande, prefira alguns commits coesos a um único gigante.
- **Antes de commitar**, valide o que foi alterado:
  - backend: `cd backend && ./mvnw -q test`
  - frontend: `cd frontend && npm run build && npm run lint`
  - Não faça commit com testes, build ou lint quebrados.
- Nunca versione segredos: `.env` fica fora do git (use `.env.example`).
- Não reescreva histórico já enviado (`push --force`, `rebase` de commits publicados) sem pedido explícito.
- Ao terminar uma fase, marque-a como concluída (✅) no `PLANO.md`, atualize o `README.md` se a API
  ou o uso mudou, e copie o plano para `~/.opencode/plan/planejador-de-viagem.md`.

## Convenções do projeto

- Interface, mensagens de erro da API e commits em **português**.
- Backend: Java 21, Spring Boot 4, Maven, pacotes por funcionalidade (`auth`, `trip`, `itinerary`, `geo`…).
  Erros via `ApiException` → JSON `{mensagem, campos}`.
- Banco: migrações Flyway em `backend/src/main/resources/db/migration`. **Nunca edite uma migração já
  aplicada**; crie uma nova (`V{n}__descricao.sql`).
- Valores monetários sempre em centavos (`long`) com a moeda explícita.
- Toda rota `/api/trips/{id}/**` deve chamar `TripAccess.requireMember` (não membro recebe 404).
- Entidades editáveis por ambos usam `@Version`; o cliente envia `version` e recebe 409 em conflito.
- Frontend: React + TypeScript + Vite + Tailwind + TanStack Query; código em `src/features/<módulo>`.
  O app roda em HTTP na rede local — não dependa de APIs que exigem contexto seguro (Clipboard, Service Worker…)
  sem um fallback.
- Testes de integração do backend usam Testcontainers (requer Docker).

## Ambiente local

- Produção local: `docker compose up -d --build` → `http://<IP-do-PC>:8088` (a porta 80 é do Apache do sistema).
- Desenvolvimento: `docker compose -f docker-compose.dev.yml up -d` (Postgres na porta 5433, pois já existe
  um PostgreSQL do sistema na 5432).
- Ao testar contra o banco real, remova os dados de teste criados.
