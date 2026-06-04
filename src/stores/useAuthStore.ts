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
  const res = await fetch(`${API}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Erro desconhecido')
  return data
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:  null,
      token: null,

      async login(email, password) {
        const { user, token } = await apiPost('/api/auth/login', { email, password })
        set({ user, token })
      },

      async register(nickname, email, password, plan) {
        const { user, token } = await apiPost('/api/auth/register', { nickname, email, password, plan })
        set({ user, token })
      },

      logout() { set({ user: null, token: null }) },
    }),
    { name: 'glfoot-auth', version: 1 }
  )
)
