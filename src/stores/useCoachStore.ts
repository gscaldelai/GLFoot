// ════════════════════════════════════════════════════════
//  GLfoot — Coach Store (QA F-01)
//  Técnicos NPC dos 19 clubes bots + mercado livre + propostas
//  para o jogador demitido. Persistido em localStorage.
// ════════════════════════════════════════════════════════
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type Coach, type CoachNews,
  generateInitialCoaches, processCoachRound,
  calcPlayerReputation, buildPlayerOffers,
} from '@/engines/coachEngine'
import type { CompletedSeason } from './useMatchStore'

interface CoachStore {
  coaches:      Coach[]
  news:         CoachNews[]    // últimas movimentações (recente primeiro)
  playerOffers: string[]       // clubIds com proposta para o jogador demitido

  initCareer:   (playerClubId: string) => void
  processRound: (standings: { id: string }[], round: number, season: number) => void
  coachOf:      (clubId: string) => Coach | undefined
  freeAgents:   () => Coach[]

  // Fluxo de demissão do jogador
  generateOffers: (completedSeasons: CompletedSeason[], firedFromClubId: string | null) => number
  acceptOffer:    (clubId: string, round: number) => void
  clearOffers:    () => void

  onSeasonTurnover: () => void

  reset: () => void
}

export const useCoachStore = create<CoachStore>()(
  persist(
    (set, get) => ({
      coaches:      [],
      news:         [],
      playerOffers: [],

      initCareer(playerClubId) {
        set({ coaches: generateInitialCoaches(playerClubId), news: [], playerOffers: [] })
      },

      processRound(standings, round, season) {
        const { coaches, news } = processCoachRound(get().coaches, standings, round, season)
        set({
          coaches,
          news: [...news.reverse(), ...get().news].slice(0, 30),
        })
      },

      coachOf:    (clubId) => get().coaches.find(c => c.clubId === clubId),
      freeAgents: ()       => get().coaches.filter(c => c.clubId === null),

      generateOffers(completedSeasons, firedFromClubId) {
        const rep = calcPlayerReputation(completedSeasons)
        set({ playerOffers: buildPlayerOffers(rep, firedFromClubId) })
        return rep
      },

      acceptOffer(clubId, round) {
        // O técnico NPC do clube escolhido vai para o mercado livre
        const coaches = get().coaches.map(c =>
          c.clubId === clubId ? { ...c, clubId: null, pressure: 0 } : c,
        )
        set({ coaches, playerOffers: [] })
        void round
      },

      clearOffers: () => set({ playerOffers: [] }),

      // Virada de temporada: hiredRound é rodada absoluta DENTRO da temporada —
      // sem reset, técnico contratado no fim da temporada N mantém
      // round - hiredRound < GRACE_ROUNDS a temporada N+1 inteira (imune a
      // demissão). A pressão acumulada também não atravessa temporadas.
      onSeasonTurnover() {
        set({ coaches: get().coaches.map(c => ({ ...c, hiredRound: 0, pressure: 0 })) })
      },

      reset: () => set({ coaches: [], news: [], playerOffers: [] }),
    }),
    { name: 'glfoot-coaches', version: 1, skipHydration: true },
  ),
)
