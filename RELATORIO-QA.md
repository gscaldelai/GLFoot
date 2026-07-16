# GLfoot — Relatório de QA
**Versão testada:** Modo Carreira v0.x  
**Data:** 2026-06-12 · atualizado 2026-07-13  
**Testador:** GustãoFC (usuário real) + revisão adversarial automatizada (12/07)  
**Sessão de teste:** 3+ partidas simuladas (SPFC × Corinthians, outros)  
**Total de itens:** 14 originais (todos resolvidos) + backlog R-xx da revisão de 12/07  
**Status:** ✅ Backlog zerado — 14 itens originais + R-00..R-19 todos resolvidos e verificados

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

**Triado e resolvido em 13/07 (estrutural)** (confirmado e verificado no browser):
- ✅ **R-10** 🟠 Os 7 stores de jogo persistiam em chaves fixas globais ao browser
  (`glfoot-career`, `-finance`, ...). Dois usuários na mesma máquina compartilhavam — e
  sobrescreviam — a carreira um do outro. *Corrigido*: novo módulo `userScope.ts` namespaceia
  a persistência por `userId` (`glfoot-career::u_<id>` etc.). Os stores usam `skipHydration`
  (ficam nos defaults) e a hidratação é dirigida no boot e a cada login/logout: re-aponta a
  chave, zera a memória (senão um usuário novo veria os dados do anterior via merge) e re-hidrata
  o save do usuário. `glfoot-auth` continua global de propósito. Inclui migração única (o 1º
  usuário adota o save legado sem namespace) e um ajuste no throttle do R-05 (flush ao trocar de
  chave + convergência da escrita final, senão o save se perderia no logout/2º F5). Verificado:
  isolamento A×B (B não vê a carreira de A; A intacta ao voltar), logout zera a memória, F5 (e o
  2º F5 consecutivo) preserva a carreira, migração do legado adotada só pelo 1º usuário.

**Triados e resolvidos em 13/07 (lote R-11..R-14)** — cada um passou por investigação +
verificação adversarial (2 céticos por achado) num workflow multiagente, depois confirmado
no browser:
- ✅ **R-11** 🔴 No filtro "Todos os clubes" a compra/empréstimo passava `selectedClubId`
  (o clube da árvore) como `fromClubId`, não o clube REAL do jogador. A chave de dedup de
  `acquiredPlayers` (`fromClubId_num`) divergia da chave da tabela (`clubReal_num`), então o
  jogador nunca sumia da lista → recompra infinita (paga passe e duplica no banco a cada clique);
  e como `executeTransfer` não barrava `fromClubId === myClubId`, dava para "comprar" o próprio
  jogador. *Corrigido*: novo `selectedFromClubId` deriva o dono real da linha do `sourcePool` e é
  usado nas duas ações; guarda em `executeTransfer` bloqueia contratar do próprio clube.
  Verificado: comprar o Rony (Palmeiras) no modo global gravou `fromClubId: 'palm'` e o removeu da
  lista (sem recompra); comprar do próprio clube retorna "já pertence ao seu clube".
- ✅ **R-12** 🟠 `pickRandom` e `handleStart` sorteavam/assumiam de TODOS os clubes e o
  `selectedId` default (`CLUBS[0]`, premium) nunca era revalidado — um usuário `free` iniciava
  carreira com clube premium pelo default ou pelo aleatório. *Corrigido*: helper `canUseClub(id)`
  (`isPremium || isAvailableOnFree(id)`) aplicado no sorteio (pool permitido) e revalidado antes
  do `selectClub`. Verificado: usuário free clica "Iniciar Jogo" e nada acontece (tela continua
  no ClubSelect); premium segue normal.
- ✅ **R-13** 🟠 A dispensa no fim de temporada era chaveada por `num` (`Set<number>`), mas `num`
  colide quando uma contratação traz um jogador de outro clube com o mesmo número — dispensar um
  marcava/rescindia os dois e o `find` por `num` reconstruía o jogador errado. *Corrigido*:
  identidade por `playerKey` (name+num) em todo o overlay (Set, filtros, `find`, React keys,
  toggle). Verificado: com dois jogadores num 1 (Rafael + ColideTest), dispensar ColideTest
  removeu só ele (Rafael intacto), 1 única rescisão lançada ("Rescisão: ColideTest").
- ✅ **R-14** 🟠 `applyAging` (estocástico, `Math.random`) era chamado 3× independentes — exibir
  em Evolução, exibir em Contratos e aplicar ao elenco — então o envelhecimento mostrado nunca era
  o salvo (nem a rescisão exibida batia com a lançada). *Corrigido*: o overlay calcula o
  envelhecimento UMA vez (`useMemo` keyed em `[visible, season]`, num `Map` por `playerKey`
  consistente com o R-13) e reaproveita o MESMO snapshot para exibir e aplicar. `ageCurve.ts`
  intacto (regra do projeto; `npm run test:engine` segue passando). Verificado: força persistida
  de 16 jogadores == força exibida na fase Contratos (100% de match).

