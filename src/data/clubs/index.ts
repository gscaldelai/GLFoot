import type { Club } from '@/engines/types'
import spfc from './spfc.json'
import palmeiras from './palmeiras.json'

export const CLUBS: Club[] = [
  spfc as unknown as Club,
  palmeiras as unknown as Club,
]

export const CLUBS_MAP: Record<string, Club> = Object.fromEntries(
  CLUBS.map(c => [c.id, c])
)

export function getClub(id: string): Club {
  const c = CLUBS_MAP[id]
  if (!c) throw new Error(`Club not found: ${id}`)
  return c
}
