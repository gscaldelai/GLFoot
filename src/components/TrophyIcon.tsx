// ═══════════════════════════════════════════════════════
//  GLfoot — Trophy Icons
//  SVG customizados inspirados nas competições reais.
//  Não utiliza logos oficiais — design próprio por cor/forma.
// ═══════════════════════════════════════════════════════

export type Competition =
  | 'brasileirao'
  | 'copa_brasil'
  | 'libertadores'
  | 'sulamericana'
  | 'recopa'
  | 'mundial'
  | 'estadual'

interface TrophyCfg {
  label:  string
  cup:    string   // corpo da taça
  base:   string   // base/haste
  handle: string   // alças
  badge?: string   // detalhe interno (opcional)
}

export const TROPHY_META: Record<Competition, TrophyCfg> = {
  brasileirao:  { label: 'Brasileirão',    cup: '#f5c518', base: '#2e7d32', handle: '#a07820', badge: '#2e7d32' },
  copa_brasil:  { label: 'Copa do Brasil', cup: '#c62828', base: '#b8860b', handle: '#f5c518', badge: '#f5c518' },
  libertadores: { label: 'Libertadores',   cup: '#1a1830', base: '#b8860b', handle: '#f5c518', badge: '#f5c518' },
  sulamericana: { label: 'Sul-Americana',  cup: '#c62828', base: '#555',    handle: '#eee',    badge: '#fff'    },
  recopa:       { label: 'Recopa',         cup: '#4a5fb5', base: '#2c3690', handle: '#a8b4f0', badge: '#fff'    },
  mundial:      { label: 'Mundial',        cup: '#d4a017', base: '#333',    handle: '#aaa',    badge: '#fff'    },
  estadual:     { label: 'Estadual',       cup: '#9e9e9e', base: '#555',    handle: '#ccc',    badge: '#ddd'    },
}

// ── Extras visuais por competição ────────────────────────────────────────────

function BrasileiraoBadge() {
  // Miolo verde — losango
  return <polygon points="8,4.5 10,6.5 8,8.5 6,6.5" fill="#2e7d32" opacity="0.9" />
}

function CopaBrasilBadge() {
  // Estrela dourada no topo
  return <polygon points="8,3.5 8.7,5.5 10.8,5.5 9.1,6.8 9.7,8.8 8,7.5 6.3,8.8 6.9,6.8 5.2,5.5 7.3,5.5" fill="#f5c518" />
}

function LibertadoresBadge() {
  // Estrela de 5 pontas dourada
  return <polygon points="8,3.5 8.7,5.5 10.8,5.5 9.1,6.8 9.7,8.8 8,7.5 6.3,8.8 6.9,6.8 5.2,5.5 7.3,5.5" fill="#f5c518" opacity="0.95" />
}

function SulAmericanaBadge() {
  // Faixa branca horizontal
  return <rect x="4" y="7" width="8" height="1.5" fill="#fff" opacity="0.85" rx="0.5" />
}

function RecopaBadge() {
  // Dois triângulos (LA + SA juntos)
  return (
    <>
      <polygon points="8,4 10.5,9 5.5,9" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.7" />
    </>
  )
}

function MundialBadge() {
  // Globo / círculo no centro
  return <circle cx="8" cy="6.5" r="2" fill="none" stroke="#fff" strokeWidth="0.9" opacity="0.8" />
}

const BADGES: Partial<Record<Competition, () => JSX.Element>> = {
  brasileirao:  BrasileiraoBadge,
  copa_brasil:  CopaBrasilBadge,
  libertadores: LibertadoresBadge,
  sulamericana: SulAmericanaBadge,
  recopa:       RecopaBadge,
  mundial:      MundialBadge,
}

// ── Componente principal ─────────────────────────────────────────────────────
interface Props {
  comp: Competition
  size?: number   // altura em px (width calculado proporcionalmente)
}

export default function TrophyIcon({ comp, size = 20 }: Props) {
  const cfg = TROPHY_META[comp]
  const Badge = BADGES[comp]
  const scale = size / 22

  return (
    <svg
      width={Math.round(16 * scale)}
      height={size}
      viewBox="0 0 16 22"
      fill="none"
      role="img"
      aria-label={cfg.label}
    >
      {/* Corpo da taça */}
      <path
        d="M3.5 2.5 L12.5 2.5 L11 11 Q8 14 8 14 Q8 14 5 11 Z"
        fill={cfg.cup}
      />

      {/* Alça esquerda */}
      <path
        d="M3.5 4 Q0.5 4 0.5 7 Q0.5 10 3.5 9.5"
        stroke={cfg.handle} strokeWidth="1.4" strokeLinecap="round"
      />
      {/* Alça direita */}
      <path
        d="M12.5 4 Q15.5 4 15.5 7 Q15.5 10 12.5 9.5"
        stroke={cfg.handle} strokeWidth="1.4" strokeLinecap="round"
      />

      {/* Detalhe interno */}
      {Badge && <Badge />}

      {/* Haste */}
      <rect x="6.8" y="14" width="2.4" height="3" fill={cfg.base} />

      {/* Base */}
      <rect x="4" y="17" width="8" height="2.5" rx="1.2" fill={cfg.base} />

      {/* Pé da base */}
      <rect x="2.5" y="19.5" width="11" height="1.5" rx="0.75" fill={cfg.base} opacity="0.7" />
    </svg>
  )
}

// ── Grupo de troféus (para exibição compacta na tabela) ──────────────────────
interface TrophyGroupProps {
  brasileirao?:  boolean
  copa_brasil?:  boolean
  libertadores?: boolean
  sulamericana?: boolean
  recopa?:       boolean
  mundial?:      boolean
  estadual?:     number
  size?:         number
}

export function TrophyGroup({
  brasileirao, copa_brasil, libertadores, sulamericana, recopa, mundial, estadual,
  size = 18,
}: TrophyGroupProps) {
  const list: Competition[] = []
  if (brasileirao)  list.push('brasileirao')
  if (copa_brasil)  list.push('copa_brasil')
  if (libertadores) list.push('libertadores')
  if (sulamericana) list.push('sulamericana')
  if (recopa)       list.push('recopa')
  if (mundial)      list.push('mundial')
  if (estadual && estadual > 0) {
    for (let i = 0; i < Math.min(estadual, 3); i++) list.push('estadual')
  }

  if (list.length === 0) return <span className="text-[#2a3d52] text-[11px]">—</span>

  return (
    <div className="flex items-center gap-[3px] justify-center flex-wrap">
      {list.map((comp, i) => (
        <span key={i} title={TROPHY_META[comp].label} className="cursor-default">
          <TrophyIcon comp={comp} size={size} />
        </span>
      ))}
    </div>
  )
}
