/**
 * Sunset icon.
 */

export function SunsetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <line
        x1="2"
        y1="17"
        x2="22"
        y2="17"
        stroke="#F97316"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 14V9" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 11l4 4 4-4"
        stroke="#FB923C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round">
        <line x1="5" y1="13" x2="7" y2="15" />
        <line x1="19" y1="13" x2="17" y2="15" />
      </g>
    </svg>
  )
}
