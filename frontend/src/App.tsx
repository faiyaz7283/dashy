import { useEffect, useState, useCallback } from 'react'
import type { CalendarView } from './types'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { FamilyPills } from './components/FamilyPills'
import { DensityBadge } from './components/DensityBadge'
import { StickyArea } from './components/StickyArea'
import { ViewSwitcher } from './components/ViewSwitcher'
import { SideNav } from './components/SideNav'
import { WeekGrid } from './components/WeekGrid'
import { MonthView } from './components/MonthView'
import { DayView } from './components/DayView'
import { YearView } from './components/YearView'
import { StatusBar } from './components/StatusBar'
import { DateDisplay } from './components/DateDisplay'
import { useOrientation } from './hooks/useOrientation'
import { useSidebar } from './hooks/useSidebar'
import { useCalendarEvents } from './hooks/useCalendarEvents'
import { useApi } from './hooks/useApi'
import { useAutoHideHeader } from './hooks/useAutoHideHeader'
import { useScaleToFit } from './hooks/useScaleToFit'
import { getWeather, getFamilyMembers, waitForBackend } from './services/api'
import { colors, spacing, layout } from './theme/tokens'
import { getWeekDays, isSameDay } from './utils/dateFormat'
import { getRelativeDensity, getAbsoluteDensity } from './utils/density'

const VIEW_STORAGE_KEY = 'dashy-calendar-view'

