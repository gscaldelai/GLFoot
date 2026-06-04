// ═══════════════════════════════════════════════════════
//  GLfoot — Fatigue Engine (Modo Carreira)
//
//  Validado em teste de mesa: 5 jogadores × 10 rodadas
//  (2 semanas duplas — R6 e R9)
//
//  Resultados esperados @R10:
//    GK  31 anos : fadiga ≈ 0.00  (praticamente não cansa)
//    LAT 24 anos : fadiga ≈ 0.16  (-1.9 forca efetiva)
//    VOL 24 anos : fadiga ≈ 0.04  (-0.5 forca efetiva)
//    MEI 29 anos : fadiga ≈ 0.29  (-3.4 forca efetiva)
//    ATA 35 anos : fadiga ≈ 0.92  (-11 forca efetiva) ← precisa descanso
//
//  Impacto no λ Poisson: elenco com fadiga 0.5 perde ~0.24 λ
//  NÃO alterar constantes sem refazer o teste de mesa
// ═══════════════════════════════════════════════════════

import type { Player, Pos } from './types'

// ── Ganho de fadiga por partida jogada (base, sem modificador) ───────────────
const FATIGUE_GAIN: Record<Pos, number> = {
  ATA: 0.12,   // maior percurso ofensivo
  LAT: 0.11,   // sobe e desce constantemente
  MEI: 0.10,   // cobre todo o campo
  VOL: 0.09,
  ZAG: 0.08,   // principalmente posicional
  GK:  0.05,   // quase sem corrida
}

// ── Recuperação base por tipo de semana ─────────────────────────────────────
const REC_NORMAL = 0.15   // 1 jogo / semana — descanso completo
const REC_DOUBLE = 0.08   // 2 jogos / semana — menos tempo de recuperação

// ── Modificadores de idade ───────────────────────────────────────────────────
function ageGainMod(age: number): number {
  if (age < 23)  return 0.85   // jovem, aguenta mais
  if (age <= 28) return 1.00   // auge físico
  if (age <= 32) return 1.15   // começa a sentir
  return 1.30                   // veterano, cansa mais rápido
}

function ageRecMod(age: number): number {
  if (age < 23)  return 1.20   // recuperação acelerada
  if (age <= 28) return 1.00
  if (age <= 32) return 0.85
  return 0.70                   // recuperação lenta
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Ganho de fadiga de uma partida para um jogador
 * (sem aplicar — só o delta bruto)
 */
export function calcFatigueGain(player: Player): number {
  return FATIGUE_GAIN[player.pos] * ageGainMod(player.age)
}

/**
 * Recuperação de uma rodada para um jogador
 */
export function calcRecovery(player: Player, isDoubleWeek: boolean): number {
  return (isDoubleWeek ? REC_DOUBLE : REC_NORMAL) * ageRecMod(player.age)
}

/**
 * Determina aleatoriamente se a rodada é semana dupla.
 * Rodadas 10–28 têm 35% de chance (período mais congestionado do Brasileirão).
 * Chamado uma vez por nextRound() — resultado não é armazenado no estado.
 */
export function rollDoubleWeek(round: number): boolean {
  return round >= 10 && round <= 28 && Math.random() < 0.35
}

/**
 * Aplica fadiga de partida + recuperação a um titular.
 * Em semana dupla: ganho × 2, recuperação base reduzida.
 */
export function applyMatchFatigue(player: Player, isDoubleWeek: boolean): Player {
  const gain = calcFatigueGain(player) * (isDoubleWeek ? 2 : 1)
  const rec  = calcRecovery(player, isDoubleWeek)
  const raw  = player.fatigue + gain - rec
  return { ...player, fatigue: Math.round(Math.max(0, Math.min(1, raw)) * 1000) / 1000 }
}

/**
 * Aplica apenas recuperação a um reserva que não jogou.
 */
export function applyBenchRecovery(player: Player, isDoubleWeek: boolean): Player {
  const rec = calcRecovery(player, isDoubleWeek)
  const raw = player.fatigue - rec
  return { ...player, fatigue: Math.round(Math.max(0, raw) * 1000) / 1000 }
}

/**
 * Força efetiva levando em conta fadiga.
 * Penalidade: até −12 pts com fadiga = 1.0
 * Mínimo absoluto: 55
 *
 * Para times bot (fatigue sempre 0): effectiveForca === forca
 * → calcLambda recebe o mesmo valor de avgSquad, sem mudança de comportamento
 */
export function effectiveForca(player: Player): number {
  return Math.max(55, Math.round((player.forca - player.fatigue * 12) * 10) / 10)
}

/**
 * Média efetiva do elenco — substitui avgSquad no cálculo do λ Poisson.
 *
 * Condição de ativação:
 *   - Time do jogador: usa fatigue real (atualizada após cada partida)
 *   - Times bot: fatigue === 0 sempre → retorna o mesmo que avgSquad
 */
export function effectiveAvgSquad(squad: Player[]): number {
  if (!squad.length) return 0
  return Math.round(
    squad.reduce((s, p) => s + effectiveForca(p), 0) / squad.length * 10
  ) / 10
}

/**
 * Reseta a fadiga de um elenco para 0 (início de temporada / pré-season).
 */
export function resetFatigue(players: Player[]): Player[] {
  return players.map(p => ({ ...p, fatigue: 0 }))
}

// ── Fadiga simulada para times bot ───────────────────────────────────────────
//
//  Faixas validadas em mesa — refletem o calendário do Brasileirão:
//
//  Fase            Rodadas  Mín   Máx   Motivo
//  ─────────────── ──────── ───── ───── ─────────────────────────────────────
//  Início          1–5      0.03  0.15  Pré-temporada recente, ritmo baixo
//  Aquecimento     6–10     0.08  0.22  Copa do Brasil estreia
//  1ª sem. dupla   11–15    0.13  0.30  Copa BR oitavas + Sul-Am grupos
//  Pico            16–20    0.20  0.42  3 torneios simultâneos
//  Pico            21–25    0.22  0.45  Quartas/semis de copa + Brasileirão
//  Descompressão   26–30    0.16  0.35  Copas chegando ao fim
//  Reta final      31–38    0.10  0.38  Alta variância: líderes poupam, rebaixados forçam

const BOT_FATIGUE_PHASES = [
  { from:  1, to:  5, min: 0.03, max: 0.15 },
  { from:  6, to: 10, min: 0.08, max: 0.22 },
  { from: 11, to: 15, min: 0.13, max: 0.30 },
  { from: 16, to: 20, min: 0.20, max: 0.42 },
  { from: 21, to: 25, min: 0.22, max: 0.45 },
  { from: 26, to: 30, min: 0.16, max: 0.35 },
  { from: 31, to: 38, min: 0.10, max: 0.38 },
] as const

/**
 * Aplica fadiga aleatória a cada jogador de um time bot adversário.
 *
 * Lazy — calculado apenas no momento em que o jogo começa (handleJogar).
 * Sem persistência: cada partida gera um estado de fadiga novo para o bot.
 *
 * Para times reais (player's team), não chamar esta função —
 * a fadiga deles é rastreada continuamente no useLineupStore.
 */
export function withBotFatigue(squad: Player[], round: number): Player[] {
  const phase = BOT_FATIGUE_PHASES.find(p => round >= p.from && round <= p.to)
    ?? BOT_FATIGUE_PHASES[BOT_FATIGUE_PHASES.length - 1]

  return squad.map(p => ({
    ...p,
    fatigue: Math.round(
      (phase.min + Math.random() * (phase.max - phase.min)) * 1000
    ) / 1000,
  }))
}
