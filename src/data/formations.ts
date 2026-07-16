import type { Player, Pos } from '@/engines/types'

// ── Inicial da posição (1 letra) ────────────────────────────────────────────
// Usada nos discos DURANTE a partida (campo, banco e Ajustes Táticos), onde
// não há espaço para o rótulo de 2–3 letras do pré-jogo.
export const POS_INITIAL: Record<Pos, string> = {
  GK: 'G', LAT: 'L', ZAG: 'Z', VOL: 'V', MEI: 'M', ATA: 'A',
}

// ── Todas as formações do jogo (excluindo 1-1-8 pré-moderno) ──────────────
export type FormationKey =
  // Clássicas existentes
  | '4-4-2'
  | '4-3-3'
  | '4-2-3-1'
  | '4-1-4-1'
  | '3-5-2'
  | '5-4-1'
  // Novas formações (fonte: thepfsa.co.uk/pt/football-formations)
  | '4-5-1'        // Bloco defensivo com 5 meias planos
  | '4-3-2-1'      // Árvore de Natal / Tiki-Taka espanhol
  | '4-1-3-2'      // Volante + 3 meias + dupla de ataque
  | '4-1-2-1-2'    // Diamante — pivô + ala-ala + meia-armador + dupla
  | '5-3-2'        // Fecha flancos do 3-5-2; defesa de 5 compacta
  | '4-2-4'        // Brasil 1958/1970; 2 vol + 4 atacantes
  | '3-4-3'        // Conte's Chelsea; ala-ala + dupla de vol + 3 atacantes
  | '3-2-4-1'      // Moderno EPL; 3 zags + 2 vol + 4 meias + 9
  | '3-2-5'        // WM (Herbert Chapman 1930s); 3 zags + 2 vol + 5 atacantes
  | '2-3-2-3'      // Metodo (Vittorio Pozzo 1930s); Itália bi-campeã mundial

export interface SlotDef {
  label:   string
  x:       number  // left% no campo vertical (0=esquerda, 100=direita)
  y:       number  // top%  no campo vertical (0=ataque, 100=GK)
  posType: 'GK' | 'DEF' | 'MID' | 'FWD'
}

