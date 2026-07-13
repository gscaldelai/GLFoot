# GLfoot — Relatório de QA
**Versão testada:** Modo Carreira v0.x  
**Data:** 2026-06-12 · atualizado 2026-07-13  
**Testador:** GustãoFC (usuário real) + revisão adversarial automatizada (12/07)  
**Sessão de teste:** 3+ partidas simuladas (SPFC × Corinthians, outros)  
**Total de itens:** 14 originais (todos resolvidos) + backlog R-xx da revisão de 12/07  
**Status:** ✅ 22 resolvidos · 🔍 11 achados a triar (seção "Revisão adversarial 12/07")

---

## Legenda

| Severidade | Significado |
|------------|-------------|
| 🔴 Crítico | Quebra funcionalidade principal ou mostra dado errado |
| 🟠 Alto | Impacta a experiência de forma significativa |
| 🟡 Médio | Comportamento incorreto, mas contornável |
| 🟢 Baixo | Melhoria visual ou de usabilidade |

| Status | |
|--------|--|
| 🔲 Aberto | Não corrigido |
| ✅ Resolvido | Corrigido e verificado |
| ⏸️ Suspenso | Aguardando decisão de design |

---

## Bugs

| ID | Severidade | Status | Descrição | Como Reproduzir | Componente Suspeito |
|----|-----------|--------|-----------|-----------------|---------------------|
| B-01 | 🔴 Crítico | ✅ Resolvido | **Goleiro marca gol** — Rafael (GK) aparecia como autor de gol em múltiplas partidas. | `pickScorer()` filtrava apenas `!p.injured`, adicionado filtro `p.pos !== 'GK'`. | `matchEngine.ts → pickScorer()` |
| B-02 | 🔴 Crítico | ✅ Resolvido | **Card final vermelho em vitória** — após vitória, o card exibia cor vermelha (gradiente `#8b0000 → #cc0000`). | Corrigido para gradiente verde escuro `#0a1f14 → #0f2d1a`. | `VictoryOverlay.tsx` |
| B-03 | 🔴 Crítico | ✅ Resolvido | **Menu Tabelas sem dados** — tela de classificação exibia placeholder vazio pós 3 jogos. | Screen `tabelas` não estava mapeado; adicionado `StandingsScreen` no `ManagerHub`. | `ManagerHub.tsx` |
| B-04 | 🟠 Alto | ✅ Resolvido | **Inconsistência na barra de força dos atletas** — badge mostrava `forca` base enquanto o engine usava `effectiveForca` (com penalidade de fadiga). | Badge agora exibe `effectiveForca(player)` — valor real usado no Poisson. | `ManagerHub.tsx → PlayerRow` |
| B-05 | 🟡 Médio | ✅ Resolvido | **Times duplicados no Mercado de Transferências** — todos os 20 clubes apareciam duplicados (entrada manual + entrada de `CLUBS`). | `SERIE_A_BASIC` reescrito como `CLUBS.map(...)` sem entradas manuais. | `TransferMarket.tsx` |

---

## UX / Interface

| ID | Severidade | Status | Descrição | Comportamento Esperado |
|----|-----------|--------|-----------|------------------------|
| U-01 | 🟢 Baixo | ✅ Resolvido | **Linguagem de vantagem de formação** — seção de formação exibia "Bate" e "Perde para" para indicar relações táticas. | Substituído por "▲ Forte contra" e "▼ Fraco contra". |
| U-02 | 🟢 Baixo | ✅ Resolvido | **Emoji do Mercado pouco representativo** — o ícone da seção Mercado de Transferências não remetia a transferências/negociação. | Trocado 🔁 por 💸 (sidebar e cabeçalho da seção). |
| U-03 | 🟡 Médio | ✅ Resolvido | **Card de vitória expõe dado interno** — o card final exibia "Força Casa" e "Força Fora" como valores numéricos, que são dados internos do engine. | Substituído pela lista de autores dos gols de cada time (nome + minuto). |
| U-04 | 🟡 Médio | ✅ Resolvido | **Velocidade do jogo não persiste entre rodadas** — ao iniciar nova rodada, o seletor de velocidade voltava para 1×, obrigando o usuário a reselecionar a cada partida. | `prepareMatch()` não reseta mais `speed` — a última velocidade escolhida é mantida. |
| U-05 | 🟡 Médio | ✅ Resolvido | **Card de partida sem identificação do campeonato** — o card próximo ao placar mostrava os times, mas não qual competição/rodada pertence o jogo. | Badge "Brasileirão · Rodada N" exibido sob o relógio no Scoreboard. |
| U-06 | 🟠 Alto | ✅ Resolvido | **Sem pausa no intervalo do 1º tempo** — o jogo passava dos 45min direto para o 2º tempo sem oferecer ao usuário a possibilidade de fazer ajustes táticos ou substituições. | Aos 45min o jogo pausa automaticamente e exibe modal de intervalo com placar, substituições restantes, botão "Fazer ajustes" (mantém pausado para mexer no time) e "Iniciar 2º tempo". |

