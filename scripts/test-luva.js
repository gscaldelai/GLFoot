// ══════════════════════════════════════════════════
//  GLfoot — Teste de Mesa: Luva de Empréstimo (#37)
//  node scripts/test-luva.js
//
//  ⚠ As fórmulas ESPELHAM src/engines/marketEngine.ts (Node não importa TS).
//    Se alterar calcLuva/calcLoanCost lá, atualize aqui.
//
//  Critérios:
//   1. Os 4 exemplos aprovados na spec batem (8,5M / 3,1M / 34M / 2,1M)
//   2. Mesma divisão + reforço no nível (exc < 8) => luva ZERO
//   3. Divisão inferior->superior (gap < 0) => luva ZERO
//   4. Monotonicidade: luva cresce com excedente e com gap
//   5. A luva é um SINK: nunca credita ninguém (checado no store, aqui só o valor)
// ══════════════════════════════════════════════════

const fs   = require('fs')
const path = require('path')

// ── Espelho do marketEngine.ts ──────────────────────────────
const LUVA_K       = 10_000
const LUVA_K_INTRA = 4_000
const LUVA_EXC_MIN = 8
const round10k = v => Math.round(v / 10_000) * 10_000

function calcLuva(forca, myClubForce, buyerDiv, sellerDiv) {
  const excedente = Math.max(0, forca - myClubForce)
  const gap = buyerDiv - sellerDiv
  if (gap > 0) {
    return { luva: round10k(LUVA_K * forca * Math.pow(1 + excedente / 10, 2) * gap), excedente, gap, kind: 'cross' }
  }
  if (gap === 0 && excedente >= LUVA_EXC_MIN) {
    return { luva: round10k(LUVA_K_INTRA * forca * Math.pow(excedente / 10, 2)), excedente, gap, kind: 'intra' }
  }
  return { luva: 0, excedente, gap, kind: 'none' }
}

const fmtM = v => `R$ ${(v / 1e6).toFixed(2)}M`

console.log('══════════════════════════════════════════════════════')
console.log('  GLfoot — Luva de Empréstimo (#37)')
console.log('══════════════════════════════════════════════════════')
console.log(`  K(cross)=${LUVA_K}  K(intra)=${LUVA_K_INTRA}  excedente mín. intra=${LUVA_EXC_MIN}`)
console.log('')

let falhas = 0
const ok = (cond, msg) => { if (!cond) { falhas++; console.log(`  ❌ ${msg}`) } else { console.log(`  ✅ ${msg}`) } }

// ── Critério 1: os 4 exemplos aprovados na spec ─────────────
console.log('  ── Exemplos aprovados na spec ──')
const casos = [
  { nome: 'Série B (55) pega craque 78 da A', forca: 78, minha: 55, bDiv: 2, sDiv: 1, esperado: 8.5 },
  { nome: 'Série B forte (68) pega o mesmo 78', forca: 78, minha: 68, bDiv: 2, sDiv: 1, esperado: 3.1 },
  { nome: 'Série C (50) pega superstar 85 da A', forca: 85, minha: 50, bDiv: 3, sDiv: 1, esperado: 34.4 },
  { nome: 'Intra-A: CSA (52) pega craque 78', forca: 78, minha: 52, bDiv: 1, sDiv: 1, esperado: 2.1 },
]
for (const c of casos) {
  const r = calcLuva(c.forca, c.minha, c.bDiv, c.sDiv)
  const M = r.luva / 1e6
  const dif = Math.abs(M - c.esperado)
  ok(dif <= 0.06, `${c.nome.padEnd(38)} => ${fmtM(r.luva).padStart(10)} (spec ~R$ ${c.esperado}M, kind=${r.kind})`)
}

// ── Critério 2: mesma divisão, reforço no nível => zero ─────
console.log('')
console.log('  ── Reforço "no seu nível" sai de graça ──')
for (const [forca, minha] of [[74, 70], [72, 70], [70, 70], [60, 70]]) {
  const r = calcLuva(forca, minha, 1, 1)
  ok(r.luva === 0, `intra força ${forca} em clube ${minha} (exc ${r.excedente}) => luva ZERO`)
}

