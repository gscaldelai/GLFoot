import { useEffect, useRef } from 'react'
import { useLineupStore } from '@/stores/useLineupStore'
import { useMatchStore }  from '@/stores/useMatchStore'
import { CLUBS }          from '@/data/clubs'
import { FORMATIONS, FORMATION_LABELS, type FormationKey, type SlotDef } from '@/data/formations'
import type { Player } from '@/engines/types'

// ── Cores por tipo de slot ───────────────────────────────────────────────────
const SLOT_COLOR: Record<string, string> = {
  GK:  '#c8902a',
  DEF: '#1a6090',
  MID: '#1a7a40',
  FWD: '#902020',
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function LineupEditor() {
  const myClubId  = useMatchStore(s => s.myClubId)
  const prepMatch = useMatchStore(s => s.prepareMatch)
  const goToMatch = useMatchStore(s => s.goToMatch)
  const init      = useLineupStore(s => s.init)
  const formation = useLineupStore(s => s.formation)

  const myClub = CLUBS.find(c => c.id === myClubId) ?? CLUBS[0]
  const opp    = CLUBS.find(c => c.id !== myClubId) ?? CLUBS[1]

  // Inicializa apenas na primeira vez com o elenco completo
  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      init([...myClub.squad, ...myClub.bench])
    }
  }, [init, myClub])

  function handleJogar() {
    const lineup    = useLineupStore.getState().getLineupForMatch()
    const benchAll  = useLineupStore.getState().bench
    const isHome    = useMatchStore.getState().round % 2 === 1
    const homeClub  = isHome ? { ...myClub, squad: lineup, bench: benchAll } : opp
    const awayClub  = isHome ? opp : { ...myClub, squad: lineup, bench: benchAll }
    prepMatch(homeClub, awayClub)
    goToMatch()
  }

  return (
    <div className="flex flex-row h-full overflow-hidden">
      {/* ── Seletor de formação (esquerda) ── */}
      <FormationPicker />

      {/* ── Campo vertical (centro) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 py-3 min-w-0">
        {/* Header: clube + formação */}
        <div className="flex items-center gap-2 mb-2">
          <div className="font-bebas text-[20px] tracking-widest text-gold">{myClub.short}</div>
          <div className="text-[#4a6070] text-sm">·</div>
          <div className="font-bebas text-[20px] tracking-widest text-white/70">{formation}</div>
        </div>

        <VerticalField colors={myClub.colors} />

        {/* Botão jogar */}
        <button
          onClick={handleJogar}
          className="mt-3 bg-gradient-to-br from-[#158040] to-[#20c060] border-none rounded-lg
                     px-8 py-[10px] font-bebas text-[18px] tracking-[2px] text-black cursor-pointer
                     hover:scale-[1.04] hover:shadow-[0_4px_20px_rgba(32,192,96,.5)] transition-all duration-200"
        >
          ▶ JOGAR COM ESTA ESCALAÇÃO
        </button>
      </div>

      {/* ── Banco (direita) ── */}
      <BenchPanel colors={myClub.colors} />
    </div>
  )
}

