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
  | 'luva'          // paga ao atleta no empréstimo — sink, não credita ninguém
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

  // ── Seletores derivados (alimentam o extrato) ──────────
  getBySeason:     (season: number) => FinanceTransaction[]
  getSeasonTotals: (season: number) => {
    income: number; expense: number; result: number
    byCategory: Record<TransactionCategory, number>
  }
  seasonsWithData: () => number[]
}

// Rótulo + ícone por categoria — fonte única, usada no extrato e no StadiumView
export const CAT_LABEL: Record<TransactionCategory, { label: string; icon: string }> = {
  bilheteria:    { label: 'Bilheteria',    icon: '🎟' },
  salarios:      { label: 'Salários',      icon: '💼' },
  transferencia: { label: 'Transferência', icon: '🔁' },
  luva:          { label: 'Luva',          icon: '🤝' },
  expansao:      { label: 'Obras',         icon: '🏗' },
  premio:        { label: 'Prêmio',        icon: '🏆' },
  outro:         { label: 'Outro',         icon: '•'  },
}

// ── Helpers ──────────────────────────────────────────────
function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const INITIAL_BUDGET = 50_000_000

// Teto do histórico. Eram 200, o que engolia a temporada 1 antes do fim
// (38 rodadas × bilheteria + 9 folhas + transferências) e deixava o extrato
// sem o começo da carreira.
const TX_CAP = 2000

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
        set(s => ({ budget: newBudget, transactions: [tx, ...s.transactions].slice(0, TX_CAP) }))
      },

      addExpense(amount, category, description, round, season) {
        // Saldo PODE ficar negativo. Antes havia um Math.max(0, ...) que clampava
        // em zero mas registrava o valor cheio na transação — o extrato não
        // fechava (saldo não batia com a soma dos lançamentos) e a folha saía de
        // graça para quem estava quebrado. Dívida é um estado legítimo da carreira.
        const newBudget = get().budget - amount
        const tx: FinanceTransaction = {
          id: makeId(), round, season, type: 'expense',
          category, description, amount, balance: newBudget,
        }
        set(s => ({ budget: newBudget, transactions: [tx, ...s.transactions].slice(0, TX_CAP) }))
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

      getBySeason(season) {
        return get().transactions.filter(t => t.season === season)
      },

      getSeasonTotals(season) {
        const tx = get().transactions.filter(t => t.season === season)
        const byCategory = {} as Record<TransactionCategory, number>
        let income = 0, expense = 0
        for (const t of tx) {
          byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
          if (t.type === 'income') income += t.amount
          else                     expense += t.amount
        }
        return { income, expense, result: income - expense, byCategory }
      },

      seasonsWithData() {
        return [...new Set(get().transactions.map(t => t.season))].sort((a, b) => b - a)
      },
    }),
    { name: 'glfoot-finance', version: 1, skipHydration: true },
  ),
)
