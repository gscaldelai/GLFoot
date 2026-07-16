// ════════════════════════════════════════════════════════
//  GLfoot — CompetitionsView (tela de Tabelas)
//  Seletor com TODAS as competições do clube na temporada.
//  Competição eliminada continua visível e selecionável.
//
//  ⚠ Honestidade dos dados (não inventar o que o jogo não simula):
//  • Brasileirão  → classificação real (standings), 20 clubes, 38 rodadas.
//  • Copas        → NÃO há chaveamento nem adversário no modelo de dados.
//    O jogo resolve cada jogo eliminatório por sorteio (nextRound), gravando
//    só 'active' | 'eliminated' + a fase da queda (cupElimination).
//    Logo, aqui mostramos o PERCURSO do clube (fases, semanas, mando e
//    status) — nunca placares, adversários ou chaves fictícias.
// ════════════════════════════════════════════════════════
import { useMemo, useState } from 'react'
import Standings from '@/components/Standings'
import { getColor } from '@/pages/CalendarView'
import { useMatchStore, type CupElimination } from '@/stores/useMatchStore'
import { COMPETITION_CATALOG, type Competition, type Phase } from '@/data/competitions'
import type { CalendarGame } from '@/engines/calendarEngine'

// A temporada do jogo tem 38 rodadas e a simulação de copa compara
// `game.week === round` (rodada ≈ semana). Fases agendadas depois da semana 38
// nunca chegam a ser sorteadas — precisamos dizer isso em vez de fingir.
const LAST_SIMULATED_WEEK = 38

// Ordem de exibição: liga principal primeiro, depois continental, nacional, estadual
const TYPE_ORDER: Record<Competition['type'], number> = {
  internacional: 1,
  nacional:      2,
  estadual:      3,
}

type PhaseState =
  | 'passed'       // já disputada — clube seguiu adiante
  | 'current'      // acontecendo nesta rodada
  | 'future'       // ainda vai acontecer
  | 'eliminated'   // fase em que o clube caiu
  | 'notplayed'    // não disputada (clube já estava eliminado)
  | 'unreachable'  // agendada além da rodada 38 — o jogo nunca simula

interface PhaseRow {
  phase:   Phase
  games:   CalendarGame[]
  minWeek: number
  maxWeek: number
  state:   PhaseState
}

// ── Tela principal ───────────────────────────────────────
export default function CompetitionsView() {
  const clubCalendar   = useMatchStore(s => s.clubCalendar)
  const cupStatus      = useMatchStore(s => s.cupStatus)
  const cupElimination = useMatchStore(s => s.cupElimination)
  const round          = useMatchStore(s => s.round)
  const season         = useMatchStore(s => s.season)

  // Competições do clube derivadas do calendário da temporada
  const comps = useMemo(() => {
    const ids = Array.from(new Set(clubCalendar.map(g => g.competitionId)))
    return ids
      .map(id => COMPETITION_CATALOG[id])
      .filter((c): c is Competition => Boolean(c))
      .sort((a, b) => {
        // Brasileirão sempre primeiro — é a única com classificação real
        if (a.id === 'brasileirao') return -1
        if (b.id === 'brasileirao') return 1
        return TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name)
      })
  }, [clubCalendar])

  const [selectedId, setSelectedId] = useState<string>('brasileirao')

  // O calendário pode não conter a competição selecionada (troca de clube via
  // switchClub reconstrói clubCalendar): cai para a primeira disponível.
  const selected = comps.find(c => c.id === selectedId) ?? comps[0]

  if (comps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-8">
        <div className="text-[56px] opacity-20 select-none">📊</div>
        <div className="font-bebas text-[22px] tracking-[4px] text-[#4a6070]">
          SEM COMPETIÇÕES
        </div>
        <div className="text-[12px] text-[#3a5060] max-w-[340px]">
          O calendário desta carreira ainda não foi gerado.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* ── Header + seletor ── */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-bebas text-[20px] tracking-[4px] text-gold">TABELAS</div>
            <div className="text-[11px] text-[#4a6070] mt-[2px]">
              {comps.length} competições · temporada{' '}
              <span className="text-gold font-bold">T{season}</span> · rodada{' '}
              <span className="text-gold font-bold">{round}</span>
            </div>
          </div>
        </div>

        {/* Chips — eliminadas continuam clicáveis (pedido explícito) */}
        <div className="flex flex-wrap gap-[6px]">
          {comps.map(comp => (
            <CompChip
              key={comp.id}
              comp={comp}
              active={selected?.id === comp.id}
              eliminated={cupStatus[comp.id] === 'eliminated'}
              onClick={() => setSelectedId(comp.id)}
            />
          ))}
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="flex-1 overflow-y-auto p-4">
        {selected && (selected.id === 'brasileirao'
          ? <LeaguePanel />
          : <CupPanel
              comp={selected}
              calendar={clubCalendar}
              round={round}
              eliminated={cupStatus[selected.id] === 'eliminated'}
              elimination={cupElimination[selected.id]}
            />
        )}
      </div>
    </div>
  )
}