// ── Seletor de formação ──────────────────────────────────────────────────────
function FormationPicker() {
  const formation    = useLineupStore(s => s.formation)
  const setFormation = useLineupStore(s => s.setFormation)

  const formations = Object.keys(FORMATION_LABELS) as FormationKey[]

  // Mini-diagramas derivados das definições em FORMATIONS (sem duplicação)
  const diagrams = Object.fromEntries(
    Object.entries(FORMATIONS).map(([key, slots]) => [
      key,
      slots.map(s => [s.x, s.y] as [number, number]),
    ])
  ) as Record<FormationKey, [number, number][]>

  return (
    <div className="w-[148px] flex-shrink-0 flex flex-col gap-[6px] py-3 px-2 border-r border-border overflow-y-auto">
      <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] px-1 mb-1">FORMAÇÃO</div>
      {formations.map(f => {
        const active = formation === f
        const pts    = diagrams[f]
        return (
          <button
            key={f}
            onClick={() => setFormation(f)}
            className={`w-full rounded-lg px-2 py-[6px] border transition-all duration-150 text-left
                        flex items-center gap-2
                        ${active
                          ? 'bg-gold/10 border-gold'
                          : 'bg-surface border-border hover:border-[#2a3d52] hover:bg-surface2'}`}
          >
            {/* Mini-diagrama SVG */}
            <svg width="36" height="48" viewBox="0 0 100 100" className="flex-shrink-0">
              {/* Campo verde */}
              <rect width="100" height="100" fill="#1a4a1a" rx="4" />
              {/* Linha do meio */}
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,.25)" strokeWidth="1.5" />
              {/* Pontos dos jogadores */}
              {pts.map(([px, py], i) => (
                <circle
                  key={i}
                  cx={px} cy={py} r={i === 0 ? 5 : 4.5}
                  fill={active ? '#f0c040' : '#6a8090'}
                  opacity={active ? 1 : 0.8}
                />
              ))}
            </svg>
            {/* Label */}
            <span className={`font-bebas text-[18px] tracking-[2px] leading-none ${active ? 'text-gold' : 'text-white/70'}`}>
              {f}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Campo vertical com jogadores ─────────────────────────────────────────────
export function VerticalField({ colors }: { colors: [string, string, string] }) {
  const slots     = useLineupStore(s => s.slots)
  const formation = useLineupStore(s => s.formation)
  const slotDefs  = FORMATIONS[formation]

  return (
    <div
      className="relative rounded-xl overflow-hidden border-2 border-[#1a5a1a]
                 shadow-[0_0_30px_rgba(0,100,0,.4)] flex-shrink-0"
      style={{
        width: 320, height: 460,
        background: 'repeating-linear-gradient(0deg,#2a7230 0,#2a7230 40px,#256320 40px,#256320 80px)',
      }}
    >
      {/* Marcações do campo */}
      <FieldLines />

      {/* Discos dos jogadores */}
      {slotDefs.map((slot, i) => {
        const player = slots[i]
        return (
          <SlotDisc
            key={i}
            slotIdx={i}
            slot={slot}
            player={player}
            colors={colors}
          />
        )
      })}
    </div>
  )
}

// Linhas do campo (orientação portrait)
function FieldLines() {
  return (
    <>
      {/* Borda interna */}
      <div className="absolute pointer-events-none border-2 border-white/30 rounded-sm" style={{ inset: 6 }} />
      {/* Linha do meio */}
      <div className="absolute pointer-events-none bg-white/30 h-[2px] left-[6px] right-[6px]" style={{ top: '50%' }} />
      {/* Círculo central */}
      <div className="absolute pointer-events-none border-2 border-white/30 rounded-full"
           style={{ left: '50%', top: '50%', width: 60, height: 60, transform: 'translate(-50%,-50%)' }} />
      {/* Ponto central */}
      <div className="absolute pointer-events-none bg-white/40 rounded-full"
           style={{ left: '50%', top: '50%', width: 5, height: 5, transform: 'translate(-50%,-50%)' }} />
      {/* Área penal topo (adversário) */}
      <div className="absolute pointer-events-none border-2 border-white/20"
           style={{ left: '50%', top: 6, width: 100, height: 56, transform: 'translateX(-50%)', borderTop: 'none' }} />
      {/* Área penal fundo (GK) */}
      <div className="absolute pointer-events-none border-2 border-white/20"
           style={{ left: '50%', bottom: 6, width: 100, height: 56, transform: 'translateX(-50%)', borderBottom: 'none' }} />
      {/* Gol fundo */}
      <div className="absolute pointer-events-none border-2 border-white/35 bg-white/5"
           style={{ left: '50%', bottom: 6, width: 44, height: 12, transform: 'translateX(-50%)', borderBottom: 'none' }} />
      {/* Gol topo */}
      <div className="absolute pointer-events-none border-2 border-white/35 bg-white/5"
           style={{ left: '50%', top: 6, width: 44, height: 12, transform: 'translateX(-50%)', borderTop: 'none' }} />
    </>
  )
}

// ── Disco de um slot no campo ─────────────────────────────────────────────────
interface SlotDiscProps {
  slotIdx: number
  slot:    SlotDef
  player:  Player | null
  colors:  [string, string, string]
}

function SlotDisc({ slotIdx, slot, player, colors }: SlotDiscProps) {
  const selected  = useLineupStore(s => s.selected)
  const dragSrc   = useLineupStore(s => s.dragSrc)
  const tapPlayer = useLineupStore(s => s.tapPlayer)
  const setDrag   = useLineupStore(s => s.setDragSrc)
  const dropOn    = useLineupStore(s => s.dropOn)

  const isSelected = selected?.source === 'field' && selected?.idx === slotIdx
  const isDragging = dragSrc?.source === 'field' && dragSrc?.idx === slotIdx

  const [bg, stripe, detail] = colors
  const slotColor = SLOT_COLOR[slot.posType]

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    dropOn({ source: 'field', idx: slotIdx })
  }

  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2
                 cursor-pointer select-none group"
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      onClick={() => tapPlayer({ source: 'field', idx: slotIdx })}
      draggable={!!player}
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDrag({ source: 'field', idx: slotIdx }) }}
      onDragEnd={() => setDrag(null)}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDrop={onDrop}
    >
      {player ? (
        <>
          {/* Disco com jogador */}
          <div
            className={`relative w-[42px] h-[42px] rounded-full overflow-hidden
                        flex items-start justify-center
                        border-2 shadow-[0_2px_8px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.35)]
                        transition-all duration-150 group-hover:scale-110
                        ${isDragging   ? 'opacity-40 scale-95' : ''}
                        ${isSelected   ? 'ring-[3px] ring-gold ring-offset-1 ring-offset-transparent scale-110' : 'border-[#bbb]'}`}
            style={{ background: '#f0f0f0' }}
          >
            <span className="font-anton text-[11px] text-[#111] absolute top-[3px] z-10 leading-none">
              {player.num}
            </span>
            <div className="absolute bottom-0 left-0 right-0 h-[62%] overflow-hidden">
              <div className="absolute inset-0" style={{ background: bg }} />
              <div className="absolute left-0 right-0" style={{ top: '30%', height: '28%', background: stripe }} />
              <div className="absolute bottom-0 left-0 right-0" style={{ height: '20%', background: detail || bg }} />
            </div>
            <span className="font-bebas text-[9px] text-gold absolute bottom-[2px] right-[1px] z-10
                             bg-black/70 rounded px-[2px] leading-[1.2]">
              {player.forca}
            </span>
          </div>
          {/* Nome */}
          <div className="text-[8px] font-bold text-white mt-[2px] max-w-[58px] text-center
                          overflow-hidden text-ellipsis whitespace-nowrap
                          [text-shadow:1px_1px_2px_#000,-1px_-1px_2px_#000]">
            {player.name}
          </div>
        </>
      ) : (
        /* Slot vazio */
        <div
          className="w-[42px] h-[42px] rounded-full border-2 border-dashed border-white/30
                     flex items-center justify-center"
          style={{ background: `${slotColor}22` }}
        >
          <span className="text-[9px] font-bold text-white/40">{slot.label}</span>
        </div>
      )}

      {/* Label de posição abaixo do nome */}
      <div
        className="text-[7px] font-bold tracking-wide px-1 rounded mt-[1px] leading-none py-[1px]"
        style={{ background: slotColor, color: '#fff', opacity: player ? 0.85 : 0.5 }}
      >
        {slot.label}
      </div>
    </div>
  )
}

// ── Painel do banco (direita) ─────────────────────────────────────────────────
function BenchPanel({ colors }: { colors: [string, string, string] }) {
  const bench     = useLineupStore(s => s.bench)
  const selected  = useLineupStore(s => s.selected)
  const dragSrc   = useLineupStore(s => s.dragSrc)
  const tapPlayer = useLineupStore(s => s.tapPlayer)
  const setDrag   = useLineupStore(s => s.setDragSrc)
  const dropOn    = useLineupStore(s => s.dropOn)

  const [bg, stripe, detail] = colors

  return (
    <div className="w-[160px] flex-shrink-0 flex flex-col border-l border-border py-3 px-2 overflow-y-auto">
      <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-2 px-1">
        Banco · {bench.length}
      </div>

      <div className="flex flex-col gap-[6px]">
        {bench.map((player, i) => {
          const isSelected = selected?.source === 'bench' && selected?.idx === i
          const isDragging = dragSrc?.source === 'bench' && dragSrc?.idx === i
          const w = Math.round(((player.forca - 60) / 39) * 100)

          return (
            <div
              key={i}
              className={`flex items-center gap-2 p-[6px] rounded-lg border cursor-pointer
                          transition-all duration-150 hover:border-[#2a3d52]
                          ${isDragging   ? 'opacity-40' : ''}
                          ${isSelected   ? 'border-gold bg-gold/10' : 'border-border bg-surface hover:bg-surface2'}`}
              onClick={() => tapPlayer({ source: 'bench', idx: i })}
              draggable
              onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDrag({ source: 'bench', idx: i }) }}
              onDragEnd={() => setDrag(null)}
              onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
              onDrop={e => { e.preventDefault(); dropOn({ source: 'bench', idx: i }) }}
            >
              {/* Mini disco */}
              <div className="relative w-[34px] h-[34px] rounded-full border border-white/20 overflow-hidden
                               flex items-start justify-center bg-[#f0f0f0] flex-shrink-0">
                <span className="font-anton text-[10px] text-[#111] absolute top-[2px] z-10 leading-none">
                  {player.num}
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-[62%] overflow-hidden">
                  <div className="absolute inset-0" style={{ background: bg }} />
                  <div className="absolute left-0 right-0" style={{ top: '30%', height: '28%', background: stripe }} />
                  <div className="absolute bottom-0 left-0 right-0" style={{ height: '20%', background: detail || bg }} />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold text-white truncate leading-tight">
                  {player.name}
                </div>
                <div className="text-[9px] text-[#6a8090]">{player.posLabel}</div>
                <div className="flex items-center gap-1 mt-[2px]">
                  <span className="font-bebas text-[13px] text-gold leading-none">{player.forca}</span>
                  <div className="flex-1 h-[2px] bg-border rounded overflow-hidden">
                    <div className="h-full bg-gold/70 rounded" style={{ width: `${w}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {bench.length === 0 && (
          <div className="text-[11px] text-[#4a6070] text-center py-4">Todos titulares</div>
        )}
      </div>
    </div>
  )
}
