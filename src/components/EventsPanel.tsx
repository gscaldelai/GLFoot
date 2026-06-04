import { useMatchStore } from '@/stores/useMatchStore'
import type { MatchEvent } from '@/engines/types'

const COLOR: Record<MatchEvent['type'], string> = {
  'goal':      'border-l-gold   bg-[#181400]',
  'goal-away': 'border-l-palm   bg-[#001a08]',
  'yellow':    'border-l-[#f4d03f] bg-[#151200]',
  'red':       'border-l-glred  bg-[#150000]',
  'foul':      'border-l-[#e67e22] bg-[#130a00]',
  'sub':       'border-l-glgreen bg-[#0a1400]',
}

export default function EventsPanel() {
  const events = useMatchStore(s => s.events)

  return (
    <div className="w-[180px] flex-shrink-0 bg-surface border-l border-border flex flex-col overflow-hidden">
      <div className="text-[9px] font-bold tracking-[2px] text-gold uppercase px-[10px] py-[10px] pb-[6px]
                      border-b border-border">
        ⚡ EVENTOS
      </div>
      <div className="flex-1 overflow-y-auto p-[6px_8px] flex flex-col gap-1">
        {events.map((ev, i) => (
          <div
            key={i}
            className={`rounded px-[7px] py-[5px] border-l-2 text-[10px] text-[#ccc] leading-[1.4] anim-evin
                        ${COLOR[ev.type] ?? 'border-l-border bg-surface2'}`}
            dangerouslySetInnerHTML={{ __html: (ev.icon ? `${ev.icon} ` : '') + ev.html }}
          />
        ))}
        {events.length === 0 && (
          <div className="text-[11px] text-gray-600 py-2">Nenhum evento ainda</div>
        )}
      </div>
    </div>
  )
}
