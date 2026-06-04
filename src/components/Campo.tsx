import { useMatchStore } from '@/stores/useMatchStore'
import BenchZone from './BenchZone'
import PlayerDisc from './PlayerDisc'

export default function Campo() {
  const homeClub  = useMatchStore(s => s.homeClub)
  const awayClub  = useMatchStore(s => s.awayClub)
  const homeSquad = useMatchStore(s => s.homeSquad)
  const awaySquad = useMatchStore(s => s.awaySquad)
  const homeBench = useMatchStore(s => s.homeBench)
  const awayBench = useMatchStore(s => s.awayBench)

  if (!homeClub || !awayClub) return null

  return (
    <div className="flex flex-col flex-1 overflow-hidden p-[6px_8px] gap-1">
      {/* Banco casa */}
      <BenchZone
        side="home"
        bench={homeBench}
        colors={homeClub.colors}
        label={`${homeClub.short} — BANCO`}
      />

      {/* Campo */}
      <div
        className="relative flex-1 rounded-lg overflow-hidden border-2 border-[#1a5a1a]
                   shadow-[0_0_30px_rgba(0,100,0,.3)]"
        style={{ minHeight: 0 }}
      >
        {/* Grama listrada */}
        <div
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(180deg,#2a7230 0,#2a7230 46px,#256320 46px,#256320 92px)',
          }}
        />

        {/* Marcações do campo */}
        <FieldMarkings />

        {/* Jogadores casa */}
        {homeSquad.map((p, i) => (
          <PlayerDisc key={`h-${i}`} player={p} fieldIdx={i} side="home" colors={homeClub.colors} />
        ))}

        {/* Jogadores fora */}
        {awaySquad.map((p, i) => (
          <PlayerDisc key={`a-${i}`} player={p} fieldIdx={i} side="away" colors={awayClub.colors} />
        ))}
      </div>

      {/* Banco visitante */}
      <BenchZone
        side="away"
        bench={awayBench}
        colors={awayClub.colors}
        label={`${awayClub.short} — BANCO`}
      />
    </div>
  )
}

function FieldMarkings() {
  return (
    <>
      {/* Borda */}
      <div className="absolute pointer-events-none border-2 border-white/38 rounded-[2px]"
           style={{ inset: 7 }} />
      {/* Linha do meio */}
      <div className="absolute pointer-events-none bg-white/38"
           style={{ left: '50%', top: 7, bottom: 7, width: 2, transform: 'translateX(-50%)' }} />
      {/* Círculo central */}
      <div className="absolute pointer-events-none border-2 border-white/38 rounded-full"
           style={{ left: '50%', top: '50%', width: 76, height: 76, transform: 'translate(-50%,-50%)' }} />
      {/* Ponto central */}
      <div className="absolute pointer-events-none bg-white/50 rounded-full"
           style={{ left: '50%', top: '50%', width: 6, height: 6, transform: 'translate(-50%,-50%)' }} />
      {/* Área penal esquerda */}
      <div className="absolute pointer-events-none border-2 border-white/28"
           style={{ left: 7, top: '50%', width: 52, height: 140, borderLeft: 'none', transform: 'translateY(-50%)' }} />
      {/* Área penal direita */}
      <div className="absolute pointer-events-none border-2 border-white/28"
           style={{ right: 7, top: '50%', width: 52, height: 140, borderRight: 'none', transform: 'translateY(-50%)' }} />
      {/* Gol esquerdo */}
      <div className="absolute pointer-events-none border-2 border-white/45 bg-white/4"
           style={{ left: 7, top: '50%', width: 11, height: 60, borderLeft: 'none', transform: 'translateY(-50%)' }} />
      {/* Gol direito */}
      <div className="absolute pointer-events-none border-2 border-white/45 bg-white/4"
           style={{ right: 7, top: '50%', width: 11, height: 60, borderRight: 'none', transform: 'translateY(-50%)' }} />
    </>
  )
}
