// ════════════════════════════════════════════════════════
//  GLfoot — Catálogo de Estádios
//  Dados: SoccerWiki + fontes oficiais dos clubes
//  Capacidades: capacidade atual homologada (2024)
// ════════════════════════════════════════════════════════

export interface TicketTier {
  name:  string     // ex: "Popular", "Cadeira", "Camarote"
  ratio: number     // fração da capacidade nesta categoria (0–1, soma = 1)
  price: number     // preço base em R$
}

export interface TierExpansion {
  name:      string   // Popular / Cadeira / Camarote
  addedSeats: number  // assentos adicionados nesta categoria
}

export interface StadiumExpansionStage {
  stage:      number          // 1, 2, 3
  addedSeats: number          // total de assentos adicionados
  tierBreakdown: TierExpansion[] // distribuição por categoria
  cost:       number          // custo em R$
  weeks:      number          // semanas de obra
}

export interface Stadium {
  id:          string
  name:        string
  clubId:      string    // clube mandante principal
  coClubs?:    string[]  // clubes que dividem o estádio
  city:        string
  state:       string    // UF
  capacity:    number    // capacidade atual
  maxCapacity: number    // capacidade após todas as expansões
  yearBuilt:   number
  photo?:      string    // filename no Wikimedia Commons (Special:FilePath)
  tiers:       TicketTier[]
  expansions:  StadiumExpansionStage[]
}

