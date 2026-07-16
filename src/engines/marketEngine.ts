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

// ── Luva de empréstimo ───────────────────────────────────
// Paga ao ATLETA para convencê-lo a descer de nível. É um SINK: o dinheiro
// some — não vai para o clube cedente nem para lugar nenhum.
//
// Objetivo: dificultar que um clube pequeno acumule atletas muito acima do seu
// nível pagando pouco. O motor é o EXCEDENTE (quanto o atleta supera a média do
// elenco do comprador), em curva acelerada.
//
//   cross-division (comprador de divisão INFERIOR):  K       × forca × (1+exc/10)² × gap
//   mesma divisão (gap 0), só se exc >= 8:           K_intra × forca × (exc/10)²
//   inferior → superior (clube grande pega de série menor): sem luva
//
// A ausência do "+1" no ramo intra é proposital: reforço "no seu nível" sai de
// graça; só encarece quem puxa alguém bem acima da própria média.
export const LUVA_K       = 10_000   // cross-division
export const LUVA_K_INTRA = 4_000    // mesma divisão (mais suave)
export const LUVA_EXC_MIN = 8        // excedente mínimo p/ cobrar luva intra

export type LuvaKind = 'none' | 'intra' | 'cross'

export interface LuvaResult {
  luva:      number
  excedente: number
  gap:       number
  kind:      LuvaKind
}

export function calcLuva(
  forca:        number,
  myClubForce:  number,
  buyerDivision:  number,
  sellerDivision: number,
): LuvaResult {
  const excedente = Math.max(0, forca - myClubForce)
  const gap       = buyerDivision - sellerDivision   // >0 = comprador é de divisão inferior
  const round10k  = (v: number) => Math.round(v / 10_000) * 10_000

  if (gap > 0) {
    const luva = round10k(LUVA_K * forca * Math.pow(1 + excedente / 10, 2) * gap)
    return { luva, excedente, gap, kind: 'cross' }
  }
  if (gap === 0 && excedente >= LUVA_EXC_MIN) {
    const luva = round10k(LUVA_K_INTRA * forca * Math.pow(excedente / 10, 2))
    return { luva, excedente, gap, kind: 'intra' }
  }
  return { luva: 0, excedente, gap, kind: 'none' }
}

// ── Custo total de um empréstimo ─────────────────────────
// FONTE ÚNICA DE VERDADE: a UI (para exibir antes de confirmar) e o store (para
// cobrar) chamam esta mesma função. A divergência entre as duas era exatamente
// o que fazia o jogador clicar sem saber quanto ia pagar.
export const LOAN_SALARY_MONTHS = 6   // sinal adiantado, em meses de salário

export interface LoanCost {
  signing: number   // sinal adiantado (6 meses de salário) — despesa, não volta
  salary:  number   // salário mensal, cobrado enquanto durar o empréstimo
  luva:    number
  total:   number   // o que sai do caixa AGORA
  kind:    LuvaKind
  excedente: number
}

export function calcLoanCost(
  player:         Player,
  myClubForce:    number,
  buyerDivision:  number,
  sellerDivision: number,
): LoanCost {
  const salary  = calcSalary(player)
  const signing = salary * LOAN_SALARY_MONTHS
  const l       = calcLuva(player.forca, myClubForce, buyerDivision, sellerDivision)
  return {
    signing,
    salary,
    luva:      l.luva,
    total:     signing + l.luva,
    kind:      l.kind,
    excedente: l.excedente,
  }
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

export const MAX_LOANS_PER_SEASON = 3

export interface EligibilityOpts {
  player:          Player
  sellerClubForce: number   // força média do elenco vendedor
  buyerClubForce:  number   // força média do elenco comprador (elenco VIVO)
  buyerBudget:     number
  type:            TransferType
  buyerDivision:   number
  sellerDivision:  number
  loansThisSeason: number
  fromClubId:      string
  /** Adversário do clube do jogador na rodada atual — sem negócios entre eles */
  blockedClubId:   string | null
}

/**
 * Verifica se uma transferência é permitida pelas regras do jogo.
 *
 * Compra:
 *  - força do comprador ≥ força do vendedor − 10
 *  - saldo ≥ passe + 6× salário
 *
 * Empréstimo:
 *  - SEM gate de força: quem freia é a luva (encarecer, não proibir)
 *  - máx. 3 por temporada
 *  - saldo ≥ sinal (6× salário) + luva
 *
 * Ambos: nada de negócios com o adversário da rodada.
 */
export function checkTransferEligibility(o: EligibilityOpts): EligibilityResult {
  const { player, type, buyerBudget } = o

  // Regra 0 — anti-exploit: não se negocia com quem se enfrenta nesta rodada
  if (o.blockedClubId && o.fromClubId === o.blockedClubId) {
    return {
      allowed: false,
      reason: 'Vocês se enfrentam nesta rodada — sem negócios entre os dois clubes.',
    }
  }

  if (type === 'loan') {
    // Regra 1 — limite por temporada
    if (o.loansThisSeason >= MAX_LOANS_PER_SEASON) {
      return {
        allowed: false,
        reason: `Limite de ${MAX_LOANS_PER_SEASON} empréstimos por temporada atingido. Zera na próxima temporada.`,
      }
    }
    // Regra 2 — saldo (sinal + luva). NÃO há gate de força: a luva é o freio.
    const cost = calcLoanCost(player, o.buyerClubForce, o.buyerDivision, o.sellerDivision)
    if (buyerBudget < cost.total) {
      const detalhe = cost.luva > 0
        ? `sinal R$ ${fmtValue(cost.signing)} + luva R$ ${fmtValue(cost.luva)}`
        : `sinal de 6 meses de salário`
      return {
        allowed: false,
        reason: `Saldo insuficiente. Necessário: R$ ${fmtValue(cost.total)} (${detalhe}).`,
      }
    }
    return { allowed: true }
  }

  // ── Compra ────────────────────────────────────────────
  const minForce = o.sellerClubForce - 10
  if (o.buyerClubForce < minForce) {
    const diff = Math.ceil(minForce - o.buyerClubForce)
    return {
      allowed: false,
      reason: `Clube muito fraco para esta compra. Precisa de mais ${diff} pontos de força.`,
    }
  }

  const passe   = calcPasse(player)
  const reserve = calcSalary(player) * 6
  const needed  = passe + reserve
  if (buyerBudget < needed) {
    return {
      allowed: false,
      reason: `Saldo insuficiente. Necessário: R$ ${fmtValue(needed)} (passe + 6 meses de salário).`,
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
