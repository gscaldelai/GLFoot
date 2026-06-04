// ════════════════════════════════════════════════════════
//  GLfoot — Catálogo de Competições
//  Fonte: Wikipedia 2026 para estaduais, Copa do Brasil,
//  Libertadores, Sul-Americana, Recopa e Mundial.
// ════════════════════════════════════════════════════════

export type PhaseFormat = 'league' | 'single_elim' | 'two_leg_elim'

export interface Phase {
  id:           string
  name:         string
  format:       PhaseFormat
  gamesPerClub: number   // jogos para um clube que sobrevive a fase
  startWeek:    number   // semana mais cedo que pode começar (1–52)
  endWeek:      number   // semana limite para terminar
  priority:     number   // menor = agendado primeiro
}

export interface Competition {
  id:       string
  name:     string
  short:    string
  type:     'estadual' | 'nacional' | 'internacional'
  state?:   string       // UF — só estaduais
  nordeste?: boolean     // elegível apenas para clubes do Nordeste
  phases:   Phase[]
}

// ── Semanas de referência ────────────────────────────────
// Jan 1  = sem 1   |  Abr 1  = sem 13  |  Jul 1  = sem 27
// Jan 10 = sem 2   |  Mai 1  = sem 18  |  Ago 1  = sem 31
// Fev 1  = sem 5   |  Jun 1  = sem 22  |  Set 1  = sem 35
// Mar 1  = sem 9   |          Jul 1  = sem 27  |  Out 1  = sem 40
// Mar 8  = sem 10  |  Nov 1  = sem 44  |  Dez 1  = sem 48

// ── ESTADUAIS ────────────────────────────────────────────

const PAULISTAO: Competition = {
  id: 'paulistao', name: 'Campeonato Paulista', short: 'PAUL',
  type: 'estadual', state: 'SP',
  phases: [
    { id: 'grupos',  name: 'Fase de Grupos',    format: 'league',        gamesPerClub: 8, startWeek: 2,  endWeek: 8,  priority: 3 },
    { id: 'quartas', name: 'Quartas de Final',   format: 'single_elim',   gamesPerClub: 1, startWeek: 8,  endWeek: 10, priority: 3 },
    { id: 'semis',   name: 'Semifinais',         format: 'single_elim',   gamesPerClub: 1, startWeek: 15, endWeek: 15, priority: 3 },
    { id: 'final',   name: 'Final',              format: 'single_elim',   gamesPerClub: 1, startWeek: 16, endWeek: 16, priority: 3 },
  ],
}

const CARIOCA: Competition = {
  id: 'carioca', name: 'Campeonato Carioca', short: 'CARI',
  type: 'estadual', state: 'RJ',
  phases: [
    { id: 'taca_guanabara', name: 'Taça Guanabara', format: 'league',       gamesPerClub: 6, startWeek: 2,  endWeek: 7,  priority: 3 },
    { id: 'quartas',        name: 'Quartas de Final', format: 'single_elim', gamesPerClub: 1, startWeek: 7,  endWeek: 8,  priority: 3 },
    { id: 'semis',          name: 'Semifinais',       format: 'two_leg_elim',gamesPerClub: 2, startWeek: 8,  endWeek: 9,  priority: 3 },
    { id: 'final',          name: 'Final',            format: 'single_elim', gamesPerClub: 1, startWeek: 9,  endWeek: 10, priority: 3 },
  ],
}

const GAUCHO: Competition = {
  id: 'gaucho', name: 'Campeonato Gaúcho', short: 'GAUC',
  type: 'estadual', state: 'RS',
  phases: [
    { id: 'grupos',  name: 'Fase de Grupos',   format: 'league',       gamesPerClub: 7, startWeek: 2, endWeek: 8,  priority: 3 },
    { id: 'quartas', name: 'Quartas de Final',  format: 'single_elim',  gamesPerClub: 1, startWeek: 8, endWeek: 8,  priority: 3 },
    { id: 'semis',   name: 'Semifinais',        format: 'two_leg_elim', gamesPerClub: 2, startWeek: 8, endWeek: 9,  priority: 3 },
    { id: 'final',   name: 'Final',             format: 'two_leg_elim', gamesPerClub: 2, startWeek: 9, endWeek: 10, priority: 3 },
  ],
}

