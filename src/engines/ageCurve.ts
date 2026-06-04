// ═══════════════════════════════════════════════════════
//  GLfoot — Age Curve Engine (Offline / Modo Carreira)
//
//  Validado: 0 violações em 75 temporadas (5 atletas × 15T)
//  NÃO alterar fórmulas sem rodar scripts/test-agecurve.js
// ═══════════════════════════════════════════════════════

import type { Player, Pos } from './types'

// Curvas de pico por posição
interface AgeCurve {
  peakStart: number
  peakEnd:   number
  devRate:   number  // ganho por temporada na fase desenvolvimento
  decRate:   number  // perda por temporada na fase declínio
}

const AGE_CURVES: Record<Pos, AgeCurve> = {
  ATA: { peakStart: 24, peakEnd: 27, devRate: 1.8, decRate: 1.2 },
  MEI: { peakStart: 25, peakEnd: 29, devRate: 1.5, decRate: 0.9 },
  LAT: { peakStart: 24, peakEnd: 28, devRate: 1.6, decRate: 1.0 },
  VOL: { peakStart: 25, peakEnd: 29, devRate: 1.3, decRate: 0.8 },
  ZAG: { peakStart: 27, peakEnd: 31, devRate: 1.2, decRate: 0.8 },
  GK:  { peakStart: 29, peakEnd: 33, devRate: 1.0, decRate: 0.7 },
}

// Box-Muller gaussian noise
function gaussian(mean: number, std: number): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/**
 * Delta de força esperado para o atleta nessa idade/posição
 * Retorna o delta de uma TEMPORADA (38 jogos)
 */
export function ageDelta(age: number, pos: Pos): number {
  const c = AGE_CURVES[pos]

  if (age < c.peakStart) {
    // Fase desenvolvimento: cresce, mais rápido quando mais jovem
    const yearsToPeak = c.peakStart - age
    return c.devRate * (1 + (yearsToPeak > 3 ? 0.3 : 0))
  }

  if (age <= c.peakEnd) {
    // Fase pico: oscilação mínima
    return gaussian(0.1, 0.3)
  }

  // Fase declínio: acelera com a idade
  const yearsPast = age - c.peakEnd
  const accel = 1 + (yearsPast > 4 ? yearsPast * 0.12 : yearsPast * 0.06)
  return -(c.decRate * accel)
}

/**
 * Simula a performance de um jogador em uma única partida
 * Retorna uma nota GLfoot (60–99)
 */
export function simMatchPerformance(player: Player): number {
  const noise    = gaussian(0, 1.5)
  const moralAdj = (player.moral - 50) * 0.03       // -1.5 a +1.5
  const fatigue  = player.fatigue * -0.04            // cansaço acumulado
  const youth    = player.age < 21 ? gaussian(0, 1.0) : 0  // jovens: mais imprevisíveis
  const veteran  = player.age > 33 ? gaussian(0, -0.2) : 0 // veteranos: leve penalidade

  return Math.max(60, Math.min(99,
    Math.round((player.forca + noise + moralAdj + fatigue + youth + veteran) * 10) / 10
  ))
}

/**
 * Aplica o envelhecimento de fim de temporada a todo o elenco
 * Incrementa a idade e ajusta força pela age curve
 */
export function applyAging(squad: Player[]): Player[] {
  return squad.map(p => {
    const delta        = ageDelta(p.age, p.pos)
    const seasonNoise  = gaussian(0, 0.5)
    const novaForca    = Math.max(
      p.potencial - 25,
      Math.min(p.potencial, Math.round((p.forca + delta + seasonNoise) * 10) / 10)
    )
    return { ...p, age: p.age + 1, forca: novaForca }
  })
}

/**
 * Gera um jogador jovem da base com potencial oculto
 *
 * Distribuição de potencial:
 *   60–69: 40%  (reserva comum)
 *   70–79: 35%  (nível nacional)
 *   80–89: 20%  (elite)
 *   90–99:  5%  (crack)
 */
export function generateYouth(clubId: string, pos: Pos): Player {
  // Sorteia potencial com distribuição realista
  const roll = Math.random()
  let potencial: number
  if      (roll < 0.40) potencial = 60 + Math.floor(Math.random() * 10)
  else if (roll < 0.75) potencial = 70 + Math.floor(Math.random() * 10)
  else if (roll < 0.95) potencial = 80 + Math.floor(Math.random() * 10)
  else                  potencial = 90 + Math.floor(Math.random() * 10)

  const age           = 17 + Math.floor(Math.random() * 2)
  const forcaInicial  = Math.round(potencial * 0.60)
  const potVisto      = Math.round(potencial + gaussian(0, 10))

  return {
    name:              `Jovem ${clubId.toUpperCase()}`,
    num:               99,
    age,
    pos,
    posLabel:          pos,
    spec:              'VE',
    forca:             forcaInicial,
    forcaBase:         forcaInicial,
    potencial,
    potencialVisto:    Math.max(60, Math.min(99, potVisto)),
    moral:             70,
    fatigue:           0,
    fieldPos:          [0, 0] as [number, number],
    lastNotes:         [],
    matchesPlayed:     0,
    injured:           false,
    contractYearsLeft: 4,
    foot:              'D' as const,
    nationality:       'BRA',
    gp:                0,
    assists:           0,
  }
}

/**
 * Refina o potencialVisto conforme o atleta acumula partidas
 * Reduz o erro de estimativa gradualmente
 */
export function updatePotencialVisto(player: Player): Player {
  const { matchesPlayed, potencial, potencialVisto } = player
  let errorRange: number
  if      (matchesPlayed <= 10)  errorRange = 10
  else if (matchesPlayed <= 30)  errorRange = 7
  else if (matchesPlayed <= 60)  errorRange = 4
  else if (matchesPlayed <= 100) errorRange = 2
  else                            errorRange = 1

  // Ajusta o visto 10% em direção ao real a cada partida
  const correction = (potencial - potencialVisto) * 0.1
  const newVisto = Math.round(
    Math.max(potencial - errorRange, Math.min(potencial + errorRange,
      potencialVisto + correction + gaussian(0, errorRange * 0.2)
    ))
  )

  return { ...player, potencialVisto: newVisto }
}
