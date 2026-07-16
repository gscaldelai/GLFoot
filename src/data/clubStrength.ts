// ════════════════════════════════════════════════════════
//  GLfoot — Força dos clubes
//
//  NÃO existe mais sistema de Tiers (S/A/B/C). A força de um clube é a
//  MÉDIA DOS ATLETAS do elenco (titulares + banco) — é ela que baliza
//  metas contratuais, convites a técnicos, transferências e empréstimos.
//
//  Base de cálculo: elenco + banco (16 atletas). Não usar só o XI, senão
//  o técnico mexeria no próprio gating só reordenando a escalação.
//  (O λ do matchEngine continua usando avgSquad do XI — são coisas
//  diferentes de propósito: força institucional vs. força em campo.)
//
//  As FAIXAS abaixo são implementação interna (traduzem força → meta e
//  força → reputação mínima). A letra NUNCA aparece na UI: o jogador vê
//  a força numérica e um rótulo ("Grande Clube").
//  Limiares validados em scripts/test-force-bands.js: reproduzem 20/20
//  os tiers que existiam antes.
// ════════════════════════════════════════════════════════
import type { Player } from '@/engines/types'
import { CLUBS_MAP } from '@/data/clubs'
import { avgSquad } from '@/engines/matchEngine'

export interface ClubStrengthEntry {
  id:       string
  name:     string
  division: 1 | 2 | 3
}

export const CLUB_STRENGTH: ClubStrengthEntry[] = [
  { id:'fla',  name:'Flamengo',      division:1 },
  { id:'atl',  name:'Atlético-MG',   division:1 },
  { id:'palm', name:'Palmeiras',     division:1 },
  { id:'spfc', name:'São Paulo FC',  division:1 },
  { id:'bot',  name:'Botafogo',      division:1 },
  { id:'int',  name:'Internacional', division:1 },
  { id:'cor',  name:'Corinthians',   division:1 },
  { id:'cru',  name:'Cruzeiro',      division:1 },
  { id:'gre',  name:'Grêmio',        division:1 },
  { id:'cap',  name:'Athletico-PR',  division:1 },
  { id:'bra',  name:'Bragantino',    division:1 },
  { id:'for',  name:'Fortaleza',     division:1 },
  { id:'vas',  name:'Vasco da Gama', division:1 },
  { id:'bah',  name:'Bahia',         division:1 },
  { id:'san',  name:'Santos',        division:1 },
  { id:'goi',  name:'Goiás',         division:1 },
  { id:'ame',  name:'América-MG',    division:1 },
  { id:'cru2', name:'Ceará',         division:1 },
  { id:'spo',  name:'Sport',         division:1 },
  { id:'csa',  name:'CSA',           division:1 },
]

export function getClubStrength(id: string): ClubStrengthEntry | undefined {
  return CLUB_STRENGTH.find(e => e.id === id)
}

/** Força de um clube sem elenco conhecido (id desconhecido). Defensivo. */
const FORCE_FALLBACK = 60

/**
 * Força do clube = média dos atletas (elenco + banco).
 *
 * `override` é o elenco VIVO — usado para o clube do jogador, cujo elenco muda
 * com transferências e envelhecimento (useLineupStore: slots + bench). Sem
 * override, usa o elenco do JSON (é o caso dos 19 bots, cujo elenco é estático).
 */
export function clubForce(id: string, override?: Player[]): number {
  if (override && override.length) return avgSquad(override)
  const club = CLUBS_MAP[id]
  if (!club) return FORCE_FALLBACK
  return avgSquad([...club.squad, ...club.bench])
}

// ── Faixas de força (implementação interna — não expor a letra na UI) ────────
export const FORCE_BANDS = { S: 75, A: 68.5, B: 61 } as const
export type ForceBand = 'S' | 'A' | 'B' | 'C'

export function forceBand(force: number): ForceBand {
  if (force >= FORCE_BANDS.S) return 'S'
  if (force >= FORCE_BANDS.A) return 'A'
  if (force >= FORCE_BANDS.B) return 'B'
  return 'C'
}

// Rótulos de produto — é isto que o jogador lê, junto da força numérica
const BAND_LABEL: Record<ForceBand, string> = {
  S: 'Elite Nacional',
  A: 'Grande Clube',
  B: 'Clube Médio',
  C: 'Clube Pequeno',
}

export function forceLabel(force: number): string {
  return BAND_LABEL[forceBand(force)]
}

/**
 * Free: clubes médios e pequenos. Premium desbloqueia os grandes.
 *
 * SEMPRE sobre a força ESTÁTICA do JSON (sem override): usar o elenco vivo aqui
 * deixaria o gating oscilar com as transferências — um usuário Free acabaria com
 * um clube Premium (ou o contrário). O gating é revalidado em 3 caminhos do
 * ClubSelect (R-12) e os três precisam consultar esta mesma função pura.
 */
export function isAvailableOnFree(id: string): boolean {
  return clubForce(id) < FORCE_BANDS.A
}
