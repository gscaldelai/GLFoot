import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export interface AuthUser {
  id:       string
  email:    string
  nickname: string
  plan:     'free' | 'premium'
}

interface AuthStore {
  user:  AuthUser | null
  token: string | null
  login:    (email: string, password: string) => Promise<void>
  register: (nickname: string, email: string, password: string, plan: 'free' | 'premium') => Promise<void>
  logout:   () => void
}

async function apiPost(path: string, body: object, token?: string | null) {
  // Timeout curto: se o backend estiver fora do ar (ou a porta filtrada), o
  // fetch é abortado rápido e o login/cadastro cai no fallback local.
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 3500)
  try {
    const res = await fetch(`${API}${path}`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:   JSON.stringify(body),
      signal: ctrl.signal,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message ?? 'Erro desconhecido')
    return data
  } finally {
    clearTimeout(timer)
  }
}

// ── Fallback local (offline) ─────────────────────────────────────────────────
// Enquanto o backend (Postgres) não está no ar, login/cadastro funcionam
// localmente: a conta é um perfil no localStorage. Em produção, com
// VITE_API_URL apontando para o backend real, o caminho de API assume e este
// fallback nunca é acionado. Só cai aqui quando o `fetch` falha por rede
// (backend inacessível) — erros de HTTP do servidor (ex.: "e-mail já
// cadastrado") são propagados normalmente. Ver PLANO-PRODUCAO.md.
const LOCAL_USERS_KEY = 'glfoot-local-users'

interface LocalUser extends AuthUser { password: string }

function newId(): string {
  const c = globalThis.crypto
  return c && 'randomUUID' in c ? c.randomUUID() : `u_${Math.random().toString(36).slice(2, 12)}`
}

function readLocalUsers(): Record<string, LocalUser> {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLocalUsers(users: Record<string, LocalUser>): void {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

// Backend inacessível → cai no fallback local:
//  - TypeError: `fetch` falhou (conexão recusada, DNS, CORS).
//  - AbortError: timeout do AbortController (backend não respondeu a tempo).
// Erros de HTTP viram Error (com a mensagem da API) e NÃO caem no fallback.
function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError
    || (err instanceof DOMException && err.name === 'AbortError')
}

function localRegister(
  nickname: string, email: string, password: string, plan: 'free' | 'premium',
): { user: AuthUser; token: string } {
  const nick = nickname.trim()
  const key  = email.trim().toLowerCase()
  if (!nick)               throw new Error('Informe o nome do técnico')
  if (!key)                throw new Error('Informe um e-mail')
  if (password.length < 6) throw new Error('A senha deve ter ao menos 6 caracteres')

  const users = readLocalUsers()
  if (users[key]) throw new Error('E-mail já cadastrado')

  const user: AuthUser = { id: newId(), email: key, nickname: nick, plan }
  users[key] = { ...user, password }
  writeLocalUsers(users)
  return { user, token: 'local' }
}

function localLogin(email: string, password: string): { user: AuthUser; token: string } {
  const key   = email.trim().toLowerCase()
  const found = readLocalUsers()[key]
  if (!found || found.password !== password) throw new Error('E-mail ou senha inválidos')
  const { password: _pw, ...user } = found
  void _pw
  return { user, token: 'local' }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:  null,
      token: null,

      async login(email, password) {
        try {
          const { user, token } = await apiPost('/api/auth/login', { email, password })
          set({ user, token })
        } catch (err) {
          if (!isNetworkError(err)) throw err     // erro real do servidor → propaga
          const { user, token } = localLogin(email, password)   // backend offline → local
          set({ user, token })
        }
      },

      async register(nickname, email, password, plan) {
        try {
          const { user, token } = await apiPost('/api/auth/register', { nickname, email, password, plan })
          set({ user, token })
        } catch (err) {
          if (!isNetworkError(err)) throw err     // erro real do servidor → propaga
          const { user, token } = localRegister(nickname, email, password, plan)   // backend offline → local
          set({ user, token })
        }
      },

      logout() { set({ user: null, token: null }) },
    }),
    { name: 'glfoot-auth', version: 1 }
  )
)