**Triados e resolvidos em 13/07 (lote R-15..R-19)** — todos confirmados como bugs reais e
verificados no browser (checks via `window.glfoot` + fluxo pela UI):
- ✅ **R-15** 🟡 `handleJogar` e o botão JOGAR só barravam jogador lesionado; slot vazio (escalação
  incompleta) passava e `getLineupForMatch()` filtra os `null`, então o time entraria com menos de 11.
  *Corrigido*: `incompleteLineup` (`slots.length === 0 || slots.some(p => !p)`) desabilita o botão,
  exibe aviso "Escalação incompleta" e o guard de `handleJogar` bloqueia. Verificado: com 1 slot vazio
  o botão fica `disabled` e o clique não inicia a partida (tela segue no hub); o aviso pluraliza
  ("o lugar vazio" / "os N lugares vazios"); escalação completa reabilita o botão.
- ✅ **R-16** 🟠 O guard de init do lineup (`slots.filter(Boolean).length === 0`) reconstruía do JSON
  do clube sempre que os 11 titulares eram dispensados — apagando os contratados (que vivem no banco)
  e ressuscitando os dispensados. *Corrigido*: só reconstrói quando NÃO há elenco salvo em lugar nenhum
  (`slots` vazios **E** `bench` vazio = carreira nova). Verificado: com 11 slots nulos + banco contendo
  "ContratadoQA", o F5 não ressuscitou nenhum titular nem apagou o contratado; carreira nova (slots e
  banco vazios) segue reconstruindo os 11+5 do JSON.
- ✅ **R-17** 🟢 O botão "Continuar (debug)" do FiredModal chamava só `goToHub()` (que apenas faz
  `set({screen:'hub'})`), sem limpar `isFired` nem `firedDismissed` — no-op, o modal continuava aberto.
  *Corrigido*: novo `clearFired()` no confidence store desfaz a demissão e levanta os medidores acima do
  alerta (as funções de confiança fazem `if (isFired) return`, então só limpar a flag os congelaria e a
  rodada seguinte re-demitiria). Verificado: o clique fecha o modal, `isFired:false`, diretoria/torcida
  → 45/40 e `dir/torAlertRounds` zerados.
- ✅ **R-18** 🟡 `processCoachRound` não conhecia o clube do jogador; como ele nunca tem Coach com seu
  clubId, aparecia "sem técnico" e a liga contratava um NPC para o clube DO JOGADOR na 1ª rodada.
  *Corrigido*: `processRound`/`processCoachRound` recebem `playerClubId` (via `s.myClubId`) e pulam o
  clube do jogador no laço de contratação. Verificado: com o comportamento antigo (sem o id) o SPFC
  ganhava "Adenor Sampaio"; com o fix o SPFC fica sem NPC e os 19 bots de `CLUB_STRENGTH` seguem todos
  com técnico.
- ✅ **R-19** 🟢 `onSeasonTurnover` não limpava `news`, então as movimentações de técnicos da temporada
  anterior vazavam para a nova (a UI mostra só "R{round}", sem temporada, ficando ambíguas).
  *Corrigido*: `onSeasonTurnover` zera `news: []` (mantendo o reset de `hiredRound`/`pressure` do R-06).
  Verificado: 2 notícias + técnicos com `hiredRound 36`/`pressure 3` → `news: 0` e `0/0` após a virada.

**Extra — id divergente do Palmeiras (achado na verificação do R-18):**
- ✅ **X-01** 🟠 O clube jogável Palmeiras tem id `palm` (`clubs/index`, elenco, dropdown), mas
  `CLUB_STRENGTH`, `CLUB_STADIUM`, `CLUB_COMPETITIONS` e o estádio (`stadiums.ts`) usavam `palmeiras`.
  Como esses lookups são por id, escolher o Palmeiras caía em fallback: sem força/tier (meta e orçamento
  errados), `isAvailableOnFree('palm')` retornava `true` (liberado no Free indevidamente), sem estádio e
  só com o Brasileirão no calendário; e como bot ele ficava "sem técnico" e sem escudo na tela Técnicos.
  *Corrigido*: unificado para `palm` nos 4 pontos (`clubStrength.ts`, `calendarEngine.ts`, `stadiums.ts` ×2).
  Verificado no browser: `getClubStrength('palm')` → tier A/74.4; `isAvailableOnFree('palm')` → false;
  `CLUB_STADIUM['palm']` → `allianz`; carreira do Palmeiras com meta "top4", orçamento R$10M e as 4
  competições (paulistão/liberta/copa BR/brasileirão); como bot, técnico "Lisca Luxemburgo (5★)" e a
  linha na tela Técnicos renderiza igual aos demais clubes (escudo + técnico). `tsc` e `test:engine` passam.

---

## Bugs encontrados jogando (a triar)

