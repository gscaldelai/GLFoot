// Tabela interna de força dos clubes — não exibida ao usuário.
// Usada para lógica de freemium (bloqueio Free ≤ 50) e testes de cenário.
// Para testar: importe CLUB_STRENGTH e altere os valores livremente.

export interface ClubStrengthEntry {
  id:         string
  name:       string
  division:   1 | 2 | 3
  forcaMedia: number   // média calculada do elenco (cache)
  tier:       'S' | 'A' | 'B' | 'C'  // classificação qualitativa
}

export const CLUB_STRENGTH: ClubStrengthEntry[] = [
  { id: 'spfc',      name: 'São Paulo FC', division: 1, forcaMedia: 73,   tier: 'A' },
  { id: 'palmeiras', name: 'Palmeiras',    division: 1, forcaMedia: 74.4, tier: 'A' },
  // ── Série A (placeholders — adicionar ao cadastrar clubes) ──
  // { id: 'flamengo',  name: 'Flamengo',    division: 1, forcaMedia: 78,   tier: 'S' },
  // { id: 'atletico',  name: 'Atlético-MG', division: 1, forcaMedia: 76,   tier: 'S' },
  // { id: 'corinthians', name: 'Corinthians', division: 1, forcaMedia: 70, tier: 'A' },
  // ── Série B (placeholders) ──
  // { id: 'coritiba',  name: 'Coritiba',    division: 2, forcaMedia: 58,   tier: 'B' },
  // ── Série C (placeholders) ──
  // { id: 'abc',       name: 'ABC',         division: 3, forcaMedia: 44,   tier: 'C' },
]

// Retorna a força de um clube pelo id, ou null se não cadastrado.
export function getClubStrength(id: string): ClubStrengthEntry | undefined {
  return CLUB_STRENGTH.find(e => e.id === id)
}

// Verifica se um clube está disponível no plano Free (força ≤ 50).
export function isAvailableOnFree(id: string): boolean {
  const entry = getClubStrength(id)
  if (!entry) return true   // clube sem registro passa por padrão
  return entry.forcaMedia <= 50
}
