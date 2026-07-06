// ═══════════════════════════════════════════════════════
//  GLfoot — Shared Types
// ═══════════════════════════════════════════════════════

export type Spec = 'FI' | 'VE' | 'DR' | 'DE' | 'PA' | 'RE' | 'FO' | 'MA'
export type Pos  = 'ATA' | 'MEI' | 'VOL' | 'LAT' | 'ZAG' | 'GK'
export type Foot = 'D' | 'E' | 'A'   // Direito / Esquerdo / Ambos

export interface Player {
  name: string
  num: number
  age: number
  pos: Pos
  posLabel: string
  spec:  Spec
  spec2?: Spec             // segunda característica (opcional para compatibilidade)
  foot:  Foot              // pé dominante
  nationality: string      // código ISO 3166-1 alpha-3 (ex: 'BRA', 'ARG')
  forca: number            // força atual — exibida no disco
  forcaBase: number        // histórico — drift lento (online)
  potencial: number        // teto absoluto (fixo)
  potencialVisto: number   // estimativa do scout (offline)
  moral: number            // 10–90
  fatigue: number          // 0–1
  fieldPos: [number, number] // [left%, top%] no campo
  lastNotes: number[]      // notas GLfoot, recente primeiro (online)
  matchesPlayed: number    // refina potencialVisto
  injured: boolean
  injuryRoundsLeft?: number // rodadas restantes de recuperação (0/ausente = saudável)
  injuryLabel?: string      // tipo da lesão (ex: "Lesão muscular")
  usedInSub?: boolean       // transitório da partida: reserva já entrou (não persiste)
  contractYearsLeft: number
  gp: number               // gols pró na temporada atual
  assists: number          // assistências na temporada atual
  isStar?: boolean         // estrela da temporada (calculado pelo starEngine)
  forSale?: boolean        // clube colocou à venda
  forLoan?: boolean        // clube oferece empréstimo
}

export interface Club {
  id: string
  name: string
  short: string           // max 4 chars
  colors: [string, string, string]  // [fundo, faixa, detalhe]
  crestColors: [string, string]     // [primária, secundária]
  squad: Player[]         // 11 titulares
  bench: Player[]         // 5–7 reservas
  division?: 1 | 2 | 3   // série A/B/C — ausente = estaduais
  state?: string          // UF (para clubes estaduais)
  forcaTotal?: number     // cache de força média do elenco
}

// ── Match ────────────────────────────────────────────────

export interface MatchEvent {
  minute: number
  type: 'goal' | 'goal-away' | 'yellow' | 'red' | 'foul' | 'sub' | 'injury'
  html: string
  icon?: string
  scorer?: string   // nome do autor do gol (types 'goal' e 'goal-away')
}

export interface MatchResult {
  round: number
  homeId: string
  awayId: string
  homeShort: string
  awayShort: string
  gh: number
  ga: number
}

// ── Standings ────────────────────────────────────────────

export interface Standing {
  id: string
  name: string
  short: string
  colors: [string, string, string]
  crestColors: [string, string]
  pts: number
  j: number
  v: number
  e: number
  d: number
  gf: number
  ga: number
}

// ── Career (Offline) ─────────────────────────────────────

export interface ClubState {
  id: string
  squad: Player[]
  bench: Player[]
  budget: number
}

export interface SeasonSummary {
  season: number
  year: number
  position: number
  points: number
  wins: number
  goals: number
  champion: string
}

export interface RetiredPlayer {
  name: string
  clubId: string
  peakForca: number
  seasons: number
  retiredAge: number
}

export interface CareerState {
  playerClubId: string
  currentSeason: number
  currentRound: number
  clubs: ClubState[]
  standings: Standing[]
  matchHistory: MatchResult[]
  seasonHistory: SeasonSummary[]
  hallOfFame: RetiredPlayer[]
}
