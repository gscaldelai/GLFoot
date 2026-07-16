# GLfoot — Documentação Técnica

> Simulador de futebol estilo jogo de botões, inspirado no Brasfoot.  
> Versão: 0.1.0 · Data: Junho 2026

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura](#3-arquitetura)
4. [Estrutura de Arquivos](#4-estrutura-de-arquivos)
5. [Tipos Centrais](#5-tipos-centrais)
6. [Engines](#6-engines)
7. [Stores (Estado Global)](#7-stores-estado-global)
8. [Dados](#8-dados)
9. [Páginas & Componentes](#9-páginas--componentes)
10. [Sistema Financeiro](#10-sistema-financeiro)
11. [Sistema de Confiança & Demissão](#11-sistema-de-confiança--demissão)
12. [Mercado de Transferências](#12-mercado-de-transferências)
13. [Sistema de Estádios](#13-sistema-de-estádios)
14. [Calendário da Temporada](#14-calendário-da-temporada)
15. [Integrações Externas](#15-integrações-externas)
16. [Freemium & Planos](#16-freemium--planos)
17. [Limitações Conhecidas](#17-limitações-conhecidas)
18. [Backlog / Próximos Passos](#18-backlog--próximos-passos)

---

## 1. Visão Geral

O GLfoot tem **duas frentes independentes**:

| Frente | Modelo | Infraestrutura |
|---|---|---|
| **Online** | Campeonato Brasileiro multiplayer, 1 usuário por clube, 20 clubes, 38 rodadas | Node.js + Socket.io + PostgreSQL (Railway) |
| **Offline (Modo Carreira)** | 1 jogador como técnico, 15 temporadas, totalmente local | React + Zustand (localStorage) |

O frontend atual cobre **integralmente o Modo Carreira** e a camada de auth/ranking do Online. A partida ao vivo roda localmente via Poisson Engine — sem servidor.

---

## 2. Stack Tecnológica

### Frontend

| Camada | Tecnologia | Versão |
|---|---|---|
| Build | Vite | 5.4 |
| UI | React | 18.3 |
| Linguagem | TypeScript | 5.6 |
| Estilo | Tailwind CSS | 3.4 |
| Estado global | Zustand | 5.0 |
| Persistência local | Zustand `persist` → `localStorage` | — |
| Fontes | Bebas Neue (GLfoot display), sistema sans | Google Fonts via CDN |

### Backend (Online — Railway)

| Camada | Tecnologia | Notas |
|---|---|---|
| Runtime | Node.js | Projeto `hearty-caring` no Railway |
| API | REST (auth) + Socket.io (partidas ao vivo) | Em desenvolvimento |
| Banco | PostgreSQL | Volume persistente Railway |
| Auth | JWT Bearer Token | Login/Registro via `/api/auth/*` |

### Integrações Externas

| Serviço | Uso | Tipo |
|---|---|---|
| Wikimedia Commons | Fotos dos estádios | URLs `Special:FilePath/{filename}?width=N` — sem hash |
| Railway | Deploy do backend | PaaS, projeto `hearty-caring` |

---

## 3. Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vite + React)                  │
│                                                              │
│  ┌─────────────┐   ┌──────────────────┐   ┌─────────────┐  │
│  │   Páginas   │   │     Engines      │   │   Stores    │  │
│  │  (pages/)   │──▶│  (engines/)      │◀──│  (stores/)  │  │
│  │             │   │                  │   │             │  │
│  │ AuthScreen  │   │ matchEngine      │   │ useMatchStore│  │
│  │ ClubSelect  │   │ ageCurve         │   │ useFinance   │  │
│  │ ManagerHub  │   │ fatigueEngine    │   │ useStadium   │  │
│  │ Match       │   │ forceEngine      │   │ useConfidence│  │
│  │ CalendarView│   │ marketEngine     │   │ useTransfer  │  │
│  │ StadiumView │   │ calendarEngine   │   │ useLineup    │  │
│  │ TransferMkt │   └──────────────────┘   │ useAuth      │  │
│  └─────────────┘                          └─────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Dados (data/)                      │   │
│  │  clubs/spfc.json  clubs/palmeiras.json               │   │
│  │  stadiums.ts  competitions.ts  trophies.ts           │   │
│  │  clubStrength.ts  clubGoals.ts  formations.ts        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
              │ fetch (auth/ranking)
              ▼
┌─────────────────────────┐
│  BACKEND (Railway)       │
│  Node.js + PostgreSQL    │
│  /api/auth/login         │
│  /api/auth/register      │
│  /api/ranking (mock)     │
└─────────────────────────┘
```

### Fluxo de telas

```
AuthScreen → ClubSelect → ManagerHub ─┬─ Painel da Equipe
                                       ├─ CalendarView → Jogo → Match
                                       ├─ StadiumView
                                       ├─ TransferMarket (Mercado)
                                       ├─ Tabelas (StandingsScreen)
                                       ├─ Técnicos (TecnicosScreen)
                                       ├─ História (placeholder)
                                       └─ Central de Emprego (CentralEmpregoScreen · Premium)
```

---

## 4. Estrutura de Arquivos

```
glfoot/
├── CLAUDE.md                  ← regras de desenvolvimento para o Claude
├── DOCS.md                    ← este documento
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── prototype/
│   └── index.html             ← referência visual (NÃO editar)
├── scripts/
│   ├── test-poisson.js        ← validação do Poisson Engine
│   ├── test-agecurve.js       ← validação do Age Curve (75 temporadas)
│   ├── test-formations.js     ← balanceamento da matriz de formações (G-01)
│   ├── test-injury.js         ← calibração do Injury Engine (G-02)
│   └── test-coach.js          ← calibração do Coach Engine (F-01)
└── src/
    ├── App.tsx                ← roteador principal (auth → select → hub/match)
    ├── main.tsx
    ├── index.css              ← variáveis CSS, fontes, reset
    │
    ├── engines/               ← lógica de jogo pura (sem React)
    │   ├── types.ts           ← Player, Club, Pos, Spec, Foot, MatchEvent
    │   ├── matchEngine.ts     ← Poisson Engine (gols, lambda, scorer)
    │   ├── ageCurve.ts        ← curvas de pico por posição, evolução
    │   ├── fatigueEngine.ts   ← fadiga, recuperação, semana dupla
    │   ├── injuryEngine.ts    ← lesões: risco por minuto, duração, recuperação
    │   ├── coachEngine.ts     ← técnicos NPC: geração, demissão, contratação, bônus λ
    │   ├── forceEngine.ts     ← força online (base + forma + momentum)
    │   ├── marketEngine.ts    ← valor de mercado, passe, salário, elegibilidade
    │   └── calendarEngine.ts  ← gerador de calendário anual
    │
    ├── data/
    │   ├── clubs/
    │   │   ├── spfc.json      ← elenco completo SPFC (titulares + banco)
    │   │   ├── palmeiras.json ← elenco completo Palmeiras
    │   │   └── index.ts       ← exporta CLUBS tipado
    │   ├── stadiums.ts        ← 20 estádios, tiers, expansões, fotos
    │   ├── competitions.ts    ← catálogo de competições e fases
    │   ├── formations.ts      ← formações disponíveis (4-4-2, 4-3-3, etc.)
    │   ├── trophies.ts        ← histórico de títulos dos 20 clubes
    │   ├── clubStrength.ts    ← força do clube (média dos atletas) + faixas e rótulos
    │   └── clubGoals.ts       ← metas contratuais e orçamento inicial
    │
    ├── pages/
    │   ├── AuthScreen.tsx     ← login / registro
    │   ├── ClubSelect.tsx     ← nova carreira: ligas, clube, técnico, contrato
    │   ├── ManagerHub.tsx     ← hub principal do modo carreira
    │   ├── Match.tsx          ← partida ao vivo (campo, substituições, eventos)
    │   ├── LineupEditor.tsx   ← editor de escalação
    │   ├── CalendarView.tsx   ← calendário da temporada (grade + lista filtrada)
    │   ├── StadiumView.tsx    ← gestão do estádio (bilheteria + expansão)
    │   ├── TransferMarket.tsx ← mercado de transferências unificado
    │   └── CoachesView.tsx    ← telas Técnicos + Central de Emprego (F-01)
    │
    ├── components/
    │   ├── Campo.tsx          ← campo SVG com posicionamento dos discos
    │   ├── PlayerDisc.tsx     ← disco do jogador (camisa, número, força)
    │   ├── BenchZone.tsx      ← banco de reservas com drag-and-drop
    │   ├── Scoreboard.tsx     ← placar, cronômetro, velocidade
    │   ├── EventsPanel.tsx    ← log de eventos da partida
    │   ├── GoalOverlay.tsx    ← animação de gol
    │   ├── VictoryOverlay.tsx ← tela de fim de jogo (com autores dos gols)
    │   ├── HalftimeOverlay.tsx← modal de intervalo aos 45min
    │   ├── InjurySubModal.tsx ← substituição obrigatória por lesão
    │   ├── Standings.tsx      ← tabela de classificação
    │   ├── ClubCrest.tsx      ← escudo SVG gerado pelas cores do clube
    │   ├── Shirt.tsx          ← camisa SVG miniatura
    │   └── TrophyIcon.tsx     ← ícone de troféu
    │
    └── stores/
        ├── useMatchStore.ts      ← estado central da carreira e partida ao vivo
        ├── useLineupStore.ts     ← escalação atual (11 titulares + banco)
        ├── useFinanceStore.ts    ← saldo, transações, folha salarial
        ├── useStadiumStore.ts    ← capacidade, preços, obras em curso
        ├── useConfidenceStore.ts ← medidores Diretoria e Torcida
        ├── useTransferStore.ts   ← listings de venda/empréstimo
        ├── useCoachStore.ts      ← técnicos NPC, mercado livre, propostas (F-01)
        └── useAuthStore.ts       ← usuário autenticado e token JWT
```

---

## 5. Tipos Centrais

Definidos em `src/engines/types.ts`:

```typescript
type Pos  = 'ATA' | 'MEI' | 'VOL' | 'LAT' | 'ZAG' | 'GK'
type Spec = 'FI' | 'VE' | 'DR' | 'DE' | 'PA' | 'RE' | 'FO' | 'MA'
type Foot = 'D' | 'E' | 'A'   // pé dominante: Direito, Esquerdo, Ambidestro

interface Player {
  name:              string
  num:               number
  age:               number
  pos:               Pos
  posLabel:          string
  spec:              Spec
  spec2?:            Spec          // característica secundária (opcional)
  foot:              Foot
  nationality:       string        // código ISO 3 letras: 'BRA', 'ARG', etc.
  forca:             number        // 1–99 — força atual exibida
  forcaBase:         number        // força base (evolui lentamente — Online)
  potencial:         number        // teto absoluto (fixo)
  potencialVisto:    number        // estimativa do scout (oculto ao jogador)
  moral:             number        // 10–90
  fatigue:           number        // 0–1
  fieldPos:          [number, number]  // [left%, top%] no campo
  lastNotes:         number[]      // notas das últimas partidas (Online)
  matchesPlayed:     number
  injured:           boolean
  contractYearsLeft: number
  gp:                number        // gols na temporada
  assists:           number        // assistências na temporada
  isStar?:           boolean       // estrela da temporada (eleita por algoritmo)
  forSale?:          boolean       // listado para venda
  forLoan?:          boolean       // listado para empréstimo
}

interface Club {
  id:          string
  name:        string
  short:       string              // máx 4 chars
  colors:      [string, string, string]   // camisa: fundo, faixa, detalhe
  crestColors: [string, string]           // escudo SVG: primária, secundária
  squad:       Player[]            // 11 titulares
  bench:       Player[]            // 5–7 reservas
  division?:   1 | 2 | 3
}
```

---

## 6. Engines

Todos os engines são **funções puras TypeScript** — sem React, sem efeitos colaterais.

### 6.1 matchEngine.ts — Poisson Engine

Validado: média 2.74 gols/jogo, 6.6% jogos 0×0.

```typescript
poissonSample(lambda)          // amostra da distribuição de Poisson
calcLambda(myAvg, oppAvg, isHome)  // λ = 1.3 + diff*0.04 + (isHome ? 0.15 : 0)
scheduleGoalMinutes(count)     // distribui gols em minutos 5–90
pickScorer(squad)              // ponderado por forca individual
```

### 6.2 ageCurve.ts — Curvas de Envelhecimento

Validado: 0 violações em 75 temporadas simuladas.

| Posição | Pico | Dev/temp | Dec/temp |
|---|---|---|---|
| ATA | 24–27 | +1.8 | −1.2 |
| MEI | 25–29 | +1.5 | −0.9 |
| LAT | 24–28 | +1.6 | −1.0 |
| VOL | 25–29 | +1.3 | −0.8 |
| ZAG | 27–31 | +1.2 | −0.8 |
| GK  | 29–33 | +1.0 | −0.7 |

```typescript
ageDelta(age, pos)             // delta esperado para esta temporada
simMatchPerformance(player)    // nota 60–99 com ruído gaussiano
applyAging(squad)              // aplica +1 ano ao fim da temporada
generateYouth(clubId, pos)     // jovem da base com potencial oculto
updatePotencialVisto(player)   // afina estimativa com partidas acumuladas
```

### 6.3 fatigueEngine.ts

```typescript
effectiveAvgSquad(squad)       // força média descontando fadiga
applyMatchFatigue(player, doubleWeek)   // aumenta fadiga após jogo
applyBenchRecovery(player, doubleWeek)  // recupera reservas
rollDoubleWeek(round)          // probabilidade de semana dupla por rodada
withBotFatigue(club)           // simula fadiga para clubes bot
```

### 6.4 injuryEngine.ts — Lesões (QA G-02)

Calibrado: ~6 lesões por clube por temporada de 38 rodadas (`scripts/test-injury.js`).

```typescript
injuryRiskPerMinute(p)       // BASE 0.00012 × idade × (1 + fadiga×1.2) × posição (GK ×0.4)
rollTeamInjury(squad)        // sorteia lesão do time em 1 minuto; retorna idx ou null
rollInjuryDuration()         // leve 1–2 (55%) · moderada 3–5 (30%) · séria 6–10 (12%) · grave 11–16 (3%)
applyInjury(p, roll)         // marca injured + injuryRoundsLeft + injuryLabel
advanceInjuryRecovery(p)     // −1 rodada por nextRound; cura ao chegar a 0
healInjury(p)                // cura total (virada de temporada)
```

**Fluxo em partida** (`useMatchStore.tick`, 1 sorteio por minuto de jogo):
- Titular **do jogador** lesionado → jogo pausa + `InjurySubModal` (substituição obrigatória; sem opções → segue com 10). A substituição consome 1 das 3.
- Jogador **bot** → auto-substituição pelo melhor reserva compatível.
- No fim do jogo, lesões do time do jogador voltam ao `useLineupStore` (write-back com +1 para compensar o decremento do `nextRound` da mesma rodada — "fora por N rodadas" = perde exatamente as N próximas).

**Regras de elenco:** lesionado não pode ser escalado (botão JOGAR bloqueado nos dois pontos, troca banco→campo bloqueada no `swapInStore`, `assignToFormation` filtra e manda para o fim do banco). Badge 🚑 com rodadas restantes em PlayerRow, SlotDisc, BenchPanel, BenchZone e PlayerDisc.

> O flag transitório `usedInSub` marca reserva já utilizado na partida — antes disso o campo `injured` era reaproveitado para esse fim.

### 6.5 forceEngine.ts — Força Online

```
Força Final = Base(50%) + Forma(35%) + Momentum(15%)
```

```typescript
normalizeNote(sofascore)       // SS 0–10 → GL 60–99
calcForma(lastNotes)           // média ponderada [5,4,3,2,1]
calcMomentum(lastNotes)        // (avg3_recentes - avg3_anteriores) × 0.4
calcForca(base, forma, momentum, potencial)
driftBase(base, notaGL, potencial)  // drift 2%/jogo
updateAfterMatch(player, sofascoreNote)
```

### 6.6 marketEngine.ts — Valores e Mercado

```typescript
calcMarketValue(player)        // BASE × (forca/50) × ageFactor × potBonus × starBonus
calcPasse(player)              // valor de mercado + premium 10–25% (jovens valem mais)
calcSalary(player)             // SALARY_BASE × (forca/50) × ageSalaryFactor
calcSquadValue(players)        // soma de mercado do elenco
checkTransferEligibility(player, sellerForce, buyerForce, budget, type)
calcStarScore(player)          // forca×0.5 + gp×3 + assists×2 + nota×4
electSeasonStar(candidates)    // elege o melhor da temporada
fmtValue(value)                // "3.2M" ou "92 mil"
```

**Escala base por posição (forca=50, pico de idade):**

| Pos | Base MV | Salário base |
|---|---|---|
| ATA | R$ 5.5M | R$ 130k/mês |
| MEI | R$ 5.0M | R$ 120k/mês |
| VOL | R$ 4.0M | R$ 95k/mês |
| LAT | R$ 4.0M | R$ 95k/mês |
| ZAG | R$ 3.8M | R$ 90k/mês |
| GK  | R$ 4.0M | R$ 90k/mês |

### 6.7 coachEngine.ts — Técnicos NPC (QA F-01)

Calibrado: ~3.7 demissões de bots/temporada; bônus λ máximo ±0.05 mantém a média
de gols em 2.5–3.0 (`scripts/test-coach.js`).

```typescript
generateInitialCoaches(playerClubId) // 19 técnicos (reputação pela força do clube) + 6 no mercado livre
processCoachRound(coaches, standings, round, season, playerClubId)
// pressão: 6+ posições abaixo do esperado → 5 rodadas seguidas = demissão
// (proteção: 5 rodadas no cargo; liga só demite a partir da rodada 6)
// playerClubId: o clube do jogador é pulado no laço de contratação — sem ele, como
// nunca há Coach com o clubId do jogador, a liga contratava um NPC para ele (R-18)
coachLambdaBonus(reputation)         // (rep − 3) × 0.025 → 5★ +0.05 · 1★ −0.05
calcPlayerReputation(seasons)        // 1–5★: base 2 · título +1 · G4 +0.5 · Z4 −0.5
buildPlayerOffers(rep, excludeClub)  // até 3 clubes cuja força aceite a reputação
minReputationForForce(force)         // ≥75: 4★ · ≥68.5: 3★ · ≥61: 2★ · <61: 1★
```

**Bônus de λ**: aplicado nos três lugares — partida do jogador (`prepareMatch`, usando
a reputação do jogador para o clube dele), jogos bot×bot (`nextRound`) e nada mais.

**Fluxo de demissão do jogador (Premium)**: modal de demissão ganha botão
"Ver Propostas" → `useCoachStore.generateOffers` → Central de Emprego lista até 3
clubes compatíveis → `switchClub(clubId)` assume o novo clube na mesma temporada
(novo contrato/orçamento/confiança, elenco reiniciado, técnico NPC vai ao mercado).
No Free, demissão continua sendo fim de carreira.

### 6.8 calendarEngine.ts

Distribui competições em 52 semanas com máx. 2 jogos/semana.

**Regras de prioridade:**
1. Internacionais têm prioridade máxima (janela fixa)
2. Nacionais (CDB, CNOR) com janela fixa
3. Estadual (PAUL) com janela fixa
4. Brasileirão preenche as semanas restantes (flexível)

```typescript
buildCalendar(competitionIds, options)  // gera calendário completo
buildSPFCCalendar()                     // calendário pré-configurado para SPFC
calcStats(calendar)                     // totais por competição, semanas duplas
```

---

## 7. Stores (Estado Global)

Todos os stores usam **Zustand com `persist`** → `localStorage`. A versão (`:version`) garante migração limpa ao alterar o schema.

### 7.1 useMatchStore (`glfoot-match` — não persiste)

Estado central da carreira e da partida ao vivo.

| Campo | Tipo | Descrição |
|---|---|---|
| `myClubId` | `string \| null` | Clube selecionado |
| `coachName` | `string` | Nome do técnico |
| `coachNationality` | `string` | Nacionalidade do técnico |
| `season` | `number` | Temporada atual (1–15) |
| `round` | `number` | Rodada atual (1–38) |
| `standings` | `StandingRow[]` | Classificação ao vivo |
| `matchHistory` | `HistoryRow[]` | Resultados da temporada |
| `contractGoal` | `ContractGoal \| null` | Meta assinada no contrato |
| `initialBudget` | `number` | Orçamento inicial calculado |
| `screen` | `'select' \| 'hub' \| 'match'` | Tela atual |

**Ações principais:**
- `selectClub()` — inicia nova carreira, calcula orçamento, reseta todos os stores
- `prepareMatch()` — pré-calcula gols via Poisson e agenda minutos
- `tick()` — avança 1 segundo de jogo; credita bilheteria ao fim
- `nextRound()` — avança rodada, simula bots, aplica fadiga, desconta salários
- `closeSeasonEnd()` — fecha a temporada: registra o histórico, regenera os fixtures
  (sorteio novo) e volta **direto ao hub** na temporada seguinte. Elenco, orçamento,
  estádio, técnicos NPC e confiança são preservados (mesma carreira).

**SeasonEndOverlay:** o envelhecimento (`applyAging`, estocástico) é calculado **uma única
vez** por sessão do overlay (`useMemo` em `[visible, season]`, num `Map` por `playerKey`)
e o MESMO snapshot é usado para exibir (fases Evolução/Contratos) e para aplicar ao elenco —
senão o valor mostrado divergiria do salvo (R-14). A dispensa é identificada por
`playerKey` (name+num), não por `num` puro, que colide após contratações trazerem jogadores
de outros clubes com o mesmo número (R-13).

**Persistência (`glfoot-career` v1):** `screen: 'match'` nunca é gravado (persiste
`'hub'` — F5 no meio da partida volta ao hub e a rodada é re-disputada, pois o estado
da partida ao vivo é transitório). No `onRehydrateStorage`, saves com `round > 38`
reabrem o `seasonEndVisible` para não travar o fechamento da temporada; o callback
**muta o `state` diretamente** (referenciar `useMatchStore` ali lança TDZ e aborta
a hidratação). A gravação usa um **storage com throttle** (`throttledStorage`, máx.
1 escrita/s — o persist dispara em todo `set()`, inclusive a cada tick da partida)
com flush em `beforeunload`/`pagehide`, então F5/fechar aba não perde estado.

### 7.2 useFinanceStore (`glfoot-finance` v1)

| Campo | Tipo | Descrição |
|---|---|---|
| `budget` | `number` | Saldo atual em R$ |
| `transactions` | `FinanceTransaction[]` | Últimas 200 transações |

**Categorias de transação:** `bilheteria` · `salarios` · `transferencia` · `expansao` · `premio` · `outro`

**Fluxo automático:**
- +Bilheteria: ao fim de cada jogo em casa (`tick()` → minuto 90)
- −Salários: a cada 4 rodadas (`nextRound()`)
- −Expansão: ao iniciar obra no estádio
- Reset: ao iniciar nova carreira (`selectClub()`)

### 7.3 useStadiumStore (`glfoot-stadium` v1)

Persiste estado do estádio entre sessões.

| Campo | Tipo |
|---|---|
| `currentCapacity` | `Record<stadiumId, number>` |
| `tierPrices` | `Record<stadiumId, Record<tierName, price>>` |
| `completedStages` | `Record<stadiumId, number[]>` |
| `inProgress` | `Record<stadiumId, { stage, weeksLeft } \| null>` |

### 7.4 useConfidenceStore (`glfoot-confidence` v1)

| Campo | Tipo | Inicial |
|---|---|---|
| `diretoria` | `0–100` | 70 |
| `torcida` | `0–100` | 65 |
| `isFired` | `boolean` | false |
| `firedBy` | `'diretoria' \| 'torcida' \| 'pressao_combinada' \| null` | null |

**Níveis de pressão:**
- Diretoria: Normal >40 · Alerta 23–40 · Crítico ≤22
- Torcida: Normal >35 · Alerta 19–35 · Crítico ≤18

**Condições de demissão:**
- Qualquer medidor = 0 → imediato
- Diretoria crítica por 3 rodadas consecutivas
- Torcida crítica por 2 rodadas consecutivas
- Ambos abaixo de 35 simultaneamente

As funções de confiança fazem `if (isFired) return` (medidores congelam após a demissão).
`clearFired()` (botão "Continuar (debug)" do FiredModal) desfaz a demissão **e** levanta os
medidores acima do alerta (`diretoria≥45`, `torcida≥40`, alertRounds zerados) — só limpar a
flag os deixaria congelados e a rodada seguinte re-demitiria (R-17).

### 7.5 useTransferStore (`glfoot-transfers` v1)

Controla quais jogadores estão listados para venda/empréstimo.  
Chave: `${clubId}_${playerNum}`. `selectClub` chama `clearAll()` para que listagens de
uma carreira anterior não vazem para a nova.

### 7.6 useLineupStore (`glfoot-lineup` v2)

Escalação atual: 11 slots titulares + banco. Suporta drag-and-drop e substituições.

**v2 persiste `slots` e `bench`** (antes só `formation`) — fadiga, lesões, envelhecimento
e jogadores contratados sobrevivem ao reload. Migração de v1 zera slots/bench (o `init()`
do ManagerHub reconstrói do JSON do clube). `selectClub` **sempre** limpa o lineup: ele
só é alcançado em carreira genuinamente nova (a virada de temporada não passa mais pelo
ClubSelect — o elenco envelhecido segue direto para a temporada seguinte).

**Guard de reconstrução (R-16):** o mount do ManagerHub só reconstrói do JSON quando NÃO
há elenco salvo em lugar nenhum (`slots` vazios **E** `bench` vazio). Olhar só os slots
reconstruía ao dispensar os 11 titulares — apagando os contratados (que vivem no banco) e
ressuscitando os dispensados. Os contratados são adicionados ao `bench` (`executeTransfer`).

**JOGAR exige escalação completa (R-15):** `getLineupForMatch()` filtra os slots `null`, então
uma escalação incompleta entraria em campo com menos de 11. O botão JOGAR fica desabilitado
(com aviso) e `handleJogar` bloqueia quando `slots.length === 0 || slots.some(p => !p)` — além
do bloqueio por jogador lesionado (G-02).

### 7.7 useCoachStore (`glfoot-coaches` v1)

Técnicos NPC, mercado livre, notícias de movimentação (últimas 30) e propostas
pendentes para o jogador demitido. `processRound` é chamado pelo `nextRound`;
carreiras antigas ganham técnicos via backfill no mount do ManagerHub.

Na virada de temporada, `closeSeasonEnd` chama `onSeasonTurnover()` para zerar
`hiredRound`/`pressure` de todos os técnicos **e limpar `news`** — sem isso, quem foi
contratado no fim da temporada ficaria protegido pela janela de graça (`GRACE_ROUNDS`) a
temporada seguinte inteira, e as movimentações da temporada anterior vazariam para a nova
(a UI mostra só "R{round}", sem temporada — R-19). Os ids de técnicos cunhados em runtime
derivam de `max(ids)+1` sobre a lista existente (não de um contador módulo-level, que
reiniciaria no reload e colidiria com os coaches persistidos).

### 7.8 useAuthStore (`glfoot-auth` v1)

Usuário autenticado (`id`, `email`, `nickname`, `plan: 'free' | 'premium'`) e token JWT.
É o único store **global ao browser** — guarda quem está logado.

### 7.9 userScope — isolamento da persistência por usuário (R-10)

`src/stores/userScope.ts` namespaceia os 7 stores de jogo por `userId`, para que dois
usuários na mesma máquina não compartilhem nem sobrescrevam a carreira um do outro.
Cada store grava em `glfoot-<store>::u_<id>` (ex.: `glfoot-career::u_42`); deslogado
usa um escopo descartável `::u_guest`.

Como a chave só é conhecida **depois** do login, os 7 stores usam `skipHydration: true`
(ficam nos defaults no import) e a hidratação é dirigida por `initUserScope()`, chamado
no `main.tsx` **antes do render**. A cada login/logout (via `subscribe` no `useAuthStore`)
o `syncUserScope(userId)`: (1) re-aponta a chave de cada store (`persist.setOptions`),
(2) zera a memória para os defaults — senão um usuário novo veria os dados do anterior,
pois o `rehydrate` faz *merge* e não limparia as chaves ausentes — e (3) re-hidrata o
save do usuário. Uma escrita final (`setState({...getState()})`) faz a persistência
convergir para o estado atual: sem ela, a gravação adiada do throttle do `glfoot-career`
poderia assentar o `initial` do reset sobre o save recém-restaurado.

**Migração:** o primeiro usuário a logar adota os saves antigos sem namespace (flag
`glfoot-scope-migrated` garante que só ele herde o save compartilhado); os originais
ficam órfãos, inócuos.

---

## 8. Dados

### 8.1 Elencos de Clubes (`src/data/clubs/`)

Dois clubes completos:
- **São Paulo FC** (`spfc.json`) — 16 jogadores com todos os campos
- **Palmeiras** (`palmeiras.json`) — 16 jogadores com todos os campos

18 clubes bot existem apenas como `StandingRow` no `useMatchStore` (sem elenco JSON).

**Schema obrigatório por jogador:**
```json
{
  "name": "Calleri",
  "num": 9,
  "age": 31,
  "pos": "ATA",
  "posLabel": "ATA",
  "spec": "FI",
  "spec2": "VE",
  "foot": "D",
  "nationality": "ARG",
  "forca": 79,
  "forcaBase": 79,
  "potencial": 82,
  "potencialVisto": 79,
  "moral": 75,
  "fatigue": 0,
  "fieldPos": [50, 15],
  "lastNotes": [],
  "matchesPlayed": 0,
  "injured": false,
  "contractYearsLeft": 2,
  "gp": 0,
  "assists": 0
}
```

### 8.2 Estádios (`stadiums.ts`)

20 estádios catalogados com:
- Capacidade real (2024), capacidade máxima pós-expansão
- 3 tiers de ingresso: Popular · Cadeira · Camarote
- 3 estágios de expansão (máx +25%)
- Foto via Wikimedia Commons (`Special:FilePath`)

### 8.3 Força dos Clubes (`clubStrength.ts`)

**Não existe mais sistema de Tiers (S/A/B/C).** A força de um clube é a **média dos
atletas** (elenco + banco) — é ela que baliza metas contratuais, orçamento, convites a
técnicos, transferências e empréstimos.

```typescript
interface ClubStrengthEntry {
  id:       string     // só identidade — a força vem do elenco
  name:     string
  division: 1 | 2 | 3
}

clubForce(id, override?)   // = avgSquad([...squad, ...bench]); fallback 60 se id desconhecido
forceBand(force)           // 'S' | 'A' | 'B' | 'C' — INTERNO, a letra nunca vai à UI
forceLabel(force)          // 'Elite Nacional' | 'Grande Clube' | 'Clube Médio' | 'Clube Pequeno'
isAvailableOnFree(id)      // clubForce(id) < FORCE_BANDS.A — SEMPRE sem override
```

O `override` é o **elenco vivo** do clube do jogador (`useLineupStore`: slots + bench) —
é o que torna a força dinâmica com transferências, lesões e envelhecimento. Os 19 bots
não têm elenco vivo: a força deles sai do JSON (`clubForce` sem override).

**Base de cálculo = elenco + banco**, nunca só o XI — senão o técnico mexeria no próprio
gating apenas reordenando a escalação. (O λ do `matchEngine` continua usando `avgSquad`
do XI: força **em campo** e força **institucional** são medidas diferentes de propósito.)

Faixas (`FORCE_BANDS`, implementação interna): **S** ≥75 · **A** ≥68.5 · **B** ≥61 · **C** <61.
Limiares validados em `scripts/test-force-bands.js` (plugado no `npm run test:engine`):
reproduzem 20/20 os tiers que existiam antes.

| Faixa | Força | Rótulo na UI | Clubes |
|---|---|---|---|
| S | ≥ 75 | Elite Nacional | Flamengo 77.6 · Atlético-MG 76.0 |
| A | ≥ 68.5 | Grande Clube | Palmeiras 73.4 · Botafogo 72.3 · SPFC 71.8 · Internacional 71.4 · Cruzeiro 70.9 · Corinthians 70.2 · Grêmio 69.6 |
| B | ≥ 61 | Clube Médio | Athletico-PR 67.4 · Fortaleza 67.0 · Bragantino 66.6 · Vasco 65.6 · Santos 64.8 · Bahia 64.5 |
| C | < 61 | Clube Pequeno | Goiás 57.7 · América-MG 54.9 · Ceará 54.7 · Sport 53.6 · CSA 51.8 |

### 8.4 Metas e Orçamento (`clubGoals.ts`)

```typescript
interface ContractGoal {
  primary:        GoalType   // 'champion' | 'top4' | 'top8' | 'no_relegation' | 'survive'
  secondary:      GoalType   // meta bônus
  minPosition:    number     // posição mínima aceitável
  label:          string
  secondaryLabel: string
}

getContractGoal(forca)   // 1 parâmetro: a faixa sai de forceBand (fonte única)

// Orçamento inicial por força:
// budget = 10_000_000 × (forcaMedia / 75)^2.5
// Arredondado a R$500k | Min R$500k | Max R$15M
```

Meta e orçamento saem os dois da **força** (`GOALS_BY_BAND` indexado por `forceBand`).
Não há faixa 'D': nenhum clube cai nela.

| Faixa | Força | Meta primária | Orçamento inicial |
|---|---|---|---|
| S (Elite Nacional) | ≥ 75 | Ser Campeão Brasileiro | R$10M–11M |
| A (Grande Clube) | ≥ 68.5 | Terminar entre os 4 primeiros | R$8.5M–9.5M |
| B (Clube Médio) | ≥ 61 | Terminar entre os 8 primeiros | R$7M–7.5M |
| C (Clube Pequeno) | < 61 | Não ser rebaixado | R$4M–5M |

---

## 9. Páginas & Componentes

### AuthScreen
Login e registro via API Railway. Em desenvolvimento local: auth mockado via `localStorage`.

### ClubSelect
Tela de nova carreira em duas colunas:
- **Esquerda:** Ligas nacionais (checkbox) · Competições regionais (tags) · **Proposta de Contrato** (mostra rótulo + força, meta, orçamento, confiança inicial)
- **Direita:** Seleção nacional · Escolher clube · Dados do técnico · Botão Iniciar

**Nenhum clube vem pré-selecionado** (`selectedId` inicia vazio): a coluna esquerda
mostra um placeholder ("Escolha um clube…") e o botão Iniciar fica desabilitado até o
técnico escolher um clube (ou marcar o sorteio). Só então a Proposta de Contrato aparece,
para o clube escolhido. O badge do clube mostra rótulo + força ("Grande Clube · 71.8").
O dropdown filtra pelo plano (Free = força < 68.5; Premium = todos).

### ManagerHub
Hub principal com sidebar de 48px e área de conteúdo. Atalhos: F4 Jogos · F5 Tabelas · F6 Estádios · F8 Mercado.

**Banner superior (sempre visível):**
- Meta contratual + medidores de confiança Diretoria/Torcida com cor por nível

**Modal de demissão:** aparece quando `isFired = true`. Mensagem diferente por causa (Diretoria / Torcida / Pressão Combinada).

### Match
Partida ao vivo com:
- Campo SVG + discos de jogadores com posicionamento real. **Ambos os times são
  posicionados pela formação no `prepareMatch`** (casa na metade esquerda, visitante
  espelhado na direita) — os clubes bot gerados têm `fieldPos [0,0]` no JSON e, sem
  isso, o adversário empilhava no canto e "sumia".
- Banco drag-and-drop para substituições (máx 3/time)
- **Tela de Ajustes Táticos** (`MatchAdjustments`): abre pelo botão ⚙ AJUSTES do
  Scoreboard (com o jogo pausado) ou pelo "FAZER AJUSTES" do intervalo. Mostra só o
  meu time — seletor de formação (troca reposiciona o elenco via `changeMyFormation`),
  campo com clique-para-selecionar e banco de reservas para substituir. "▶ Voltar ao
  Jogo" (`closeAdjustments`) aplica e retoma a partida. `toggleRun` fica travado
  enquanto a tela está aberta (`adjustingVisible`).
- Timer real com velocidades 1× · 1.5× · 2× (1.5× e 2× bloqueados no Free)
- Gols pré-agendados via Poisson (invisíveis ao jogador)
- Eventos laterais aleatórios (faltas, cartões, VAR)
- Overlay de gol + tela de vitória

### CalendarView
Duas abas:
- **Calendário Completo:** grade 3×4 de meses, chips filtráveis por competição (todos selecionados = calendário completo), marcador de semana atual com badge "AGORA"
- **Jogos do [Time]:** lista de próximos jogos com semana, badge de competição, fase e `TIME × ???` (adversário a definir)

### StadiumView
Duas abas:
- **Bilheteria:** previsão de renda, seletor de tipo de jogo (Normal/Clássico/Final), sliders de preço por categoria, flutuação de público via PRNG determinístico
- **Expansão:** 3 estágios com custo, prazo e breakdown por categoria

**Mini-extrato financeiro** no painel esquerdo com as últimas 6 transações.

### TransferMarket (Mercado)
Tela unificada com:
- **Painel esquerdo:** árvore de ligas (Brasil → Série A/B/C), detalhe do jogador selecionado (abas Info/Carreira), barra de orçamento real
- **Painel direito:** cabeçalho do clube + tabela de jogadores com filtros inline + barra de ações

**Filtros:** nome · posição · característica · força min/max · chips "À venda" / "Empréstimo"

**Regras de transferência:**
- Compra: clube comprador ≥ força do vendedor − 10
- Empréstimo: clube comprador ≥ força do vendedor − 25
- Orçamento: passe + 6× salário mensal

**Histórico de contratações:** o toast de sucesso do `executeTransfer` mostra o valor
pago (`"X contratado por R$ 6.2M · salário R$ 200 mil/mês"`). O botão **📋 Contratações**
abre um modal com todas as contratações **feitas pelo jogador nesta carreira**
(`acquiredPlayers`, que registra `passe`/`salary`/`type`/`season`/`round` — bots não
usam `executeTransfer`): atleta, clube de origem, tipo, passe, salário, quando, e o total
investido em passes. Zera junto com a carreira (`selectClub`/`switchClub`).

---

## 10. Sistema Financeiro

```
Receitas (+)                    Despesas (−)
─────────────────────────────   ─────────────────────────────────
Bilheteria (jogo em casa)       Folha salarial (a cada 4 rodadas)
Prêmios de campeonato [TODO]    Obras de expansão do estádio
                                Transferências (compra) [TODO]
```

**Flutuação de público** (determinística via PRNG mulberry32):

| Tipo de Jogo | Ocupação base | Variação |
|---|---|---|
| Normal | 65% | ±12% |
| Clássico | 90% | ±6% |
| Final | 100% | 0% |

**Detecção de clássicos:** pares pré-definidos em `useMatchStore`:
`spfc×palm`, `atl×cru`, `fla×flu`, `int×gre`, `bot×fla`, `cor×spfc`, `palm×cor`, `bot×vas`

---

## 11. Sistema de Confiança & Demissão

### Eventos que alteram a Torcida

| Evento | Delta |
|---|---|
| Vitória | +4 |
| Empate | +1 |
| Derrota | −5 |
| Vitória no clássico | +10 |
| Derrota no clássico | −14 |
| Goleada sofrida (≥3 gols) | −8 extra |
| Golear adversário (≥3) | +3 |
| Vitória de zebra (força opp −10) | +4 |
| Derrota inesperada (força minha +15) | −4 |
| Fim de temporada — meta cumprida | +12 a +25 |
| Fim de temporada — rebaixamento | −30 |

### Eventos que alteram a Diretoria

| Evento | Delta |
|---|---|
| Vitória | +2 |
| Derrota | −3 |
| Derrota vergonhosa (opp muito mais fraco) | −5 extra |
| Caixa saudável (>80% do inicial) | +1/4rods |
| Caixa crítico (<15% do inicial) | −4/4rods |
| Caixa baixo (<30%) | −2/4rods |
| Fim de temporada — meta cumprida | +10 a +20 |
| Fim de temporada — falha grave | −15 a −35 |

---

## 12. Mercado de Transferências

### Valor de Mercado

```
MV = BASE_POS × (forca/50) × ageFactor × potBonus × starBonus
```

- `ageFactor`: pico em 24–27, declínio acelerado após 33
- `potBonus`: +35% máx para potencial não realizado
- `starBonus`: +30% para a estrela da temporada

### Estrela da Temporada

Algoritmo `calcStarScore`:
- Jogadores de campo: `forca×0.5 + gp×3 + assists×2 + nota_média×4`
- GKs: `forca×0.5 + nota_média×5`

Roda ao fim de cada temporada por liga (TODO: implementar chamada).

### Listings (useTransferStore)

Chave: `${clubId}_${playerNum}`. Persistido no localStorage.  
Pré-populado: 3 jogadores do Palmeiras à venda (Weverton, Rony, Mayke) e 3 para empréstimo (Caio P., Lázaro, Piquerez).

---

## 13. Sistema de Estádios

### 20 Estádios Catalogados

Todos com foto via Wikimedia Commons, capacidade real (2024), tiers e expansões.

### Cálculo de Receita

```
Receita = Σ (assentos_tier × taxa_ocupação × preço_tier)
taxa_ocupação = OCCUPANCY_BASE[tipo] ± variance × seededRandom(seed)
```

Preço multiplicado por tipo: Normal ×1.0 · Clássico ×1.3 · Final ×1.8

### Expansões

3 etapas por estádio, máx +25% da capacidade original:
- Camarote fixo em 7% a cada etapa
- Custo em R$ + prazo em semanas
- Debita o orçamento imediatamente ao iniciar

---

## 14. Calendário da Temporada

**Competições no calendário do SPFC:**

| Sigla | Competição | Jogos |
|---|---|---|
| PAUL | Campeonato Paulista | 11 |
| BRAS | Campeonato Brasileiro | 38 |
| CDB | Copa do Brasil | 7 |
| LIB | CONMEBOL Libertadores | 13 |
| SULA | Copa Sul-Americana | — |
| REC | Recopa Sul-Americana | 2 |
| MUND | Mundial de Clubes | 7 |
| CNOR | Copa do Nordeste | — |

**Semana atual** é derivada do jogo do Brasileirão correspondente à rodada corrente (`gameIndex === round - 1`).

---

## 15. Integrações Externas

### Wikimedia Commons (fotos dos estádios)

URL padrão sem necessidade de hash MD5:
```
https://commons.wikimedia.org/wiki/Special:FilePath/{filename}?width={N}
```

Fallback: emoji 🏟 caso a imagem falhe ao carregar.

### Railway (Backend — Projeto `hearty-caring`)

- `POST /api/auth/login` — retorna `{ user, token }`
- `POST /api/auth/register` — idem
- `GET /api/ranking` — retorna lista de técnicos (mock em desenvolvimento)

**Em desenvolvimento local:** backend offline → auth mockado via `localStorage` injetando `glfoot-auth` diretamente.

### Z-API WhatsApp

Integração planejada para o projeto ViajandoDeVerdade (outro projeto). Não utilizado no GLfoot.

---

## 16. Freemium & Planos

| Feature | Free | Premium |
|---|---|---|
| Velocidade 1× | ✅ | ✅ |
| Velocidade 1.5× e 2× | 🔒 | ✅ |
| Clubes com força < 68.5 (médios e pequenos: Santos, Vasco, Fortaleza, Goiás… — 11 clubes) | ✅ | ✅ |
| Clubes com força ≥ 68.5 (grandes: Flamengo, Palmeiras, SPFC, Corinthians… — 9 clubes) | 🔒 | ✅ |
| Central de Empregos | 🔒 | ✅ |
| Seleção Nacional | 🔒 | ✅ (TODO) |
| Ver pênaltis | ✅ | ✅ |
| Skip pênaltis | 🔒 | ✅ (TODO) |

---

## 17. Limitações Conhecidas

### Dados
- Os **20 clubes** têm elenco jogável (11 titulares + 5 no banco): SPFC e Palmeiras são
  feitos à mão; os outros 18 foram gerados por `scripts/generate-bot-squads.js`.
- Logos reais dos clubes ausentes — apenas SVG gerado pelas cores.
- Calendário hardcoded para o SPFC (`buildSPFCCalendar()`). Outros clubes usam o mesmo calendário.
- Adversários nos jogos ainda são `???` — o calendário não define oponentes.

### Financeiro
- `MY_CLUB_FORCE = 72` ainda hardcoded no TransferMarket (não deriva do elenco real).
- Receita de prêmios por campeonato não implementada.
- Transferências não executam a transação real (não movem jogadores entre elencos).

### Estádio
- Estado do estádio (capacidade, preços) não é resetado entre temporadas.
- "Semanas de obra" não avançam automaticamente com o calendário.

### Lesões
- Lesões de **bots** existem só durante a partida contra o jogador (auto-sub) — não persistem
  entre rodadas (bots não têm estado de elenco; `CLUBS_MAP` é estático).
- Jogos bot×bot no `nextRound` não sorteiam lesões.

### Temporadas
- ~~Fluxo de virada de temporada quebrado~~ **Corrigido**: `closeSeasonEnd` agora vai
  direto ao hub com fixtures regenerados; `selectClub` ficou exclusivo de carreira nova.
- Orçamento faz **carry-over** entre temporadas (não há verba nova por temporada) — a meta
  contratual e o `initialBudget` também não são renovados; o contrato cobre as 15 temporadas.

### Confiança
- `electSeasonStar()` existe no engine mas não é chamada ao fim da temporada.

### Técnicos NPC
- Reputação dos NPCs evolui só por demissão (−1★); títulos de bots ainda não a aumentam.
- Nomes gerados de um pool fictício — podem repetir em carreiras longas.

### Auth
- Backend Railway pode estar offline. Dev local requer mock via `localStorage`.
- Sem refresh token — sessão expira se o token JWT vencer.

### Técnico
- Sem histórico de carreiras anteriores entre novas partidas (reset total ao `selectClub()`).

---

## 18. Backlog / Próximos Passos

### Alta Prioridade
- [ ] Elencos JSON dos 18 clubes bot restantes
- [ ] Lógica de compra/empréstimo: debitar orçamento + mover jogador entre elencos
- [ ] Algoritmo Estrela da Temporada rodando ao fim de cada temporada
- [ ] Tela de Fim de Temporada: resumo, evolução Age Curve, status do contrato
- [ ] Adversários no calendário: gerar fixture completa ao iniciar temporada
- [x] **Mercado sem jogadores à venda/empréstimo** — ✅ **CONCLUÍDO** (14/07): novo
  `marketListingEngine` faz os bots listarem 3 à venda + 2 por empréstimo cada
  (60/40 globais), com rotatividade por rodada e re-sorteio na virada. Seleção por
  rank top-N torna o "nunca vazio" uma invariante estrutural. Corrigido junto um bug
  de reatividade: o `TransferMarket` assinava `s.isForSale` (seletor de FUNÇÃO, ref
  estável) e nunca re-renderizava com listagem nova.

- [ ] ⚠️ **#38 — Rebalancear bilheteria × folha salarial** (achado ao verificar #30/#31;
  **os dois fluxos FUNCIONAM** — o problema é de balanceamento, não de execução).
  Medido no browser (SPFC, T1): em 4 rodadas a bilheteria somou **R$ 12,46M** contra
  **R$ 2,36M** de folha, e o caixa foi de R$ 9,5M → R$ 16,8M. Projeção da temporada:
  ~R$ 102M de bilheteria contra ~R$ 21M de folha (**4,8×**), fechando a T1 com ~9,5× o
  orçamento inicial. Consequências: (a) o desconto de salário é **economicamente
  irrelevante** — é isto, mais que a falta de UI, que tornava o efeito "invisível";
  (b) o `onFinanceCheck` usa `budget/initialBudget` e a partir da rodada ~4 o ratio já
  é ~2, então os branches de punição da diretoria (`<= 0.15` / `<= 0.30`) viram
  **código morto**; (c) o gate de orçamento do `checkTransferEligibility` vira no-op a
  partir da rodada ~6. Alavancas sugeridas (aditivas): mando dividido (visitante leva
  10%), custo operacional por jogo em casa (~15%, categoria nova), impostos (~12%) —
  isso corta ~35% e ainda sobra fator ~3; o resto tem que vir de preço base ou
  ocupação base. Nota honesta: parte do desequilíbrio é o **elenco de 16** (real tem
  25-30), não só a bilheteria alta. **⚠ Fórmula de engine: exige teste de mesa.**
- [ ] ⚠️ **#39 — Elasticidade preço × público (exploit)** — `calcTicketRevenue`
  (`stadiums.ts`) calcula a ocupação SÓ pela importância do jogo e aplica os
  `customPrices` depois: **subir o preço não reduz o público**. Com os sliders no
  máximo a temporada vai de ~R$ 102M para ~R$ 320M (**3,14×**) com público
  **idêntico** — estratégia dominante e sem downside. Proposta: fator multiplicativo
  `clamp(1 - k*(preço/preçoBase - 1), 0.35, 1.15)` com k≈0.45 por setor, aplicado
  antes do `Math.min(1.0, ...)`. Com k=0.45, dobrar o preço tira ~45% do público →
  receita quase neutra e o ótimo fica perto do preço base. **⚠ Exige teste de mesa.**
- [ ] **#40 — Premiação por posição/título** — a categoria `'premio'` existe no
  `useFinanceStore` e tem ícone 🏆, mas o grep confirma que `addIncome` só é chamado
  em UM lugar do código (bilheteria): **premiação nunca existiu**. Sem ela o extrato
  nasce com receita de item único. Sugestão escalonada pela posição no Brasileirão
  (campeão R$ 45M · 2º-4º R$ 25M · 5º-8º R$ 12M · 9º-16º R$ 6M · Z-4 R$ 2M), lançada
  no `closeSeasonEnd` antes do `set({season: nextSeason})`. **Atenção: isto PIORA o
  #38** — tratar os dois juntos, não isoladamente.

### Médio Prazo
- [x] `MY_CLUB_FORCE` derivado do elenco real em TransferMarket — ✅ **CONCLUÍDO** (`efe63db`):
  `clubForce(myClubId, myRoster)`. Antes saía do JSON estático, então comprar um craque não
  mexia na própria força — que é justamente o balizador das transferências.
- [ ] Confiança da Torcida: eliminação precoce de copa → penalidade
- [ ] Sistema de negociação: fazer oferta → resposta do clube (aceitar/recusar/contraproposta)
- [ ] **Reformular sistema de EMPRÉSTIMOS** (custo + limite + regra de divisão + luva).
  **Especificação FECHADA (14/07) — pronta para uma rodada de implementação.**
  Hoje: reserva de 3 meses de salário, elegibilidade só por força (`força ≥ vendedor − 25`),
  sem limite por temporada, e a UI só mostra o custo da COMPRA (o aviso vermelho "passe + 6
  meses" é do `buyEligibility`); o empréstimo nunca exibe o próprio custo antes de confirmar.
  Mudanças decididas:
  - **UI:** mostrar o custo do empréstimo no rodapé/tooltip do botão (reserva de **6 meses** de
    salário + salário/mês + luva quando houver), do mesmo jeito que a compra já mostra.
  - **Reserva:** subir de **3 → 6 meses** de salário (`executeTransfer`, `useMatchStore` ~960:
    `sal * 3` → `sal * 6`, e a checagem/texto correspondentes).
  - **Limite de 3 empréstimos por temporada** — contador que zera na virada de temporada
    (`onSeasonTurnover`), namespacado por usuário (R-10); bloquear o 4º com mensagem clara.
  - **Regra de divisão (substitui o gap de 25):** empréstimo **na mesma divisão** (A→A, B→B,
    C→C) usa só o mecanismo padrão (reserva de 6 meses). Empréstimo de **divisão superior para
    inferior** (ex.: clube da Série B pegando jogador da Série A) exige uma **luva** paga ao
    atleta — e esse dinheiro **some** (sink: não vai para o clube cedente nem para lugar nenhum;
    objetivo é dificultar clube pequeno acumular atleta muito forte pagando pouco). Fonte do
    dado: `division: 1|2|3` em `clubStrength.ts`. Empréstimo de divisão inferior→superior
    (clube grande pegando jogador de série menor): sem luva (gap ≤ 0). **A definir:** se remover
    de vez o gate de força intra-divisão ou manter um teto.
  - **Algoritmo da luva (proposta a CALIBRAR e testar):**
    `luva = K × forcaJogador × (1 + excedente/10)² × gapDivisao`, onde
    `excedente = max(0, forcaJogador − forçaMédiaDoMeuClube)`,
    `gapDivisao = divComprador − divVendedor` (≥1; 0 ⇒ sem luva), `K ≈ 10.000` (ajustar).
    O termo `(1+excedente/10)²` é o coração: quanto mais o atleta supera a média do SEU elenco,
    mais cara a luva, em curva acelerada (clube fraco pegando monstro paga fortuna; clube já forte
    pega o mesmo jogador barato). Ex.: força-78 num clube força-média-55 (gap 1) ≈ R$ 8,5M;
    o mesmo jogador num clube força-68 ≈ R$ 3,1M; força-85 num clube força-50 vindo p/ Série C
    (gap 2) ≈ R$ 34M. Implementar como despesa categoria `luva` (débito no orçamento, sem
    crédito). **Bloquear se saldo insuficiente para a luva** (igual à compra — decidido).
  - **Trava de adversário do dia (anti-exploit, decidido):** dois clubes que se enfrentam numa
    data **não podem comprar/emprestar jogadores entre si** naquele dia (ex.: no dia de
    SPFC × CSA pela Copa do Brasil, nem SPFC nem CSA transacionam um com o outro). Vale para
    compra E empréstimo. Fonte: fixture/calendário do dia (`clubCalendar`/fixtures da rodada);
    bloquear no `TransferMarket` quando `fromClubId` for o adversário do jogo daquela data.
  - **Empréstimo de divisão inferior→superior (clube grande pegando de série menor): sem luva**
    (gap ≤ 0) — decidido.
  - **Luva intra-divisão por excedente (decidido):** também há luva na mesma divisão (gap 0),
    mas **suave e só quando se puxa alguém acima da média do próprio elenco** —
    `luvaIntra = K_intra × forca × (excedente/10)²`, só quando `excedente ≥ 8` (abaixo, reforço
    "no seu nível", **livre**); `K_intra ≈ 4.000` (< `K = 10.000` do cross). Ex.: reforço no
    nível (exc 4) = livre; CSA força-52 pegando craque força-78 (exc 26) ≈ R$ 2,1M. (Teto duro
    descartado — a filosofia é encarecer, não proibir.)
  - **Luva ancorada na FORÇA (decidido):** fórmula `K × forca × (1+exc/10)² × gap` (variante
    ancorada no passe **descartada**). Racional: emprestar um jovem e ele voltar depois é rotina
    de clube — não se pune por idade/potencial; o que não pode é ceder um atleta forte a custo
    baixo, e a força já captura isso diretamente.
  - **Toca:** `marketEngine.ts` (`checkTransferEligibility` — nova lógica de divisão/luva + `calcLuva`),
    `useMatchStore.executeTransfer` (reserva 6m, luva-sink, contador de empréstimos),
    `TransferMarket.tsx` (rodapé/tooltip com custo real + trava de adversário do dia). **⚠ Ao
    implementar, testar no browser:** mesma divisão, cross-division com luva, estouro do limite de
    3, trava de adversário do dia, e o débito correto no orçamento.
- [ ] Central de Empregos funcional (Free: bloqueado, Premium: ativo)
- [ ] Calendário dinâmico baseado no clube/estado do técnico (atualmente fixo SPFC)
- [ ] Prêmios financeiros por posição final e conquistas
- [ ] **Indicador de posição (1 letra) nos discos DURANTE a partida** — no campo
  (`PlayerDisc`), na tela de Ajustes Táticos (`MatchAdjustments`) e no banco
  (`BenchZone`), para facilitar as substituições ao vivo. Só a inicial da posição
  (G/L/Z/V/M/A), diferente do badge de 2-3 letras do pré-jogo (GK/ZAG/VOL/MEI/ME/ATA).
- [ ] **Escudo do clube (`ClubCrest`) em vez da camisa/cores (`Shirt`) na UI** — usar o
  emblema do clube, como já é no ClubSelect/Mercado, em: o **placar da partida**
  (`Scoreboard`, hoje `Shirt` + nome) e o **topo da sidebar do hub** (`IconSidebar` em
  `ManagerHub`, linha ~240, hoje `Shirt colors=myClub.colors`). Conferir também
  `CoachesView` (usa `Shirt` na lista) — avaliar se troca lá também.
- [x] **Verificar + expor o fluxo financeiro** — ✅ **CONCLUÍDO** (14/07).
  **(a) Verificação:** os dois fluxos **FUNCIONAM** — a suspeita de que estivessem
  quebrados foi refutada. Medido no browser (SPFC, T1): bilheteria lançada só em jogo
  em casa (`R4 +R$ 6,43M — SPFC 0×0 SAN`) e folha descontada a cada 4 rodadas
  (`R4 −R$ 2,36M — Folha salarial mês 1`), valor que bate com a soma de `calcSalary`
  dos 16 atletas. Reconciliação conferida: `9,5M inicial + 12,46M receitas −
  5,18M despesas = 16,78M` = saldo real.
  **(b) Exposição:** nova tela **`FinanceView`** (Extrato Financeiro, ícone 💰,
  atalho F7): saldo, receitas/despesas/resultado da temporada, barras por categoria,
  seletor de temporada, chips de filtro e a tabela por rodada (Rodada · Categoria ·
  Descrição · Valor · Saldo).
  **Fixes de dados junto:** `addExpense` não clampa mais o saldo em zero (o
  `Math.max(0, …)` zerava o saldo mas registrava o valor cheio — o extrato não fechava
  e a folha saía de graça para quem estava quebrado; dívida agora é um estado
  legítimo); teto do histórico 200 → 2000 (200 engolia a T1 antes do fim); `CAT_LABEL`
  virou fonte única no `useFinanceStore` (o `StadiumView` tinha uma cópia local sem a
  categoria `luva`, que apareceria com ícone genérico).
  **O que a verificação REVELOU** (itens #38/#39/#40 na Alta Prioridade): o efeito era
  invisível não só por falta de UI — a bilheteria é ~4,8× a folha, o que torna o
  salário economicamente irrelevante.
- [ ] **Tela de Tabelas com todas as competições** — hoje `StandingsScreen` é fixa no
  Brasileirão (`<Standings />`). Adicionar um seletor das competições do clube
  (`CLUB_COMPETITIONS`/`clubCalendar`: estaduais, Copa do Brasil, Libertadores/Sula,
  etc.), mostrando a de liga como classificação e as de copa como chaveamento
  (Mata-Mata). Deve ser possível ver **qualquer** competição mesmo já eliminado
  (`cupStatus` só marca ativo/eliminado — falta guardar o chaveamento/resultados das
  copas para exibir).
- [x] **Remover o sistema de Tiers (S/A/B/C)** — ✅ **CONCLUÍDO** (commit `efe63db`). A força
  do clube agora é a **média dos atletas** (elenco + banco) e é o único balizador de metas,
  orçamento, convites a técnicos, transferências e empréstimos. `ClubStrengthEntry` perdeu
  `tier` e `forcaMedia` (só `id`/`name`/`division`); `clubForce(id, override?)` calcula a
  força; `FORCE_BANDS` (75 / 68.5 / 61) + `forceBand()` ficaram como implementação interna
  e `forceLabel()` dá o rótulo que o jogador lê. `MIN_REPUTATION_BY_TIER` →
  `minReputationForForce(force)`; `GOALS_BY_TIER` → `GOALS_BY_BAND` com
  `getContractGoal(forca)` de 1 parâmetro; `TIER_FORCE_ESTIMATE` (código morto) e a faixa
  'D' (vazia) foram deletados. `scripts/test-force-bands.js` prova 20/20 que as faixas
  reproduzem os tiers antigos. **Escopo entregue:** força viva só para o **clube do
  jogador** (via `override` = elenco do `useLineupStore`) — os 19 bots seguem o elenco do
  JSON. Persistir os 20 elencos ficou como backlog novo (item abaixo).
- [ ] **Elencos dos bots dinâmicos (persistir os 20 elencos no save)** — hoje só o clube do
  jogador tem elenco vivo. Comprar um craque do Santos **fortalece o meu clube mas não
  enfraquece o Santos**: o elenco do bot reverte ao JSON, então a força dele (e a meta, a
  reputação mínima do técnico, a posição esperada na tabela) fica congelada como se o atleta
  nunca tivesse saído. O mesmo vale para envelhecimento e lesões dos bots. **Ponto de
  extensão já pronto:** `clubForce(id, override?)` — basta o save guardar o elenco de cada
  clube e passar como `override`; as faixas, metas e o gating saem de graça. ⚠ `isAvailableOnFree`
  deve continuar **sem override** (o gating Free/Premium não pode oscilar com transferências).
  **Colide com** o item "Mercado sem jogadores à venda/empréstimo" (Alta Prioridade): quando os
  bots gerarem listagens, os dois passam a mexer no mesmo elenco — decidir a ordem e o dono do
  estado. **Custo:** multiplica o save por ~20 (hoje só 1 elenco) — avaliar formato
  (delta contra o JSON em vez de elenco inteiro?) antes de implementar.

### Longo Prazo
- [ ] Logos reais dos 20 clubes em `/public/assets/crests/{short}.png`
- [ ] Backend Railway: auth JWT real + ranking online persistido
- [ ] Modo Online: Socket.io para partidas multiplayer
- [ ] Ligas internacionais: Espanha, Inglaterra, Alemanha
- [ ] Exportar save para arquivo (Electron)

---

*Documento gerado em Junho 2026 · GLfoot v0.1.0*
