// ════════════════════════════════════════════════════════
//  GLfoot — StadiumView
//  Gerenciamento do estádio: bilheteria e expansão.
// ════════════════════════════════════════════════════════
import { useState } from 'react'
import { useMatchStore }   from '@/stores/useMatchStore'
import { useFinanceStore, CAT_LABEL } from '@/stores/useFinanceStore'
import { useStadiumStore } from '@/stores/useStadiumStore'
import { CLUBS } from '@/data/clubs'
import {
  STADIUMS, CLUB_STADIUM,
  calcTicketRevenue,
  getNextExpansion,
  stadiumPhotoUrl,
  type MatchImportance,
} from '@/data/stadiums'

// ── Componente principal ─────────────────────────────────
export default function StadiumView() {
  const myClubId = useMatchStore(s => s.myClubId)
  const myClub   = CLUBS.find(c => c.id === myClubId) ?? CLUBS[0]

  const stadiumId = CLUB_STADIUM[myClub.id]
  const stadium   = STADIUMS[stadiumId]

  // ── Stores persistidos ───────────────────────────────
  const budget          = useFinanceStore(s => s.budget)
  const addExpense      = useFinanceStore(s => s.addExpense)

  const stadiumStore    = useStadiumStore()
  const currentCapacity = stadiumStore.getCapacity(stadiumId)
  const tierPrices      = stadiumStore.getTierPrices(stadiumId)
  const completedStagesArr = stadiumStore.completedStages[stadiumId] ?? []
  const completedStages    = new Set(completedStagesArr)
  const inProgress         = stadiumStore.inProgress[stadiumId] ?? null

  // ── Estado local (UI only) ───────────────────────────
  const [photoError, setPhotoError] = useState(false)
  const [tab,        setTab]        = useState<'bilheteria' | 'expansao'>('bilheteria')
  const [importance, setImportance] = useState<MatchImportance>('normal')
  const [matchSeed,  setMatchSeed]  = useState(1)

  if (!stadium) {
    return (
      <div className="flex flex-1 items-center justify-center text-[#3a5060] text-[13px]">
        Estádio não cadastrado para este clube.
      </div>
    )
  }

  const revenue      = calcTicketRevenue(stadiumId, importance, currentCapacity, tierPrices, matchSeed)
  const nextStage    = getNextExpansion(stadiumId, currentCapacity)
  const expansionPct = Math.round(((currentCapacity - stadium.capacity) / stadium.capacity) * 100)
  const maxReached   = currentCapacity >= stadium.maxCapacity
  const canAfford    = nextStage ? budget >= nextStage.cost : false

  const round  = useMatchStore(s => s.round)
  const season = useMatchStore(s => s.season)

  function handleStartExpansion() {
    if (!nextStage || !canAfford || inProgress) return
    addExpense(
      nextStage.cost,
      'expansao',
      `Etapa ${nextStage.stage} — ${stadium.name}`,
      round,
      season,
    )
    stadiumStore.startExpansion(stadiumId, nextStage.stage, nextStage.weeks)
  }

  function handleCompleteExpansion() {
    if (!inProgress || !nextStage) return
    stadiumStore.completeExpansion(stadiumId, inProgress.stage, nextStage.addedSeats)
  }

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── PAINEL ESQUERDO ── */}
      <div className="w-[280px] flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-surface">

        {/* Cabeçalho do estádio */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-[6px]">Seu Estádio</div>
          <div className="font-bebas text-[17px] tracking-[2px] text-white leading-tight">
            {stadium.name}
          </div>
          <div className="text-[11px] text-[#5a7080] mt-[2px]">
            {stadium.city} · {stadium.state} · {stadium.yearBuilt}
          </div>
        </div>

        {/* Foto do estádio */}
        <div className="relative border-b border-border overflow-hidden" style={{ height: 140 }}>
          {stadium.photo && !photoError ? (
            <img
              src={stadiumPhotoUrl(stadium.photo, 560)}
              alt={stadium.name}
              onError={() => setPhotoError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-surface2">
              <span className="text-[64px] opacity-20 select-none">🏟</span>
            </div>
          )}
          {/* gradiente inferior para suavizar a transição */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
        </div>

        {/* Capacidade */}
        <div className="px-4 py-4 border-b border-border flex flex-col gap-3">
          <StatRow label="Capacidade atual">
            <span className="font-bebas text-[18px] text-gold">
              {currentCapacity.toLocaleString('pt-BR')}
            </span>
          </StatRow>
          <StatRow label="Capacidade máxima">
            <span className="font-bebas text-[15px] text-white/60">
              {stadium.maxCapacity.toLocaleString('pt-BR')}
            </span>
          </StatRow>

          {/* Barra de progresso capacidade */}
          <div>
            <div className="flex justify-between text-[9px] text-[#4a6070] mb-[4px]">
              <span>Expansão atual</span>
              <span>{expansionPct}% / 25%</span>
            </div>
            <div className="h-[6px] bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(expansionPct / 25) * 100}%`,
                  background: maxReached ? '#f0c040' : '#20c060',
                }}
              />
            </div>
          </div>

          {stadium.coClubs && stadium.coClubs.length > 0 && (
            <StatRow label="Divide com">
              <span className="text-[11px] text-[#5a7080]">
                {stadium.coClubs.join(', ').toUpperCase()}
              </span>
            </StatRow>
          )}

          {stadium.expansions.length === 0 && (
            <div className="text-[10px] text-[#3a5060] italic">
              Estádio público — expansão não disponível
            </div>
          )}
        </div>

        {/* Orçamento disponível */}
        <div className="px-4 py-3 border-b border-border">
          <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mb-[4px]">
            Orçamento disponível
          </div>
          <div className="font-bebas text-[20px] text-glgreen">
            R$ {budget.toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Últimas transações */}
        <FinanceLedger />
      </div>

      {/* ── PAINEL DIREITO ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          {(['bilheteria', 'expansao'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-[10px] font-bebas text-[14px] tracking-[2px] border-b-2 transition-all
                          ${tab === t
                            ? 'border-gold text-gold'
                            : 'border-transparent text-[#4a6070] hover:text-white'}`}
            >
              {t === 'bilheteria' ? '🎟 Bilheteria' : '🏗 Expansão'}
            </button>
          ))}
        </div>

        {/* ── TAB BILHETERIA ── */}
        {tab === 'bilheteria' && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

            {/* Seletor de importância */}
            <div>
              <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070] mb-3">
                Tipo de Jogo
              </div>
              <div className="flex gap-2">
                {([
                  { id: 'normal',   label: 'Normal',   mult: '×1.0', occ: '65%' },
                  { id: 'classico', label: 'Clássico', mult: '×1.3', occ: '90%' },
                  { id: 'final',    label: 'Final',    mult: '×1.8', occ: '100%'},
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setImportance(opt.id)}
                    className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1 transition-all
                                ${importance === opt.id
                                  ? 'border-gold bg-gold/10'
                                  : 'border-border bg-surface hover:border-[#2a3d52]'}`}
                  >
                    <span className={`font-bebas text-[15px] tracking-[1px]
                                      ${importance === opt.id ? 'text-gold' : 'text-white/70'}`}>
                      {opt.label}
                    </span>
                    <span className={`text-[12px] ${importance === opt.id ? 'text-gold/70' : 'text-[#4a6070]'}`}>
                      {opt.mult} · {opt.occ} cheio
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resultado da bilheteria */}
            <Panel title="Previsão de Renda">
              {/* Público estimado */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div>
                  <div className="text-[10px] text-[#4a6070] tracking-[2px] uppercase">Público estimado</div>
                  <div className="font-bebas text-[28px] text-white leading-none mt-[2px]">
                    {revenue.attendance.toLocaleString('pt-BR')}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-[10px] text-[#4a6070] tracking-[2px] uppercase">Renda total</div>
                    <div className="font-bebas text-[28px] text-gold leading-none mt-[2px]">
                      R$ {(revenue.revenue / 1000).toFixed(0)}k
                    </div>
                  </div>
                  <button
                    onClick={() => setMatchSeed(s => s + 1)}
                    className="text-[9px] tracking-[1px] uppercase px-3 py-[4px] rounded-lg
                               border border-border text-[#4a6070] hover:text-white hover:border-[#2a3d52]
                               transition-all"
                  >
                    ↻ Jogo #{matchSeed}
                  </button>
                </div>
              </div>

              {/* Breakdown por categoria */}
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[9px] tracking-[2px] uppercase text-[#4a6070] border-b border-border">
                    <th className="py-[5px] text-left">Categoria</th>
                    <th className="py-[5px] text-right">Assentos</th>
                    <th className="py-[5px] text-right">Preço</th>
                    <th className="py-[5px] text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.breakdown.map(b => (
                    <tr key={b.tier} className="border-b border-border/50">
                      <td className="py-[7px]">
                        <TierBadge name={b.tier} />
                      </td>
                      <td className="py-[7px] text-right text-white/70 font-mono text-[11px]">
                        {b.seats.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-[7px] text-right text-white/70 font-mono text-[11px]">
                        R$ {b.price}
                      </td>
                      <td className="py-[7px] text-right text-gold font-bebas text-[14px]">
                        R$ {(b.subtotal / 1000).toFixed(0)}k
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 text-[10px] text-[#5a7080] uppercase tracking-[1px]">
                      Total
                    </td>
                    <td className="pt-3 text-right font-bebas text-[16px] text-gold">
                      R$ {(revenue.revenue / 1_000_000).toFixed(2)}M
                    </td>
                  </tr>
                </tfoot>
              </table>
            </Panel>

            {/* Preços ajustáveis com slider */}
            <Panel title="Preços Base (arraste para ajustar)">
              <div className="flex flex-col gap-5">
                {stadium.tiers.map(t => {
                  const cfg = SLIDER_CONFIG[t.name] ?? { min: 20, max: 500, step: 10 }
                  const val = tierPrices[t.name] ?? t.price
                  const pct = ((val - cfg.min) / (cfg.max - cfg.min)) * 100

                  return (
                    <div key={t.name}>
                      <div className="flex items-center justify-between mb-[8px]">
                        <div className="flex items-center gap-2">
                          <TierBadge name={t.name} />
                          <span className="text-[10px] text-[#5a7080]">
                            {Math.round(t.ratio * 100)}% do estádio
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bebas text-[18px] text-white leading-none">
                            R$ {val}
                          </span>
                          <button
                            onClick={() => stadiumStore.resetTierPrice(stadiumId, t.name)}
                            title="Restaurar preço padrão"
                            className="text-[9px] text-[#3a5060] hover:text-gold transition-colors"
                          >
                            ↺
                          </button>
                        </div>
                      </div>

                      {/* Slider */}
                      <div className="relative h-[6px] rounded-full bg-surface2">
                        {/* Faixa colorida */}
                        <div
                          className="absolute left-0 top-0 h-full rounded-full pointer-events-none"
                          style={{
                            width: `${pct}%`,
                            background: TIER_COLORS[t.name]?.text ?? '#4a6070',
                            opacity: 0.7,
                          }}
                        />
                        <input
                          type="range"
                          min={cfg.min}
                          max={cfg.max}
                          step={cfg.step}
                          value={val}
                          onChange={e => stadiumStore.setTierPrice(stadiumId, t.name, Number(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                          style={{ margin: 0 }}
                        />
                        {/* Thumb visível */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full border-2 pointer-events-none"
                          style={{
                            left: `calc(${pct}% - 7px)`,
                            background: '#0d1520',
                            borderColor: TIER_COLORS[t.name]?.text ?? '#4a6070',
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] text-[#3a5060] mt-[5px]">
                        <span>R$ {cfg.min}</span>
                        <span className="text-[#3a5060]">padrão R$ {t.price}</span>
                        <span>R$ {cfg.max}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>
          </div>
        )}

        {/* ── TAB EXPANSÃO ── */}
        {tab === 'expansao' && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

            {stadium.expansions.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-12">
                <div className="text-[56px] opacity-20">🏛</div>
                <div className="font-bebas text-[20px] tracking-[3px] text-[#4a6070]">
                  Estádio Público
                </div>
                <p className="text-[12px] text-[#3a5060] max-w-[300px]">
                  Este estádio é propriedade pública e não pode ser expandido pelo clube.
                </p>
              </div>
            ) : (
              <>
                {/* Resumo de capacidade */}
                <Panel title="Progresso de Expansão">
                  <div className="flex justify-between text-[12px] mb-3">
                    <span className="text-[#5a7080]">Capacidade atual</span>
                    <span className="font-bebas text-[15px] text-white">
                      {currentCapacity.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="relative h-[10px] bg-surface2 rounded-full overflow-hidden mb-2">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${((currentCapacity - stadium.capacity) / (stadium.maxCapacity - stadium.capacity)) * 100}%`,
                        background: 'linear-gradient(90deg, #158040, #20c060)',
                      }}
                    />
                    {/* marcadores de etapa */}
                    {[1/3, 2/3].map((frac, i) => (
                      <div key={i}
                        className="absolute top-0 bottom-0 w-[2px] bg-border"
                        style={{ left: `${frac * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-[#3a5060]">
                    <span>{stadium.capacity.toLocaleString('pt-BR')} (original)</span>
                    <span>{stadium.maxCapacity.toLocaleString('pt-BR')} (máximo)</span>
                  </div>
                </Panel>

                {/* Cards de etapas */}
                <div className="text-[9px] tracking-[3px] uppercase text-[#4a6070]">Etapas</div>
                {stadium.expansions.map(stage => {
                  const done      = completedStages.has(stage.stage)
                  const active    = inProgress?.stage === stage.stage
                  const isNext    = !done && !active && nextStage?.stage === stage.stage

                  return (
                    <div key={stage.stage}
                      className={`rounded-xl border p-4 transition-all
                                  ${done    ? 'border-glgreen/40 bg-glgreen/5'
                                  : active  ? 'border-gold/60 bg-gold/5'
                                  : isNext  ? 'border-border bg-surface'
                                  :           'border-border/40 bg-surface/50 opacity-60'}`}
                    >
                      {/* Header da etapa */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center
                                           font-bebas text-[13px]
                                           ${done   ? 'bg-glgreen text-black'
                                           : active ? 'bg-gold text-black'
                                           :          'bg-surface2 text-[#4a6070]'}`}>
                            {done ? '✓' : stage.stage}
                          </div>
                          <span className={`font-bebas text-[15px] tracking-[1px]
                                            ${done ? 'text-glgreen' : active ? 'text-gold' : 'text-white/70'}`}>
                            Etapa {stage.stage}
                          </span>
                          {done   && <StatusChip color="green">Concluída</StatusChip>}
                          {active && <StatusChip color="gold">Em obra · {inProgress?.weeksLeft}sem</StatusChip>}
                        </div>
                        <div className="text-right">
                          <div className="font-bebas text-[18px] text-white">
                            +{stage.addedSeats.toLocaleString('pt-BR')}
                          </div>
                          <div className="text-[10px] text-[#4a6070]">assentos</div>
                        </div>
                      </div>

                      {/* Breakdown por categoria */}
                      <div className="flex gap-2 mb-3">
                        {stage.tierBreakdown.map(tb => (
                          <div key={tb.name}
                            className="flex-1 px-2 py-[6px] rounded-lg bg-surface2 border border-border/60 text-center">
                            <TierBadge name={tb.name} small />
                            <div className="font-bebas text-[13px] text-white mt-[3px]">
                              +{tb.addedSeats.toLocaleString('pt-BR')}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Custo e prazo */}
                      <div className="flex items-center justify-between text-[12px] mb-3">
                        <div className="flex gap-4">
                          <div>
                            <div className="text-[9px] text-[#4a6070] tracking-[1px]">Custo</div>
                            <div className={`font-bebas text-[15px]
                                            ${isNext && !canAfford ? 'text-glred' : 'text-white'}`}>
                              R$ {(stage.cost / 1_000_000).toFixed(1)}M
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] text-[#4a6070] tracking-[1px]">Prazo</div>
                            <div className="font-bebas text-[15px] text-white">
                              {stage.weeks} semanas
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        {isNext && !inProgress && (
                          <button
                            onClick={handleStartExpansion}
                            disabled={!canAfford}
                            className={`px-4 py-[7px] rounded-lg font-bebas text-[13px] tracking-[1px]
                                        border transition-all
                                        ${canAfford
                                          ? 'border-gold bg-gold/10 text-gold hover:bg-gold hover:text-black'
                                          : 'border-border text-[#3a5060] cursor-not-allowed'}`}
                          >
                            {canAfford ? '🏗 Iniciar Obra' : '💸 Saldo insuficiente'}
                          </button>
                        )}
                        {active && (
                          <button
                            onClick={handleCompleteExpansion}
                            className="px-4 py-[7px] rounded-lg font-bebas text-[13px] tracking-[1px]
                                       border border-glgreen/40 bg-glgreen/10 text-glgreen
                                       hover:bg-glgreen hover:text-black transition-all"
                          >
                            ✓ Concluir (simulação)
                          </button>
                        )}
                      </div>

                      {isNext && !canAfford && (
                        <div className="text-[10px] text-glred/70 mt-1">
                          Faltam R$ {((stage.cost - budget) / 1_000_000).toFixed(1)}M para iniciar esta etapa.
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Mini extrato financeiro (painel esquerdo) ────────────
function FinanceLedger() {
  const transactions = useFinanceStore(s => s.transactions)
  const last = transactions.slice(0, 6)

  if (last.length === 0) {
    return (
      <div className="px-4 py-3 text-[10px] text-[#3a5060] italic">
        Nenhuma transação ainda.
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-4 pt-3 pb-[5px]">
        <span className="text-[9px] tracking-[2px] uppercase text-[#4a6070]">Últimas Transações</span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {last.map(tx => (
          <div key={tx.id} className="flex items-start gap-2 py-[5px] border-b border-border/40">
            <span className="text-[13px] mt-[1px]">{CAT_LABEL[tx.category]?.icon ?? '💰'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/70 truncate leading-tight">{tx.description}</div>
              <div className="text-[9px] text-[#4a6070]">R{tx.round} · T{tx.season}</div>
            </div>
            <span className={`text-[11px] font-bebas shrink-0 ${tx.type === 'income' ? 'text-glgreen' : 'text-glred'}`}>
              {tx.type === 'income' ? '+' : '-'}R${(tx.amount / 1000).toFixed(0)}k
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Configuração dos sliders por categoria ───────────────
const SLIDER_CONFIG: Record<string, { min: number; max: number; step: number }> = {
  'Popular':  { min: 20,  max: 200,  step: 5  },
  'Cadeira':  { min: 40,  max: 400,  step: 10 },
  'Camarote': { min: 100, max: 1000, step: 25 },
}

// ── Componentes auxiliares ────────────────────────────────

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="px-4 py-[8px] bg-surface/80 border-b border-border">
        <span className="font-bebas text-[12px] tracking-[3px] text-gold">{title}</span>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  )
}

function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#5a7080]">{label}</span>
      {children}
    </div>
  )
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Popular':  { bg: '#0a1f0a', text: '#40b040', border: '#1a3a1a' },
  'Cadeira':  { bg: '#0a1a2a', text: '#4090d0', border: '#1a2a4a' },
  'Camarote': { bg: '#2a1a00', text: '#f0c040', border: '#4a3000' },
}

function TierBadge({ name, small }: { name: string; small?: boolean }) {
  const c = TIER_COLORS[name] ?? { bg: '#1a1a2a', text: '#8090a0', border: '#2a3040' }
  return (
    <span
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
      className={`inline-block rounded-full border font-bold tracking-[1px]
                  ${small ? 'px-[6px] py-[2px] text-[9px]' : 'px-[8px] py-[3px] text-[10px]'}`}
    >
      {name}
    </span>
  )
}

function StatusChip({ children, color }: { children: React.ReactNode; color: 'green' | 'gold' }) {
  return (
    <span className={`text-[9px] px-2 py-[2px] rounded-full border tracking-[1px] font-bold
                      ${color === 'green'
                        ? 'border-glgreen/40 text-glgreen bg-glgreen/10'
                        : 'border-gold/40 text-gold bg-gold/10'}`}>
      {children}
    </span>
  )
}
