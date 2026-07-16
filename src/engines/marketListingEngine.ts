// ════════════════════════════════════════════════════════
//  GLfoot — Market Listing Engine
//
//  Decide QUAIS jogadores cada clube bot coloca à venda / por empréstimo.
//  Sem isto o Mercado fica vazio a carreira inteira: o único conteúdo era um
//  seed demo do Palmeiras, apagado pelo clearAll do selectClub (R-07), e nada
//  jamais listava jogador de bot.
//
//  Engine PURO: sem imports de store, testável em Node
//  (scripts/test-market-listings.js). Não toca em nenhuma fórmula de engine.
//
//  Seleção por RANK (top-N), nunca por limiar de score. Isso torna o
//  "nunca vazio" uma INVARIANTE ESTRUTURAL: todo clube tem 16 atletas, logo
//  sempre há elegíveis para preencher as vagas — não é sorte estatística.
// ════════════════════════════════════════════════════════
import type { Player } from './types'

export interface ListingEntry {
  forSale: boolean
  forLoan: boolean
  since:   number   // rodada em que entrou na lista (rotatividade)
  season:  number
}

export interface ClubLike {
  id:     string
  squad:  Player[]   // 11 titulares
  bench:  Player[]   // reservas
}

// ── Quantos cada clube lista ─────────────────────────────
export const CAPS = { sale: 3, loan: 2 }

// Rodadas até uma listagem virar candidata a expirar
export const LISTING_MAX_AGE = 3

const VETO = -500

export interface PlayerCtx {
  avg:     number    // força média do elenco (16)
  gkCount: number    // goleiros no elenco
  isBench: boolean
}

// ── Pesos (calibráveis num lugar só) ─────────────────────
export const WEIGHTS = {
  sale: {
    bench:        30,
    age32:        25,
    age34:        15,
    belowLevelMax: 30,   // teto do bônus por estar abaixo do nível do clube
    aboveLevel:   12,    // clube fatura em cima do craque
    shortContract: 20,
    starter:      -18,
  },
  loan: {
    young22:      35,
    young20:      10,
    upsideMult:    4,    // (potencial - forca) * mult
    bench:        20,
    old30:       -40,
    starter:     -15,
  },
}

/** Veto duro: quem NUNCA pode ser listado, em nenhuma hipótese. */
function vetoed(p: Player, ctx: PlayerCtx): boolean {
  if (p.isStar) return true                        // estrela da temporada não vai a mercado
  if (p.pos === 'GK' && ctx.gkCount <= 1) return true  // não vende o único goleiro
  return false
}

export function saleScore(p: Player, ctx: PlayerCtx): number {
  if (vetoed(p, ctx)) return VETO
  const W = WEIGHTS.sale
  let s = 0
  if (ctx.isBench) s += W.bench
  else             s += W.starter
  if (p.age >= 32) s += W.age32
  if (p.age >= 34) s += W.age34
  if (p.forca < ctx.avg) s += Math.min(W.belowLevelMax, (ctx.avg - p.forca) * 3)
  if (p.forca - ctx.avg >= 6) s += W.aboveLevel
  if ((p.contractYearsLeft ?? 3) <= 1) s += W.shortContract
  return s
}

export function loanScore(p: Player, ctx: PlayerCtx): number {
  if (vetoed(p, ctx)) return VETO
  const W = WEIGHTS.loan
  let s = 0
  if (p.age <= 22) s += W.young22
  if (p.age <= 20) s += W.young20
  const upside = (p.potencial ?? p.forca) - p.forca
  if (upside >= 4) s += upside * W.upsideMult
  if (ctx.isBench) s += W.bench
  else             s += W.starter
  if (p.age >= 30) s += W.old30
  return s
}

