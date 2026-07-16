// ════════════════════════════════════════════════════════
//  GLfoot — Club Goals & Contract System
//  Define as metas de cada clube ao assinar contrato,
//  e calcula o orçamento inicial proporcional à força.
//
//  A meta sai da FORÇA do clube (média dos atletas) — não existe mais
//  sistema de Tiers. As faixas vêm de clubStrength (fonte única).
// ════════════════════════════════════════════════════════
import { forceBand, type ForceBand } from '@/data/clubStrength'

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

// ── Meta por faixa de força ──────────────────────────────
const GOALS_BY_BAND: Record<ForceBand, ContractGoal> = {
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
}

/**
 * Retorna as metas contratuais do clube a partir da sua força (média dos atletas).
 *
 * Antes existia um `tierByForce` local com limiares 75/68/58 que DIVERGIAM dos
 * tiers reais (Athletico-PR e Goiás caíam na meta errada). Ele nunca disparava
 * porque todos os call sites passavam o tier explícito. Agora a faixa vem de
 * `forceBand` (clubStrength), com limiares validados contra os dados reais —
 * fonte única de verdade.
 */
export function getContractGoal(forca: number): ContractGoal {
  return GOALS_BY_BAND[forceBand(forca)]
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
