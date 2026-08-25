/**
 * Design tokens for the Dashy application.
 *
 * All visual values (colors, spacing, sizes, typography) are centralized here
 * so components reference tokens instead of hardcoded values. Colors now
 * reference CSS custom properties (variables) defined in index.css, enabling
 * runtime theme switching (light/dark/auto) without rebuilding tokens.
 *
 * Avoid adding hardcoded hex, px, rem, or other visual values directly in
 * components — always import from this file.
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

/** Brand / primary palette. */
export const colors = {
  primary: 'var(--dt-primary)',
  primaryHover: 'var(--dt-primary-hover)',
  primaryLight: 'var(--dt-primary-light)',
  primaryLightHover: 'var(--dt-primary-light-hover)',
  primaryRing: 'var(--dt-primary-ring)',

  /** Neutral / surface colors. */
  white: 'var(--dt-white)',
  bg: 'var(--dt-bg)',
  bgHover: 'var(--dt-bg-hover)',

  /** Text colors. */
  textPrimary: 'var(--dt-text-primary)',
  textSecondary: 'var(--dt-text-secondary)',
  textMuted: 'var(--dt-text-muted)',
  textFaint: 'var(--dt-text-faint)',
  textDisabled: 'var(--dt-text-disabled)',

  /** Border colors. */
  border: 'var(--dt-border)',
  borderLight: 'var(--dt-border-light)',
  borderDark: 'var(--dt-border-dark)',

  /** Status colors. */
  success: 'var(--dt-success)',
  danger: 'var(--dt-danger)',
  dangerBg: 'var(--dt-danger-bg)',
  dangerText: 'var(--dt-danger-text)',

  /** Chores status colors. */
  choresOpen: 'var(--dt-chores-open)',
  choresClaimed: 'var(--dt-chores-claimed)',
  choresAssigned: 'var(--dt-chores-assigned)',
  choresInProgress: 'var(--dt-chores-in-progress)',
  choresPendingSignoff: 'var(--dt-chores-pending-signoff)',
  choresCompleted: 'var(--dt-chores-completed)',
  choresOverdue: 'var(--dt-chores-overdue)',
  choresExpiringSoon: 'var(--dt-chores-expiring-soon)',
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
  none: { bg: 'var(--dt-density-none)', text: 'var(--dt-text-muted)' },
  low: { bg: 'var(--dt-density-low)', text: 'var(--dt-success)' },
  medium: { bg: 'var(--dt-density-medium)', text: 'var(--dt-warning)' },
  high: { bg: 'var(--dt-density-high)', text: 'var(--dt-danger)' },
} as const

/**
 * Density bar colors — slightly more saturated variants used for
 * visual density indicators (bars, columns, cells).
 */
export const densityBarColors = {
  none: 'var(--dt-density-none)',
  low: 'var(--dt-density-low)',
  medium: 'var(--dt-density-medium)',
  high: 'var(--dt-density-high)',
} as const

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

  /**
   * Design baseline width. Below or equal to this the UI renders 1:1; on
   * wider monitors the whole UI scales up uniformly (see useUiScale).
   */
  designWidth: 1920,
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

  /** Modal overlay (higher than popup to ensure modals appear above hover popups). */
  modal: 1100,

  /** Floating action button. */
  fab: 50,

  /** Current time indicator (day view). */
  currentTimeLine: 5,

  /** Event block in day view timeline. */
  eventBlock: 2,
  eventBlockHover: 3,
} as const
