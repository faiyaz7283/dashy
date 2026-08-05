import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { FamilyPills } from './components/FamilyPills'
import { WeekGrid } from './components/WeekGrid'
import { useOrientation } from './hooks/useOrientation'
import { useSidebar } from './hooks/useSidebar'
import { useApi } from './hooks/useApi'
import { getCalendar, getWeather, getFamilyMembers, waitForBackend } from './services/api'

export function App() {
  const [backendReady, setBackendReady] = useState(false)
  const [backendError, setBackendError] = useState<string | null>(null)

  const orientation = useOrientation()
  const { state: sidebarState, cycle: cycleSidebar, open: openSidebar } = useSidebar(orientation)

  // Wait for backend to be ready before fetching data
  useEffect(() => {
    waitForBackend(30000)
      .then(() => setBackendReady(true))
      .catch((error) => setBackendError(error.message))
  }, [])

  const {
    data: calendar,
    loading: calendarLoading,
    error: calendarError,
  } = useApi(getCalendar, [backendReady])
  const {
    data: weather,
    loading: weatherLoading,
    error: weatherError,
  } = useApi(getWeather, [backendReady])
  const {
    data: familyMembers,
    loading: familyLoading,
    error: familyError,
  } = useApi(getFamilyMembers, [backendReady])

  if (backendError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-red-600">Backend Error: {backendError}</div>
      </div>
    )
  }

  if (!backendReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Connecting to backend...</div>
      </div>
    )
  }

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