// URL de foto via Wikimedia Commons Special:FilePath (sem precisar de hash)
export function stadiumPhotoUrl(filename: string, width = 800): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=${width}`
}

// ── Preço base por categoria ─────────────────────────────
// Valores ajustados pela capacidade: estádios maiores = mais público fiel = preços maiores
// Multiplicadores aplicados no engine: x1.0 normal | x1.3 clássico | x1.8 final

const TIERS_GRANDE: TicketTier[] = [
  { name: 'Popular',  ratio: 0.45, price: 60  },
  { name: 'Cadeira',  ratio: 0.40, price: 120 },
  { name: 'Camarote', ratio: 0.15, price: 350 },
]
const TIERS_MEDIO: TicketTier[] = [
  { name: 'Popular',  ratio: 0.45, price: 50  },
  { name: 'Cadeira',  ratio: 0.40, price: 100 },
  { name: 'Camarote', ratio: 0.15, price: 280 },
]
const TIERS_PEQUENO: TicketTier[] = [
  { name: 'Popular',  ratio: 0.50, price: 40  },
  { name: 'Cadeira',  ratio: 0.38, price: 80  },
  { name: 'Camarote', ratio: 0.12, price: 220 },
]

// ── Etapas de expansão padrão ────────────────────────────
// Expansão máxima total = 25% da capacidade original
// Dividida em 3 etapas iguais (~8.33% cada)
// Assentos de cada etapa distribuídos pelas categorias proporcionalmente
// Distribuição dos assentos por categoria em cada etapa:
// Camarote → sempre 7% dos assentos adicionados
// Popular e Cadeira → dividem os 93% restantes proporcionalmente entre si
function tierExpansionBreakdown(added: number, tiers: TicketTier[]): TierExpansion[] {
  const CAMAROTE_SHARE = 0.07
  const nonCamarote = tiers.filter(t => t.name !== 'Camarote')
  const nonCamaroteTotal = nonCamarote.reduce((s, t) => s + t.ratio, 0)

  return tiers.map(t => {
    const share = t.name === 'Camarote'
      ? CAMAROTE_SHARE
      : (t.ratio / nonCamaroteTotal) * (1 - CAMAROTE_SHARE)
    return { name: t.name, addedSeats: Math.round(added * share) }
  })
}

function expansionStages(base: number, tiers: TicketTier[]): StadiumExpansionStage[] {
  const perStage = [
    { pct: 0.0833, costPerSeat: 800,  weeks: 10 },
    { pct: 0.0833, costPerSeat: 1000, weeks: 14 },
    { pct: 0.0834, costPerSeat: 1200, weeks: 18 },
  ]
  return perStage.map((s, i) => {
    const added = Math.round(base * s.pct)
    return {
      stage:         i + 1,
      addedSeats:    added,
      tierBreakdown: tierExpansionBreakdown(added, tiers),
      cost:          Math.round(added * s.costPerSeat),
      weeks:         s.weeks,
    }
  })
}

// ── Catálogo de estádios ─────────────────────────────────

export const STADIUMS: Record<string, Stadium> = {

  // ── SÃO PAULO FC ────────────────────────────────────────
  morumbi: {
    id: 'morumbi', name: 'Estádio Cícero Pompeu de Toledo (Morumbis)',
    clubId: 'spfc', city: 'São Paulo', state: 'SP',
    capacity: 67_052, maxCapacity: Math.round(67_052 * 1.25), yearBuilt: 1960,
    photo: 'Estádio_do_Morumbi.jpg',
    tiers: TIERS_GRANDE,
    expansions: expansionStages(67_052, TIERS_GRANDE),
  },

  // ── PALMEIRAS ───────────────────────────────────────────
  allianz: {
    id: 'allianz', name: 'Allianz Parque',
    clubId: 'palmeiras', city: 'São Paulo', state: 'SP',
    capacity: 43_713, maxCapacity: Math.round(43_713 * 1.25), yearBuilt: 2014,
    photo: 'Allianz_Parque.jpg',
    tiers: TIERS_MEDIO,
    expansions: expansionStages(43_713, TIERS_MEDIO),
  },

  // ── CORINTHIANS ─────────────────────────────────────────
  neo_quimica: {
    id: 'neo_quimica', name: 'Neo Química Arena',
    clubId: 'cor', city: 'São Paulo', state: 'SP',
    capacity: 48_234, maxCapacity: Math.round(48_234 * 1.25), yearBuilt: 2014,
    photo: 'ARENA_CORINTHIANS.jpg',
    tiers: TIERS_MEDIO,
    expansions: expansionStages(48_234, TIERS_MEDIO),
  },

  // ── SANTOS ──────────────────────────────────────────────
  vila_belmiro: {
    id: 'vila_belmiro', name: 'Vila Belmiro',
    clubId: 'san', city: 'Santos', state: 'SP',
    capacity: 15_637, maxCapacity: Math.round(15_637 * 1.25), yearBuilt: 1916,
    photo: 'Vila_Belmiro_pre-match_Santos_vs_Grêmio_2021.jpg',
    tiers: TIERS_PEQUENO,
    expansions: expansionStages(15_637, TIERS_PEQUENO),
  },

  // ── BRAGANTINO ──────────────────────────────────────────
  nabi_chedid: {
    id: 'nabi_chedid', name: 'Estádio Nabi Abi Chedid',
    clubId: 'bra', city: 'Bragança Paulista', state: 'SP',
    capacity: 19_866, maxCapacity: Math.round(19_866 * 1.25), yearBuilt: 1970,
    photo: 'Estádio_Nabi.jpg',
    tiers: TIERS_PEQUENO,
    expansions: expansionStages(19_866, TIERS_PEQUENO),
  },

  // ── FLAMENGO ────────────────────────────────────────────
  maracana: {
    id: 'maracana', name: 'Estádio Jornalista Mário Filho (Maracanã)',
    clubId: 'fla', coClubs: ['fla'], city: 'Rio de Janeiro', state: 'RJ',
    capacity: 78_838, maxCapacity: 78_838, yearBuilt: 1950,
    photo: 'Maracana_2022.jpg',
    tiers: TIERS_GRANDE,
    expansions: [],  // estádio público — sem expansão
  },

  // ── VASCO ───────────────────────────────────────────────
  sao_januario: {
    id: 'sao_januario', name: 'Estádio São Januário',
    clubId: 'vas', city: 'Rio de Janeiro', state: 'RJ',
    capacity: 21_880, maxCapacity: Math.round(21_880 * 1.25), yearBuilt: 1927,
    photo: 'Estadio_sao_januario_cropp.jpg',
    tiers: TIERS_PEQUENO,
    expansions: expansionStages(21_880, TIERS_PEQUENO),
  },

  // ── BOTAFOGO ────────────────────────────────────────────
  nilton_santos: {
    id: 'nilton_santos', name: 'Estádio Nilton Santos (Engenhão)',
    clubId: 'bot', city: 'Rio de Janeiro', state: 'RJ',
    capacity: 46_831, maxCapacity: Math.round(46_831 * 1.25), yearBuilt: 2007,
    photo: 'Botafogo_2x2_Avaí,_2009,_Estádio_Nilton_Santos.jpg',
    tiers: TIERS_MEDIO,
    expansions: expansionStages(46_831, TIERS_MEDIO),
  },

  // ── GRÊMIO ──────────────────────────────────────────────
  arena_gremio: {
    id: 'arena_gremio', name: 'Arena do Grêmio',
    clubId: 'gre', city: 'Porto Alegre', state: 'RS',
    capacity: 60_540, maxCapacity: Math.round(60_540 * 1.25), yearBuilt: 2012,
    photo: 'Arena_do_Grêmio_2014.jpg',
    tiers: TIERS_GRANDE,
    expansions: expansionStages(60_540, TIERS_GRANDE),
  },

  // ── INTERNACIONAL ───────────────────────────────────────
  beira_rio: {
    id: 'beira_rio', name: 'Estádio Beira-Rio',
    clubId: 'int', city: 'Porto Alegre', state: 'RS',
    capacity: 51_300, maxCapacity: Math.round(51_300 * 1.25), yearBuilt: 1969,
    photo: 'Beira_Rio_Stadium.JPG',
    tiers: TIERS_GRANDE,
    expansions: expansionStages(51_300, TIERS_GRANDE),
  },

  // ── ATLÉTICO-MG ─────────────────────────────────────────
  arena_mrv: {
    id: 'arena_mrv', name: 'Arena MRV',
    clubId: 'atl', city: 'Belo Horizonte', state: 'MG',
    capacity: 47_465, maxCapacity: Math.round(47_465 * 1.25), yearBuilt: 2023,
    photo: 'Arena-mrv-2025.jpg',
    tiers: TIERS_MEDIO,
    expansions: expansionStages(47_465, TIERS_MEDIO),
  },

  // ── CRUZEIRO ────────────────────────────────────────────
  mineirao: {
    id: 'mineirao', name: 'Estádio Governador Magalhães Pinto (Mineirão)',
    clubId: 'cru', coClubs: ['atl'], city: 'Belo Horizonte', state: 'MG',
    capacity: 62_162, maxCapacity: 62_162, yearBuilt: 1965,
    photo: 'Mineirão_(Top_View).jpg',
    tiers: TIERS_GRANDE,
    expansions: [],  // estádio público — sem expansão
  },

  // ── AMÉRICA-MG ──────────────────────────────────────────
  independencia: {
    id: 'independencia', name: 'Estádio Independência',
    clubId: 'ame', city: 'Belo Horizonte', state: 'MG',
    capacity: 23_256, maxCapacity: Math.round(23_256 * 1.25), yearBuilt: 1950,
    photo: 'Arena_Independência_-_Atlético_x_Fluminense.jpg',
    tiers: TIERS_PEQUENO,
    expansions: expansionStages(23_256, TIERS_PEQUENO),
  },

  // ── ATHLETICO-PR ────────────────────────────────────────
  arena_da_baixada: {
    id: 'arena_da_baixada', name: 'Arena da Baixada',
    clubId: 'cap', city: 'Curitiba', state: 'PR',
    capacity: 43_900, maxCapacity: Math.round(43_900 * 1.25), yearBuilt: 1914,
    photo: 'Arena-fifa-wc-2014_(9).jpg',
    tiers: TIERS_MEDIO,
    expansions: expansionStages(43_900, TIERS_MEDIO),
  },

  // ── FORTALEZA ───────────────────────────────────────────
  castelao: {
    id: 'castelao', name: 'Arena Castelão',
    clubId: 'for', coClubs: ['cru2'], city: 'Fortaleza', state: 'CE',
    capacity: 67_000, maxCapacity: 67_000, yearBuilt: 1973,
    photo: 'Fortaleza_Arena_on_March_2014..jpg',
    tiers: TIERS_GRANDE,
    expansions: [],  // estádio público — sem expansão
  },

  // ── CEARÁ ───────────────────────────────────────────────
  presidente_vargas: {
    id: 'presidente_vargas', name: 'Estádio Presidente Vargas',
    clubId: 'cru2', city: 'Fortaleza', state: 'CE',
    capacity: 20_000, maxCapacity: Math.round(20_000 * 1.25), yearBuilt: 1940,
    photo: 'Estádio_Presidente_Vargas._Esporte_Clube_Internacional.JPG',
    tiers: TIERS_PEQUENO,
    expansions: expansionStages(20_000, TIERS_PEQUENO),
  },

  // ── BAHIA ───────────────────────────────────────────────
  fonte_nova: {
    id: 'fonte_nova', name: 'Arena Fonte Nova',
    clubId: 'bah', city: 'Salvador', state: 'BA',
    capacity: 48_747, maxCapacity: Math.round(48_747 * 1.25), yearBuilt: 2013,
    photo: 'Arena_Fonte_Nova_view_from_lake_(zoom).jpg',
    tiers: TIERS_MEDIO,
    expansions: expansionStages(48_747, TIERS_MEDIO),
  },

  // ── SPORT ───────────────────────────────────────────────
  arruda: {
    id: 'arruda', name: 'Estádio do Arruda',
    clubId: 'spo', city: 'Recife', state: 'PE',
    capacity: 60_044, maxCapacity: Math.round(60_044 * 1.25), yearBuilt: 1960,
    photo: 'Arruda_Stadium.jpg',
    tiers: TIERS_GRANDE,
    expansions: expansionStages(60_044, TIERS_GRANDE),
  },

  // ── GOIÁS ───────────────────────────────────────────────
  serra_dourada: {
    id: 'serra_dourada', name: 'Estádio Serra Dourada',
    clubId: 'goi', city: 'Goiânia', state: 'GO',
    capacity: 51_000, maxCapacity: Math.round(51_000 * 1.25), yearBuilt: 1975,
    photo: 'Serra_Dourada_Stadium.png',
    tiers: TIERS_GRANDE,
    expansions: expansionStages(51_000, TIERS_GRANDE),
  },

  // ── CSA ─────────────────────────────────────────────────
  rei_pele: {
    id: 'rei_pele', name: 'Estádio Rei Pelé',
    clubId: 'csa', city: 'Maceió', state: 'AL',
    capacity: 16_000, maxCapacity: Math.round(16_000 * 1.25), yearBuilt: 1970,
    photo: 'Rei_Pelé.jpg',
    tiers: TIERS_PEQUENO,
    expansions: expansionStages(16_000, TIERS_PEQUENO),
  },
}

// ── Mapa clube → estádio ─────────────────────────────────
export const CLUB_STADIUM: Record<string, string> = {
  spfc:      'morumbi',
  palmeiras: 'allianz',
  cor:       'neo_quimica',
  san:       'vila_belmiro',
  bra:       'nabi_chedid',
  fla:       'maracana',
  vas:       'sao_januario',
  bot:       'nilton_santos',
  gre:       'arena_gremio',
  int:       'beira_rio',
  atl:       'arena_mrv',
  cru:       'mineirao',
  ame:       'independencia',
  cap:       'arena_da_baixada',
  for:       'castelao',
  cru2:      'presidente_vargas',
  bah:       'fonte_nova',
  spo:       'arruda',
  goi:       'serra_dourada',
  csa:       'rei_pele',
}

// ── Engine de receita por jogo ───────────────────────────

export type MatchImportance = 'normal' | 'classico' | 'final'

const IMPORTANCE_MULT: Record<MatchImportance, number> = {
  normal:   1.0,
  classico: 1.3,
  final:    1.8,
}

// Ocupação base por importância — final sempre lotada
const OCCUPANCY_BASE: Record<MatchImportance, number> = {
  normal:   0.65,
  classico: 0.90,
  final:    1.00,
}

// Variação máxima por tipo (±): normal ±12%, clássico ±6%, final = 0 (sempre cheio)
const OCCUPANCY_VARIANCE: Record<MatchImportance, number> = {
  normal:   0.12,
  classico: 0.06,
  final:    0.00,
}

// PRNG simples (mulberry32) — determinístico por seed, sem Math.random()
function seededRandom(seed: number): number {
  let t = seed + 0x6D2B79F5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export interface TicketRevenue {
  attendance: number
  revenue:    number
  breakdown:  { tier: string; seats: number; price: number; subtotal: number }[]
}

export function calcTicketRevenue(
  stadiumId: string,
  importance: MatchImportance = 'normal',
  currentCapacity?: number,
  customPrices?: Record<string, number>,  // { Popular: 80, Cadeira: 150, Camarote: 400 }
  matchSeed?: number,                     // número do jogo (round) para flutuação determinística
): TicketRevenue {
  const stadium = STADIUMS[stadiumId]
  if (!stadium) return { attendance: 0, revenue: 0, breakdown: [] }

  const cap      = currentCapacity ?? stadium.capacity
  const mult     = IMPORTANCE_MULT[importance]
  const base     = OCCUPANCY_BASE[importance]
  const variance = OCCUPANCY_VARIANCE[importance]

  // Flutuação: gera número em [-variance, +variance] baseado no seed do jogo
  const rng      = matchSeed !== undefined ? seededRandom(matchSeed) : 0.5
  const swing    = (rng - 0.5) * 2 * variance        // ex: [-0.12, +0.12]
  const occupancy = Math.min(1.0, Math.max(0.3, base + swing))

  const attendance = Math.round(cap * occupancy)

  const breakdown = stadium.tiers.map(t => {
    const basePrice = customPrices?.[t.name] ?? t.price
    const seats     = Math.round(attendance * t.ratio)
    const price     = Math.round(basePrice * mult)
    return { tier: t.name, seats, price, subtotal: seats * price }
  })

  return {
    attendance,
    revenue: breakdown.reduce((s, b) => s + b.subtotal, 0),
    breakdown,
  }
}

// ── Engine de expansão ───────────────────────────────────

export interface ExpansionResult {
  ok:      boolean
  message: string
  newCapacity?: number
  cost?:   number
  weeks?:  number
}

export function getNextExpansion(
  stadiumId: string,
  currentCapacity: number,
): StadiumExpansionStage | null {
  const stadium = STADIUMS[stadiumId]
  if (!stadium || stadium.expansions.length === 0) return null

  // Próxima etapa = primeira cuja capacidade somada > capacidade atual
  let accumulated = stadium.capacity
  for (const stage of stadium.expansions) {
    accumulated += stage.addedSeats
    if (currentCapacity < accumulated) return stage
  }
  return null  // todas as etapas concluídas
}

export function startExpansion(
  stadiumId: string,
  currentCapacity: number,
  budget: number,
): ExpansionResult {
  const stage = getNextExpansion(stadiumId, currentCapacity)
  if (!stage) return { ok: false, message: 'Estádio já está na capacidade máxima.' }
  if (budget < stage.cost) return { ok: false, message: `Saldo insuficiente. Necessário: R$ ${stage.cost.toLocaleString('pt-BR')}` }

  return {
    ok:          true,
    message:     `Obra iniciada! +${stage.addedSeats.toLocaleString('pt-BR')} assentos em ${stage.weeks} semanas.`,
    newCapacity: currentCapacity + stage.addedSeats,
    cost:        stage.cost,
    weeks:       stage.weeks,
  }
}
