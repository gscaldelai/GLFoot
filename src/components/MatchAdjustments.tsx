import { useState } from 'react'
import { useMatchStore } from '@/stores/useMatchStore'
import type { Player } from '@/engines/types'
import { FORMATION_LABELS, type FormationKey } from '@/data/formations'

const ALL_FORMATIONS = Object.keys(FORMATION_LABELS) as FormationKey[]

// Disco simples de jogador (número + força + nome)
function Disc({ player, colors, selected, dimmed, onClick, size = 44 }: {
  player: Player
  colors: [string, string, string]
  selected?: boolean
  dimmed?: boolean
  onClick?: () => void
  size?: number
}) {
  const [bg, stripe, detail] = colors
  return (
    <button
      onClick={onClick}
      className={`relative rounded-full border-2 overflow-hidden flex items-start justify-center
                  transition-transform hover:scale-110 flex-shrink-0
                  ${selected ? 'border-gold ring-2 ring-gold scale-110' : 'border-[#bbb]'}
                  ${dimmed ? 'opacity-40 grayscale' : ''}`}
      style={{ width: size, height: size, background: '#f0f0f0' }}
      title={player.name}
    >
      <span className="font-anton text-[11px] text-[#111] absolute top-[3px] z-10 leading-none">{player.num}</span>
      {player.injured && <span className="absolute top-[1px] left-[2px] z-20 text-[10px]">🚑</span>}
      <div className="absolute bottom-0 left-0 right-0 h-[62%] overflow-hidden">
        <div className="absolute inset-0" style={{ background: bg }} />
        <div className="absolute left-0 right-0" style={{ top: '30%', height: '28%', background: stripe }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '20%', background: detail || bg }} />
      </div>
      <span className="font-bebas text-[9px] text-gold absolute bottom-[2px] right-[1px] z-10 bg-black/70 rounded px-[2px] leading-[1.2]">
        {player.forca}
      </span>
    </button>
  )
}

