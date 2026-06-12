# GLfoot — Relatório de QA
**Versão testada:** Modo Carreira v0.x  
**Data:** 2026-06-12  
**Testador:** GustãoFC (usuário real)  
**Sessão de teste:** 3+ partidas simuladas (SPFC × Corinthians, outros)  
**Total de itens:** 15  
**Status:** 15 abertos · 0 resolvidos

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
| B-01 | 🔴 Crítico | 🔲 Aberto | **Goleiro marca gol** — Rafael (GK) aparece como autor de gol em múltiplas partidas (confirmado em pelo menos 2 jogos). | Simular 3+ partidas com SPFC. Rafael aparece no log de gols. | `matchEngine.ts → pickScorer()` — não filtra `pos === 'GK'` |
| B-02 | 🔴 Crítico | 🔲 Aberto | **Card final vermelho em vitória** — após vitória de 4×1, o card de resultado exibe cor vermelha (associada à derrota). | Vencer uma partida por placar expressivo (ex: 4×1). O card aparece com fundo vermelho. | `VictoryOverlay.tsx` — lógica de cor não lê o resultado real |
| B-03 | 🔴 Crítico | 🔲 Aberto | **Menu Tabelas sem dados** — após 3 partidas disputadas, a tela de classificação aparece vazia, sem pontos/jogos contabilizados. | Jogar 3 rodadas → abrir Menu Tabelas → tabela exibe todos os times zerados. | `Standings.tsx` ou `useMatchStore → standings` não é atualizado pós-partida |
| B-04 | 🟠 Alto | 🔲 Aberto | **Inconsistência na barra de força dos atletas** — no menu HOME pós-partida a barra aparece quase cheia; ao iniciar novo jogo a barra aparece bem desgastada. Não fica claro qual é o valor real. | Jogar uma partida → ver barra no menu → iniciar nova rodada → ver barra novamente. | `useLineupStore` ou `fatigue` calculado em dois momentos diferentes |
| B-05 | 🟡 Médio | 🔲 Aberto | **Times duplicados no Mercado de Transferências** — o mesmo clube aparece listado mais de uma vez na tela de Mercado. | Abrir Mercado de Transferências → scroll na lista de clubes. | `TransferMarket.tsx` — fonte de dados de clubes com entradas repetidas |

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
| — | — | — | — |

---

*Relatório gerado em 2026-06-12 · GLfoot Modo Carreira · Próxima sessão de QA: a definir*