// ── Definições de posição por formação ──────────────────────────────────────
// Índice 0 = GK; y alto = setor defensivo, y baixo = ataque
export const FORMATIONS: Record<FormationKey, SlotDef[]> = {

  // ── FORMAÇÕES CLÁSSICAS ──────────────────────────────────────────────────

  '4-4-2': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:12, y:70, posType:'DEF' },
    { label:'ZAG', x:35, y:70, posType:'DEF' },
    { label:'ZAG', x:65, y:70, posType:'DEF' },
    { label:'LE',  x:88, y:70, posType:'DEF' },
    { label:'MD',  x:12, y:46, posType:'MID' },
    { label:'VOL', x:35, y:46, posType:'MID' },
    { label:'VOL', x:65, y:46, posType:'MID' },
    { label:'ME',  x:88, y:46, posType:'MID' },
    { label:'ATA', x:35, y:20, posType:'FWD' },
    { label:'ATA', x:65, y:20, posType:'FWD' },
  ],

  '4-3-3': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:12, y:70, posType:'DEF' },
    { label:'ZAG', x:35, y:70, posType:'DEF' },
    { label:'ZAG', x:65, y:70, posType:'DEF' },
    { label:'LE',  x:88, y:70, posType:'DEF' },
    { label:'VOL', x:25, y:46, posType:'MID' },
    { label:'MEI', x:50, y:46, posType:'MID' },
    { label:'MEI', x:75, y:46, posType:'MID' },
    { label:'ATA', x:20, y:18, posType:'FWD' },
    { label:'CA',  x:50, y:18, posType:'FWD' },
    { label:'ATA', x:80, y:18, posType:'FWD' },
  ],

  '4-2-3-1': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:12, y:72, posType:'DEF' },
    { label:'ZAG', x:35, y:72, posType:'DEF' },
    { label:'ZAG', x:65, y:72, posType:'DEF' },
    { label:'LE',  x:88, y:72, posType:'DEF' },
    { label:'VOL', x:35, y:57, posType:'MID' },
    { label:'VOL', x:65, y:57, posType:'MID' },
    { label:'MAE', x:16, y:38, posType:'MID' },
    { label:'MEI', x:50, y:38, posType:'MID' },
    { label:'MAD', x:84, y:38, posType:'MID' },
    { label:'CA',  x:50, y:16, posType:'FWD' },
  ],

  '4-1-4-1': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:12, y:72, posType:'DEF' },
    { label:'ZAG', x:35, y:72, posType:'DEF' },
    { label:'ZAG', x:65, y:72, posType:'DEF' },
    { label:'LE',  x:88, y:72, posType:'DEF' },
    { label:'VOL', x:50, y:58, posType:'MID' },
    { label:'MD',  x:12, y:40, posType:'MID' },
    { label:'MEI', x:36, y:40, posType:'MID' },
    { label:'MEI', x:64, y:40, posType:'MID' },
    { label:'ME',  x:88, y:40, posType:'MID' },
    { label:'CA',  x:50, y:16, posType:'FWD' },
  ],

  '3-5-2': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'ZAG', x:25, y:70, posType:'DEF' },
    { label:'ZAG', x:50, y:70, posType:'DEF' },
    { label:'ZAG', x:75, y:70, posType:'DEF' },
    { label:'ALA', x:10, y:48, posType:'MID' },
    { label:'MEI', x:30, y:48, posType:'MID' },
    { label:'VOL', x:50, y:48, posType:'MID' },
    { label:'MEI', x:70, y:48, posType:'MID' },
    { label:'ALA', x:90, y:48, posType:'MID' },
    { label:'ATA', x:35, y:20, posType:'FWD' },
    { label:'ATA', x:65, y:20, posType:'FWD' },
  ],

  '5-4-1': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:10, y:70, posType:'DEF' },
    { label:'ZAG', x:28, y:70, posType:'DEF' },
    { label:'ZAG', x:50, y:70, posType:'DEF' },
    { label:'ZAG', x:72, y:70, posType:'DEF' },
    { label:'LE',  x:90, y:70, posType:'DEF' },
    { label:'MD',  x:14, y:46, posType:'MID' },
    { label:'VOL', x:38, y:46, posType:'MID' },
    { label:'VOL', x:62, y:46, posType:'MID' },
    { label:'ME',  x:86, y:46, posType:'MID' },
    { label:'CA',  x:50, y:18, posType:'FWD' },
  ],

  // ── NOVAS FORMAÇÕES ──────────────────────────────────────────────────────

  // 4-5-1: 5 meias planos (sem vol profundo) — bloco defensivo compacto
  '4-5-1': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:12, y:72, posType:'DEF' },
    { label:'ZAG', x:35, y:72, posType:'DEF' },
    { label:'ZAG', x:65, y:72, posType:'DEF' },
    { label:'LE',  x:88, y:72, posType:'DEF' },
    { label:'MD',  x:10, y:46, posType:'MID' },
    { label:'MEI', x:30, y:46, posType:'MID' },
    { label:'VOL', x:50, y:46, posType:'MID' },
    { label:'MEI', x:70, y:46, posType:'MID' },
    { label:'ME',  x:90, y:46, posType:'MID' },
    { label:'CA',  x:50, y:16, posType:'FWD' },
  ],

  // 4-3-2-1: Árvore de Natal (tiki-taka) — 3 vol + 2 meias-armadores + 9
  '4-3-2-1': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:12, y:72, posType:'DEF' },
    { label:'ZAG', x:35, y:72, posType:'DEF' },
    { label:'ZAG', x:65, y:72, posType:'DEF' },
    { label:'LE',  x:88, y:72, posType:'DEF' },
    { label:'VOL', x:22, y:56, posType:'MID' },
    { label:'VOL', x:50, y:56, posType:'MID' },
    { label:'VOL', x:78, y:56, posType:'MID' },
    { label:'MEI', x:33, y:36, posType:'MID' },
    { label:'MEI', x:67, y:36, posType:'MID' },
    { label:'CA',  x:50, y:16, posType:'FWD' },
  ],

  // 4-1-3-2: 1 vol + 3 meias + dupla de ataque — balanceado e ofensivo
  '4-1-3-2': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:12, y:72, posType:'DEF' },
    { label:'ZAG', x:35, y:72, posType:'DEF' },
    { label:'ZAG', x:65, y:72, posType:'DEF' },
    { label:'LE',  x:88, y:72, posType:'DEF' },
    { label:'VOL', x:50, y:58, posType:'MID' },
    { label:'MAE', x:20, y:40, posType:'MID' },
    { label:'MEI', x:50, y:40, posType:'MID' },
    { label:'MAD', x:80, y:40, posType:'MID' },
    { label:'ATA', x:33, y:18, posType:'FWD' },
    { label:'ATA', x:67, y:18, posType:'FWD' },
  ],

  // 4-1-2-1-2: Diamante — pivô + 2 alas centrais + armador + dupla
  '4-1-2-1-2': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:12, y:72, posType:'DEF' },
    { label:'ZAG', x:35, y:72, posType:'DEF' },
    { label:'ZAG', x:65, y:72, posType:'DEF' },
    { label:'LE',  x:88, y:72, posType:'DEF' },
    { label:'VOL', x:50, y:60, posType:'MID' },  // base do diamante
    { label:'MEI', x:22, y:46, posType:'MID' },  // lado esquerdo
    { label:'MEI', x:78, y:46, posType:'MID' },  // lado direito
    { label:'ARM', x:50, y:32, posType:'MID' },  // ponta do diamante
    { label:'ATA', x:33, y:16, posType:'FWD' },
    { label:'ATA', x:67, y:16, posType:'FWD' },
  ],

  // 5-3-2: Fecha flancos explorados pelo 3-5-2; 5 def + 3 vol + 2 ata
  '5-3-2': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:10, y:70, posType:'DEF' },
    { label:'ZAG', x:28, y:70, posType:'DEF' },
    { label:'ZAG', x:50, y:70, posType:'DEF' },
    { label:'ZAG', x:72, y:70, posType:'DEF' },
    { label:'LE',  x:90, y:70, posType:'DEF' },
    { label:'VOL', x:25, y:48, posType:'MID' },
    { label:'VOL', x:50, y:48, posType:'MID' },
    { label:'VOL', x:75, y:48, posType:'MID' },
    { label:'ATA', x:33, y:18, posType:'FWD' },
    { label:'ATA', x:67, y:18, posType:'FWD' },
  ],

  // 4-2-4: Brasil 1958/1970 — 2 vol + 4 atacantes; domina em ataque, frágil no meio
  '4-2-4': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:12, y:72, posType:'DEF' },
    { label:'ZAG', x:35, y:72, posType:'DEF' },
    { label:'ZAG', x:65, y:72, posType:'DEF' },
    { label:'LE',  x:88, y:72, posType:'DEF' },
    { label:'VOL', x:35, y:52, posType:'MID' },
    { label:'VOL', x:65, y:52, posType:'MID' },
    { label:'ATA', x:12, y:18, posType:'FWD' },
    { label:'ATA', x:38, y:18, posType:'FWD' },
    { label:'ATA', x:62, y:18, posType:'FWD' },
    { label:'ATA', x:88, y:18, posType:'FWD' },
  ],

  // 3-4-3: Conte's Chelsea; ala-backs + 2 vol + 3 atacantes — devastador no ataque
  '3-4-3': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'ZAG', x:25, y:70, posType:'DEF' },
    { label:'ZAG', x:50, y:70, posType:'DEF' },
    { label:'ZAG', x:75, y:70, posType:'DEF' },
    { label:'ALA', x:10, y:50, posType:'MID' },
    { label:'VOL', x:35, y:50, posType:'MID' },
    { label:'VOL', x:65, y:50, posType:'MID' },
    { label:'ALA', x:90, y:50, posType:'MID' },
    { label:'ATA', x:20, y:18, posType:'FWD' },
    { label:'CA',  x:50, y:18, posType:'FWD' },
    { label:'ATA', x:80, y:18, posType:'FWD' },
  ],

  // 3-2-4-1: EPL moderno; 3 zags + 2 vol + 4 meias + 9 — ênfase em transição
  '3-2-4-1': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'ZAG', x:25, y:70, posType:'DEF' },
    { label:'ZAG', x:50, y:70, posType:'DEF' },
    { label:'ZAG', x:75, y:70, posType:'DEF' },
    { label:'VOL', x:35, y:57, posType:'MID' },
    { label:'VOL', x:65, y:57, posType:'MID' },
    { label:'MAE', x:12, y:38, posType:'MID' },
    { label:'MEI', x:38, y:38, posType:'MID' },
    { label:'MEI', x:62, y:38, posType:'MID' },
    { label:'MAD', x:88, y:38, posType:'MID' },
    { label:'CA',  x:50, y:16, posType:'FWD' },
  ],

  // 3-2-5: WM de Herbert Chapman (Arsenal 1930s) — 3 def + 2 vol + 5 atacantes
  '3-2-5': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'ZAG', x:25, y:68, posType:'DEF' },
    { label:'ZAG', x:50, y:68, posType:'DEF' },
    { label:'ZAG', x:75, y:68, posType:'DEF' },
    { label:'VOL', x:35, y:52, posType:'MID' },
    { label:'VOL', x:65, y:52, posType:'MID' },
    { label:'ATA', x:10, y:18, posType:'FWD' },
    { label:'MEI', x:30, y:22, posType:'FWD' },
    { label:'CA',  x:50, y:16, posType:'FWD' },
    { label:'MEI', x:70, y:22, posType:'FWD' },
    { label:'ATA', x:90, y:18, posType:'FWD' },
  ],

  // 2-3-2-3: Metodo (Vittorio Pozzo) — Itália 1934 e 1938; estrutura italiana clássica
  '2-3-2-3': [
    { label:'GK',  x:50, y:88, posType:'GK'  },
    { label:'LD',  x:30, y:74, posType:'DEF' },
    { label:'LE',  x:70, y:74, posType:'DEF' },
    { label:'ZAG', x:20, y:60, posType:'MID' },
    { label:'VOL', x:50, y:60, posType:'MID' },
    { label:'ZAG', x:80, y:60, posType:'MID' },
    { label:'MEI', x:33, y:42, posType:'MID' },
    { label:'MEI', x:67, y:42, posType:'MID' },
    { label:'ATA', x:18, y:18, posType:'FWD' },
    { label:'CA',  x:50, y:16, posType:'FWD' },
    { label:'ATA', x:82, y:18, posType:'FWD' },
  ],
}

