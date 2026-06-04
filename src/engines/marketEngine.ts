// ════════════════════════════════════════════════════════
//  GLfoot — Market Engine
//  Cálculo de valor de mercado, passe e salário dos atletas.
//  Fórmulas calibradas contra dados reais do Brasfoot.
// ════════════════════════════════════════════════════════

import type { Player, Pos } from './types'

// ── Escala base por posição (em R$) ─────────────────────
// Representa o valor de um jogador com forca=50 no pico de idade.
const BASE_VALUE: Record<Pos, number> = {
  ATA: 5_500_000,
  MEI: 5_000_000,
  VOL: 4_000_000,
  LAT: 4_000_000,
  ZAG: 3_800_000,
  GK:  4_000_000,
}

// ── Fator de idade para valor de mercado ────────────────
// Pico: 24–27 anos | Queda acentuada após os 33
export function ageFactor(age: number): number {
  if (age <= 18) return 0.55
  if (age <= 21) return 0.55 + (age - 18) * 0.10   // 0.65 → 0.85
  if (age <= 24) return 0.85 + (age - 21) * 0.05   // 0.90 → 1.00
  if (age <= 27) return 1.00
  if (age <= 30) return 1.00 - (age - 27) * 0.03   // 0.97 → 0.91
  if (age <= 33) return 0.91 - (age - 30) * 0.04   // 0.87 → 0.79
  if (age <= 36) return 0.79 - (age - 33) * 0.05   // 0.74 → 0.64
  return Math.max(0.35, 0.64 - (age - 36) * 0.06)  // queda final
}

// ── Valor de mercado ─────────────────────────────────────
// value = BASE × (forca/50) × ageFactor × potFactor
// potFactor: jogadores com potencial não realizado valem mais (perspectiva)
export function calcMarketValue(player: Player): number {
  const forceFactor = player.forca / 50
  const base        = BASE_VALUE[player.pos]
  const age         = ageFactor(player.age)
  const potBonus    = 1 + Math.max(0, player.potencial - player.forca) / 99 * 0.35
  const starBonus   = player.isStar ? 1.30 : 1.00
  const raw         = base * forceFactor * age * potBonus * starBonus
  // Arredonda para 100 mil
  return Math.max(100_000, Math.round(raw / 100_000) * 100_000)
}

// ── Valor do passe (pedido do clube) ─────────────────────
// Sempre acima do valor de mercado. Jogadores jovens têm prêmio maior.
export function calcPasse(player: Player): number {
  const mv      = calcMarketValue(player)
  const youth   = Math.max(0, 28 - player.age)       // 0 para ≥28
  const premium = 1.10 + youth * 0.015               // 1.10 a 1.25
  return Math.round(mv * premium / 50_000) * 50_000
}

// ── Salário mensal ────────────────────────────────────────
// salary = SALARY_BASE × (forca/50) × ageSalaryFactor
// O salário cai menos com a idade que o valor de mercado (experiência tem valor)
const SALARY_BASE: Record<Pos, number> = {
  ATA: 130_000,
  MEI: 120_000,
  VOL:  95_000,
  LAT:  95_000,
  ZAG:  90_000,
  GK:   90_000,
}

export function calcSalary(player: Player): number {
  const forceFactor     = player.forca / 50
  const base            = SALARY_BASE[player.pos]
  const ageSalaryFactor = Math.max(0.65, 1.0 - Math.max(0, player.age - 27) * 0.018)
  const raw             = base * forceFactor * ageSalaryFactor
  return Math.round(raw / 1000) * 1000
}

// ── Valor do elenco (soma dos valores de mercado) ────────
export function calcSquadValue(players: Player[]): number {
  return players.reduce((sum, p) => sum + calcMarketValue(p), 0)
}

// ── Algoritmo Estrela da Temporada ───────────────────────
// Roda ao fim de cada temporada, por liga.
// O jogador com maior pontuação recebe isStar = true (dura 1 temporada).
// GKs usam fórmula própria.

export interface StarCandidate {
  player:   Player
  clubId:   string
  score:    number
}

export function calcStarScore(player: Player): number {
  if (player.pos === 'GK') {
    // Goleiros: força + notas GL
    const avgNote = player.lastNotes.length
      ? player.lastNotes.reduce((a, b) => a + b, 0) / player.lastNotes.length
      : 70
    return player.forca * 0.5 + avgNote * 5
  }
  const avgNote = player.lastNotes.length
    ? player.lastNotes.reduce((a, b) => a + b, 0) / player.lastNotes.length
    : 70
  return player.forca * 0.5 + (player.gp ?? 0) * 3 + (player.assists ?? 0) * 2 + avgNote * 4
}

// Retorna o jogador estrela dado uma lista de candidatos (todos os jogadores da liga)
export function electSeasonStar(candidates: StarCandidate[]): StarCandidate | null {
  if (!candidates.length) return null
  return candidates.reduce((best, c) => c.score > best.score ? c : best)
}

// ── Elegibilidade de transferência ───────────────────────

export type TransferType = 'buy' | 'loan'

export interface EligibilityResult {
  allowed: boolean
  reason?: string   // mensagem exibida na UI quando bloqueado
}

/**
 * Verifica se uma transferência é permitida pelas regras do jogo.
 *
 * Regras:
 *  - Compra:    força do comprador ≥ força do vendedor − 10
 *  - Empréstimo: força do comprador ≥ força do vendedor − 25
 *  - Orçamento: comprador precisa ter passe + 6× salário disponível
 */
export function checkTransferEligibility(
  player:          Player,
  sellerClubForce: number,   // força média do elenco vendedor
  buyerClubForce:  number,   // força média do elenco comprador
  buyerBudget:     number,   // orçamento disponível do comprador
  type:            TransferType,
): EligibilityResult {
  const gap         = type === 'buy' ? 10 : 25
  const minForce    = sellerClubForce - gap

  // Regra 1 — força do clube comprador
  if (buyerClubForce < minForce) {
    const diff = Math.ceil(minForce - buyerClubForce)
    return {
      allowed: false,
      reason: type === 'buy'
        ? `Clube muito fraco para esta compra. Precisa de mais ${diff} pontos de força.`
        : `Diferença de força muito grande para empréstimo (máx. 25 pts).`,
    }
  }

  // Regra 2 — orçamento (apenas compra)
  if (type === 'buy') {
    const passe   = calcPasse(player)
    const reserve = calcSalary(player) * 6
    const needed  = passe + reserve
    if (buyerBudget < needed) {
      return {
        allowed: false,
        reason: `Saldo insuficiente. Necessário: R$ ${fmtValue(needed)} (passe + 6 meses de salário).`,
      }
    }
  }

  return { allowed: true }
}

// ── Formatadores ─────────────────────────────────────────

export function fmtValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `${Math.round(value / 1000)} mil`
  return `${value}`
}

export function fmtSalary(salary: number): string {
  if (salary >= 1_000_000) return `${(salary / 1_000_000).toFixed(1)}M`
  return `${Math.round(salary / 1000)} mil`
}