// ── Critério 3: inferior -> superior => zero ────────────────
console.log('')
console.log('  ── Clube grande pegando de série menor: sem luva ──')
for (const [bDiv, sDiv] of [[1, 2], [1, 3], [2, 3]]) {
  const r = calcLuva(85, 50, bDiv, sDiv)
  ok(r.luva === 0 && r.kind === 'none', `div ${bDiv} pega de div ${sDiv} (gap ${r.gap}) => luva ZERO`)
}

// ── Critério 4: monotonicidade ─────────────────────────────
console.log('')
console.log('  ── Monotonicidade ──')
let cresceExc = true
let ant = -1
for (let exc = 8; exc <= 30; exc += 2) {
  const r = calcLuva(75, 75 - exc, 1, 1)
  if (r.luva < ant) cresceExc = false
  ant = r.luva
}
ok(cresceExc, 'luva intra cresce monotonicamente com o excedente')

const g1 = calcLuva(78, 55, 2, 1).luva
const g2 = calcLuva(78, 55, 3, 1).luva
ok(g2 > g1 && Math.abs(g2 - 2 * g1) <= 20_000, `gap 2 custa ~2x o gap 1 (${fmtM(g1)} -> ${fmtM(g2)})`)

const intra = calcLuva(78, 55, 1, 1).luva
const cross = calcLuva(78, 55, 2, 1).luva
ok(intra < cross, `luva intra (${fmtM(intra)}) é mais suave que cross (${fmtM(cross)})`)

// ── Matriz de referência ───────────────────────────────────
console.log('')
console.log('  ── Matriz intra-divisão: luva por força do atleta × força do meu clube ──')
const minhas = [52, 58, 64, 70, 76]
process.stdout.write('       meu clube:'); minhas.forEach(m => process.stdout.write(String(m).padStart(9)))
console.log('')
for (const forca of [62, 68, 74, 80, 86]) {
  process.stdout.write(`  atleta ${String(forca).padStart(2)}:      `)
  for (const m of minhas) {
    const r = calcLuva(forca, m, 1, 1)
    process.stdout.write((r.luva === 0 ? '—' : (r.luva / 1e6).toFixed(1) + 'M').padStart(9))
  }
  console.log('')
}

// ── Confronto com orçamento real dos clubes ────────────────
console.log('')
console.log('  ── A luva freia de verdade? (orçamento inicial vs. luva do melhor alvo) ──')
const CLUBS_DIR = path.join(__dirname, '..', 'src', 'data', 'clubs')
const avg = arr => arr.reduce((s, p) => s + p.forca, 0) / arr.length
const clubs = fs.readdirSync(CLUBS_DIR).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(CLUBS_DIR, f), 'utf8')))
const calcInitialBudget = f => Math.max(500_000, Math.min(15_000_000, Math.round(10_000_000 * Math.pow(f / 75, 2.5) / 500_000) * 500_000))
// melhor atleta do jogo (não-estrela, já que isStar é vetado no mercado)
const todos = clubs.flatMap(c => [...c.squad, ...c.bench])
const melhor = todos.reduce((a, b) => (b.forca > a.forca ? b : a))
for (const c of clubs.map(c => ({ id: c.id, f: avg([...c.squad, ...c.bench]) })).sort((a, b) => a.f - b.f).slice(0, 4)) {
  const orc = calcInitialBudget(c.f)
  const r = calcLuva(melhor.forca, c.f, 1, 1)
  const cabe = orc >= r.luva
  console.log(`  ${c.id.padEnd(5)} força ${c.f.toFixed(1)} · orçamento ${fmtM(orc).padStart(10)} · luva p/ ${melhor.name}(${melhor.forca}) ${fmtM(r.luva).padStart(10)} ${cabe ? '→ CABE' : '→ não cabe'}`)
}

console.log('')
console.log('══════════════════════════════════════════════════════')
if (falhas === 0) {
  console.log('  ✅ TODOS OS CRITÉRIOS PASSARAM')
  console.log('══════════════════════════════════════════════════════')
} else {
  console.log(`  ❌ ${falhas} CRITÉRIO(S) FALHARAM`)
  console.log('══════════════════════════════════════════════════════')
  process.exit(1)
}
