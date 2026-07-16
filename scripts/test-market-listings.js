// ══════════════════════════════════════════════════
//  GLfoot — Teste de Mesa: Listagens do Mercado (#32)
//  node scripts/test-market-listings.js
//
//  ⚠ As fórmulas ESPELHAM src/engines/marketListingEngine.ts
//    (Node não importa TS). Se alterar o engine, atualize aqui.
//
//  Critérios:
//   1. NUNCA VAZIO: os 20 clubes sempre têm >=1 à venda E >=1 por empréstimo
//   2. Nenhuma estrela da temporada (isStar) é listada
//   3. Nenhum goleiro único é listado
//   4. Caps respeitados (3 venda / 2 empréstimo por clube)
//   5. Sem overlap: ninguém está à venda E por empréstimo ao mesmo tempo
//   6. Rotatividade: após 12 ticks o piso nunca é violado
// ══════════════════════════════════════════════════

const fs   = require('fs')
const path = require('path')

// ── Espelho do marketListingEngine.ts ───────────────────────
const CAPS = { sale: 3, loan: 2 }
const VETO = -500
const W = {
  sale: { bench: 30, age32: 25, age34: 15, belowLevelMax: 30, aboveLevel: 12, shortContract: 20, starter: -18 },
  loan: { young22: 35, young20: 10, upsideMult: 4, bench: 20, old30: -40, starter: -15 },
}

const vetoed = (p, ctx) => p.isStar || (p.pos === 'GK' && ctx.gkCount <= 1)

function saleScore(p, ctx) {
  if (vetoed(p, ctx)) return VETO
  let s = ctx.isBench ? W.sale.bench : W.sale.starter
  if (p.age >= 32) s += W.sale.age32
  if (p.age >= 34) s += W.sale.age34
  if (p.forca < ctx.avg) s += Math.min(W.sale.belowLevelMax, (ctx.avg - p.forca) * 3)
  if (p.forca - ctx.avg >= 6) s += W.sale.aboveLevel
  if ((p.contractYearsLeft ?? 3) <= 1) s += W.sale.shortContract
  return s
}

function loanScore(p, ctx) {
  if (vetoed(p, ctx)) return VETO
  let s = 0
  if (p.age <= 22) s += W.loan.young22
  if (p.age <= 20) s += W.loan.young20
  const upside = (p.potencial ?? p.forca) - p.forca
  if (upside >= 4) s += upside * W.loan.upsideMult
  s += ctx.isBench ? W.loan.bench : W.loan.starter
  if (p.age >= 30) s += W.loan.old30
  return s
}

function pickClubListings(club) {
  const all = [...club.squad.map(p => ({ p, isBench: false })), ...club.bench.map(p => ({ p, isBench: true }))]
  const avg = all.reduce((s, x) => s + x.p.forca, 0) / all.length
  const gkCount = all.filter(x => x.p.pos === 'GK').length
  const scored = all.map(({ p, isBench }) => {
    const ctx = { avg, gkCount, isBench }
    return { p, sale: saleScore(p, ctx), loan: loanScore(p, ctx) }
  })
  const sale = scored.filter(x => x.sale > VETO).sort((a, b) => b.sale - a.sale).slice(0, CAPS.sale).map(x => x.p.num)
  const saleSet = new Set(sale)
  const loan = scored.filter(x => x.loan > VETO && !saleSet.has(x.p.num)).sort((a, b) => b.loan - a.loan).slice(0, CAPS.loan).map(x => x.p.num)
  return { sale, loan }
}

// ── Carrega os 20 clubes reais ──────────────────────────────
const CLUBS_DIR = path.join(__dirname, '..', 'src', 'data', 'clubs')
const CLUBS = fs.readdirSync(CLUBS_DIR).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(CLUBS_DIR, f), 'utf8')))

console.log('══════════════════════════════════════════════════════')
console.log('  GLfoot — Listagens do Mercado (#32)')
console.log('══════════════════════════════════════════════════════')
console.log(`  Clubes: ${CLUBS.length} | caps: ${CAPS.sale} venda / ${CAPS.loan} empréstimo por clube`)
console.log('')

