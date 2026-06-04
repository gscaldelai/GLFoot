import type { Player } from '@/engines/types'
import { useMatchStore } from '@/stores/useMatchStore'

interface Props {
  side:   'home' | 'away'
  bench:  Player[]
  colors: [string, string, string]
  label:  string
}

export default function BenchZone({ side, bench, colors, label }: Props) {
  const setDrag   = useMatchStore(s => s.setDragSrc)
  const subCount  = useMatchStore(s => s.subCount)
  const myClubId  = useMatchStore(s => s.myClubId)
  const homeClub  = useMatchStore(s => s.homeClub)
  const ended     = useMatchStore(s => s.ended)
  const [bg, stripe, detail] = colors

  const isMyBench  = (side === 'home' && myClubId === homeClub?.id)
                  || (side === 'away' && myClubId !== homeClub?.id)
  const canDrag    = isMyBench && !ended && subCount[side] < 3

  return (
    <div className="flex items-center gap-1 px-2 h-[68px] bg-black/35
                    border border-dashed border-white/12 rounded-md overflow-x-auto flex-shrink-0">
      {/* Label */}
      <div className="text-[9px] tracking-widest text-white/30 uppercase [writing-mode:vertical-rl] flex-shrink-0 mr-1">
        {label}
      </div>

      {bench.map((p, i) => {
        const used = p.injured // reutilizamos o flag para "usado na sub"
        if (used) return null
        const w = Math.round(((p.forca - 60) / 39) * 100)

        return (
          <div key={i} className="flex flex-col items-center gap-[1px] flex-shrink-0">
            {/* Disco */}
            <div
              className={`relative w-[44px] h-[44px] rounded-full border-2 border-white/25 overflow-hidden
                          flex items-start justify-center bg-[#f0f0f0]
                          ${canDrag ? 'cursor-grab hover:scale-110 hover:shadow-[0_4px_12px_rgba(240,192,64,.4)]' : 'opacity-50 cursor-default'}
                          transition-transform duration-150`}
              draggable={canDrag}
              onDragStart={e => {
                if (!canDrag) { e.preventDefault(); return }
                setDrag({ side, idx: i, player: p })
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragEnd={() => setDrag(null)}
            >
              <span className="font-anton text-[11px] text-[#111] absolute top-[2px] z-10 leading-none">
                {p.num}
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-[62%] overflow-hidden">
                <div className="absolute inset-0" style={{ background: bg }} />
                <div className="absolute left-0 right-0" style={{ top: '30%', height: '28%', background: stripe }} />
                <div className="absolute bottom-0 left-0 right-0" style={{ height: '20%', background: detail || bg }} />
              </div>
              <span className="font-bebas text-[9px] text-gold absolute bottom-[1px] right-[1px] z-10
                               bg-black/70 rounded px-[1px] leading-[1.2]">
                {p.forca}
              </span>
            </div>

            {/* Nome e força */}
            <div className="text-[7px] font-bold text-white text-center max-w-[46px] overflow-hidden
                            text-ellipsis whitespace-nowrap [text-shadow:1px_1px_2px_#000]">
              {p.name}
            </div>
            <div className="w-[36px] h-[2px] bg-border rounded overflow-hidden">
              <div className="h-full bg-gold rounded" style={{ width: `${w}%` }} />
            </div>
          </div>
        )
      })}

      {subCount[side] >= 3 && (
        <div className="text-[9px] text-white/30 ml-2 flex-shrink-0">Subs esgotadas</div>
      )}
    </div>
  )
}
