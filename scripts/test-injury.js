// ══════════════════════════════════════════════════
//  GLfoot — Teste de Mesa: Injury Engine (QA G-02)
//  node scripts/test-injury.js
//
//  ⚠ As fórmulas abaixo ESPELHAM src/engines/injuryEngine.ts
//    (Node não importa TS). Se alterar o engine, atualize aqui.
//
//  Critérios:
//   1. Média de lesões por clube por temporada (38 rodadas): 3.0–8.0
//   2. Lesões graves (≥11 rodadas): < 8% do total
//   3. Durações sempre em [1, 16]
//   4. p95 de lesionados simultâneos por clube ≤ 5
//   5. GK se lesiona bem menos que jogadores de linha
// ══════════════════════════════════════════════════

// ── Espelho das fórmulas do injuryEngine.ts ─────────────────
const BASE_RISK_PER_MIN = 0.00012
const GK_RISK_MOD = 0.40

function ageRiskMod(age) {
  if (age < 24)  return 0.90
  if (age <= 29) return 1.00
  if (age <= 32) return 1.35
  return 1.70
}
function fatigueRiskMod(fatigue) { return 1 + fatigue * 1.2 }

function injuryRiskPerMinute(p) {
  const posMod = p.pos === 'GK' ? GK_RISK_MOD : 1
  return BASE_RISK_PER_MIN * ageRiskMod(p.age) * fatigueRiskMod(p.fatigue) * posMod
}

function rollTeamInjury(squad) {
  const risks = squad.map(p => (p.injured ? 0 : injuryRiskPerMinute(p)))
  const total = risks.reduce((s, r) => s + r, 0)
  if (Math.random() >= total) return null
  let pick = Math.random() * total
  for (let i = 0; i < risks.length; i++) {
    pick -= risks[i]
    if (pick <= 0) return i
  }
  return risks.length - 1
}

function rollInjuryDuration() {
  const r = Math.random()
  if (r < 0.55) return 1 + Math.floor(Math.random() * 2)
  if (r < 0.85) return 3 + Math.floor(Math.random() * 3)
  if (r < 0.97) return 6 + Math.floor(Math.random() * 5)
  return 11 + Math.floor(Math.random() * 6)
}

// ── Elenco sintético realista (idades típicas de Série A) ──
function makeSquad() {
  const ages = () => 19 + Math.floor(Math.random() * 17)   // 19–35
  const squad = []
  squad.push({ pos: 'GK', age: 25 + Math.floor(Math.random() * 9), fatigue: 0, injured: false })
  const linePos = ['ZAG','ZAG','LAT','LAT','VOL','VOL','MEI','MEI','ATA','ATA']
  for (const pos of linePos) squad.push({ pos, age: ages(), fatigue: 0, injured: false })
  return squad
}

// ── Simulação: N clubes × T temporadas de 38 rodadas ───────
const CLUBS = 20, SEASONS = 25, ROUNDS = 38, MINUTES = 88  // 88 min "roláveis" (pausa 45' e 90')

const injuriesPerClubSeason = []
const durations = []
let gkInjuries = 0, lineInjuries = 0
const simultaneousSamples = []

for (let c = 0; c < CLUBS; c++) {
  for (let t = 0; t < SEASONS; t++) {
    const squad = makeSquad()
    const recovering = []   // [{roundsLeft}]
    let count = 0

    for (let round = 1; round <= ROUNDS; round++) {
      // fadiga sobe ao longo da temporada (aproximação do fatigueEngine)
      const baseFat = Math.min(0.6, round * 0.012)
      squad.forEach(p => { p.fatigue = Math.max(0, Math.min(1, baseFat + (Math.random() - 0.5) * 0.2)) })

      for (let m = 0; m < MINUTES; m++) {
        const idx = rollTeamInjury(squad)
        if (idx !== null) {
          const dur = rollInjuryDuration()
          durations.push(dur)
          count++
          if (squad[idx].pos === 'GK') gkInjuries++; else lineInjuries++
          squad[idx].injured = true
          recovering.push({ idx, roundsLeft: dur })
        }
      }

      // recuperação por rodada
      for (let i = recovering.length - 1; i >= 0; i--) {
        recovering[i].roundsLeft--
        if (recovering[i].roundsLeft <= 0) {
          squad[recovering[i].idx].injured = false
          recovering.splice(i, 1)
        }
      }
      simultaneousSamples.push(recovering.length)
    }
    injuriesPerClubSeason.push(count)
  }
}

