// ══════════════════════════════════════════════════
//  GLfoot — Teste de Mesa: Matriz de Formações (QA G-01)
//  node scripts/test-formations.js
//
//  Lê FORMATION_MATCHUP_BONUS direto de src/data/formations.ts
//  (sem duplicar dados — valida a fonte real).
//
//  Critérios:
//   1. Nenhuma formação invicta (toda formação tem ≥1 derrota)
//   2. Toda formação tem ≥1 vitória
//   3. 4-4-2 equilibrado: saldo W-L entre 0 e +1 (QA: "neutro ou levemente positivo")
//   4. Nenhum saldo pior que -1, exceto 4-2-4 (alto risco por design)
//   5. Bônus dentro da escala documentada (0.10–0.20)
//   6. Sem pares contraditórios não intencionais (A>B e B>A), exceto
//      duelos mutuamente ofensivos declarados (4-2-4 × 2-3-2-3)
// ══════════════════════════════════════════════════

const fs   = require('fs')
const path = require('path')

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'formations.ts'), 'utf8')
  .replace(/\r\n/g, '\n')   // robusto a checkout com CRLF

// Extrai o bloco da matriz
const blockMatch = src.match(/FORMATION_MATCHUP_BONUS[^{]*\{([\s\S]*?)\n\}/)
if (!blockMatch) { console.error('❌ Não achei FORMATION_MATCHUP_BONUS em formations.ts'); process.exit(1) }

const entries = []
const re = /'([^']+)_vs_([^']+)':\s*([\d.]+)/g
let m
while ((m = re.exec(blockMatch[1])) !== null) {
  entries.push({ winner: m[1], loser: m[2], bonus: parseFloat(m[3]) })
}

// Extrai as formações do type FormationKey
const keyBlock = src.match(/export type FormationKey =([\s\S]*?)\n\n/)
if (!keyBlock) { console.error('❌ Não achei o type FormationKey em formations.ts'); process.exit(1) }
const FORMATIONS = [...keyBlock[1].matchAll(/\|\s*'([^']+)'/g)].map(x => x[1])

console.log('══════════════════════════════════════════════════════')
console.log('  GLfoot — Teste da Matriz de Formações (G-01)')
console.log('══════════════════════════════════════════════════════')
console.log(`  Formações: ${FORMATIONS.length} | Matchups na matriz: ${entries.length}`)
console.log('')

// Pares mutuamente ofensivos permitidos (ambos ganham bônus de ataque)
const ALLOWED_MUTUAL = new Set(['4-2-4|2-3-2-3'])

const stats = {}
FORMATIONS.forEach(f => { stats[f] = { w: [], l: [] } })

let unknown = []
for (const e of entries) {
  if (!stats[e.winner] || !stats[e.loser]) { unknown.push(`${e.winner}_vs_${e.loser}`); continue }
  stats[e.winner].w.push(`${e.loser}(+${e.bonus})`)
  stats[e.loser].l.push(`${e.winner}(+${e.bonus})`)
}

console.log('  Formação     │  V │  D │ Saldo │ Status')
console.log('  ─────────────┼────┼────┼───────┼────────')
let fails = []
for (const f of FORMATIONS) {
  const w = stats[f].w.length, l = stats[f].l.length, net = w - l
  let status = 'OK'
  if (l === 0) { status = 'INVICTA ❌'; fails.push(`${f} é invicta (${w}W/0L)`) }
  if (w === 0) { status = 'SEM VITÓRIA ❌'; fails.push(`${f} não vence ninguém (0W/${l}L)`) }
  if (net < -1 && f !== '4-2-4') { status = 'MUITO FRACA ❌'; fails.push(`${f} tem saldo ${net} (limite -1; só 4-2-4 pode)`) }
  console.log(`  ${f.padEnd(12)} │ ${String(w).padStart(2)} │ ${String(l).padStart(2)} │ ${String(net >= 0 ? '+' + net : net).padStart(5)} │ ${status}`)
}
console.log('')

// 4-4-2 específico (QA G-01)
const f442 = stats['4-4-2']
const net442 = f442.w.length - f442.l.length
const ok442 = net442 >= 0 && net442 <= 1
if (!ok442) fails.push(`4-4-2 deveria ter saldo 0 ou +1, tem ${net442}`)
console.log(`  4-4-2 vence:  ${f442.w.join(', ')}`)
console.log(`  4-4-2 perde:  ${f442.l.join(', ')}`)
console.log('')

// Escala de bônus
for (const e of entries) {
  if (e.bonus < 0.10 || e.bonus > 0.20) fails.push(`Bônus fora da escala 0.10–0.20: ${e.winner}_vs_${e.loser} = ${e.bonus}`)
}

// Pares contraditórios
const keys = new Set(entries.map(e => `${e.winner}|${e.loser}`))
for (const e of entries) {
  const inverse = `${e.loser}|${e.winner}`
  const pairId  = [e.winner, e.loser].sort().join('|')
  if (keys.has(inverse) && !ALLOWED_MUTUAL.has(`${e.winner}|${e.loser}`) && !ALLOWED_MUTUAL.has(inverse)) {
    fails.push(`Par contraditório não declarado: ${e.winner} × ${e.loser} (ambas direções na matriz)`)
  }
}

// Formações desconhecidas
if (unknown.length) fails.push(`Matchups com formação inexistente: ${unknown.join(', ')}`)

// Dedup de falhas
fails = [...new Set(fails)]

console.log('══════════════════════════════════════════════════════')
if (fails.length === 0) {
  console.log('  ✅ TODOS OS CRITÉRIOS PASSARAM')
  console.log(`  ✅ 4-4-2: ${f442.w.length}W/${f442.l.length}L (saldo ${net442 >= 0 ? '+' + net442 : net442}) — equilibrado`)
  console.log('  ✅ Nenhuma formação invicta ou sem vitória')
  console.log('  ✅ Saldos dentro do limite (exceção 4-2-4 por design)')
} else {
  console.log(`  ❌ ${fails.length} FALHA(S):`)
  fails.forEach(f => console.log(`     • ${f}`))
  process.exitCode = 1
}
console.log('══════════════════════════════════════════════════════')
