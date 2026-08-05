import type { SidebarState } from '../../hooks/useSidebar'

interface SidebarProps {
  state: SidebarState
  onCycle: () => void
}

const navItems = [
  {
    label: 'Calendar',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    label: 'Tasks',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    label: 'Rewards',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
  {
    label: 'Meals',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    label: 'Photos',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    label: 'Lists',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
]

export function Sidebar({ state, onCycle }: SidebarProps) {
  const isHidden = state === 'hidden'
  const isCollapsed = state === 'collapsed'

  if (isHidden) return null

  return (
    <nav
      className={`bg-white border-r border-gray-200 flex flex-col relative transition-all duration-250 ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Sliding Handle */}
      <button
        onClick={onCycle}
        className="absolute right-0 top-[40%] -translate-y-1/2 translate-x-full w-4 h-14 bg-white border border-gray-300 border-l-0 rounded-r-lg cursor-pointer flex flex-col items-center justify-center gap-[3px] z-20 hover:bg-gray-50 transition-colors shadow-[2px_0_4px_rgba(0,0,0,0.06)]"
        title="Click to toggle sidebar"
      >
        <span className="w-2 h-0.5 bg-gray-400 rounded-full" />
        <span className="w-2 h-0.5 bg-gray-400 rounded-full" />
        <span className="w-2 h-0.5 bg-gray-400 rounded-full" />
      </button>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1 pt-4">
        {navItems.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors rounded-[10px] mx-2 whitespace-nowrap overflow-hidden ${
              i === 0
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span
              className={`transition-opacity duration-150 ${isCollapsed ? 'opacity-0 pointer-events-none' : ''}`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="border-t border-gray-100 pt-2 pb-3">
        <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-100 rounded-[10px] mx-2 whitespace-nowrap overflow-hidden text-gray-700">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span
            className={`transition-opacity duration-150 ${isCollapsed ? 'opacity-0 pointer-events-none' : ''}`}
          >
            Settings
          </span>
        </div>
      </div>
    </nav>
  )
}
