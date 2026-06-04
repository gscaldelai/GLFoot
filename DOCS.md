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
                                       ├─ Tabelas (placeholder)
                                       ├─ Técnicos (placeholder)
                                       ├─ História (placeholder)
                                       └─ Central de Emprego (placeholder)
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
│   └── test-agecurve.js       ← validação do Age Curve (75 temporadas)
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
    │   ├── clubStrength.ts    ← força média e tier por clube
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
    │   └── TransferMarket.tsx ← mercado de transferências unificado
    │
    ├── components/
    │   ├── Campo.tsx          ← campo SVG com posicionamento dos discos
    │   ├── PlayerDisc.tsx     ← disco do jogador (camisa, número, força)
    │   ├── BenchZone.tsx      ← banco de reservas com drag-and-drop
    │   ├── Scoreboard.tsx     ← placar, cronômetro, velocidade
    │   ├── EventsPanel.tsx    ← log de eventos da partida
    │   ├── GoalOverlay.tsx    ← animação de gol
    │   ├── VictoryOverlay.tsx ← tela de fim de jogo
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

### 6.4 forceEngine.ts — Força Online

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

### 6.5 marketEngine.ts — Valores e Mercado

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

### 6.6 calendarEngine.ts

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

### 7.5 useTransferStore (`glfoot-transfers` v1)

Controla quais jogadores estão listados para venda/empréstimo.  
Chave: `${clubId}_${playerNum}`.

### 7.6 useLineupStore

Escalação atual: 11 slots titulares + banco. Suporta drag-and-drop e substituições.

### 7.7 useAuthStore (`glfoot-auth` v1)

Usuário autenticado (`id`, `email`, `nickname`, `plan: 'free' | 'premium'`) e token JWT.

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

```typescript
interface ClubStrengthEntry {
  id:         string
  forcaMedia: number   // 40–80
  tier:       'S' | 'A' | 'B' | 'C'
  division:   1 | 2 | 3
}
```

Tiers: **S** 75+ · **A** 68–74 · **B** 58–67 · **C** <58

### 8.4 Metas e Orçamento (`clubGoals.ts`)

```typescript
interface ContractGoal {
  primary:        GoalType   // 'champion' | 'top4' | 'top8' | 'no_relegation' | 'survive'
  secondary:      GoalType   // meta bônus
  minPosition:    number     // posição mínima aceitável
  label:          string
  secondaryLabel: string
}

// Orçamento inicial por força:
// budget = 10_000_000 × (forcaMedia / 75)^2.5
// Arredondado a R$500k | Min R$500k | Max R$15M
```

| Tier | Força | Orçamento inicial |
|---|---|---|
| S (Elite) | 78 | ~R$12M |
| A (Grande) | 73 | ~R$9.5M |
| B (Médio) | 63 | ~R$5.5M |
| C (Pequeno) | 52 | ~R$3M |
| D (Acesso) | 43 | ~R$1.5M |

---

## 9. Páginas & Componentes

### AuthScreen
Login e registro via API Railway. Em desenvolvimento local: auth mockado via `localStorage`.

### ClubSelect
Tela de nova carreira em duas colunas:
- **Esquerda:** Ligas nacionais (checkbox) · Competições regionais (tags) · **Proposta de Contrato** (mostra tier, meta, orçamento, confiança inicial)
- **Direita:** Seleção nacional · Escolher clube · Dados do técnico · Botão Iniciar

### ManagerHub
Hub principal com sidebar de 48px e área de conteúdo. Atalhos: F4 Jogos · F5 Tabelas · F6 Estádios · F8 Mercado.

**Banner superior (sempre visível):**
- Meta contratual + medidores de confiança Diretoria/Torcida com cor por nível

**Modal de demissão:** aparece quando `isFired = true`. Mensagem diferente por causa (Diretoria / Torcida / Pressão Combinada).

### Match
Partida ao vivo com:
- Campo SVG + discos de jogadores com posicionamento real
- Banco drag-and-drop para substituições (máx 3/time)
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
| Clubes com força ≤50 | ✅ | ✅ |
| Clubes com força >50 | 🔒 | ✅ |
| Central de Empregos | 🔒 | ✅ (TODO) |
| Seleção Nacional | 🔒 | ✅ (TODO) |
| Ver pênaltis | ✅ | ✅ |
| Skip pênaltis | 🔒 | ✅ (TODO) |

---

## 17. Limitações Conhecidas

### Dados
- Apenas **2 clubes** têm elenco JSON completo (SPFC e Palmeiras). Os outros 18 são bots sem jogadores.
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

### Confiança
- `electSeasonStar()` existe no engine mas não é chamada ao fim da temporada.
- Central de Empregos é placeholder visual.

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

### Médio Prazo
- [ ] `MY_CLUB_FORCE` derivado do elenco real em TransferMarket
- [ ] Confiança da Torcida: eliminação precoce de copa → penalidade
- [ ] Sistema de negociação: fazer oferta → resposta do clube (aceitar/recusar/contraproposta)
- [ ] Central de Empregos funcional (Free: bloqueado, Premium: ativo)
- [ ] Calendário dinâmico baseado no clube/estado do técnico (atualmente fixo SPFC)
- [ ] Prêmios financeiros por posição final e conquistas

### Longo Prazo
- [ ] Logos reais dos 20 clubes em `/public/assets/crests/{short}.png`
- [ ] Backend Railway: auth JWT real + ranking online persistido
- [ ] Modo Online: Socket.io para partidas multiplayer
- [ ] Ligas internacionais: Espanha, Inglaterra, Alemanha
- [ ] Exportar save para arquivo (Electron)

---

*Documento gerado em Junho 2026 · GLfoot v0.1.0*