// ── Labels e descrições ──────────────────────────────────────────────────────
export const FORMATION_LABELS: Record<FormationKey, string> = {
  '4-4-2':    '4-4-2',
  '4-3-3':    '4-3-3',
  '4-2-3-1':  '4-2-3-1',
  '4-1-4-1':  '4-1-4-1',
  '3-5-2':    '3-5-2',
  '5-4-1':    '5-4-1',
  '4-5-1':    '4-5-1',
  '4-3-2-1':  '4-3-2-1',
  '4-1-3-2':  '4-1-3-2',
  '4-1-2-1-2':'4-1-2-1-2',
  '5-3-2':    '5-3-2',
  '4-2-4':    '4-2-4',
  '3-4-3':    '3-4-3',
  '3-2-4-1':  '3-2-4-1',
  '3-2-5':    '3-2-5 (WM)',
  '2-3-2-3':  '2-3-2-3 (Metodo)',
}

export const FORMATION_DESC: Record<FormationKey, string> = {
  '4-4-2':    'Clássico. Sólido e equilibrado, exige alto ritmo dos meias.',
  '4-3-3':    'Posse e pressing alto. Triângulos rápidos. Aberta a contra-ataques.',
  '4-2-3-1':  'Dois pivôs + meia-armador. Adaptável durante o jogo.',
  '4-1-4-1':  'Pivô + 4 meias. Bloco médio compacto; bom para encaixar.',
  '3-5-2':    'Superioridade no meio. Ala-backs exigentes. Bate o 4-4-2.',
  '5-4-1':    'Catenaccio moderno. Defensivo, eficaz com margens mínimas.',
  '4-5-1':    'Bloco de 5 meias planos. Chelsea de Mourinho 2004/05.',
  '4-3-2-1':  'Árvore de Natal. Tiki-taka espanhol. Controle central total.',
  '4-1-3-2':  'Dupla de ataque + 3 meias. Ofensivo e equilibrado.',
  '4-1-2-1-2':'Diamante. Pivô + alas centrais + armador. Domina o corredor.',
  '5-3-2':    'Fecha flancos do 3-5-2. Compacto e difícil de penetrar.',
  '4-2-4':    'Brasil 58/70. Ataque total — 4 atacantes, frágil no meio.',
  '3-4-3':    'Chelsea de Conte. 5 atacadores. Vence no ataque ou expõe flancos.',
  '3-2-4-1':  'EPL moderno. Libero como 4º zagueiro. Transição rápida.',
  '3-2-5':    'WM de Chapman (1930s). 5 atacantes em W. Histórico.',
  '2-3-2-3':  'Metodo de Pozzo. Itália 1934+38. Estrutura compacta italiana.',
}

