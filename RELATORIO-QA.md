# GLfoot — Relatório de QA
**Versão testada:** Modo Carreira v0.x  
**Data:** 2026-06-12 · atualizado 2026-07-06  
**Testador:** GustãoFC (usuário real)  
**Sessão de teste:** 3+ partidas simuladas (SPFC × Corinthians, outros)  
**Total de itens:** 14  
**Status:** 13 resolvidos · 1 suspenso · 0 abertos

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
| F-01 | 🟠 Alto | ⏸️ Suspenso | **Central de Empregos / Técnicos de IA** — clubes não controlados por humanos não possuem técnico com nome, não fazem demissões nem contratações. O universo do modo carreira fica estático. | Cada clube deve ter um técnico NPC nomeado. Clubes devem demitir ao performar mal e contratar novo técnico do "mercado livre". Regra de balanceamento: clubes de nível alto (ex: SPFC, Flamengo) só contratam técnicos com reputação mínima equivalente. |

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

---

*Relatório gerado em 2026-06-12 · GLfoot Modo Carreira · Próxima sessão de QA: a definir*