---

## Balanceamento / Game Design

| ID | Severidade | Status | Descrição | Observação |
|----|-----------|--------|-----------|------------|
| G-01 | 🟠 Alto | ✅ Resolvido | **4-4-2 é o sistema mais fraco** — a formação mais tradicional do futebol real aparecia perdendo para a maioria dos outros sistemas (1 vitória × 6 derrotas na matriz). | Matriz `FORMATION_MATCHUP_BONUS` rebalanceada: 4-4-2 agora é 3W/3L com counters canônicos (perde para 3-5-2, 3-4-3 e 3-2-4-1; vence 4-2-4, 4-3-2-1 e 2-3-2-3). Nenhuma formação ficou invicta; só o 4-2-4 mantém saldo negativo forte (alto risco por design). Validação automatizada: `scripts/test-formations.js`. |
| G-02 | 🟠 Alto | ✅ Resolvido | **Ausência de sistema de lesões** — nenhum jogador podia se lesionar durante partidas, removendo um elemento fundamental de gestão de elenco. | `injuryEngine.ts`: probabilidade por minuto de jogo ponderada por idade, fadiga e posição (GK se lesiona menos); duração 1–16 rodadas em 4 gravidades. Titular do jogador lesionado → jogo pausa e abre modal de substituição obrigatória (sem opções → segue com 10). Bots fazem auto-substituição. Recuperação decrementa a cada rodada; cura total na pré-temporada. Lesionado não pode ser escalado (botão JOGAR bloqueado + troca para campo bloqueada) e aparece com 🚑 em todas as telas de elenco. Calibração: ~6 lesões/clube/temporada (`scripts/test-injury.js`). |

---

## Features Faltantes

| ID | Severidade | Status | Descrição | Notas de Design |
|----|-----------|--------|-----------|-----------------|
| F-01 | 🟠 Alto | ✅ Resolvido | **Central de Empregos / Técnicos de IA** — clubes não controlados por humanos não possuíam técnico com nome, não faziam demissões nem contratações. O universo do modo carreira ficava estático. | `coachEngine.ts` + `useCoachStore`: 19 técnicos NPC nomeados (reputação 1–5★ por tier) + mercado livre. Demissão por desempenho (6+ posições abaixo do esperado por 5 rodadas, com proteção de 5 rodadas no cargo); contratação respeita reputação mínima por tier (S exige 4★+). Técnicos dão bônus de λ (±0.05, validado em `scripts/test-coach.js`). Jogador demitido (Premium) recebe até 3 propostas de clubes compatíveis com sua reputação (derivada do histórico) e continua a carreira no novo clube. Telas Técnicos e Central de Emprego implementadas; Free vê a Central bloqueada. ~3.7 demissões de bots/temporada. |

---

## Histórico de Resoluções