// ── Matriz de vantagens táticas ──────────────────────────────────────────────
//
//  Fonte: thepfsa.co.uk/pt/football-formations — fraquezas documentadas
//
//  Formato: `${myFormation}_vs_${opponentFormation}` → bonus λ
//  +0.10 = ligeira vantagem    (~7% mais gols esperados)
//  +0.15 = vantagem clara      (~10% mais gols esperados)
//  +0.20 = vantagem forte      (~14% mais gols esperados)
//
//  O bonus é SOMADO apenas ao λ de quem tem a vantagem — o λ do adversário
//  não é alterado (ver prepareMatch em useMatchStore.ts)
//
//  Rebalanceado (QA G-01): nenhuma formação invicta, nenhuma com saldo
//  pior que -1 exceto o 4-2-4 (alto risco por design). 4-4-2 neutro (3W/3L).
//  Validação: node scripts/test-formations.js
//
export const FORMATION_MATCHUP_BONUS: Record<string, number> = {
  // ── Counters do 4-4-2 (apenas os canônicos) ────────────────────────────
  '3-5-2_vs_4-4-2':     0.15, // superioridade numérica no meio (5v4, 3v2 central)
  '3-4-3_vs_4-4-2':     0.15, // 5 atacadores sobrecarregam a linha de 4
  '3-2-4-1_vs_4-4-2':   0.10, // box midfield moderno domina os 2 meias centrais
  // ── Vítimas do 4-4-2 ───────────────────────────────────────────────────
  '4-4-2_vs_4-2-4':     0.15, // meio organizado vs 2 volantes descobertos
  '4-4-2_vs_4-3-2-1':   0.10, // meias abertos exploram a Árvore de Natal estreita
  '4-4-2_vs_2-3-2-3':   0.10, // dois bancos de 4 vs apenas 2 defensores do Metodo
  // ── Bloco defensivo vs posse/tiki-taka ─────────────────────────────────
  '4-5-1_vs_4-3-2-1':   0.15, // Mourinho: contra-ataque destrói tiki-taka
  '4-1-4-1_vs_4-3-2-1': 0.12, // variante menos extrema do mesmo princípio
  '4-5-1_vs_4-1-2-1-2': 0.10, // bloco largo de 5 meias fecha o diamante sem largura
  // ── 5 atrás fecha sistemas de 3 zagueiros / ataque total ───────────────
  '5-3-2_vs_3-5-2':     0.15, // fecha os flancos expostos do 3-5-2
  '5-4-1_vs_3-4-3':     0.15, // bloco defensivo absorve ataque dos 5
  '5-4-1_vs_3-2-5':     0.15, // mesmo princípio: defesa vs ataque máximo
  '5-4-1_vs_3-2-4-1':   0.10, // bloco baixo absorve o box midfield e sai nas costas das alas
  '5-3-2_vs_3-4-3':     0.12,
  '5-3-2_vs_3-2-5':     0.12,
  // ── Largura desmonta blocos e 3-zagueiros ──────────────────────────────
  '4-3-3_vs_5-4-1':     0.15, // largura desmonta catenaccio
  '4-3-3_vs_3-5-2':     0.12, // explora áreas laterais expostas
  '3-4-3_vs_4-5-1':     0.12, // pressão alta vence bloco baixo médio
  // ── Superioridade central ──────────────────────────────────────────────
  '4-1-2-1-2_vs_4-3-3': 0.12, // diamante ganha o meio do 4-3-3
  '3-5-2_vs_4-2-3-1':   0.10, // 5 meias sobrecarregam 4
  '3-5-2_vs_4-1-3-2':   0.10, // 5 no meio sobrecarregam o volante isolado
  // ── Criatividade rompe bloqueio defensivo ──────────────────────────────
  '4-2-3-1_vs_4-5-1':   0.12,
  '4-2-3-1_vs_4-1-4-1': 0.10,
  '4-2-3-1_vs_5-4-1':   0.12,
  // ── Anti-4-2-4 (quem tem meio pune o ataque total) ─────────────────────
  '4-5-1_vs_4-2-4':     0.15,
  '4-1-4-1_vs_4-2-4':   0.12,
  '4-3-2-1_vs_4-2-4':   0.12, // tiki-taka sufoca o 4-2-4 sem meio
  // ── 4-3-2-1 por posse e triangulação ───────────────────────────────────
  '4-3-2-1_vs_3-5-2':   0.10,
  // ── 4-1-3-2 — dupla de ataque explora zagueiros expostos ───────────────
  '4-1-3-2_vs_3-4-3':   0.10,
  '4-1-3-2_vs_4-3-3':   0.10,
  // ── 3-2-4-1 — transição rápida explora times lentos a reorganizar ──────
  '3-2-4-1_vs_4-5-1':   0.12,
  // ── Duelos históricos (WM × Metodo × ataque total) ─────────────────────
  '3-2-5_vs_4-2-3-1':   0.12, // ataque extremo vs defesa moderna desatenta
  '3-2-5_vs_4-2-4':     0.12, // dois ataques se chocam, WM mais organizado
  '2-3-2-3_vs_3-2-5':   0.12, // Metodo de Pozzo foi desenhado para neutralizar o WM
  '2-3-2-3_vs_4-2-4':   0.12,
  // ── 4-2-4 — superioridade ofensiva quando adversário não fecha ─────────
  '4-2-4_vs_5-4-1':     0.12,
  '4-2-4_vs_5-3-2':     0.10,
  '4-2-4_vs_2-3-2-3':   0.10,
}