// ── Chip de competição ───────────────────────────────────
function CompChip({
  comp, active, eliminated, onClick,
}: {
  comp:       Competition
  active:     boolean
  eliminated: boolean
  onClick:    () => void
}) {
  const c = getColor(comp.short)

  return (
    <button
      onClick={onClick}
      title={eliminated ? `${comp.name} — eliminado (ainda visível)` : comp.name}
      style={active
        ? { background: c.bg, color: c.text, borderColor: c.text }
        : { background: 'transparent', color: eliminated ? '#5a4a4a' : '#4a6070', borderColor: '#1e2d3d' }}
      className={`flex items-center gap-[6px] px-[10px] py-[5px] rounded-full border
                  text-[11px] font-bold tracking-[1px] transition-all cursor-pointer
                  select-none hover:opacity-80
                  ${active ? 'shadow-[0_0_12px_rgba(0,0,0,.4)]' : 'hover:border-[#2a3d52]'}`}
    >
      {eliminated && <span className="text-glred/70 text-[10px]">✗</span>}
      <span>{comp.short}</span>
      <span className="font-normal opacity-70 tracking-normal">{comp.name}</span>
    </button>
  )
}

// ── Painel da liga (única com classificação real) ────────
function LeaguePanel() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="font-bebas text-[15px] tracking-[3px] text-[#6a8090]">
          CLASSIFICAÇÃO
        </span>
        <span className="text-[10px] text-[#3a5060]">· pontos corridos · 38 rodadas</span>
      </div>
      <Standings />
    </div>
  )
}