| ID | Data | Descrição da Correção | Commit |
|----|------|-----------------------|--------|
| B-01 | 2026-06-12 | `pickScorer()` filtrado por `pos !== 'GK'` | `979f2c0` |
| B-02 | 2026-06-12 | Gradiente de vitória corrigido para verde escuro | `979f2c0` |
| B-03 | 2026-06-12 | `StandingsScreen` adicionado ao `ManagerHub` | `979f2c0` |
| B-04 | 2026-06-12 | Badge de força usa `effectiveForca()` | `979f2c0` |
| B-05 | 2026-06-12 | `SERIE_A_BASIC` derivado de `CLUBS.map()` | `979f2c0` |
| U-01 | 2026-07-06 | Linguagem "▲ Forte contra / ▼ Fraco contra" no ManagerHub | `f11da61` |
| U-02 | 2026-07-06 | Emoji do Mercado 🔁 → 💸 | `f11da61` |
| U-03 | 2026-07-06 | VictoryOverlay exibe autores dos gols em vez de forças internas (`MatchEvent.scorer`) | `f11da61` |
| U-04 | 2026-07-06 | `prepareMatch()` preserva a velocidade escolhida | `f11da61` |
| U-05 | 2026-07-06 | Badge "Brasileirão · Rodada N" no Scoreboard | `f11da61` |
| U-06 | 2026-07-06 | Pausa automática aos 45min + `HalftimeOverlay` (ajustes / iniciar 2º tempo) | `f11da61` |
| G-01 | 2026-07-06 | Matriz de formações rebalanceada (4-4-2 3W/3L, sem formações invictas) + teste de mesa | `f11da61` |
| G-02 | 2026-07-06 | Sistema de lesões completo (`injuryEngine` + modal de sub obrigatória + persistência) | `f11da61` |
| F-01 | 2026-07-06 | Técnicos NPC + Central de Empregos (`coachEngine` + `useCoachStore` + telas + bônus λ) | `3f7d04d` |

---

## Revisão adversarial 12/07 — backlog a triar

Achados de uma revisão automatizada em 4 dimensões (fluxo de partida, persistência,
integração de UI, virada de temporada). A etapa de verificação adversarial foi cortada
pelo limite de sessão, então **estes itens NÃO foram confirmados** — cada um precisa de
triagem (pode haver falsos positivos). Severidade estimada pelo finder.

