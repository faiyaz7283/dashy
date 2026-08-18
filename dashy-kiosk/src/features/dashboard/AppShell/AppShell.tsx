/**
 * AppShell — layout orchestrator for the dashboard.
 *
 * Composes the header, sidebar, main content area, and status bar.
 * Manages data fetching, kiosk-specific hooks, and view rendering.
 * Extracted from App.tsx to separate layout concerns from the root component.
 */

import { useEffect, useState } from 'react'
import { Header } from '@/features/dashboard/Header'
import { Sidebar } from '@/features/navigation/Sidebar'
import { FamilyPills } from '@/features/dashboard/FamilyPills'
import { DensityBadge } from '@/features/dashboard/DensityBadge'
import { StickyArea } from '@/features/kiosk/components/StickyArea'
import { ViewSwitcher } from '@/features/navigation/ViewSwitcher'
import { SideNav } from '@/features/navigation/SideNav'
import { WeekGrid } from '@/features/calendar/views/WeekGrid'
import { MonthView } from '@/features/calendar/views/MonthView'
import { DayView } from '@/features/calendar/views/DayView'
import { YearView } from '@/features/calendar/views/YearView'
import { StatusBar } from '@/features/navigation/StatusBar'
import { DateDisplay } from '@/features/calendar/components/DateDisplay'
import { LoadingSkeleton } from '@/shared/components/LoadingSkeleton'
import { useOrientation } from '@/features/kiosk/hooks/useOrientation'
import { useSidebar } from '@/features/dashboard/hooks/useSidebar'
import { useCalendarEvents } from '@/features/calendar/hooks/useCalendarEvents'
import { useApi } from '@/shared/hooks/useApi'
import { useEdgeProximity } from '@/features/kiosk/hooks/useEdgeProximity'
import { useViewportWidth } from '@/features/kiosk/hooks/useViewportWidth'
import { useUiScale } from '@/features/kiosk/hooks/useUiScale'
import { useIdleCursor } from '@/features/kiosk/hooks/useIdleCursor'
import { useViewNavigation } from '@/shared/hooks/useViewNavigation'
import { getWeather, getFamilyMembers, waitForBackend } from '@/shared/services/api'
import { ENDPOINTS } from '@/shared/api/endpoints'
import { colors, spacing, layout } from '@/theme/tokens'
import { isSameDay } from '@/shared/utils/dateFormat'
import { getDensityInfo } from '@/domain/calendar/density'

/**
 * AppShell component — orchestrates layout and data fetching.
 *
 * @returns The complete dashboard layout.
 */
export function AppShell() {
  const [backendReady, setBackendReady] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const {
    currentView,
    currentDate,
    setCurrentView,
    setCurrentDate,
    navigatePrevious,
    navigateNext,
    navigateToday,
    handleDayClick,
    handleMonthClick,
  } = useViewNavigation()

  const orientation = useOrientation()

  // Auto-hide chrome when the mouse is away from its screen edge
  // (macOS-Dock style: header top, sidebar left, status bar bottom)
  const headerVisible = useEdgeProximity({ edge: 'top', triggerZone: 60, hideDelay: 3000 })
  const sidebarVisible = useEdgeProximity({ edge: 'left', triggerZone: 60, hideDelay: 3000 })
  const statusBarVisible = useEdgeProximity({ edge: 'bottom', triggerZone: 60, hideDelay: 3000 })

  const { state: sidebarState, setState: setSidebarState } = useSidebar(orientation, sidebarVisible)

  // Responsive header tiers by viewport width:
  // compact labels < 1300, then items drop in priority order as it narrows
  const vw = useViewportWidth()
  const headerCompact = vw < 1300
  const showPills = vw >= 1000
  const showClock = vw >= 800
  const showWeather = vw >= 640
  const showDate = vw >= 500

  // Uniform UI scale for wide/high-resolution monitors (1 on 1080p-class displays)
  const uiScale = useUiScale()

  // Hide the mouse cursor after a short idle period (kiosk / wall-mounted display)
  useIdleCursor({ idleMs: 2000 })

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
  } = useApi(getWeather, { refetchInterval: ENDPOINTS.weather.refreshInterval })
  const {
    data: familyMembers,
    loading: familyLoading,
    error: familyError,
  } = useApi(getFamilyMembers)

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
    return <LoadingSkeleton />
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

  const densityInfo = getDensityInfo(currentView, currentDate, calendarEvents)
  const sidebarWidth =
    sidebarState === 'full'
      ? layout.sidebarFull
      : sidebarState === 'collapsed'
        ? layout.sidebarCollapsed
        : 0
  const isViewingToday = isSameDay(currentDate, new Date())

  /**
   * Renders the active calendar view.
   */
  const renderView = () => {
    switch (currentView) {
      case 'day':
        return (
          <DayView
            currentDate={currentDate}
            events={calendarEvents}
            members={familyMembers}
            weatherForecast={weather?.forecast || []}
          />
        )
      case 'week':
        return (
          <WeekGrid
            events={calendarEvents}
            members={familyMembers}
            orientation={orientation}
            currentDate={currentDate}
            onDayClick={handleDayClick}
            weatherForecast={weather?.forecast || []}
          />
        )
      case 'month':
        return (
          <MonthView
            currentDate={currentDate}
            events={calendarEvents}
            members={familyMembers}
            onDayClick={handleDayClick}
            weatherForecast={weather?.forecast || []}
          />
        )
      case 'year':
        return (
          <YearView
            currentDate={currentDate}
            events={calendarEvents}
            members={familyMembers}
            onMonthClick={handleMonthClick}
            onDayClick={handleDayClick}
            orientation={orientation}
          />
        )
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        // 100vh evaluates in zoomed pixels under CSS zoom, so divide by the
        // scale factor to make the app exactly fill the visible height
        height: `calc(100vh / ${uiScale})`,
        background: colors.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: 'hidden',
        // Uniform scale-up on wide monitors (zoom reflows layout, unlike
        // transform: scale which breaks sticky/fixed positioning)
        zoom: uiScale,
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
            currentDate={currentDate}
            showDate={showDate}
            showClock={showClock}
            showWeather={showWeather}
          >
            {showPills && (
              <FamilyPills
                members={familyMembers}
                events={calendarEvents}
                compact={headerCompact}
              />
            )}
            <DensityBadge
              density={densityInfo.density}
              label={headerCompact ? densityInfo.shortLabel : densityInfo.label}
            />
            <div
              style={{ width: '1px', height: '24px', background: colors.border, margin: '0 4px' }}
            />
            <ViewSwitcher
              activeView={currentView}
              onViewChange={setCurrentView}
              compact={headerCompact}
            />
            <div
              style={{ width: '1px', height: '24px', background: colors.border, margin: '0 4px' }}
            />
            <button
              onClick={navigateToday}
              title="Today"
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
              {headerCompact ? 'T' : 'Today'}
            </button>
            <div
              style={{ width: '1px', height: '24px', background: colors.border, margin: '0 4px' }}
            />
            <DateDisplay
              currentDate={currentDate}
              currentView={currentView}
              onDateChange={setCurrentDate}
              compact={headerCompact}
            />
          </Header>
        }
        visible={headerVisible}
      />

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar state={sidebarState} onChange={setSidebarState} onRefreshCalendar={forceRefresh} />
        <main style={{ flex: 1, overflowY: 'auto', padding: `${spacing.xl}px` }}>
          {renderView()}
        </main>
      </div>

      <StatusBar
        calendarLastRefresh={calendarLastRefresh}
        weatherLastRefresh={weatherLastRefresh}
        visible={statusBarVisible}
      />
    </div>
  )
}
