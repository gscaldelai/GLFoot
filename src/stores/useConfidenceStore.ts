// ════════════════════════════════════════════════════════
//  GLfoot — Confidence Store
//  Medidores de confiança da Diretoria e da Torcida.
//
//  DIRETORIA — foco em finanças e posição na liga.
//  TORCIDA   — foco em resultados e emoção dos jogos.
//
//  Disparos de demissão:
//    • Qualquer medidor chega a 0             → demissão imediata
//    • Diretoria < 20 por 3 rodadas seguidas  → demissão pelo clube
//    • Torcida   < 15 por 2 rodadas seguidas  → pressão irresistível
//    • Ambos simultaneamente < 35             → demissão combinada
// ════════════════════════════════════════════════════════
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GoalType } from '@/data/clubGoals'

// ── Tipos ────────────────────────────────────────────────
export type PressureLevel = 'normal' | 'alerta' | 'critico'

export interface ConfidenceEvent {
  round:       number
  season:      number
  source:      'diretoria' | 'torcida' | 'ambos'
  delta:       number     // positivo = ganho, negativo = perda
  description: string
}

interface ConfidenceStore {
  diretoria:      number   // 0–100
  torcida:        number   // 0–100
  dirAlertRounds: number   // rodadas consecutivas abaixo do crítico
  torAlertRounds: number
  isFired:        boolean
  firedBy:        'diretoria' | 'torcida' | 'pressao_combinada' | null
  events:         ConfidenceEvent[]

  // Nível de pressão derivado
  dirLevel: () => PressureLevel
  torLevel: () => PressureLevel

  // Eventos de partida
  onMatchResult: (params: MatchResultParams) => void

  // Fim de temporada
  onSeasonEnd: (finalPosition: number, goalType: GoalType) => void

  // Eliminação de copa
  onCupElimination: (compName: string, phase: string, round: number, season: number, prestige: number) => void

  // Verificação financeira (chamar a cada 4 rodadas)
  onFinanceCheck: (budgetRatio: number, round: number, season: number) => void

  // Reseta para nova carreira
  reset: () => void

  // "Continuar (debug)": limpa a demissão e devolve os medidores acima do alerta
  clearFired: () => void
}

export interface MatchResultParams {
  round:        number
  season:       number
  isHomeGame:   boolean
  myGoals:      number
  oppGoals:     number
  isClassico:   boolean
  oppForce:     number     // força do adversário
  myForce:      number     // força do meu clube
}

// ── Helpers ──────────────────────────────────────────────
function clamp(v: number): number { return Math.max(0, Math.min(100, v)) }

function pressureLevel(v: number, thresholdAlert: number, thresholdCrit: number): PressureLevel {
  if (v <= thresholdCrit)  return 'critico'
  if (v <= thresholdAlert) return 'alerta'
  return 'normal'
}

