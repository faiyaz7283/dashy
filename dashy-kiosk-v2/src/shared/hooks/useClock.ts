/**
 * Hook for a live-updating clock.
 *
 * Returns the current time as a Temporal.PlainTime, updating every second.
 * Uses Temporal.Now.plainTimeISO() for the current local time.
 */

import { useState, useEffect } from 'react'

/**
 * Returns the current local time, updating every second.
 *
 * @returns The current PlainTime (updates every 1000ms).
 */
export function useClock(): Temporal.PlainTime {
  const [time, setTime] = useState<Temporal.PlainTime>(() => Temporal.Now.plainTimeISO())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Temporal.Now.plainTimeISO())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return time
}
