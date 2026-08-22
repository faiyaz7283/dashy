/**
 * Member color utilities for Tailwind class mapping.
 *
 * Provides static class name mappings for member colors so Tailwind's
 * static analysis can detect all classes at build time.
 */

/** Member color keys. */
export type MemberColorKey = 'faiyaz' | 'trisha' | 'arya' | 'raya'

/**
 * Static mapping of member color keys to Tailwind background classes.
 *
 * Use this instead of template literals like `bg-${color}` which Tailwind
 * cannot detect at build time.
 */
export const memberBgClasses: Record<MemberColorKey, string> = {
  faiyaz: 'bg-faiyaz',
  trisha: 'bg-trisha',
  arya: 'bg-arya',
  raya: 'bg-raya',
} as const

/**
 * Static mapping of member color keys to Tailwind background classes with opacity.
 *
 * Use this instead of template literals like `bg-${color}/10`.
 */
export const memberBgOpacityClasses: Record<MemberColorKey, string> = {
  faiyaz: 'bg-faiyaz/10',
  trisha: 'bg-trisha/10',
  arya: 'bg-arya/10',
  raya: 'bg-raya/10',
} as const

/**
 * Static mapping of member color keys to Tailwind hover background classes with opacity.
 *
 * Use this instead of template literals like `hover:bg-${color}/20`.
 */
export const memberBgHoverClasses: Record<MemberColorKey, string> = {
  faiyaz: 'hover:bg-faiyaz/20',
  trisha: 'hover:bg-trisha/20',
  arya: 'hover:bg-arya/20',
  raya: 'hover:bg-raya/20',
} as const

/**
 * Static mapping of member color keys to Tailwind border color classes.
 *
 * Use this instead of template literals like `border-${color}`.
 */
export const memberBorderClasses: Record<MemberColorKey, string> = {
  faiyaz: 'border-faiyaz',
  trisha: 'border-trisha',
  arya: 'border-arya',
  raya: 'border-raya',
} as const

/**
 * Static mapping of member color keys to Tailwind border-top color classes.
 *
 * Used for triangle indicators in year view day cells.
 */
export const memberBorderTopClasses: Record<MemberColorKey, string> = {
  faiyaz: 'border-t-faiyaz',
  trisha: 'border-t-trisha',
  arya: 'border-t-arya',
  raya: 'border-t-raya',
} as const

/**
 * Static mapping of member color keys to Tailwind text color classes.
 *
 * Use this instead of template literals like `text-${color}`.
 */
export const memberTextClasses: Record<MemberColorKey, string> = {
  faiyaz: 'text-faiyaz',
  trisha: 'text-trisha',
  arya: 'text-arya',
  raya: 'text-raya',
} as const

/**
 * Static mapping of member color keys to Tailwind ring color classes.
 *
 * Use this instead of template literals like `ring-${color}`.
 */
export const memberRingClasses: Record<MemberColorKey, string> = {
  faiyaz: 'ring-faiyaz',
  trisha: 'ring-trisha',
  arya: 'ring-arya',
  raya: 'ring-raya',
} as const

/**
 * Returns the member's initial (first letter capitalized).
 *
 * @param memberColor - The member color key.
 * @returns The capitalized first letter.
 */
export function getMemberInitial(memberColor: MemberColorKey): string {
  return (memberColor[0] ?? '').toUpperCase()
}
