// ══════════════════════════════════════════════════
//  GLfoot — Teste de Mesa: Coach Engine (QA F-01)
//  node scripts/test-coach.js
//
//  ⚠ As fórmulas ESPELHAM src/engines/coachEngine.ts
//    (Node não importa TS). Se alterar o engine, atualize aqui.
//  Os clubes/tiers são PARSEADOS de src/data/clubStrength.ts.
//
//  Critérios:
//   1. Bônus de técnico não quebra o Poisson: média gols/jogo
//      da liga permanece em 2.4–3.1 com bônus ativo
//   2. Demissões por temporada: média entre 1 e 12
//   3. Zero contratações abaixo da reputação mínima do tier
//   4. Nenhum clube termina rodada sem técnico
//   5. Bônus máximo |±0.05|
// ══════════════════════════════════════════════════

const fs   = require('fs')
const path = require('path')

// ── Clubes reais parseados da fonte ─────────────────────────
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'clubStrength.ts'), 'utf8')
  .replace(/\r\n/g, '\n')
const CLUBS = [...src.matchAll(/\{ id:'([^']+)',\s*name:'([^']+)',\s*division:\d,\s*forcaMedia:([\d.]+),\s*tier:'([SABC])' \}/g)]
  .map(m => ({ id: m[1], name: m[2], forca: parseFloat(m[3]), tier: m[4] }))
if (CLUBS.length < 15) { console.error(`❌ Parse de clubStrength.ts falhou (${CLUBS.length} clubes)`); process.exit(1) }

// ── Espelho do coachEngine.ts ───────────────────────────────
const MIN_REP = { S: 4, A: 3, B: 2, C: 1 }
const coachBonus = rep => (rep - 3) * 0.025
const UNDERPERFORM_GAP = 6, PRESSURE_TO_FIRE = 5, GRACE = 5, FIRST_EVAL = 6

// ── Espelho do matchEngine.ts ───────────────────────────────
function poisson(lambda) {
  if (lambda <= 0) return 0
  const L = Math.exp(-lambda); let k = 0, p = 1
  do { k++; p *= Math.random() } while (p > L)
  return k - 1
}
const calcLambda = (my, opp, home, bonus = 0) =>
  Math.max(0.2, 1.3 + (my - opp) * 0.04 + (home ? 0.15 : 0) + bonus)

// ── Critério 1: impacto do bônus na média de gols ───────────
let totGols = 0, N = 20000
for (let i = 0; i < N; i++) {
  // pior caso: 5★ vs 1★ entre times iguais
  totGols += poisson(calcLambda(70, 70, true,  coachBonus(5)))
  totGols += poisson(calcLambda(70, 70, false, coachBonus(1)))
}
const mediaGols = totGols / N

// ── Critérios 2-4: simulação de temporadas completas ────────
const SEASONS = 30
let firingsPerSeason = [], badHires = 0, clubsSemTecnico = 0

