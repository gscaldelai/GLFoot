import type { Club } from '@/engines/types'

// ── Clubes jogáveis (elencos reais, detalhados) ──────────────
import spfc      from './spfc.json'
import palmeiras from './palmeiras.json'

// ── Clubes bot (elencos gerados por generate-bot-squads.js) ──
import fla  from './fla.json'
import atl  from './atl.json'
import bot  from './bot.json'
import int_ from './int.json'
import cor  from './cor.json'
import cru  from './cru.json'
import gre  from './gre.json'
import cap  from './cap.json'
import bra  from './bra.json'
import for_ from './for.json'
import vas  from './vas.json'
import bah  from './bah.json'
import san  from './san.json'
import goi  from './goi.json'
import ame  from './ame.json'
import cru2 from './cru2.json'
import spo  from './spo.json'
import csa  from './csa.json'

export const CLUBS: Club[] = [
  spfc,      palmeiras,
  fla,  atl, bot,  int_ as unknown as Club,
  cor,  cru, gre,  cap,
  bra,  for_ as unknown as Club, vas, bah,
  san,  goi, ame,  cru2,
  spo,  csa,
].map(c => c as unknown as Club)

export const CLUBS_MAP: Record<string, Club> = Object.fromEntries(
  CLUBS.map(c => [c.id, c])
)

export function getClub(id: string): Club | undefined {
  return CLUBS_MAP[id]
}