// ── Estatísticas ────────────────────────────────────────────
const total   = durations.length
const media   = injuriesPerClubSeason.reduce((s, x) => s + x, 0) / injuriesPerClubSeason.length
const graves  = durations.filter(d => d >= 11).length
const gravesP = graves / total * 100
const minDur  = Math.min(...durations)
const maxDur  = Math.max(...durations)
const sorted  = [...simultaneousSamples].sort((a, b) => a - b)
const p95Sim  = sorted[Math.floor(sorted.length * 0.95)]
const gkShare = gkInjuries / total * 100

const distBuckets = { 'leve (1–2)': 0, 'moderada (3–5)': 0, 'séria (6–10)': 0, 'grave (11–16)': 0 }
durations.forEach(d => {
  if (d <= 2) distBuckets['leve (1–2)']++
  else if (d <= 5) distBuckets['moderada (3–5)']++
  else if (d <= 10) distBuckets['séria (6–10)']++
  else distBuckets['grave (11–16)']++
})

console.log('══════════════════════════════════════════════════════')
console.log('  GLfoot — Teste do Injury Engine (G-02)')
console.log('══════════════════════════════════════════════════════')
console.log(`  Simulação: ${CLUBS} clubes × ${SEASONS} temporadas × ${ROUNDS} rodadas`)
console.log(`  Total de lesões: ${total}`)
console.log('')
console.log(`  Média lesões/clube/temporada: ${media.toFixed(2)}  (meta: 3.0–8.0)`)
console.log(`  Lesões graves (≥11 rod):      ${gravesP.toFixed(1)}%  (meta: <8%)`)
console.log(`  Duração mín–máx:              ${minDur}–${maxDur} rodadas  (meta: 1–16)`)
console.log(`  p95 lesionados simultâneos:   ${p95Sim}  (meta: ≤5)`)
console.log(`  Lesões de GK:                 ${gkShare.toFixed(1)}%  (meta: <6% — 1/11 do elenco × 0.40)`)
console.log('')
console.log('  Distribuição de gravidade:')
for (const [label, n] of Object.entries(distBuckets)) {
  const pct = n / total * 100
  console.log(`  ${label.padEnd(16)} ${pct.toFixed(1).padStart(5)}%  ${'█'.repeat(Math.round(pct / 2))}`)
}
console.log('')

const fails = []
if (media < 3.0 || media > 8.0) fails.push(`Média fora da meta: ${media.toFixed(2)}`)
if (gravesP >= 8) fails.push(`Graves demais: ${gravesP.toFixed(1)}%`)
if (minDur < 1 || maxDur > 16) fails.push(`Duração fora de [1,16]: ${minDur}–${maxDur}`)
if (p95Sim > 5) fails.push(`p95 simultâneos alto: ${p95Sim}`)
if (gkShare >= 6) fails.push(`GK se lesiona demais: ${gkShare.toFixed(1)}%`)

console.log('══════════════════════════════════════════════════════')
if (fails.length === 0) {
  console.log('  ✅ TODOS OS CRITÉRIOS PASSARAM')
} else {
  console.log(`  ❌ ${fails.length} FALHA(S):`)
  fails.forEach(f => console.log(`     • ${f}`))
  process.exitCode = 1
}
console.log('══════════════════════════════════════════════════════')