export function App() {
  const [backendReady, setBackendReady] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // View state with localStorage persistence
  const [currentView, setCurrentView] = useState<CalendarView>(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY)
    return (saved as CalendarView) || 'week'
  })

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date())

  const orientation = useOrientation()
  const {
    state: sidebarState,
    setState: setSidebarState,
    open: openSidebar,
  } = useSidebar(orientation)

  // Auto-hide header when mouse is away from top of screen
  const headerVisible = useAutoHideHeader({ triggerZone: 60, hideDelay: 3000 })

  // Uniform scale factor: design canvas (1920×1080) scaled to fit the viewport
  const scale = useScaleToFit()

  // Persist view and date changes
  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, currentView)
  }, [currentView])

  // Wait for backend to be ready before fetching data (retries indefinitely)
  useEffect(() => {
    waitForBackend((ms) => setElapsed(ms)).then(() => setBackendReady(true))
  }, [])

  const {
    events: calendarEvents,
    loading: calendarLoading,
    error: calendarError,
    lastRefresh: calendarLastRefresh,
    forceRefresh,
  } = useCalendarEvents(currentView, currentDate)
  const {
    data: weather,
    loading: weatherLoading,
    error: weatherError,
    lastRefresh: weatherLastRefresh,
  } = useApi(getWeather, [backendReady], { refetchInterval: 600000 }) // 10 minutes
  const {
    data: familyMembers,
    loading: familyLoading,
    error: familyError,
  } = useApi(getFamilyMembers, [backendReady])

  // Navigation handlers
  const navigatePrevious = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      switch (currentView) {
        case 'day':
          next.setDate(next.getDate() - 1)
          break
        case 'week':
          next.setDate(next.getDate() - 7)
          break
        case 'month':
          next.setMonth(next.getMonth() - 1)
          break
        case 'year':
          next.setFullYear(next.getFullYear() - 1)
          break
      }
      return next
    })
  }, [currentView])

  const navigateNext = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      switch (currentView) {
        case 'day':
          next.setDate(next.getDate() + 1)
          break
        case 'week':
          next.setDate(next.getDate() + 7)
          break
        case 'month':
          next.setMonth(next.getMonth() + 1)
          break
        case 'year':
          next.setFullYear(next.getFullYear() + 1)
          break
      }
      return next
    })
  }, [currentView])

  const navigateToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const handleDayClick = useCallback((date: Date) => {
    setCurrentDate(date)
    setCurrentView('day')
  }, [])

  const handleMonthClick = useCallback((month: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setMonth(month)
      return next
    })
    setCurrentView('month')
  }, [])

  if (!backendReady) {
    const seconds = Math.floor(elapsed / 1000)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: colors.bg,
        }}
      >
        <div style={{ fontSize: '18px', color: colors.textMuted }}>
          {seconds < 10 ? 'Connecting to backend...' : `Still connecting... (${seconds}s)`}
        </div>
      </div>
    )
  }

  if (calendarLoading || weatherLoading || familyLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: colors.bg,
        }}
      >
        <div style={{ fontSize: '18px', color: colors.textMuted }}>Loading...</div>
      </div>
    )
  }

  if (calendarError || weatherError || familyError) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: colors.bg,
        }}
      >
        <div style={{ fontSize: '18px', color: '#dc2626' }}>
          Error: {calendarError || weatherError || familyError}
        </div>
      </div>
    )
  }

  if (!weather || !familyMembers) {
    return null
  }

  // Calculate density badge info based on current view
  const getDensityInfo = () => {
    switch (currentView) {
      case 'day': {
        const dayEvents = calendarEvents.filter((e) => isSameDay(new Date(e.start), currentDate))
        const density = getAbsoluteDensity(dayEvents.length)
        return {
          density,
          label: `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`,
        }
      }
      case 'week': {
        const weekDays = getWeekDays(currentDate)
        const weekStart = weekDays[0]
        const weekEnd = weekDays[6]
        const weekEvents = calendarEvents.filter((e) => {
          const d = new Date(e.start)
          return d >= weekStart && d <= weekEnd
        })
        const density = getRelativeDensity(weekEvents.length, [weekEvents.length])
        return {
          density,
          label: `${weekEvents.length} events`,
        }
      }
      case 'month': {
        const monthEvents = calendarEvents.filter((e) => {
          const d = new Date(e.start)
          return (
            d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()
          )
        })
        const density = getRelativeDensity(monthEvents.length, [monthEvents.length])
        return {
          density,
          label: `${monthEvents.length} events`,
        }
      }
      case 'year': {
        const yearEvents = calendarEvents.filter((e) => {
          const d = new Date(e.start)
          return d.getFullYear() === currentDate.getFullYear()
        })
        const density = getRelativeDensity(yearEvents.length, [yearEvents.length])
        return {
          density,
          label: `${yearEvents.length} events`,
        }
      }
    }
  }

  const densityInfo = getDensityInfo()

  // Use calendarEvents directly for rendering (already filtered by view in the hook)
  const events = calendarEvents

  // Compute sidebar width for SideNav positioning
  const sidebarWidth =
    sidebarState === 'full'
      ? layout.sidebarFull
      : sidebarState === 'collapsed'
        ? layout.sidebarCollapsed
        : 0

  // Check if viewing today (for Today button styling)
  const isViewingToday = isSameDay(currentDate, new Date())

  // Render the active view
  const renderView = () => {
    switch (currentView) {
      case 'day':
        return <DayView currentDate={currentDate} events={events} members={familyMembers} />
      case 'week':
        return (
          <WeekGrid
            events={events}
            members={familyMembers}
            orientation={orientation}
            currentDate={currentDate}
            onDayClick={handleDayClick}
          />
        )
      case 'month':
        return (
          <MonthView
            currentDate={currentDate}
            events={events}
            members={familyMembers}
            onDayClick={handleDayClick}
          />
        )
      case 'year':
        return (
          <YearView
            currentDate={currentDate}
            events={events}
            members={familyMembers}
            onMonthClick={handleMonthClick}
            onDayClick={handleDayClick}
          />
        )
    }
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: colors.bg,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Fixed 1920×1080 design canvas, uniformly scaled to fit the viewport */}
      <div
        style={{
          width: `${layout.designWidth}px`,
          height: `${layout.designHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: colors.bg,
        }}
      >
        {/* Side navigation arrows */}
        <SideNav
          onPrevious={navigatePrevious}
          onNext={navigateNext}
          previousTitle={`Previous ${currentView}`}
          nextTitle={`Next ${currentView}`}
          sidebarWidth={sidebarWidth}
        />

        {/* Unified sticky area with auto-hide */}
        <StickyArea
          header={
            <Header
              weather={weather.current}
              sidebarState={sidebarState}
              onOpenSidebar={openSidebar}
              currentDate={currentDate}
            >
              <FamilyPills members={familyMembers} events={events} />
              <DensityBadge density={densityInfo.density} label={densityInfo.label} />
              <div
                style={{ width: '1px', height: '24px', background: colors.border, margin: '0 4px' }}
              />
              <ViewSwitcher activeView={currentView} onViewChange={setCurrentView} />
              <div
                style={{ width: '1px', height: '24px', background: colors.border, margin: '0 4px' }}
              />
              <button
                onClick={navigateToday}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: isViewingToday ? colors.primary : colors.textMuted,
                  background: isViewingToday ? colors.primaryLight : colors.white,
                  border: isViewingToday ? 'none' : `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Today
              </button>
              <div
                style={{ width: '1px', height: '24px', background: colors.border, margin: '0 4px' }}
              />
              <DateDisplay
                currentDate={currentDate}
                currentView={currentView}
                onDateChange={setCurrentDate}
              />
            </Header>
          }
          visible={headerVisible}
        />

        {/* Main content area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            state={sidebarState}
            onChange={setSidebarState}
            onRefreshCalendar={forceRefresh}
          />
          <main style={{ flex: 1, overflowY: 'auto', padding: `${spacing.xl}px` }}>
            {renderView()}
          </main>
        </div>

        <StatusBar
          calendarLastRefresh={calendarLastRefresh}
          weatherLastRefresh={weatherLastRefresh}
        />
      </div>
    </div>
  )
}
