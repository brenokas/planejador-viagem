# DESIGN.md — Planejador de Viagem

> Brief de design vivo. Ordem de leitura: tokens no código (`frontend/src/index.css`) → este arquivo → defaults da skill antiwebslop.

## 1. Product truth
- **Usuários:** um casal planejando viagens juntos, quase sempre pelo celular (PWA na rede local), às vezes no notebook.
- **Propósito:** roteiro dia a dia, contas divididas, mala/tarefas e um assistente de IA, compartilhados em tempo real.
- **Restrições:** roda em HTTP na rede local (sem APIs de contexto seguro); interface em português; nada de fontes de CDN (tudo empacotado).
- **Sucesso:** abrir o app e saber em 2 segundos qual é a próxima viagem e quanto falta; achar roteiro/orçamento/checklist em um toque.
- **Conteúdo real:** capas informadas pelo usuário; sem capa, a cor sólida por viagem com o nome do destino.

## 2. Design Read e superfícies
Reading this as: app de planejamento de viagem para um casal, superfície operate, linguagem de **postal vintage** (papel creme, tinta sépia, azul-correio e vermelho-tomate, carimbos e selos), em React + Tailwind 4.

| Superfície | Tipo | V | M | D |
|---|---|---|---|---|
| Lista de viagens / detalhe | operate | 6 | 2 | 5 |
| Roteiro, orçamento, checklist, assistente | operate | 4 | 2 | 6 |
| Login, cadastro, convite | operate | 6 | 1 | 3 |

## 3. Direção visual e proibições
- Papel creme com grão sutil, cartões em creme mais claro, tinta sépia quase preta. Nada de cinza azulado nem branco puro.
- O destino é o herói: capa como frente de postal (cor de tinta antiga ou foto levemente sépia, fio interno, nome do lugar em serifa itálica).
- Motivos da marca, usados com parcimônia: **faixa de correio aéreo** (topo do cabeçalho, topo dos dialogs, moldura do login), **selo picotado** (cards da grade de viagens, convite), **carimbo postal** (próxima viagem, capa do resumo, login), **pautas** (verso do postal da próxima viagem).
- A próxima viagem é um postal inteiro (frente + verso com carimbo e contagem); as demais são selos em grade.
- Proibido: ícone em “tile” colorido ao lado de título de seção, glass/blur, sombras difusas grandes, gradiente decorativo (só o escurecimento sobre fotos de capa).

## 4. Cores

```design-tokens
fonts: Fraunces Variable (SOFT), Courier Prime, system-ui
colors: #f3ead8, #ebe0c9, #ddcfb2, #c8b794, #9f8d6e, #6e604c, #574b3b, #42392d, #2c261f, #1e1a15, #fffaf0, #1e4b8f, #173a70, #d2492f, #a93a22, #e0a63a
radii: 6px, 8px, 12px, 9999px
```

