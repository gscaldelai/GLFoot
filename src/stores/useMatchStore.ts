import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import type { Club, Player, MatchEvent } from '@/engines/types'
import { CLUBS, CLUBS_MAP } from '@/data/clubs'

export interface CompletedSeason {
  seasonNum:   number
  year:        number
  clubId:      string
  clubName:    string
  clubShort:   string
  clubColors:  [string, string, string]
  position:    number
  points:      number
  wins:        number
  isChampion:  boolean
  champion:    string   // short do campeão
}
import {
  poissonSample, calcLambda, scheduleGoalMinutes, pickScorer,
} from '@/engines/matchEngine'
import {
  effectiveAvgSquad, applyMatchFatigue, applyBenchRecovery, rollDoubleWeek,
} from '@/engines/fatigueEngine'
import {
  rollTeamInjury, rollInjuryDuration, applyInjury, advanceInjuryRecovery, healInjury,
} from '@/engines/injuryEngine'
import { coachLambdaBonus, calcPlayerReputation } from '@/engines/coachEngine'
import { useCoachStore } from './useCoachStore'
import { calcTicketRevenue, CLUB_STADIUM, STADIUMS } from '@/data/stadiums'
import { useLineupStore }      from './useLineupStore'
import { useTransferStore }    from './useTransferStore'
import { useFinanceStore }     from './useFinanceStore'
import { useStadiumStore }     from './useStadiumStore'
import { useConfidenceStore }             from './useConfidenceStore'
import { CLUB_STRENGTH }                 from '@/data/clubStrength'
import { getContractGoal, calcInitialBudget } from '@/data/clubGoals'
import { getFormationBonus, pickBotFormation, type FormationKey } from '@/data/formations'
import { generateFixtures, type FixtureGame } from '@/engines/fixtureEngine'
import { avgSquad } from '@/engines/matchEngine'
import { buildClubCalendar, type CalendarGame, CUP_PRESTIGE } from '@/engines/calendarEngine'
import { COMPETITION_CATALOG } from '@/data/competitions'

// ── Detecção de importância do jogo ─────────────────────
// Pares de clássicos reconhecidos (IDs em ordem alfabética)
const CLASICOS = new Set([
  'palm_spfc', 'atl_cru', 'fla_flu', 'int_gre', 'bot_fla',
  'cor_spfc', 'palm_cor', 'bot_vas',
])
function classicoPair(idA: string, idB: string): boolean {
  const key = [idA, idB].sort().join('_')
  return CLASICOS.has(key)
}
function detectImportance(round: number, homeId: string, awayId: string): 'normal' | 'classico' | 'final' {
  if (round >= 38) return 'final'
  if (classicoPair(homeId, awayId)) return 'classico'
  return 'normal'
}

interface SideEvent {
  min:   number
  html:  string
  type:  string
  fired: boolean
}

interface DragSource {
  side:   'home' | 'away'
  idx:    number
  player: Player
}

interface GoalFlash {
  scorer: string
  isAway: boolean
}

// Substituição obrigatória pendente por lesão (time do jogador)
interface InjurySub {
  side:     'home' | 'away'
  fieldIdx: number
}

// Escolhe o melhor reserva elegível para substituir um lesionado (bots)
function pickBotReplacement(bench: Player[], out: Player): number {
  let bestIdx = -1, bestScore = -Infinity
  bench.forEach((p, i) => {
    if (p.injured || p.usedInSub) return
    const score = (p.pos === out.pos ? 1000 : 0) + p.forca
    if (score > bestScore) { bestScore = score; bestIdx = i }
  })
  return bestIdx
}

import type { ContractGoal } from '@/data/clubGoals'
import { calcPasse, calcSalary } from '@/engines/marketEngine'

export interface AcquiredPlayer {
  player:     Player
  fromClubId: string
  type:       'buy' | 'loan'
  round:      number
  season:     number
}

interface MatchStore {
  // ── carreira ──────────────────────────────────────────
  myClubId:         string | null
  coachName:        string
  coachNationality: string
  season:           number
  round:            number
  standings:        StandingRow[]
  matchHistory:     HistoryRow[]
  completedSeasons: CompletedSeason[]
  contractGoal:     ContractGoal | null
  initialBudget:    number
  fixtures:         FixtureGame[]
  acquiredPlayers:  AcquiredPlayer[]
  clubCalendar:     CalendarGame[]
  cupStatus:        Record<string, 'active' | 'eliminated'>  // compId → status

  // ── partida ───────────────────────────────────────────
  homeFormation: FormationKey | null   // formação usada pelo time da casa
  awayFormation: FormationKey | null   // formação usada pelo time visitante
  homeClub:  Club | null
  awayClub:  Club | null
  homeSquad: Player[]
  awaySquad: Player[]
  homeBench: Player[]
  awayBench: Player[]
  subCount:  { home: number; away: number }

  gh: number
  ga: number
  minute:  number
  second:  number
  running: boolean
  ended:   boolean
  speed:   1 | 1.5 | 2

  goalMinsH: number[]
  goalMinsA: number[]
  firedH:    Set<number>
  firedA:    Set<number>
  sideEvents: SideEvent[]
  events:     MatchEvent[]

  dragSrc:        DragSource | null
  goalFlash:      GoalFlash | null
  victoryVisible: boolean
  seasonEndVisible: boolean
  halftimeVisible: boolean   // modal de intervalo aberto
  halftimeDone:    boolean   // intervalo já ocorreu nesta partida
  injurySub:       InjurySub | null   // substituição obrigatória pendente (G-02)

