# GLfoot — Instruções para Claude Code

## O que é
Simulador de futebol estilo jogo de botões, inspirado no Brasfoot. Duas frentes independentes:

- **Online**: Campeonato Brasileiro multiplayer — 1 jogador por clube, servidor Node.js + Socket.io, 20 clubes, 38 rodadas
- **Offline**: Modo carreira para 1 jogador como técnico, 15 temporadas, Electron + React, sem internet

## Referência visual obrigatória
`prototype/index.html` — protótipo funcional completo com SPFC × Palmeiras.
- Campo visual com discos de jogador estilo jogo de botões
- Banco de reservas com drag-and-drop para substituição
- Poisson Engine gerando gols pré-agendados
- Scoreboard, log de eventos, overlay de gol, tela de fim de jogo
- Tabela de classificação com escudos SVG
- Age Curve aplicada ao elenco ao fim de cada temporada

> **REGRA**: usar como referência de UI e comportamento. NÃO copiar o código — reescrever em React + TypeScript modular.

---

## Stack

| Camada | Tecnologia | Notas |
|---|---|---|
| Build | Vite + React 18 | HMR instantâneo |
| Linguagem | TypeScript | Tipos em todos os engines e dados |
| Estilo | Tailwind CSS | Sem CSS externo |
| Estado | Zustand | useMatchStore + useCareerStore |
| Dados | JSON (src/data/clubs/) | Um arquivo por clube |
| Desktop (offline) | Electron 29 | Acesso ao sistema de arquivos para save |

---

## Tipos TypeScript principais

```typescript
type Spec = 'FI' | 'VE' | 'DR' | 'DE' | 'PA' | 'RE' | 'FO' | 'MA'
type Pos  = 'ATA' | 'MEI' | 'VOL' | 'LAT' | 'ZAG' | 'GK'

interface Player {
  name: string
  num: number
  age: number
  pos: Pos
  spec: Spec
  posLabel: string
  forca: number          // força atual — exibida no disco
  forcaBase: number      // histórico — muda lentamente (online)
  potencial: number      // teto absoluto (fixo)
  potencialVisto: number // estimativa do scout (offline, oculto)
  moral: number          // 10–90 (offline)
  fatigue: number        // 0–1 (offline)
  fieldPos: [number, number] // [left%, top%] no campo
  lastNotes: number[]    // notas GLfoot, recente primeiro (online)
  matchesPlayed: number  // refina potencialVisto (offline)
  injured: boolean
  contractYearsLeft: number
}

interface Club {
  id: string
  name: string
  short: string          // max 4 chars
  colors: [string, string, string]   // camisa: fundo, faixa, detalhe
  crestColors: [string, string]      // escudo SVG: primária, secundária
  squad: Player[]        // 11 titulares
  bench: Player[]        // 5–7 reservas
}

interface CareerState {
  playerClubId: string
  currentSeason: number  // 1–15
  currentRound: number   // 1–38
  clubs: ClubState[]
  standings: Standing[]
  matchHistory: MatchResult[]
  seasonHistory: SeasonSummary[]
  hallOfFame: RetiredPlayer[]
}
```

---

## Engines aprovados (já testados — não alterar fórmulas sem revisão)

### Poisson Engine (matchEngine.ts)
```typescript
// Resultado validado: média 2.74 gols/jogo, 6.6% jogos 0×0
export function poissonSample(lambda: number): number
export function calcLambda(myAvg: number, oppAvg: number, isHome: boolean): number
// λ = 1.3 + (diffForça × 0.04) + (isHome ? 0.15 : 0)
export function scheduleGoalMinutes(count: number): number[]
// distribui em minutos 5–90, peso maior no meio do jogo
export function pickScorer(squad: Player[]): Player
// ponderado pela forca individual
```

### Force Engine Online (forceEngine.ts)
```typescript
// Força Final = Base(50%) + Forma(35%) + Momentum(15%)
export function normalizeNote(sofascore: number): number
// SS 0–10 → GL 60–99: notaGL = 60 + ((ss - 4.0) / 6.0) * 39
export function calcForma(lastNotes: number[]): number
// pesos temporais: [5, 4, 3, 2, 1] (mais recente primeiro)
export function calcMomentum(lastNotes: number[]): number
// (avg_últimos3 - avg_anteriores3) × 0.4, limitado a ±3
export function calcForca(base: number, forma: number, momentum: number, potencial: number): number
export function driftBase(base: number, notaGL: number, potencial: number): number
// drift 2%: novaBase = base + (notaGL - base) * 0.02
export function updateAfterMatch(player: Player, sofascoreNote: number): Player
```

