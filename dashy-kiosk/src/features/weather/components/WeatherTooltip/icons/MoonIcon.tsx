/**
 * Moon phase icon.
 */

export function MoonIcon({ phase }: { phase: number }) {
  if (phase === 0 || phase === 1) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#374151" />
      </svg>
    )
  }
  if (phase < 0.25) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#374151" />
        <path d="M12 4a8 8 0 0 1 0 16 6 6 0 0 0 0-16z" fill="#FDE68A" />
      </svg>
    )
  }
  if (phase === 0.25) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#374151" />
        <path d="M12 4a8 8 0 0 1 0 16V4z" fill="#FDE68A" />
      </svg>
    )
  }
  if (phase < 0.5) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#FDE68A" />
        <path d="M12 4a8 8 0 0 0 0 16 6 6 0 0 1 0-16z" fill="#374151" />
      </svg>
    )
  }
  if (phase === 0.5) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#FDE68A" />
      </svg>
    )
  }
  if (phase < 0.75) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#FDE68A" />
        <path d="M12 4a8 8 0 0 1 0 16 6 6 0 0 0 0-16z" fill="#374151" />
      </svg>
    )
  }
  if (phase === 0.75) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#374151" />
        <path d="M12 4a8 8 0 0 0 0 16V4z" fill="#FDE68A" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" fill="#374151" />
      <path d="M12 4a8 8 0 0 1 0 16 6 6 0 0 1 0-16z" fill="#FDE68A" />
    </svg>
  )
}
