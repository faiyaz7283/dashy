/**
 * useIdleCursor — hide the mouse cursor after a period of inactivity.
 *
 * Works entirely inside the browser, so it is display-server agnostic
 * (X11, Wayland, XWayland, macOS, etc.). Used in the kiosk to keep a
 * wall-mounted mouse from leaving a persistent pointer on screen.
 *
 * The cursor starts hidden and only reappears when the user actually
 * interacts with the page; it disappears again after `idleMs` of inactivity.
 */

import { useEffect } from 'react'

const DEFAULT_IDLE_MS = 2000

interface UseIdleCursorOptions {
  /** Milliseconds of inactivity before hiding the cursor (default: 2000). */
  idleMs?: number
}

export function useIdleCursor(options: UseIdleCursorOptions = {}) {
  const idleMs = options.idleMs ?? DEFAULT_IDLE_MS

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const showCursor = () => {
      document.body.style.cursor = ''
    }

    const hideCursor = () => {
      document.body.style.cursor = 'none'
    }

    const resetTimer = () => {
      if (timer) clearTimeout(timer)
      showCursor()
      timer = setTimeout(hideCursor, idleMs)
    }

    // Start hidden: on a kiosk the pointer should not be visible on boot.
    hideCursor()

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart']
    events.forEach((event) => window.addEventListener(event, resetTimer))

    return () => {
      if (timer) clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
      showCursor()
    }
  }, [idleMs])
}