// ── Store ────────────────────────────────────────────────
export const useConfidenceStore = create<ConfidenceStore>()(
  persist(
    (set, get) => ({
      diretoria:      70,
      torcida:        65,
      dirAlertRounds: 0,
      torAlertRounds: 0,
      isFired:        false,
      firedBy:        null,
      events:         [],

      dirLevel() { return pressureLevel(get().diretoria, 40, 22) },
      torLevel() { return pressureLevel(get().torcida,   35, 18) },

      onMatchResult(p) {
        const s = get()
        if (s.isFired) return

        const won  = p.myGoals > p.oppGoals
        const drew = p.myGoals === p.oppGoals
        const lost = p.myGoals < p.oppGoals
        const isGoleada = lost && (p.oppGoals - p.myGoals) >= 3
        // Upset: perder para time muito mais fraco / vencer muito mais forte
        const forceDiff = p.myForce - p.oppForce

        // ── TORCIDA ──────────────────────────────────────
        let torDelta = 0

        if (won)  torDelta += p.isClassico ? 10 : 4
        if (drew) torDelta += p.isClassico ? -2 : 1
        if (lost) torDelta += p.isClassico ? -14 : -5

        if (isGoleada)           torDelta -= 8   // goleada sofrida
        if (won && p.myGoals >= 3) torDelta += 3 // golear adversário
        if (won && forceDiff < -10) torDelta += 4 // vitória de zebra
        if (lost && forceDiff > 15) torDelta -= 4 // derrota inesperada

        // ── DIRETORIA ────────────────────────────────────
        // Diretoria é mais fria — reage a resultados inesperados
        let dirDelta = 0

        if (won)  dirDelta += 2
        if (drew) dirDelta += 0
        if (lost) dirDelta -= 3

        if (lost && forceDiff > 15) dirDelta -= 5  // derrota vergonhosa
        if (won  && forceDiff < -10) dirDelta += 3  // vitória importante
        if (isGoleada)               dirDelta -= 3

        // Registra eventos
        const evts: ConfidenceEvent[] = []
        if (torDelta !== 0) evts.push({
          round: p.round, season: p.season, source: 'torcida', delta: torDelta,
          description: won
            ? (p.isClassico ? `Vitória no clássico!` : `Vitória na R${p.round}`)
            : drew ? `Empate — torcida menos animada`
            : isGoleada ? `Goleada sofrida — torcida revoltada`
            : p.isClassico ? `Derrota no clássico — torcida furiosa`
            : `Derrota na R${p.round}`,
        })
        if (dirDelta !== 0) evts.push({
          round: p.round, season: p.season, source: 'diretoria', delta: dirDelta,
          description: lost && forceDiff > 15
            ? `Derrota inesperada preocupa diretoria`
            : won ? `Resultado positivo` : `Resultado negativo`,
        })

        const newTor = clamp(s.torcida   + torDelta)
        const newDir = clamp(s.diretoria + dirDelta)

        // Acumuladores de rodadas críticas
        const newTorAlert = newTor <= 18 ? s.torAlertRounds + 1 : 0
        const newDirAlert = newDir <= 22 ? s.dirAlertRounds + 1 : 0

        // Checar demissão
        let isFired: boolean = s.isFired
        let firedBy: 'diretoria' | 'torcida' | 'pressao_combinada' | null = s.firedBy

        if (!isFired) {
          if (newDir === 0 || newTor === 0) {
            isFired = true; firedBy = newDir === 0 ? 'diretoria' : 'torcida'
          } else if (newDirAlert >= 3) {
            isFired = true; firedBy = 'diretoria'
          } else if (newTorAlert >= 2) {
            isFired = true; firedBy = 'torcida'
          } else if (newDir < 35 && newTor < 35) {
            isFired = true; firedBy = 'pressao_combinada'
          }
        }

        set(st => ({
          diretoria:      newDir,
          torcida:        newTor,
          dirAlertRounds: newDirAlert,
          torAlertRounds: newTorAlert,
          isFired,
          firedBy,
          events: [...evts, ...st.events].slice(0, 50),
        }))
      },

      onSeasonEnd(finalPosition, goalType) {
        const s = get()
        if (s.isFired) return

        // Avalia resultado vs meta
        const POSITION_TARGET: Record<GoalType, number> = {
          champion:      1,
          top4:          4,
          top8:          8,
          no_relegation: 16,
          survive:       19,
        }
        const target  = POSITION_TARGET[goalType]
        const beat    = finalPosition <= target
        const round   = 38
        const season  = s.events[0]?.season ?? 1

        let torDelta = 0
        let dirDelta = 0

        if (beat) {
          // Superou a meta
          torDelta = goalType === 'champion' ? 25 : 12
          dirDelta = goalType === 'champion' ? 20 : 10
        } else if (finalPosition <= target + 4) {
          // Ficou perto
          torDelta = 0
          dirDelta = -5
        } else {
          // Falhou feio
          torDelta = goalType === 'no_relegation' ? -30 : -12  // rebaixamento = catástrofe
          dirDelta = goalType === 'no_relegation' ? -35 : -15
        }

        const newTor = clamp(s.torcida   + torDelta)
        const newDir = clamp(s.diretoria + dirDelta)
        const evts: ConfidenceEvent[] = [
          {
            round, season, source: 'ambos', delta: torDelta,
            description: beat
              ? `Meta cumprida! ${finalPosition}º lugar`
              : `Meta não atingida (${finalPosition}º de ${target}º esperado)`,
          },
        ]

        let isFired: boolean = s.isFired
        let firedBy: 'diretoria' | 'torcida' | 'pressao_combinada' | null = s.firedBy
        if (!isFired && (newDir < 20 || newTor < 15)) {
          isFired = true
          firedBy = newDir < 20 ? 'diretoria' : 'torcida'
        }

        set(st => ({
          diretoria: newDir,
          torcida:   newTor,
          isFired,
          firedBy,
          events: [...evts, ...st.events].slice(0, 50),
        }))
      },

      onCupElimination(compName, phase, round, season, prestige) {
        const s = get()
        if (s.isFired) return

        // Penalidade proporcional ao prestígio e à fase (eliminação precoce dói mais)
        const earlyMultiplier = phase.toLowerCase().includes('oitavas') ? 1.5
          : phase.toLowerCase().includes('quartas') ? 1.2
          : phase.toLowerCase().includes('semis')   ? 0.8
          : 0.5   // final ou grupos

        const torDelta = -Math.round(3 * prestige * earlyMultiplier)
        const dirDelta = -Math.round(2 * prestige * earlyMultiplier)

        const newTor = clamp(s.torcida   + torDelta)
        const newDir = clamp(s.diretoria + dirDelta)

        const evt: ConfidenceEvent = {
          round, season, source: 'ambos', delta: torDelta,
          description: `Eliminado da ${compName} nas ${phase}`,
        }

        let isFired: boolean = s.isFired
        let firedBy: 'diretoria' | 'torcida' | 'pressao_combinada' | null = s.firedBy
        if (!isFired && (newDir === 0 || newTor === 0)) {
          isFired = true; firedBy = newDir === 0 ? 'diretoria' : 'torcida'
        }

        set(st => ({
          diretoria: newDir, torcida: newTor,
          isFired, firedBy,
          events: [evt, ...st.events].slice(0, 50),
        }))
      },

      onFinanceCheck(budgetRatio, round, season) {
        const s = get()
        if (s.isFired) return

        // Diretoria reage à saúde financeira (budgetRatio = budget / initialBudget)
        let dirDelta = 0
        let desc = ''

        if (budgetRatio >= 0.8) {
          dirDelta = 1; desc = 'Finanças saudáveis'
        } else if (budgetRatio <= 0.15) {
          dirDelta = -4; desc = 'Caixa crítico — diretoria preocupada'
        } else if (budgetRatio <= 0.30) {
          dirDelta = -2; desc = 'Orçamento baixo'
        }

        if (dirDelta === 0) return

        const newDir = clamp(s.diretoria + dirDelta)
        const evt: ConfidenceEvent = {
          round, season, source: 'diretoria', delta: dirDelta, description: desc,
        }
        set(st => ({
          diretoria: newDir,
          events: [evt, ...st.events].slice(0, 50),
        }))
      },

      reset() {
        set({
          diretoria: 70, torcida: 65,
          dirAlertRounds: 0, torAlertRounds: 0,
          isFired: false, firedBy: null, events: [],
        })
      },

      // "Continuar (debug)": desfaz a demissão sem começar carreira nova.
      // As funções de confiança fazem `if (isFired) return`, então só limpar a
      // flag congelaria os medidores; e sem levantá-los acima do alerta a
      // diretoria/torcida re-demitiriam na rodada seguinte. (R-17)
      clearFired() {
        const s = get()
        set({
          isFired: false, firedBy: null,
          dirAlertRounds: 0, torAlertRounds: 0,
          diretoria: Math.max(s.diretoria, 45),
          torcida:   Math.max(s.torcida, 40),
        })
      },
    }),
    { name: 'glfoot-confidence', version: 1, skipHydration: true },
  ),
)
