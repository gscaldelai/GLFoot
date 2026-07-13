// ════════════════════════════════════════════════════════
//  GLfoot — Tela de Fim de Temporada
//  Fluxo: Resultado → Age Curve → Contratos → Estrela → Nova Temporada
// ════════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import { useMatchStore }    from '@/stores/useMatchStore'
import { useLineupStore }   from '@/stores/useLineupStore'
import { useFinanceStore }  from '@/stores/useFinanceStore'
import { applyAging }       from '@/engines/ageCurve'
import { electSeasonStar, calcStarScore, calcSalary, fmtSalary } from '@/engines/marketEngine'
import { CLUBS }            from '@/data/clubs'
import type { Player }      from '@/engines/types'

// ── helpers ──────────────────────────────────────────────
const POS_ORDER = ['GK', 'LAT', 'ZAG', 'VOL', 'MEI', 'ATA']
function sortByPos(players: Player[]): Player[] {
  return [...players].sort((a, b) => POS_ORDER.indexOf(a.pos) - POS_ORDER.indexOf(b.pos))
}

// Identidade única de um jogador no elenco. num sozinho colide (entre
// titulares/reservas e, sobretudo, após contratações que trazem jogadores
// de outros clubes com o mesmo número — R-13), então combinamos nome + número.
function playerKey(p: Player): string {
  return `${p.name}_${p.num}`
}

type Phase = 'result' | 'aging' | 'contracts' | 'star'

