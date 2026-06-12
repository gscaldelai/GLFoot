// ════════════════════════════════════════════════════════
//  GLfoot — Mercado
//  Árvore de ligas + tabela de jogadores + filtros inline
// ════════════════════════════════════════════════════════
import { useState, useMemo } from 'react'
import { CLUBS } from '@/data/clubs'
import { CLUB_TROPHIES } from '@/data/trophies'
import {
  calcMarketValue, calcPasse, calcSalary, calcSquadValue,
  checkTransferEligibility,
  fmtValue, fmtSalary,
} from '@/engines/marketEngine'
import { useMatchStore }    from '@/stores/useMatchStore'
import { useTransferStore } from '@/stores/useTransferStore'
import { useFinanceStore }  from '@/stores/useFinanceStore'
import type { Player, Pos, Spec } from '@/engines/types'
import ClubCrest from '@/components/ClubCrest'
import { avgSquad } from '@/engines/matchEngine'

// ── Helpers ──────────────────────────────────────────────
const SPEC_LABEL: Record<string, string> = {
  FI: 'Fin', VE: 'Vel', DR: 'Dri', DE: 'Des',
  PA: 'Pas', RE: 'Ref', FO: 'For', MA: 'Mar',
}
const SPEC_FULL: Record<string, string> = {
  FI: 'Finalização', VE: 'Velocidade', DR: 'Drible',   DE: 'Desarme',
  PA: 'Passe',       RE: 'Reflexos',   FO: 'Força',    MA: 'Marcação',
}
const POS_LABEL: Record<string, string> = {
  GK: 'G', LAT: 'L', ZAG: 'Z', VOL: 'V', MEI: 'M', ATA: 'A',
}
const NAT_FLAG: Record<string, string> = {
  BRA: '🇧🇷', ARG: '🇦🇷', URU: '🇺🇾', PAR: '🇵🇾',
  COL: '🇨🇴', ECU: '🇪🇨', CHI: '🇨🇱', PER: '🇵🇪',
}
const ALL_POSITIONS: Pos[]  = ['GK', 'LAT', 'ZAG', 'VOL', 'MEI', 'ATA']
const ALL_SPECS: Spec[]     = ['FI', 'VE', 'DR', 'DE', 'PA', 'RE', 'FO', 'MA']

// ── Clube básico (reais + bots) ───────────────────────────
interface ClubBasic {
  id: string; name: string; short: string
  colors: [string, string, string]; crestColors: [string, string]
  hasSquad: boolean
}

const SERIE_A_BASIC: ClubBasic[] = CLUBS.map(c => ({
  id: c.id, name: c.name, short: c.short, colors: c.colors, crestColors: c.crestColors, hasSquad: true,
}))

// Todos os jogadores com full data para busca global
const ALL_PLAYERS_WITH_CLUB = CLUBS.flatMap(c =>
  [...c.squad, ...c.bench].map(p => ({
    player: p, clubId: c.id, clubName: c.name, clubShort: c.short,
  }))
)

// ── Árvore de ligas ──────────────────────────────────────
interface LeagueNode {
  id: string; label: string
  children?: LeagueNode[]
  clubs?: ClubBasic[]
}
const LEAGUE_TREE: LeagueNode[] = [
  {
    id: 'brasil', label: 'Brasil', children: [
      { id: 'serie_a',    label: 'Brasileirão - Série A', clubs: SERIE_A_BASIC },
      { id: 'serie_b',    label: 'Brasileirão - Série B', clubs: [] },
      { id: 'serie_c',    label: 'Brasileirão - Série C', clubs: [] },
      { id: 'regionais',  label: 'Regionais',             clubs: [] },
    ],
  },
  { id: 'internacionais', label: 'Internacionais', clubs: [] },
]

