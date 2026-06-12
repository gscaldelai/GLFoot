// ════════════════════════════════════════════════════════
//  GLfoot — CalendarView
//  Duas abas: Calendário completo (grade mensal) e
//  Jogos do Seu Time (lista filtrada com próximos jogos).
// ════════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import { calcStats, type CalendarGame } from '@/engines/calendarEngine'
import { useMatchStore } from '@/stores/useMatchStore'
import { CLUBS, CLUBS_MAP } from '@/data/clubs'

// ── Cores por competição ─────────────────────────────────
const COMP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PAUL: { bg: '#1a3a1a', text: '#5dbd5d', border: '#2a5a2a' },
  BRAS: { bg: '#1a2e0a', text: '#8adb3a', border: '#2a4a10' },
  CDB:  { bg: '#3a0a0a', text: '#e05555', border: '#5a1515' },
  LIB:  { bg: '#2a2000', text: '#f5c518', border: '#4a3800' },
  SULA: { bg: '#2a1500', text: '#f08030', border: '#4a2a00' },
  REC:  { bg: '#0a2a3a', text: '#40b0e0', border: '#104060' },
  MUND: { bg: '#1a0a2a', text: '#a070e0', border: '#301550' },
  CNOR: { bg: '#2a0a1a', text: '#d060a0', border: '#4a1030' },
}

function getColor(short: string) {
  return COMP_COLORS[short] ?? { bg: '#1a1a2a', text: '#8090a0', border: '#2a3040' }
}

function weekToMonth(week: number): number {
  return Math.min(12, Math.ceil((week * 12) / 52))
}

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

// Derivar a semana atual a partir da rodada do Brasileirão
function currentWeekFromRound(calendar: CalendarGame[], round: number): number {
  // Busca o jogo do Brasileirão com gameIndex === round - 1
  const brasGame = calendar.find(
    g => g.competitionShort === 'BRAS' && g.gameIndex === round - 1
  )
  return brasGame?.week ?? round  // fallback: usa o número da rodada
}

