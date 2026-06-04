import { useEffect } from 'react'
import { useMatchStore } from '@/stores/useMatchStore'

export default function GoalOverlay() {
  const goalFlash    = useMatchStore(s => s.goalFlash)
  const clearGoalFlash = useMatchStore(s => s.clearGoalFlash)
  const homeClub     = useMatchStore(s => s.homeClub)

  useEffect(() => {
    if (!goalFlash) return
    const t = setTimeout(clearGoalFlash, 2500)
    return () => clearTimeout(t)
  }, [goalFlash, clearGoalFlash])

  if (!goalFlash) return null

  const isAway    = goalFlash.isAway
  const awayColor = isAway ? '#10a050' : undefined

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[200]">
      <div
        className={`border-3 rounded-2xl px-9 py-3 flex items-center gap-3 anim-popin
                    shadow-[0_12px_40px_rgba(0,0,0,.9)]`}
        style={{
          background: isAway
            ? 'linear-gradient(135deg,#001a08,#002d10)'
            : 'linear-gradient(135deg,#1a1200,#2a1e00)',
          border: `3px solid ${awayColor ?? '#f0c040'}`,
          boxShadow: `0 12px 40px rgba(0,0,0,.9), 0 0 50px ${isAway ? 'rgba(16,160,80,.2)' : 'rgba(240,192,64,.2)'}`,
        }}
      >
        <div className="text-5xl anim-spin select-none">⚽</div>
        <div>
          <div
            className="font-bebas text-[52px] leading-none tracking-[5px]"
            style={{ color: awayColor ?? '#f0c040' }}
          >
            GOOOOOL!
          </div>
          <div className="text-[13px] font-semibold text-[#aaa] mt-[3px]">
            {goalFlash.scorer}
            {isAway ? ` — ${homeClub ? '' : ''}` : ''}
          </div>
        </div>
        <div className="text-5xl anim-spin select-none">⚽</div>
      </div>
    </div>
  )
}
