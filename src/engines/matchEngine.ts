// ═══════════════════════════════════════════════════════
//  GLfoot — Match Engine (Poisson)
//
//  Validado: média 2.74 gols/jogo, 6.6% jogos 0×0
//  NÃO alterar fórmulas sem rodar scripts/test-poisson.js
// ═══════════════════════════════════════════════════════

import type { Player } from './types'

/**
 * Poisson sampler — método de Knuth
 * Gera um inteiro aleatório seguindo distribuição de Poisson(λ)
 */
export function poissonSample(lambda: number): number {
  if (lambda <= 0) return 0
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

/**
 * Calcula o parâmetro λ (gols esperados) para um time
 *
 * λ = 1.3 + (diffForça × 0.04) + (isHome ? 0.15 : 0) + formationBonus
 *
 * Resultado validado (sem bonus):
 *   SPFC (73.2) em casa vs PAL (74.1):
 *   λ_SPFC = 1.3 + (-0.9 × 0.04) + 0.15 = 1.414
 *   λ_PAL  = 1.3 + ( 0.9 × 0.04) + 0.00 = 1.336
 *   Média total = 2.75 gols/jogo ✅
 *
 * @param formationBonus  Bônus tático de formação (0–0.20). Fonte: formations.ts
 */
export function calcLambda(
  myAvg: number,
  oppAvg: number,
  isHome: boolean,
  formationBonus = 0,
): number {
  return Math.max(0.2, 1.3 + (myAvg - oppAvg) * 0.04 + (isHome ? 0.15 : 0) + formationBonus)
}

/**
 * Distribui `count` gols em minutos aleatórios entre 5–90
 * Usa bias para concentrar mais gols entre 20–80 (mais realista)
 */
export function scheduleGoalMinutes(count: number): number[] {
  const used = new Set<number>()
  const mins: number[] = []
  let tries = 0

  while (mins.length < count && tries < 400) {
    tries++
    // Curva com leve peso para o meio do jogo
    const m = Math.round(5 + Math.pow(Math.random(), 0.8) * 83)
    if (!used.has(m)) {
      used.add(m)
      mins.push(m)
    }
  }

  return mins.sort((a, b) => a - b)
}

/**
 * Escolhe o marcador do gol ponderado pela força individual
 * Jogadores com maior força têm proporcionalmente mais chance
 */
export function pickScorer(squad: Player[]): Player {
  const active = squad.filter(p => !p.injured)
  const total = active.reduce((s, p) => s + p.forca, 0)
  let r = Math.random() * total
  for (const p of active) {
    r -= p.forca
    if (r <= 0) return p
  }
  return active[active.length - 1] ?? squad[0]
}

/**
 * Calcula a força média de um elenco
 */
export function avgSquad(squad: Player[]): number {
  if (!squad.length) return 0
  return Math.round(squad.reduce((s, p) => s + p.forca, 0) / squad.length * 10) / 10
}