// ── Componente principal ──────────────────────────────────
export default function SeasonEndOverlay() {
  const visible       = useMatchStore(s => s.seasonEndVisible)
  const season        = useMatchStore(s => s.season)
  const standings     = useMatchStore(s => s.standings)
  const myClubId      = useMatchStore(s => s.myClubId)
  const completedSeasons = useMatchStore(s => s.completedSeasons)
  const closeSeasonEnd = useMatchStore(s => s.closeSeasonEnd)

  const [phase, setPhase]       = useState<Phase>('result')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // Elenco atual — para calcular o envelhecimento uma única vez (R-14)
  const slots = useLineupStore(s => s.slots)
  const bench = useLineupStore(s => s.bench)

  // R-14: applyAging é estocástico (gaussian/Math.random). Calcula o
  // envelhecimento UMA vez por sessão do overlay e reaproveita o MESMO
  // resultado para exibir (Evolução/Contratos) e para aplicar ao elenco,
  // garantindo que o valor mostrado seja exatamente o persistido. Chaveado por
  // playerKey (name+num) — num sozinho colide após contratações (R-13).
  const agedByKey = useMemo(() => {
    const all = [...slots.filter(Boolean) as Player[], ...bench]
    return new Map(applyAging(all).map(p => [playerKey(p), p]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, season])

  if (!visible) return null

  const myPos   = standings.findIndex(r => r.id === myClubId) + 1
  const myRow   = standings.find(r => r.id === myClubId)
  const champion = standings[0]
  const isChamp  = myPos === 1
  const relegated = myPos > 17

  return (
    <div className="fixed inset-0 z-[400] bg-[#04090f] flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4 flex items-center justify-between
                      bg-gradient-to-r from-[#07111d] to-[#04090f]">
        <div>
          <div className="font-bebas text-[22px] tracking-[4px] text-gold leading-none">
            FIM DE TEMPORADA {2024 + season}
          </div>
          <div className="text-[11px] text-[#4a6070] mt-[2px]">
            Temporada {season} de 15
          </div>
        </div>
        {/* Stepper */}
        <div className="flex items-center gap-2">
          {(['result', 'aging', 'contracts', 'star'] as Phase[]).map((p, i) => {
            const LABELS = ['Resultado', 'Evolução', 'Contratos', 'Estrela']
            const done   = ['result','aging','contracts','star'].indexOf(phase) > i
            const active = phase === p
            return (
              <div key={p} className="flex items-center gap-1">
                {i > 0 && <div className={`w-6 h-px ${done ? 'bg-gold/60' : 'bg-border'}`} />}
                <div className={`flex items-center gap-[5px] px-2 py-[3px] rounded text-[10px]
                                 ${active ? 'bg-gold/15 text-gold font-bold' : done ? 'text-[#4a6070]' : 'text-[#2a3d50]'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold
                                    ${active ? 'bg-gold text-black' : done ? 'bg-[#1a2d40] text-[#4a6070]' : 'bg-[#0a1520] text-[#2a3d50]'}`}>
                    {i + 1}
                  </span>
                  {LABELS[i]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Conteúdo por fase ── */}
      <div className="flex-1 overflow-y-auto">
        {phase === 'result'    && <PhaseResult myPos={myPos} myRow={myRow} champion={champion} isChamp={isChamp} relegated={relegated} completedSeasons={completedSeasons} />}
        {phase === 'aging'     && <PhaseAging dismissed={dismissed} agedByKey={agedByKey} />}
        {phase === 'contracts' && <PhaseContracts dismissed={dismissed} setDismissed={setDismissed} agedByKey={agedByKey} />}
        {phase === 'star'      && <PhaseStar myClubId={myClubId} />}
      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 border-t border-border px-6 py-4 flex items-center justify-between
                      bg-gradient-to-r from-[#07111d] to-[#04090f]">
        <div className="text-[11px] text-[#3a5060]">
          {phase === 'result'    && 'Veja a evolução do seu elenco →'}
          {phase === 'aging'     && 'Revise os contratos antes de confirmar →'}
          {phase === 'contracts' && 'Conheça a estrela da temporada →'}
          {phase === 'star'      && 'Pronto para a próxima temporada?'}
        </div>
        <button
          onClick={() => {
            if (phase === 'result')    { setPhase('aging'); return }
            if (phase === 'aging')     { setPhase('contracts'); return }
            if (phase === 'contracts') { setPhase('star'); return }
            // Fase final — aplica tudo e avança temporada
            applySeasonEnd(dismissed, agedByKey)
            closeSeasonEnd()
            setPhase('result')
            setDismissed(new Set())
          }}
          className="px-8 py-[10px] rounded-xl font-bebas text-[16px] tracking-[2px] border transition-all
                     bg-gold/10 border-gold text-gold hover:bg-gold hover:text-black"
        >
          {phase === 'star' ? '▶ NOVA TEMPORADA' : 'CONTINUAR →'}
        </button>
      </div>
    </div>
  )
}

// ── Aplica aging + contratos ao useLineupStore no momento de confirmar ────────
function applySeasonEnd(dismissed: Set<string>, agedByKey: Map<string, Player>) {
  const ls  = useLineupStore.getState()
  const fin = useFinanceStore.getState()

  const allPlayers = [
    ...ls.slots.filter(Boolean) as Player[],
    ...ls.bench,
  ]

  // R-14: aplica o MESMO envelhecimento já exibido nas fases (snapshot único
  // do overlay), não um novo sorteio. Fallback ao próprio jogador se faltar.
  const aged = allPlayers.map(p => {
    const a = agedByKey.get(playerKey(p)) ?? p
    return {
      ...a,
      fatigue:           0,
      // Pré-temporada cura qualquer lesão pendente (G-02)
      injured:           false,
      injuryRoundsLeft:  0,
      injuryLabel:       undefined,
      contractYearsLeft: Math.max(0, a.contractYearsLeft - 1),
    }
  })

  const kept    = aged.filter(p => !dismissed.has(playerKey(p)))
  const dismissed_ = aged.filter(p => dismissed.has(playerKey(p)))

  // Registra rescisões no financeiro (semana 38 = round 38 aprox)
  const s = useMatchStore.getState()
  for (const p of dismissed_) {
    const severance = calcSalary(p) * 3   // 3 meses de rescisão
    if (severance > 0) {
      fin.addExpense(severance, 'transferencia',
        `Rescisão: ${p.name}`, 38, s.season)
    }
  }

  // Redistribui os titulares (mantém formação, remove dispensados dos slots)
  const newSlots = ls.slots.map(p =>
    p && !dismissed.has(playerKey(p))
      ? (kept.find(k => playerKey(k) === playerKey(p)) ?? null)
      : null
  )
  const newBench = ls.bench
    .filter(p => !dismissed.has(playerKey(p)))
    .map(p => kept.find(k => playerKey(k) === playerKey(p)) ?? p)

  useLineupStore.setState({ slots: newSlots, bench: newBench })
}

// ════════════════════════════════════════════════════════
//  Fase 1 — Resultado
// ════════════════════════════════════════════════════════
function PhaseResult({ myPos, myRow, champion, isChamp, relegated, completedSeasons }: {
  myPos: number
  myRow: ReturnType<typeof useMatchStore.getState>['standings'][0] | undefined
  champion: ReturnType<typeof useMatchStore.getState>['standings'][0] | undefined
  isChamp: boolean
  relegated: boolean
  completedSeasons: ReturnType<typeof useMatchStore.getState>['completedSeasons']
}) {
  const medalColor = myPos === 1 ? '#f0c040' : myPos <= 4 ? '#4090d0' : myPos > 17 ? '#c03020' : '#5a7080'
  const medalLabel = myPos === 1 ? '🏆 Campeão!' : myPos <= 4 ? '⭐ Classificado para a Libertadores' : myPos > 17 ? '⬇ Rebaixado' : `${myPos}º lugar`

  return (
    <div className="max-w-[640px] mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Posição final */}
      <div className={`rounded-2xl border p-6 text-center
                       ${isChamp ? 'border-gold/40 bg-gold/5' : relegated ? 'border-glred/40 bg-glred/5' : 'border-border bg-surface'}`}>
        <div className="font-bebas text-[64px] leading-none" style={{ color: medalColor }}>
          {myPos}º
        </div>
        <div className="font-bebas text-[18px] tracking-[3px] mt-1" style={{ color: medalColor }}>
          {medalLabel}
        </div>
        {myRow && (
          <div className="flex justify-center gap-6 mt-4 text-[12px] text-[#5a7080]">
            <StatItem label="Pts"   value={myRow.pts} />
            <StatItem label="V"     value={myRow.v} />
            <StatItem label="E"     value={myRow.e} />
            <StatItem label="D"     value={myRow.d} />
            <StatItem label="GF"    value={myRow.gf} />
            <StatItem label="GA"    value={myRow.ga} />
            <StatItem label="SG"    value={myRow.gf - myRow.ga} signed />
          </div>
        )}
        {!isChamp && champion && (
          <div className="mt-3 text-[11px] text-[#3a5060]">
            Campeão: <span className="text-white/60">{champion.name}</span> · {champion.pts} pts
          </div>
        )}
      </div>

      {/* Histórico de temporadas */}
      {completedSeasons.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[9px] tracking-[3px] uppercase text-[#3a5060] mb-3">Histórico de Carreira</div>
          <div className="flex flex-col gap-[4px]">
            {completedSeasons.slice(-5).reverse().map(cs => (
              <div key={cs.seasonNum}
                className="flex items-center gap-3 text-[11px] px-2 py-[5px] rounded
                           border border-transparent hover:bg-surface2">
                <span className="text-[#3a5060] w-4">T{cs.seasonNum}</span>
                <span className="text-[#4a6070] w-[40px]">{2024 + cs.seasonNum}</span>
                <span className="flex-1 text-white/60">{cs.clubName}</span>
                <span className={`font-bebas text-[14px] ${cs.position === 1 ? 'text-gold' : cs.position > 17 ? 'text-glred' : 'text-white/50'}`}>
                  {cs.position}º
                </span>
                <span className="text-[#3a5060] w-[30px] text-right">{cs.points}p</span>
                {cs.isChampion && <span className="text-gold">🏆</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value, signed }: { label: string; value: number; signed?: boolean }) {
  const color = signed ? (value > 0 ? '#20c060' : value < 0 ? '#c03020' : '#5a7080') : '#8090a0'
  return (
    <div className="flex flex-col items-center gap-[2px]">
      <span className="text-[9px] text-[#3a5060] uppercase tracking-[1px]">{label}</span>
      <span className="font-bebas text-[18px] leading-none" style={{ color }}>
        {signed && value > 0 ? '+' : ''}{value}
      </span>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  Fase 2 — Age Curve (evolução dos jogadores)
// ════════════════════════════════════════════════════════
function PhaseAging({ dismissed, agedByKey }: { dismissed: Set<string>; agedByKey: Map<string, Player> }) {
  const slots = useLineupStore(s => s.slots)
  const bench = useLineupStore(s => s.bench)

  const allPlayers = useMemo(() => sortByPos([
    ...slots.filter(Boolean) as Player[],
    ...bench,
  ]), [slots, bench])

  // R-14: usa o envelhecimento único do overlay (por playerKey), não novo sorteio
  const pairs = allPlayers.map(p => {
    const after = agedByKey.get(playerKey(p)) ?? p
    return {
      before: p,
      after,
      delta:  Math.round((after.forca - p.forca) * 10) / 10,
    }
  }).filter(pair => !dismissed.has(playerKey(pair.before)))

  return (
    <div className="max-w-[640px] mx-auto px-6 py-6">
      <div className="text-[11px] text-[#4a6070] mb-4">
        A Age Curve ajusta a força de cada jogador conforme sua idade e posição.
        Jovens evoluem, veteranos declinam.
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="text-[9px] tracking-[2px] uppercase text-[#3a5060] border-b border-border bg-surface">
              <th className="py-[6px] pl-4 text-left">Jogador</th>
              <th className="py-[6px] text-center">Pos</th>
              <th className="py-[6px] text-center">Idade → </th>
              <th className="py-[6px] text-center">Força antes</th>
              <th className="py-[6px] text-center">Força depois</th>
              <th className="py-[6px] pr-4 text-right">Δ</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map(({ before, after, delta }) => {
              const deltaColor = delta > 0 ? '#20c060' : delta < 0 ? '#c04040' : '#5a7080'
              return (
                <tr key={playerKey(before)} className="border-b border-border/40 hover:bg-surface2">
                  <td className="py-[6px] pl-4 font-medium text-white/80">{before.name}</td>
                  <td className="py-[6px] text-center text-[#5a7080]">{before.pos}</td>
                  <td className="py-[6px] text-center text-[#5a7080]">
                    {before.age} <span className="text-[#3a5060]">→</span> <span className="text-white/60">{after.age}</span>
                  </td>
                  <td className="py-[6px] text-center font-bebas text-[14px] text-white/60">{before.forca}</td>
                  <td className="py-[6px] text-center font-bebas text-[14px]" style={{ color: deltaColor }}>{after.forca}</td>
                  <td className="py-[6px] pr-4 text-right font-bebas text-[14px]" style={{ color: deltaColor }}>
                    {delta > 0 ? '+' : ''}{delta}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  Fase 3 — Contratos
// ════════════════════════════════════════════════════════
function PhaseContracts({ dismissed, setDismissed, agedByKey }: {
  dismissed:    Set<string>
  setDismissed: (s: Set<string>) => void
  agedByKey:    Map<string, Player>
}) {
  const slots  = useLineupStore(s => s.slots)
  const bench  = useLineupStore(s => s.bench)
  const budget = useFinanceStore(s => s.budget)

  const allPlayers = useMemo(() => sortByPos([
    ...slots.filter(Boolean) as Player[],
    ...bench,
  ]), [slots, bench])

  // R-14: reaproveita o envelhecimento único do overlay (mesmos valores
  // exibidos e aplicados); aqui só decrementa o contrato p/ exibir idades futuras.
  const aged = useMemo(() => allPlayers.map(p => {
    const a = agedByKey.get(playerKey(p)) ?? p
    return { ...a, contractYearsLeft: Math.max(0, a.contractYearsLeft - 1) }
  }), [allPlayers, agedByKey])

  function toggle(p: Player) {
    const k = playerKey(p)
    const next = new Set(dismissed)
    next.has(k) ? next.delete(k) : next.add(k)
    setDismissed(next)
  }

  const totalRescisao = aged
    .filter(p => dismissed.has(playerKey(p)))
    .reduce((s, p) => s + calcSalary(p) * 3, 0)

  const expiring = aged.filter(p => p.contractYearsLeft === 0 && !dismissed.has(playerKey(p)))

  return (
    <div className="max-w-[640px] mx-auto px-6 py-6 flex flex-col gap-4">
      {expiring.length > 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-[11px] text-gold/80">
          ⚠ {expiring.length} jogador{expiring.length > 1 ? 'es' : ''} com contrato vencido.
          Renove ou dispense antes de iniciar a próxima temporada.
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="text-[9px] tracking-[2px] uppercase text-[#3a5060] border-b border-border bg-surface">
              <th className="py-[6px] pl-4 text-left">Jogador</th>
              <th className="py-[6px] text-center">Pos</th>
              <th className="py-[6px] text-center">Idade</th>
              <th className="py-[6px] text-center">Força</th>
              <th className="py-[6px] text-center">Contrato</th>
              <th className="py-[6px] text-center">Salário/mês</th>
              <th className="py-[6px] pr-4 text-center">Dispensar</th>
            </tr>
          </thead>
          <tbody>
            {aged.map(p => {
              const isDismissed = dismissed.has(playerKey(p))
              const contractAlert = p.contractYearsLeft === 0
              return (
                <tr key={playerKey(p)}
                  className={`border-b border-border/40 transition-colors
                               ${isDismissed ? 'opacity-40 bg-glred/5' : contractAlert ? 'bg-gold/5' : 'hover:bg-surface2'}`}
                >
                  <td className="py-[6px] pl-4 font-medium text-white/80">
                    {p.name}
                    {p.isStar && <span className="ml-1 text-gold">⭐</span>}
                  </td>
                  <td className="py-[6px] text-center text-[#5a7080]">{p.pos}</td>
                  <td className="py-[6px] text-center text-[#5a7080]">{p.age}</td>
                  <td className="py-[6px] text-center font-bebas text-[14px] text-white/70">{p.forca}</td>
                  <td className="py-[6px] text-center">
                    {contractAlert ? (
                      <span className="text-[9px] px-[5px] py-[2px] rounded bg-gold/15 text-gold font-bold">
                        VENCIDO
                      </span>
                    ) : (
                      <span className={`font-bebas text-[13px] ${p.contractYearsLeft <= 1 ? 'text-gold' : 'text-white/50'}`}>
                        {p.contractYearsLeft} ano{p.contractYearsLeft !== 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-[6px] text-center text-[#5a7080] font-mono">
                    {fmtSalary(calcSalary(p))}
                  </td>
                  <td className="py-[6px] pr-4 text-center">
                    <button onClick={() => toggle(p)}
                      className={`px-2 py-[3px] rounded text-[10px] font-bold border transition-all
                                  ${isDismissed
                                    ? 'border-glred/40 bg-glred/15 text-glred'
                                    : 'border-border text-[#3a5060] hover:border-glred/40 hover:text-glred'}`}>
                      {isDismissed ? '✓ Dispensado' : 'Dispensar'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {dismissed.size > 0 && (
        <div className="text-[11px] text-[#4a6070] flex items-center justify-between px-1">
          <span>{dismissed.size} jogador{dismissed.size > 1 ? 'es' : ''} serão dispensados</span>
          <span className="text-glred">
            Rescisão total: R$ {(totalRescisao / 1e6).toFixed(1)}M
            {totalRescisao > budget && (
              <span className="ml-1 text-[#f0a020]">(saldo insuficiente!)</span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════
//  Fase 4 — Estrela da Temporada
// ════════════════════════════════════════════════════════
function PhaseStar({ myClubId }: { myClubId: string | null }) {
  const slots = useLineupStore(s => s.slots)
  const bench = useLineupStore(s => s.bench)

  const star = useMemo(() => {
    // Candidatos: todos os jogadores de todos os clubes
    const candidates = CLUBS.flatMap(c =>
      [...c.squad, ...c.bench].map(p => ({ player: p, clubId: c.id, score: calcStarScore(p) }))
    )
    // Adiciona os jogadores do meu clube (lineup atual, com stats reais da temporada)
    const myPlayers = [...slots.filter(Boolean) as Player[], ...bench]
    const myCandidates = myPlayers.map(p => ({ player: p, clubId: myClubId ?? '', score: calcStarScore(p) }))

    // Deduplicar por num+clubId (meus jogadores têm prioridade)
    const myNums = new Set(myCandidates.map(c => `${c.clubId}_${c.player.num}`))
    const allCandidates = [
      ...myCandidates,
      ...candidates.filter(c => !myNums.has(`${c.clubId}_${c.player.num}`)),
    ]
    return electSeasonStar(allCandidates)
  }, [slots, bench, myClubId])

  if (!star) return null

  const isMyPlayer = star.clubId === myClubId
  const myClubName = CLUBS.find(c => c.id === star.clubId)?.name ?? star.clubId

  return (
    <div className="max-w-[480px] mx-auto px-6 py-10 flex flex-col items-center gap-6 text-center">
      <div className="text-[72px] animate-bounce">⭐</div>

      <div>
        <div className="text-[9px] tracking-[4px] uppercase text-[#3a5060] mb-2">
          Estrela da Temporada
        </div>
        <div className="font-bebas text-[36px] tracking-[4px] text-gold leading-none">
          {star.player.name}
        </div>
        <div className="text-[13px] text-[#5a7080] mt-1">
          {star.player.pos} · {myClubName}
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex flex-col items-center">
          <span className="font-bebas text-[36px] text-white/80 leading-none">{star.player.forca}</span>
          <span className="text-[9px] tracking-[2px] text-[#3a5060] uppercase">Força</span>
        </div>
        <div className="w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="font-bebas text-[36px] text-white/80 leading-none">{star.player.gp ?? 0}</span>
          <span className="text-[9px] tracking-[2px] text-[#3a5060] uppercase">Gols</span>
        </div>
        <div className="w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="font-bebas text-[36px] text-white/80 leading-none">{star.player.assists ?? 0}</span>
          <span className="text-[9px] tracking-[2px] text-[#3a5060] uppercase">Assist.</span>
        </div>
        <div className="w-px bg-border" />
        <div className="flex flex-col items-center">
          <span className="font-bebas text-[36px] text-gold leading-none">{Math.round(star.score)}</span>
          <span className="text-[9px] tracking-[2px] text-[#3a5060] uppercase">Score</span>
        </div>
      </div>

      {isMyPlayer && (
        <div className="px-4 py-2 rounded-full border border-gold/30 bg-gold/10
                        text-[11px] text-gold font-bold tracking-[2px] uppercase">
          🏆 Jogador do Seu Clube!
        </div>
      )}
    </div>
  )
}
