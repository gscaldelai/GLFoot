import { useRef } from 'react'
import type { Player } from '@/engines/types'
import { useMatchStore } from '@/stores/useMatchStore'
import { POS_INITIAL } from '@/data/formations'

interface Props {
  player:   Player
  fieldIdx: number
  side:     'home' | 'away'
  colors:   [string, string, string]
  justSubbed?: boolean
}

export default function PlayerDisc({ player, fieldIdx, side, colors, justSubbed }: Props) {
  const doSub    = useMatchStore(s => s.doSub)
  const dragSrc  = useMatchStore(s => s.dragSrc)
  const setDrag  = useMatchStore(s => s.setDragSrc)
  const ended    = useMatchStore(s => s.ended)
  const myClubId = useMatchStore(s => s.myClubId)
  const homeClub = useMatchStore(s => s.homeClub)
  const awayClub = useMatchStore(s => s.awayClub)

  const ref = useRef<HTMLDivElement>(null)
  const [bg, stripe, detail] = colors
  const w = Math.round(((player.forca - 60) / 39) * 100)

  const myTeam = myClubId === homeClub?.id ? 'home' : 'away'
  const canReceive = dragSrc !== null && dragSrc.side === side && side === myTeam && !ended
  void awayClub

  function onDragOver(e: React.DragEvent) {
    if (!canReceive) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    ref.current?.classList.add('ring-2', 'ring-gold')
  }

  function onDragLeave() {
    ref.current?.classList.remove('ring-2', 'ring-gold')
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    ref.current?.classList.remove('ring-2', 'ring-gold')
    if (!dragSrc || dragSrc.side !== side || side !== myTeam) return
    doSub(side, fieldIdx, dragSrc.idx)
    setDrag(null)
  }

  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 z-10
                 hover:z-20 hover:scale-110 transition-transform duration-150 cursor-default select-none"
      style={{ left: `${player.fieldPos[0]}%`, top: `${player.fieldPos[1]}%` }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Disco */}
      <div
        ref={ref}
        className={`relative w-11 h-11 rounded-full border-2 border-[#bbb] overflow-hidden
                    flex items-start justify-center
                    shadow-[0_3px_8px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.4)]
                    ${justSubbed ? 'anim-subflash' : ''}`}
        style={{ background: '#f0f0f0' }}
      >
        {/* Número no topo */}
        <span className="font-anton text-[11px] text-[#111] absolute top-[3px] z-10 leading-none">
          {player.num}
        </span>
        {/* Lesionado (G-02) */}
        {player.injured && (
          <span className="absolute top-[1px] left-[2px] z-20 text-[10px] leading-none">🚑</span>
        )}
        {/* Camisa (parte de baixo) */}
        <div className="absolute bottom-0 left-0 right-0 h-[62%] overflow-hidden">
          <div className="absolute inset-0" style={{ background: bg }} />
          <div className="absolute left-0 right-0" style={{ top: '30%', height: '28%', background: stripe }} />
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '20%', background: detail || bg }} />
        </div>
        {/* Posição — 1 letra (badge inferior esquerdo, espelha a força) */}
        <span
          className="font-bebas text-[9px] text-[#8ab0c8] absolute bottom-[2px] left-[1px] z-10
                     bg-black/70 rounded px-[2px] leading-[1.2]"
        >
          {POS_INITIAL[player.pos]}
        </span>
        {/* Força (badge inferior direito) */}
        <span
          className="font-bebas text-[9px] text-gold absolute bottom-[2px] right-[1px] z-10
                     bg-black/70 rounded px-[2px] leading-[1.2]"
        >
          {player.forca}
        </span>
      </div>

      {/* Nome abaixo */}
      <div
        className="text-[8px] font-bold text-white leading-tight mt-[2px] text-center
                   max-w-[62px] overflow-hidden text-ellipsis whitespace-nowrap
                   [text-shadow:1px_1px_2px_#000,-1px_-1px_2px_#000]"
      >
        {player.name}
      </div>

      {/* Barra de força (tooltip-like) */}
      <div className="w-full flex items-center gap-1 mt-[1px] px-1">
        <div className="flex-1 h-[2px] bg-border rounded overflow-hidden">
          <div className="h-full bg-gold rounded" style={{ width: `${w}%` }} />
        </div>
      </div>
    </div>
  )
}
