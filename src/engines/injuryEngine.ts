// ═══════════════════════════════════════════════════════
//  GLfoot — Injury Engine (Modo Carreira · QA G-02)
//
//  Probabilidade de lesão por MINUTO de jogo (não por tick!),
//  ponderada por idade, fadiga e posição.
//
//  Calibração validada em teste de mesa (scripts/test-injury.js):
//    média 3–8 lesões por clube por temporada de 38 rodadas
//    lesões graves (≥11 rodadas) < 8% do total
//
//  NÃO alterar constantes sem refazer o teste de mesa.
// ═══════════════════════════════════════════════════════

import type { Player } from './types'

// Risco base por jogador por minuto de jogo.
// 11 jogadores × ~88 min × BASE × fator médio (~1.2) ≈ 0.14 lesão/time/partida
// → ~5 lesões por clube em 38 rodadas.
const BASE_RISK_PER_MIN = 0.00012

// ── Modificadores ─────────────────────────────────────────────────────────────
function ageRiskMod(age: number): number {
  if (age < 24)  return 0.90   // jovem, tecido resiliente
  if (age <= 29) return 1.00   // auge físico
  if (age <= 32) return 1.35   // começa a acumular desgaste
  return 1.70                   // veterano, alto risco
}

function fatigueRiskMod(fatigue: number): number {
  return 1 + fatigue * 1.2     // fadiga 1.0 → risco ×2.2
}

// GK quase não sofre lesão de contato/percurso
const GK_RISK_MOD = 0.40

/** Risco de lesão de um jogador em um minuto de jogo */
export function injuryRiskPerMinute(p: Player): number {
  const posMod = p.pos === 'GK' ? GK_RISK_MOD : 1
  return BASE_RISK_PER_MIN * ageRiskMod(p.age) * fatigueRiskMod(p.fatigue) * posMod
}

/**
 * Sorteia se ALGUÉM do time se lesiona neste minuto.
 * Retorna o índice do lesionado no squad, ou null.
 * Jogadores já lesionados não são sorteados.
 */
export function rollTeamInjury(squad: Player[]): number | null {
  const risks = squad.map(p => (p.injured ? 0 : injuryRiskPerMinute(p)))
  const total = risks.reduce((s, r) => s + r, 0)
  if (Math.random() >= total) return null

  // Alguém se lesionou — sorteia a vítima ponderada pelo risco individual
  let pick = Math.random() * total
  for (let i = 0; i < risks.length; i++) {
    pick -= risks[i]
    if (pick <= 0) return i
  }
  return risks.length - 1
}

// ── Duração e gravidade ───────────────────────────────────────────────────────
export interface InjuryRoll {
  rounds: number
  label:  string
}

/**
 * Sorteia duração (em rodadas) e tipo da lesão.
 *   leve      1–2 rodadas · 55%
 *   moderada  3–5 rodadas · 30%
 *   séria     6–10 rodadas · 12%
 *   grave     11–16 rodadas · 3%
 */
export function rollInjuryDuration(): InjuryRoll {
  const r = Math.random()
  if (r < 0.55) {
    const rounds = 1 + Math.floor(Math.random() * 2)          // 1–2
    return { rounds, label: rounds === 1 ? 'Pancada forte' : 'Estiramento leve' }
  }
  if (r < 0.85) {
    return { rounds: 3 + Math.floor(Math.random() * 3), label: 'Lesão muscular' }   // 3–5
  }
  if (r < 0.97) {
    return { rounds: 6 + Math.floor(Math.random() * 5), label: 'Lesão ligamentar' } // 6–10
  }
  return { rounds: 11 + Math.floor(Math.random() * 6), label: 'Ruptura de ligamento' } // 11–16
}

// ── Recuperação ───────────────────────────────────────────────────────────────

/** Marca um jogador como lesionado com a duração sorteada */
export function applyInjury(p: Player, roll: InjuryRoll): Player {
  return { ...p, injured: true, injuryRoundsLeft: roll.rounds, injuryLabel: roll.label }
}

/**
 * Avança 1 rodada de recuperação.
 * Ao chegar a 0 rodadas restantes, o jogador volta a ficar disponível.
 */
export function advanceInjuryRecovery(p: Player): Player {
  if (!p.injured) return p
  const left = Math.max(0, (p.injuryRoundsLeft ?? 1) - 1)
  return left === 0
    ? { ...p, injured: false, injuryRoundsLeft: 0, injuryLabel: undefined }
    : { ...p, injuryRoundsLeft: left }
}

/** Cura total (virada de temporada — recuperação na pré-temporada) */
export function healInjury(p: Player): Player {
  if (!p.injured && !(p.injuryRoundsLeft ?? 0)) return p
  return { ...p, injured: false, injuryRoundsLeft: 0, injuryLabel: undefined }
}
