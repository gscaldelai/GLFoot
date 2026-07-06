import { useMatchStore } from '@/stores/useMatchStore'

export default function HalftimeOverlay() {
  const visible         = useMatchStore(s => s.halftimeVisible)
  const homeClub        = useMatchStore(s => s.homeClub)
  const awayClub        = useMatchStore(s => s.awayClub)
  const gh              = useMatchStore(s => s.gh)
  const ga              = useMatchStore(s => s.ga)
  const myClubId        = useMatchStore(s => s.myClubId)
  const subCount        = useMatchStore(s => s.subCount)
  const closeHalftime   = useMatchStore(s => s.closeHalftime)
  const startSecondHalf = useMatchStore(s => s.startSecondHalf)

  if (!visible || !homeClub || !awayClub) return null

  const mySide   = homeClub.id === myClubId ? 'home' : 'away'
  const subsLeft = 3 - subCount[mySide]

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[300]"
         style={{ backdropFilter: 'blur(2px)' }}>
      <div
        className="rounded-[18px] px-12 py-8 text-center max-w-sm w-[90%] anim-popin"
        style={{ background: 'linear-gradient(160deg,#0d1824,#122436)',
                 border: '3px solid #f0c040',
                 boxShadow: '0 20px 60px rgba(0,0,0,.95)' }}
      >
        <div className="font-bebas text-[44px] text-gold tracking-[3px] leading-none">
          INTERVALO
        </div>
        <div className="font-bebas text-[54px] text-white leading-tight my-2">
          {homeClub.short} {gh} × {ga} {awayClub.short}
        </div>
        <div className="text-[13px] text-[#8ab0c8] mb-5 leading-snug">
          Fim do 1º tempo. Ajuste a equipe antes de voltar para o segundo tempo.
          <br />
          <span className="text-gray-400 text-[11px]">
            Substituições restantes: <span className="text-gold font-bold">{subsLeft}</span>
            {subsLeft > 0 && ' — arraste um reserva do banco sobre o titular'}
          </span>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={closeHalftime}
            className="bg-surface2 border border-[#3a5a74] rounded-lg px-6 py-[12px] font-bebas
                       text-[16px] text-[#8ab0c8] tracking-[2px] cursor-pointer
                       hover:border-gold hover:text-gold transition-colors"
          >
            🔁 FAZER AJUSTES
          </button>
          <button
            onClick={startSecondHalf}
            className="bg-gold border-none rounded-lg px-6 py-[12px] font-bebas text-[16px]
                       text-black tracking-[2px] cursor-pointer hover:scale-[1.04] transition-transform"
          >
            ▶ INICIAR 2º TEMPO
          </button>
        </div>
      </div>
    </div>
  )
}