**Já resolvidos na própria sessão de 12/07:**
- ✅ **R-00** 🔴 F5 com a tela de vitória aberta duplicava o resultado (classificação,
  histórico, bilheteria, confiança ×2). *Confirmado e corrigido*: o "commit" do resultado
  saiu do `tick()` (90') e foi para o `nextRound()`, com guard de idempotência.
- ✅ **R-01** 🟠 Carreira encerrada (temporada 15) deixava `round: 39` persistido — todo
  F5 reabria o SeasonEndOverlay sobre o ClubSelect e duplicava `completedSeasons`.
  *Corrigido*: `closeSeasonEnd` reseta `round: 1` no fim da carreira.

**Triados e resolvidos em 13/07** (todos os 4 confirmados como bugs reais e verificados no browser):
- ✅ **R-02** 🟠 `handleJogar` decidia mando de campo por `round % 2`, contradizendo o fixture
  exibido no NextMatchCard/calendário. *Corrigido*: mando vem de `getNextFixture` (paridade só
  como fallback de carreiras sem fixtures). Verificado: rodada 7 ímpar com fixture `cor × spfc`
  iniciou a partida com o SPFC visitante. ⚠ Obs.: `LineupEditor.tsx` tem um `handleJogar` legado
  com o mesmo padrão, mas é código morto (só o `VerticalField` é importado) — candidato a remoção.
- ✅ **R-03** 🟠 `doSub` descartava quem saía e mantinha o reserva duplicado (em campo e no banco).
  *Corrigido*: troca simétrica como no `resolveInjurySub` — quem sai ocupa a vaga do banco com
  `usedInSub: true`. Verificado: 11 em campo / 5 no banco, sem duplicata, `subCount` correto.
- ✅ **R-04** 🟡 `toggleRun` só checava `ended` — Space/Enter no botão de play ainda focado
  religava o jogo por trás do modal obrigatório de lesão/intervalo. *Corrigido*: guard para
  `injurySub` e `halftimeVisible`. Verificado nos três cenários.
- ✅ **R-05** 🟡 Persist serializava + gravava a carreira inteira no localStorage a cada `set()`
  (todo tick durante a partida). *Corrigido*: storage custom com throttle (máx. 1 escrita/s,
  adiando também o `JSON.stringify`) e flush em `beforeunload`/`pagehide`. Verificado: escrita
  defasada ≤1s e estado íntegro após F5 imediato.

**Triados e resolvidos em 13/07 (2º lote)** (todos os 4 confirmados e verificados no browser):
- ✅ **R-06** 🟠 A virada de temporada não resetava `hiredRound`/`pressure` dos técnicos NPC.
  Como `hiredRound` é rodada absoluta dentro da temporada, um técnico contratado na rodada ~36
  mantinha `round - hiredRound < GRACE_ROUNDS` a temporada seguinte inteira (imune a demissão).
  *Corrigido*: `useCoachStore.onSeasonTurnover()` zera `hiredRound`/`pressure`, chamado no
  `closeSeasonEnd`. Verificado: técnico com `hiredRound: 36, pressure: 3` → `0/0` na virada 2→3.
- ✅ **R-07** 🟠 `useTransferStore` (listagens de venda/empréstimo) nunca era limpo em `selectClub`,
  então listagens de uma carreira anterior vazavam para a nova. *Corrigido*: `clearAll()` no
  `selectClub`. Verificado: 7 listagens → 0 ao criar carreira nova.
- ✅ **R-08** 🟡 `nextCoachId` era um contador módulo-level que reinicia em 1 no reload, enquanto
  os coaches persistem com ids altos — técnicos cunhados depois colidiam (`npc-1` já existia).
  *Corrigido*: `nextIdNum(coaches)` deriva o próximo id de `max(ids)+1`. Verificado: com ids
  existentes `npc-50/51`, os cunhados começaram em `npc-52` (sem colisão com `npc-1`).
- ✅ **R-09** 🟡 `switchClub` (aceitar proposta pós-demissão) não limpava `acquiredPlayers`; como
  o elenco reverte ao JSON do novo clube, os comprados sumiam do jogo pelo resto da carreira.
  *Corrigido*: `acquiredPlayers: []` no `switchClub`. Verificado: 2 comprados → 0 ao assumir o Flamengo.

**A triar:**

| ID | Sev. | Descrição | Onde |
|----|------|-----------|------|
| R-10 | 🟠 | Stores de jogo são globais ao browser, não por usuário — trocar de conta entrega/destrói a carreira de outro usuário | `useAuthStore.ts` |
| R-11 | 🔴 | TransferMarket com filtro "Todos os clubes" passa `selectedClubId` como `fromClubId` — permite recomprar o mesmo jogador infinitamente / duplicar o próprio | `TransferMarket.tsx` |
| R-12 | 🟠 | Gating premium do ClubSelect contornável: `handleStart`/`pickRandom` ignoram `isAvailableOnFree` | `ClubSelect.tsx` |
| R-13 | 🟠 | Dispensa no SeasonEndOverlay chaveada por `num` — colisão de números dispensa/duplica o jogador errado | `SeasonEndOverlay.tsx` |
| R-14 | 🟠 | `applyAging` é estocástico e re-executado em cada fase do SeasonEndOverlay — o que o usuário vê nunca é o que é aplicado | `SeasonEndOverlay.tsx` |
| R-15 | 🟡 | JOGAR não bloqueia escalação incompleta (slots null passam; só lesionado bloqueia) | `ManagerHub.tsx` |
| R-16 | 🟠 | Guard de init do lineup só olha slots: 11 titulares dispensados → mount re-inicializa do JSON, ressuscitando dispensados e apagando contratados | `ManagerHub.tsx` |
| R-17 | 🟢 | Botão "Continuar (debug)" do FiredModal é no-op (não limpa `isFired`) | `ManagerHub.tsx` |
| R-18 | 🟡 | `processCoachRound` contrata técnico NPC para o clube DO JOGADOR na 1ª rodada, violando invariante documentado | `coachEngine.ts` |
| R-19 | 🟢 | Notícias de técnicos da temporada anterior vazam para a nova (news não limpa; UI mostra só "R{round}") | `CoachesView.tsx` |

---

*Relatório gerado em 2026-06-12 · GLfoot Modo Carreira · Próxima sessão de QA: triagem dos R-10..R-19*