const MINEIRO: Competition = {
  id: 'mineiro', name: 'Campeonato Mineiro', short: 'MINE',
  type: 'estadual', state: 'MG',
  phases: [
    { id: 'grupos', name: 'Fase Classificatória', format: 'league',       gamesPerClub: 8, startWeek: 2, endWeek: 8,  priority: 3 },
    { id: 'semis',  name: 'Semifinais',           format: 'two_leg_elim', gamesPerClub: 2, startWeek: 8, endWeek: 9,  priority: 3 },
    { id: 'final',  name: 'Final',                format: 'two_leg_elim', gamesPerClub: 2, startWeek: 9, endWeek: 10, priority: 3 },
  ],
}

const PARANAENSE: Competition = {
  id: 'paranaense', name: 'Campeonato Paranaense', short: 'PARA',
  type: 'estadual', state: 'PR',
  phases: [
    { id: 'grupos',  name: 'Fase de Grupos',   format: 'league',       gamesPerClub: 6, startWeek: 1, endWeek: 7,  priority: 3 },
    { id: 'quartas', name: 'Quartas de Final',  format: 'two_leg_elim', gamesPerClub: 2, startWeek: 7, endWeek: 8,  priority: 3 },
    { id: 'semis',   name: 'Semifinais',        format: 'two_leg_elim', gamesPerClub: 2, startWeek: 8, endWeek: 9,  priority: 3 },
    { id: 'final',   name: 'Final',             format: 'two_leg_elim', gamesPerClub: 2, startWeek: 9, endWeek: 10, priority: 3 },
  ],
}

const BAIANO: Competition = {
  id: 'baiano', name: 'Campeonato Baiano', short: 'BAIO',
  type: 'estadual', state: 'BA',
  phases: [
    { id: 'primeira', name: 'Primeira Fase', format: 'league',      gamesPerClub: 9, startWeek: 2, endWeek: 9,  priority: 3 },
    { id: 'semis',    name: 'Semifinais',    format: 'single_elim', gamesPerClub: 1, startWeek: 9, endWeek: 9,  priority: 3 },
    { id: 'final',    name: 'Final',         format: 'single_elim', gamesPerClub: 1, startWeek: 9, endWeek: 10, priority: 3 },
  ],
}

const GOIANO: Competition = {
  id: 'goiano', name: 'Campeonato Goiano', short: 'GOIA',
  type: 'estadual', state: 'GO',
  phases: [
    { id: 'grupos',  name: 'Primeira Fase',   format: 'league',       gamesPerClub: 8, startWeek: 2,  endWeek: 8,  priority: 3 },
    { id: 'quartas', name: 'Quartas de Final', format: 'two_leg_elim', gamesPerClub: 2, startWeek: 8,  endWeek: 9,  priority: 3 },
    { id: 'semis',   name: 'Semifinais',       format: 'two_leg_elim', gamesPerClub: 2, startWeek: 9,  endWeek: 10, priority: 3 },
    { id: 'final',   name: 'Final',            format: 'two_leg_elim', gamesPerClub: 2, startWeek: 10, endWeek: 11, priority: 3 },
  ],
}

const CEARENSE: Competition = {
  id: 'cearense', name: 'Campeonato Cearense', short: 'CEAR',
  type: 'estadual', state: 'CE',
  phases: [
    { id: 'fase1', name: 'Primeira Fase', format: 'league',       gamesPerClub: 4, startWeek: 1, endWeek: 5,  priority: 3 },
    { id: 'fase2', name: 'Segunda Fase',  format: 'league',       gamesPerClub: 3, startWeek: 5, endWeek: 7,  priority: 3 },
    { id: 'semis', name: 'Semifinais',    format: 'two_leg_elim', gamesPerClub: 2, startWeek: 7, endWeek: 9,  priority: 3 },
    { id: 'final', name: 'Final',         format: 'two_leg_elim', gamesPerClub: 2, startWeek: 9, endWeek: 10, priority: 3 },
  ],
}

const PERNAMBUCANO: Competition = {
  id: 'pernambucano', name: 'Campeonato Pernambucano', short: 'PERN',
  type: 'estadual', state: 'PE',
  phases: [
    { id: 'primeira', name: 'Primeira Fase', format: 'league',       gamesPerClub: 7, startWeek: 1, endWeek: 7,  priority: 3 },
    { id: 'semis',    name: 'Semifinais',    format: 'two_leg_elim', gamesPerClub: 2, startWeek: 7, endWeek: 9,  priority: 3 },
    { id: 'final',    name: 'Final',         format: 'two_leg_elim', gamesPerClub: 2, startWeek: 9, endWeek: 10, priority: 3 },
  ],
}

