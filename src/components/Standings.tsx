import { useMatchStore, type StandingRow } from '@/stores/useMatchStore'
import ClubCrest from './ClubCrest'

interface Props {
  mini?: boolean
}

export default function Standings({ mini = false }: Props) {
  const standings = useMatchStore(s => s.standings)
  const myClubId  = useMatchStore(s => s.myClubId)
  const rows      = mini ? standings.slice(0, 8) : standings

  if (mini) {
    return (
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {['#', 'Clube', 'PTS', 'SG'].map(h => (
              <th key={h} className="text-[9px] tracking-widest text-[#4a6070] uppercase
                                     px-2 py-[5px] text-left border-b border-border">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((s, i) => <MiniRow key={s.id} row={s} pos={i+1} myId={myClubId} />)}
        </tbody>
      </table>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid text-[9px] tracking-widest text-[#4a6070] uppercase
                      px-[14px] py-2 bg-surface2 border-b border-border"
           style={{ gridTemplateColumns: '32px 36px 1fr 56px 44px 44px 44px 44px 56px' }}>
        {['#', '', 'Clube', 'PTS', 'J', 'V', 'E', 'D', 'SG'].map((h, i) => (
          <span key={i} className={i >= 3 ? 'text-center' : ''}>{h}</span>
        ))}
      </div>
      {/* Rows */}
      {rows.map((s, i) => <FullRow key={s.id} row={s} pos={i+1} myId={myClubId} />)}
    </div>
  )
}

function MiniRow({ row, pos, myId }: { row: StandingRow; pos: number; myId: string | null }) {
  const isMe = row.id === myId
  const sg   = row.gf - row.ga
  return (
    <tr className={isMe ? 'bg-gold/[.06]' : ''}>
      <td className="text-[11px] text-gray-500 px-2 py-[6px] border-b border-border/40">{pos}</td>
      <td className="font-bold text-[13px] px-2 py-[6px] border-b border-border/40">
        <span className={isMe ? 'text-gold' : ''}>{row.short}</span>
      </td>
      <td className="font-bebas text-[16px] px-2 py-[6px] border-b border-border/40">{row.pts}</td>
      <td className={`text-[11px] px-2 py-[6px] border-b border-border/40 ${sg >= 0 ? 'text-glgreen' : 'text-glred'}`}>
        {sg >= 0 ? '+' : ''}{sg}
      </td>
    </tr>
  )
}

function FullRow({ row, pos, myId }: { row: StandingRow; pos: number; myId: string | null }) {
  const isMe = row.id === myId
  const sg   = row.gf - row.ga
  return (
    <div
      className={`grid items-center px-[14px] py-2 border-b border-border/40
                  hover:bg-surface2 transition-colors
                  ${isMe ? 'bg-gold/[.06]' : ''}`}
      style={{ gridTemplateColumns: '32px 36px 1fr 56px 44px 44px 44px 44px 56px' }}
    >
      <span className="text-[11px] text-gray-500">{pos}</span>
      <ClubCrest colors={row.crestColors} short={row.short} size={24} rounded />
      <span className={`text-[13px] font-bold ${isMe ? 'text-gold' : ''}`}>{row.short}</span>
      <span className="font-bebas text-[18px] text-center">{row.pts}</span>
      {[row.j, row.v, row.e, row.d].map((v, i) => (
        <span key={i} className="text-[12px] text-gray-400 text-center">{v}</span>
      ))}
      <span className={`text-[12px] text-center ${sg >= 0 ? 'text-glgreen' : 'text-glred'}`}>
        {sg >= 0 ? '+' : ''}{sg}
      </span>
    </div>
  )
}
