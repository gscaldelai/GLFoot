// ═══════════════════════════════════════════════════════
//  GLfoot — Fixture Engine
//
//  Gera o calendário completo de N times usando o método
//  da roda (circle method), garantindo que cada time
//  enfrente todos os outros exatamente 1× por turno.
//  38 rodadas = 19 do turno (ida) + 19 do returno (volta).
// ═══════════════════════════════════════════════════════

export interface FixtureGame {
  round:  number   // 1–38
  homeId: string
  awayId: string
}

/**
 * Gera o calendário completo de 38 rodadas.
 *
 * @param teamIds  Array com os IDs dos 20 clubes — deve ter comprimento par.
 *                 A ordem determina o sorteio inicial; embaralhe antes de passar.
 * @returns        Array de 380 FixtureGame (38 rodadas × 10 jogos cada)
 */
export function generateFixtures(teamIds: string[]): FixtureGame[] {
  const n = teamIds.length
  if (n % 2 !== 0) throw new Error(`generateFixtures: número de times deve ser par (recebeu ${n})`)

  const fixtures: FixtureGame[] = []
  const ids = [...teamIds]

  // ── Turno (rodadas 1 a n-1) ──────────────────────────────────────────────
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const home = ids[i]
      const away = ids[n - 1 - i]
      // Paridade: nas rodadas ímpares, inverte quem manda (distribui mandos)
      if (r % 2 === 0) {
        fixtures.push({ round: r + 1, homeId: home, awayId: away })
      } else {
        fixtures.push({ round: r + 1, homeId: away, awayId: home })
      }
    }
    // Rotação: fixa ids[0], desloca os demais um passo anti-horário
    const last = ids[n - 1]
    for (let i = n - 1; i > 1; i--) ids[i] = ids[i - 1]
    ids[1] = last
  }

  // ── Returno (rodadas n a 2n-2): inverte mandos do turno ─────────────────
  const halfLen = fixtures.length
  for (let i = 0; i < halfLen; i++) {
    const g = fixtures[i]
    fixtures.push({ round: g.round + (n - 1), homeId: g.awayId, awayId: g.homeId })
  }

  return fixtures
}

/**
 * Retorna todos os jogos de um clube em uma rodada específica.
 * Normalmente retorna 1 jogo; pode retornar 0 em casos extremos.
 */
export function getClubFixture(
  fixtures: FixtureGame[],
  clubId: string,
  round: number,
): FixtureGame | undefined {
  return fixtures.find(
    f => f.round === round && (f.homeId === clubId || f.awayId === clubId),
  )
}

/**
 * Retorna o próximo jogo de um clube a partir de uma rodada (inclusive).
 */
export function getNextFixture(
  fixtures: FixtureGame[],
  clubId: string,
  fromRound: number,
): FixtureGame | undefined {
  return fixtures
    .filter(f => f.round >= fromRound && (f.homeId === clubId || f.awayId === clubId))
    .sort((a, b) => a.round - b.round)[0]
}

/**
 * Retorna todos os jogos passados de um clube (round < fromRound), ordem decrescente.
 */
export function getPastFixtures(
  fixtures: FixtureGame[],
  clubId: string,
  beforeRound: number,
  limit = 10,
): FixtureGame[] {
  return fixtures
    .filter(f => f.round < beforeRound && (f.homeId === clubId || f.awayId === clubId))
    .sort((a, b) => b.round - a.round)
    .slice(0, limit)
}