// ── Componente principal ─────────────────────────────────
export default function CalendarView() {
  const round       = useMatchStore(s => s.round)
  const myClubId    = useMatchStore(s => s.myClubId)
  const fixtures    = useMatchStore(s => s.fixtures)
  const cupStatus   = useMatchStore(s => s.cupStatus)
  const clubCalendar = useMatchStore(s => s.clubCalendar)
  const myClub      = CLUBS.find(c => c.id === myClubId)

  const calendar = useMemo(
    () => clubCalendar.length > 0 ? clubCalendar : [],
    [clubCalendar],
  )
  const stats    = useMemo(() => calcStats(calendar), [calendar])

  const currentWeek = useMemo(
    () => currentWeekFromRound(calendar, round),
    [calendar, round]
  )

  // Todos os shorts de competição existentes
  const allShorts = useMemo(
    () => Object.keys(stats.byCompetition),
    [stats]
  )

  // Chips de filtro — todos ativos por padrão
  const [activeComps, setActiveComps] = useState<Set<string>>(
    () => new Set(Object.keys(stats.byCompetition))
  )

  function toggleComp(short: string) {
    setActiveComps(prev => {
      const next = new Set(prev)
      if (next.has(short)) {
        // Não deixa desativar o último
        if (next.size === 1) return prev
        next.delete(short)
      } else {
        next.add(short)
      }
      return next
    })
  }

  function selectAll() {
    setActiveComps(new Set(allShorts))
  }

  const allSelected = activeComps.size === allShorts.length

  // Competições eliminadas (por ID)
  const eliminatedIds = useMemo(
    () => new Set(Object.entries(cupStatus).filter(([,v]) => v === 'eliminated').map(([k]) => k)),
    [cupStatus],
  )

  // Jogos filtrados pelo conjunto ativo
  const filtered = useMemo(
    () => calendar.filter(g => activeComps.has(g.competitionShort)),
    [calendar, activeComps]
  )

  // Agrupa por mês
  const byMonth = useMemo(() => {
    const map: Record<number, CalendarGame[]> = {}
    for (let m = 1; m <= 12; m++) map[m] = []
    for (const g of filtered) map[weekToMonth(g.week)].push(g)
    return map
  }, [filtered])

  const [tab, setTab] = useState<'calendario' | 'meus-jogos'>('calendario')

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 pt-4 pb-0 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-bebas text-[20px] tracking-[4px] text-gold">CALENDÁRIO DA TEMPORADA</div>
            <div className="text-[11px] text-[#4a6070] mt-[2px]">
              {stats.totalGames} jogos · {stats.busyWeeks} semanas duplas · semana atual{' '}
              <span className="text-gold font-bold">S{currentWeek}</span>
            </div>
          </div>

          {/* Chips de filtro */}
          <div className="flex flex-wrap gap-[5px] justify-end max-w-[500px] items-center">
            {/* "Todos" pill */}
            <button
              onClick={selectAll}
              className={`text-[9px] font-bold tracking-[1px] px-[8px] py-[3px] rounded-full border transition-all
                          ${allSelected
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'border-border text-[#4a6070] hover:text-white hover:border-[#2a3d52]'}`}
            >
              TODOS
            </button>
            {allShorts.map(short => {
              const c          = getColor(short)
              const active     = activeComps.has(short)
              // Verifica se alguma competição com este short está eliminada
              const isElim     = calendar.some(
                g => g.competitionShort === short && eliminatedIds.has(g.competitionId)
              )
              return (
                <button
                  key={short}
                  onClick={() => toggleComp(short)}
                  style={active && !isElim
                    ? { background: c.bg, color: c.text, borderColor: c.border }
                    : { background: 'transparent', color: isElim ? '#4a3a3a' : '#3a5060', borderColor: '#1e2d3d' }}
                  className="text-[10px] font-bold tracking-[1px] px-[8px] py-[3px] rounded-full border
                             transition-all cursor-pointer select-none hover:opacity-80"
                  title={isElim ? 'Eliminado' : undefined}
                >
                  {isElim && <span className="mr-[3px] text-glred/60">✗</span>}
                  {short} {stats.byCompetition[short]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-0">
          {([
            { id: 'calendario',  label: '📅 Calendário Completo' },
            { id: 'meus-jogos',  label: `⚽ Jogos do ${myClub?.short ?? 'Seu Time'}` },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-[9px] font-bebas text-[13px] tracking-[2px] border-b-2 transition-all
                          ${tab === t.id
                            ? 'border-gold text-gold'
                            : 'border-transparent text-[#4a6070] hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ABA: Calendário Completo ── */}
      {tab === 'calendario' && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-3">
            {MONTH_NAMES.map((month, i) => {
              const m = i + 1
              const games = byMonth[m]
              const byWeek: Record<number, CalendarGame[]> = {}
              for (const g of games) {
                if (!byWeek[g.week]) byWeek[g.week] = []
                byWeek[g.week].push(g)
              }
              return (
                <MonthCard
                  key={m}
                  month={month}
                  byWeek={byWeek}
                  total={games.length}
                  currentWeek={currentWeek}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── ABA: Jogos do Seu Time ── */}
      {tab === 'meus-jogos' && (
        <MyGamesTab
          calendar={filtered}
          currentWeek={currentWeek}
          myClub={myClub}
          myClubId={myClubId ?? ''}
          fixtures={fixtures}
          eliminatedIds={eliminatedIds}
        />
      )}
    </div>
  )
}

// ── Card de um mês ───────────────────────────────────────
function MonthCard({
  month, byWeek, total, currentWeek,
}: {
  month: string
  byWeek: Record<number, CalendarGame[]>
  total: number
  currentWeek: number
}) {
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b)
  const hasCurrentWeek = weeks.includes(currentWeek)

  return (
    <div className={`bg-surface border rounded-xl overflow-hidden transition-all
                     ${hasCurrentWeek ? 'border-gold/40' : 'border-border'}`}>
      <div className={`flex items-center justify-between px-3 py-[7px] border-b
                       ${hasCurrentWeek ? 'bg-gold/[0.08] border-gold/20' : 'bg-surface2 border-border'}`}>
        <span className={`font-bebas text-[13px] tracking-[2px]
                          ${hasCurrentWeek ? 'text-gold' : 'text-white/80'}`}>{month}</span>
        <div className="flex items-center gap-2">
          {hasCurrentWeek && (
            <span className="text-[9px] text-gold border border-gold/40 px-[5px] py-[1px] rounded-full tracking-[1px] font-bold">
              AGORA
            </span>
          )}
          <span className="text-[10px] text-[#4a6070]">{total} jogo{total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="px-3 py-2 flex flex-col gap-[5px] min-h-[72px]">
        {weeks.length === 0 ? (
          <div className="flex items-center justify-center py-4 text-[11px] text-[#2a3d52]">
            — sem jogos —
          </div>
        ) : weeks.map(w => (
          <WeekRow key={w} week={w} games={byWeek[w]} isCurrent={w === currentWeek} />
        ))}
      </div>
    </div>
  )
}

// ── Linha de uma semana ──────────────────────────────────
function WeekRow({ week, games, isCurrent }: {
  week: number; games: CalendarGame[]; isCurrent?: boolean
}) {
  return (
    <div className={`flex items-center gap-[6px] rounded-md px-[2px]
                     ${isCurrent ? 'bg-gold/[0.06] outline outline-1 outline-gold/30' : ''}`}>
      <span className={`text-[9px] w-[28px] flex-shrink-0 font-mono font-bold
                        ${isCurrent ? 'text-gold' : 'text-[#3a5060]'}`}>
        S{week}
      </span>
      {isCurrent && (
        <span className="text-[8px] text-gold/70 font-bold leading-none mr-[2px]">▶</span>
      )}
      <div className="flex gap-[4px] flex-wrap">
        {games.map((g, i) => <GameChip key={i} game={g} />)}
      </div>
    </div>
  )
}

// ── Chip de jogo ─────────────────────────────────────────
function GameChip({ game }: { game: CalendarGame }) {
  const c = getColor(game.competitionShort)
  const phaseShort = abbreviatePhase(game.phaseName)

  return (
    <div
      title={`${game.competitionName} · ${game.phaseName} · ${game.isHome ? 'Casa' : 'Fora'}`}
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
      className="flex items-center gap-[4px] px-[6px] py-[3px] rounded-md border
                 text-[10px] font-medium cursor-default select-none whitespace-nowrap"
    >
      <span className="font-bold">{game.competitionShort}</span>
      <span className="opacity-70">{phaseShort}</span>
      <span className="opacity-50 text-[8px]">{game.isHome ? '⌂' : '✈'}</span>
    </div>
  )
}

// ── Aba "Jogos do Seu Time" ───────────────────────────────
import type { Club } from '@/engines/types'
import type { FixtureGame } from '@/engines/fixtureEngine'

function MyGamesTab({
  calendar, currentWeek, myClub, myClubId, fixtures, eliminatedIds,
}: {
  calendar:      CalendarGame[]
  currentWeek:   number
  myClub:        Club | undefined
  myClubId:      string
  fixtures:      FixtureGame[]
  eliminatedIds: Set<string>
}) {
  const past     = calendar.filter(g => g.week < currentWeek).slice(-5).reverse()
  const upcoming = calendar.filter(g => g.week >= currentWeek).slice(0, 20)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-5 pt-4 pb-2">
        <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-3">Próximos Jogos</div>
        {upcoming.length === 0 ? (
          <div className="text-[12px] text-[#3a5060] italic py-6 text-center">
            Sem jogos futuros no filtro atual.
          </div>
        ) : (
          <div className="flex flex-col gap-[6px]">
            {upcoming.map((g, i) => (
              <MyGameRow key={i} game={g} isCurrent={g.week === currentWeek}
                isPast={false} myClub={myClub} myClubId={myClubId} fixtures={fixtures}
                isEliminated={eliminatedIds.has(g.competitionId)} />
            ))}
          </div>
        )}
      </div>
      {past.length > 0 && (
        <div className="px-5 pt-4 pb-4">
          <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-3 flex items-center gap-2">
            <span>Jogos Anteriores</span>
            <span className="text-[#2a3d52]">(últimos 5)</span>
          </div>
          <div className="flex flex-col gap-[6px]">
            {past.map((g, i) => (
              <MyGameRow key={i} game={g} isCurrent={false} isPast
                myClub={myClub} myClubId={myClubId} fixtures={fixtures}
                isEliminated={eliminatedIds.has(g.competitionId)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MyGameRow({
  game, isCurrent, isPast, isEliminated, myClub, myClubId, fixtures,
}: {
  game:         CalendarGame
  isCurrent:    boolean
  isPast:       boolean
  isEliminated: boolean
  myClub:       Club | undefined
  myClubId:     string
  fixtures:     FixtureGame[]
}) {
  const c          = getColor(game.competitionShort)
  const phaseShort = abbreviatePhase(game.phaseName)

  // Resolve adversário real para jogos do Brasileirão
  // game.gameIndex = índice 0-based → round = gameIndex + 1
  let oppShort = '???'
  let oppName  = '???'
  if (game.competitionShort === 'BRAS' && fixtures.length > 0) {
    const round   = game.gameIndex + 1
    const fix     = fixtures.find(
      f => f.round === round && (f.homeId === myClubId || f.awayId === myClubId)
    )
    if (fix) {
      const oppId = fix.homeId === myClubId ? fix.awayId : fix.homeId
      const oppClub = CLUBS_MAP[oppId]
      oppShort = oppClub?.short ?? oppId.toUpperCase()
      oppName  = oppClub?.name  ?? oppId
    }
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-[9px] rounded-xl border transition-all
                     ${isCurrent
                       ? 'border-gold/50 bg-gold/[0.06]'
                       : isPast
                         ? 'border-border/40 bg-surface/30 opacity-50'
                         : isEliminated
                           ? 'border-glred/20 bg-glred/5 opacity-60'
                           : 'border-border bg-surface/60'}`}>
      {/* Semana */}
      <div className="w-[34px] text-center shrink-0">
        <div className={`font-bebas text-[15px] leading-none ${isCurrent ? 'text-gold' : 'text-white/40'}`}>
          S{game.week}
        </div>
        {isCurrent && (
          <div className="text-[8px] text-gold/60 tracking-[1px] font-bold">AGORA</div>
        )}
      </div>

      {/* Competição badge */}
      <div
        style={{ background: c.bg, color: c.text, borderColor: c.border }}
        className="shrink-0 text-[10px] font-bold tracking-[1px] px-[7px] py-[4px]
                   rounded-lg border whitespace-nowrap"
      >
        {game.competitionShort}
      </div>

      {/* Fase */}
      <div className="flex-1 min-w-0">
        <div className={`text-[12px] font-medium truncate ${isCurrent ? 'text-white' : 'text-white/60'}`}>
          {game.competitionName}
        </div>
        <div className="text-[10px] text-[#4a6070]">
          {phaseShort || game.phaseName}
        </div>
      </div>

      {/* Badge eliminado */}
      {isEliminated && (
        <span className="shrink-0 text-[9px] px-[5px] py-[2px] rounded border border-glred/30 text-glred/70 font-bold">
          ✗ ELIM
        </span>
      )}

      {/* Meu time × Adversário */}
      <div className="flex items-center gap-2 shrink-0 text-[12px]">
        {game.isHome ? (
          <>
            <span className="font-bold text-white/80">{myClub?.short ?? 'TIME'}</span>
            <span className="text-[#3a5060]">×</span>
            <span className={`${oppShort === '???' ? 'text-[#5a7080]' : 'text-white/80'}`}
                  title={oppName}>{oppShort}</span>
            <span className="text-[10px] text-glgreen font-bold ml-1">⌂</span>
          </>
        ) : (
          <>
            <span className={`${oppShort === '???' ? 'text-[#5a7080]' : 'text-white/80'}`}
                  title={oppName}>{oppShort}</span>
            <span className="text-[#3a5060]">×</span>
            <span className="font-bold text-white/80">{myClub?.short ?? 'TIME'}</span>
            <span className="text-[10px] text-[#4a6070] font-bold ml-1">✈</span>
          </>
        )}
      </div>
    </div>
  )
}

// ── Abreviação de fase ───────────────────────────────────
function abbreviatePhase(name: string): string {
  const map: Record<string, string> = {
    'Fase de Grupos':    'Grupos',
    'Temporada Regular': '',
    'Oitavas de Final':  'Oitavas',
    'Quartas de Final':  'Quartas',
    'Semifinais':        'Semi',
    'Final':             'Final',
    'Jogo de Ida':       'Ida',
    'Jogo de Volta':     'Volta',
    'Fase 5':            'F5',
  }
  if (map[name] !== undefined) return map[name]
  const rodada = name.match(/Rodada (\d+)/)
  if (rodada) return `R${rodada[1]}`
  return name.slice(0, 5)
}