/**
 * Retorna o bônus de λ para a combinação de formações.
 * @returns valor entre 0 e 0.20 a ser somado ao λ do atacante
 */
export function getFormationBonus(my: FormationKey, opp: FormationKey): number {
  return FORMATION_MATCHUP_BONUS[`${my}_vs_${opp}`] ?? 0
}

// ── Pool de formações para times bots ─────────────────────────────────────────
// Bots escolhem aleatoriamente desta lista com pesos por força do clube
export const BOT_FORMATION_POOL: FormationKey[] = [
  '4-4-2', '4-3-3', '4-2-3-1', '4-1-4-1', '3-5-2', '5-4-1',
  '4-5-1', '4-3-2-1', '4-1-3-2', '4-1-2-1-2', '5-3-2',
  '3-4-3', '3-2-4-1', '4-2-4',
]

/** Seleciona formação do bot com pseudo-aleatoriedade baseada em seed */
export function pickBotFormation(seed: number): FormationKey {
  const idx = Math.abs(Math.round(seed * 9301 + 49297)) % BOT_FORMATION_POOL.length
  return BOT_FORMATION_POOL[idx]
}

// ── Auto-distribuição inteligente de jogadores ──────────────────────────────
export function assignToFormation(
  allPlayers: Player[],
  formationKey: FormationKey,
): { slots: (Player | null)[]; bench: Player[] } {
  const slotDefs = FORMATIONS[formationKey]
  // Lesionados não são escalados — vão para o fim do banco (G-02)
  const injured  = allPlayers.filter(p => p.injured)
  const pool     = allPlayers.filter(p => !p.injured)
  const result: (Player | null)[] = new Array(slotDefs.length).fill(null)

  function pickFor(posType: SlotDef['posType']): Player | null {
    const preferred =
      posType === 'GK'  ? ['GK']         :
      posType === 'DEF' ? ['ZAG', 'LAT'] :
      posType === 'MID' ? ['VOL', 'MEI'] :
                          ['ATA']

    for (const pos of preferred) {
      const candidates = pool
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.pos === pos)
        .sort((a, b) => b.p.forca - a.p.forca)

      if (candidates.length) {
        pool.splice(candidates[0].i, 1)
        return candidates[0].p
      }
    }

    if (!pool.length) return null
    const best = pool.reduce((b, p, i) => p.forca > pool[b].forca ? i : b, 0)
    return pool.splice(best, 1)[0]
  }

  for (const posType of ['GK', 'DEF', 'MID', 'FWD'] as const) {
    slotDefs.forEach((slot, i) => {
      if (slot.posType === posType) result[i] = pickFor(posType)
    })
  }

  return { slots: result, bench: [...pool, ...injured] }
}

// Converte slot do campo vertical → fieldPos para o campo horizontal da partida
export function slotToMatchPos(slot: SlotDef): [number, number] {
  const left = Math.round(4 + (88 - slot.y) * 0.58)
  const top  = Math.round(slot.x)
  return [Math.max(4, Math.min(55, left)), Math.max(5, Math.min(95, top))]
}
