// ════════════════════════════════════════════════════════
//  GLfoot — Extrato Financeiro (#30 / #31)
//
//  A bilheteria já era somada e a folha já era descontada, mas o efeito era
//  INVISÍVEL: não havia onde ver de onde vinha nem para onde ia o dinheiro.
//  Esta tela é o extrato — receitas e despesas por rodada, com totais por
//  categoria e resultado da temporada.
// ════════════════════════════════════════════════════════
import { useState, useMemo } from 'react'
import { useFinanceStore, CAT_LABEL, type TransactionCategory } from '@/stores/useFinanceStore'
import { useMatchStore } from '@/stores/useMatchStore'

const fmtBRL = (v: number): string => {
  const abs = Math.abs(v)
  const sinal = v < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000)     return `${sinal}R$ ${Math.round(abs / 1000)} mil`
  return `${sinal}R$ ${Math.round(abs)}`
}

export default function FinanceView() {
  const budget       = useFinanceStore(s => s.budget)
  const transactions = useFinanceStore(s => s.transactions)
  const currentSeason = useMatchStore(s => s.season)
  const initialBudget = useMatchStore(s => s.initialBudget)

  const seasons = useMemo(
    () => [...new Set(transactions.map(t => t.season))].sort((a, b) => b - a),
    [transactions],
  )
  const [season, setSeason] = useState(currentSeason)
  const [catFilter, setCatFilter] = useState<TransactionCategory | ''>('')

  const rows = useMemo(
    () => transactions
      .filter(t => t.season === season)
      .filter(t => !catFilter || t.category === catFilter),
    [transactions, season, catFilter],
  )

  const totals = useMemo(() => {
    const tx = transactions.filter(t => t.season === season)
    const byCategory: Partial<Record<TransactionCategory, number>> = {}
    let income = 0, expense = 0
    for (const t of tx) {
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount
      if (t.type === 'income') income += t.amount
      else                     expense += t.amount
    }
    return { income, expense, result: income - expense, byCategory }
  }, [transactions, season])

  const maxCat = Math.max(1, ...Object.values(totals.byCategory) as number[])

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* ── Painel esquerdo: saldo + resumo ── */}
      <div className="w-[280px] flex-shrink-0 border-r border-border overflow-y-auto px-4 py-4 bg-surface">
        <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mb-1">Saldo atual</div>
        <div className={`font-bebas text-[30px] leading-none ${budget < 0 ? 'text-glred' : 'text-gold'}`}>
          {fmtBRL(budget)}
        </div>
        {budget < 0 && (
          <div className="text-[10px] text-glred mt-1">⚠ Clube endividado</div>
        )}
        <div className="text-[10px] text-[#4a6070] mt-1">
          Orçamento inicial: {fmtBRL(initialBudget)}
        </div>

        <div className="h-px bg-border my-4" />

        <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mb-2">
          Temporada {season}
        </div>
        <div className="flex flex-col gap-[6px] text-[12px]">
          <div className="flex justify-between">
            <span className="text-[#8a9aaa]">Receitas</span>
            <span className="text-glgreen font-bold">{fmtBRL(totals.income)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8a9aaa]">Despesas</span>
            <span className="text-glred font-bold">{fmtBRL(totals.expense)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-[6px]">
            <span className="text-white font-bold">Resultado</span>
            <span className={`font-bold ${totals.result >= 0 ? 'text-glgreen' : 'text-glred'}`}>
              {fmtBRL(totals.result)}
            </span>
          </div>
        </div>

        <div className="h-px bg-border my-4" />

        <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mb-2">Por categoria</div>
        {(Object.keys(totals.byCategory) as TransactionCategory[]).length === 0 && (
          <div className="text-[11px] text-[#4a6070]">Nada movimentado ainda.</div>
        )}
        {(Object.entries(totals.byCategory) as [TransactionCategory, number][])
          .sort((a, b) => b[1] - a[1])
          .map(([cat, val]) => {
            const isIncome = cat === 'bilheteria' || cat === 'premio'
            return (
              <div key={cat} className="mb-[7px]">
                <div className="flex justify-between text-[11px] mb-[2px]">
                  <span className="text-[#8a9aaa]">
                    {CAT_LABEL[cat].icon} {CAT_LABEL[cat].label}
                  </span>
                  <span className={isIncome ? 'text-glgreen' : 'text-glred'}>{fmtBRL(val)}</span>
                </div>
                <div className="h-[3px] bg-surface2 rounded overflow-hidden">
                  <div
                    className={`h-full ${isIncome ? 'bg-glgreen' : 'bg-glred'}`}
                    style={{ width: `${(val / maxCat) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
      </div>

      {/* ── Extrato ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-5 pt-4 pb-2">
          <div className="font-bebas text-[22px] tracking-[3px] text-gold mb-2">💰 EXTRATO FINANCEIRO</div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Seletor de temporada */}
            {seasons.length > 1 && (
              <select
                value={season}
                onChange={e => setSeason(Number(e.target.value))}
                className="bg-surface2 border border-[#243444] rounded text-[11px] text-white px-2 py-[3px]"
              >
                {seasons.map(s => <option key={s} value={s}>Temporada {s}</option>)}
              </select>
            )}

            {/* Chips de categoria */}
            <button
              onClick={() => setCatFilter('')}
              className={`text-[10px] font-bold border rounded px-[7px] py-[3px] transition-colors ${
                catFilter === ''
                  ? 'bg-gold border-gold text-black'
                  : 'bg-surface2 border-[#243444] text-gray-400 hover:border-gold hover:text-gold'}`}
            >
              Tudo
            </button>
            {(Object.keys(totals.byCategory) as TransactionCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(catFilter === cat ? '' : cat)}
                className={`text-[10px] font-bold border rounded px-[7px] py-[3px] transition-colors ${
                  catFilter === cat
                    ? 'bg-gold border-gold text-black'
                    : 'bg-surface2 border-[#243444] text-gray-400 hover:border-gold hover:text-gold'}`}
              >
                {CAT_LABEL[cat].icon} {CAT_LABEL[cat].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {rows.length === 0 ? (
            <div className="text-[12px] text-[#4a6070] py-6 text-center">
              Nenhuma movimentação nesta temporada
              {catFilter && ' com este filtro'}.
            </div>
          ) : (
            <table className="w-full text-[12px]">
              <thead className="sticky top-0 bg-bg">
                <tr className="text-[9px] uppercase tracking-[1px] text-[#4a6070] text-left">
                  <th className="pb-2 w-[52px]">Rodada</th>
                  <th className="pb-2 w-[130px]">Categoria</th>
                  <th className="pb-2">Descrição</th>
                  <th className="pb-2 text-right w-[110px]">Valor</th>
                  <th className="pb-2 text-right w-[110px]">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(t => (
                  <tr key={t.id} className="border-t border-border/50 hover:bg-surface2">
                    <td className="py-[6px] text-[#6a8090]">R{t.round}</td>
                    <td className="text-[#8a9aaa]">
                      {CAT_LABEL[t.category].icon} {CAT_LABEL[t.category].label}
                    </td>
                    <td className="text-white/80 truncate max-w-[300px]">{t.description}</td>
                    <td className={`text-right font-bold ${t.type === 'income' ? 'text-glgreen' : 'text-glred'}`}>
                      {t.type === 'income' ? '+' : '−'}{fmtBRL(t.amount)}
                    </td>
                    <td className={`text-right ${t.balance < 0 ? 'text-glred' : 'text-[#6a8090]'}`}>
                      {fmtBRL(t.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
