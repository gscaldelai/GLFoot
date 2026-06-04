// ═══════════════════════════════════════════════════════
//  GLfoot — Force Engine (Online)
//
//  Força Final = Base(50%) + Forma(35%) + Momentum(15%)
//  Validado: 0 violações em 40 rodadas × 4 atletas
//  NÃO alterar fórmulas sem rodar scripts/test-force.js
// ═══════════════════════════════════════════════════════

import type { Player } from './types'

// Pesos temporais para janela deslizante de 5 jogos
const TEMPORAL_WEIGHTS = [5, 4, 3, 2, 1] // mais recente primeiro

/**
 * Normaliza nota do Sofascore (0–10) para escala GLfoot (60–99)
 *
 * Tabela de referência:
 *   SS 6.0 → GL 73 (médio)
 *   SS 7.0 → GL 80 (bom)
 *   SS 8.0 → GL 86 (excelente)
 *   SS 9.0 → GL 93 (elite)
 *   SS 10.0 → GL 99 (perfeição)
 */
export function normalizeNote(sofascore: number): number {
  const clamped = Math.max(4.0, Math.min(10.0, sofascore))
  return Math.round(60 + ((clamped - 4.0) / 6.0) * 39)
}

/**
 * Calcula a forma como média ponderada dos últimos 5 jogos
 * Pesos: [5, 4, 3, 2, 1] (mais recente = peso 5)
 */
export function calcForma(lastNotes: number[]): number | null {
  const n = Math.min(lastNotes.length, 5)
  if (n === 0) return null
  let sumW = 0, sumWN = 0
  for (let i = 0; i < n; i++) {
    sumWN += lastNotes[i] * TEMPORAL_WEIGHTS[i]
    sumW  += TEMPORAL_WEIGHTS[i]
  }
  return sumWN / sumW
}

/**
 * Calcula o momentum: tendência das últimas 3 partidas vs 3 anteriores
 * Resultado limitado a ±3 pontos
 */
export function calcMomentum(lastNotes: number[]): number {
  if (lastNotes.length < 4) return 0
  const recent = lastNotes.slice(0, 3)
  const older  = lastNotes.slice(3, 6)
  if (older.length === 0) return 0
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length
  const avgOlder  = older.reduce((a, b) => a + b, 0)  / older.length
  const diff = avgRecent - avgOlder
  return Math.max(-3, Math.min(3, diff * 0.4))
}

/**
 * Calcula a força final aplicando teto (potencial) e piso (potencial - 15)
 */
export function calcForca(
  base: number,
  forma: number | null,
  momentum: number,
  potencial: number
): number {
  if (forma === null) return base
  const raw = (base * 0.50) + (forma * 0.35) + ((base + momentum) * 0.15)
  const teto = potencial
  const piso = potencial - 15
  return Math.max(piso, Math.min(teto, Math.round(raw * 10) / 10))
}

/**
 * Drift lento da base: 2% de convergência por jogo
 * novaBase = base + (notaGL - base) × 0.02
 */
export function driftBase(base: number, notaGL: number, potencial: number): number {
  const nova = base + (notaGL - base) * 0.02
  return Math.max(potencial - 15, Math.min(potencial, Math.round(nova * 10) / 10))
}

/**
 * Aplica tudo após uma partida:
 * 1. Normaliza nota Sofascore
 * 2. Atualiza janela de notas
 * 3. Recalcula forma e momentum
 * 4. Atualiza força final
 * 5. Faz drift da base
 */
export function updateAfterMatch(player: Player, sofascoreNote: number): Player {
  const notaGL = normalizeNote(sofascoreNote)
  const newNotes = [notaGL, ...player.lastNotes].slice(0, 6)
  const forma    = calcForma(newNotes)
  const momentum = calcMomentum(newNotes)
  const novaForca = calcForca(player.forcaBase, forma, momentum, player.potencial)
  const novaBase  = driftBase(player.forcaBase, notaGL, player.potencial)

  return {
    ...player,
    lastNotes:    newNotes,
    forca:        novaForca,
    forcaBase:    novaBase,
    matchesPlayed: player.matchesPlayed + 1,
  }
}
