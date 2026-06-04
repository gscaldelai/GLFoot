import { useMatchStore } from '@/stores/useMatchStore'
import { useAuthStore }  from '@/stores/useAuthStore'
import AuthScreen  from '@/pages/AuthScreen'
import ClubSelect  from '@/pages/ClubSelect'
import ManagerHub  from '@/pages/ManagerHub'
import Match       from '@/pages/Match'

export default function App() {
  const user   = useAuthStore(s => s.user)
  const screen = useMatchStore(s => s.screen)

  // Usuário não autenticado → tela de login/ranking
  if (!user) return (
    <div className="w-full h-full flex overflow-hidden bg-bg font-raj">
      <AuthScreen />
    </div>
  )

  return (
    <div className="w-full h-full flex overflow-hidden bg-bg font-raj">
      {screen === 'select' && <ClubSelect />}
      {screen === 'hub'    && <ManagerHub />}
      {screen === 'match'  && <Match />}
    </div>
  )
}
