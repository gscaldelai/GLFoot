// ════════════════════════════════════════════════════════
//  GLfoot — Calendar Engine
//  Gera o calendário anual de um clube distribuindo jogos
//  em até MAX_GAMES_PER_WEEK por semana.
//
//  Regras:
//  1. Máx. 2 jogos/semana (configurável)
//  2. Cada jogo deve caber dentro da janela [startWeek, endWeek] da fase
//  3. Internacionais têm prioridade sobre nacionais e estaduais
//  4. Brasileirão preenche as semanas restantes (flexível)
// ════════════════════════════════════════════════════════

import { COMPETITION_CATALOG, type Competition, type Phase } from '@/data/competitions'

export interface CalendarGame {
  week:            number
  competitionId:   string
  competitionName: string
  competitionShort: string
  phaseId:         string
  phaseName:       string
  gameIndex:       number   // 0-based dentro da fase
  isHome:          boolean  // alterna: ida=true, volta=false
  type:            'estadual' | 'nacional' | 'internacional'
}

const MAX_GAMES_PER_WEEK = 2
const TOTAL_WEEKS        = 52

// ── Gerador principal ────────────────────────────────────

interface BuildOptions {
  pinnedBrasRounds?: Record<number, number>  // round 1-based → week
}

export function buildCalendar(competitionIds: string[], options?: BuildOptions): CalendarGame[] {
  // Separa Brasileirão (flexível) dos demais (janela fixa)
  const fixedIds    = competitionIds.filter(id => id !== 'brasileirao')
  const hasBrasa    = competitionIds.includes('brasileirao')

  // Contagem de jogos por semana
  const weekLoad    = new Array<number>(TOTAL_WEEKS + 1).fill(0)
  const schedule:   CalendarGame[] = []

  // 1. Gera todos os slots de jogos com janela fixa, ordenados por prioridade
  const slots = fixedIds.flatMap(id => expandCompetition(id))
  slots.sort((a, b) =>
    a.phase.priority !== b.phase.priority
      ? a.phase.priority - b.phase.priority
      : a.phase.startWeek - b.phase.startWeek
  )

  // 2. Aloca cada jogo na primeira semana disponível dentro da janela
  for (const slot of slots) {
    const week = findSlot(weekLoad, slot.phase.startWeek, slot.phase.endWeek)
    if (week === -1) continue  // janela esgotada — jogo não encaixa (não deve ocorrer em produção)
    weekLoad[week]++
    schedule.push({
      week,
      competitionId:    slot.comp.id,
      competitionName:  slot.comp.name,
      competitionShort: slot.comp.short,
      phaseId:          slot.phase.id,
      phaseName:        slot.phase.name,
      gameIndex:        slot.gameIndex,
      isHome:           slot.isHome,
      type:             slot.comp.type,
    })
  }

  // 3. Distribui Brasileirão nos slots restantes (múltiplas passagens até 38)
  if (hasBrasa) {
    const brasa  = COMPETITION_CATALOG['brasileirao']
    const phase  = brasa.phases[0]
    const target = phase.gamesPerClub   // 38

    // Rounds fixados em semanas específicas (1-based round → week)
    const pinnedRounds = options?.pinnedBrasRounds ?? {}
    const pinnedSet    = new Set(Object.keys(pinnedRounds).map(Number))

    // 3a. Coloca os rounds fixados primeiro
    for (const [roundStr, week] of Object.entries(pinnedRounds)) {
      const r = Number(roundStr) - 1   // converte para 0-based
      if (weekLoad[week] < MAX_GAMES_PER_WEEK) {
        weekLoad[week]++
        schedule.push({
          week,
          competitionId:    brasa.id,
          competitionName:  brasa.name,
          competitionShort: brasa.short,
          phaseId:          phase.id,
          phaseName:        `Rodada ${r + 1}`,
          gameIndex:        r,
          isHome:           r % 2 === 0,
          type:             brasa.type,
        })
      }
    }

    // 3b. Distribui os rounds não fixados nas semanas disponíveis
    let round = 0
    for (let pass = 0; pass < 3 && round < target; pass++) {
      for (let w = 1; w <= TOTAL_WEEKS && round < target; w++) {
        // Pula rounds fixados
        while (round < target && pinnedSet.has(round + 1)) round++
        if (round >= target) break
        if (weekLoad[w] < MAX_GAMES_PER_WEEK) {
          weekLoad[w]++
          schedule.push({
            week:             w,
            competitionId:    brasa.id,
            competitionName:  brasa.name,
            competitionShort: brasa.short,
            phaseId:          phase.id,
            phaseName:        `Rodada ${round + 1}`,
            gameIndex:        round,
            isHome:           round % 2 === 0,
            type:             brasa.type,
          })
          round++
        }
      }
    }
  }

  return schedule.sort((a, b) => a.week - b.week)
}

// ── Expande uma competição em slots individuais ──────────

interface GameSlot {
  comp:      Competition
  phase:     Phase
  gameIndex: number
  isHome:    boolean
}

