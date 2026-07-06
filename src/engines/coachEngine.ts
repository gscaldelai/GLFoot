// ═══════════════════════════════════════════════════════
//  GLfoot — Coach Engine (Modo Carreira · QA F-01)
//
//  Técnicos NPC: geração, demissão por desempenho,
//  contratação com reputação mínima por tier e bônus de λ.
//
//  Bônus λ validado em teste de mesa (scripts/test-coach.js):
//    ±0.05 no máximo — média de gols/jogo permanece em 2.5–3.0
//  NÃO alterar constantes sem refazer o teste de mesa.
// ═══════════════════════════════════════════════════════

import { CLUB_STRENGTH } from '@/data/clubStrength'
import type { CompletedSeason } from '@/stores/useMatchStore'

export interface Coach {
  id:         string
  name:       string
  age:        number
  reputation: number        // 1–5 estrelas
  clubId:     string | null // null = mercado livre (desempregado)
  titles:     number
  firedCount: number
  hiredRound: number        // rodada em que assumiu o clube atual
  pressure:   number        // rodadas consecutivas de baixo desempenho
}

export interface CoachNews {
  round:  number
  season: number
  text:   string
}

// ── Regra central do F-01: reputação mínima para ser contratado por tier ──────
export const MIN_REPUTATION_BY_TIER: Record<'S' | 'A' | 'B' | 'C', number> = {
  S: 4,   // Flamengo, Atlético-MG só contratam 4★+
  A: 3,
  B: 2,
  C: 1,
}

// ── Bônus de λ por reputação do técnico ───────────────────────────────────────
// 3★ é neutro; 5★ = +0.05; 1★ = −0.05
export function coachLambdaBonus(reputation: number): number {
  return (reputation - 3) * 0.025
}

// ── Demissão por desempenho ────────────────────────────────────────────────────
const UNDERPERFORM_GAP    = 6   // posições abaixo do esperado
const PRESSURE_TO_FIRE    = 5   // rodadas consecutivas ruins até demitir
const GRACE_ROUNDS        = 5   // proteção: rodadas mínimas no cargo
const FIRST_EVAL_ROUND    = 6   // liga não demite antes da rodada 6

// ── Nomes fictícios de técnicos ────────────────────────────────────────────────
const FIRST = ['Edmilson', 'Ronaldo', 'Vanderlei', 'Oswaldo', 'Adenor', 'Cuca',
  'Dorival', 'Renato', 'Abel', 'Tite', 'Marcelo', 'Fernando', 'Odair', 'Lisca',
  'Zé Ricardo', 'Jair', 'Mano', 'Rogério', 'Vagner', 'Enderson', 'Argel',
  'Guto', 'Maurício', 'Antônio', 'Paulo', 'César', 'Hélio', 'Gilson', 'Nelsinho', 'Emerson']
const LAST = ['Ferreira', 'Sampaio', 'Luxemburgo', 'de Oliveira', 'Bachi',
  'Silveira', 'Júnior', 'Gaúcho', 'Braga', 'Nunes', 'Chamusca', 'Diniz',
  'Hellmann', 'Doriva', 'Ventura', 'Ceni', 'Mancini', 'Moreira', 'Fuchs',
  'Barroca', 'Pereira', 'dos Anjos', 'Carille', 'Autuori', 'Baptista', 'Lopes']

let nextCoachId = 1
function makeCoach(reputation: number, clubId: string | null, hiredRound = 0): Coach {
  return {
    id:         `npc-${nextCoachId++}`,
    name:       `${FIRST[Math.floor(Math.random() * FIRST.length)]} ${LAST[Math.floor(Math.random() * LAST.length)]}`,
    age:        38 + Math.floor(Math.random() * 25),
    reputation: Math.max(1, Math.min(5, reputation)),
    clubId,
    titles:     0,
    firedCount: 0,
    hiredRound,
    pressure:   0,
  }
}

/**
 * Gera os técnicos iniciais da carreira:
 * 1 por clube (exceto o do jogador) + 6 desempregados no mercado livre.
 */
export function generateInitialCoaches(playerClubId: string): Coach[] {
  const coaches: Coach[] = []
  for (const entry of CLUB_STRENGTH) {
    if (entry.id === playerClubId) continue
    const minRep = MIN_REPUTATION_BY_TIER[entry.tier]
    const rep    = minRep + (Math.random() < 0.35 ? 1 : 0)
    coaches.push(makeCoach(rep, entry.id))
  }
  // Mercado livre inicial: mix de reputações
  const freeReps = [1, 1, 2, 2, 3, 4]
  for (const rep of freeReps) coaches.push(makeCoach(rep, null))
  return coaches
}

