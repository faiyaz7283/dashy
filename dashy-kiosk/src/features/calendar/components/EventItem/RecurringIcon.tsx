/**
 * RecurringIcon — small SVG glyph shown next to recurring event titles.
 *
 * SVG instead of an emoji/unicode glyph because Chromium on the Raspberry Pi
 * lacks emoji fonts (same reason WeatherIcon exists).
 */

interface RecurringIconProps {
  /** Icon size in pixels. */
  size?: number
}

export function RecurringIcon({ size = 11 }: RecurringIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, color: 'inherit', opacity: 0.6 }}
    >
      <title>Recurring event</title>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  )
}
