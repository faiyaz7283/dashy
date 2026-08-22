/**
 * Theme management hook — light/dark/auto toggle with localStorage persistence.
 *
 * In `auto` mode, respects the system's `prefers-color-scheme` media query.
 * The resolved theme (`light` or `dark`) is applied by toggling the `.dark`
 * class on `<html>`, which Tailwind's `@custom-variant dark` picks up.
 */

import { useState, useEffect, useCallback } from 'react'

/** Theme mode preference. */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** The actually applied theme (never `auto`). */
export type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'dashy-theme-mode'

/**
 * Returns the system's preferred color scheme.
 *
 * @returns 'dark' if the user prefers dark mode, 'light' otherwise.
 */
function getSystemPreference(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Resolves the effective theme from a mode and system preference.
 *
 * @param mode - The user's theme preference.
 * @returns The resolved theme ('light' or 'dark').
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'auto') return getSystemPreference()
  return mode
}

/**
 * Applies the resolved theme to the DOM.
 *
 * Toggles the `.dark` class on `<html>` which Tailwind's dark variant uses.
 *
 * @param theme - The resolved theme to apply.
 */
function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/** Return type of the useTheme hook. */
export interface UseThemeResult {
  /** The user's theme preference (light/dark/auto). */
  mode: ThemeMode
  /** The actually applied theme (light or dark). */
  resolvedTheme: ResolvedTheme
  /** Set the theme mode. Persists to localStorage. */
  setMode: (mode: ThemeMode) => void
  /** Cycle to the next theme mode: light → dark → auto → light. */
  cycleMode: () => void
}

/**
 * Manages the application theme.
 *
 * Persists the user's preference to localStorage. In `auto` mode, reacts
 * to system preference changes in real time via the `prefers-color-scheme`
 * media query listener.
 *
 * @returns Theme state and controls.
 *
 * @example
 * ```ts
 * const { mode, resolvedTheme, setMode, cycleMode } = useTheme()
 * // mode === 'auto', resolvedTheme === 'dark' (system prefers dark)
 * ```
 */
export function useTheme(): UseThemeResult {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved
    return 'auto'
  })

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(mode))

  // Apply theme to DOM whenever resolved theme changes
  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  // Listen for system preference changes (for auto mode)
  useEffect(() => {
    if (mode !== 'auto') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange() {
      setResolvedTheme(getSystemPreference())
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode])

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem(THEME_STORAGE_KEY, newMode)
    setResolvedTheme(resolveTheme(newMode))
  }, [])

  const cycleMode = useCallback(() => {
    const next: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'auto',
      auto: 'light',
    }
    setMode(next[mode])
  }, [mode, setMode])

  return { mode, resolvedTheme, setMode, cycleMode }
}