for (let t = 0; t < SEASONS; t++) {
  // técnicos iniciais (1 por clube) + 6 no mercado
  let coaches = CLUBS.map(c => ({
    clubId: c.id, reputation: MIN_REP[c.tier] + (Math.random() < 0.35 ? 1 : 0),
    pressure: 0, hiredRound: 0,
  }))
  ;[1, 1, 2, 2, 3, 4].forEach(rep => coaches.push({ clubId: null, reputation: rep, pressure: 0, hiredRound: 0 }))

  const expected = {}
  ;[...CLUBS].sort((a, b) => b.forca - a.forca).forEach((c, i) => { expected[c.id] = i + 1 })

  const pts = Object.fromEntries(CLUBS.map(c => [c.id, 0]))
  let firings = 0

  for (let round = 1; round <= 38; round++) {
    // rodada: pares aleatórios
    const shuffled = [...CLUBS].sort(() => Math.random() - 0.5)
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      const [h, a] = [shuffled[i], shuffled[i + 1]]
      const cH = coaches.find(c => c.clubId === h.id), cA = coaches.find(c => c.clubId === a.id)
      const gh = poisson(calcLambda(h.forca, a.forca, true,  coachBonus(cH?.reputation ?? 3)))
      const ga = poisson(calcLambda(a.forca, h.forca, false, coachBonus(cA?.reputation ?? 3)))
      pts[h.id] += gh > ga ? 3 : gh === ga ? 1 : 0
      pts[a.id] += ga > gh ? 3 : ga === gh ? 1 : 0
    }

    // classificação → posição
    const table = [...CLUBS].sort((a, b) => pts[b.id] - pts[a.id])
    const posOf = {}; table.forEach((c, i) => { posOf[c.id] = i + 1 })

    // pressão e demissões
    if (round >= FIRST_EVAL) {
      for (const coach of coaches) {
        if (!coach.clubId || round - coach.hiredRound < GRACE) continue
        if (posOf[coach.clubId] - expected[coach.clubId] >= UNDERPERFORM_GAP) {
          if (++coach.pressure >= PRESSURE_TO_FIRE) {
            coach.clubId = null; coach.pressure = 0
            coach.reputation = Math.max(1, coach.reputation - 1)
            firings++
          }
        } else coach.pressure = 0
      }
    }

    // contratações
    const withCoach = new Set(coaches.filter(c => c.clubId).map(c => c.clubId))
    for (const club of CLUBS) {
      if (withCoach.has(club.id)) continue
      const minRep = MIN_REP[club.tier]
      const eligible = coaches.filter(c => c.clubId === null && c.reputation >= minRep)
      let hire = eligible.length
        ? eligible.reduce((b, c) => c.reputation > b.reputation ? c : b)
        : (coaches.push({ clubId: null, reputation: minRep, pressure: 0, hiredRound: 0 }), coaches[coaches.length - 1])
      if (hire.reputation < minRep) badHires++
      hire.clubId = club.id; hire.hiredRound = round; hire.pressure = 0
      withCoach.add(club.id)
    }
    clubsSemTecnico += CLUBS.filter(c => !withCoach.has(c.id)).length
  }
  firingsPerSeason.push(firings)
}

const mediaFirings = firingsPerSeason.reduce((s, x) => s + x, 0) / SEASONS
const maxBonus = Math.max(Math.abs(coachBonus(5)), Math.abs(coachBonus(1)))

console.log('══════════════════════════════════════════════════════')
console.log('  GLfoot — Teste do Coach Engine (F-01)')
console.log('══════════════════════════════════════════════════════')
console.log(`  Clubes parseados: ${CLUBS.length} | Temporadas simuladas: ${SEASONS}`)
console.log('')
console.log(`  Média gols/jogo (pior caso 5★×1★): ${mediaGols.toFixed(2)}  (meta: 2.4–3.1)`)
console.log(`  Bônus máximo de técnico:            ±${maxBonus.toFixed(3)}  (meta: ≤0.05)`)
console.log(`  Demissões/temporada (média):        ${mediaFirings.toFixed(1)}  (meta: 1–12)`)
console.log(`  Contratações abaixo do tier:        ${badHires}  (meta: 0)`)
console.log(`  Clube-rodadas sem técnico:          ${clubsSemTecnico}  (meta: 0)`)
console.log('')

const fails = []
if (mediaGols < 2.4 || mediaGols > 3.1) fails.push(`Média de gols fora da meta: ${mediaGols.toFixed(2)}`)
if (maxBonus > 0.05 + 1e-9) fails.push(`Bônus máximo alto: ${maxBonus}`)
if (mediaFirings < 1 || mediaFirings > 12) fails.push(`Demissões/temporada fora da meta: ${mediaFirings.toFixed(1)}`)
if (badHires > 0) fails.push(`${badHires} contratação(ões) abaixo da reputação mínima`)
if (clubsSemTecnico > 0) fails.push(`${clubsSemTecnico} clube-rodadas sem técnico`)

console.log('══════════════════════════════════════════════════════')
if (fails.length === 0) console.log('  ✅ TODOS OS CRITÉRIOS PASSARAM')
else { console.log(`  ❌ ${fails.length} FALHA(S):`); fails.forEach(f => console.log(`     • ${f}`)); process.exitCode = 1 }
console.log('══════════════════════════════════════════════════════')