function expandCompetition(id: string): GameSlot[] {
  const comp = COMPETITION_CATALOG[id]
  if (!comp) return []

  return comp.phases.flatMap(phase => {
    const slots: GameSlot[] = []
    for (let i = 0; i < phase.gamesPerClub; i++) {
      // Em two_leg_elim: jogo 0 = ida (casa), jogo 1 = volta (fora)
      const isHome = phase.format === 'two_leg_elim' ? i % 2 === 0 : Math.random() < 0.5
      slots.push({ comp, phase, gameIndex: i, isHome })
    }
    return slots
  })
}

// ── Encontra a primeira semana livre dentro da janela ────

function findSlot(load: number[], start: number, end: number): number {
  for (let w = start; w <= Math.min(end, TOTAL_WEEKS); w++) {
    if (load[w] < MAX_GAMES_PER_WEEK) return w
  }
  // Se janela lotada, tenta a semana seguinte ao end (overflow controlado)
  for (let w = end + 1; w <= TOTAL_WEEKS; w++) {
    if (load[w] < MAX_GAMES_PER_WEEK) return w
  }
  return -1
}

// ── Competições por clube ─────────────────────────────────
// Reflete a realidade do Brasileirão 2026
export const CLUB_COMPETITIONS: Record<string, string[]> = {
  spfc:      ['paulistao',        'libertadores',  'copa_brasil', 'brasileirao'],
  palmeiras: ['paulistao',        'libertadores',  'copa_brasil', 'brasileirao'],
  fla:       ['carioca',          'libertadores',  'copa_brasil', 'brasileirao'],
  atl:       ['mineiro',          'libertadores',  'copa_brasil', 'brasileirao'],
  bot:       ['carioca',          'sulamericana',  'copa_brasil', 'brasileirao'],
  int:       ['gaucho',           'libertadores',  'copa_brasil', 'brasileirao'],
  cor:       ['paulistao',        'sulamericana',  'copa_brasil', 'brasileirao'],
  cru:       ['mineiro',          'sulamericana',  'copa_brasil', 'brasileirao'],
  gre:       ['gaucho',           'libertadores',  'copa_brasil', 'brasileirao'],
  cap:       ['paranaense',       'sulamericana',  'copa_brasil', 'brasileirao'],
  bra:       ['paulistao',        'sulamericana',  'copa_brasil', 'brasileirao'],
  for:       ['cearense',         'copa_nordeste', 'copa_brasil', 'brasileirao'],
  vas:       ['carioca',                           'copa_brasil', 'brasileirao'],
  bah:       ['baiano',           'copa_nordeste', 'copa_brasil', 'brasileirao'],
  san:       ['paulistao',                         'copa_brasil', 'brasileirao'],
  goi:       ['goiano',                            'copa_brasil', 'brasileirao'],
  ame:       ['mineiro',                           'copa_brasil', 'brasileirao'],
  cru2:      ['cearense',         'copa_nordeste', 'copa_brasil', 'brasileirao'],
  spo:       ['pernambucano',     'copa_nordeste', 'copa_brasil', 'brasileirao'],
  csa:       ['estadual_default',                  'copa_brasil', 'brasileirao'],
}

// Prestígio das copas (peso na penalidade de confiança)
export const CUP_PRESTIGE: Record<string, number> = {
  libertadores:  3,
  sulamericana:  2,
  copa_brasil:   2,
  copa_nordeste: 1,
  paulistao:     1,
  carioca:       1,
  gaucho:        1,
  mineiro:       1,
  paranaense:    1,
  baiano:        1,
  goiano:        1,
  cearense:      1,
  pernambucano:  1,
  estadual_default: 1,
}

// Gera o calendário do clube com base no CLUB_COMPETITIONS map
export function buildClubCalendar(clubId: string): CalendarGame[] {
  const comps = CLUB_COMPETITIONS[clubId] ?? ['brasileirao']
  return buildCalendar(comps)
}

// ── Helper: calendário do SPFC (compatibilidade) ──────────
export const SPFC_COMPETITIONS = CLUB_COMPETITIONS['spfc']

export function buildSPFCCalendar(): CalendarGame[] {
  return buildClubCalendar('spfc')
}

// ── Estatísticas do calendário (para debug/teste) ────────

export interface CalendarStats {
  totalGames:    number
  byCompetition: Record<string, number>
  busyWeeks:     number   // semanas com 2 jogos
  emptyWeeks:    number   // semanas sem jogo
  peakWeek:      number
  weekDistribution: number[]  // índice = semana, valor = jogos
}

export function calcStats(calendar: CalendarGame[]): CalendarStats {
  const dist = new Array<number>(TOTAL_WEEKS + 1).fill(0)
  const byComp: Record<string, number> = {}

  for (const g of calendar) {
    dist[g.week]++
    byComp[g.competitionShort] = (byComp[g.competitionShort] ?? 0) + 1
  }

  return {
    totalGames:       calendar.length,
    byCompetition:    byComp,
    busyWeeks:        dist.filter(v => v === 2).length,
    emptyWeeks:       dist.slice(1).filter(v => v === 0).length,
    peakWeek:         dist.indexOf(Math.max(...dist.slice(1))),
    weekDistribution: dist,
  }
}