  // ── screen ────────────────────────────────────────────
  screen: 'select' | 'hub' | 'match'

  // ── actions ───────────────────────────────────────────
  selectClub:      (clubId: string, allClubs: Club[], coachName?: string, coachNationality?: string) => void
  prepareMatch:    (home: Club, away: Club) => void
  setSpeed:        (v: 1 | 1.5 | 2) => void
  toggleRun:       () => void
  tick:            () => void
  doSub:           (side: 'home' | 'away', fieldIdx: number, benchIdx: number) => void
  setDragSrc:      (src: DragSource | null) => void
  clearGoalFlash:  () => void
  closeVictory:    () => void
  closeHalftime:   () => void   // fecha modal e mantém pausado (ajustes)
  startSecondHalf: () => void   // fecha modal e retoma o jogo
  resolveInjurySub: (benchIdx: number | null) => void  // null = seguir com 10
  switchClub:      (clubId: string) => void  // aceita proposta pós-demissão (F-01)
  nextRound:       () => void
  closeSeasonEnd:  () => void
  goToMatch:       () => void
  goToHub:         () => void
  executeTransfer: (player: Player, fromClubId: string, type: 'buy' | 'loan') => { ok: boolean; msg: string }
}

export interface StandingRow {
  id:          string
  name:        string
  short:       string
  colors:      [string, string, string]
  crestColors: [string, string]
  pts: number; j: number; v: number; e: number; d: number; gf: number; ga: number
}

export interface HistoryRow {
  round:     number
  homeId:    string
  awayId:    string
  homeShort: string
  awayShort: string
  gh:        number
  ga:        number
}

// initStandings usa CLUBS diretamente — todos os 20 clubes têm JSON
function initStandings(allClubs: Club[]): StandingRow[] {
  return allClubs
    .map(c => ({
      id: c.id, name: c.name, short: c.short,
      colors: c.colors, crestColors: c.crestColors,
      pts:0, j:0, v:0, e:0, d:0, gf:0, ga:0,
    }))
    .sort(() => Math.random() - 0.5)
}

function applyResult(rows: StandingRow[], hId: string, aId: string, gh: number, ga: number): StandingRow[] {
  return rows.map(r => {
    if (r.id === hId) {
      const pts = gh > ga ? 3 : gh === ga ? 1 : 0
      return { ...r, j:r.j+1, gf:r.gf+gh, ga:r.ga+ga,
        v:r.v+(gh>ga?1:0), e:r.e+(gh===ga?1:0), d:r.d+(gh<ga?1:0), pts:r.pts+pts }
    }
    if (r.id === aId) {
      const pts = ga > gh ? 3 : ga === gh ? 1 : 0
      return { ...r, j:r.j+1, gf:r.gf+ga, ga:r.ga+gh,
        v:r.v+(ga>gh?1:0), e:r.e+(ga===gh?1:0), d:r.d+(ga<gh?1:0), pts:r.pts+pts }
    }
    return r
  }).sort((a,b) => b.pts-a.pts || b.v-a.v || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf)
}

function genSideEvents(): SideEvent[] {
  const pool = [
    (m: number): SideEvent => ({ min:m, html:`<span class="text-gold font-bold">${m}'</span> Falta perigosa`, type:'foul', fired:false }),
    (m: number): SideEvent => ({ min:m, html:`<span class="text-gold font-bold">${m}'</span> 🟨 Cartão amarelo`, type:'yellow', fired:false }),
    (m: number): SideEvent => ({ min:m, html:`<span class="text-gold font-bold">${m}'</span> Impedimento — VAR`, type:'foul', fired:false }),
    (m: number): SideEvent => ({ min:m, html:`<span class="text-gold font-bold">${m}'</span> Chute na trave!`, type:'foul', fired:false }),
    (m: number): SideEvent => ({ min:m, html:`<span class="text-gold font-bold">${m}'</span> Defesa difícil`, type:'foul', fired:false }),
    (m: number): SideEvent => ({ min:m, html:`<span class="text-gold font-bold">${m}'</span> VAR em análise...`, type:'foul', fired:false }),
  ]
  const mins = scheduleGoalMinutes(5 + Math.floor(Math.random() * 5))
  return mins.map(m => pool[Math.floor(Math.random() * pool.length)](m))
}

// O persist serializa e grava a carreira INTEIRA a cada set() — durante a
// partida isso significa JSON.stringify + localStorage.setItem em todo tick.
// Este storage adia a gravação (no máx. 1 escrita/s) e faz flush no unload,
// então F5/fechar aba logo após o commit da rodada não perde nada.
function throttledStorage<T>(ms: number): PersistStorage<T> {
  let pending: { name: string; value: unknown } | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null }
    if (!pending) return
    localStorage.setItem(pending.name, JSON.stringify(pending.value))
    pending = null
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)
  }
  return {
    getItem: (name) => {
      const str = localStorage.getItem(name)
      return str ? JSON.parse(str) : null
    },
    setItem: (name, value) => {
      // Troca de chave (ex.: userScope re-aponta no login/logout) grava a
      // pendência anterior ANTES de enfileirar a nova — senão o save do
      // usuário que sai se perderia (R-05 × R-10)
      if (pending && pending.name !== name) flush()
      pending = { name, value }
      if (!timer) timer = setTimeout(flush, ms)
    },
    removeItem: (name) => {
      pending = null
      localStorage.removeItem(name)
    },
  }
}

