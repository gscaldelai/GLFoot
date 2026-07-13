import { useEffect, useRef, useState, type ReactNode } from 'react'
import CalendarView    from '@/pages/CalendarView'
import Standings       from '@/components/Standings'
import StadiumView     from '@/pages/StadiumView'
import TransferMarket  from '@/pages/TransferMarket'
import { useMatchStore }       from '@/stores/useMatchStore'
import { useLineupStore }      from '@/stores/useLineupStore'
import { useConfidenceStore }  from '@/stores/useConfidenceStore'
import { useCoachStore }       from '@/stores/useCoachStore'
import { useAuthStore }        from '@/stores/useAuthStore'
import { TecnicosScreen, CentralEmpregoScreen } from '@/pages/CoachesView'
import { CLUBS, CLUBS_MAP } from '@/data/clubs'
import { getNextFixture }   from '@/engines/fixtureEngine'
import {
  type FormationKey,
  FORMATION_LABELS,
  FORMATION_DESC,
  getFormationBonus,
  pickBotFormation,
} from '@/data/formations'
import { VerticalField }  from '@/pages/LineupEditor'
import { withBotFatigue, effectiveForca } from '@/engines/fatigueEngine'
import Shirt              from '@/components/Shirt'
import type { Club, Player } from '@/engines/types'
import type { StandingRow }  from '@/stores/useMatchStore'

// ── Telas disponíveis ─────────────────────────────────────────────────────────
type NavScreen =
  | 'painel' | 'jogos'    | 'tabelas' | 'estadios'
  | 'mercado' | 'tecnicos'| 'historia' | 'emprego'

interface NavItem {
  id:        NavScreen
  icon:      string
  label:     string
  shortcut?: string
}

const NAV_GROUPS: Array<{ items: NavItem[] }> = [
  {
    items: [
      { id: 'painel',   icon: '🏠', label: 'Painel da Equipe'   },
      { id: 'jogos',    icon: '⚽', label: 'Jogos do Time',     shortcut: 'F4' },
      { id: 'estadios', icon: '🏟', label: 'Estádios',          shortcut: 'F6' },
    ],
  },
  {
    items: [
      { id: 'tabelas',  icon: '📊', label: 'Tabelas',           shortcut: 'F5' },
      { id: 'mercado',  icon: '💸', label: 'Mercado',           shortcut: 'F8' },
    ],
  },
  {
    items: [
      { id: 'tecnicos', icon: '🎖', label: 'Técnicos'           },
      { id: 'historia', icon: '📖', label: 'História'           },
      { id: 'emprego',  icon: '💼', label: 'Central de Emprego' },
    ],
  },
]

const SHORTCUT_MAP: Record<string, NavScreen> = {
  F4: 'jogos', F5: 'tabelas', F6: 'estadios', F8: 'mercado',
}

