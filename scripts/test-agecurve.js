// ══════════════════════════════════════════════════
//  GLfoot — Teste de Mesa: Age Curve Engine
//  node scripts/test-agecurve.js
// ══════════════════════════════════════════════════

function gaussian(mean, std) {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const CURVES = {
  ATA: { peakStart:24, peakEnd:27, devRate:1.8, decRate:1.2 },
  MEI: { peakStart:25, peakEnd:29, devRate:1.5, decRate:0.9 },
  GK:  { peakStart:29, peakEnd:33, devRate:1.0, decRate:0.7 },
}

function ageDelta(age, pos) {
  const c = CURVES[pos]
  if (age < c.peakStart) return c.devRate * (1 + ((c.peakStart - age) > 3 ? 0.3 : 0))
  if (age <= c.peakEnd)  return gaussian(0.1, 0.3)
  const yp = age - c.peakEnd
  return -(c.decRate * (1 + (yp > 4 ? yp * 0.12 : yp * 0.06)))
}

const ATHLETES = [
  { name:'Calleri',    pos:'ATA', age:36, forca:78, potencial:82 },
  { name:'Estêvão',    pos:'MEI', age:18, forca:77, potencial:92 },
  { name:'Weverton',   pos:'GK',  age:37, forca:76, potencial:80 },
]

console.log('══════════════════════════════════════════════')
console.log('  GLfoot — Age Curve Engine Test (15 Temporadas)')
console.log('══════════════════════════════════════════════')

let totalViolations = 0

ATHLETES.forEach(a => {
  let { forca, age } = a
  const teto = a.potencial, piso = a.potencial - 25
  const hist = []
  console.log(`\n  ${a.name.toUpperCase()} | ${a.pos} | ${age}a | Base: ${forca} | Pot: ${teto}`)
  console.log('  T  │ Idade │ Força │ Delta │ Fase')
  console.log('  ───┼───────┼───────┼───────┼─────────')

  for (let t = 1; t <= 15; t++) {
    const delta = ageDelta(age, a.pos)
    const noise = gaussian(0, 0.5)
    forca = Math.max(piso, Math.min(teto, Math.round((forca + delta + noise) * 10) / 10))
    age++
    const fase = age < (CURVES[a.pos]?.peakStart||25) ? '📈 Dev'
               : age <= (CURVES[a.pos]?.peakEnd||29)  ? '⭐ Pico'
               : age > 35                              ? '🔴 Fim'
               : '📉 Dec'
    const viol = forca > teto || forca < piso
    if (viol) totalViolations++
    hist.push(forca)
    const dStr = (delta >= 0 ? '+' : '') + delta.toFixed(1)
    console.log(`  T${String(t).padEnd(2)}│  ${age}   │  ${String(forca).padEnd(5)}│  ${dStr.padEnd(5)}│ ${fase}${viol?' ❌':''}`)
  }

  const max = Math.max(...hist), min = Math.min(...hist)
  console.log(`  → Pico: ${max} | Mínimo: ${min} | Δ Total: ${(hist[14]-hist[0]).toFixed(1)}`)
})

console.log('')
console.log(`══════════════════════════════════════════════`)
console.log(`  Violações de teto/piso: ${totalViolations === 0 ? '✅ 0' : '❌ ' + totalViolations}`)
console.log('══════════════════════════════════════════════')
