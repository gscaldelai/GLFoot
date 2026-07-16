// ════════════════════════════════════════════════════════
//  GLfoot — Teste de mesa: faixas de força ≡ tiers antigos
//
//  Rede de segurança da remoção do sistema de Tiers (#34).
//  Prova que forceBand(clubForce(id)) reproduz EXATAMENTE o tier
//  hardcoded que existia antes, para os 20 clubes.
//
//  Base de cálculo: elenco + banco (16 atletas) — "média dos atletas".
// ════════════════════════════════════════════════════════
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLUBS_DIR = join(__dirname, '..', 'src', 'data', 'clubs')

// Tiers que existiam antes do refactor — a verdade a ser reproduzida
const TIER_ANTIGO = {
  fla: 'S', atl: 'S',
  palm: 'A', spfc: 'A', bot: 'A', int: 'A', cor: 'A', cru: 'A', gre: 'A',
  cap: 'B', bra: 'B', for: 'B', vas: 'B', bah: 'B', san: 'B',
  goi: 'C', ame: 'C', cru2: 'C', spo: 'C', csa: 'C',
}

// Limiares a validar (base elenco+banco)
const FORCE_BANDS = { S: 75, A: 68.5, B: 61 }
const forceBand = (f) => (f >= FORCE_BANDS.S ? 'S' : f >= FORCE_BANDS.A ? 'A' : f >= FORCE_BANDS.B ? 'B' : 'C')

const avg = (arr) => arr.reduce((s, p) => s + p.forca, 0) / arr.length

// Carrega os 20 JSONs pelo id declarado dentro do arquivo (evita depender do nome)
const clubs = {}
for (const file of readdirSync(CLUBS_DIR).filter(f => f.endsWith('.json'))) {
  const c = JSON.parse(readFileSync(join(CLUBS_DIR, file), 'utf8'))
  clubs[c.id] = c
}

console.log('══════════════════════════════════════════════════════')
console.log('  GLfoot — Faixas de Força ≡ Tiers antigos (#34)')
console.log('══════════════════════════════════════════════════════')
console.log(`  Clubes carregados: ${Object.keys(clubs).length}`)
console.log(`  Limiares: S >= ${FORCE_BANDS.S} · A >= ${FORCE_BANDS.A} · B >= ${FORCE_BANDS.B} · C < ${FORCE_BANDS.B}`)
console.log('')

let divergencias = 0
let faltando = 0
const linhas = []

for (const [id, tierEsperado] of Object.entries(TIER_ANTIGO)) {
  const c = clubs[id]
  if (!c) { console.log(`  ❌ clube ausente: ${id}`); faltando++; continue }
  const elenco = [...c.squad, ...c.bench]
  const forca = avg(elenco)
  const band = forceBand(forca)
  const ok = band === tierEsperado
  if (!ok) divergencias++
  linhas.push({ id, nome: c.name, n: elenco.length, forca, tierEsperado, band, ok })
}

linhas.sort((a, b) => b.forca - a.forca)
for (const l of linhas) {
  const flag = l.ok ? '✅' : '❌'
  console.log(
    `  ${flag} ${l.id.padEnd(5)} ${l.nome.padEnd(16)} ` +
    `força ${l.forca.toFixed(1).padStart(5)} (${l.n} atletas)  ` +
    `antigo=${l.tierEsperado}  faixa=${l.band}`
  )
}

console.log('')
console.log(`  Divergências: ${divergencias}  |  Clubes ausentes: ${faltando}`)

// Margem: distância de cada clube ao limiar mais próximo — folga p/ força dinâmica
const margens = linhas.map(l => {
  const ds = [FORCE_BANDS.S, FORCE_BANDS.A, FORCE_BANDS.B].map(t => Math.abs(l.forca - t))
  return { id: l.id, margem: Math.min(...ds) }
}).sort((a, b) => a.margem - b.margem)
console.log(`  Menor folga até um limiar: ${margens[0].id} a ${margens[0].margem.toFixed(1)} pts`)

console.log('')
console.log('══════════════════════════════════════════════════════')
if (divergencias === 0 && faltando === 0) {
  console.log('  ✅ 20/20 — as faixas reproduzem os tiers antigos')
  console.log('══════════════════════════════════════════════════════')
} else {
  console.log('  ❌ FALHOU — as faixas NÃO reproduzem os tiers antigos')
  console.log('══════════════════════════════════════════════════════')
  process.exit(1)
}
