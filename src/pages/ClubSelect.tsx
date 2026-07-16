import { useState } from 'react'
import { CLUBS }          from '@/data/clubs'
import { useMatchStore }  from '@/stores/useMatchStore'
import { useAuthStore }   from '@/stores/useAuthStore'
import type { Club }      from '@/engines/types'
import ClubCrest          from '@/components/ClubCrest'
import { isAvailableOnFree, clubForce, forceLabel } from '@/data/clubStrength'
import { getContractGoal, calcInitialBudget } from '@/data/clubGoals'

const AVAILABLE_LEAGUES = [
  { id: 'brasil',   label: 'Brasil',      flag: '🇧🇷', clubs: 20, enabled: true  },
  { id: 'espanha',  label: 'Espanha',     flag: '🇪🇸', clubs: 20, enabled: false },
  { id: 'england',  label: 'Inglaterra',  flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', clubs: 20, enabled: false },
  { id: 'alemanha', label: 'Alemanha',    flag: '🇩🇪', clubs: 18, enabled: false },
]

const NATIONALITIES = [
  'Brasileiro', 'Argentino', 'Espanhol', 'Português', 'Italiano',
  'Alemão', 'Francês', 'Inglês', 'Uruguaio', 'Colombiano',
]

function byDivision(clubs: Club[]) {
  return {
    d1: clubs.filter(c => c.division === 1 || c.division == null),
    d2: clubs.filter(c => c.division === 2),
    d3: clubs.filter(c => c.division === 3),
  }
}

export default function ClubSelect() {
  const selectClub = useMatchStore(s => s.selectClub)
  const user       = useAuthStore(s => s.user)
  const logout     = useAuthStore(s => s.logout)
  const isPremium  = user?.plan === 'premium'

  // Ligas
  const [leagues, setLeagues] = useState<string[]>(['brasil'])

  // Técnico
  const [coachName, setCoachName]     = useState(user?.nickname ?? '')
  const [nationality, setNationality] = useState('Brasileiro')
  // Sem clube pré-selecionado: o técnico escolhe o time; a proposta de contrato
  // só aparece depois da escolha (nada de convite default do CLUBS[0]).
  const [selectedId, setSelectedId]   = useState<string>('')
  const [random, setRandom]           = useState(false)

  const { d1, d2, d3 } = byDivision(CLUBS)
  const selected = CLUBS.find(c => c.id === selectedId)
  const canStart = !!coachName.trim() && (random || !!selected)

  function toggleLeague(id: string) {
    setLeagues(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(l => l !== id) : prev
        : [...prev, id]
    )
  }

  // Um clube só é jogável se o usuário é premium ou o clube é liberado no free.
  // Centraliza o gating para valer em TODOS os caminhos (dropdown, aleatório, iniciar).
  const canUseClub = (id: string) => isPremium || isAvailableOnFree(id)

  function pickRandom() {
    // Sorteia apenas entre clubes permitidos pelo plano — não vaza clube premium no free
    const pool = CLUBS.filter(c => canUseClub(c.id))
    if (pool.length === 0) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    setSelectedId(pick.id)
  }

  function handleStart() {
    if (!coachName.trim()) return
    const pool = CLUBS.filter(c => canUseClub(c.id))
    const target = random
      ? pool[Math.floor(Math.random() * pool.length)]
      : selected
    // Revalida o gating antes de assumir o clube: bloqueia a seleção default (CLUBS[0])
    // ou o sorteio caírem num clube premium enquanto o usuário está no plano free
    if (!target || !canUseClub(target.id)) return
    selectClub(target.id, CLUBS, coachName.trim(), nationality)
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden"
         style={{ background: 'radial-gradient(ellipse at 30% 20%, #0a1f0a 0%, #060b12 70%)' }}>

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 pt-5 pb-3">
        <button
          onClick={logout}
          className="text-[11px] text-[#4a6070] hover:text-white/70 tracking-[1px] transition-colors"
        >
          ← Sair
        </button>
        <div className="text-center">
          <div className="font-bebas text-[32px] tracking-[8px] text-gold leading-none">GLfoot</div>
          <div className="text-[12px] text-white/50 font-medium mt-[1px]">Nova Carreira</div>
        </div>
        <div className="w-[48px]" />
      </header>

      {/* Corpo — duas colunas */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 gap-5 items-start">

          {/* ── COLUNA ESQUERDA: ligas + competições + contrato ── */}
          <div className="flex flex-col gap-4">

            <Panel title="Ligas Nacionais" action={<ChipInfo>afeta o mercado de transferências</ChipInfo>}>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[10px] tracking-[2px] uppercase text-[#5a7080] border-b border-border">
                    <th className="py-[5px] px-2 text-left w-[40px]">Jogar</th>
                    <th className="py-[5px] px-2 text-left">País</th>
                    <th className="py-[5px] px-2 text-right">Clubes</th>
                  </tr>
                </thead>
                <tbody>
                  {AVAILABLE_LEAGUES.map(lg => {
                    const active = leagues.includes(lg.id)
                    const locked = !lg.enabled
                    return (
                      <tr
                        key={lg.id}
                        onClick={() => !locked && toggleLeague(lg.id)}
                        className={`border-b border-border/50 transition-colors
                          ${locked ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.03]'}
                          ${active && !locked ? 'bg-gold/[0.06]' : ''}`}
                      >
                        <td className="px-2 py-[8px]">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center
                                           ${active && !locked ? 'bg-gold border-gold' : 'border-[#3a5060]'}`}>
                            {active && !locked && <span className="text-black text-[10px] font-bold leading-none">✓</span>}
                          </div>
                        </td>
                        <td className="px-2 py-[8px]">
                          <span className="mr-2 text-[14px]">{lg.flag}</span>
                          <span className={active && !locked ? 'text-white' : 'text-white/50'}>{lg.label}</span>
                          {locked && <span className="ml-2 text-[10px] text-[#3a5060] tracking-[1px]">em breve</span>}
                        </td>
                        <td className="px-2 py-[8px] text-right text-[#5a7080] font-bebas text-[14px]">{lg.clubs}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Panel>

            <Panel title="Competições Regionais">
              <p className="text-[11px] text-[#5a7080] mb-3">Fazem parte obrigatória do calendário.</p>
              <div className="flex flex-wrap gap-2">
                {['Copa do Nordeste', 'Copa Verde', 'Copa do Brasil', 'Recopa Gaúcha'].map(c => (
                  <span key={c} className="text-[11px] px-3 py-[4px] rounded-full border border-border
                                           text-white/50 bg-surface/40 tracking-[0.5px]">
                    ✓ {c}
                  </span>
                ))}
              </div>
            </Panel>

            {/* Proposta de Contrato — só aparece após escolher o clube */}
            {selected
              ? <ContractPanel club={selected} coachName={coachName} />
              : <ContractPlaceholder />}

          </div>

          {/* ── COLUNA DIREITA: técnico + clube ── */}
          <div className="flex flex-col gap-4">

            <Panel title="Seleção Nacional">
              <div className="flex items-center gap-3">
                <label className="text-[12px] text-[#8a9aaa] min-w-[150px]">Treinar seleção do país:</label>
                <select
                  disabled={!isPremium}
                  className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-[7px]
                             text-[13px] text-white outline-none focus:border-gold/60
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option>🇧🇷 Brasil</option>
                  <option>🇦🇷 Argentina</option>
                </select>
                {!isPremium && (
                  <span className="text-[10px] text-gold border border-gold/40 px-2 py-[3px] rounded-full tracking-[1px]">
                    PREMIUM
                  </span>
                )}
              </div>
            </Panel>

            <Panel title="Escolher Clube">
              <div className="flex flex-col gap-3">
                <DivisionSelect label="1ª divisão" clubs={d1} value={selectedId}
                  onChange={id => { setSelectedId(id); setRandom(false) }} isPremium={isPremium} />
                <DivisionSelect label="2ª divisão" clubs={d2} value={selectedId}
                  onChange={id => { setSelectedId(id); setRandom(false) }} isPremium={isPremium} />
                <DivisionSelect label="3ª divisão" clubs={d3} value={selectedId}
                  onChange={id => { setSelectedId(id); setRandom(false) }} isPremium={isPremium} />
                <div className="flex items-center gap-2 mt-1">
                  <input type="checkbox" id="random-check" checked={random}
                    onChange={e => { setRandom(e.target.checked); if (e.target.checked) pickRandom() }}
                    className="w-4 h-4 accent-gold cursor-pointer" />
                  <label htmlFor="random-check" className="text-[12px] text-[#8a9aaa] cursor-pointer select-none">
                    Escolher um time aleatório
                  </label>
                </div>
              </div>
            </Panel>

            <Panel title="Dados do Técnico">
              <div className="flex flex-col gap-3">
                <FormRow label="Nome:">
                  <input type="text" value={coachName} onChange={e => setCoachName(e.target.value)}
                    placeholder="Nome do técnico"
                    className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-[7px]
                               text-[13px] text-white placeholder-[#3a5060] outline-none focus:border-gold/60" />
                </FormRow>
                <FormRow label="Nacionalidade:">
                  <select value={nationality} onChange={e => setNationality(e.target.value)}
                    className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-[7px]
                               text-[13px] text-white outline-none focus:border-gold/60">
                    {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
                  </select>
                </FormRow>
              </div>
            </Panel>

            {/* Botão iniciar — exige nome do técnico E um clube (ou sorteio) */}
            <div className="flex flex-col items-end gap-1 pt-1">
              {coachName.trim() && !random && !selected && (
                <span className="text-[11px] text-[#5a7080]">Escolha um clube para começar.</span>
              )}
              <BtnPrimary onClick={handleStart} disabled={!canStart}>
                Iniciar Jogo →→
              </BtnPrimary>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Placeholder enquanto nenhum clube foi escolhido ───────────────────────────
function ContractPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/20 px-4 py-8 text-center">
      <div className="text-[30px] opacity-20 mb-2 select-none">📄</div>
      <div className="text-[12px] text-[#5a7080] leading-relaxed">
        Escolha um clube para ver a proposta de contrato
        <br />
        <span className="text-[#3a5060]">(meta, orçamento e confiança).</span>
      </div>
    </div>
  )
}

// ── Proposta de Contrato ──────────────────────────────────────────────────────
function ContractPanel({ club, coachName }: { club: Club; coachName: string }) {
  // Força do clube = média dos atletas (elenco + banco). É ela que define meta,
  // orçamento e rótulo — não existe mais tier.
  const forcaMedia = clubForce(club.id)
  const goal       = getContractGoal(forcaMedia)
  const budget     = calcInitialBudget(forcaMedia)
  const label      = forceLabel(forcaMedia)

  const LABEL_COLOR: Record<string, string> = {
    'Elite Nacional': '#f0c040',
    'Grande Clube':   '#80c0f0',
    'Clube Médio':    '#60c080',
    'Clube Pequeno':  '#a0a0c0',
  }
  const labelColor = LABEL_COLOR[label] ?? '#808080'

  const GOAL_ICON: Record<string, string> = {
    champion: '🏆', top4: '🎯', top8: '📈', no_relegation: '🛡', survive: '⚓',
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-surface/40 overflow-hidden">
      {/* Header do contrato */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gold/[0.07] border-b border-gold/20">
        <ClubCrest colors={club.crestColors} short={club.short} size={32} />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] tracking-[3px] uppercase text-gold/60">Proposta de Contrato</div>
          <div className="font-bebas text-[18px] tracking-[1px] text-white leading-tight truncate">
            {club.name}
          </div>
        </div>
        <div
          className="text-[9px] font-bold tracking-[1px] px-2 py-[3px] rounded-full border"
          style={{ color: labelColor, borderColor: labelColor + '50' }}
        >
          {label} · {forcaMedia.toFixed(1)}
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {/* Técnico contratado */}
        {coachName.trim() && (
          <div className="text-[12px] text-[#8a9aaa]">
            Contratando: <span className="text-white font-medium">{coachName.trim()}</span>
          </div>
        )}

        {/* Meta principal */}
        <div className="rounded-lg border border-border bg-surface2/60 px-3 py-3">
          <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mb-[6px]">Meta Contratual</div>
          <div className="flex items-center gap-2">
            <span className="text-[18px]">{GOAL_ICON[goal.primary]}</span>
            <span className="font-bebas text-[15px] tracking-[1px] text-white">{goal.label}</span>
          </div>
          <div className="flex items-center gap-2 mt-[6px] text-[#5a7080] text-[11px]">
            <span className="text-[13px]">⭐</span>
            <span>Bônus: {goal.secondaryLabel}</span>
          </div>
        </div>

        {/* Orçamento + confiança inicial */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-surface2/60 px-3 py-[10px]">
            <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mb-[3px]">Orçamento</div>
            <div className="font-bebas text-[16px] text-glgreen leading-none">
              R$ {(budget / 1_000_000).toFixed(1)}M
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface2/60 px-3 py-[10px]">
            <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mb-[3px]">Duração</div>
            <div className="font-bebas text-[16px] text-white leading-none">15 Temporadas</div>
          </div>
        </div>

        {/* Barras de confiança iniciais */}
        <div className="flex flex-col gap-[6px]">
          <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070]">Confiança Inicial</div>
          <ConfBar label="🏢 Diretoria" value={70} color="#80c0f0" />
          <ConfBar label="📣 Torcida"   value={65} color="#f06060" />
        </div>
      </div>
    </div>
  )
}

function ConfBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[#5a7080] w-[80px] shrink-0">{label}</span>
      <div className="flex-1 h-[6px] bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="font-bebas text-[12px] text-white/50 w-[26px] text-right">{value}</span>
    </div>
  )
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function Panel({ title, action, children }: {
  title: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-[8px] bg-surface/50 border-b border-border">
        <span className="font-bebas text-[13px] tracking-[3px] text-gold">{title}</span>
        {action}
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

function ChipInfo({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] tracking-[1px] text-[#4a6070] italic">{children}</span>
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-[12px] text-[#8a9aaa] min-w-[110px] text-right">{label}</label>
      {children}
    </div>
  )
}

function DivisionSelect({ label, clubs, value, onChange, isPremium }: {
  label: string; clubs: Club[]; value: string; onChange: (id: string) => void; isPremium: boolean
}) {
  const available = isPremium ? clubs : clubs.filter(c => isAvailableOnFree(c.id))
  const isActive  = available.some(c => c.id === value)

  if (clubs.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <label className="text-[12px] text-[#5a7080] min-w-[110px] text-right italic">{label}:</label>
        <span className="text-[12px] text-[#3a5060]">Nenhum clube cadastrado</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <label className={`text-[12px] min-w-[110px] text-right font-medium
                         ${isActive ? 'text-gold' : 'text-[#8a9aaa]'}`}>
        {label}:
      </label>
      <select
        value={isActive ? value : ''}
        onChange={e => onChange(e.target.value)}
        className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-[7px]
                   text-[13px] text-white outline-none focus:border-gold/60 cursor-pointer"
      >
        {!isActive && <option value="">— selecionar —</option>}
        {available.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        {available.length === 0 && <option disabled>Nenhum clube disponível no Free</option>}
      </select>
    </div>
  )
}

function BtnPrimary({ children, onClick, disabled }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="bg-gradient-to-br from-[#b8800a] to-gold rounded-lg px-6 py-[10px]
                 font-bebas text-[16px] tracking-[3px] text-black cursor-pointer
                 hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:cursor-not-allowed">
      {children}
    </button>
  )
}