// Formato genérico para estados sem mapeamento específico
const ESTADUAL_DEFAULT: Competition = {
  id: 'estadual_default', name: 'Campeonato Estadual', short: 'EST',
  type: 'estadual',
  phases: [
    { id: 'grupos', name: 'Fase de Grupos', format: 'league',       gamesPerClub: 7, startWeek: 2, endWeek: 8,  priority: 3 },
    { id: 'semis',  name: 'Semifinais',     format: 'two_leg_elim', gamesPerClub: 2, startWeek: 8, endWeek: 9,  priority: 3 },
    { id: 'final',  name: 'Final',          format: 'two_leg_elim', gamesPerClub: 2, startWeek: 9, endWeek: 10, priority: 3 },
  ],
}

// ── NACIONAIS ────────────────────────────────────────────

const BRASILEIRAO: Competition = {
  id: 'brasileirao', name: 'Campeonato Brasileiro', short: 'BRAS',
  type: 'nacional',
  phases: [
    // 38 rodadas distribuídas ao longo do ano inteiro
    { id: 'temporada', name: 'Temporada Regular', format: 'league', gamesPerClub: 38, startWeek: 1, endWeek: 52, priority: 5 },
  ],
}

const COPA_BRASIL: Competition = {
  id: 'copa_brasil', name: 'Copa do Brasil', short: 'CDB',
  type: 'nacional',
  // Série A entra na fase 5 (2026: 126 times, final única)
  phases: [
    { id: 'fase5',   name: 'Oitavas de Final',  format: 'two_leg_elim', gamesPerClub: 2, startWeek: 14, endWeek: 17, priority: 2 },
    { id: 'quartas', name: 'Quartas de Final',  format: 'two_leg_elim', gamesPerClub: 2, startWeek: 18, endWeek: 22, priority: 2 },
    { id: 'semis',   name: 'Semifinais',        format: 'two_leg_elim', gamesPerClub: 2, startWeek: 31, endWeek: 35, priority: 2 },
    { id: 'final',   name: 'Final',             format: 'single_elim',  gamesPerClub: 1, startWeek: 36, endWeek: 40, priority: 2 },
  ],
}

const COPA_NORDESTE: Competition = {
  id: 'copa_nordeste', name: 'Copa do Nordeste', short: 'CNOR',
  type: 'nacional', nordeste: true,
  // 20 times, 4 grupos de 5 — grupos A×B e C×D em turno único
  phases: [
    { id: 'grupos',  name: 'Fase de Grupos',   format: 'league',       gamesPerClub: 5, startWeek: 9,  endWeek: 17, priority: 3 },
    { id: 'quartas', name: 'Quartas de Final',  format: 'single_elim',  gamesPerClub: 1, startWeek: 17, endWeek: 19, priority: 2 },
    { id: 'semis',   name: 'Semifinais',        format: 'two_leg_elim', gamesPerClub: 2, startWeek: 19, endWeek: 22, priority: 2 },
    { id: 'final',   name: 'Final',             format: 'two_leg_elim', gamesPerClub: 2, startWeek: 22, endWeek: 24, priority: 2 },
  ],
}

// ── INTERNACIONAIS ───────────────────────────────────────

const LIBERTADORES: Competition = {
  id: 'libertadores', name: 'CONMEBOL Libertadores', short: 'LIB',
  type: 'internacional',
  // Grandes clubes entram direto na fase de grupos
  phases: [
    { id: 'grupos',  name: 'Fase de Grupos',   format: 'league',       gamesPerClub: 6, startWeek: 8,  endWeek: 21, priority: 1 },
    { id: 'oitavas', name: 'Oitavas de Final',  format: 'two_leg_elim', gamesPerClub: 2, startWeek: 27, endWeek: 31, priority: 1 },
    { id: 'quartas', name: 'Quartas de Final',  format: 'two_leg_elim', gamesPerClub: 2, startWeek: 31, endWeek: 35, priority: 1 },
    { id: 'semis',   name: 'Semifinais',        format: 'two_leg_elim', gamesPerClub: 2, startWeek: 35, endWeek: 39, priority: 1 },
    { id: 'final',   name: 'Final',             format: 'single_elim',  gamesPerClub: 1, startWeek: 43, endWeek: 43, priority: 1 },
  ],
}