A escala `slate-*` é **redefinida** em `index.css` como papel e tinta, e `white` vira o creme dos cartões (#fffaf0); use `slate-*`/`white` normalmente.

| Token | Valor | Uso |
|---|---|---|
| `slate-50` | #f3ead8 | papel: fundo, cabeçalho, barra inferior |
| `white` | #fffaf0 | cartões, inputs, dialogs; também o "branco" de texto sobre cor |
| `slate-900` | #1e1a15 | tinta: texto principal |
| `slate-500` | #6e604c | texto secundário (~4,9:1 no papel) |
| `slate-200` | #ddcfb2 | bordas e divisórias |
| `primary` | #1e4b8f | azul-correio: ações (botões, links, progresso) |
| `tomato` | #d2492f | cor da marca: faixa aérea, carimbos, FAB, contagem grande, item marcado |
| `tomato-ink` | #a93a22 | tomate para texto pequeno (rótulos, aba ativa) |
| `mustard` | #e0a63a | detalhe pontual (ícone de Ideias) |

Ações são azuis e a marca é tomate de propósito: o vermelho de erro/exclusão (#9f1d1d) não se confunde com o botão principal. Cores de categoria e dos dias no mapa são tintas antigas (azul, tomate, ocre, petróleo, ameixa, oliva). Os tiles do mapa recebem filtro sépia.

## 5. Tipografia
- Display: **Fraunces** variável com eixo SOFT (`@fontsource-variable/fraunces/soft.css`) em `h1`–`h3`, wordmark, nome do destino (itálico) e números de destaque. Por quê: serifa de cartaz antigo, calorosa.
- Rótulos: **Courier Prime** via utilitário `label-mono` (caixa alta, espaçado) em datas, contagens, eyebrows e legendas curtas — o "datilografado" do postal. Nunca em frases longas.
- Texto corrido: `system-ui`, para legibilidade no celular.
- `h1` de página 30–36px com eyebrow `label-mono` em tomate acima; contagem 60px itálica.

## 6. Espaçamento e layout e layout
- Escala do Tailwind (4px). Largura máxima 5xl.
- Mobile primeiro: barra inferior, folha que sobe sobre a capa no resumo da viagem.
- **Navegação dentro da viagem:** a barra inferior (celular) vira as abas da viagem — Resumo, Roteiro, Orçamento, Checklist, Assistente — e o topo mostra "‹ nome da viagem" para voltar à lista. No desktop as abas ficam numa segunda linha do cabeçalho. Trocar de parte é sempre um toque.
- Ação principal de criação (atividade, despesa) fica num botão flutuante acima da barra inferior no celular; no desktop, no cabeçalho da tela.
- Telas da viagem usam `PageHeader` (título + uma linha de contexto + ações), sem botão de voltar próprio.

## 7. Componentes
- Raios redefinidos (cantos de papel): `rounded-lg` 6px (controles), `rounded-xl` 8px (cards), `rounded-2xl` 12px (folhas), `rounded-full` para avatares, chips e FAB.
- Sombras "de papel sobre a mesa", duras e deslocadas: `shadow-card` (cards) e `shadow-lift` (hover, menu, dialog, FAB). Cards: `bg-white ring-1 ring-slate-200 shadow-card`.
- Botão principal azul com sombra dura que some ao pressionar; FAB tomate com anel creme.
- Utilitários em `index.css`: `airmail`, `stamp`, `ruled`, `label-mono`; componente `Postmark` em `components/ui/postmark.tsx`.
- Resumo da viagem: cards por parte com o número que importa e uma barra de progresso (dias planejados, orçamento usado, itens prontos). Durante a viagem, um card "Hoje" no topo.
- Confirmações usam `useConfirm()` (folha do app), nunca `window.confirm`. Ação destrutiva: botão vermelho com o verbo ("Excluir viagem").
- Carregamento: esqueletos (`Skeleton`/`PageSkeleton`), não texto "Carregando…".
- Roteiro: faixa fixa de dias (`DayJumper`) para pular até um dia; dia vazio vira uma linha só com "Adicionar" e IA; durante a viagem a tela abre no dia de hoje.

## 8. Movimento
Transições de cor/transform ≤150ms em hover (selos giram 1° no hover); folhas entram com deslize curto (200ms). `prefers-reduced-motion` zera transições e animações.

## 9. Imagem e conteúdo
- Capa: foto do usuário (com leve sépia e escurecimento embaixo) ou tinta sólida da paleta, sempre com o nome do destino.
- Voz: direta, no plural (“vocês”), sem exclamação.

## 10. Faça / Não faça
| Faça | Não faça |
|---|---|
| `bg-white ring-1 ring-slate-200 shadow-card rounded-xl` para containers | `shadow-lg`/sombras difusas em card de conteúdo |
| Ação em `primary` (azul); marca e destaques em `tomato` | Botão principal vermelho (confunde com excluir) |
| `tomato-ink` para texto pequeno em tomate | `tomato` em texto abaixo de 18px (4,1:1) |
| `label-mono` em datas e rótulos curtos | Frases longas em Courier caixa alta |
| Faixa aérea, selo e carimbo como tempero, um ou dois por tela | Carimbo sobre texto ou sobre ação |

## 11. Decision log
- **2026-10-28 · Redesenho visual (operate).** Paleta fria do Tailwind trocada por neutros quentes; acento #0d9488 → #0f6b63 porque o anterior reprovava AA com texto branco; fonte display Bricolage Grotesque; sombras removidas dos cards; próxima viagem em destaque; seções do detalhe viraram lista sem ícones; login sem tile de ícone. Ícones PNG do PWA ainda usam o verde antigo (TODO: regenerar a partir do `favicon.svg`).
- **2026-10-29 · Revisão de UX (navegação e fluxo).** Barra inferior contextual com as abas da viagem (antes: Viagens/Perfil, nenhuma ativa dentro da viagem, e trocar de parte exigia voltar); "Sair" saiu do cabeçalho (fica no Perfil) e virou avatar → Perfil; FAB para criar atividade/despesa no alcance do polegar; resumo da viagem com cards de progresso e card "Hoje"; roteiro com faixa de dias, dias vazios compactos e abertura no dia atual; confirmações no estilo do app; esqueletos de carregamento; dialogs com rolagem interna (formulários longos cabiam mal no celular) e Esc fechando só o de cima.

## 12. Referências
- Tokens: `frontend/src/index.css`.
- **2026-10-29 · Nova identidade: postal vintage.** Troca do "caderno de viagem" (verde-petróleo, Bricolage) por papel creme, azul-correio para ações e vermelho-tomate como marca; Fraunces SOFT nos títulos e Courier Prime nos rótulos; faixa de correio aéreo, selos picotados para viagens, postal com carimbo para a próxima viagem, login como envelope aéreo; sombras duras de papel; mapa em sépia; categorias em tintas antigas; ícones do PWA regenerados (selo tomate com alfinete creme).
