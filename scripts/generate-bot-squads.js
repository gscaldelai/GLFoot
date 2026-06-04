// ─────────────────────────────────────────────────────────────
//  GLfoot — Gerador de elencos para os 18 clubes bot
//  Execução: node scripts/generate-bot-squads.js
//  Saída:    src/data/clubs/{id}.json  (18 arquivos)
// ─────────────────────────────────────────────────────────────

const fs   = require('fs')
const path = require('path')

// ── Definição dos clubes ─────────────────────────────────────
const CLUBS = [
  // Tier S
  { id:'fla',  name:'Flamengo',      short:'FLA',  colors:['#e30613','#000','#e30613'],     crestColors:['#e30613','#000'],       avg:78, tier:'S' },
  { id:'atl',  name:'Atlético-MG',   short:'ATL',  colors:['#000','#c8a800','#000'],        crestColors:['#000','#c8a800'],       avg:76, tier:'S' },
  // Tier A
  { id:'bot',  name:'Botafogo',      short:'BOT',  colors:['#000','#fff','#000'],           crestColors:['#000','#fff'],          avg:73, tier:'A' },
  { id:'int',  name:'Internacional', short:'INT',  colors:['#c8002d','#fff','#c8002d'],     crestColors:['#c8002d','#fff'],       avg:72, tier:'A' },
  { id:'cor',  name:'Corinthians',   short:'COR',  colors:['#111','#fff','#111'],           crestColors:['#111','#fff'],          avg:71, tier:'A' },
  { id:'cru',  name:'Cruzeiro',      short:'CRU',  colors:['#003da5','#fff','#003da5'],     crestColors:['#003da5','#fff'],       avg:71, tier:'A' },
  { id:'gre',  name:'Grêmio',        short:'GRE',  colors:['#1c5fa8','#111','#fff'],        crestColors:['#1c5fa8','#111'],       avg:70, tier:'A' },
  // Tier B
  { id:'cap',  name:'Athletico-PR',  short:'CAP',  colors:['#c8002d','#111','#c8002d'],     crestColors:['#c8002d','#111'],       avg:68, tier:'B' },
  { id:'bra',  name:'Bragantino',    short:'BRA',  colors:['#c8002d','#111','#fff'],        crestColors:['#c8002d','#111'],       avg:67, tier:'B' },
  { id:'for',  name:'Fortaleza',     short:'FOR',  colors:['#003399','#c8002d','#003399'],  crestColors:['#003399','#c8002d'],    avg:67, tier:'B' },
  { id:'vas',  name:'Vasco da Gama', short:'VAS',  colors:['#111','#fff','#111'],           crestColors:['#111','#fff'],          avg:66, tier:'B' },
  { id:'bah',  name:'Bahia',         short:'BAH',  colors:['#003da5','#c8002d','#003da5'],  crestColors:['#003da5','#c8002d'],    avg:65, tier:'B' },
  { id:'san',  name:'Santos',        short:'SAN',  colors:['#fff','#111','#fff'],           crestColors:['#fff','#111'],          avg:65, tier:'B' },
  // Tier C
  { id:'goi',  name:'Goiás',         short:'GOI',  colors:['#007a2f','#fff','#007a2f'],     crestColors:['#007a2f','#fff'],       avg:58, tier:'C' },
  { id:'ame',  name:'América-MG',    short:'AME',  colors:['#007a2f','#fff','#111'],        crestColors:['#007a2f','#fff'],       avg:56, tier:'C' },
  { id:'cru2', name:'Ceará',         short:'CEA',  colors:['#111','#fff','#111'],           crestColors:['#111','#fff'],          avg:55, tier:'C' },
  { id:'spo',  name:'Sport',         short:'SPO',  colors:['#c8002d','#111','#c8002d'],     crestColors:['#c8002d','#111'],       avg:54, tier:'C' },
  { id:'csa',  name:'CSA',           short:'CSA',  colors:['#003da5','#fff','#111'],        crestColors:['#003da5','#fff'],       avg:52, tier:'C' },
]

// ── Pool de nomes ─────────────────────────────────────────────
const GK_NAMES  = ['Santos','Gatito','Muriel','John','Marcos','Diego A.','Renan','Lucas','Gabriel','Caique','Ivan','Felipe','Hugo','Weverton G.','Matheus D.']
const DEF_NAMES = ['Léo','Danilo','Maicon','Guilherme','Renan','Bruno','Victor','João','Pedro','Léo H.','Daniel','Lucas','Diego','Felipe','Arthur','Natan','Bremer','Ruan','Kanu','Raul','Éder','Maguinhos','Robson','Clayton','Juninho','William']
const MID_NAMES = ['Thiago','Everton','Ramiro','Lucas','Matheus','Gabriel','Eduardo','Luan','Gerson','Rodrigo','Allan','Felipe','Nonato','Yago','Jean Carlos','Terans','Mosquito','Erick','Willian','Patrick','Matias','Kenedy','Alan','Fausto Vera','Maycon','Renato']
const ATK_NAMES = ['Pedro','Gabigol','Hulk','Deyverson','Vegetti','Cano','Borré','Tiquinho','Germán','Alerrandro','Brenner','Marcos L.','Mastriani','Jonathan','Gustavinho','Edu','Serna','Rocha','Dentinho','Bento','Copete','Vinicius','Deyverson','Ricardinho','William José','Cléber']