/** Posição esperada de cada clube (rank por força média) */
export function expectedPositions(): Record<string, number> {
  const sorted = [...CLUB_STRENGTH].sort((a, b) => b.forcaMedia - a.forcaMedia)
  const map: Record<string, number> = {}
  sorted.forEach((e, i) => { map[e.id] = i + 1 })
  return map
}

export interface RoundResult {
  coaches: Coach[]
  news:    CoachNews[]
}

/**
 * Processa uma rodada: acumula pressão, demite e contrata.
 * `standings` deve estar ordenado (índice 0 = líder).
 */
export function processCoachRound(
  coaches:  Coach[],
  standings: { id: string }[],
  round:    number,
  season:   number,
): RoundResult {
  const expected = expectedPositions()
  const news: CoachNews[] = []
  let updated = coaches.map(c => ({ ...c }))

  const posOf: Record<string, number> = {}
  standings.forEach((r, i) => { posOf[r.id] = i + 1 })

  if (round >= FIRST_EVAL_ROUND) {
    // 1. Pressão e demissões
    for (const coach of updated) {
      if (!coach.clubId) continue
      if (round - coach.hiredRound < GRACE_ROUNDS) continue
      const actual = posOf[coach.clubId]
      const expect = expected[coach.clubId]
      if (actual === undefined || expect === undefined) continue

      if (actual - expect >= UNDERPERFORM_GAP) {
        coach.pressure++
        if (coach.pressure >= PRESSURE_TO_FIRE) {
          const clubName = CLUB_STRENGTH.find(e => e.id === coach.clubId)?.name ?? coach.clubId
          news.push({ round, season, text: `${clubName} demite ${coach.name} (${'★'.repeat(coach.reputation)})` })
          coach.clubId     = null
          coach.pressure   = 0
          coach.firedCount++
          coach.reputation = Math.max(1, coach.reputation - 1)
        }
      } else {
        coach.pressure = 0
      }
    }
  }

  // 2. Clubes sem técnico contratam do mercado livre
  const clubsWithCoach = new Set(updated.filter(c => c.clubId).map(c => c.clubId))
  for (const entry of CLUB_STRENGTH) {
    if (clubsWithCoach.has(entry.id)) continue
    // (clube do jogador não entra — nunca há Coach com clubId dele)
    if (!updated.some(c => c.clubId === null)) break

    const minRep   = MIN_REPUTATION_BY_TIER[entry.tier]
    const eligible = updated.filter(c => c.clubId === null && c.reputation >= minRep)

    let hire: Coach
    if (eligible.length) {
      hire = eligible.reduce((best, c) => (c.reputation > best.reputation ? c : best))
    } else {
      // Mercado sem ninguém à altura: diretoria aposta em um nome novo
      hire = makeCoach(minRep, null)
      updated = [...updated, hire]
    }
    hire.clubId     = entry.id
    hire.hiredRound = round
    hire.pressure   = 0
    news.push({ round, season, text: `${entry.name} contrata ${hire.name} (${'★'.repeat(hire.reputation)})` })
    clubsWithCoach.add(entry.id)
  }

  return { coaches: updated, news }
}

/**
 * Reputação do jogador (1–5★) derivada do histórico de temporadas.
 * Base 2★ · título +1 · G4 +0.5 · fração final pelo floor.
 */
export function calcPlayerReputation(completedSeasons: CompletedSeason[]): number {
  let rep = 2
  for (const s of completedSeasons) {
    if (s.isChampion)         rep += 1
    else if (s.position <= 4) rep += 0.5
    else if (s.position >= 17) rep -= 0.5
  }
  return Math.max(1, Math.min(5, Math.floor(rep)))
}

/**
 * Propostas para o jogador demitido: até 3 clubes cujo tier
 * aceita a reputação dele (excluindo o clube que o demitiu).
 */
export function buildPlayerOffers(
  playerReputation: number,
  excludeClubId: string | null,
): string[] {
  const eligible = CLUB_STRENGTH.filter(e =>
    e.id !== excludeClubId &&
    MIN_REPUTATION_BY_TIER[e.tier] <= playerReputation,
  )
  // Embaralha e pega até 3 — clubes mais fracos aparecem mais (mais vagas reais)
  const shuffled = [...eligible].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map(e => e.id)
}
