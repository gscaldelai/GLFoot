// ════════════════════════════════════════════════════════
//  GLfoot — Transfer Store
//  Controla quais jogadores estão listados para venda/empréstimo.
//  Chave: `${clubId}_${playerNum}`
// ════════════════════════════════════════════════════════
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ListingEntry {
  forSale: boolean
  forLoan: boolean
}

interface TransferStore {
  listings: Record<string, ListingEntry>
  toggleSale: (clubId: string, playerNum: number) => void
  toggleLoan: (clubId: string, playerNum: number) => void
  isForSale:  (clubId: string, playerNum: number) => boolean
  isForLoan:  (clubId: string, playerNum: number) => boolean
  clearAll:   () => void
}

function key(clubId: string, playerNum: number): string {
  return `${clubId}_${playerNum}`
}

export const useTransferStore = create<TransferStore>()(
  persist(
    (set, get) => ({
      // Dados simulados — Palmeiras
      // À venda: Weverton (1, GK veterano), Rony (7, ATA 30 anos), Mayke (12, LAT reserva)
      // Empréstimo: Caio P. (6, LAT jovem), Lázaro (17, ATA 23 anos), Piquerez (22, LAT reserva)
      listings: {
        'palm_1':  { forSale: true,  forLoan: false },
        'palm_7':  { forSale: true,  forLoan: false },
        'palm_12': { forSale: true,  forLoan: false },
        'palm_6':  { forSale: false, forLoan: true  },
        'palm_17': { forSale: false, forLoan: true  },
        'palm_22': { forSale: false, forLoan: true  },
      },

      toggleSale(clubId, playerNum) {
        const k = key(clubId, playerNum)
        const prev = get().listings[k] ?? { forSale: false, forLoan: false }
        set(s => ({
          listings: { ...s.listings, [k]: { ...prev, forSale: !prev.forSale } },
        }))
      },

      toggleLoan(clubId, playerNum) {
        const k = key(clubId, playerNum)
        const prev = get().listings[k] ?? { forSale: false, forLoan: false }
        set(s => ({
          listings: { ...s.listings, [k]: { ...prev, forLoan: !prev.forLoan } },
        }))
      },

      isForSale(clubId, playerNum) {
        return get().listings[key(clubId, playerNum)]?.forSale ?? false
      },

      isForLoan(clubId, playerNum) {
        return get().listings[key(clubId, playerNum)]?.forLoan ?? false
      },

      clearAll() { set({ listings: {} }) },
    }),
    { name: 'glfoot-transfers', version: 1, skipHydration: true },
  ),
)