export default function MatchAdjustments() {
  const visible          = useMatchStore(s => s.adjustingVisible)
  const myClubId         = useMatchStore(s => s.myClubId)
  const homeClub         = useMatchStore(s => s.homeClub)
  const awayClub         = useMatchStore(s => s.awayClub)
  const homeSquad        = useMatchStore(s => s.homeSquad)
  const awaySquad        = useMatchStore(s => s.awaySquad)
  const homeBench        = useMatchStore(s => s.homeBench)
  const awayBench        = useMatchStore(s => s.awayBench)
  const homeFormation    = useMatchStore(s => s.homeFormation)
  const awayFormation    = useMatchStore(s => s.awayFormation)
  const subCount         = useMatchStore(s => s.subCount)
  const gh               = useMatchStore(s => s.gh)
  const ga               = useMatchStore(s => s.ga)
  const minute           = useMatchStore(s => s.minute)
  const doSub            = useMatchStore(s => s.doSub)
  const changeFormation  = useMatchStore(s => s.changeMyFormation)
  const closeAdjustments = useMatchStore(s => s.closeAdjustments)

  const [selected, setSelected] = useState<number | null>(null)

  if (!visible || !homeClub || !awayClub) return null

  const isMyHome  = homeClub.id === myClubId
  const side      = isMyHome ? 'home' : 'away'
  const myClub    = isMyHome ? homeClub : awayClub
  const squad     = isMyHome ? homeSquad : awaySquad
  const bench      = isMyHome ? homeBench : awayBench
  const formation  = isMyHome ? homeFormation : awayFormation
  const subsLeft   = 3 - subCount[side]

  // Normaliza o fieldPos (que fica na metade do campo do meu time) para preencher
  // a largura da mini-visão, sempre com o GK à esquerda atacando para a direita.
  const dispX = (p: Player) => {
    const x = p.fieldPos?.[0] ?? 50
    const norm = isMyHome ? (x - 4) / 51 : (96 - x) / 51   // 0 = fundo (GK), 1 = ataque
    return 6 + Math.max(0, Math.min(1, norm)) * 88
  }

  function onBenchClick(benchIdx: number) {
    const b = bench[benchIdx]
    if (!b || b.injured || b.usedInSub || subsLeft <= 0) return
    if (selected === null) return
    doSub(side, selected, benchIdx)
    setSelected(null)
  }

  return (
    <div className="fixed inset-0 z-[300] flex flex-col"
         style={{ background: 'linear-gradient(160deg,#081018,#0d1c28)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gold/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bebas text-[24px] tracking-[3px] text-gold">⚙ AJUSTES TÁTICOS</span>
          <span className="text-[13px] text-white/70">{myClub.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-[#8ab0c8]">
            {homeClub.short} <span className="text-gold font-bold">{gh} × {ga}</span> {awayClub.short} · {minute}'
          </span>
          <span className="text-[12px] text-gray-400">
            Substituições: <span className={subsLeft > 0 ? 'text-gold font-bold' : 'text-glred font-bold'}>{subsLeft}</span>/3
          </span>
        </div>
      </div>

      {/* Seletor de formação */}
      <div className="px-6 py-3 border-b border-border flex-shrink-0">
        <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-2">Formação</div>
        <div className="flex flex-wrap gap-[6px]">
          {ALL_FORMATIONS.map(f => (
            <button
              key={f}
              onClick={() => { changeFormation(f); setSelected(null) }}
              className={`px-3 py-[5px] rounded-lg text-[12px] font-bebas tracking-[1px] border transition-all
                          ${formation === f
                            ? 'bg-gold border-gold text-black'
                            : 'bg-surface2 border-border text-gray-300 hover:border-gold hover:text-gold'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Campo do meu time */}
      <div className="flex-1 overflow-hidden px-6 py-4 min-h-0">
        <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-2">
          Em campo — toque num titular para trocá-lo
        </div>
        <div className="relative w-full h-full rounded-xl border-2 border-[#1a5a1a] overflow-hidden"
             style={{ background: 'repeating-linear-gradient(90deg,#2a7230 0,#2a7230 40px,#256320 40px,#256320 80px)' }}>
          {/* linha do fundo (ataque) */}
          <div className="absolute pointer-events-none bg-white/25" style={{ right: '4%', top: 8, bottom: 8, width: 2 }} />
          {squad.map((p, i) => (
            <div key={`${p.name}_${p.num}`}
                 className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                 style={{ left: `${dispX(p)}%`, top: `${p.fieldPos?.[1] ?? 50}%` }}>
              <Disc
                player={p}
                colors={myClub.colors}
                selected={selected === i}
                onClick={() => setSelected(selected === i ? null : i)}
              />
              <span className="text-[8px] font-bold text-white leading-tight mt-[2px] text-center max-w-[64px]
                               overflow-hidden text-ellipsis whitespace-nowrap
                               [text-shadow:1px_1px_2px_#000,-1px_-1px_2px_#000]">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Banco */}
      <div className="px-6 py-3 border-t border-border flex-shrink-0">
        <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-2">
          Banco {selected !== null ? '— toque num reserva para a substituição' : '— selecione um titular primeiro'}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {bench.length === 0 && <span className="text-[12px] text-[#4a6070]">Sem reservas.</span>}
          {bench.map((p, i) => {
            const disabled = p.injured || p.usedInSub || subsLeft <= 0 || selected === null
            return (
              <div key={`${p.name}_${p.num}`} className="flex flex-col items-center flex-shrink-0">
                <Disc player={p} colors={myClub.colors} dimmed={disabled} onClick={() => onBenchClick(i)} size={40} />
                <span className="text-[8px] font-bold text-white/80 leading-tight mt-[2px] text-center max-w-[56px]
                                 overflow-hidden text-ellipsis whitespace-nowrap">
                  {p.usedInSub ? '✓ ' : ''}{p.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Voltar ao jogo */}
      <div className="px-6 py-3 border-t border-border flex justify-end flex-shrink-0">
        <button
          onClick={() => { setSelected(null); closeAdjustments() }}
          className="bg-gold border-none rounded-lg px-8 py-[11px] font-bebas text-[17px]
                     tracking-[2px] text-black cursor-pointer hover:scale-[1.03] transition-transform"
        >
          ▶ VOLTAR AO JOGO
        </button>
      </div>
    </div>
  )
}