// ── Modal de Demissão ────────────────────────────────────────────────────────
function FiredModal({ onViewOffers }: { onViewOffers: () => void }) {
  const firedBy   = useConfidenceStore(s => s.firedBy)
  const goToHub   = useMatchStore(s => s.goToHub)
  const coachName = useMatchStore(s => s.coachName)
  const isPremium = useAuthStore(s => s.user?.plan === 'premium')
  // "Sair" leva de volta à seleção de clube
  const setScreen = () => useMatchStore.setState({ screen: 'select' })

  function handleViewOffers() {
    const s = useMatchStore.getState()
    useCoachStore.getState().generateOffers(s.completedSeasons, s.myClubId)
    onViewOffers()
  }

  if (!firedBy) return null

  const MSG: Record<string, { title: string; body: string; icon: string }> = {
    diretoria: {
      icon:  '🏢',
      title: 'Demitido pela Diretoria',
      body:  'Após análise dos resultados financeiros e do desempenho da equipe, a diretoria optou por encerrar seu vínculo com o clube.',
    },
    torcida: {
      icon:  '📣',
      title: 'Pressão Irresistível da Torcida',
      body:  'A torcida perdeu a paciência. A pressão nas redes sociais e nos estádios tornou sua permanência insustentável.',
    },
    pressao_combinada: {
      icon:  '💥',
      title: 'Saiu pela Porta dos Fundos',
      body:  'Sem apoio da diretoria e sem a confiança da torcida, não havia mais espaço para continuar.',
    },
  }

  const msg = MSG[firedBy] ?? MSG['pressao_combinada']

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="bg-surface border border-glred/40 rounded-2xl max-w-[400px] w-full mx-4 overflow-hidden
                      shadow-[0_0_80px_rgba(240,60,60,0.2)]">
        {/* Header vermelho */}
        <div className="bg-glred/10 border-b border-glred/30 px-6 py-5 flex items-center gap-3">
          <span className="text-[40px]">{msg.icon}</span>
          <div>
            <div className="font-bebas text-[22px] tracking-[2px] text-glred leading-none">{msg.title}</div>
            <div className="text-[11px] text-[#8a9aaa] mt-[2px]">{coachName || 'Técnico'}</div>
          </div>
        </div>
        {/* Corpo */}
        <div className="px-6 py-5">
          <p className="text-[13px] text-white/70 leading-relaxed mb-5">{msg.body}</p>
          {isPremium && (
            <button
              onClick={handleViewOffers}
              className="w-full mb-3 py-[10px] rounded-lg bg-gradient-to-br from-[#158040] to-[#20c060]
                         font-bebas text-[15px] tracking-[2px] text-black
                         hover:scale-[1.02] transition-transform"
            >
              💼 VER PROPOSTAS DE OUTROS CLUBES
            </button>
          )}
          <div className="flex gap-3">
            <button
              onClick={goToHub}
              className="flex-1 py-[8px] rounded-lg border border-border text-[13px] text-[#5a7080]
                         hover:text-white hover:border-[#2a3d52] transition-all font-bebas tracking-[1px]"
            >
              Continuar (debug)
            </button>
            <button
              onClick={setScreen}
              className="flex-1 py-[8px] rounded-lg bg-glred/20 border border-glred/40
                         font-bebas text-[13px] tracking-[1px] text-glred
                         hover:bg-glred hover:text-white transition-all"
            >
              Nova Carreira
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function ManagerHub() {
  const myClubId = useMatchStore(s => s.myClubId)
  const round    = useMatchStore(s => s.round)
  const fixtures = useMatchStore(s => s.fixtures)
  const myClub   = CLUBS.find(c => c.id === myClubId) ?? CLUBS[0]

  // Próximo adversário via fixture real; fallback para primeiro clube diferente
  const nextFix   = myClubId ? getNextFixture(fixtures, myClubId, round) : undefined
  const nextOppId = nextFix
    ? (nextFix.homeId === myClubId ? nextFix.awayId : nextFix.homeId)
    : undefined
  const opp = (nextOppId ? CLUBS_MAP[nextOppId] : undefined)
    ?? CLUBS.find(c => c.id !== myClubId)
    ?? CLUBS[1]
  const init     = useLineupStore(s => s.init)
  const initialized = useRef(false)
  const isFired  = useConfidenceStore(s => s.isFired)
  const [screen, setScreen] = useState<NavScreen>('painel')
  const [firedDismissed, setFiredDismissed] = useState(false)

  // Reabre o modal em nova demissão
  useEffect(() => { if (!isFired) setFiredDismissed(false) }, [isFired])

  // Inicializa lineup store apenas uma vez
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (useLineupStore.getState().slots.filter(Boolean).length === 0) {
      init([...myClub.squad, ...myClub.bench])
    }
    // Backfill: carreiras criadas antes do coach store ganham técnicos NPC (F-01)
    if (useCoachStore.getState().coaches.length === 0) {
      useCoachStore.getState().initCareer(myClub.id)
    }
  }, [init, myClub])

  // Atalhos de teclado globais
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = SHORTCUT_MAP[e.key]
      if (target) { e.preventDefault(); setScreen(target) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-row flex-1 overflow-hidden">
      {isFired && !firedDismissed && (
        <FiredModal onViewOffers={() => { setFiredDismissed(true); setScreen('emprego') }} />
      )}
      <IconSidebar active={screen} onNav={setScreen} myClub={myClub} />
      <main className="flex flex-1 overflow-hidden">
        {screen === 'painel'   && <PainelEquipe myClub={myClub} opp={opp} />}
        {screen === 'jogos'    && <CalendarView />}
        {screen === 'estadios' && <StadiumView />}
        {screen === 'mercado'  && <TransferMarket />}
        {screen === 'tabelas'  && <StandingsScreen />}
        {screen === 'tecnicos' && <TecnicosScreen />}
        {screen === 'emprego'  && <CentralEmpregoScreen />}
        {(screen === 'historia') && <PlaceholderScreen screen={screen} />}
      </main>
    </div>
  )
}