// ════════════════════════════════════════════════════════
//  Componente principal — Mercado
// ════════════════════════════════════════════════════════
export default function TransferMarket() {
  const myClubId         = useMatchStore(s => s.myClubId)
  const acquiredPlayers  = useMatchStore(s => s.acquiredPlayers)
  const executeTransfer  = useMatchStore(s => s.executeTransfer)
  const budget           = useFinanceStore(s => s.budget)
  const toggleSale       = useTransferStore(s => s.toggleSale)
  const toggleLoan       = useTransferStore(s => s.toggleLoan)
  const isForSale        = useTransferStore(s => s.isForSale)
  const isForLoan        = useTransferStore(s => s.isForLoan)

  const [transferMsg, setTransferMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // ── Estado de navegação ──────────────────────────────
  const [selectedClubId, setSelectedClubId] = useState<string | null>(myClubId)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [playerTab,      setPlayerTab]      = useState<'info' | 'carreira'>('info')
  const [trophyOpen,     setTrophyOpen]     = useState(false)
  const [expanded,       setExpanded]       = useState<Set<string>>(new Set(['brasil', 'serie_a']))

  // ── Filtros inline ───────────────────────────────────
  const [filterName,    setFilterName]    = useState('')
  const [filterPos,     setFilterPos]     = useState<Pos | ''>('')
  const [filterSpec,    setFilterSpec]    = useState<Spec | ''>('')
  const [filterForceMin,setFilterForceMin]= useState(1)
  const [filterForceMax,setFilterForceMax]= useState(99)
  const [filterAllClubs,setFilterAllClubs]= useState(false)  // false = clube selecionado | true = todos
  const [filterOnlySale,setFilterOnlySale]= useState(false)
  const [filterOnlyLoan,setFilterOnlyLoan]= useState(false)

  // ── Dados do clube selecionado ───────────────────────
  const selectedClub  = SERIE_A_BASIC.find(c => c.id === selectedClubId) ?? null
  const realClub      = CLUBS.find(c => c.id === selectedClubId) ?? null
  const allPlayers    = realClub ? [...realClub.squad, ...realClub.bench] : []
  const squadValue    = realClub ? calcSquadValue(allPlayers) : 0
  const trophies      = CLUB_TROPHIES[selectedClubId ?? ''] ?? []
  const totalTrophies = trophies.reduce((s, t) => s + t.years.length, 0)
  const isOwnClub     = selectedClubId === myClubId

  // IDs de jogadores já adquiridos nesta carreira (para filtrar da tabela)
  const acquiredKeys = useMemo(
    () => new Set(acquiredPlayers.map(a => `${a.fromClubId}_${a.player.num}`)),
    [acquiredPlayers],
  )

  // Força média real do meu clube
  const myRealClub    = CLUBS.find(c => c.id === myClubId)
  const MY_CLUB_FORCE = myRealClub
    ? Math.round(avgSquad([...myRealClub.squad, ...myRealClub.bench]))
    : 72
  const MY_BUDGET     = budget
  const sellerForce   = realClub
    ? Math.round(allPlayers.reduce((s, p) => s + p.forca, 0) / Math.max(allPlayers.length, 1))
    : 70

  const buyEligibility  = selectedPlayer
    ? checkTransferEligibility(selectedPlayer, sellerForce, MY_CLUB_FORCE, MY_BUDGET, 'buy')
    : null
  const loanEligibility = selectedPlayer
    ? checkTransferEligibility(selectedPlayer, sellerForce, MY_CLUB_FORCE, MY_BUDGET, 'loan')
    : null

  // ── Jogadores filtrados ──────────────────────────────
  const sourcePool = useMemo(() => {
    if (filterAllClubs) return ALL_PLAYERS_WITH_CLUB
    if (!realClub)      return []
    return allPlayers.map(p => ({
      player: p, clubId: realClub.id, clubName: realClub.name, clubShort: realClub.short,
    }))
  }, [filterAllClubs, realClub, allPlayers])

  const filteredRows = useMemo(() => sourcePool.filter(({ player: p, clubId }) => {
    if (acquiredKeys.has(`${clubId}_${p.num}`)) return false  // já adquirido
    if (filterName    && !p.name.toLowerCase().includes(filterName.toLowerCase())) return false
    if (filterPos     && p.pos  !== filterPos)  return false
    if (filterSpec    && p.spec !== filterSpec && p.spec2 !== filterSpec) return false
    if (p.forca < filterForceMin || p.forca > filterForceMax) return false
    if (filterOnlySale && !isForSale(clubId, p.num)) return false
    if (filterOnlyLoan && !isForLoan(clubId, p.num)) return false
    return true
  }), [sourcePool, acquiredKeys, filterName, filterPos, filterSpec, filterForceMin, filterForceMax, filterOnlySale, filterOnlyLoan, isForSale, isForLoan])

  const hasFilters = filterName || filterPos || filterSpec ||
    filterForceMin > 1 || filterForceMax < 99 ||
    filterOnlySale || filterOnlyLoan || filterAllClubs

  function resetFilters() {
    setFilterName(''); setFilterPos(''); setFilterSpec('')
    setFilterForceMin(1); setFilterForceMax(99)
    setFilterOnlySale(false); setFilterOnlyLoan(false)
    setFilterAllClubs(false)
  }

  // ── Árvore de ligas ──────────────────────────────────
  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectClub(id: string) {
    setSelectedClubId(id)
    setSelectedPlayer(null)
    setTrophyOpen(false)
    setFilterAllClubs(false)
  }

  function renderNode(node: LeagueNode, depth = 0): React.ReactNode {
    const isOpen    = expanded.has(node.id)
    const hasChildren = (node.children?.length ?? 0) > 0
    const hasClubs    = (node.clubs?.length ?? 0) > 0
    return (
      <div key={node.id}>
        <button
          onClick={() => (hasChildren || hasClubs) && toggleExpand(node.id)}
          className="w-full flex items-center gap-1 py-[4px] text-left hover:bg-surface2 transition-colors"
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          <span className="text-[10px] text-[#3a5060] w-3">
            {(hasChildren || hasClubs) ? (isOpen ? '▼' : '▶') : ''}
          </span>
          <span className="text-[11px] text-[#6a8090]">{node.label}</span>
        </button>
        {isOpen && hasClubs && node.clubs!.map(club => (
          <button key={club.id} onClick={() => selectClub(club.id)}
            className={`w-full flex items-center gap-2 py-[5px] pr-2 text-left transition-colors
                        ${selectedClubId === club.id
                          ? 'bg-gold/10 border-l-2 border-gold'
                          : 'hover:bg-surface2 border-l-2 border-transparent'}`}
            style={{ paddingLeft: 8 + (depth + 1) * 12 }}
          >
            <ClubCrest colors={club.crestColors} short={club.short} size={14} />
            <span className={`text-[11px] truncate ${selectedClubId === club.id ? 'text-gold' : 'text-[#8090a0]'}`}>
              {club.name}
            </span>
          </button>
        ))}
        {isOpen && hasChildren && node.children!.map(child => renderNode(child, depth + 1))}
      </div>
    )
  }

  // ════════════════════════════════════════════════════
  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── PAINEL ESQUERDO ── */}
      <div className="w-[220px] flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-surface">

        {/* Árvore */}
        <div className="flex-1 overflow-y-auto py-2">
          {LEAGUE_TREE.map(node => renderNode(node))}
        </div>

        {/* Painel do jogador selecionado */}
        {selectedPlayer && (
          <div className="border-t border-border bg-surface2 flex-shrink-0">
            <div className="px-3 pt-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2 mb-[2px]">
                <span className="text-[10px] font-bold px-[5px] py-[1px] rounded bg-surface border border-border text-[#8090a0]">
                  {POS_LABEL[selectedPlayer.pos]}
                </span>
                <span className="text-[12px] font-bold text-white truncate">{selectedPlayer.name}</span>
                {selectedPlayer.isStar && <span>⭐</span>}
              </div>
              <div className="text-[10px] text-[#4a6070]">
                {NAT_FLAG[selectedPlayer.nationality] ?? '🏳'} {selectedPlayer.nationality}
                {' · '}{selectedPlayer.spec}{selectedPlayer.spec2 ? `/${selectedPlayer.spec2}` : ''}
              </div>
            </div>
            <div className="flex border-b border-border">
              {(['info', 'carreira'] as const).map(t => (
                <button key={t} onClick={() => setPlayerTab(t)}
                  className={`flex-1 py-[5px] text-[10px] tracking-[1px] uppercase transition-colors
                              ${playerTab === t ? 'text-gold border-b border-gold' : 'text-[#4a6070]'}`}>
                  {t}
                </button>
              ))}
            </div>
            {playerTab === 'info' ? (
              <div className="px-3 py-3 grid grid-cols-2 gap-y-[6px]">
                <InfoLine label="Força"   value={String(selectedPlayer.forca)} />
                <InfoLine label="Idade"   value={String(selectedPlayer.age)} />
                <InfoLine label="Jogos"   value={String(selectedPlayer.matchesPlayed)} />
                <InfoLine label="Gols"    value={String(selectedPlayer.gp ?? 0)} />
                <InfoLine label="Passe"   value={`R$ ${fmtValue(calcPasse(selectedPlayer))}`} gold />
                <InfoLine label="Salário" value={`${fmtSalary(calcSalary(selectedPlayer))}/mês`} />
                <div className="col-span-2 mt-[2px]">
                  <div className="text-[9px] text-[#4a6070]">Característica</div>
                  <div className="text-[10px] text-white mt-[1px]">
                    {SPEC_LABEL[selectedPlayer.spec]}{selectedPlayer.spec2 ? `/${SPEC_LABEL[selectedPlayer.spec2]}` : ''}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-3 py-3 grid grid-cols-2 gap-y-[6px]">
                <InfoLine label="Contrato"  value={`${selectedPlayer.contractYearsLeft} ano(s)`} />
                <InfoLine label="Potencial" value={String(selectedPlayer.potencial)} />
                <InfoLine label="Moral"     value={String(selectedPlayer.moral)} />
              </div>
            )}
          </div>
        )}

        {/* Orçamento */}
        <div className="border-t border-border px-3 py-2 flex-shrink-0">
          <div className="text-[9px] text-[#4a6070] uppercase tracking-[1px]">Orçamento</div>
          <div className="font-bebas text-[15px] text-glgreen">R$ {budget.toLocaleString('pt-BR')}</div>
        </div>
      </div>

      {/* ── PAINEL DIREITO ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Cabeçalho do clube */}
        {selectedClub ? (
          <div className="flex-shrink-0 border-b border-border bg-surface px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ClubCrest colors={selectedClub.crestColors} short={selectedClub.short} size={40} />
              <div>
                <div className="font-bebas text-[18px] tracking-[2px] text-white leading-tight">
                  {selectedClub.name}
                  {isOwnClub && (
                    <span className="ml-2 text-[10px] font-sans font-normal tracking-normal
                                     px-2 py-[2px] rounded-full bg-gold/10 border border-gold/30 text-gold">
                      Meu clube
                    </span>
                  )}
                </div>
                {realClub && (
                  <div className="text-[11px] text-[#5a7080]">
                    Valor do elenco:{' '}
                    <span className="text-gold font-bebas text-[13px]">R$ {fmtValue(squadValue)}</span>
                    {' · '}
                    <span className="text-[#5a7080]">Força média: {sellerForce}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-[6px]">
                <ConfidenceBar label="Diretoria" value={65} />
                <ConfidenceBar label="Torcida"   value={72} />
              </div>

              {/* Troféus */}
              <div className="relative">
                <button onClick={() => setTrophyOpen(v => !v)}
                  className="flex items-center gap-1 px-3 py-[5px] rounded-lg border border-border
                             text-[11px] text-[#6a8090] hover:text-gold hover:border-gold/40
                             transition-all bg-surface2">
                  🏆 <span className="font-bebas text-[13px]">{totalTrophies}</span>
                </button>
                {trophyOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-[260px] rounded-xl border border-border
                                  bg-[#0a1520] shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <span className="font-bebas text-[13px] tracking-[2px] text-gold">Títulos</span>
                      <button onClick={() => setTrophyOpen(false)} className="text-[#4a6070] hover:text-white text-[11px]">✕</button>
                    </div>
                    <div className="max-h-[260px] overflow-y-auto">
                      {trophies.filter(t => t.years.length > 0).length === 0 ? (
                        <div className="px-4 py-6 text-[11px] text-[#3a5060] text-center">Nenhum título registrado</div>
                      ) : trophies.filter(t => t.years.length > 0).map(t => (
                        <div key={t.title} className="px-4 py-3 border-b border-border/50 last:border-0">
                          <div className="flex justify-between mb-[4px]">
                            <span className="text-[11px] text-white">{t.title}</span>
                            <span className="font-bebas text-[14px] text-gold">{t.years.length}×</span>
                          </div>
                          <div className="flex flex-wrap gap-[4px]">
                            {t.years.map(y => (
                              <span key={y} className="text-[9px] px-[5px] py-[2px] rounded
                                                        bg-surface2 border border-border text-[#6a8090]">
                                {y}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 border-b border-border bg-surface px-4 py-3">
            <div className="text-[11px] text-[#3a5060]">Selecione um clube na árvore</div>
          </div>
        )}

        {/* ── Barra de filtros inline ── */}
        <div className="flex-shrink-0 border-b border-border bg-surface/80 px-3 py-2 flex items-center gap-2 flex-wrap">

          {/* Nome */}
          <input value={filterName} onChange={e => setFilterName(e.target.value)}
            placeholder="Nome..."
            className="bg-surface2 border border-border rounded px-2 py-[4px] text-[11px]
                       text-white placeholder-[#3a5060] focus:outline-none focus:border-gold/40
                       w-[130px] transition-colors" />

          {/* Posição */}
          <select value={filterPos} onChange={e => setFilterPos(e.target.value as Pos | '')}
            className="bg-surface2 border border-border rounded px-2 py-[4px] text-[11px]
                       text-white focus:outline-none focus:border-gold/40 transition-colors">
            <option value="">Posição</option>
            {ALL_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Característica */}
          <select value={filterSpec} onChange={e => setFilterSpec(e.target.value as Spec | '')}
            className="bg-surface2 border border-border rounded px-2 py-[4px] text-[11px]
                       text-white focus:outline-none focus:border-gold/40 transition-colors">
            <option value="">Característica</option>
            {ALL_SPECS.map(s => <option key={s} value={s}>{SPEC_FULL[s]}</option>)}
          </select>

          {/* Força */}
          <div className="flex items-center gap-1 text-[10px] text-[#4a6070]">
            <span>F</span>
            <input type="number" min={1} max={99} value={filterForceMin}
              onChange={e => setFilterForceMin(Number(e.target.value))}
              className="w-[38px] bg-surface2 border border-border rounded px-1 py-[4px]
                         text-[11px] text-white text-center focus:outline-none focus:border-gold/40" />
            <span>–</span>
            <input type="number" min={1} max={99} value={filterForceMax}
              onChange={e => setFilterForceMax(Number(e.target.value))}
              className="w-[38px] bg-surface2 border border-border rounded px-1 py-[4px]
                         text-[11px] text-white text-center focus:outline-none focus:border-gold/40" />
          </div>

          {/* Separador */}
          <div className="w-px h-4 bg-border" />

          {/* Toggles */}
          <FilterChip active={filterAllClubs} onClick={() => setFilterAllClubs(v => !v)} label="🌐 Todos os clubes" />
          <FilterChip active={filterOnlySale} onClick={() => setFilterOnlySale(v => !v)} label="💰 À venda" color="green" />
          <FilterChip active={filterOnlyLoan} onClick={() => setFilterOnlyLoan(v => !v)} label="🔄 Empréstimo" color="blue" />

          {/* Reset */}
          {hasFilters && (
            <button onClick={resetFilters}
              className="ml-auto text-[10px] text-[#4a6070] hover:text-white transition-colors px-2 py-[4px]
                         rounded border border-border hover:border-[#2a3d52]">
              ✕ Limpar
            </button>
          )}
        </div>

        {/* ── Tabela ── */}
        {!selectedClub && !filterAllClubs ? (
          <div className="flex flex-1 items-center justify-center flex-col gap-3">
            <div className="text-[48px] opacity-20">🔁</div>
            <div className="font-bebas text-[18px] tracking-[3px] text-[#4a6070]">Mercado de Transferências</div>
            <div className="text-[12px] text-[#3a5060]">
              Selecione um clube ou ative "Todos os clubes" para buscar
            </div>
          </div>
        ) : !realClub && !filterAllClubs ? (
          <div className="flex flex-1 items-center justify-center flex-col gap-3">
            <div className="text-[40px] opacity-20">📋</div>
            <div className="text-[13px] text-[#3a5060]">Elenco não cadastrado para este clube.</div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="sticky top-0 bg-surface z-10">
                  <tr className="text-[9px] tracking-[2px] uppercase text-[#4a6070] border-b border-border">
                    <th className="py-[6px] pl-3 text-left w-6">P</th>
                    <th className="py-[6px] text-left w-6"></th>
                    <th className="py-[6px] text-left">Nome</th>
                    {filterAllClubs && <th className="py-[6px] text-left">Time</th>}
                    <th className="py-[6px] text-center w-6">L</th>
                    <th className="py-[6px] text-center w-8">F</th>
                    <th className="py-[6px] text-right pr-2">Salário</th>
                    <th className="py-[6px] text-right pr-2">Valor</th>
                    <th className="py-[6px] text-center">Car.</th>
                    <th className="py-[6px] text-center w-8">GP</th>
                    <th className="py-[6px] text-center w-8">A</th>
                    <th className="py-[6px] text-center w-8">Idade</th>
                    <th className="py-[6px] text-center w-6">V</th>
                    <th className="py-[6px] text-center w-6 pr-3">E</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(({ player: p, clubId, clubShort }, i) => {
                    const mv  = calcMarketValue(p)
                    const sal = calcSalary(p)
                    const sel = selectedPlayer?.name === p.name && selectedPlayer?.num === p.num
                    return (
                      <tr key={i} onClick={() => setSelectedPlayer(sel ? null : p)}
                        className={`border-b border-border/40 cursor-pointer transition-colors
                                    ${sel ? 'bg-gold/15' : 'hover:bg-surface2'}`}>
                        <td className={`py-[5px] pl-3 font-bold text-[10px] ${sel ? 'text-gold' : 'text-[#5a7080]'}`}>
                          {POS_LABEL[p.pos]}
                        </td>
                        <td className="py-[5px] text-center text-[12px]">{NAT_FLAG[p.nationality] ?? '🏳'}</td>
                        <td className={`py-[5px] ${sel ? 'text-white font-medium' : 'text-[#8090a0]'}`}>
                          {p.isStar && '⭐ '}{p.name}
                        </td>
                        {filterAllClubs && (
                          <td className="py-[5px] text-[#5a7080] text-[10px]">{clubShort}</td>
                        )}
                        <td className="py-[5px] text-center text-[10px] text-[#6a8090]">{p.foot}</td>
                        <td className={`py-[5px] text-center font-bebas text-[13px] ${sel ? 'text-gold' : 'text-white/80'}`}>
                          {p.forca}
                        </td>
                        <td className="py-[5px] text-right pr-2 font-mono text-[10px] text-[#8090a0]">
                          {fmtSalary(sal)}
                        </td>
                        <td className={`py-[5px] text-right pr-2 font-bebas text-[12px] ${sel ? 'text-gold' : 'text-gold/70'}`}>
                          {fmtValue(mv)}
                        </td>
                        <td className="py-[5px] text-center text-[10px] text-[#6a8090]">
                          {SPEC_LABEL[p.spec]}{p.spec2 ? `/${SPEC_LABEL[p.spec2]}` : ''}
                        </td>
                        <td className="py-[5px] text-center text-[#8090a0]">{p.gp ?? 0}</td>
                        <td className="py-[5px] text-center text-[#8090a0]">{p.assists ?? 0}</td>
                        <td className="py-[5px] text-center text-[#8090a0]">{p.age}</td>
                        <td className="py-[5px] text-center text-[10px]">
                          {isForSale(clubId, p.num)
                            ? <span className="text-glgreen font-bold">✓</span>
                            : <span className="text-[#3a5060]">—</span>}
                        </td>
                        <td className="py-[5px] text-center text-[10px] pr-3">
                          {isForLoan(clubId, p.num)
                            ? <span className="text-[#4090d0] font-bold">✓</span>
                            : <span className="text-[#3a5060]">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={15} className="py-12 text-center text-[12px] text-[#3a5060]">
                        Nenhum jogador encontrado com os filtros aplicados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé: contador + ações */}
            <div className="flex-shrink-0 border-t border-border bg-surface px-4 py-2 flex items-center justify-between gap-2 min-h-[44px]">
              <div className="text-[10px] text-[#4a6070]">
                {filteredRows.length} jogador{filteredRows.length !== 1 ? 'es' : ''}
                {hasFilters && <span className="text-gold/60"> · filtrado{filteredRows.length !== 1 ? 's' : ''}</span>}
              </div>

              {isOwnClub && !filterAllClubs ? (
                /* Meu clube — toggles de listagem */
                <div className="flex items-center gap-2">
                  <ToggleButton label="💰 À venda" activeColor="green"
                    active={selectedPlayer ? isForSale(selectedClubId!, selectedPlayer.num) : false}
                    enabled={!!selectedPlayer}
                    onClick={() => selectedPlayer && toggleSale(selectedClubId!, selectedPlayer.num)} />
                  <ToggleButton label="🔄 Empréstimo" activeColor="blue"
                    active={selectedPlayer ? isForLoan(selectedClubId!, selectedPlayer.num) : false}
                    enabled={!!selectedPlayer}
                    onClick={() => selectedPlayer && toggleLoan(selectedClubId!, selectedPlayer.num)} />
                </div>
              ) : (
                /* Clube alheio — ações de compra */
                <div className="flex items-center gap-2">
                  {transferMsg && (
                    <span className={`text-[10px] max-w-[240px] truncate font-medium ${transferMsg.ok ? 'text-glgreen' : 'text-glred'}`}>
                      {transferMsg.ok ? '✓' : '✗'} {transferMsg.text}
                    </span>
                  )}
                  {!transferMsg && selectedPlayer && !(loanEligibility?.allowed) && (
                    <span className="text-[10px] text-[#f0a020]/70 max-w-[200px] truncate">
                      🔄 {loanEligibility?.reason}
                    </span>
                  )}
                  {!transferMsg && selectedPlayer && !(buyEligibility?.allowed) && (
                    <span className="text-[10px] text-glred/70 max-w-[200px] truncate">
                      🚫 {buyEligibility?.reason}
                    </span>
                  )}
                  <ActionButton label="Empréstimo"
                    enabled={!!selectedPlayer && (loanEligibility?.allowed ?? false)}
                    tooltip={loanEligibility?.reason}
                    onClick={() => {
                      if (!selectedPlayer || !selectedClubId) return
                      const result = executeTransfer(selectedPlayer, selectedClubId, 'loan')
                      setTransferMsg({ ok: result.ok, text: result.msg })
                      if (result.ok) setSelectedPlayer(null)
                      setTimeout(() => setTransferMsg(null), 3000)
                    }} />
                  <ActionButton label="Fazer oferta" highlight
                    enabled={!!selectedPlayer && (buyEligibility?.allowed ?? false)}
                    tooltip={buyEligibility?.reason}
                    onClick={() => {
                      if (!selectedPlayer || !selectedClubId) return
                      const result = executeTransfer(selectedPlayer, selectedClubId, 'buy')
                      setTransferMsg({ ok: result.ok, text: result.msg })
                      if (result.ok) setSelectedPlayer(null)
                      setTimeout(() => setTransferMsg(null), 3000)
                    }} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Componentes auxiliares ────────────────────────────────

function FilterChip({ active, onClick, label, color }: {
  active: boolean; onClick: () => void; label: string; color?: 'green' | 'blue'
}) {
  const activeClass = color === 'green' ? 'border-glgreen/50 bg-glgreen/10 text-glgreen'
    : color === 'blue' ? 'border-[#4090d0]/50 bg-[#4090d0]/10 text-[#4090d0]'
    : 'border-gold/50 bg-gold/10 text-gold'
  return (
    <button onClick={onClick}
      className={`px-2 py-[4px] rounded text-[10px] border transition-all
                  ${active ? activeClass : 'border-border text-[#5a7070] hover:text-white hover:border-[#2a3d52]'}`}>
      {label}
    </button>
  )
}

function ToggleButton({ label, active, enabled, onClick, activeColor }: {
  label: string; active: boolean; enabled: boolean; onClick: () => void; activeColor: 'green' | 'blue'
}) {
  const activeClass = activeColor === 'green'
    ? 'border-glgreen bg-glgreen/15 text-glgreen'
    : 'border-[#4090d0] bg-[#4090d0]/15 text-[#4090d0]'
  return (
    <button onClick={onClick} disabled={!enabled}
      className={`px-4 py-[6px] rounded-lg font-bebas text-[12px] tracking-[1px] border transition-all
                  ${!enabled ? 'border-border/40 text-[#3a5060] cursor-not-allowed opacity-50'
                    : active ? activeClass
                    : 'border-border text-[#6a8090] hover:text-white hover:border-[#2a3d52]'}`}>
      {active ? '✓ ' : ''}{label}
    </button>
  )
}

function ActionButton({ label, enabled, tooltip, highlight, onClick }: {
  label: string; enabled: boolean; tooltip?: string; highlight?: boolean; onClick?: () => void
}) {
  return (
    <div className="relative group">
      <button disabled={!enabled} onClick={onClick}
        className={`px-4 py-[6px] rounded-lg font-bebas text-[12px] tracking-[1px] border transition-all
                    ${!enabled ? 'border-border/40 text-[#3a5060] cursor-not-allowed opacity-50'
                      : highlight ? 'border-gold bg-gold/10 text-gold hover:bg-gold hover:text-black'
                      : 'border-border text-[#6a8090] hover:text-white hover:border-[#2a3d52]'}`}>
        {label}
      </button>
      {!enabled && tooltip && (
        <div className="absolute bottom-full right-0 mb-2 w-[220px] px-3 py-2 rounded-lg
                        bg-[#0a1520] border border-border text-[10px] text-[#8090a0]
                        opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50 leading-relaxed">
          {tooltip}
        </div>
      )}
    </div>
  )
}

function ConfidenceBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-[#4a6070] w-[60px] text-right">{label}:</span>
      <div className="w-[80px] h-[6px] bg-surface2 rounded-full overflow-hidden border border-border">
        <div className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: value > 66 ? '#20c060' : value > 33 ? '#f0c040' : '#c03020',
          }} />
      </div>
    </div>
  )
}

function InfoLine({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <div className="text-[9px] text-[#4a6070]">{label}</div>
      <div className={`text-[11px] font-medium ${gold ? 'text-gold' : 'text-white'}`}>{value}</div>
    </div>
  )
}
