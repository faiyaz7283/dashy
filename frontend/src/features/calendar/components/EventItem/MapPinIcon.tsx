/**
 * MapPinIcon — small SVG location pin shown next to event locations.
 *
 * SVG instead of an emoji (📍) because Chromium on the Raspberry Pi lacks
 * emoji fonts and renders an empty rectangle (same reason WeatherIcon and
 * RecurringIcon exist).
 */

interface MapPinIconProps {
  /** Icon size in pixels. */
  size?: number
}

export function MapPinIcon({ size = 11 }: MapPinIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, color: 'inherit' }}
    >
      <title>Location</title>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
