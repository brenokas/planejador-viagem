# DESIGN.md — Planejador de Viagem

> Brief de design vivo. Ordem de leitura: tokens no código (`frontend/src/index.css`) → este arquivo → defaults da skill antiwebslop.

## 1. Product truth
- **Usuários:** um casal planejando viagens juntos, quase sempre pelo celular (PWA na rede local), às vezes no notebook.
- **Propósito:** roteiro dia a dia, contas divididas, mala/tarefas e um assistente de IA, compartilhados em tempo real.
- **Restrições:** roda em HTTP na rede local (sem APIs de contexto seguro); interface em português; nada de fontes de CDN (tudo empacotado).
- **Sucesso:** abrir o app e saber em 2 segundos qual é a próxima viagem e quanto falta; achar roteiro/orçamento/checklist em um toque.
- **Conteúdo real:** capas informadas pelo usuário; sem capa, a cor sólida por viagem com o nome do destino.

## 2. Design Read e superfícies
Reading this as: app de planejamento de viagem para um casal, superfície operate, linguagem de “caderno de viagem” (papel quente, tinta escura, um verde-petróleo), em React + Tailwind 4.

| Superfície | Tipo | V | M | D |
|---|---|---|---|---|
| Lista de viagens / detalhe | operate | 4 | 2 | 5 |
| Roteiro, orçamento, checklist, assistente | operate | 3 | 2 | 6 |
| Login, cadastro, convite | operate | 3 | 1 | 3 |

## 3. Direção visual e proibições
- Fundo de papel quente, superfícies brancas, texto quase preto quente. Nada de cinza azulado.
- O destino é o herói: capa grande com o nome do lugar na fonte display.
- A próxima viagem ganha destaque (largura toda + contagem regressiva); as demais ficam em grade.
- Proibido: ícone em “tile” colorido em cima/ao lado de título de seção, sombra em card de conteúdo, glass/blur, gradiente.

## 4. Cores

```design-tokens
fonts: Bricolage Grotesque Variable, system-ui
colors: #f5f1ea, #ede8df, #e2dcd1, #cfc7ba, #a39a8d, #6b645a, #57514a, #423d37, #2e2a25, #1f1c18, #0f6b63, #0b554f, #ffffff
radii: 8px, 12px, 16px, 9999px
```

A escala `slate-*` do Tailwind é **redefinida** em `index.css` com neutros quentes; use `slate-*` normalmente.

| Token | Valor | Uso |
|---|---|---|
| `slate-50` | #f5f1ea | fundo da página, header e barra inferior |
| `white` | #ffffff | cards, inputs, listas |
| `slate-900` | #1f1c18 | texto principal |
| `slate-500` | #6b645a | texto secundário (5,2:1 no fundo) |
| `slate-200` | #e2dcd1 | bordas e divisórias |
| `primary` | #0f6b63 | ação principal, estado atual, contagem regressiva (6,4:1 com branco) |
| `primary-hover` | #0b554f | hover da ação principal |

Cores de categoria (roteiro/despesas) e dias no mapa são dados, não marca: continuam categóricas.

## 5. Tipografia
- Display: fonte Bricolage Grotesque (variável, `@fontsource-variable`), em todo `h1`/`h2`, wordmark, nome do destino na capa e números de destaque. Por quê: dá personalidade sem custar legibilidade.
- Texto: `system-ui`. Por quê: nativo no celular, zero peso extra.
- Escala usada: 12 / 14 / 16 / 20 / 24 / 30 / 48 px. `h1` de página 24–30px; contagem 48px.
- `h1`/`h2` recebem `text-balance` e `tracking-tight` na camada base; descrições usam `text-pretty`.

## 6. Espaçamento e layout
- Escala do Tailwind (4px). Largura máxima 5xl.
- Mobile primeiro: barra inferior, folha que sobe sobre a capa no resumo da viagem.
- **Navegação dentro da viagem:** a barra inferior (celular) vira as abas da viagem — Resumo, Roteiro, Orçamento, Checklist, Assistente — e o topo mostra "‹ nome da viagem" para voltar à lista. No desktop as abas ficam numa segunda linha do cabeçalho. Trocar de parte é sempre um toque.
- Ação principal de criação (atividade, despesa) fica num botão flutuante acima da barra inferior no celular; no desktop, no cabeçalho da tela.
- Telas da viagem usam `PageHeader` (título + uma linha de contexto + ações), sem botão de voltar próprio.

## 7. Componentes
- Raio por função: controles 8px (`rounded-lg`), containers 12px (`rounded-xl`), folhas/dialogs 16px, avatares e chips 9999px.
- Elevação só em menu, dialog, popover de busca, item sendo arrastado e botão flutuante (FAB). Cards usam `ring-1 ring-slate-200`, hover escurece o anel.
- Resumo da viagem: cards por parte com o número que importa e uma barra de progresso (dias planejados, orçamento usado, itens prontos). Durante a viagem, um card "Hoje" no topo.
- Confirmações usam `useConfirm()` (folha do app), nunca `window.confirm`. Ação destrutiva: botão vermelho com o verbo ("Excluir viagem").
- Carregamento: esqueletos (`Skeleton`/`PageSkeleton`), não texto "Carregando…".
- Roteiro: faixa fixa de dias (`DayJumper`) para pular até um dia; dia vazio vira uma linha só com "Adicionar" e IA; durante a viagem a tela abre no dia de hoje.

## 8. Movimento
Transições de cor/transform ≤150ms em hover; folhas entram com deslize curto (200ms). `prefers-reduced-motion` zera transições e animações.

## 9. Imagem e conteúdo
- Capa: foto do usuário ou cor sólida da paleta com o nome do destino.
- Voz: direta, no plural (“vocês”), sem exclamação.

## 10. Faça / Não faça
| Faça | Não faça |
|---|---|
| `bg-white ring-1 ring-slate-200 rounded-xl` para containers | `shadow-sm` em card de conteúdo |
| Texto branco só sobre `primary` ou cores 700+ | Branco sobre teal-600/#0d9488 (3,7:1, reprova AA) |
| Título de seção como texto | Ícone em tile colorido ao lado do título |

## 11. Decision log
- **2026-10-28 · Redesenho visual (operate).** Paleta fria do Tailwind trocada por neutros quentes; acento #0d9488 → #0f6b63 porque o anterior reprovava AA com texto branco; fonte display Bricolage Grotesque; sombras removidas dos cards; próxima viagem em destaque; seções do detalhe viraram lista sem ícones; login sem tile de ícone. Ícones PNG do PWA ainda usam o verde antigo (TODO: regenerar a partir do `favicon.svg`).
- **2026-10-29 · Revisão de UX (navegação e fluxo).** Barra inferior contextual com as abas da viagem (antes: Viagens/Perfil, nenhuma ativa dentro da viagem, e trocar de parte exigia voltar); "Sair" saiu do cabeçalho (fica no Perfil) e virou avatar → Perfil; FAB para criar atividade/despesa no alcance do polegar; resumo da viagem com cards de progresso e card "Hoje"; roteiro com faixa de dias, dias vazios compactos e abertura no dia atual; confirmações no estilo do app; esqueletos de carregamento; dialogs com rolagem interna (formulários longos cabiam mal no celular) e Esc fechando só o de cima.

## 12. Referências
- Tokens: `frontend/src/index.css`.
