/**
 * Root application shell — full-viewport layout with header, sidebar, status bar,
 * and content area.
 *
 * The shell provides the structural layout that all features render within.
 * Auto-hide behavior shows/hides shell elements based on cursor proximity to edges.
 * The content area fills the entire viewport with shell elements overlaying on top.
 *
 * Layout structure:
 * - Header: top edge, full width, fixed height (auto-hide)
 * - Sidebar: left edge, collapsible (icon-only / expanded), auto-hide
 * - Status bar: bottom edge, full width, fixed height (auto-hide)
 * - Content: fills entire viewport, shell elements overlay on top
 */

import { useState } from 'react'
import { useUiScale } from '@/shared/hooks/useUiScale'
import { useAutoHide } from '@/shared/hooks/useAutoHide'
import { useSidebarState } from '@/shared/hooks/useSidebarState'
import { useTheme } from '@/shared/hooks/useTheme'
import { useViewNavigation } from '@/shared/hooks/useViewNavigation'
import { useFamilyData } from '@/shared/hooks/useFamilyData'
import { layout } from '@/theme/tokens'
import { Header } from './Header'
import { Sidebar, type Feature } from './Sidebar'
import { StatusBar } from './StatusBar'
import { DayView } from '@/features/calendar/views/DayView'
import { WeekView } from '@/features/calendar/views/WeekView'
import { MonthView } from '@/features/calendar/views/MonthView'
import { YearView } from '@/features/calendar/views/YearView'
import { ChoresView } from '@/features/chores/views/ChoresView'

/**
 * Root application layout component.
 *
 * Applies UI scaling, manages shell state (auto-hide, sidebar, theme, view),
 * and renders the interactive shell with Header, Sidebar, and StatusBar.
 * The content area displays a placeholder until Phase 2+ integrates feature views.
 *
 * @returns The full-viewport application shell with interactive navigation.
 */
export default function AppShell() {
  // UI scaling
  useUiScale()

  // Family data
  const { members } = useFamilyData()

  // Shell state
  const [activeFeature, setActiveFeature] = useState<Feature>('calendar')
  const { isExpanded: isSidebarExpanded, toggle: toggleSidebar } = useSidebarState()
  const { mode: themeMode, cycleMode: cycleTheme } = useTheme()
  const { currentView, setCurrentView, currentDate, navigatePrevious, navigateNext, navigateToday } = useViewNavigation()

  // Auto-hide behavior
  const { isVisible: isHeaderVisible, elementRef: headerRef } = useAutoHide({ edge: 'top' })
  const { isVisible: isSidebarVisible, elementRef: sidebarRef } = useAutoHide({ edge: 'left' })
  const { isVisible: isStatusBarVisible, elementRef: statusBarRef } = useAutoHide({ edge: 'bottom' })

  // Feature navigation
  const handleFeatureChange = (feature: Feature) => {
    setActiveFeature(feature)
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-bg font-sans text-text-primary">
      {/* Header with auto-hide */}
      <div
        ref={headerRef}
        className={`absolute top-0 left-0 right-0 z-50 transition-all duration-400 ease-in-out ${
          isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <Header currentView={currentView} onViewChange={setCurrentView} onToday={navigateToday} />
      </div>

      {/* Sidebar with auto-hide — adjusts top/bottom to avoid header/status bar overlap */}
      <div
        ref={sidebarRef}
        className={`absolute left-0 z-40 transition-all duration-400 ease-in-out ${
          isSidebarVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{
          top: isHeaderVisible ? layout.headerHeight : 0,
          bottom: isStatusBarVisible ? layout.statusBarHeight : 0,
        }}
      >
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={toggleSidebar}
          activeFeature={activeFeature}
          onFeatureChange={handleFeatureChange}
        />
      </div>

      {/* Status bar with auto-hide */}
      <div
        ref={statusBarRef}
        className={`absolute bottom-0 left-0 right-0 z-50 transition-all duration-400 ease-in-out ${
          isStatusBarVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <StatusBar themeMode={themeMode} onThemeCycle={cycleTheme} />
      </div>

      {/* Main content area — fills entire viewport, shell elements overlay on top */}
      <main className="flex h-full w-full flex-col">
        {activeFeature === 'calendar' && (
          <>
            {currentView === 'day' && (
              <DayView date={currentDate} onPrevious={navigatePrevious} onNext={navigateNext} />
            )}
            {currentView === 'week' && (
              <WeekView date={currentDate} onPrevious={navigatePrevious} onNext={navigateNext} />
            )}
            {currentView === 'month' && (
              <MonthView date={currentDate} onPrevious={navigatePrevious} onNext={navigateNext} />
            )}
            {currentView === 'year' && (
              <YearView date={currentDate} onPrevious={navigatePrevious} onNext={navigateNext} />
            )}
          </>
        )}
        {activeFeature === 'chores' && <ChoresView members={members} />}
      </main>
    </div>
  )
}
