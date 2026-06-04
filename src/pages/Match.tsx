import Scoreboard   from '@/components/Scoreboard'
import Campo        from '@/components/Campo'
import EventsPanel  from '@/components/EventsPanel'
import GoalOverlay  from '@/components/GoalOverlay'
import VictoryOverlay from '@/components/VictoryOverlay'

export default function Match() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      <Scoreboard />
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <Campo />
        <EventsPanel />
      </div>
      <GoalOverlay />
      <VictoryOverlay />
    </div>
  )
}