// ── Painel de copa: percurso do clube ────────────────────
function CupPanel({
  comp, calendar, round, eliminated, elimination,
}: {
  comp:        Competition
  calendar:    CalendarGame[]
  round:       number
  eliminated:  boolean
  elimination: CupElimination | undefined
}) {
  const rows = useMemo(
    () => buildPhaseRows(comp, calendar, round, eliminated, elimination),
    [comp, calendar, round, eliminated, elimination],
  )
  const c = getColor(comp.short)

  return (
    <div className="flex flex-col gap-3">

      {/* Cabeçalho da copa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bebas text-[15px] tracking-[3px] text-[#6a8090]">PERCURSO</span>
          <span className="text-[10px] text-[#3a5060]">· fases do seu clube nesta temporada</span>
        </div>
        <StatusBadge eliminated={eliminated} elimination={elimination} />
      </div>

      {/* Aviso honesto — a copa não tem chaveamento no modelo de dados */}
      <div className="flex items-start gap-[10px] bg-surface2/60 border border-border rounded-lg px-3 py-[10px]">
        <span className="text-[14px] leading-none mt-[1px] opacity-60">ℹ</span>
        <div className="text-[11px] text-[#6a8090] leading-relaxed">
          As copas ainda <span className="text-white/70">não têm chaveamento</span> no jogo: cada
          confronto eliminatório é resolvido por sorteio ponderado pela força do elenco, e o modelo
          de dados não guarda <span className="text-white/70">adversário nem placar</span>. Por isso
          esta tela mostra só o que existe de verdade — as fases do seu calendário, a semana, o mando
          de campo e o status do clube.
        </div>
      </div>

      {/* Lista de fases */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="grid text-[9px] tracking-widest text-[#4a6070] uppercase
                        px-[14px] py-2 bg-surface2 border-b border-border"
             style={{ gridTemplateColumns: '1fr 90px 80px 130px' }}>
          <span>Fase</span>
          <span className="text-center">Semana</span>
          <span className="text-center">Jogos</span>
          <span className="text-center">Status</span>
        </div>

        {rows.map(row => (
          <PhaseRowView key={row.phase.id} row={row} accent={c.text} />
        ))}
      </div>

      {/* Rodapé: o que não é rastreado */}
      <div className="text-[10px] text-[#3a5060] leading-relaxed px-1">
        Não rastreado hoje:{' '}
        <span className="text-[#4a6070]">tabela de grupos</span> (as fases de grupos não são
        simuladas — o clube passa direto),{' '}
        <span className="text-[#4a6070]">adversários</span>,{' '}
        <span className="text-[#4a6070]">placares</span> e{' '}
        <span className="text-[#4a6070]">artilharia por copa</span>.
      </div>
    </div>
  )
}

// ── Badge de status geral da copa ────────────────────────
function StatusBadge({
  eliminated, elimination,
}: { eliminated: boolean; elimination: CupElimination | undefined }) {
  if (!eliminated) {
    return (
      <span className="text-[10px] font-bold tracking-[1px] px-[8px] py-[3px] rounded-full
                       border border-glgreen/40 text-glgreen bg-glgreen/10">
        ● VIVO NA COMPETIÇÃO
      </span>
    )
  }
  return (
    <span
      title={elimination
        ? `Eliminado na rodada ${elimination.round}`
        : 'Fase da eliminação não registrada nesta carreira'}
      className="text-[10px] font-bold tracking-[1px] px-[8px] py-[3px] rounded-full
                 border border-glred/40 text-glred bg-glred/10"
    >
      ✗ ELIMINADO{elimination ? ` · ${elimination.phaseName.toUpperCase()}` : ''}
    </span>
  )
}

// ── Linha de uma fase ────────────────────────────────────
const STATE_LABEL: Record<PhaseState, string> = {
  passed:      'Classificado',
  current:     'Em disputa',
  future:      'A disputar',
  eliminated:  'Eliminado aqui',
  notplayed:   'Não disputada',
  unreachable: 'Não simulada',
}

const STATE_STYLE: Record<PhaseState, string> = {
  passed:      'border-glgreen/30 text-glgreen/80 bg-glgreen/[0.07]',
  current:     'border-gold/50 text-gold bg-gold/[0.08]',
  future:      'border-border text-[#4a6070]',
  eliminated:  'border-glred/40 text-glred bg-glred/10',
  notplayed:   'border-border/60 text-[#3a5060]',
  unreachable: 'border-[#3a3a2a] text-[#7a6a3a] bg-[#2a2410]/40',
}

const STATE_TITLE: Record<PhaseState, string> = {
  passed:      'O sorteio desta fase já rodou e o clube avançou.',
  current:     'Fase agendada para a rodada atual.',
  future:      'Ainda não chegou a semana desta fase.',
  eliminated:  'Fase em que o clube foi eliminado.',
  notplayed:   'O clube já estava eliminado quando esta fase chegou.',
  unreachable: 'Agendada depois da rodada 38 — a temporada acaba antes e o jogo nunca simula esta fase.',
}

function PhaseRowView({ row, accent }: { row: PhaseRow; accent: string }) {
  const { phase, games, minWeek, maxWeek, state } = row
  const isGroup = phase.format === 'league'
  const dim     = state === 'notplayed' || state === 'future'

  return (
    <div
      className={`grid items-center px-[14px] py-[10px] border-b border-border/40
                  transition-colors ${state === 'current' ? 'bg-gold/[0.04]' : 'hover:bg-surface2'}
                  ${dim ? 'opacity-55' : ''}`}
      style={{ gridTemplateColumns: '1fr 90px 80px 130px' }}
    >
      {/* Fase */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-[3px] h-[16px] rounded-full flex-shrink-0"
              style={{ background: state === 'notplayed' ? '#1e2d3d' : accent, opacity: dim ? 0.4 : 1 }} />
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-white/80 truncate">{phase.name}</div>
          <div className="text-[10px] text-[#4a6070]">
            {isGroup
              ? 'fase de grupos · sem classificação no jogo'
              : phase.format === 'two_leg_elim' ? 'ida e volta' : 'jogo único'}
          </div>
        </div>
      </div>

      {/* Semana */}
      <div className="text-center font-mono text-[11px] text-[#5a7080]">
        {minWeek === maxWeek ? `S${minWeek}` : `S${minWeek}–S${maxWeek}`}
      </div>

      {/* Jogos (mando de campo — isto o calendário guarda de verdade) */}
      <div className="flex items-center justify-center gap-[4px]">
        {games.map((g, i) => (
          <span
            key={i}
            title={`Semana ${g.week} · ${g.isHome ? 'Casa' : 'Fora'}`}
            className={`text-[10px] font-bold w-[16px] h-[16px] rounded flex items-center
                        justify-center border ${g.isHome
                          ? 'border-glgreen/30 text-glgreen/70 bg-glgreen/5'
                          : 'border-border text-[#4a6070]'}`}
          >
            {g.isHome ? '⌂' : '✈'}
          </span>
        ))}
        {games.length === 0 && <span className="text-[10px] text-[#2a3d52]">—</span>}
      </div>

      {/* Status */}
      <div className="flex justify-center">
        <span
          title={STATE_TITLE[state]}
          className={`text-[9px] font-bold tracking-[1px] px-[7px] py-[3px] rounded-full
                      border uppercase whitespace-nowrap ${STATE_STYLE[state]}`}
        >
          {STATE_LABEL[state]}
        </span>
      </div>
    </div>
  )
}

// ── Derivação do percurso ────────────────────────────────
// Só usa dados que existem: calendário do clube + cupStatus + cupElimination.
export function buildPhaseRows(
  comp:        Competition,
  calendar:    CalendarGame[],
  round:       number,
  eliminated:  boolean,
  elimination: CupElimination | undefined,
): PhaseRow[] {
  const elimIdx = elimination
    ? comp.phases.findIndex(p => p.id === elimination.phaseId)
    : -1

  return comp.phases.map((phase, idx) => {
    const games = calendar
      .filter(g => g.competitionId === comp.id && g.phaseId === phase.id)
      .sort((a, b) => a.week - b.week)

    // Sem jogos no calendário, cai para a janela declarada no catálogo
    const minWeek = games.length ? games[0].week : phase.startWeek
    const maxWeek = games.length ? games[games.length - 1].week : phase.endWeek

    let state: PhaseState
    if (elimIdx >= 0 && idx === elimIdx) {
      state = 'eliminated'
    } else if (elimIdx >= 0 && idx > elimIdx) {
      state = 'notplayed'
    } else if (eliminated && elimIdx === -1 && maxWeek >= round) {
      // Eliminado, mas sem registro da fase (save anterior ao cupElimination):
      // não dá para afirmar que disputou as fases seguintes.
      state = 'notplayed'
    } else if (minWeek > LAST_SIMULATED_WEEK) {
      state = 'unreachable'
    } else if (round > maxWeek) {
      state = 'passed'
    } else if (round >= minWeek) {
      state = 'current'
    } else {
      state = 'future'
    }

    return { phase, games, minWeek, maxWeek, state }
  })
}
