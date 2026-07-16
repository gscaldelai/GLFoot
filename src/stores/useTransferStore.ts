// ════════════════════════════════════════════════════════
//  GLfoot — Transfer Store
//  Controla quais jogadores estão listados para venda/empréstimo.
//  Chave: `${clubId}_${playerNum}`
//
//  As listagens dos clubes bot são geradas pelo marketListingEngine:
//  seed no início da carreira/temporada e tick de rotatividade a cada rodada.
//  Antes só existia um seed demo do Palmeiras — apagado pelo clearAll do
//  selectClub (R-07) — e o mercado ficava vazio a carreira inteira.
// ════════════════════════════════════════════════════════
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CLUBS } from '@/data/clubs'
import {
  rollMarket, tickMarket as tickEngine, type ListingEntry,
} from '@/engines/marketListingEngine'

interface TransferStore {
  listings:      Record<string, ListingEntry>
  lastTickRound: number
  seededSeason:  number

  toggleSale: (clubId: string, playerNum: number) => void
  toggleLoan: (clubId: string, playerNum: number) => void
  isForSale:  (clubId: string, playerNum: number) => boolean
  isForLoan:  (clubId: string, playerNum: number) => boolean
  clearAll:   () => void

  /** Re-sorteia o mercado inteiro (nova carreira / virada de temporada). */
  seedMarket:   (season: number, myClubId: string | null) => void
  /** Rotatividade de uma rodada. */
  tickMarket:   (round: number, season: number, myClubId: string | null) => void
  /** Backfill idempotente: garante mercado em save que ficou sem ele. */
  ensureMarket: (round: number, season: number, myClubId: string | null) => void
  /** Tira um jogador do mercado (foi contratado). */
  unlist:       (clubId: string, playerNum: number) => void
}

function key(clubId: string, playerNum: number): string {
  return `${clubId}_${playerNum}`
}

export const useTransferStore = create<TransferStore>()(
  persist(
    (set, get) => ({
      listings:      {},
      lastTickRound: 0,
      seededSeason:  0,

      toggleSale(clubId, playerNum) {
        const k = key(clubId, playerNum)
        const prev = get().listings[k] ?? { forSale: false, forLoan: false, since: 0, season: 0 }
        set(s => ({
          listings: { ...s.listings, [k]: { ...prev, forSale: !prev.forSale } },
        }))
      },

      toggleLoan(clubId, playerNum) {
        const k = key(clubId, playerNum)
        const prev = get().listings[k] ?? { forSale: false, forLoan: false, since: 0, season: 0 }
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

      clearAll() { set({ listings: {}, lastTickRound: 0, seededSeason: 0 }) },

      seedMarket(season, myClubId) {
        set({
          listings:      rollMarket(CLUBS, 1, season, myClubId ?? undefined),
          seededSeason:  season,
          lastTickRound: 1,
        })
      },

      tickMarket(round, season, myClubId) {
        const s = get()
        if (s.lastTickRound === round && s.seededSeason === season) return  // idempotente
        set({
          listings:      tickEngine(CLUBS, round, season, s.listings, myClubId ?? undefined),
          lastTickRound: round,
          seededSeason:  season,
        })
      },

      ensureMarket(round, season, myClubId) {
        const s = get()
        if (s.seededSeason === season && Object.keys(s.listings).length > 0) return
        set({
          listings:      rollMarket(CLUBS, round, season, myClubId ?? undefined),
          seededSeason:  season,
          lastTickRound: round,
        })
      },

      unlist(clubId, playerNum) {
        const k = key(clubId, playerNum)
        set(s => {
          const next = { ...s.listings }
          delete next[k]
          return { listings: next }
        })
      },
    }),
    {
      name: 'glfoot-transfers',
      version: 2,
      skipHydration: true,   // hidratação dirigida por userScope (R-10)
      // v2: as listagens ganharam since/season e o seed demo do Palmeiras morreu.
      // Saves antigos guardam chaves palm_* sem esses campos — descarta e re-semeia.
      migrate: () => ({ listings: {}, lastTickRound: 0, seededSeason: 0 }),
    },
  ),
)