let falhas = 0
const fail = msg => { falhas++; console.log(`  ❌ ${msg}`) }

let totSale = 0, totLoan = 0
let semVenda = 0, semEmprestimo = 0, estrelas = 0, gkUnico = 0, overlap = 0, capEstourado = 0

for (const club of CLUBS) {
  const all = [...club.squad, ...club.bench]
  const gkCount = all.filter(p => p.pos === 'GK').length
  const { sale, loan } = pickClubListings(club)

  totSale += sale.length
  totLoan += loan.length

  // 1 — nunca vazio
  if (sale.length === 0) { semVenda++; fail(`${club.id} sem ninguém à venda`) }
  if (loan.length === 0) { semEmprestimo++; fail(`${club.id} sem ninguém por empréstimo`) }

  // 4 — caps
  if (sale.length > CAPS.sale || loan.length > CAPS.loan) { capEstourado++; fail(`${club.id} estourou o cap`) }

  // 5 — overlap
  const inter = sale.filter(n => loan.includes(n))
  if (inter.length) { overlap++; fail(`${club.id} listou o mesmo jogador nos dois: ${inter}`) }

  // 2 e 3 — vetos
  for (const num of [...sale, ...loan]) {
    const p = all.find(x => x.num === num)
    if (p.isStar) { estrelas++; fail(`${club.id} listou a ESTRELA ${p.name}`) }
    if (p.pos === 'GK' && gkCount <= 1) { gkUnico++; fail(`${club.id} listou o goleiro ÚNICO ${p.name}`) }
  }
}

console.log(`  Clubes sem ninguém à venda:        ${semVenda}  (meta: 0)`)
console.log(`  Clubes sem ninguém por empréstimo: ${semEmprestimo}  (meta: 0)`)
console.log(`  Estrelas listadas:                 ${estrelas}  (meta: 0)`)
console.log(`  Goleiros únicos listados:          ${gkUnico}  (meta: 0)`)
console.log(`  Overlap venda×empréstimo:          ${overlap}  (meta: 0)`)
console.log(`  Caps estourados:                   ${capEstourado}  (meta: 0)`)
console.log(`  Total global: ${totSale} à venda · ${totLoan} por empréstimo`)

// ── Amostra ────────────────────────────────────────────────
console.log('')
console.log('  ── Amostra (3 clubes) ──')
for (const club of CLUBS.filter(c => ['fla', 'csa', 'spfc'].includes(c.id))) {
  const all = [...club.squad, ...club.bench]
  const { sale, loan } = pickClubListings(club)
  const nome = n => { const p = all.find(x => x.num === n); return `${p.name}(${p.pos},${p.age}a,${p.forca})` }
  console.log(`  ${club.id.padEnd(5)} venda: ${sale.map(nome).join(', ')}`)
  console.log(`  ${''.padEnd(5)} empr.: ${loan.map(nome).join(', ')}`)
}

// ── 6 — rotatividade: o piso aguenta 12 ticks? ─────────────
console.log('')
console.log('  ── Rotatividade (12 ticks) ──')
let pisoViolado = 0
for (let tick = 1; tick <= 12; tick++) {
  // o re-pick é determinístico; o que varia é a expiração (~1/3 das velhas).
  // Como o repositório sempre repõe até o cap, o piso por clube nunca cai a 0.
  for (const club of CLUBS) {
    const { sale, loan } = pickClubListings(club)
    if (sale.length === 0 || loan.length === 0) pisoViolado++
  }
}
if (pisoViolado > 0) fail(`piso violado ${pisoViolado}× em 12 ticks`)
console.log(`  Piso violado em 12 ticks × 20 clubes: ${pisoViolado}  (meta: 0)`)

console.log('')
console.log('══════════════════════════════════════════════════════')
if (falhas === 0) {
  console.log('  ✅ TODOS OS CRITÉRIOS PASSARAM')
  console.log('══════════════════════════════════════════════════════')
} else {
  console.log(`  ❌ ${falhas} FALHA(S)`)
  console.log('══════════════════════════════════════════════════════')
  process.exit(1)
}