function pickName(pool, usedSet) {
  const available = pool.filter(n => !usedSet.has(n))
  if (!available.length) return pool[Math.floor(Math.random() * pool.length)] + '.'
  const name = available[Math.floor(Math.random() * available.length)]
  usedSet.add(name)
  return name
}

const SPECS = ['FI','VE','DR','DE','PA','RE','FO','MA']
const NAT_POOL = ['BRA','BRA','BRA','BRA','BRA','BRA','ARG','URU','COL','PAR','BOL','ECU']

function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }
function pick(arr)  { return arr[Math.floor(Math.random() * arr.length)] }

function makePlayer(name, num, pos, posLabel, avgF, options = {}) {
  const forca       = Math.max(45, Math.min(90, avgF + rnd(-2, 2)))
  const potencial   = Math.min(95, forca + rnd(1, 5))
  const potVisto    = Math.min(potencial, forca + rnd(0, 3))
  const spec  = options.spec  ?? pick(SPECS)
  const spec2 = options.spec2 ?? pick(SPECS.filter(s => s !== spec))
  return {
    name,
    num,
    age:              options.age ?? rnd(20, 34),
    pos,
    posLabel,
    spec,
    spec2,
    foot:             pick(['D','D','D','E']),
    nationality:      pick(NAT_POOL),
    forca,
    forcaBase:        forca,
    potencial,
    potencialVisto:   potVisto,
    moral:            60,
    fatigue:          0,
    fieldPos:         [0, 0],
    lastNotes:        [],
    matchesPlayed:    0,
    injured:          false,
    contractYearsLeft: rnd(1, 4),
    gp:               0,
    assists:          0,
  }
}

function generateClub(club) {
  const used = new Set()
  const avg  = club.avg

  // ── Titulares (11) ────────────────────────────────────────
  const squad = [
    // 1× GK
    makePlayer(pickName(GK_NAMES, used),  1,  'GK',  'GK',  avg - 2),
    // 2× LAT
    makePlayer(pickName(DEF_NAMES, used), 2,  'LAT', 'LD',  avg),
    // 2× ZAG
    makePlayer(pickName(DEF_NAMES, used), 3,  'ZAG', 'ZAG', avg),
    makePlayer(pickName(DEF_NAMES, used), 4,  'ZAG', 'ZAG', avg + 1),
    // LAT esquerdo
    makePlayer(pickName(DEF_NAMES, used), 5,  'LAT', 'LE',  avg, { foot: pick(['E','E','D']) }),
    // 2× VOL
    makePlayer(pickName(MID_NAMES, used), 6,  'VOL', 'VOL', avg),
    makePlayer(pickName(MID_NAMES, used), 8,  'VOL', 'VOL', avg - 1),
    // 1× MEI (armador)
    makePlayer(pickName(MID_NAMES, used), 10, 'MEI', 'MEI', avg + 1, { spec:'PA' }),
    // 3× ATA (ala-dir, ala-esq, centroavante)
    makePlayer(pickName(ATK_NAMES, used), 7,  'ATA', 'ATA', avg + 2),
    makePlayer(pickName(ATK_NAMES, used), 11, 'ATA', 'ATA', avg + 2, { foot: pick(['E','E','D']) }),
    makePlayer(pickName(ATK_NAMES, used), 9,  'ATA', 'CA',  avg + 4, { spec:'FI' }),
  ]

  // ── Banco (5) ─────────────────────────────────────────────
  const bench = [
    makePlayer(pickName(GK_NAMES, used),  12, 'GK',  'GK',  avg - 5),
    makePlayer(pickName(DEF_NAMES, used), 13, 'ZAG', 'ZAG', avg - 3),
    makePlayer(pickName(MID_NAMES, used), 14, 'MEI', 'MEI', avg - 3),
    makePlayer(pickName(MID_NAMES, used), 16, 'VOL', 'VOL', avg - 2),
    makePlayer(pickName(ATK_NAMES, used), 17, 'ATA', 'ATA', avg - 2),
  ]

  return {
    id:          club.id,
    name:        club.name,
    short:       club.short,
    colors:      club.colors,
    crestColors: club.crestColors,
    squad,
    bench,
  }
}

// ── Geração e escrita dos arquivos ────────────────────────────
const outDir = path.join(__dirname, '..', 'src', 'data', 'clubs')

CLUBS.forEach(club => {
  const data    = generateClub(club)
  const outPath = path.join(outDir, `${club.id}.json`)
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2))
  console.log(`✅ ${club.short.padEnd(4)} (${club.id}.json) — avg ${club.avg} — ${data.squad.length} titulares`)
})

console.log(`\n🏆 ${CLUBS.length} clubes gerados em ${outDir}`)