const SULAMERICANA: Competition = {
  id: 'sulamericana', name: 'CONMEBOL Sul-Americana', short: 'SULA',
  type: 'internacional',
  phases: [
    { id: 'grupos',  name: 'Fase de Grupos',   format: 'league',       gamesPerClub: 6, startWeek: 8,  endWeek: 21, priority: 1 },
    { id: 'oitavas', name: 'Oitavas de Final',  format: 'two_leg_elim', gamesPerClub: 2, startWeek: 22, endWeek: 26, priority: 1 },
    { id: 'quartas', name: 'Quartas de Final',  format: 'two_leg_elim', gamesPerClub: 2, startWeek: 26, endWeek: 31, priority: 1 },
    { id: 'semis',   name: 'Semifinais',        format: 'two_leg_elim', gamesPerClub: 2, startWeek: 31, endWeek: 37, priority: 1 },
    { id: 'final',   name: 'Final',             format: 'two_leg_elim', gamesPerClub: 2, startWeek: 37, endWeek: 41, priority: 1 },
  ],
}

const RECOPA: Competition = {
  id: 'recopa', name: 'Recopa Sul-Americana', short: 'REC',
  type: 'internacional',
  phases: [
    { id: 'ida',   name: 'Jogo de Ida',   format: 'single_elim', gamesPerClub: 1, startWeek: 5, endWeek: 6, priority: 1 },
    { id: 'volta', name: 'Jogo de Volta', format: 'single_elim', gamesPerClub: 1, startWeek: 6, endWeek: 7, priority: 1 },
  ],
}

const MUNDIAL: Competition = {
  id: 'mundial', name: 'Mundial de Clubes', short: 'MUND',
  type: 'internacional',
  // FIFA Club World Cup — Dezembro
  phases: [
    { id: 'grupos',  name: 'Fase de Grupos',  format: 'league',      gamesPerClub: 3, startWeek: 48, endWeek: 50, priority: 1 },
    { id: 'oitavas', name: 'Oitavas de Final', format: 'single_elim', gamesPerClub: 1, startWeek: 50, endWeek: 50, priority: 1 },
    { id: 'quartas', name: 'Quartas de Final', format: 'single_elim', gamesPerClub: 1, startWeek: 50, endWeek: 51, priority: 1 },
    { id: 'semis',   name: 'Semifinais',       format: 'single_elim', gamesPerClub: 1, startWeek: 51, endWeek: 51, priority: 1 },
    { id: 'final',   name: 'Final',            format: 'single_elim', gamesPerClub: 1, startWeek: 51, endWeek: 52, priority: 1 },
  ],
}

// ── Catálogo completo ────────────────────────────────────

export const COMPETITION_CATALOG: Record<string, Competition> = {
  paulistao:       PAULISTAO,
  carioca:         CARIOCA,
  gaucho:          GAUCHO,
  mineiro:         MINEIRO,
  paranaense:      PARANAENSE,
  baiano:          BAIANO,
  goiano:          GOIANO,
  cearense:        CEARENSE,
  pernambucano:    PERNAMBUCANO,
  estadual_default: ESTADUAL_DEFAULT,
  brasileirao:     BRASILEIRAO,
  copa_brasil:     COPA_BRASIL,
  copa_nordeste:   COPA_NORDESTE,
  libertadores:    LIBERTADORES,
  sulamericana:    SULAMERICANA,
  recopa:          RECOPA,
  mundial:         MUNDIAL,
}

// Mapa UF → competição estadual
export const STATE_COMPETITION: Record<string, string> = {
  SP: 'paulistao',
  RJ: 'carioca',
  RS: 'gaucho',
  MG: 'mineiro',
  PR: 'paranaense',
  BA: 'baiano',
  GO: 'goiano',
  CE: 'cearense',
  PE: 'pernambucano',
}

export function getEstadual(uf: string): Competition {
  const id = STATE_COMPETITION[uf] ?? 'estadual_default'
  return COMPETITION_CATALOG[id]
}