// ── Sidebar de ícones (48px) ──────────────────────────────────────────────────
function IconSidebar({
  active, onNav, myClub,
}: { active: NavScreen; onNav: (s: NavScreen) => void; myClub: Club }) {
  const season = useMatchStore(s => s.season)
  const round  = useMatchStore(s => s.round)

  return (
    <aside className="w-[48px] flex-shrink-0 bg-surface border-r border-border
                       flex flex-col items-center overflow-hidden">
      {/* Logo */}
      <div className="w-full flex items-center justify-center py-[10px] border-b border-border">
        <span className="font-bebas text-[14px] tracking-[2px] text-gold leading-none">GL</span>
      </div>

      {/* Clube + rodada */}
      <div className="w-full flex flex-col items-center py-[8px] border-b border-border gap-[3px]">
        <Shirt colors={myClub.colors} size={26} />
        <span className="font-bebas text-[9px] text-[#4a6070] leading-none tracking-wide">
          {round}/{38}
        </span>
      </div>


      {/* Nav grupos */}
      <nav className="flex-1 w-full flex flex-col overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="h-[1px] bg-border mx-[8px] my-[4px]" />}
            {group.items.map(item => (
              <NavIcon
                key={item.id}
                item={item}
                active={active === item.id}
                onClick={() => onNav(item.id)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Temporada */}
      <div className="w-full flex items-center justify-center py-[8px] border-t border-border">
        <span className="font-bebas text-[9px] text-[#3a5060] leading-none tracking-wide">
          T{season}
        </span>
      </div>
    </aside>
  )
}

// ── Ícone de navegação com tooltip ───────────────────────────────────────────
function NavIcon({
  item, active, onClick,
}: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <div className="group relative w-full">
      <button
        onClick={onClick}
        title={item.label}
        className={`w-full h-[44px] flex items-center justify-center text-[18px]
                    transition-all duration-150 border-r-2
                    ${active
                      ? 'bg-gold/15 border-r-gold'
                      : 'border-r-transparent text-[#4a6070] hover:text-white hover:bg-surface2'}`}
      >
        {item.icon}
      </button>

      {/* Tooltip → aparece à direita */}
      <div className="pointer-events-none absolute left-[52px] top-1/2 -translate-y-1/2 z-50
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150
                      bg-surface2 border border-border rounded-lg px-3 py-[6px]
                      whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,.6)]">
        <div className="text-[12px] font-bold text-white leading-tight">{item.label}</div>
        {item.shortcut && (
          <div className="text-[10px] text-[#4a6070] mt-[2px] font-mono">{item.shortcut}</div>
        )}
      </div>
    </div>
  )
}

// ── Tela placeholder para features em desenvolvimento ─────────────────────────
const PLACEHOLDER_INFO: Record<NavScreen, { icon: string; label: string; desc: string }> = {
  painel:   { icon: '🏠', label: 'Painel da Equipe',   desc: '' },
  jogos:    { icon: '⚽', label: 'Jogos do Time',      desc: 'Calendário completo da temporada — partidas passadas e futuras da sua equipe.' },
  tabelas:  { icon: '📊', label: 'Tabelas',            desc: 'Classificação por pontos, saldo de gols e chaveamento (Mata-Mata) das Copas.' },
  estadios: { icon: '🏟', label: 'Estádios',           desc: 'Gerencie a capacidade do seu estádio, calcule a renda da bilheteria e expanda sua arena.' },
  mercado:  { icon: '💸', label: 'Mercado',            desc: 'Navegue pelos elencos, busque jogadores e gerencie transferências e empréstimos.' },
  tecnicos: { icon: '🎖', label: 'Técnicos',           desc: 'Ranking global de treinadores com pontuação por títulos conquistados.' },
  historia: { icon: '📖', label: 'História',           desc: 'Almanaque das temporadas — campeões, evolução do ranking e conquistas.' },
  emprego:  { icon: '💼', label: 'Central de Emprego', desc: 'Clubes sem técnico, propostas recebidas e opção de pedir demissão.' },
}

