import type { WeatherCurrent } from '../../types'
import { WeatherWidget } from '../WeatherWidget'
import { Clock } from '../Clock'
import type { SidebarState } from '../../hooks/useSidebar'

interface HeaderProps {
  weather: WeatherCurrent
  sidebarState: SidebarState
  onOpenSidebar: () => void
}

export function Header({ weather, sidebarState, onOpenSidebar }: HeaderProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-4">
        {sidebarState === 'hidden' && (
          <button
            onClick={onOpenSidebar}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
            title="Open sidebar"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          D
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-800">{dateStr}</h1>
          <Clock />
          <WeatherWidget weather={weather} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
          Week
        </button>
        <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter
        </button>
        <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
          &lt;
        </button>
        <button className="px-4 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition">
          Today
        </button>
        <button className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
          &gt;
        </button>
      </div>
    </header>
  )
}