function ctxFor(club: ClubLike): { all: { p: Player; isBench: boolean }[]; avg: number; gkCount: number } {
  const all = [
    ...club.squad.map(p => ({ p, isBench: false })),
    ...club.bench.map(p => ({ p, isBench: true })),
  ]
  const avg = all.reduce((s, x) => s + x.p.forca, 0) / Math.max(all.length, 1)
  const gkCount = all.filter(x => x.p.pos === 'GK').length
  return { all, avg, gkCount }
}

/**
 * Escolhe os jogadores que um clube lista.
 * Retorna os `num` de cada lista. Sem overlap: quem foi para venda não vai
 * para empréstimo.
 */
export function pickClubListings(club: ClubLike): { sale: number[]; loan: number[] } {
  const { all, avg, gkCount } = ctxFor(club)

  const scored = all.map(({ p, isBench }) => {
    const ctx: PlayerCtx = { avg, gkCount, isBench }
    return { p, sale: saleScore(p, ctx), loan: loanScore(p, ctx) }
  })

  const sale = scored
    .filter(x => x.sale > VETO)
    .sort((a, b) => b.sale - a.sale)
    .slice(0, CAPS.sale)
    .map(x => x.p.num)

  const saleSet = new Set(sale)
  const loan = scored
    .filter(x => x.loan > VETO && !saleSet.has(x.p.num))
    .sort((a, b) => b.loan - a.loan)
    .slice(0, CAPS.loan)
    .map(x => x.p.num)

  return { sale, loan }
}

const key = (clubId: string, num: number) => `${clubId}_${num}`

/** Mercado inteiro do zero (início de temporada). */
export function rollMarket(
  clubs:  ClubLike[],
  round:  number,
  season: number,
  skipClubId?: string,   // o clube do jogador não se auto-lista
): Record<string, ListingEntry> {
  const out: Record<string, ListingEntry> = {}
  for (const club of clubs) {
    if (club.id === skipClubId) continue
    const { sale, loan } = pickClubListings(club)
    for (const num of sale) out[key(club.id, num)] = { forSale: true,  forLoan: false, since: round, season }
    for (const num of loan) out[key(club.id, num)] = { forSale: false, forLoan: true,  since: round, season }
  }
  return out
}

/**
 * Tick de rotatividade: expira parte das listagens velhas e repõe até o cap.
 * Mantém o mercado vivo sem nunca esvaziar (o repõe sempre completa).
 */
export function tickMarket(
  clubs:  ClubLike[],
  round:  number,
  season: number,
  prev:   Record<string, ListingEntry>,
  skipClubId?: string,
): Record<string, ListingEntry> {
  const next: Record<string, ListingEntry> = {}

  for (const club of clubs) {
    if (club.id === skipClubId) continue

    const mine = Object.entries(prev).filter(([k]) => k.startsWith(`${club.id}_`))
    const survivors = mine.filter(([, e]) => {
      const idade = round - e.since
      if (e.season !== season) return false
      if (idade < LISTING_MAX_AGE) return true
      return Math.random() > 0.34   // ~1/3 das velhas saem por tick
    })

    const keptSale = survivors.filter(([, e]) => e.forSale)
    const keptLoan = survivors.filter(([, e]) => e.forLoan)
    survivors.forEach(([k, e]) => { next[k] = e })

    // Repõe até o cap com quem ainda não está listado
    const jaListado = new Set(survivors.map(([k]) => k))
    const { sale, loan } = pickClubListings(club)

    for (const num of sale) {
      if (keptSale.length + Object.keys(next).filter(k => k.startsWith(`${club.id}_`) && next[k].forSale).length >= CAPS.sale) break
      const k = key(club.id, num)
      if (jaListado.has(k) || next[k]) continue
      next[k] = { forSale: true, forLoan: false, since: round, season }
    }
    for (const num of loan) {
      if (Object.keys(next).filter(k => k.startsWith(`${club.id}_`) && next[k].forLoan).length >= CAPS.loan) break
      const k = key(club.id, num)
      if (jaListado.has(k) || next[k]) continue
      next[k] = { forSale: false, forLoan: true, since: round, season }
    }
    void keptLoan
  }

  return next
}
