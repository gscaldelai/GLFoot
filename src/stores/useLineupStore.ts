import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player } from '@/engines/types'
import {
  type FormationKey,
  assignToFormation,
  FORMATIONS,
  slotToMatchPos,
} from '@/data/formations'

interface DragSrc {
  source: 'field' | 'bench'
  idx:    number
}

interface LineupStore {
  formation: FormationKey
  slots:     (Player | null)[]   // 11 slots da formação atual
  bench:     Player[]            // jogadores no banco
  selected:  DragSrc | null      // slot selecionado (click-to-swap)
  dragSrc:   DragSrc | null      // drag em andamento

  // Inicializa com todos os jogadores do clube
  init: (allPlayers: Player[], formation?: FormationKey) => void

  // Troca de formação com auto-redistribuição
  setFormation: (f: FormationKey) => void

  // Clique em jogador (field ou bench) → seleciona ou troca com selecionado
  tapPlayer: (src: DragSrc) => void

  // Drag-and-drop
  setDragSrc:  (src: DragSrc | null) => void
  dropOn:      (target: DragSrc) => void

  // Tira lesionados do XI puxando o melhor reserva sadio (J-01).
  // Retorna true se mexeu na escalação.
  expelInjured: () => boolean

  // Retorna os 11 jogadores com fieldPos convertido para o campo horizontal
  getLineupForMatch: () => Player[]
}

function swapInStore(
  slots:  (Player | null)[],
  bench:  Player[],
  a: DragSrc,
  b: DragSrc,
): { slots: (Player | null)[]; bench: Player[] } {
  if (a.source === b.source && a.idx === b.idx) return { slots, bench }

  const newSlots = [...slots]
  const newBench = [...bench]

  const getPlayer = (src: DragSrc): Player | null =>
    src.source === 'field' ? newSlots[src.idx] : (newBench[src.idx] ?? null)

  const setPlayer = (src: DragSrc, p: Player | null) => {
    if (src.source === 'field') {
      newSlots[src.idx] = p
    } else {
      if (p) newBench[src.idx] = p
      else   newBench.splice(src.idx, 1)
    }
  }

  const pa = getPlayer(a)
  const pb = getPlayer(b)

  // Lesionado não pode entrar em campo (G-02) — tirar de campo é permitido
  const goesToField =
    b.source === 'field' ? pa :
    a.source === 'field' ? pb : null
  if (goesToField?.injured) return { slots, bench }

  // Se bench→field e não há jogador na bench target, simplesmente move
  if (a.source === 'bench' && b.source === 'field' && pb === null) {
    setPlayer(b, pa)
    newBench.splice(a.idx, 1)
    return { slots: newSlots, bench: newBench }
  }
  if (a.source === 'field' && b.source === 'bench' && pb === null) {
    setPlayer(a, null)
    newBench.push(pa!)
    return { slots: newSlots, bench: newBench }
  }

  // Troca padrão
  setPlayer(a, pb)
  setPlayer(b, pa)
  return { slots: newSlots, bench: newBench }
}

export const useLineupStore = create<LineupStore>()(
  persist(
    (set, get) => ({
  formation: '4-3-3',
  slots:     [],
  bench:     [],
  selected:  null,
  dragSrc:   null,

  init(allPlayers, formation) {
    // Usa a formação persistida se não for passada explicitamente
    const f = formation ?? get().formation ?? '4-3-3'
    const { slots, bench } = assignToFormation(allPlayers, f)
    set({ formation: f, slots, bench, selected: null, dragSrc: null })
  },

  setFormation(f) {
    const s = get()
    const all = [
      ...s.slots.filter(Boolean) as Player[],
      ...s.bench,
    ]
    const { slots, bench } = assignToFormation(all, f)
    set({ formation: f, slots, bench, selected: null })
  },

  tapPlayer(src) {
    const s = get()

    if (!s.selected) {
      // Primeira seleção
      set({ selected: src })
      return
    }

    // Desseleciona se clicar no mesmo
    if (s.selected.source === src.source && s.selected.idx === src.idx) {
      set({ selected: null })
      return
    }

    // Troca os dois
    const { slots, bench } = swapInStore(s.slots, s.bench, s.selected, src)
    set({ slots, bench, selected: null })
  },

  setDragSrc: (src) => set({ dragSrc: src }),

  dropOn(target) {
    const s = get()
    if (!s.dragSrc) return
    const { slots, bench } = swapInStore(s.slots, s.bench, s.dragSrc, target)
    set({ slots, bench, dragSrc: null, selected: null })
  },

  expelInjured() {
    const s = get()
    if (!s.slots.some(p => p?.injured)) return false
    const bench = [...s.bench]
    const slots = s.slots.map(p => {
      if (!p || !p.injured) return p
      // Prefere um reserva sadio da mesma posição; senão, qualquer sadio
      let j = bench.findIndex(b => !b.injured && b.pos === p.pos)
      if (j < 0) j = bench.findIndex(b => !b.injured)
      if (j < 0) return p   // banco sem reserva sadio — mantém e a UI avisa
      const sub = bench[j]
      bench[j] = p
      return sub
    })
    set({ slots, bench, selected: null })
    return true
  },

  getLineupForMatch() {
    const s = get()
    const formation = FORMATIONS[s.formation]
    return s.slots.map((player, i) => {
      if (!player) return null
      const fieldPos = slotToMatchPos(formation[i])
      return { ...player, fieldPos }
    }).filter(Boolean) as Player[]
  },
    }),
    {
      name: 'glfoot-lineup',
      version: 2,
      skipHydration: true,   // hidratação dirigida por userScope (R-10)
      // v2: persiste slots e bench — fadiga, lesões e contratados sobrevivem ao reload.
      // Se vazios após reidratar, o init() do ManagerHub reconstrói do JSON do clube.
      partialize: (s) => ({ formation: s.formation, slots: s.slots, bench: s.bench }),
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) {
          const old = persisted as { formation?: FormationKey } | undefined
          return { formation: old?.formation ?? '4-3-3', slots: [], bench: [] }
        }
        return persisted as { formation: FormationKey; slots: (Player | null)[]; bench: Player[] }
      },
    },
  ),
)
