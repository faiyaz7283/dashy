/**
 * Default theme configuration for the Dashy application.
 *
 * This file composes the raw design tokens from `tokens.ts` into a semantic
 * theme configuration object. When a settings/configuration system is
 * implemented, user preferences will override these defaults at runtime.
 *
 * Structure:
 * - `calendar`: View-specific configuration (grid sizes, timeline bounds).
 * - `density`: Thresholds and labels for the density system.
 * - `dateFormat`: Locale and formatting options for date displays.
 *
 * To swap themes or apply user settings, replace or merge values into this
 * object. Components should read from this config rather than raw tokens
 * when the value is user-configurable.
 */

import { colors, densityColors, densityBarColors, layout, spacing, radii, zIndices } from './tokens'

/**
 * Application locale for date/time formatting.
 *
 * Single source of truth — all `toLocaleDateString`, `toLocaleTimeString`,
 * and `toLocaleString` calls should use this constant instead of hardcoded strings.
 */
export const LOCALE = 'en-US'

/** Density level identifier. */
export type DensityLevel = 'none' | 'low' | 'medium' | 'high'

/**
 * Default theme configuration.
 *
 * All values here can be overridden by user settings in the future.
 * Components should import `themeConfig` and read values from it.
 */
export const themeConfig = {
  /** Color tokens — can be overridden for dark mode or custom palettes. */
  colors,
  densityColors,
  densityBarColors,

  /** Layout dimensions — can be adjusted for compact/comfortable modes. */
  layout,
  spacing,
  radii,
  zIndices,

  /** Calendar-specific configuration. */
  calendar: {
    /** Number of days shown in the week view grid. */
    weekDaysCount: 8,

    /** Grid columns for landscape vs portrait orientation. */
    weekGridLandscape: 4,
    weekGridPortrait: 2,

    /** Year view grid columns: 4×3 landscape, 3×4 portrait. */
    yearGridLandscape: 4,
    yearGridPortrait: 3,

    /** Day view timeline bounds (24h format). Full 24 hours. */
    timelineStartHour: 0,
    timelineEndHour: 23,

    /** Auto-scroll offset above current time (px). */
    timelineScrollOffset: 100,
  },

  /** Density system configuration. */
  density: {
    /**
     * Relative density thresholds (for year/month/week views).
     *
     * `ratio = (count - min) / (max - min)` among non-zero counts.
     * - ratio < lowThreshold → 'low'
     * - ratio < mediumThreshold → 'medium'
     * - ratio >= mediumThreshold → 'high'
     */
    relativeLowThreshold: 0.33,
    relativeMediumThreshold: 0.66,

    /**
     * Absolute density thresholds (for day view).
     *
     * Based on raw event count for the day:
     * - 0 events → 'none'
     * - 1–2 events → 'low'
     * - 3–5 events → 'medium'
     * - 6+ events → 'high'
     */
    absoluteLowMax: 2,
    absoluteMediumMax: 5,
  },

  /** Date formatting configuration. */
  dateFormat: {
    /** Locale for date formatting. */
    locale: LOCALE,

    /** Whether to use ordinal suffixes (1st, 2nd, 3rd, etc.). */
    useOrdinalSuffix: true,
  },
} as const

/** Type for the theme configuration — useful for settings overrides. */
export type ThemeConfig = typeof themeConfig
