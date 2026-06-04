import { useState } from 'react'

interface Props {
  colors:   [string, string, string] | [string, string]
  short:    string
  size?:    number
  rounded?: boolean
}

// Tenta importar o logo do clube pelo short name (ex: "SPFC" → /assets/crests/SPFC.png)
// Vite resolve imports dinâmicos com glob — usamos URL direta para simplificar
function logoUrl(short: string): string {
  return `/assets/crests/${short}.png`
}

export default function ClubCrest({ colors, short, size = 24, rounded = false }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const [c1, c2] = colors
  const label    = short.substring(0, 3)
  const r        = rounded ? size / 2 : size * 0.15
  const br       = rounded ? '50%' : `${size * 0.15}px`

  if (!imgFailed) {
    return (
      <img
        src={logoUrl(short)}
        alt={short}
        width={size}
        height={size}
        onError={() => setImgFailed(true)}
        style={{
          width: size, height: size,
          objectFit: 'contain',
          borderRadius: br,
          flexShrink: 0,
          display: 'block',
        }}
      />
    )
  }

  // Fallback: escudo SVG gerado pelas cores
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: br, flexShrink: 0 }}
    >
      <rect width="24" height="24" rx={r} fill={c1} />
      <path
        d="M12 2 L20 5 L20 14 Q20 20 12 23 Q4 20 4 14 L4 5 Z"
        fill={c1} stroke="rgba(255,255,255,.25)" strokeWidth=".5"
      />
      <path
        d="M12 5 L17 7.5 L17 13.5 Q17 18 12 20 Q7 18 7 13.5 L7 7.5 Z"
        fill={c2} opacity=".75"
      />
      <text
        x="12" y="15.5" textAnchor="middle"
        fontSize="5.5" fontWeight="bold" fill={c1}
        fontFamily="Arial"
        style={{ paintOrder: 'stroke', stroke: c2, strokeWidth: '1.5px' }}
      >
        {label}
      </text>
    </svg>
  )
}
