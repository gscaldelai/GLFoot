import { useMatchStore } from '@/stores/useMatchStore'

// Modal de substituição obrigatória por lesão (G-02).
// Aparece pausado quando um titular do jogador se lesiona.
// Não pode ser fechado sem resolver: escolher reserva ou seguir com 10.
export default function InjurySubModal() {
  const injurySub = useMatchStore(s => s.injurySub)
  const homeSquad = useMatchStore(s => s.homeSquad)
  const awaySquad = useMatchStore(s => s.awaySquad)
  const homeBench = useMatchStore(s => s.homeBench)
  const awayBench = useMatchStore(s => s.awayBench)
  const subCount  = useMatchStore(s => s.subCount)
  const resolve   = useMatchStore(s => s.resolveInjurySub)

  if (!injurySub) return null

  const { side, fieldIdx } = injurySub
  const victim = (side === 'home' ? homeSquad : awaySquad)[fieldIdx]
  const bench  = side === 'home' ? homeBench : awayBench
  if (!victim) return null

  const subsLeft = 3 - subCount[side]
  const options = bench
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => !p.injured && !p.usedInSub)
    .sort((a, b) =>
      (b.p.pos === victim.pos ? 1000 : 0) + b.p.forca
      - ((a.p.pos === victim.pos ? 1000 : 0) + a.p.forca))

  const canSub = subsLeft > 0 && options.length > 0

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[320]"
         style={{ backdropFilter: 'blur(2px)' }}>
      <div
        className="rounded-[18px] px-8 py-7 text-center max-w-md w-[92%] anim-popin"
        style={{ background: 'linear-gradient(160deg,#1a0808,#241010)',
                 border: '3px solid #d42020',
                 boxShadow: '0 20px 60px rgba(0,0,0,.95)' }}
      >
        <div className="font-bebas text-[36px] text-glred tracking-[3px] leading-none">
          🚑 LESÃO
        </div>
        <div className="font-bebas text-[26px] text-white leading-tight my-2">
          {victim.name}
        </div>
        <div className="text-[13px] text-[#c89898] mb-4 leading-snug">
          {victim.injuryLabel} — fora por{' '}
          <span className="text-gold font-bold">
            {victim.injuryRoundsLeft} rodada{(victim.injuryRoundsLeft ?? 0) > 1 ? 's' : ''}
          </span>
          <br />
          <span className="text-gray-400 text-[11px]">
            {canSub
              ? `Escolha o substituto (${subsLeft} substituiç${subsLeft > 1 ? 'ões' : 'ão'} restante${subsLeft > 1 ? 's' : ''}):`
              : subsLeft <= 0
                ? 'Substituições esgotadas — o time segue com um a menos.'
                : 'Sem reservas disponíveis — o time segue com um a menos.'}
          </span>
        </div>

        {canSub && (
          <div className="flex flex-col gap-[6px] max-h-[240px] overflow-y-auto mb-4">
            {options.map(({ p, i }) => (
              <button
                key={i}
                onClick={() => resolve(i)}
                className="flex items-center gap-3 px-4 py-[8px] rounded-lg border border-[#4a2a2a]
                           bg-black/30 text-left cursor-pointer transition-all duration-150
                           hover:border-gold hover:bg-gold/10"
              >
                <span className="font-anton text-[13px] text-white/60 w-[24px]">{p.num}</span>
                <span className="flex-1 text-[13px] font-bold text-white truncate">{p.name}</span>
                <span className={`text-[10px] w-[34px] ${p.pos === victim.pos ? 'text-glgreen font-bold' : 'text-[#8a7070]'}`}>
                  {p.posLabel}
                </span>
                <span className="font-bebas text-[16px] text-gold">{p.forca}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => resolve(null)}
            className={`rounded-lg px-8 py-[10px] font-bebas text-[16px] tracking-[2px] cursor-pointer
                        transition-all duration-150
                        ${canSub
                          ? 'bg-surface2 border border-[#5a3a3a] text-[#c89898] hover:border-glred hover:text-white'
                          : 'bg-glred border-none text-white hover:scale-[1.04]'}`}
          >
            {canSub ? 'NÃO SUBSTITUIR — JOGAR COM 10' : '▶ SEGUIR COM 10 EM CAMPO'}
          </button>
        </div>
      </div>
    </div>
  )
}
