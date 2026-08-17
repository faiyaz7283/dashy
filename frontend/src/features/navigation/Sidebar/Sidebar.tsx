import { useCallback, useEffect, useRef } from 'react'
import type { SidebarState } from '@/features/dashboard/hooks/useSidebar'
import { NAV_ITEMS } from '@/shared/config/navigation'

interface SidebarProps {
  state: SidebarState
  onChange: (state: SidebarState) => void
  onRefreshCalendar?: () => void
}

const SIDEBAR_FULL = 224 // w-56 = 14rem = 224px
const SIDEBAR_COLLAPSED = 64 // w-16 = 4rem = 64px
const SIDEBAR_HIDDEN = 0
const DRAG_THRESHOLD = 5 // pixels to distinguish click from drag

export function Sidebar({ state, onChange, onRefreshCalendar }: SidebarProps) {
  const navRef = useRef<HTMLElement>(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const sidebarStartWidth = useRef(0)
  const dragDistance = useRef(0)

  const isHidden = state === 'hidden'
  const isCollapsed = state === 'collapsed'

  // Get width for current state
  const getStateWidth = (s: SidebarState) => {
    if (s === 'full') return SIDEBAR_FULL
    if (s === 'collapsed') return SIDEBAR_COLLAPSED
    return SIDEBAR_HIDDEN
  }

  // Drag handlers
  const startDrag = (clientX: number) => {
    isDragging.current = true
    dragDistance.current = 0

    const nav = navRef.current
    if (!nav) return

    // Remove transition during drag
    nav.style.transition = 'none'

    // Set explicit width based on current state
    const startWidth = getStateWidth(state)
    nav.style.width = `${startWidth}px`

    dragStartX.current = clientX
    sidebarStartWidth.current = startWidth
  }

  const onDrag = (clientX: number) => {
    if (!isDragging.current) return

    const nav = navRef.current
    if (!nav) return

    const delta = clientX - dragStartX.current
    dragDistance.current = Math.abs(delta)
    const newWidth = Math.max(
      SIDEBAR_HIDDEN,
      Math.min(SIDEBAR_FULL, sidebarStartWidth.current + delta),
    )

    nav.style.width = `${newWidth}px`

    // Show/hide labels based on width
    const labels = nav.querySelectorAll('[data-sidebar-label]')
    labels.forEach((label) => {
      const el = label as HTMLElement
      el.style.opacity = newWidth > 100 ? '1' : '0'
      el.style.pointerEvents = newWidth > 100 ? 'auto' : 'none'
    })
  }

  const endDrag = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false

    const nav = navRef.current
    if (!nav) return

    // Read current width BEFORE resetting styles
    const currentWidth = nav.offsetWidth

    // Reset inline styles
    nav.style.transition = ''
    nav.style.width = ''

    // Reset label styles
    const labels = nav.querySelectorAll('[data-sidebar-label]')
    labels.forEach((label) => {
      const el = label as HTMLElement
      el.style.opacity = ''
      el.style.pointerEvents = ''
    })

    // If drag distance is below threshold, treat as click (no state change)
    if (dragDistance.current < DRAG_THRESHOLD) return

    // Snap to the nearest size state — hiding is owned by edge proximity
    // (useEdgeProximity), so dragging only switches between full/collapsed
    const newState: SidebarState = currentWidth > 150 ? 'full' : 'collapsed'

    onChange(newState)
  }, [onChange])

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    startDrag(e.clientX)
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e.touches[0]!.clientX)
  }

  // Global mouse/touch move and end events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => onDrag(e.clientX)
    const handleTouchMove = (e: TouchEvent) => onDrag(e.touches[0]!.clientX)
    const handleMouseUp = () => endDrag()
    const handleTouchEnd = () => endDrag()

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [endDrag])

  return (
    <nav
      ref={navRef}
      className={`bg-white border-r flex flex-col relative transition-all duration-250 ${
        isHidden ? 'w-0 overflow-hidden' : isCollapsed ? 'w-16' : 'w-56'
      }`}
      style={{ borderColor: 'var(--dt-border)' }}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="absolute right-0 top-[40%] -translate-y-1/2 translate-x-full w-4 h-14 bg-white cursor-grab active:cursor-grabbing flex flex-col items-center justify-center gap-[3px] z-20 hover:bg-bg transition-colors select-none"
        style={{
          border: '1px solid var(--dt-border-dark)',
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          boxShadow: 'var(--dt-shadow-sidebar)',
        }}
        title="Drag to resize"
      >
        <span className="w-2 h-0.5 rounded-full" style={{ background: 'var(--dt-text-faint)' }} />
        <span className="w-2 h-0.5 rounded-full" style={{ background: 'var(--dt-text-faint)' }} />
        <span className="w-2 h-0.5 rounded-full" style={{ background: 'var(--dt-text-faint)' }} />
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1 pt-4">
        {NAV_ITEMS.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors whitespace-nowrap overflow-hidden ${
              i === 0 ? 'font-semibold' : 'hover:bg-bg-hover'
            }`}
            style={{
              borderRadius: '10px',
              margin: '0 8px',
              background: i === 0 ? 'var(--dt-primary-light)' : 'transparent',
              color: i === 0 ? 'var(--dt-primary)' : 'var(--dt-text-secondary)',
            }}
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
              data-sidebar-label
              className={`transition-opacity duration-150 ${isCollapsed || isHidden ? 'opacity-0 pointer-events-none' : ''}`}
            >
              {item.label}
            </span>
            {/* Refresh icon next to Calendar link (full state only) */}
            {i === 0 && !isHidden && !isCollapsed && onRefreshCalendar && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRefreshCalendar()
                }}
                className="ml-auto p-1 hover:bg-primary-light-hover rounded transition-colors"
                title="Refresh calendar"
              >
                <svg
                  className="w-3.5 h-3.5"
                  style={{ color: 'var(--dt-primary-ring)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="pt-2 pb-3" style={{ borderTop: '1px solid var(--dt-border-light)' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-bg-hover whitespace-nowrap overflow-hidden"
          style={{
            borderRadius: '10px',
            margin: '0 8px',
            color: 'var(--dt-text-secondary)',
          }}
        >
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
            data-sidebar-label
            className={`transition-opacity duration-150 ${isCollapsed || isHidden ? 'opacity-0 pointer-events-none' : ''}`}
          >
            Settings
          </span>
        </div>
      </div>
    </nav>
  )
}
