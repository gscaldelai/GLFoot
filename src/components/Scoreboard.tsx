import { useEffect, useRef } from 'react'
import { useMatchStore } from '@/stores/useMatchStore'
import { useAuthStore }  from '@/stores/useAuthStore'
import Shirt from './Shirt'
import { avgSquad } from '@/engines/matchEngine'
import { getFormationBonus, FORMATION_LABELS } from '@/data/formations'

// Duração real em ms para 90 min de jogo (por tick = 1 segundo de jogo)
const DURATION_MS: Record<number, number> = { 1: 55_000, 1.5: 40_000, 2: 30_000 }

export default function Scoreboard() {
  const homeClub  = useMatchStore(s => s.homeClub)
  const awayClub  = useMatchStore(s => s.awayClub)
  const homeSquad = useMatchStore(s => s.homeSquad)
  const awaySquad = useMatchStore(s => s.awaySquad)
  const gh        = useMatchStore(s => s.gh)
  const ga        = useMatchStore(s => s.ga)
  const minute    = useMatchStore(s => s.minute)
  const second    = useMatchStore(s => s.second)
  const running   = useMatchStore(s => s.running)
  const round     = useMatchStore(s => s.round)
  const ended     = useMatchStore(s => s.ended)
  const speed     = useMatchStore(s => s.speed)
  const toggleRun      = useMatchStore(s => s.toggleRun)
  const setSpeed       = useMatchStore(s => s.setSpeed)
  const tick           = useMatchStore(s => s.tick)
  const myClubId       = useMatchStore(s => s.myClubId)
  const homeFormation  = useMatchStore(s => s.homeFormation)
  const awayFormation  = useMatchStore(s => s.awayFormation)
  const isPremium      = useAuthStore(s => s.user?.plan === 'premium')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (running && !ended) {
      const ms = DURATION_MS[speed] / (90 * 60)
      intervalRef.current = setInterval(() => tick(), ms)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, ended, speed, tick])

  if (!homeClub || !awayClub) return null

  const mm = String(minute).padStart(2, '0')
  const ss = String(second).padStart(2, '0')
  const avH = avgSquad(homeSquad)
  const avA = avgSquad(awaySquad)

  // Indicador tático
  const amHome = homeClub.id === myClubId
  const myF    = amHome ? homeFormation : awayFormation
  const oppF   = amHome ? awayFormation : homeFormation
  const myBonus  = myF && oppF ? getFormationBonus(myF, oppF)  : 0
  const oppBonus = myF && oppF ? getFormationBonus(oppF, myF) : 0
  const tacticTag =
    myBonus > 0 && myBonus > oppBonus
      ? { label: `⚡ Vantagem Tática (${myF})`, color: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10' }
      : oppBonus > 0 && oppBonus > myBonus
      ? { label: `⚠ Desvantagem Tática (${oppF})`, color: 'text-red-400 border-red-400/40 bg-red-400/10' }
      : null

  return (
    <div className="bg-surface border-b border-border px-4 py-2 flex items-center gap-3 flex-wrap justify-center">
      {/* Time casa */}
      <div className="flex items-center gap-2">
        <Shirt colors={homeClub.colors} size={32} />
        <div>
          <div className="font-bebas text-lg tracking-wide leading-none">{homeClub.short}</div>
          <div className="text-[10px] text-gray-400">
            Força: <span className="text-gold">{avH}</span>
            {homeFormation && (
              <span className="ml-1 text-[9px] text-[#5a8aa0] border border-[#2a4060] rounded px-[4px] py-[1px]">
                {FORMATION_LABELS[homeFormation]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Placar */}
      <div className="font-bebas text-[40px] text-gold leading-none min-w-[28px] text-center
                      [text-shadow:0_0_16px_rgba(240,192,64,.4)]">
        {gh}
      </div>

      {/* Relógio + competição */}
      <div className="flex flex-col items-center gap-[2px]">
        <div className="bg-black border border-[#243444] rounded px-[10px] py-1
                        font-bebas text-[18px] text-gold tracking-[3px]">
          {mm}:{ss}
        </div>
        <div className="text-[9px] text-[#5a8aa0] tracking-wide uppercase whitespace-nowrap">
          Brasileirão · Rodada {round}
        </div>
      </div>

      {/* Placar fora */}
      <div className="font-bebas text-[40px] text-gold leading-none min-w-[28px] text-center
                      [text-shadow:0_0_16px_rgba(240,192,64,.4)]">
        {ga}
      </div>

      {/* Indicador tático central */}
      {tacticTag && (
        <span className={`text-[10px] font-bold border rounded px-[6px] py-[2px] ${tacticTag.color}`}>
          {tacticTag.label}
        </span>
      )}

      {/* Time fora */}
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="font-bebas text-lg tracking-wide leading-none">{awayClub.short}</div>
          <div className="text-[10px] text-gray-400">
            {awayFormation && (
              <span className="mr-1 text-[9px] text-[#5a8aa0] border border-[#2a4060] rounded px-[4px] py-[1px]">
                {FORMATION_LABELS[awayFormation]}
              </span>
            )}
            Força: <span className="text-gold">{avA}</span>
          </div>
        </div>
        <Shirt colors={awayClub.colors} size={32} />
      </div>

      <div className="text-[#243444]">|</div>

      {/* Velocidade */}
      <div className="flex gap-1">
        {([1, 1.5, 2] as const).map(v => {
          const locked = v > 1 && !isPremium
          return (
            <button
              key={v}
              onClick={() => !locked && setSpeed(v)}
              title={locked ? 'Disponível no Premium' : undefined}
              className={`px-[9px] py-[3px] rounded text-[12px] font-bold border transition-all duration-100
                          ${locked
                            ? 'bg-surface2 border-[#243444] text-[#3a4a5a] cursor-not-allowed'
                            : speed === v
                              ? 'bg-gold border-gold text-black'
                              : 'bg-surface2 border-[#243444] text-gray-400 hover:border-gold hover:text-gold'}`}
            >
              {v}×{locked ? ' 🔒' : ''}
            </button>
          )
        })}
      </div>

      {/* Play/Pausa */}
      <button
        onClick={toggleRun}
        disabled={ended}
        className={`px-[14px] py-[5px] rounded font-bold text-[13px] tracking-wide border transition-all duration-200
                    ${ended
                      ? 'bg-surface2 border-border text-gray-500 cursor-default'
                      : running
                        ? 'bg-[#a01818] border-glred text-white hover:bg-glred'
                        : 'bg-[#158040] border-glgreen text-black hover:bg-glgreen'}`}
      >
        {ended ? '✅ FIM' : running ? '⏸ PAUSAR' : '▶ INICIAR'}
      </button>
    </div>
  )
}
