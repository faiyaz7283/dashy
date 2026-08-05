import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { FamilyPills } from './components/FamilyPills'
import { WeekGrid } from './components/WeekGrid'
import { useOrientation } from './hooks/useOrientation'
import { useSidebar } from './hooks/useSidebar'
import { useApi } from './hooks/useApi'
import { getCalendar, getWeather, getFamilyMembers } from './services/api'

export function App() {
  const orientation = useOrientation()
  const { state: sidebarState, cycle: cycleSidebar, open: openSidebar } = useSidebar(orientation)

  const { data: calendar, loading: calendarLoading, error: calendarError } = useApi(getCalendar, [])
  const { data: weather, loading: weatherLoading, error: weatherError } = useApi(getWeather, [])
  const {
    data: familyMembers,
    loading: familyLoading,
    error: familyError,
  } = useApi(getFamilyMembers, [])

  if (calendarLoading || weatherLoading || familyLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (calendarError || weatherError || familyError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-red-600">
          Error: {calendarError || weatherError || familyError}
        </div>
      </div>
    )
  }

  if (!calendar || !weather || !familyMembers) {
    return null
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <Header weather={weather.current} sidebarState={sidebarState} onOpenSidebar={openSidebar} />
      <FamilyPills members={familyMembers} events={calendar.events} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar state={sidebarState} onCycle={cycleSidebar} />
        <main className="flex-1 overflow-y-auto p-5">
          <WeekGrid events={calendar.events} members={familyMembers} orientation={orientation} />
        </main>
      </div>
    </div>
  )
}
