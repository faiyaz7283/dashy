/**
 * Design tokens for the Dashy application.
 *
 * All visual values (colors, spacing, sizes, typography) are centralized here
 * so components reference tokens instead of hardcoded values. When a settings
 * or configuration system is implemented, these tokens can be swapped at
 * runtime by replacing the default values.
 *
 * Avoid adding hardcoded hex, px, rem, or other visual values directly in
 * components — always import from this file.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

/** Brand / primary palette. */
export const colors = {
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  primaryLight: '#eef2ff',
  primaryLightHover: '#e0e7ff',
  primaryRing: '#c7d2fe',

  /** Neutral / surface colors. */
  white: '#ffffff',
  bg: '#f9fafb',
  bgHover: '#f3f4f6',

  /** Text colors. */
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textFaint: '#9ca3af',
  textDisabled: '#d1d5db',

  /** Border colors. */
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',

  /** Status colors. */
  success: '#22c55e',
  danger: '#ef4444',
  dangerBg: '#fee2e2',
  dangerText: '#991b1b',
} as const

/**
 * Density color palette — cool-to-warm ramp.
 *
 * Each level has a `bg` (background) and `text` (foreground) color.
 * - none: grey (no events or minimal)
 * - low: green (light activity)
 * - medium: amber (moderate activity)
 * - high: red (heavy activity)
 */
export const densityColors = {
  none: { bg: '#f3f4f6', text: '#6b7280' },
  low: { bg: '#dcfce7', text: '#16a34a' },
  medium: { bg: '#fef3c7', text: '#d97706' },
  high: { bg: '#fee2e2', text: '#dc2626' },
} as const

/**
 * Density bar colors — slightly more saturated variants used for
 * visual density indicators (bars, columns, cells).
 */
export const densityBarColors = {
  none: '#f3f4f6',
  low: '#bbf7d0',
  medium: '#fcd34d',
  high: '#fca5a5',
} as const

/**
 * Family member pill / event colors keyed by member key.
 *
 * Each member has a bg (pill background), border, text, and avatar color.
 * These are used for family pills, event cards, and event borders.
 */
export const memberColors: Record<
  string,
  { bg: string; border: string; text: string; avatar: string }
> = {
  faiyaz: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', avatar: '#3b82f6' },
  trisha: { bg: '#fdf2f8', border: '#fbcfe8', text: '#9d174d', avatar: '#ec4899' },
  arya: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', avatar: '#22c55e' },
  raya: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', avatar: '#f59e0b' },
}

// ---------------------------------------------------------------------------
// Spacing (in px — used for padding, margin, gap)
// ---------------------------------------------------------------------------

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 48,
} as const

// ---------------------------------------------------------------------------
// Layout dimensions
// ---------------------------------------------------------------------------

export const layout = {
  /** Height of the top header bar. */
  headerHeight: 57,

  /** Height of the all-day section (day view only). */
  allDayHeight: 60,

  /** Sidebar widths. */
  sidebarFull: 224,
  sidebarCollapsed: 64,

  /** Logo dimensions. */
  logoSize: 36,

  /** View switcher button width. */
  viewBtnWidth: 56,

  /** Separator dimensions. */
  separatorWidth: 1,
  separatorHeight: 24,

  /** Side navigation arrow size. */
  sideNavArrowSize: 36,

  /** Date display width. */
  dateDisplayWidth: 200,

  /** Status bar height. */
  statusBarHeight: 28,

  /** Day view timeline hour row height. */
  timelineHourHeight: 64,

  /** Day view timeline label column width. */
  timelineLabelWidth: 60,
} as const

// ---------------------------------------------------------------------------
// Border radii
// ---------------------------------------------------------------------------

export const radii = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
  '2xl': 12,
  full: 999,
} as const

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const typography = {
  fontFamily: "'Inter', system-ui, sans-serif",

  /** Header title (date next to logo). */
  headerTitle: { size: 20, weight: 600 },

  /** Clock display. */
  clock: { size: 14, weight: 400 },

  /** Density / event count badge. */
  badge: { size: 11, weight: 600 },

  /** View switcher button text. */
  viewBtn: { size: 13, weight: 500 },
  viewBtnActive: { size: 13, weight: 600 },

  /** Family pill text. */
  pillText: { size: 13, weight: 500 },
  pillCount: { size: 11, weight: 400 },

  /** Pill avatar. */
  pillAvatar: { size: 20, weight: 700, fontSize: 11 },

  /** Event card title. */
  eventTitle: { size: 13, weight: 600 },
  eventTime: { size: 11, weight: 400 },

  /** Day card header. */
  dayCardTitle: { size: 18, weight: 700 },
  dayCardSubtext: { size: 12, weight: 400 },

  /** Month cell date number. */
  monthCellDate: { size: 13, weight: 500 },

  /** Mini calendar (year view). */
  miniWeekday: { size: 9, weight: 600 },
  miniDay: { size: 10, weight: 400 },

  /** Week day header. */
  weekDayName: { size: 11, weight: 600 },
  weekDayNum: { size: 20, weight: 600 },

  /** Month header cell. */
  monthHeaderCell: { size: 12, weight: 600 },

  /** Status bar text. */
  statusBar: { size: 12, weight: 400 },

  /** All-day label. */
  allDayLabel: { size: 11, weight: 600 },

  /** Timeline hour label. */
  timelineLabel: { size: 11, weight: 500 },
} as const

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export const shadows = {
  /** Subtle card shadow on hover. */
  cardHover: '0 4px 12px rgba(0,0,0,0.08)',

  /** Side navigation arrow shadow. */
  sideNavArrow: '0 2px 6px rgba(0,0,0,0.06)',
  sideNavArrowHover: '0 4px 12px rgba(79,70,229,0.15)',

  /** Popup / modal overlay shadow. */
  popup: '0 8px 24px rgba(0,0,0,0.15)',
  modal: '0 20px 40px rgba(0,0,0,0.2)',

  /** View switcher active button shadow. */
  viewBtnActive: '0 1px 2px rgba(0,0,0,0.06)',

  /** FAB (floating action button) shadow. */
  fab: '0 4px 12px rgba(79,70,229,0.4)',
  fabHover: '0 6px 16px rgba(79,70,229,0.5)',

  /** Sidebar drag handle shadow. */
  sidebarHandle: '2px 0 4px rgba(0,0,0,0.06)',
} as const

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export const transitions = {
  /** Standard fast transition for hover effects. */
  fast: 'all 0.15s',

  /** Sidebar resize transition. */
  sidebar: 'all 0.25s',

  /** Popup show/hide. */
  popup: 'all 0.15s',
} as const

// ---------------------------------------------------------------------------
// Z-indices
// ---------------------------------------------------------------------------

export const zIndices = {
  /** Sticky header area. */
  stickyArea: 10,

  /** Side navigation arrows. */
  sideNav: 40,

  /** Hover popup (event details on hover). */
  popup: 1000,

  /** Modal overlay. */
  modal: 1000,

  /** Floating action button. */
  fab: 50,

  /** Current time indicator (day view). */
  currentTimeLine: 5,

  /** Event block in day view timeline. */
  eventBlock: 2,
  eventBlockHover: 3,
} as const
