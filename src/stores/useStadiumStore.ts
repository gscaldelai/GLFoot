// ════════════════════════════════════════════════════════
//  GLfoot — Stadium Store
//  Persiste o estado do estádio do clube por carreira:
//  capacidade atual, preços por categoria, obras em curso.
// ════════════════════════════════════════════════════════
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STADIUMS } from '@/data/stadiums'

export interface ExpansionProgress {
  stage:     number
  weeksLeft: number
}

interface StadiumStore {
  // ── Indexed by stadiumId ─────────────────────────────
  currentCapacity:  Record<string, number>
  tierPrices:       Record<string, Record<string, number>>   // stadiumId → tierName → price
  completedStages:  Record<string, number[]>
  inProgress:       Record<string, ExpansionProgress | null>

  // ── Actions ──────────────────────────────────────────
  getCapacity:    (stadiumId: string) => number
  getTierPrices:  (stadiumId: string) => Record<string, number>

  setTierPrice:   (stadiumId: string, tierName: string, price: number) => void
  resetTierPrice: (stadiumId: string, tierName: string) => void

  startExpansion: (stadiumId: string, stage: number, weeks: number) => void
  completeExpansion: (stadiumId: string, stage: number, addedSeats: number) => void
  advanceWeek:    (stadiumId: string) => void   // avança 1 semana de obra (futura)

  // Limpa tudo (nova carreira)
  reset: () => void
}

export const useStadiumStore = create<StadiumStore>()(
  persist(
    (set, get) => ({
      currentCapacity: {},
      tierPrices:      {},
      completedStages: {},
      inProgress:      {},

      getCapacity(stadiumId) {
        return get().currentCapacity[stadiumId] ?? STADIUMS[stadiumId]?.capacity ?? 0
      },

      getTierPrices(stadiumId) {
        const stored = get().tierPrices[stadiumId]
        if (stored) return stored
        // Defaults do catálogo
        const stadium = STADIUMS[stadiumId]
        if (!stadium) return {}
        return Object.fromEntries(stadium.tiers.map(t => [t.name, t.price]))
      },

      setTierPrice(stadiumId, tierName, price) {
        set(s => ({
          tierPrices: {
            ...s.tierPrices,
            [stadiumId]: { ...s.getTierPrices(stadiumId), [tierName]: price },
          },
        }))
      },

      resetTierPrice(stadiumId, tierName) {
        const stadium = STADIUMS[stadiumId]
        const tier = stadium?.tiers.find(t => t.name === tierName)
        if (!tier) return
        set(s => ({
          tierPrices: {
            ...s.tierPrices,
            [stadiumId]: { ...s.getTierPrices(stadiumId), [tierName]: tier.price },
          },
        }))
      },

      startExpansion(stadiumId, stage, weeks) {
        set(s => ({
          inProgress: { ...s.inProgress, [stadiumId]: { stage, weeksLeft: weeks } },
        }))
      },

      completeExpansion(stadiumId, stage, addedSeats) {
        const prev = get().currentCapacity[stadiumId] ?? STADIUMS[stadiumId]?.capacity ?? 0
        set(s => ({
          currentCapacity: { ...s.currentCapacity, [stadiumId]: prev + addedSeats },
          completedStages: {
            ...s.completedStages,
            [stadiumId]: [...(s.completedStages[stadiumId] ?? []), stage],
          },
          inProgress: { ...s.inProgress, [stadiumId]: null },
        }))
      },

      advanceWeek(stadiumId) {
        const prog = get().inProgress[stadiumId]
        if (!prog) return
        const weeksLeft = prog.weeksLeft - 1
        if (weeksLeft <= 0) {
          // Será completado quando o usuário confirmar — não auto-completa
          set(s => ({
            inProgress: { ...s.inProgress, [stadiumId]: { ...prog, weeksLeft: 0 } },
          }))
        } else {
          set(s => ({
            inProgress: { ...s.inProgress, [stadiumId]: { ...prog, weeksLeft } },
          }))
        }
      },

      reset() {
        set({ currentCapacity: {}, tierPrices: {}, completedStages: {}, inProgress: {} })
      },
    }),
    { name: 'glfoot-stadium', version: 1 },
  ),
)