export const useMatchStore = create<MatchStore>()(
  persist(
  (set, get) => ({
  myClubId:         null,
  coachName:        '',
  coachNationality: '',
  season:           1,
  round:            1,
  standings:        [],
  matchHistory:     [],
  completedSeasons: [],
  contractGoal:     null,
  initialBudget:    10_000_000,
  fixtures:         [],
  acquiredPlayers:  [],
  clubCalendar:     [],
  cupStatus:        {},
  homeFormation:   null,
  awayFormation:   null,
  homeClub:        null,
  awayClub:        null,
  homeSquad:       [],
  awaySquad:       [],
  homeBench:       [],
  awayBench:       [],
  subCount:        { home: 0, away: 0 },
  gh: 0, ga: 0,
  minute: 0, second: 0,
  running: false, ended: false, speed: 1,
  goalMinsH: [], goalMinsA: [],
  firedH: new Set(), firedA: new Set(),
  sideEvents: [], events: [],
  dragSrc: null, goalFlash: null,
  victoryVisible: false, seasonEndVisible: false,
  halftimeVisible: false, halftimeDone: false,
  injurySub: null,
  screen: 'select',

  selectClub(clubId, allClubs, coachName = '', coachNationality = '') {
    const standings = initStandings(allClubs)

    // Calcula orçamento e meta com base na força do clube
    const strengthEntry = CLUB_STRENGTH.find(e => e.id === clubId)
    const forcaMedia    = strengthEntry?.forcaMedia ?? 60
    const contractGoal  = getContractGoal(strengthEntry?.tier, forcaMedia)
    const initialBudget = calcInitialBudget(forcaMedia)

    // Gera fixture completo (round-robin 38 rodadas)
    // Embaralha a ordem dos times para variar o calendário a cada carreira
    const shuffledIds = standings.map(r => r.id).sort(() => Math.random() - 0.5)
    const fixtures = generateFixtures(shuffledIds)

    // Reseta stores dependentes
    useFinanceStore.getState().reset(initialBudget)
    useStadiumStore.getState().reset()
    useConfidenceStore.getState().reset()
    useCoachStore.getState().initCareer(clubId)
    // Carreira nova (a virada de temporada não passa mais por aqui): limpa o
    // elenco persistido para o init() reconstruir do clube escolhido.
    useLineupStore.setState({ slots: [], bench: [], selected: null, dragSrc: null })
    // Listagens de venda/empréstimo da carreira anterior não vazam (R-07)
    useTransferStore.getState().clearAll()

    const clubCalendar = buildClubCalendar(clubId)

    // Inicializa status de copa: todas as competições do clube como 'active'
    const cupStatus: Record<string, 'active' | 'eliminated'> = {}
    clubCalendar.forEach(g => { cupStatus[g.competitionId] = 'active' })

    set({
      myClubId: clubId, coachName, coachNationality, standings, screen: 'hub',
      season: 1, round: 1, matchHistory: [], events: [], completedSeasons: [],
      contractGoal, initialBudget, fixtures, acquiredPlayers: [],
      clubCalendar, cupStatus, seasonEndVisible: false, victoryVisible: false,
    })
  },

  prepareMatch(home, away) {
    // effectiveAvgSquad: usa fatigue real do time do jogador
    // Para times bot (fatigue === 0), retorna o mesmo que avgSquad
    const avH = effectiveAvgSquad(home.squad)
    const avA = effectiveAvgSquad(away.squad)

    // ── Formações ─────────────────────────────────────────
    const myClubId    = get().myClubId
    const myFormation = useLineupStore.getState().formation
    // Bots recebem formação pseudo-aleatória baseada em round+clubId (seed determinístico)
    const round = get().round
    const homeIsMe = home.id === myClubId
    const seedH = home.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) + round
    const seedA = away.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0) + round
    const homeFormation: FormationKey = homeIsMe ? myFormation : pickBotFormation(seedH)
    const awayFormation: FormationKey = !homeIsMe ? myFormation : pickBotFormation(seedA)

    // Bônus tático: diferença de formação afeta λ de cada lado
    const bonusH = getFormationBonus(homeFormation, awayFormation)
    const bonusA = getFormationBonus(awayFormation, homeFormation)

    // Bônus de técnico (F-01): reputação do NPC para bots, do jogador para o meu clube
    const coachStore = useCoachStore.getState()
    const playerRep  = calcPlayerReputation(get().completedSeasons)
    const repH = homeIsMe  ? playerRep : (coachStore.coachOf(home.id)?.reputation ?? 3)
    const repA = !homeIsMe ? playerRep : (coachStore.coachOf(away.id)?.reputation ?? 3)

    const golsH = poissonSample(calcLambda(avH, avA, true,  bonusH + coachLambdaBonus(repH)))
    const golsA = poissonSample(calcLambda(avA, avH, false, bonusA + coachLambdaBonus(repA)))
    set({
      homeFormation, awayFormation,
      homeClub:   home,  awayClub:   away,
      homeSquad:  JSON.parse(JSON.stringify(home.squad)),
      awaySquad:  JSON.parse(JSON.stringify(away.squad)),
      homeBench:  JSON.parse(JSON.stringify(home.bench)),
      awayBench:  JSON.parse(JSON.stringify(away.bench)),
      subCount:   { home: 0, away: 0 },
      gh: 0, ga: 0, minute: 0, second: 0,
      running: false, ended: false,   // speed mantém a última escolha do usuário (U-04)
      goalMinsH: scheduleGoalMinutes(golsH),
      goalMinsA: scheduleGoalMinutes(golsA),
      firedH: new Set(), firedA: new Set(),
      sideEvents: genSideEvents(), events: [],
      goalFlash: null, victoryVisible: false,
      halftimeVisible: false, halftimeDone: false,
      injurySub: null,
    })
  },

  setSpeed(v) { set({ speed: v }) },

  toggleRun() {
    const { running, ended, injurySub, halftimeVisible } = get()
    // Modais obrigatórios (lesão/intervalo) travam o jogo: Space/Enter no
    // botão de play ainda focado não pode religar por trás do modal
    if (ended || injurySub || halftimeVisible) return
    set({ running: !running })
  },

  tick() {
    const s = get()
    if (!s.running || s.ended) return
    let { minute, second, gh, ga, firedH, firedA } = s
    const events = [...s.events]
    let goalFlash: GoalFlash | null = null

    second++
    if (second >= 60) { second = 0; minute++ }
    if (minute >= 90) {
      // Fim de jogo — só estado TRANSITÓRIO. O "commit" do resultado
      // (classificação, histórico, bilheteria, confiança, lesões) acontece
      // no nextRound(): se o usuário der F5 na tela de vitória, a rodada é
      // re-disputada sem duplicar nada no estado persistido.
      set({ minute: 90, second: 0, running: false, ended: true,
            victoryVisible: true, injurySub: null })
      return
    }

    // Intervalo (U-06): pausa automática ao fim do 1º tempo
    if (minute >= 45 && !s.halftimeDone) {
      set({ minute: 45, second: 0, running: false,
            halftimeVisible: true, halftimeDone: true })
      return
    }

    // Gols casa
    s.goalMinsH.forEach(gm => {
      if (minute >= gm && !firedH.has(gm)) {
        firedH = new Set(firedH); firedH.add(gm); gh++
        const scorer = pickScorer(s.homeSquad)
        events.unshift({
          minute: gm, type: 'goal',
          html: `<span class="text-gold font-bold">${gm}'</span> <strong class="text-gold">GOOOL!</strong> ${scorer.name}`,
          icon: '⚽',
          scorer: scorer.name,
        })
        goalFlash = { scorer: scorer.name, isAway: false }
      }
    })

    // Gols fora
    s.goalMinsA.forEach(gm => {
      if (minute >= gm && !firedA.has(gm)) {
        firedA = new Set(firedA); firedA.add(gm); ga++
        const scorer = pickScorer(s.awaySquad)
        events.unshift({
          minute: gm, type: 'goal-away',
          html: `<span class="text-gold font-bold">${gm}'</span> <strong class="text-[#10a050]">GOOOL!</strong> ${scorer.name}`,
          icon: '⚽',
          scorer: scorer.name,
        })
        goalFlash = { scorer: scorer.name, isAway: true }
      }
    })

    // Eventos laterais
    const sideEvents = s.sideEvents.map(ev => {
      if (minute >= ev.min && !ev.fired) {
        events.unshift({ minute: ev.min, type: ev.type as MatchEvent['type'], html: ev.html })
        return { ...ev, fired: true }
      }
      return ev
    })

    // ── Lesões (G-02): sorteio UMA vez por minuto de jogo (não por tick) ──
    let homeSquad = s.homeSquad, awaySquad = s.awaySquad
    let homeBench = s.homeBench, awayBench = s.awayBench
    let subCount  = s.subCount
    let injurySub = s.injurySub
    let pauseForInjury = false

    if (second === 0 && minute >= 1 && !injurySub) {
      const isMyHome = s.homeClub?.id === s.myClubId
      for (const side of ['home', 'away'] as const) {
        const squad = side === 'home' ? homeSquad : awaySquad
        const idx = rollTeamInjury(squad)
        if (idx === null) continue

        const roll     = rollInjuryDuration()
        const victim   = applyInjury(squad[idx], roll)
        const newSquad = squad.map((p, i) => i === idx ? victim : p)
        const isMySide = side === 'home' ? isMyHome : !isMyHome

        events.unshift({
          minute, type: 'injury',
          html: `<span class="text-gold font-bold">${minute}'</span> 🚑 <strong>${victim.name}</strong> lesionado — ${roll.label}`
              + (isMySide ? ` (${roll.rounds} rodada${roll.rounds > 1 ? 's' : ''})` : ''),
        })

        if (isMySide) {
          // Meu jogador: pausa e abre modal de substituição obrigatória
          if (side === 'home') homeSquad = newSquad; else awaySquad = newSquad
          injurySub = { side, fieldIdx: idx }
          pauseForInjury = true
        } else {
          // Bot: substituição automática pelo melhor reserva compatível
          const bench  = side === 'home' ? homeBench : awayBench
          const subIdx = subCount[side] < 3 ? pickBotReplacement(bench, victim) : -1
          if (subIdx >= 0) {
            const entering = { ...bench[subIdx], fieldPos: victim.fieldPos, usedInSub: true }
            const finalSquad = newSquad.map((p, i) => i === idx ? entering : p)
            const finalBench = bench.map((p, i) => i === subIdx ? { ...victim, usedInSub: true } : p)
            if (side === 'home') { homeSquad = finalSquad; homeBench = finalBench }
            else                 { awaySquad = finalSquad; awayBench = finalBench }
            subCount = { ...subCount, [side]: subCount[side] + 1 }
            events.unshift({
              minute, type: 'sub',
              html: `<span class="text-gold font-bold">${minute}'</span> 🔄 ${entering.name} ↑ ${victim.name} ↓`,
            })
          } else {
            // Sem reserva/subs esgotadas: bot segue com um a menos
            const finalSquad = newSquad.filter((_, i) => i !== idx)
            const finalBench = [...bench, { ...victim, usedInSub: true }]
            if (side === 'home') { homeSquad = finalSquad; homeBench = finalBench }
            else                 { awaySquad = finalSquad; awayBench = finalBench }
            events.unshift({
              minute, type: 'injury',
              html: `<span class="text-gold font-bold">${minute}'</span> ⚠ ${(side === 'home' ? s.homeClub : s.awayClub)?.short} segue com ${finalSquad.length} em campo`,
            })
          }
        }
      }
    }

    set({ minute, second, gh, ga, firedH, firedA, events: events.slice(0, 60),
          sideEvents, goalFlash: goalFlash ?? s.goalFlash,
          homeSquad, awaySquad, homeBench, awayBench, subCount, injurySub,
          ...(pauseForInjury ? { running: false } : {}) })
  },

  doSub(side, fieldIdx, benchIdx) {
    const s = get()
    if (s.subCount[side] >= 3) return
    const squad = side === 'home' ? [...s.homeSquad] : [...s.awaySquad]
    const bench = side === 'home' ? [...s.homeBench] : [...s.awayBench]
    const sub   = bench[benchIdx]
    const out   = squad[fieldIdx]
    if (!sub || sub.injured || sub.usedInSub) return

    const newSub = { ...sub, fieldPos: out.fieldPos, usedInSub: true }
    squad[fieldIdx] = newSub
    // Quem sai ocupa a vaga do banco (como no resolveInjurySub) — senão o
    // substituído some da partida e o reserva fica duplicado em campo e no banco
    const newBench = bench.map((p, i) => i === benchIdx ? { ...out, usedInSub: true } : p)

    const events = [...s.events]
    events.unshift({
      minute: s.minute, type: 'sub',
      html: `<span class="text-gold font-bold">${s.minute}'</span> 🔄 ${sub.name} ↑ ${out.name} ↓`,
    })

    set({
      ...(side === 'home' ? { homeSquad: squad, homeBench: newBench } : { awaySquad: squad, awayBench: newBench }),
      subCount: { ...s.subCount, [side]: s.subCount[side] + 1 },
      events,
    })
  },

  setDragSrc: (src) => set({ dragSrc: src }),

  clearGoalFlash: () => set({ goalFlash: null }),

  closeVictory: () => set({ victoryVisible: false }),

  closeHalftime:   () => set({ halftimeVisible: false }),

  startSecondHalf: () => set({ halftimeVisible: false, running: true }),

  resolveInjurySub(benchIdx) {
    const s = get()
    const pending = s.injurySub
    if (!pending) return
    const { side, fieldIdx } = pending
    const squad  = side === 'home' ? [...s.homeSquad] : [...s.awaySquad]
    const bench  = side === 'home' ? [...s.homeBench] : [...s.awayBench]
    const victim = squad[fieldIdx]
    const events = [...s.events]
    const sub = benchIdx !== null && s.subCount[side] < 3 ? bench[benchIdx] : undefined

    if (sub && !sub.injured && !sub.usedInSub) {
      squad[fieldIdx] = { ...sub, fieldPos: victim.fieldPos, usedInSub: true }
      bench[benchIdx!] = { ...victim, usedInSub: true }
      events.unshift({
        minute: s.minute, type: 'sub',
        html: `<span class="text-gold font-bold">${s.minute}'</span> 🔄 ${sub.name} ↑ ${victim.name} ↓`,
      })
      set({
        ...(side === 'home' ? { homeSquad: squad, homeBench: bench } : { awaySquad: squad, awayBench: bench }),
        subCount: { ...s.subCount, [side]: s.subCount[side] + 1 },
        events: events.slice(0, 60), injurySub: null, running: true,
      })
    } else {
      // Sem substituição: lesionado sai e o time segue com um a menos
      squad.splice(fieldIdx, 1)
      bench.push({ ...victim, usedInSub: true })
      events.unshift({
        minute: s.minute, type: 'injury',
        html: `<span class="text-gold font-bold">${s.minute}'</span> ⚠ ${(side === 'home' ? s.homeClub : s.awayClub)?.short} segue com ${squad.length} em campo`,
      })
      set({
        ...(side === 'home' ? { homeSquad: squad, homeBench: bench } : { awaySquad: squad, awayBench: bench }),
        events: events.slice(0, 60), injurySub: null, running: true,
      })
    }
  },

  nextRound() {
    const s = get()
    // Idempotência: só processa com uma partida encerrada pendente
    // (bloqueia clique duplo no VictoryOverlay e chamadas órfãs pós-F5)
    if (!s.ended || !s.homeClub || !s.awayClub) return
    const { gh, ga } = s

    // ── Commit do resultado da minha partida (movido do tick aos 90') ─────
    let standings = applyResult(s.standings, s.homeClub.id, s.awayClub.id, gh, ga)
    const histRow: HistoryRow = {
      round: s.round, homeId: s.homeClub.id, awayId: s.awayClub.id,
      homeShort: s.homeClub.short, awayShort: s.awayClub.short, gh, ga,
    }

    // ── Confiança: dispara evento de resultado ───────────
    const isMyHome = s.homeClub.id === s.myClubId
    const isMyAway = s.awayClub.id === s.myClubId
    if (isMyHome || isMyAway) {
      const myGoals  = isMyHome ? gh : ga
      const oppGoals = isMyHome ? ga : gh
      const oppClubId = isMyHome ? s.awayClub.id : s.homeClub.id
      const oppEntry  = CLUB_STRENGTH.find(e => e.id === oppClubId)
      const myEntry   = CLUB_STRENGTH.find(e => e.id === s.myClubId!)
      useConfidenceStore.getState().onMatchResult({
        round:      s.round,
        season:     s.season,
        isHomeGame: isMyHome,
        myGoals,
        oppGoals,
        isClassico: classicoPair(s.homeClub.id, s.awayClub.id),
        oppForce:   oppEntry?.forcaMedia ?? 60,
        myForce:    myEntry?.forcaMedia  ?? 60,
      })
    }

    // ── Receita de bilheteria (somente jogo em casa) ─────
    if (s.homeClub.id === s.myClubId) {
      const stadiumId  = CLUB_STADIUM[s.myClubId!]
      const stadium    = stadiumId ? STADIUMS[stadiumId] : null
      if (stadium) {
        const stadiumStore = useStadiumStore.getState()
        const capacity     = stadiumStore.getCapacity(stadiumId)
        const prices       = stadiumStore.getTierPrices(stadiumId)
        const importance   = detectImportance(s.round, s.homeClub.id, s.awayClub.id)
        const rev          = calcTicketRevenue(stadiumId, importance, capacity, prices, s.round)
        useFinanceStore.getState().addIncome(
          rev.revenue,
          'bilheteria',
          `Bilheteria R${s.round} — ${s.homeClub.short} ${gh}×${ga} ${s.awayClub.short}`,
          s.round,
          s.season,
        )
      }
    }

    // ── Write-back de lesões para o elenco do jogador (G-02) ─────────
    // Squads da partida são cópias — a lesão precisa voltar ao lineup store
    const mySquadWB = isMyHome ? s.homeSquad : s.awaySquad
    const myBenchWB = isMyHome ? s.homeBench : s.awayBench
    const injuredNow = (isMyHome || isMyAway)
      ? [...mySquadWB, ...myBenchWB].filter(p => p.injured && (p.injuryRoundsLeft ?? 0) > 0)
      : []
    if (injuredNow.length) {
      const ls0 = useLineupStore.getState()
      const hit = (x: Player) => injuredNow.find(i => i.name === x.name && i.num === x.num)
      const mark = (p: Player) => {
        const inj = hit(p)
        if (!inj) return p
        if (p.injured) return p   // já estava lesionado antes da partida — mantém contagem
        // +1 compensa o decremento do nextRound desta mesma rodada:
        // "fora por N rodadas" = perde exatamente as N próximas partidas
        return { ...p, injured: true, injuryRoundsLeft: (inj.injuryRoundsLeft ?? 1) + 1, injuryLabel: inj.injuryLabel }
      }
      useLineupStore.setState({
        slots: ls0.slots.map(p => p ? mark(p) : null),
        bench: ls0.bench.map(mark),
      })
    }

    // Simula os jogos dos bots usando fixtures e força real dos clubes
    const myId = s.myClubId
    const roundFixtures = s.fixtures.filter(f => f.round === s.round)
    for (const fix of roundFixtures) {
      if (fix.homeId === myId || fix.awayId === myId) continue  // jogo do player, já resolvido
      const homeClub = CLUBS_MAP[fix.homeId]
      const awayClub = CLUBS_MAP[fix.awayId]
      const avH = homeClub ? avgSquad(homeClub.squad) : (CLUB_STRENGTH.find(e => e.id === fix.homeId)?.forcaMedia ?? 65)
      const avA = awayClub ? avgSquad(awayClub.squad) : (CLUB_STRENGTH.find(e => e.id === fix.awayId)?.forcaMedia ?? 65)
      // Técnicos NPC influenciam os jogos bot×bot (F-01)
      const coachStore = useCoachStore.getState()
      const cbH = coachLambdaBonus(coachStore.coachOf(fix.homeId)?.reputation ?? 3)
      const cbA = coachLambdaBonus(coachStore.coachOf(fix.awayId)?.reputation ?? 3)
      const gh = poissonSample(calcLambda(avH, avA, true,  cbH))
      const ga = poissonSample(calcLambda(avA, avH, false, cbA))
      standings = applyResult(standings, fix.homeId, fix.awayId, gh, ga)
    }
    // Fallback: se não há fixtures (carreira antiga), simula sem fixture
    if (roundFixtures.length === 0) {
      const realIds = [s.homeClub?.id, s.awayClub?.id].filter(Boolean) as string[]
      const bots = standings.filter(r => !realIds.includes(r.id))
      for (let i = 0; i + 1 < bots.length; i += 2) {
        const gh = poissonSample(1.35)
        const ga = poissonSample(1.25)
        standings = applyResult(standings, bots[i].id, bots[i+1].id, gh, ga)
      }
    }

    // ── Fadiga + recuperação de lesões do time do jogador ─────────────────
    // Lesionado não joga: só recupera fadiga e desconta 1 rodada da lesão
    const doubleWeek = rollDoubleWeek(s.round)
    const ls = useLineupStore.getState()
    useLineupStore.setState({
      slots: ls.slots.map(p => {
        if (!p) return null
        if (p.injured) return advanceInjuryRecovery(applyBenchRecovery(p, doubleWeek))
        return applyMatchFatigue(p, doubleWeek)
      }),
      bench: ls.bench.map(p => {
        const rec = applyBenchRecovery(p, doubleWeek)
        return p.injured ? advanceInjuryRecovery(rec) : rec
      }),
    })

    // ── Desconto de salários (a cada 4 rodadas ≈ mensalmente) ─────────────
    const lsAfter   = useLineupStore.getState()
    const squad     = lsAfter.slots.filter(Boolean) as import('@/engines/types').Player[]
    const bench2    = lsAfter.bench
    useFinanceStore.getState().deductWages(squad, bench2, s.round, s.season)

    // ── Simulação de copas: fases eliminatórias da semana atual ───────────
    const currentWeek = s.round   // aproximação: rodada ≈ semana
    const cupStatus   = { ...s.cupStatus }
    const myForce     = CLUB_STRENGTH.find(e => e.id === s.myClubId)?.forcaMedia ?? 65

    for (const game of s.clubCalendar) {
      const comp = COMPETITION_CATALOG[game.competitionId]
      if (!comp) continue
      if (game.competitionId === 'brasileirao') continue
      if (cupStatus[game.competitionId] === 'eliminated') continue
      if (game.week !== currentWeek) continue

      // Só fases eliminatórias (single_elim ou two_leg_elim)
      const phase = comp.phases.find(p => p.id === game.phaseId)
      if (!phase || phase.format === 'league') continue

      // Simula resultado: base 50%, ajustado por força do clube
      const advBonus  = (myForce - 65) * 0.006   // ±0-9% por força
      const advances  = Math.random() < (0.50 + advBonus)

      if (!advances) {
        cupStatus[game.competitionId] = 'eliminated'
        const prestige = CUP_PRESTIGE[game.competitionId] ?? 1
        useConfidenceStore.getState().onCupElimination(
          comp.name, phase.name, s.round, s.season, prestige,
        )
      }
    }

    // ── Check financeiro para confiança da diretoria ───────────────────────
    if (s.round % 4 === 0) {
      const fin    = useFinanceStore.getState()
      const ratio  = s.initialBudget > 0 ? fin.budget / s.initialBudget : 1
      useConfidenceStore.getState().onFinanceCheck(ratio, s.round, s.season)
    }

    // ── Técnicos NPC: pressão, demissões e contratações (F-01) ─────────────
    // Passa o clube do jogador: a liga não contrata NPC para ele (R-18)
    useCoachStore.getState().processRound(standings, s.round, s.season, s.myClubId)
    // ──────────────────────────────────────────────────────────────────────

    const nextRound = s.round + 1
    const committed = { standings, matchHistory: [...s.matchHistory, histRow],
                        round: nextRound, victoryVisible: false, ended: false, cupStatus }
    if (nextRound > 38) {
      set({ ...committed, seasonEndVisible: true })
    } else {
      set({ ...committed, screen: 'hub' })
    }
  },

  closeSeasonEnd() {
    const s = get()
    const nextSeason = s.season + 1

    // Registra a temporada concluída
    const myRow      = s.standings.find(r => r.id === s.myClubId)
    const myPosition = s.standings.findIndex(r => r.id === s.myClubId) + 1
    const myClub     = CLUBS.find(c => c.id === s.myClubId)

    // Avalia meta contratual e dispara evento de confiança
    if (s.contractGoal) {
      useConfidenceStore.getState().onSeasonEnd(myPosition, s.contractGoal.primary)
    }

    if (myClub && myRow) {
      const entry: CompletedSeason = {
        seasonNum:  s.season,
        year:       2025 + s.season,
        clubId:     myClub.id,
        clubName:   myClub.name,
        clubShort:  myClub.short,
        clubColors: myClub.colors,
        position:   myPosition,
        points:     myRow.pts,
        wins:       myRow.v,
        isChampion: myPosition === 1,
        champion:   s.standings[0]?.short ?? '—',
      }
      set({ completedSeasons: [...s.completedSeasons, entry] })
    }

    if (nextSeason > 15) {
      // round volta a 1: com 39 persistido, todo F5 no ClubSelect reabriria
      // o SeasonEndOverlay (onRehydrateStorage) e duplicaria completedSeasons
      set({ seasonEndVisible: false, screen: 'select', round: 1 })
    } else {
      const ls = useLineupStore.getState()
      useLineupStore.setState({
        slots: ls.slots.map(p => p ? { ...healInjury(p), fatigue: 0 } : null),
        bench: ls.bench.map(p => ({ ...healInjury(p), fatigue: 0 })),
      })
      // Técnicos NPC: zera hiredRound/pressure (R-06 — senão contratado no
      // fim da temporada fica imune a demissão na seguinte)
      useCoachStore.getState().onSeasonTurnover()
      // Reconstrói calendário e reseta status das copas para nova temporada
      const newCalendar = s.myClubId ? buildClubCalendar(s.myClubId) : s.clubCalendar
      const newCupStatus: Record<string, 'active' | 'eliminated'> = {}
      newCalendar.forEach(g => { newCupStatus[g.competitionId] = 'active' })
      // Novo sorteio de confrontos: embaralha a ordem para variar o calendário
      const shuffledIds = s.standings.map(r => r.id).sort(() => Math.random() - 0.5)
      // Continua a MESMA carreira: vai direto ao hub, sem passar pelo ClubSelect
      // (que resetaria temporada, orçamento e técnicos — bug da virada de temporada)
      set({ seasonEndVisible: false, season: nextSeason, round: 1, screen: 'hub',
            matchHistory: [], standings: s.standings.map(r => ({ ...r, pts:0,j:0,v:0,e:0,d:0,gf:0,ga:0 })),
            fixtures: generateFixtures(shuffledIds),
            clubCalendar: newCalendar, cupStatus: newCupStatus })
    }
  },

  goToMatch() { set({ screen: 'match' }) },
  goToHub()   { set({ screen: 'hub'   }) },

  // Aceita proposta pós-demissão: assume outro clube na mesma temporada (F-01)
  switchClub(clubId) {
    const club = CLUBS_MAP[clubId]
    if (!club) return

    // Técnico NPC do clube escolhido vai para o mercado livre
    useCoachStore.getState().acceptOffer(clubId, get().round)

    // Novo contrato: meta, orçamento e confiança do novo clube
    const strengthEntry = CLUB_STRENGTH.find(e => e.id === clubId)
    const forcaMedia    = strengthEntry?.forcaMedia ?? 60
    const contractGoal  = getContractGoal(strengthEntry?.tier, forcaMedia)
    const initialBudget = calcInitialBudget(forcaMedia)
    useFinanceStore.getState().reset(initialBudget)
    useConfidenceStore.getState().reset()   // zera isFired e medidores

    // Assume o elenco do novo clube
    useLineupStore.getState().init([...club.squad, ...club.bench])

    // Calendário e copas do novo clube
    const clubCalendar = buildClubCalendar(clubId)
    const cupStatus: Record<string, 'active' | 'eliminated'> = {}
    clubCalendar.forEach(g => { cupStatus[g.competitionId] = 'active' })

    // Comprados para o clube anterior voltam ao mercado (R-09) — o elenco
    // antigo reverte ao JSON, então mantê-los em acquiredPlayers só os
    // sumiria do jogo pelo resto da carreira
    set({ myClubId: clubId, contractGoal, initialBudget, clubCalendar, cupStatus,
          acquiredPlayers: [], screen: 'hub' })
  },

  executeTransfer(player, fromClubId, type) {
    const s    = get()
    const fin  = useFinanceStore.getState()
    const passe = calcPasse(player)
    const sal   = calcSalary(player)

    // Guarda: não faz sentido contratar/emprestar um jogador do próprio clube (R-11)
    if (fromClubId === s.myClubId) {
      return { ok: false, msg: 'Este jogador já pertence ao seu clube.' }
    }

    if (type === 'buy') {
      const needed = passe + sal * 6
      if (fin.budget < needed) {
        return { ok: false, msg: `Saldo insuficiente. Necessário R$ ${(needed/1e6).toFixed(1)}M.` }
      }
      fin.addExpense(passe, 'transferencia', `Compra: ${player.name} (${fromClubId.toUpperCase()})`, s.round, s.season)
    } else {
      // Empréstimo: apenas reserva 3 meses de salário
      const reserve = sal * 3
      if (fin.budget < reserve) {
        return { ok: false, msg: `Saldo insuficiente para reserva de empréstimo (3 meses = R$ ${(reserve/1e6).toFixed(1)}M).` }
      }
      fin.addExpense(reserve, 'transferencia', `Empréstimo: ${player.name} (${fromClubId.toUpperCase()})`, s.round, s.season)
    }

    // Adiciona ao banco do useLineupStore
    const ls = useLineupStore.getState()
    useLineupStore.setState({ bench: [...ls.bench, { ...player, contractYearsLeft: type === 'loan' ? 1 : player.contractYearsLeft }] })

    const entry: AcquiredPlayer = { player, fromClubId, type, round: s.round, season: s.season }
    set({ acquiredPlayers: [...s.acquiredPlayers, entry] })
    return { ok: true, msg: type === 'buy' ? `${player.name} contratado!` : `${player.name} emprestado!` }
  },
  }),
  {
    name: 'glfoot-career',
    version: 1,
    skipHydration: true,   // hidratação dirigida por userScope (R-10)
    storage: throttledStorage(1000),
    partialize: (s) => ({
      myClubId:        s.myClubId,
      coachName:       s.coachName,
      coachNationality:s.coachNationality,
      season:          s.season,
      round:           s.round,
      standings:       s.standings,
      matchHistory:    s.matchHistory,
      completedSeasons:s.completedSeasons,
      contractGoal:    s.contractGoal,
      initialBudget:   s.initialBudget,
      fixtures:        s.fixtures,
      acquiredPlayers: s.acquiredPlayers,
      clubCalendar:    s.clubCalendar,
      cupStatus:       s.cupStatus,
      // O estado da partida ao vivo é transitório: um F5 em 'match' voltaria
      // a uma tela de jogo vazia e sem saída — persiste 'hub' e a rodada é
      // re-disputada.
      screen:          s.screen === 'match' ? 'hub' as const : s.screen,
    }),
    // Roda sincronamente durante o create() — mutar o state diretamente
    // (referenciar useMatchStore aqui lança TDZ e aborta a hidratação)
    onRehydrateStorage: () => (state) => {
      if (!state) return
      // Saves antigos podem ter 'match' gravado
      if (state.screen === 'match') state.screen = 'hub'
      // F5 durante o fim de temporada (rodada 39): reabre o overlay,
      // senão a carreira fica travada sem como fechar a temporada
      if (state.round > 38) state.seasonEndVisible = true
    },
  },
))
