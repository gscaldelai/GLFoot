# GLfoot — Relatório de QA
**Versão testada:** Modo Carreira v0.x  
**Data:** 2026-06-12  
**Testador:** GustãoFC (usuário real)  
**Sessão de teste:** 3+ partidas simuladas (SPFC × Corinthians, outros)  
**Total de itens:** 15  
**Status:** 10 abertos · 5 resolvidos

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
| U-01 | 🟢 Baixo | 🔲 Aberto | **Linguagem de vantagem de formação** — seção de formação exibe "Bate" e "Perde para" para indicar relações táticas. | Substituir por "Forte contra ▲" e "Fraco contra ▼" para linguagem mais intuitiva. |
| U-02 | 🟢 Baixo | 🔲 Aberto | **Emoji do Mercado pouco representativo** — o ícone da seção Mercado de Transferências não remete a transferências/negociação. | Usar emoji ou ícone mais sugestivo (ex: 💸, 🤝, 📋). |
| U-03 | 🟡 Médio | 🔲 Aberto | **Card de vitória expõe dado interno** — o card final exibe "Força Casa" e "Força Fora" como valores numéricos, que são dados internos do engine. | Ocultar ou substituir por informação relevante ao usuário (ex: posse, finalizações). |
| U-04 | 🟡 Médio | 🔲 Aberto | **Velocidade do jogo não persiste entre rodadas** — ao iniciar nova rodada, o seletor de velocidade volta para 1×, obrigando o usuário a reselecionar a cada partida. | Lembrar a última velocidade escolhida e iniciar a próxima partida com ela pré-selecionada. |
| U-05 | 🟡 Médio | 🔲 Aberto | **Card de partida sem identificação do campeonato** — o card próximo ao placar mostra os times, mas não qual competição/rodada pertence o jogo. | Exibir: "Vasco × SPFC · Rodada 2 · Brasileirão" (ou similar). |
| U-06 | 🟠 Alto | 🔲 Aberto | **Sem pausa no intervalo do 1º tempo** — o jogo passa dos 45min direto para o 2º tempo sem oferecer ao usuário a possibilidade de fazer ajustes táticos ou substituições. | Ao chegar nos 45min, pausar automaticamente e exibir tela/modal de intervalo com elenco, opções de substituição e confirmação para iniciar o 2º tempo. |

---

## Balanceamento / Game Design

| ID | Severidade | Status | Descrição | Observação |
|----|-----------|--------|-----------|------------|
| G-01 | 🟠 Alto | 🔲 Aberto | **4-4-2 é o sistema mais fraco** — a formação mais tradicional do futebol real aparece perdendo para a maioria dos outros sistemas disponíveis, o que não condiz com a realidade tática. | Reanalisar a matriz de bônus/penalidades entre formações. 4-4-2 deve ser equilibrado (neutro ou levemente positivo contra maioria). |
| G-02 | 🟠 Alto | 🔲 Aberto | **Ausência de sistema de lesões** — nenhum jogador pode se lesionar durante partidas, removendo um elemento fundamental de gestão de elenco. | Implementar probabilidade de lesão (por contato, fadiga alta, idade), duração variável e substituição obrigatória caso o lesionado seja titular em campo. |

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

---

*Relatório gerado em 2026-06-12 · GLfoot Modo Carreira · Próxima sessão de QA: a definir*
