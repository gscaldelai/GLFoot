// ════════════════════════════════════════════════════════
//  GLfoot — User Scope (QA R-10)
//
//  Os stores de jogo persistem em localStorage com chaves fixas
//  (glfoot-career, glfoot-finance, ...). Sem isolamento, dois usuários
//  no mesmo browser compartilham — e sobrescrevem — a carreira um do outro.
//
//  Este módulo namespaceia a persistência por usuário: cada store passa a
//  gravar em `glfoot-career::u_<id>` etc. Como a chave só é conhecida DEPOIS
//  do login, os stores usam `skipHydration: true` (ficam nos defaults) e a
//  hidratação é dirigida daqui — no boot e a cada login/logout.
//
//  glfoot-auth NÃO entra aqui: é global de propósito (guarda quem está logado).
// ════════════════════════════════════════════════════════
import { useAuthStore }       from './useAuthStore'
import { useMatchStore }      from './useMatchStore'
import { useFinanceStore }    from './useFinanceStore'
import { useLineupStore }     from './useLineupStore'
import { useConfidenceStore } from './useConfidenceStore'
import { useStadiumStore }    from './useStadiumStore'
import { useCoachStore }      from './useCoachStore'
import { useTransferStore }   from './useTransferStore'

interface PersistApi {
  setOptions: (o: { name?: string }) => void
  rehydrate:  () => void | Promise<void>
}
interface AnyStore {
  getState: () => Record<string, unknown>
  setState: (partial: Record<string, unknown>) => void
  persist:  PersistApi
}

interface Scoped {
  store:    AnyStore
  baseName: string
  initial:  Record<string, unknown>   // defaults reais (capturados antes de hidratar)
}

const registry: Scoped[] = []
let currentUserId: string | null | undefined = undefined  // undefined = ainda não sincronizado

function scopedKey(baseName: string, scope: string): string {
  return `${baseName}::u_${scope}`
}

// ── Migração única ────────────────────────────────────────────────────────────
// O primeiro usuário a logar adota os saves antigos (sem namespace), para não
// perder a carreira em andamento de quem já jogava antes deste isolamento.
// O flag garante que só o PRIMEIRO usuário herde o save compartilhado.
const MIGRATED_FLAG = 'glfoot-scope-migrated'
function adoptLegacySavesOnce(userId: string) {
  if (localStorage.getItem(MIGRATED_FLAG)) return
  for (const { baseName } of registry) {
    const legacy = localStorage.getItem(baseName)
    const nsKey  = scopedKey(baseName, userId)
    if (legacy !== null && localStorage.getItem(nsKey) === null) {
      localStorage.setItem(nsKey, legacy)
    }
  }
  localStorage.setItem(MIGRATED_FLAG, '1')
}

/**
 * Aponta todos os stores de jogo para o escopo do usuário e re-hidrata.
 * No-op se o usuário não mudou. Chamada no boot e a cada login/logout.
 */
export function syncUserScope(userId: string | null) {
  if (userId === currentUserId) return
  currentUserId = userId
  if (userId) adoptLegacySavesOnce(userId)

  // Deslogado grava num escopo descartável ('guest') — nunca no save de um usuário real
  const scope = userId ?? 'guest'

  for (const { store, baseName, initial } of registry) {
    const nsKey = scopedKey(baseName, scope)
    // Preserva o save do novo usuário ANTES de qualquer escrita: o setState de
    // reset abaixo grava os defaults na chave nova (por isso guardamos o raw).
    const saved = userId ? localStorage.getItem(nsKey) : null

    store.persist.setOptions({ name: nsKey })
    // Zera a memória → sem isso, um novo usuário SEM save veria os dados do
    // usuário anterior (rehydrate faz merge e não limparia as chaves ausentes)
    store.setState({ ...initial })

    if (saved !== null) {
      localStorage.setItem(nsKey, saved)  // restaura o save intacto (o reset o havia sobrescrito)
      store.persist.rehydrate()           // e o carrega para a memória
    }

    // Converge a persistência para o estado ATUAL. Sem isto, o glfoot-career
    // (storage com throttle) deixaria uma gravação adiada do `initial` do reset
    // pendente — o rehydrate não re-persiste — e o timer assentaria esse
    // `initial` sobre o save recém-restaurado, perdendo a carreira no próximo F5.
    store.setState({ ...store.getState() })
  }
}

let wired = false
/** Registra os stores e conecta o escopo ao ciclo de login. Idempotente. */
export function initUserScope() {
  if (wired) return
  wired = true

  const stores: [AnyStore, string][] = [
    [useMatchStore      as unknown as AnyStore, 'glfoot-career'],
    [useFinanceStore    as unknown as AnyStore, 'glfoot-finance'],
    [useLineupStore     as unknown as AnyStore, 'glfoot-lineup'],
    [useConfidenceStore as unknown as AnyStore, 'glfoot-confidence'],
    [useStadiumStore    as unknown as AnyStore, 'glfoot-stadium'],
    [useCoachStore      as unknown as AnyStore, 'glfoot-coaches'],
    [useTransferStore   as unknown as AnyStore, 'glfoot-transfers'],
  ]
  for (const [store, baseName] of stores) {
    // skipHydration mantém os stores nos defaults aqui → snapshot = defaults reais
    registry.push({ store, baseName, initial: { ...store.getState() } })
  }

  // Sincroniza com o usuário já autenticado no boot e a cada login/logout
  syncUserScope(useAuthStore.getState().user?.id ?? null)
  useAuthStore.subscribe((s) => syncUserScope(s.user?.id ?? null))
}