- ✅ **J-01** 🔴 **Lesão nunca recuperava — DEADLOCK** (resolvido em 14/07, commit `f88ec41`).
  Jogador lesionado "volta em 3 rodadas", mas o badge ficava travado em `3r` **para sempre** e a
  carreira parava.
  **A hipótese inicial deste relatório estava ERRADA** e foi refutada com teste de mesa: o
  write-back **não** re-somava `+1` toda rodada — o guard `if (p.injured) return p`
  (`useMatchStore`:736) dispara corretamente da 2ª rodada em diante, e `advanceInjuryRecovery`
  (`injuryEngine.ts`:100) sempre esteve correta.
  **Causa raiz real — deadlock:** a recuperação existe num único lugar (dentro do `nextRound`),
  e o `nextRound` só é alcançável jogando uma partida até os 90'. Mas o write-back marcava o
  lesionado **sem tirá-lo do slot de titular**, e o `ManagerHub` (:647) **bloqueia o botão JOGAR**
  enquanto houver titular lesionado. Logo: lesionado no XI → não joga → `nextRound` nunca roda →
  `advanceInjuryRecovery` nunca roda → lesão congelada e carreira travada. Parecia intermitente
  porque quem movia o lesionado para o banco na mão destravava o ciclo sem perceber.
  **Correção:** `useLineupStore.expelInjured()` tira lesionados do XI puxando o melhor reserva
  sadio (mesma posição primeiro); chamado no `nextRound` **depois** da recuperação (para não mexer
  em quem acabou de sarar e manter a fadiga no XI que jogou) **e** ao montar o `ManagerHub` —
  este último destrava saves que já estavam presos (o fix do `nextRound` sozinho não os alcança,
  justamente porque ele nunca roda).
  **Verificado no browser:** deadlock reproduzido (JOGAR `disabled` + "substitua antes de jogar");
  após o fix o lesionado vai ao banco, um reserva assume, JOGAR habilita, e o ciclo completo roda
  `3r → 2r → 1r → curado` na 4ª rodada.

- ✅ **J-02** 🟡 **Jogador lesionado ocupava vaga no banco da partida** (resolvido em 14/07,
  commit `f88ec41`). `prepareMatch` (`useMatchStore`:410-411) copiava `club.bench` verbatim, sem
  `.filter(p => !p.injured)` — o indisponível ocupava uma das vagas do banco.
  **Correção:** filtra `p.injured` ao montar `homeBench`/`awayBench` (nos dois lados).
  **Nota da triagem:** a suspeita de que ele era *selecionável* para substituição era **falsa** —
  todas as superfícies já barravam lesionado (`BenchZone`:34, `InjurySubModal`:25,
  `MatchAdjustments`:83, e re-guards em `doSub`/`resolveInjurySub`/`pickBotReplacement`). O defeito
  real era de modelo/visual: disco inerte poluindo a faixa e roubando uma vaga de reserva.
  **Verificado no browser:** banco do SPFC na partida veio com 4 em vez de 5 (sem o lesionado) e
  nenhum `injured` nos bancos dos dois times.

- 🔲 **J-03** 🔴 **A Libertadores NUNCA pode ser vencida** — descoberto ao construir a
  tela de Tabelas (#33). A final da Libertadores está agendada para a **semana 43**
  (`calendarEngine`), mas a simulação de copas roda dentro do `nextRound` comparando
  `game.week === currentWeek` com `currentWeek = s.round` — e a **rodada para em 38**.
  Logo a fase final nunca é alcançada: o clube não perde nem ganha, a competição
  simplesmente congela. A tela de Tabelas marca essas fases como "NÃO SIMULADA" em vez
  de fingir que existem. **A convenção semana×rodada diverge** entre `nextRound`
  (`week = round`, 1-38) e o `CalendarView`/`clubCalendar` (semanas 1-52) — é a raiz
  do problema e afeta qualquer competição com fase depois da semana 38.

- 🔲 **J-04** 🟠 **Fases de grupo nunca são simuladas** — o `nextRound` só processa
  fases `single_elim` / `two_leg_elim`; as fases de grupo do catálogo são ignoradas,
  então o clube nunca é eliminado (nem classificado) nelas.

- 🔲 **J-05** 🟡 **Confronto de ida e volta sorteia eliminação 2×** — em
  `two_leg_elim`, a simulação roda a moeda uma vez por JOGO em vez de uma vez por
  CONFRONTO. O clube tem duas chances independentes de ser eliminado no mesmo mata-mata,
  o que dobra a taxa efetiva de queda.

  *(J-03 a J-05 são do mesmo subsistema — a simulação de copas do `nextRound`. Mexer
  neles altera comportamento de engine, então exigem teste de mesa. Recomendo tratar
  os três juntos, junto com a unificação da convenção semana×rodada.)*

---

*Relatório gerado em 2026-06-12 · GLfoot Modo Carreira · Backlog da revisão adversarial 12/07 zerado em 13/07 · J-01 e J-02 abertos e RESOLVIDOS em 14/07 · J-03 a J-05 (simulação de copas) abertos em 14/07.*
