// ════════════════════════════════════════════════════════
//  GLfoot — Telas de Técnicos e Central de Emprego (F-01)
// ════════════════════════════════════════════════════════
import { useMatchStore }      from '@/stores/useMatchStore'
import { useCoachStore }      from '@/stores/useCoachStore'
import { useAuthStore }       from '@/stores/useAuthStore'
import { useConfidenceStore } from '@/stores/useConfidenceStore'
import { CLUB_STRENGTH, clubForce, forceLabel, FORCE_BANDS } from '@/data/clubStrength'
import { useLineupStore }     from '@/stores/useLineupStore'
import type { Player }        from '@/engines/types'
import { CLUBS_MAP }          from '@/data/clubs'
import { calcPlayerReputation } from '@/engines/coachEngine'
import { getContractGoal, calcInitialBudget } from '@/data/clubGoals'
import ClubCrest from '@/components/ClubCrest'

function Stars({ n }: { n: number }) {
  return (
    <span className="text-gold text-[12px] tracking-[1px]">
      {'★'.repeat(n)}<span className="text-[#3a4a5a]">{'★'.repeat(5 - n)}</span>
    </span>
  )
}

// Cor por faixa de força (média dos atletas) — não existe mais tier
function forceColor(force: number): string {
  if (force >= FORCE_BANDS.S) return 'text-gold border-gold/40 bg-gold/10'
  if (force >= FORCE_BANDS.A) return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5'
  if (force >= FORCE_BANDS.B) return 'text-[#5a9ac0] border-[#5a9ac0]/30 bg-[#5a9ac0]/5'
  return 'text-[#8a9aaa] border-border bg-surface2'
}

