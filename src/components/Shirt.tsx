interface Props {
  colors: [string, string, string]
  size:   number
  className?: string
}

// Renderiza um mini-disco de camisa (fundo + faixa + detalhe)
export default function Shirt({ colors, size, className = '' }: Props) {
  const [bg, stripe, detail] = colors
  return (
    <div
      className={`relative rounded-full overflow-hidden border-2 border-white/20 ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      <div className="absolute inset-0" style={{ background: bg }} />
      <div className="absolute left-0 right-0" style={{ top: '30%', height: '28%', background: stripe }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '20%', background: detail || bg }} />
    </div>
  )
}
