export interface ClubStrengthEntry {
  id:         string
  name:       string
  division:   1 | 2 | 3
  forcaMedia: number
  tier:       'S' | 'A' | 'B' | 'C'
}

export const CLUB_STRENGTH: ClubStrengthEntry[] = [
  // ── Tier S ──────────────────────────────────────────────────
  { id:'fla',  name:'Flamengo',      division:1, forcaMedia:78,   tier:'S' },
  { id:'atl',  name:'Atlético-MG',   division:1, forcaMedia:76,   tier:'S' },
  // ── Tier A ──────────────────────────────────────────────────
  { id:'palm', name:'Palmeiras',division:1, forcaMedia:74.4, tier:'A' },
  { id:'spfc', name:'São Paulo FC',  division:1, forcaMedia:73,   tier:'A' },
  { id:'bot',  name:'Botafogo',      division:1, forcaMedia:73,   tier:'A' },
  { id:'int',  name:'Internacional', division:1, forcaMedia:72,   tier:'A' },
  { id:'cor',  name:'Corinthians',   division:1, forcaMedia:71,   tier:'A' },
  { id:'cru',  name:'Cruzeiro',      division:1, forcaMedia:71,   tier:'A' },
  { id:'gre',  name:'Grêmio',        division:1, forcaMedia:70,   tier:'A' },
  // ── Tier B ──────────────────────────────────────────────────
  { id:'cap',  name:'Athletico-PR',  division:1, forcaMedia:68,   tier:'B' },
  { id:'bra',  name:'Bragantino',    division:1, forcaMedia:67,   tier:'B' },
  { id:'for',  name:'Fortaleza',     division:1, forcaMedia:67,   tier:'B' },
  { id:'vas',  name:'Vasco da Gama', division:1, forcaMedia:66,   tier:'B' },
  { id:'bah',  name:'Bahia',         division:1, forcaMedia:65,   tier:'B' },
  { id:'san',  name:'Santos',        division:1, forcaMedia:65,   tier:'B' },
  // ── Tier C ──────────────────────────────────────────────────
  { id:'goi',  name:'Goiás',         division:1, forcaMedia:58,   tier:'C' },
  { id:'ame',  name:'América-MG',    division:1, forcaMedia:56,   tier:'C' },
  { id:'cru2', name:'Ceará',         division:1, forcaMedia:55,   tier:'C' },
  { id:'spo',  name:'Sport',         division:1, forcaMedia:54,   tier:'C' },
  { id:'csa',  name:'CSA',           division:1, forcaMedia:52,   tier:'C' },
]

export function getClubStrength(id: string): ClubStrengthEntry | undefined {
  return CLUB_STRENGTH.find(e => e.id === id)
}

// Free: clubes médios e pequenos (tier B e C). Premium desbloqueia os grandes
// (tier S e A: Flamengo, Palmeiras, São Paulo, Corinthians, Grêmio, etc.).
// Todos os 20 clubes têm elenco completo (11+5), então qualquer tier é jogável.
export function isAvailableOnFree(id: string): boolean {
  const entry = getClubStrength(id)
  if (!entry) return true
  return entry.tier === 'B' || entry.tier === 'C'
}