// ── Tela Técnicos: um técnico por clube + mercado + notícias ──────────────────
export function TecnicosScreen() {
  const coaches   = useCoachStore(s => s.coaches)
  const news      = useCoachStore(s => s.news)
  const myClubId  = useMatchStore(s => s.myClubId)
  const coachName = useMatchStore(s => s.coachName)
  const completedSeasons = useMatchStore(s => s.completedSeasons)
  const playerRep = calcPlayerReputation(completedSeasons)
  const freeAgents = coaches.filter(c => c.clubId === null)

  // Elenco vivo do meu clube: a força dele muda com transferências/lesões
  const mySlots = useLineupStore(s => s.slots)
  const myBench = useLineupStore(s => s.bench)
  const myRoster = [...mySlots.filter(Boolean) as Player[], ...myBench]

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Tabela de clubes */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="font-bebas text-[22px] tracking-[3px] text-gold mb-3">🎖 TÉCNICOS DA SÉRIE A</div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-[1px] text-[#4a6070] text-left">
              <th className="pb-2">Clube</th>
              <th className="pb-2">Força</th>
              <th className="pb-2">Técnico</th>
              <th className="pb-2">Reputação</th>
              <th className="pb-2 text-right">Idade</th>
            </tr>
          </thead>
          <tbody>
            {CLUB_STRENGTH.map(entry => {
              const isMe  = entry.id === myClubId
              const coach = coaches.find(c => c.clubId === entry.id)
              const club  = CLUBS_MAP[entry.id]
              return (
                <tr key={entry.id}
                    className={`border-t border-border/50 ${isMe ? 'bg-gold/5' : 'hover:bg-surface2'}`}>
                  <td className="py-[6px]">
                    <div className="flex items-center gap-2">
                      {club && <ClubCrest colors={club.crestColors} short={club.short} size={20} />}
                      <span className={`font-bold ${isMe ? 'text-gold' : 'text-white'}`}>{entry.name}</span>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      // O clube do jogador mostra a força VIVA (muda com transferências);
                      // os bots, a força do elenco do JSON.
                      const f = isMe ? clubForce(entry.id, myRoster) : clubForce(entry.id)
                      return (
                        <span className={`text-[9px] font-bold border rounded px-[5px] py-[1px] ${forceColor(f)}`}>
                          {f.toFixed(1)}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="text-white/85">
                    {isMe ? <>👤 {coachName || 'Você'} <span className="text-[9px] text-gold">(você)</span></>
                          : coach?.name ?? <span className="text-glred text-[10px]">sem técnico</span>}
                  </td>
                  <td>{isMe ? <Stars n={playerRep} /> : coach ? <Stars n={coach.reputation} /> : '—'}</td>
                  <td className="text-right text-[#6a8090]">{isMe ? '—' : coach?.age ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Painel lateral: mercado livre + notícias */}
      <div className="w-[250px] flex-shrink-0 border-l border-border overflow-y-auto px-4 py-4 bg-surface">
        <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mb-2">Mercado Livre · {freeAgents.length}</div>
        {freeAgents.map(c => (
          <div key={c.id} className="flex items-center justify-between py-[4px] border-b border-border/40">
            <span className="text-[11px] text-white/80 truncate">{c.name}</span>
            <Stars n={c.reputation} />
          </div>
        ))}
        {freeAgents.length === 0 && (
          <div className="text-[11px] text-[#4a6070]">Ninguém disponível.</div>
        )}

        <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mt-5 mb-2">Movimentações</div>
        {news.map((n, i) => (
          <div key={i} className="text-[10px] text-[#8a9aaa] leading-snug py-[3px] border-b border-border/30">
            <span className="text-gold font-bold">R{n.round}</span> {n.text}
          </div>
        ))}
        {news.length === 0 && (
          <div className="text-[11px] text-[#4a6070]">Nenhuma movimentação ainda.</div>
        )}
      </div>
    </div>
  )
}

// ── Central de Emprego: propostas para o jogador demitido (Premium) ───────────
export function CentralEmpregoScreen() {
  const isPremium  = useAuthStore(s => s.user?.plan === 'premium')
  const isFired    = useConfidenceStore(s => s.isFired)
  const offers     = useCoachStore(s => s.playerOffers)
  const freeAgents = useCoachStore(s => s.coaches).filter(c => c.clubId === null)
  const switchClub = useMatchStore(s => s.switchClub)
  const completedSeasons = useMatchStore(s => s.completedSeasons)
  const playerRep  = calcPlayerReputation(completedSeasons)

  if (!isPremium) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center px-8">
        <div className="text-[52px]">🔒</div>
        <div className="font-bebas text-[26px] tracking-[3px] text-gold">CENTRAL DE EMPREGO</div>
        <p className="text-[13px] text-[#8a9aaa] max-w-[380px] leading-relaxed">
          Receba propostas de outros clubes após uma demissão e continue sua carreira.
          Disponível no plano <span className="text-gold font-bold">Premium</span>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
      <div className="font-bebas text-[22px] tracking-[3px] text-gold mb-1">💼 CENTRAL DE EMPREGO</div>
      <div className="text-[11px] text-[#6a8090] mb-4">
        Sua reputação: <Stars n={playerRep} /> — clubes com força compatível com sua reputação podem te contratar.
      </div>

      {isFired && offers.length > 0 ? (
        <>
          <div className="text-[10px] tracking-[2px] uppercase text-glred mb-2">Propostas recebidas</div>
          <div className="flex gap-3 flex-wrap mb-6">
            {offers.map(clubId => {
              const entry = CLUB_STRENGTH.find(e => e.id === clubId)
              const club  = CLUBS_MAP[clubId]
              if (!entry || !club) return null
              const forca  = clubForce(clubId)
              const goal   = getContractGoal(forca)
              const budget = calcInitialBudget(forca)
              return (
                <div key={clubId}
                     className="w-[230px] bg-surface border border-border rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ClubCrest colors={club.crestColors} short={club.short} size={28} />
                    <div>
                      <div className="font-bebas text-[16px] tracking-[1px] text-white leading-none">{entry.name}</div>
                      <span className={`text-[9px] font-bold border rounded px-[4px] ${forceColor(forca)}`}>
                        {forceLabel(forca)} · {forca.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#8a9aaa] leading-snug">
                    🎯 {goal.label}<br />
                    💰 Orçamento: R$ {(budget / 1e6).toFixed(1)}M
                  </div>
                  <button
                    onClick={() => switchClub(clubId)}
                    className="mt-1 bg-gradient-to-br from-[#158040] to-[#20c060] rounded-lg py-[8px]
                               font-bebas text-[15px] tracking-[2px] text-black cursor-pointer
                               hover:scale-[1.03] transition-transform"
                  >
                    ✍ ASSINAR CONTRATO
                  </button>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="bg-surface border border-border rounded-xl px-5 py-4 mb-6 text-[12px] text-[#8a9aaa]">
          {isFired
            ? 'Nenhuma proposta no momento — sua reputação limita as opções.'
            : 'Você está empregado. Propostas aparecem aqui quando um clube te demite.'}
        </div>
      )}

      <div className="text-[10px] tracking-[2px] uppercase text-[#4a6070] mb-2">
        Técnicos no mercado livre · {freeAgents.length}
      </div>
      <table className="w-full max-w-[440px] text-[12px]">
        <tbody>
          {freeAgents.map(c => (
            <tr key={c.id} className="border-t border-border/50">
              <td className="py-[5px] text-white/85">{c.name}</td>
              <td><Stars n={c.reputation} /></td>
              <td className="text-[#6a8090] text-right">{c.age} anos</td>
              <td className="text-[#6a8090] text-right">{c.firedCount > 0 ? `${c.firedCount} demissão(ões)` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
