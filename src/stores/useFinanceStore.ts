// ════════════════════════════════════════════════════════
//  GLfoot — Finance Store
//  Controla o saldo e o histórico de transações do clube.
//  Receitas: bilheteria, prêmios de campeonato
//  Despesas: salários do elenco, obras no estádio, transferências
// ════════════════════════════════════════════════════════
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player } from '@/engines/types'
import { calcSalary } from '@/engines/marketEngine'

// ── Tipos ────────────────────────────────────────────────
export type TransactionCategory =
  | 'bilheteria'
  | 'salarios'
  | 'transferencia'
  | 'expansao'
  | 'premio'
  | 'outro'

export interface FinanceTransaction {
  id:          string
  round:       number
  season:      number
  type:        'income' | 'expense'
  category:    TransactionCategory
  description: string
  amount:      number   // sempre positivo
  balance:     number   // saldo após a transação
}

interface FinanceStore {
  budget:       number
  transactions: FinanceTransaction[]

  // Adiciona receita ao saldo
  addIncome: (
    amount: number,
    category: TransactionCategory,
    description: string,
    round: number,
    season: number,
  ) => void

  // Deduz despesa do saldo
  addExpense: (
    amount: number,
    category: TransactionCategory,
    description: string,
    round: number,
    season: number,
  ) => void

  // Desconta folha salarial mensal (1 mês = a cada 4 rodadas)
  deductWages: (squad: Player[], bench: Player[], round: number, season: number) => void

  // Reseta finanças (nova carreira)
  reset: (initialBudget?: number) => void
}

// ── Helpers ──────────────────────────────────────────────
function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const INITIAL_BUDGET = 50_000_000

// ── Store ────────────────────────────────────────────────
export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
      budget:       INITIAL_BUDGET,
      transactions: [],

      addIncome(amount, category, description, round, season) {
        const newBudget = get().budget + amount
        const tx: FinanceTransaction = {
          id: makeId(), round, season, type: 'income',
          category, description, amount, balance: newBudget,
        }
        set(s => ({ budget: newBudget, transactions: [tx, ...s.transactions].slice(0, 200) }))
      },

      addExpense(amount, category, description, round, season) {
        const newBudget = Math.max(0, get().budget - amount)
        const tx: FinanceTransaction = {
          id: makeId(), round, season, type: 'expense',
          category, description, amount, balance: newBudget,
        }
        set(s => ({ budget: newBudget, transactions: [tx, ...s.transactions].slice(0, 200) }))
      },

      deductWages(squad, bench, round, season) {
        // Paga salário a cada 4 rodadas (≈ mensalmente)
        if (round % 4 !== 0) return
        const allPlayers = [...squad, ...bench].filter(Boolean) as Player[]
        const total = allPlayers.reduce((sum, p) => sum + calcSalary(p), 0)
        if (total <= 0) return
        get().addExpense(
          total,
          'salarios',
          `Folha salarial — mês ${Math.ceil(round / 4)} (T${season})`,
          round,
          season,
        )
      },

      reset(initialBudget = INITIAL_BUDGET) {
        set({ budget: initialBudget, transactions: [] })
      },
    }),
    { name: 'glfoot-finance', version: 1, skipHydration: true },
  ),
)
