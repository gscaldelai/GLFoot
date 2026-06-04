import { useState, useEffect, type FormEvent } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { TrophyGroup } from '@/components/TrophyIcon'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// ── Tipos do ranking ─────────────────────────────────────────────────────────
interface RankingRow {
  rank:          number
  nickname:      string
  total_titles:  number
  total_points:  number
  ranking_score: number
  // Temporada 1
  t1_clube:    string | null
  t1_vitorias: number
  t1_pontos:   number
  t1_brasileirao?:  boolean
  t1_copa_brasil?:  boolean
  t1_libertadores?: boolean
  t1_sulamericana?: boolean
  t1_recopa?:       boolean
  t1_mundial?:      boolean
  t1_estadual?:     number
  // Temporada 2
  t2_clube:    string | null
  t2_vitorias: number
  t2_pontos:   number
  t2_brasileirao?:  boolean
  t2_copa_brasil?:  boolean
  t2_libertadores?: boolean
  t2_sulamericana?: boolean
  t2_recopa?:       boolean
  t2_mundial?:      boolean
  t2_estadual?:     number
}

// Dados mock enquanto o backend não está disponível
// Scores calculados pelos pesos:
// Mundial=1000 | Lib=500 | Recopa=200 | SA=150 | Brasa=100 | Copa=50 | Est=5
const MOCK: RankingRow[] = [
  {
    rank:1, nickname:'GustãoFC', total_titles:4, total_points:214,
    ranking_score: 500 + 100 + 50 + 5, // Lib + Brasa + Copa + Est = 655
    t1_clube:'SPFC', t1_vitorias:22, t1_pontos:74, t1_brasileirao:true, t1_copa_brasil:true,
    t2_clube:'PAL',  t2_vitorias:24, t2_pontos:79, t2_libertadores:true, t2_estadual:1,
  },
  {
    rank:2, nickname:'TechMaster', total_titles:2, total_points:198,
    ranking_score: 100 + 150, // Brasa + SA = 250
    t1_clube:'FLA', t1_vitorias:20, t1_pontos:70, t1_brasileirao:true,
    t2_clube:'ATL', t2_vitorias:21, t2_pontos:69, t2_sulamericana:true,
  },
  {
    rank:3, nickname:'Boleiro99', total_titles:2, total_points:187,
    ranking_score: 100 + 5, // Brasa + Est = 105
    t1_clube:'COR', t1_vitorias:17, t1_pontos:63, t1_estadual:1,
    t2_clube:'INT', t2_vitorias:20, t2_pontos:69, t2_brasileirao:true,
  },
  {
    rank:4, nickname:'MistrãoCF', total_titles:1, total_points:174,
    ranking_score: 50, // Copa = 50
    t1_clube:'GRE', t1_vitorias:19, t1_pontos:64, t1_copa_brasil:true,
    t2_clube:'FLA', t2_vitorias:16, t2_pontos:58,
  },
  {
    rank:5, nickname:'CoachLuis', total_titles:0, total_points:162,
    ranking_score: 0,
    t1_clube:'BOT', t1_vitorias:15, t1_pontos:57,
    t2_clube:'SAN', t2_vitorias:16, t2_pontos:57,
  },
]

