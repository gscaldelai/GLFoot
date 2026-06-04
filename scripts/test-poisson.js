// ══════════════════════════════════════════════════
//  GLfoot — Teste de Mesa: Poisson Engine
//  node scripts/test-poisson.js
// ══════════════════════════════════════════════════

function poisson(lambda) {
  if (lambda <= 0) return 0
  const L = Math.exp(-lambda)
  let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}

function calcLambda(myAvg, oppAvg, isHome) {
  return Math.max(0.2, 1.3 + (myAvg - oppAvg) * 0.04 + (isHome ? 0.15 : 0))
}

const avgSPFC = 73.2, avgPAL = 74.1
const λH = calcLambda(avgSPFC, avgPAL, true)
const λA = calcLambda(avgPAL, avgSPFC, false)

console.log('══════════════════════════════════════════════')
console.log('  GLfoot — Poisson Engine Test')
console.log('══════════════════════════════════════════════')
console.log(`  SPFC média: ${avgSPFC} | PAL média: ${avgPAL}`)
console.log(`  λ_SPFC: ${λH.toFixed(3)} | λ_PAL: ${λA.toFixed(3)}`)
console.log(`  Gols esperados/jogo: ${(λH + λA).toFixed(2)}`)
console.log('')

const N = 10000
const dist = {}
let totalGols = 0, wins = 0, draws = 0, losses = 0, semGols = 0

for (let i = 0; i < N; i++) {
  const gh = poisson(λH), ga = poisson(λA), tot = gh + ga
  totalGols += tot
  dist[tot] = (dist[tot] || 0) + 1
  if (gh > ga) wins++
  else if (gh === ga) draws++
  else losses++
  if (tot === 0) semGols++
}

console.log(`  Simulação: ${N} partidas`)
console.log(`  Média gols/jogo: ${(totalGols/N).toFixed(2)} (meta: 2.5–3.0)`)
console.log(`  Jogos 0×0: ${(semGols/N*100).toFixed(1)}% (meta: 5–8%)`)
console.log(`  SPFC vence: ${(wins/N*100).toFixed(1)}%`)
console.log(`  Empate:     ${(draws/N*100).toFixed(1)}%`)
console.log(`  PAL vence:  ${(losses/N*100).toFixed(1)}%`)
console.log('')
console.log('  Distribuição de gols totais:')
for (let g = 0; g <= 7; g++) {
  const pct = ((dist[g]||0)/N*100).toFixed(1)
  const bar = '█'.repeat(Math.round((dist[g]||0)/N*40))
  console.log(`  ${g} gols: ${pct.padStart(5)}%  ${bar}`)
}

const mediaOk = totalGols/N >= 2.5 && totalGols/N <= 3.0
const semGolsOk = semGols/N >= 0.05 && semGols/N <= 0.08
console.log('')
console.log(`  ✅ Média gols: ${mediaOk ? 'PASS' : 'FAIL'}`)
console.log(`  ✅ Jogos 0×0:  ${semGolsOk ? 'PASS' : 'FAIL'}`)
console.log('══════════════════════════════════════════════')
