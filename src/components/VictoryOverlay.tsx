import { useMatchStore } from '@/stores/useMatchStore'

export default function VictoryOverlay() {
  const visible    = useMatchStore(s => s.victoryVisible)
  const homeClub   = useMatchStore(s => s.homeClub)
  const awayClub   = useMatchStore(s => s.awayClub)
  const events     = useMatchStore(s => s.events)
  const gh         = useMatchStore(s => s.gh)
  const ga         = useMatchStore(s => s.ga)
  const myClubId   = useMatchStore(s => s.myClubId)
  const nextRound  = useMatchStore(s => s.nextRound)

  if (!visible || !homeClub || !awayClub) return null

  const myIsHome = homeClub.id === myClubId
  const myG  = myIsHome ? gh : ga
  const oppG = myIsHome ? ga : gh
  const won  = myG > oppG
  const drew = myG === oppG

  const bg = won  ? 'linear-gradient(160deg,#0a1f14,#0f2d1a)'
           : drew ? 'linear-gradient(160deg,#2a2a2a,#3a3a3a)'
           :        'linear-gradient(160deg,#0d0d0d,#1a2430)'
  const borderColor = won ? '#f0c040' : drew ? '#666' : '#333'
  const titleText   = won ? 'VITÓRIA!' : drew ? 'EMPATE!' : 'DERROTA…'
  const bodyText    = won  ? `${homeClub.short} ${gh} × ${ga} ${awayClub.short} — Mais 3 pontos!`
                   : drew ? `${homeClub.short} ${gh} × ${ga} ${awayClub.short} — Um ponto cada.`
                   :        `${homeClub.short} ${gh} × ${ga} ${awayClub.short} — Levantar a cabeça!`

  // eventos chegam mais recentes primeiro — reverte para ordem cronológica
  const goalsHome = events.filter(e => e.type === 'goal').reverse()
  const goalsAway = events.filter(e => e.type === 'goal-away').reverse()

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300]"
         style={{ backdropFilter: 'blur(2px)' }}>
      <div
        className="rounded-[18px] px-12 py-8 text-center max-w-sm w-[90%] anim-popin"
        style={{ background: bg, border: `3px solid ${borderColor}`,
                 boxShadow: '0 20px 60px rgba(0,0,0,.95)' }}
      >
        <div className="font-bebas text-[44px] text-gold tracking-[3px] leading-none">
          {titleText}
        </div>
        <div className="font-bebas text-[66px] text-white leading-tight my-2">
          {myG} × {oppG}
        </div>
        <div className="text-[15px] font-semibold text-[#ffdddd] mb-4 leading-snug">
          {bodyText}
        </div>

        {/* Autores dos gols */}
        {(gh > 0 || ga > 0) && (
          <div className="flex gap-3 justify-center mb-5 text-[11px] leading-relaxed">
            <div className="flex-1 text-right text-gray-300">
              <div className="text-[9px] tracking-wide text-gray-500 uppercase mb-1">{homeClub.short}</div>
              {goalsHome.map((e, i) => (
                <div key={i}>⚽ {e.scorer} {e.minute}'</div>
              ))}
            </div>
            <div className="w-px bg-white/15" />
            <div className="flex-1 text-left text-gray-300">
              <div className="text-[9px] tracking-wide text-gray-500 uppercase mb-1">{awayClub.short}</div>
              {goalsAway.map((e, i) => (
                <div key={i}>⚽ {e.scorer} {e.minute}'</div>
              ))}
            </div>
          </div>
        )}

        {/* Botão */}
        <div className="flex justify-center">
          <button
            onClick={nextRound}
            className="bg-gold border-none rounded-lg px-10 py-[12px] font-bebas text-[18px]
                       text-black tracking-[2px] cursor-pointer hover:scale-[1.04] transition-transform"
          >
            ▶ PRÓXIMA RODADA
          </button>
        </div>
      </div>
    </div>
  )
}