function useRanking() {
  const [rows, setRows]     = useState<RankingRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 5000)

    fetch(`${API}/api/ranking`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(data => setRows(Array.isArray(data) ? data : MOCK))
      .catch(() => setRows(MOCK))
      .finally(() => { clearTimeout(timer); setLoading(false) })

    return () => { ctrl.abort(); clearTimeout(timer) }
  }, [])

  return { rows, loading }
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function AuthScreen() {
  const [tab, setTab] = useState<'login' | 'register'>('login')

  return (
    <div className="min-h-screen w-full flex flex-col overflow-hidden"
         style={{
           background: 'radial-gradient(ellipse at 30% 50%, #0a1f0a 0%, #080c10 60%)',
         }}>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-border">
        <div className="font-bebas text-[28px] tracking-[6px] text-gold">GLFOOT</div>
        <div className="text-[11px] text-[#4a6070] tracking-[3px] uppercase">
          Simulador de Futebol · Modo Carreira
        </div>
      </header>

      {/* Corpo */}
      <div className="flex flex-1 overflow-hidden gap-0">

        {/* ── Formulário (esquerda) ── */}
        <div className="w-[400px] flex-shrink-0 flex flex-col justify-center px-10 py-8
                        border-r border-border bg-surface/40">
          <div className="mb-8">
            <div className="font-bebas text-[34px] tracking-[4px] text-white leading-tight">
              BEM-VINDO AO<br />
              <span className="text-gold">GLFOOT</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 pb-[10px] font-bebas text-[16px] tracking-[2px] transition-all
                            ${tab === t
                              ? 'text-gold border-b-2 border-gold -mb-[2px]'
                              : 'text-[#4a6070] hover:text-white'}`}
              >
                {t === 'login' ? 'ENTRAR' : 'CADASTRAR'}
              </button>
            ))}
          </div>

          {tab === 'login'    ? <LoginForm />    : <RegisterForm />}
        </div>

        {/* ── Ranking (direita) ── */}
        <div className="flex-1 flex flex-col overflow-hidden px-8 py-8">
          <RankingPanel />
        </div>
      </div>
    </div>
  )
}

// ── Formulário de Login ───────────────────────────────────────────────────────
function LoginForm() {
  const login = useAuthStore(s => s.login)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="E-mail" type="email" value={email}
             onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
      <Field label="Senha" type="password" value={password}
             onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

      {error && <p className="text-glred text-[12px]">{error}</p>}

      <button type="submit" disabled={loading}
              className="mt-2 bg-gradient-to-br from-[#b8800a] to-gold rounded-lg py-[11px]
                         font-bebas text-[18px] tracking-[3px] text-black cursor-pointer
                         hover:scale-[1.02] transition-transform disabled:opacity-50">
        {loading ? 'ENTRANDO...' : '▶ ENTRAR'}
      </button>
    </form>
  )
}

// ── Formulário de Cadastro ────────────────────────────────────────────────────
function RegisterForm() {
  const register = useAuthStore(s => s.register)
  const [nickname, setNickname]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [plan, setPlan]           = useState<'free' | 'premium'>('free')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem'); return }
    setError('')
    setLoading(true)
    try {
      await register(nickname, email, password, plan)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="Nome do Técnico" type="text" value={nickname}
             onChange={e => setNickname(e.target.value)} placeholder="Seu nickname" />
      <Field label="E-mail" type="email" value={email}
             onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
      <Field label="Senha" type="password" value={password}
             onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
      <Field label="Confirmar senha" type="password" value={confirm}
             onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" />

      {/* Plano */}
      <div className="mt-1">
        <div className="text-[9px] tracking-[2px] uppercase text-[#4a6070] mb-2">Plano</div>
        <div className="flex gap-3">
          {([
            { id: 'free',    label: 'Free',    desc: '1 temporada' },
            { id: 'premium', label: 'Premium', desc: 'Ilimitado + Ranking' },
          ] as const).map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={`flex-1 py-[8px] px-3 rounded-lg border text-left transition-all
                          ${plan === p.id
                            ? 'border-gold bg-gold/10'
                            : 'border-border bg-surface hover:border-[#2a3d52]'}`}
            >
              <div className={`font-bebas text-[14px] tracking-[1px]
                               ${plan === p.id ? 'text-gold' : 'text-white/70'}`}>
                {p.label}
              </div>
              <div className="text-[10px] text-[#4a6070] mt-[1px]">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-glred text-[12px]">{error}</p>}

      <button type="submit" disabled={loading}
              className="mt-1 bg-gradient-to-br from-[#b8800a] to-gold rounded-lg py-[11px]
                         font-bebas text-[18px] tracking-[3px] text-black cursor-pointer
                         hover:scale-[1.02] transition-transform disabled:opacity-50">
        {loading ? 'CADASTRANDO...' : '▶ CRIAR TÉCNICO'}
      </button>
    </form>
  )
}

// ── Campo de formulário ───────────────────────────────────────────────────────
function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-[5px]">
      <label className="text-[9px] tracking-[2px] uppercase text-[#4a6070]">{label}</label>
      <input
        {...props}
        className="bg-surface2 border border-border rounded-lg px-3 py-[9px]
                   text-[13px] text-white placeholder-[#3a5060] outline-none
                   focus:border-gold/60 transition-colors"
      />
    </div>
  )
}

// ── Célula de temporada (clube + troféus agrupados) ──────────────────────────
function SeasonCell({
  clube, brasileirao, copa_brasil, libertadores, sulamericana, recopa, mundial, estadual, dim,
}: {
  clube?: string | null
  brasileirao?: boolean; copa_brasil?: boolean; libertadores?: boolean
  sulamericana?: boolean; recopa?: boolean; mundial?: boolean; estadual?: number
  dim?: boolean
}) {
  if (!clube) return <span className="text-[#2a3d52]">—</span>
  return (
    <div className="flex items-center gap-[6px]">
      <span className={`font-bebas text-[15px] tracking-[1px] ${dim ? 'text-white/50' : 'text-white/90'}`}>
        {clube}
      </span>
      <TrophyGroup
        brasileirao={brasileirao} copa_brasil={copa_brasil}
        libertadores={libertadores} sulamericana={sulamericana}
        recopa={recopa} mundial={mundial} estadual={estadual}
        size={15}
      />
    </div>
  )
}

// ── Painel de Ranking ─────────────────────────────────────────────────────────
function RankingPanel() {
  const { rows, loading } = useRanking()

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <div className="font-bebas text-[24px] tracking-[6px] text-gold">RANKING GLOBAL</div>
          <div className="text-[11px] text-[#4a6070] mt-[3px] tracking-[1px]">
            Técnicos com 2 temporadas completas · Critério: peso dos títulos
          </div>
        </div>
        {!loading && rows.length > 0 && (
          <div className="text-[11px] text-[#3a5060] tracking-[1px]">
            {rows.length} classificado{rows.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto rounded-xl border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#3a5060] text-[13px]">
            Carregando ranking...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-[48px] opacity-15 select-none">🏆</div>
            <div className="text-[13px] text-[#3a5060]">
              Seja o primeiro a completar 2 temporadas!
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse" style={{ minWidth: 560 }}>
            <thead>
              <tr className="bg-surface2/80 text-[9px] tracking-[2px] uppercase">
                <th className="px-4 py-[10px] text-left border-b border-border text-[#4a6070] w-[44px]">#</th>
                <th className="px-4 py-[10px] text-left border-b border-border text-[#4a6070] w-[140px]">Técnico</th>
                <th className="px-4 py-[10px] text-left border-b border-r border-border text-gold/70">
                  Temporada 1
                </th>
                <th className="px-4 py-[10px] text-left border-b border-border text-[#5a7080]">
                  Temporada 2
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => <RankingRowItem key={row.rank} row={row} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function RankingRowItem({ row }: { row: RankingRow }) {
  const isPodium = row.rank <= 3
  const medal    = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : null

  return (
    <tr className={`transition-colors hover:bg-surface2/50 ${isPodium ? 'bg-gold/[0.04]' : ''}`}>
      {/* Posição */}
      <td className="px-4 py-[11px] border-b border-border text-center w-[44px]">
        {medal
          ? <span className="text-[17px] leading-none">{medal}</span>
          : <span className="font-bebas text-[14px] text-[#4a6070]">{row.rank}</span>}
      </td>

      {/* Técnico */}
      <td className="px-4 py-[11px] border-b border-border w-[140px]">
        <div className={`font-bebas text-[16px] tracking-[1px] leading-tight ${isPodium ? 'text-gold' : 'text-white'}`}>
          {row.nickname}
        </div>
        <div className="text-[10px] text-[#4a6070] mt-[1px]">
          {row.total_titles > 0
            ? `${row.total_titles} título${row.total_titles !== 1 ? 's' : ''}`
            : 'sem títulos'}
        </div>
      </td>

      {/* Temporada 1 */}
      <td className="px-4 py-[11px] border-b border-r border-border">
        <SeasonCell
          clube={row.t1_clube}
          brasileirao={row.t1_brasileirao} copa_brasil={row.t1_copa_brasil}
          libertadores={row.t1_libertadores} sulamericana={row.t1_sulamericana}
          recopa={row.t1_recopa} mundial={row.t1_mundial} estadual={row.t1_estadual}
        />
      </td>

      {/* Temporada 2 */}
      <td className="px-4 py-[11px] border-b border-border">
        <SeasonCell
          clube={row.t2_clube} dim
          brasileirao={row.t2_brasileirao} copa_brasil={row.t2_copa_brasil}
          libertadores={row.t2_libertadores} sulamericana={row.t2_sulamericana}
          recopa={row.t2_recopa} mundial={row.t2_mundial} estadual={row.t2_estadual}
        />
      </td>
    </tr>
  )
}