### Age Curve Engine (ageCurve.ts)
```typescript
// Curvas de pico por posição (validado: 0 violações em 75 temporadas simuladas)
// ATA: pico 24–27, dev +1.8/temp, dec -1.2/temp
// MEI: pico 25–29, dev +1.5/temp, dec -0.9/temp
// GK:  pico 29–33, dev +1.0/temp, dec -0.7/temp
// ZAG: pico 27–31, dev +1.2/temp, dec -0.8/temp
// LAT: pico 24–28, dev +1.6/temp, dec -1.0/temp
// VOL: pico 25–29, dev +1.3/temp, dec -0.8/temp
export function ageDelta(age: number, pos: Pos): number
export function simMatchPerformance(player: Player): number
// performance = forca + gaussian(0,1.5) + moral*0.03 + fatigue*-0.04
export function applyAging(squad: Player[]): Player[]
// aplica envelhecimento +1 ano ao fim da temporada
export function generateYouth(clubId: string): Player
// potencial: 60-69(40%), 70-79(35%), 80-89(20%), 90-99(5%)
// forcaInicial = potencial * 0.60
```

---

## Componentes React a criar

| Componente | Arquivo | Responsabilidade |
|---|---|---|
| `<Campo />` | Campo.tsx | Campo 620×430px com marcações SVG/CSS |
| `<PlayerDisc />` | PlayerDisc.tsx | Disco: camisa, número (topo), nome, força |
| `<BenchZone />` | BenchZone.tsx | Faixa de banco com drag source |
| `<Scoreboard />` | Scoreboard.tsx | Placar, timer, velocidade, forças médias |
| `<EventsPanel />` | EventsPanel.tsx | Log de eventos com scroll |
| `<GoalOverlay />` | GoalOverlay.tsx | Animação bola girando + nome |
| `<SubPopup />` | SubPopup.tsx | Modal substituição por cartão vermelho |
| `<VictoryOverlay />` | VictoryOverlay.tsx | Fim de jogo com stats |
| `<Standings />` | Standings.tsx | Tabela com escudos SVG |
| `<ClubCrest />` | ClubCrest.tsx | Escudo SVG gerado pelas cores do clube |
| `<DraftScreen />` | DraftScreen.tsx | Seleção de clube (online) |
| `<ManagerHub />` | ManagerHub.tsx | Hub do técnico (offline) |

---

## Estrutura de pastas esperada

```
glfoot/
├── CLAUDE.md                    ← este arquivo
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── prototype/
│   └── index.html               ← referência visual (NÃO editar)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── data/
    │   └── clubs/
    │       ├── spfc.json
    │       ├── palmeiras.json
    │       └── index.ts         ← exporta todos os clubes tipados
    ├── engines/
    │   ├── matchEngine.ts
    │   ├── forceEngine.ts
    │   └── ageCurve.ts
    ├── components/
    │   ├── Campo.tsx
    │   ├── PlayerDisc.tsx
    │   ├── BenchZone.tsx
    │   ├── Scoreboard.tsx
    │   ├── EventsPanel.tsx
    │   ├── GoalOverlay.tsx
    │   ├── VictoryOverlay.tsx
    │   ├── Standings.tsx
    │   └── ClubCrest.tsx
    ├── pages/
    │   ├── ClubSelect.tsx
    │   ├── ManagerHub.tsx
    │   └── Match.tsx
    └── stores/
        ├── useMatchStore.ts     ← estado da partida ao vivo
        └── useCareerStore.ts    ← estado completo da carreira
```

---

## Dados dos clubes (spfc.json e palmeiras.json já existem em src/data/clubs/)

Os dois primeiros clubes estão implementados e testados no protótipo.
Ao adicionar novos clubes, seguir o schema `Club` acima e colocar em `src/data/clubs/{id}.json`.

---

## Regras do projeto

1. **Não alterar as fórmulas dos engines** sem rodar teste de mesa no Node.js primeiro
2. **Protótipo é referência visual** — comportamento esperado está implementado lá
3. **Um JSON por clube** — nunca hardcodar dados de elenco em componentes
4. **Força exibida = forca atual** — nunca exibir forcaBase diretamente na UI
5. **Escudos são SVG gerados** pelas cores do clube — nunca usar imagens externas

---

## Próximos passos recomendados

1. `npm create vite@latest . -- --template react-ts` na raiz
2. Instalar Tailwind + Zustand
3. Criar `spfc.json` e `palmeiras.json` com o schema Club
4. Implementar `matchEngine.ts` com as 4 funções do Poisson Engine
5. Criar `PlayerDisc.tsx` e `Campo.tsx`
6. Conectar ao `useMatchStore` e renderizar a partida

---

*GLfoot MVP v0.1 · Prototipo funcional em prototype/index.html · Maio 2026*
