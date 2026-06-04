// ════════════════════════════════════════════════════════
//  GLfoot — Club Goals & Contract System
//  Define as metas de cada clube ao assinar contrato,
//  e calcula o orçamento inicial proporcional à força.
// ════════════════════════════════════════════════════════

export type GoalType =
  | 'champion'       // Ser campeão da Série A
  | 'top4'           // Terminar entre os 4 primeiros
  | 'top8'           // Terminar entre os 8 primeiros
  | 'no_relegation'  // Não rebaixar (fora do Z-4)
  | 'survive'        // Terminar acima do último (Z-1)

export interface ContractGoal {
  primary:   GoalType   // meta obrigatória — não atingir = pressão da diretoria
  secondary: GoalType   // meta bônus — atingir = bônus de confiança
  minPosition: number   // posição mínima aceitável na liga (1 = campeão)
  label:     string     // descrição para exibição
  secondaryLabel: string
}

// ── Meta por tier ────────────────────────────────────────
const GOALS_BY_TIER: Record<string, ContractGoal> = {
  S: {
    primary:        'champion',
    secondary:      'champion',
    minPosition:    4,
    label:          'Ser Campeão Brasileiro',
    secondaryLabel: 'Título sem perder pontos em casa',
  },
  A: {
    primary:        'top4',
    secondary:      'champion',
    minPosition:    8,
    label:          'Terminar entre os 4 primeiros',
    secondaryLabel: 'Conquistar o título',
  },
  B: {
    primary:        'top8',
    secondary:      'top4',
    minPosition:    16,
    label:          'Terminar entre os 8 primeiros',
    secondaryLabel: 'Classificar para Libertadores',
  },
  C: {
    primary:        'no_relegation',
    secondary:      'top8',
    minPosition:    16,
    label:          'Não ser rebaixado',
    secondaryLabel: 'Terminar entre os 8 primeiros',
  },
  D: {
    primary:        'survive',
    secondary:      'no_relegation',
    minPosition:    19,
    label:          'Terminar acima do último',
    secondaryLabel: 'Sair do Z-4',
  },
}

// Mapa de tier por força média
function tierByForce(forcaMedia: number): string {
  if (forcaMedia >= 75) return 'S'
  if (forcaMedia >= 68) return 'A'
  if (forcaMedia >= 58) return 'B'
  if (forcaMedia >= 48) return 'C'
  return 'D'
}

/**
 * Retorna as metas contratuais do clube.
 * Aceita o tier explícito (do CLUB_STRENGTH) ou calcula pelo forcaMedia.
 */
export function getContractGoal(
  tier: string | undefined,
  forcaMedia: number,
): ContractGoal {
  const t = tier ?? tierByForce(forcaMedia)
  return GOALS_BY_TIER[t] ?? GOALS_BY_TIER['C']
}

/**
 * Avalia se a meta primária foi cumprida ao fim da temporada.
 */
export function evaluateGoal(goal: ContractGoal, finalPosition: number): 'success' | 'partial' | 'fail' {
  const POSITION_TARGET: Record<GoalType, number> = {
    champion:      1,
    top4:          4,
    top8:          8,
    no_relegation: 16,  // fora do Z-4 de 20 clubes
    survive:       19,  // não ser o último
  }
  const target = POSITION_TARGET[goal.primary]
  if (finalPosition <= target)      return 'success'
  if (finalPosition <= goal.minPosition) return 'partial'
  return 'fail'
}

// ── Orçamento inicial por força ─────────────────────────
/**
 * Orçamento proporcional à força do elenco.
 * Fórmula: 10M × (forcaMedia / 75)^2.5
 * Range: ~R$500k (força 40) a ~R$12M (força 80)
 * Arredondado para múltiplos de R$500k.
 */
export function calcInitialBudget(forcaMedia: number): number {
  const raw  = 10_000_000 * Math.pow(forcaMedia / 75, 2.5)
  const rounded = Math.round(raw / 500_000) * 500_000
  return Math.max(500_000, Math.min(15_000_000, rounded))
}

// ── Mapa de força por tier (para exibição quando não há dado real) ──
export const TIER_FORCE_ESTIMATE: Record<string, number> = {
  S: 77, A: 72, B: 63, C: 52, D: 43,
}