function StandingsScreen() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden p-4">
      <div className="font-bebas text-[15px] tracking-[3px] text-[#6a8090] mb-3">TABELA · BRASILEIRÃO</div>
      <div className="flex-1 overflow-auto">
        <Standings />
      </div>
    </div>
  )
}

function PlaceholderScreen({ screen }: { screen: NavScreen }) {
  const info = PLACEHOLDER_INFO[screen]
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center px-8">
      <div className="text-[72px] opacity-20 select-none">{info.icon}</div>
      <div className="font-bebas text-[28px] tracking-[5px] text-[#4a6070]">
        {info.label}
      </div>
      <p className="text-[14px] text-[#3a5060] max-w-[380px] leading-relaxed">
        {info.desc}
      </p>
      <div className="px-4 py-[6px] rounded-full border border-[#1e2d3d]
                      text-[10px] text-[#3a5060] tracking-[3px] uppercase mt-1">
        Em desenvolvimento
      </div>
    </div>
  )
}

// ── Banner de situação contratual ─────────────────────────────────────────────
function ContractBanner() {
  const contractGoal = useMatchStore(s => s.contractGoal)
  const diretoria    = useConfidenceStore(s => s.diretoria)
  const torcida      = useConfidenceStore(s => s.torcida)
  const dirLevel     = useConfidenceStore(s => s.dirLevel)
  const torLevel     = useConfidenceStore(s => s.torLevel)

  if (!contractGoal) return null

  const GOAL_ICON: Record<string, string> = {
    champion: '🏆', top4: '🎯', top8: '📈', no_relegation: '🛡', survive: '⚓',
  }

  const LEVEL_COLOR: Record<string, string> = {
    normal: '#60c080', alerta: '#f0c040', critico: '#f06060',
  }

  const highestAlert = dirLevel() === 'critico' || torLevel() === 'critico'
    ? 'critico' : dirLevel() === 'alerta' || torLevel() === 'alerta' ? 'alerta' : 'normal'

  return (
    <div className={`flex items-center gap-4 px-4 py-[8px] border-b border-border/60 shrink-0
                     ${highestAlert === 'critico' ? 'bg-glred/5' : highestAlert === 'alerta' ? 'bg-gold/5' : 'bg-transparent'}`}>
      {/* Meta */}
      <div className="flex items-center gap-[6px] min-w-0">
        <span className="text-[13px]">{GOAL_ICON[contractGoal.primary]}</span>
        <span className="text-[11px] text-white/60 truncate">{contractGoal.label}</span>
      </div>

      <div className="flex-1" />

      {/* Medidores inline */}
      <div className="flex items-center gap-3 shrink-0">
        {([
          { icon: '🏢', value: diretoria, level: dirLevel(), label: 'Diretoria' },
          { icon: '📣', value: torcida,   level: torLevel(), label: 'Torcida'   },
        ] as const).map(m => (
          <div key={m.label} className="flex items-center gap-[6px]" title={`${m.label}: ${m.value}/100`}>
            <span className="text-[11px]">{m.icon}</span>
            <div className="w-[60px] h-[5px] bg-surface2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${m.level === 'critico' ? 'animate-pulse' : ''}`}
                style={{ width: `${m.value}%`, background: LEVEL_COLOR[m.level] }}
              />
            </div>
            <span className={`font-bebas text-[12px] leading-none ${
              m.level === 'critico' ? 'text-glred' : m.level === 'alerta' ? 'text-gold' : 'text-white/40'
            }`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Painel da Equipe (layout principal) ───────────────────────────────────────
function NextMatchCard() {
  const myClubId = useMatchStore(s => s.myClubId)
  const round    = useMatchStore(s => s.round)
  const fixtures = useMatchStore(s => s.fixtures)
  // Hook precisa vir ANTES do early return (regra dos hooks — senão o React
  // desmonta a árvore inteira quando o fixture da rodada não existe)
  const myFormation = useLineupStore(s => s.formation)

  const nextFix = myClubId ? getNextFixture(fixtures, myClubId, round) : undefined
  if (!nextFix) return null

  const oppId   = nextFix.homeId === myClubId ? nextFix.awayId : nextFix.homeId
  const oppClub = CLUBS_MAP[oppId]
  const isHome  = nextFix.homeId === myClubId
  const oppName = oppClub?.name ?? oppId

  // Força média do adversário via elenco real
  const oppAvg  = oppClub
    ? Math.round([...oppClub.squad].reduce((s, p) => s + p.forca, 0) / oppClub.squad.length * 10) / 10
    : '?'

  // Formação do adversário (determinística por clubId + round)
  const seed         = oppId.split('').reduce((s, c) => s + c.charCodeAt(0), 0) + nextFix.round
  const oppFormation = pickBotFormation(seed)

  // Bônus tático da minha formação contra a formação do adversário
  const tacBonus     = getFormationBonus(myFormation, oppFormation)
  const tacAdvantage = tacBonus > 0 ? 'win' : getFormationBonus(oppFormation, myFormation) > 0 ? 'lose' : 'neutral'

  return (
    <div className="mx-4 mt-3 mb-1 px-3 py-2 rounded-xl border border-[#1e3a50]
                    bg-[#0a1e2e] flex items-center gap-3">
      <div className="text-[9px] tracking-[2px] uppercase text-[#4a6a80] shrink-0">
        Rodada {nextFix.round}
      </div>
      <div className={`text-[9px] px-[6px] py-[2px] rounded font-bold
                       ${isHome ? 'bg-glgreen/20 text-glgreen' : 'bg-[#2a2030] text-[#8060a0]'}`}>
        {isHome ? '⌂ CASA' : '✈ FORA'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-white/90 truncate">{oppName}</div>
        <div className="flex items-center gap-2 mt-[2px]">
          <span className="text-[10px] text-[#4a6070]">F: <span className="text-gold">{oppAvg}</span></span>
          <span className="text-[10px] text-[#3a5060]">·</span>
          <span className="text-[10px] text-[#4a6070]">
            Joga: <span className="text-white/70 font-bold">{FORMATION_LABELS[oppFormation]}</span>
          </span>
          {tacAdvantage === 'win' && (
            <span className="text-[9px] text-emerald-400 font-bold">⚡ vantagem</span>
          )}
          {tacAdvantage === 'lose' && (
            <span className="text-[9px] text-red-400 font-bold">⚠ desvantagem</span>
          )}
        </div>
      </div>
      {oppClub && (
        <div className="shrink-0 w-6 h-6 rounded-full border border-border overflow-hidden">
          <div className="w-full h-full" style={{ background: oppClub.colors[0] }} />
        </div>
      )}
    </div>
  )
}

function PainelEquipe({ myClub, opp }: { myClub: Club; opp: Club }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ContractBanner />
      <NextMatchCard />
      <div className="flex flex-1 overflow-hidden">
        <SquadPanel colors={myClub.colors} />
        <EscalacaoPanel myClub={myClub} opp={opp} />
      </div>
    </div>
  )
}

// ── Painel Elenco (esquerda) ──────────────────────────────────────────────────
function SquadPanel({ colors }: { colors: [string, string, string] }) {
  const slots     = useLineupStore(s => s.slots)
  const bench     = useLineupStore(s => s.bench)
  const selected  = useLineupStore(s => s.selected)
  const dragSrc   = useLineupStore(s => s.dragSrc)
  const tapPlayer = useLineupStore(s => s.tapPlayer)
  const setDrag   = useLineupStore(s => s.setDragSrc)
  const dropOn    = useLineupStore(s => s.dropOn)

  const starters = slots
    .map((p, i) => ({ player: p!, slotIdx: i }))
    .filter(({ player }) => player != null)

  return (
    <div className="w-[224px] flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-surface">
      <div className="px-3 pt-3 pb-[6px] border-b border-border">
        <div className="font-bebas text-[15px] tracking-[3px] text-[#6a8090]">
          ELENCO · {starters.length + bench.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        <SectionLabel>TITULARES — {starters.length}</SectionLabel>
        {starters.map(({ player, slotIdx }) => (
          <PlayerRow
            key={`s-${slotIdx}`}
            player={player}
            colors={colors}
            isStarter
            isSelected={selected?.source === 'field' && selected.idx === slotIdx}
            isDragging={dragSrc?.source === 'field'  && dragSrc.idx  === slotIdx}
            onClick={()    => tapPlayer({ source: 'field', idx: slotIdx })}
            onDragStart={() => setDrag({ source: 'field', idx: slotIdx })}
            onDragEnd={()  => setDrag(null)}
            onDrop={()     => dropOn({ source: 'field', idx: slotIdx })}
          />
        ))}

        <SectionLabel className="mt-[8px]">BANCO — {bench.length}</SectionLabel>
        {bench.map((player, i) => (
          <PlayerRow
            key={`b-${i}`}
            player={player}
            colors={colors}
            isStarter={false}
            isSelected={selected?.source === 'bench' && selected.idx === i}
            isDragging={dragSrc?.source === 'bench'  && dragSrc.idx  === i}
            onClick={()    => tapPlayer({ source: 'bench', idx: i })}
            onDragStart={() => setDrag({ source: 'bench', idx: i })}
            onDragEnd={()  => setDrag(null)}
            onDrop={()     => dropOn({ source: 'bench', idx: i })}
          />
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[8px] tracking-[2px] uppercase text-[#4a6070] px-1 py-[3px] mb-[3px] ${className}`}>
      {children}
    </div>
  )
}

// ── Linha de jogador no elenco ────────────────────────────────────────────────
interface PlayerRowProps {
  player:      Player
  colors:      [string, string, string]
  isStarter:   boolean
  isSelected:  boolean
  isDragging:  boolean
  onClick:     () => void
  onDragStart: () => void
  onDragEnd:   () => void
  onDrop:      () => void
}

function PlayerRow({
  player, colors, isStarter, isSelected, isDragging,
  onClick, onDragStart, onDragEnd, onDrop,
}: PlayerRowProps) {
  const [bg, stripe, detail] = colors
  const stamina  = Math.round((1 - player.fatigue) * 100)
  const barColor = stamina >= 70 ? '#20c060' : stamina >= 40 ? '#f0c040' : '#d42020'

  return (
    <div
      className={`flex items-center gap-[5px] px-[5px] py-[4px] rounded-lg mb-[2px] cursor-pointer
                  border transition-all duration-150 select-none
                  ${isDragging ? 'opacity-40' : ''}
                  ${player.injured ? 'opacity-60' : ''}
                  ${isSelected
                    ? 'border-gold bg-gold/10'
                    : 'border-transparent hover:border-border hover:bg-surface2'}`}
      title={player.injured ? `Lesionado — ${player.injuryLabel ?? ''} (${player.injuryRoundsLeft} rodada${(player.injuryRoundsLeft ?? 0) > 1 ? 's' : ''})` : undefined}
      onClick={onClick}
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
      onDragEnd={onDragEnd}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDrop() }}
    >
      {/* Indicador titular/banco */}
      <div className={`w-[3px] h-[26px] rounded-full flex-shrink-0
                       ${player.injured ? 'bg-glred' : isStarter ? 'bg-glgreen' : 'bg-[#3a5060]'}`} />

      {/* Mini disco com força no canto inferior direito */}
      <div className="relative w-[34px] h-[34px] rounded-full border border-white/20 overflow-visible
                       flex items-start justify-center bg-[#f0f0f0] flex-shrink-0">
        <div className={`absolute inset-0 rounded-full overflow-hidden ${player.injured ? 'grayscale' : ''}`}>
          <span className="font-anton text-[9px] text-[#111] absolute top-[3px] left-0 right-0 text-center z-10 leading-none">
            {player.num}
          </span>
          <div className="absolute bottom-0 left-0 right-0 h-[60%] overflow-hidden">
            <div className="absolute inset-0" style={{ background: bg }} />
            <div className="absolute left-0 right-0" style={{ top: '30%', height: '28%', background: stripe }} />
            <div className="absolute bottom-0 left-0 right-0" style={{ height: '20%', background: detail || bg }} />
          </div>
        </div>
        {player.injured && (
          <span className="absolute z-30 text-[11px] leading-none" style={{ top: -3, left: -4 }}>🚑</span>
        )}
        <span className="font-bebas text-[9px] text-gold leading-none absolute z-20
                         bg-black/80 rounded px-[2px] py-[1px]"
              style={{ bottom: -2, right: -4 }}>
          {effectiveForca(player)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-white truncate leading-none">{player.name}</div>
        <div className="flex items-center gap-[3px] mt-[2px]">
          <span className="text-[8px] text-[#6a8090] w-[22px] flex-shrink-0">{player.posLabel}</span>
          {player.injured ? (
            <span className="text-[8px] font-bold text-glred flex-shrink-0">
              🚑 {player.injuryRoundsLeft}r
            </span>
          ) : (
            <div className="flex-1 h-[2px] bg-border rounded overflow-hidden">
              <div className="h-full rounded transition-all duration-500"
                   style={{ width: `${stamina}%`, background: barColor }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Painel Escalação (direita) ────────────────────────────────────────────────
function EscalacaoPanel({ myClub, opp }: { myClub: Club; opp: Club }) {
  const prepMatch = useMatchStore(s => s.prepareMatch)
  const goToMatch = useMatchStore(s => s.goToMatch)
  const formation = useLineupStore(s => s.formation)
  const slots     = useLineupStore(s => s.slots)

  // Lesionado não pode ser escalado (G-02)
  const injuredStarters = slots.filter((p): p is Player => !!p?.injured)

  function handleJogar() {
    if (useLineupStore.getState().slots.some(p => p?.injured)) return
    const lineup   = useLineupStore.getState().getLineupForMatch()
    const benchAll = useLineupStore.getState().bench
    const round    = useMatchStore.getState().round
    const isHome   = round % 2 === 1
    const oppTired = {
      ...opp,
      squad: withBotFatigue(opp.squad, round),
      bench: withBotFatigue(opp.bench, round),
    }
    const home = isHome ? { ...myClub, squad: lineup, bench: benchAll } : oppTired
    const away = isHome ? oppTired : { ...myClub, squad: lineup, bench: benchAll }
    prepMatch(home, away)
    goToMatch()
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto px-4 py-3 gap-3 min-w-0">
      <div>
        <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-[6px]">FORMAÇÃO</div>
        <FormationPickerRow />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bebas text-[18px] tracking-widest text-gold">{myClub.short}</span>
          <span className="text-[#4a6070] text-sm">·</span>
          <span className="font-bebas text-[18px] tracking-widest text-white/70">{formation}</span>
        </div>
        <VerticalField colors={myClub.colors} />
        {injuredStarters.length > 0 && (
          <div className="text-[11px] font-bold text-glred text-center leading-snug">
            🚑 {injuredStarters.map(p => p.name).join(', ')} lesionado{injuredStarters.length > 1 ? 's' : ''} —
            substitua antes de jogar
          </div>
        )}
        <button
          onClick={handleJogar}
          disabled={injuredStarters.length > 0}
          className={`w-full max-w-[320px] border-none rounded-lg py-[10px] font-bebas text-[18px]
                      tracking-[2px] transition-all duration-200
                      ${injuredStarters.length > 0
                        ? 'bg-surface2 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-br from-[#158040] to-[#20c060] text-black cursor-pointer hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(32,192,96,.5)]'}`}
        >
          ▶ JOGAR COM ESTA ESCALAÇÃO
        </button>
      </div>

      <MiniStandings />
    </div>
  )
}

// ── Seletor de formação (todas as formações + info tática) ──────────────────
const ALL_FORMATIONS: FormationKey[] = [
  '4-4-2', '4-3-3', '4-2-3-1', '4-1-4-1',
  '4-5-1', '4-1-4-1', '4-3-2-1', '4-1-3-2', '4-1-2-1-2',
  '3-5-2', '5-4-1', '5-3-2',
  '3-4-3', '3-2-4-1', '4-2-4',
  '3-2-5', '2-3-2-3',
]
// Deduplica preservando ordem
const FORMATION_LIST: FormationKey[] = ALL_FORMATIONS.filter((f, i, a) => a.indexOf(f) === i)

function FormationPickerRow() {
  const formation    = useLineupStore(s => s.formation)
  const setFormation = useLineupStore(s => s.setFormation)

  // Formações que a formação atual vence
  const beats: FormationKey[] = FORMATION_LIST.filter(
    opp => opp !== formation && getFormationBonus(formation, opp) > 0,
  )
  // Formações que vencem a atual
  const losesTo: FormationKey[] = FORMATION_LIST.filter(
    opp => opp !== formation && getFormationBonus(opp, formation) > 0,
  )

  return (
    <div className="flex flex-col gap-2">
      {/* Grade de formações */}
      <div className="flex gap-[4px] flex-wrap">
        {FORMATION_LIST.map(f => {
          const active   = formation === f
          const isBeaten = !active && getFormationBonus(f, formation) > 0   // esse f bate minha formação
          const iWin     = !active && getFormationBonus(formation, f) > 0   // eu bato esse f
          return (
            <button
              key={f}
              onClick={() => setFormation(f)}
              title={FORMATION_DESC[f]}
              className={`px-2 py-[4px] rounded font-bebas text-[13px] tracking-[1px]
                          border transition-all duration-150
                          ${active
                            ? 'border-gold text-gold bg-gold/10'
                            : iWin
                            ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15'
                            : isBeaten
                            ? 'border-red-500/40 text-red-400 bg-red-500/5 hover:bg-red-500/10'
                            : 'border-border text-[#6a8090] bg-surface hover:border-[#2a3d52] hover:text-white'}`}
            >
              {FORMATION_LABELS[f]}
            </button>
          )
        })}
      </div>

      {/* Descrição + vantagens da formação ativa */}
      {formation && (
        <div className="text-[11px] text-[#4a6a80] leading-relaxed">
          <span className="text-[#7a9aaa]">{FORMATION_DESC[formation]}</span>
          {beats.length > 0 && (
            <span className="ml-2 text-emerald-400/80">
              ▲ Forte contra: {beats.map(f => FORMATION_LABELS[f]).join(', ')}
            </span>
          )}
          {losesTo.length > 0 && (
            <span className="ml-2 text-red-400/70">
              ▼ Fraco contra: {losesTo.map(f => FORMATION_LABELS[f]).join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Prévia da classificação (±2 posições) ─────────────────────────────────────
function MiniStandings() {
  const standings = useMatchStore(s => s.standings) as StandingRow[]
  const myClubId  = useMatchStore(s => s.myClubId)
  if (!standings.length || !myClubId) return null
  const myIdx = standings.findIndex(r => r.id === myClubId)
  if (myIdx === -1) return null
  const start = Math.max(0, myIdx - 2)
  const slice = standings.slice(start, Math.min(standings.length, start + 5))

  return (
    <div className="bg-surface border border-border rounded-xl p-3 max-w-[320px]">
      <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-[8px]">CLASSIFICAÇÃO</div>
      <div className="flex flex-col gap-[2px]">
        {slice.map((row, i) => {
          const pos  = start + i + 1
          const isMe = row.id === myClubId
          return (
            <div key={row.id}
              className={`flex items-center gap-[8px] px-2 py-[5px] rounded text-[12px]
                          ${isMe ? 'bg-gold/10 border border-gold/30' : 'border border-transparent'}`}
            >
              <span className={`w-4 text-right font-bold text-[11px]
                                ${isMe ? 'text-gold' : 'text-[#4a6070]'}`}>{pos}</span>
              <span className={`flex-1 font-bold ${isMe ? 'text-gold' : 'text-white/70'}`}>
                {row.short}
              </span>
              <span className={`font-bebas text-[14px] ${isMe ? 'text-gold' : 'text-white/50'}`}>
                {row.pts}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
