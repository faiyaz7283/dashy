/**
 * Member color utilities — palette-based Tailwind class mapping.
 *
 * Provides static class name mappings for a generic color palette (blue, pink, green, amber, etc.)
 * so Tailwind's static analysis can detect all classes at build time.
 *
 * Components resolve member keys → palette keys via `buildMemberColorMap()` or
 * read `color_key` directly from API data. No hardcoded member names anywhere.
 */

/** Palette keys — generic, reusable, not tied to specific people. */
export type PaletteKey = 'blue' | 'pink' | 'green' | 'amber' | 'purple' | 'teal' | 'red' | 'indigo'

/** Default palette key for unknown/unmapped members. */
export const DEFAULT_PALETTE_KEY: PaletteKey = 'blue'

/**
 * Static mapping of palette keys to Tailwind background classes.
 */
export const paletteBgClasses: Record<PaletteKey, string> = {
  blue: 'bg-blue-500',
  pink: 'bg-pink-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
  red: 'bg-red-500',
  indigo: 'bg-indigo-500',
} as const

/**
 * Static mapping of palette keys to Tailwind background classes with opacity.
 */
export const paletteBgOpacityClasses: Record<PaletteKey, string> = {
  blue: 'bg-blue-500/10',
  pink: 'bg-pink-500/10',
  green: 'bg-green-500/10',
  amber: 'bg-amber-500/10',
  purple: 'bg-purple-500/10',
  teal: 'bg-teal-500/10',
  red: 'bg-red-500/10',
  indigo: 'bg-indigo-500/10',
} as const

/**
 * Static mapping of palette keys to Tailwind hover background classes with opacity.
 */
export const paletteBgHoverClasses: Record<PaletteKey, string> = {
  blue: 'hover:bg-blue-500/20',
  pink: 'hover:bg-pink-500/20',
  green: 'hover:bg-green-500/20',
  amber: 'hover:bg-amber-500/20',
  purple: 'hover:bg-purple-500/20',
  teal: 'hover:bg-teal-500/20',
  red: 'hover:bg-red-500/20',
  indigo: 'hover:bg-indigo-500/20',
} as const

/**
 * Static mapping of palette keys to Tailwind border color classes.
 */
export const paletteBorderClasses: Record<PaletteKey, string> = {
  blue: 'border-blue-500',
  pink: 'border-pink-500',
  green: 'border-green-500',
  amber: 'border-amber-500',
  purple: 'border-purple-500',
  teal: 'border-teal-500',
  red: 'border-red-500',
  indigo: 'border-indigo-500',
} as const

/**
 * Static mapping of palette keys to Tailwind border-top color classes.
 */
export const paletteBorderTopClasses: Record<PaletteKey, string> = {
  blue: 'border-t-blue-500',
  pink: 'border-t-pink-500',
  green: 'border-t-green-500',
  amber: 'border-t-amber-500',
  purple: 'border-t-purple-500',
  teal: 'border-t-teal-500',
  red: 'border-t-red-500',
  indigo: 'border-t-indigo-500',
} as const

/**
 * Static mapping of palette keys to Tailwind text color classes.
 */
export const paletteTextClasses: Record<PaletteKey, string> = {
  blue: 'text-blue-700 dark:text-blue-400',
  pink: 'text-pink-700 dark:text-pink-400',
  green: 'text-green-700 dark:text-green-400',
  amber: 'text-amber-700 dark:text-amber-400',
  purple: 'text-purple-700 dark:text-purple-400',
  teal: 'text-teal-700 dark:text-teal-400',
  red: 'text-red-700 dark:text-red-400',
  indigo: 'text-indigo-700 dark:text-indigo-400',
} as const

/**
 * Static mapping of palette keys to Tailwind ring color classes.
 */
export const paletteRingClasses: Record<PaletteKey, string> = {
  blue: 'ring-blue-500/20',
  pink: 'ring-pink-500/20',
  green: 'ring-green-500/20',
  amber: 'ring-amber-500/20',
  purple: 'ring-purple-500/20',
  teal: 'ring-teal-500/20',
  red: 'ring-red-500/20',
  indigo: 'ring-indigo-500/20',
} as const

/**
 * Builds a lookup map from member keys to palette keys.
 *
 * @param members - Array of FamilyMember objects from the API.
 * @returns Map of member.key → palette key.
 */
export function buildMemberColorMap(
  members: Array<{ key: string; color_key: string }>
): Map<string, PaletteKey> {
  const map = new Map<string, PaletteKey>()
  for (const member of members) {
    const paletteKey = isValidPaletteKey(member.color_key) ? member.color_key : DEFAULT_PALETTE_KEY
    map.set(member.key, paletteKey)
  }
  return map
}

/**
 * Type guard: checks if a string is a valid PaletteKey.
 */
export function isValidPaletteKey(key: string): key is PaletteKey {
  return key in paletteBgClasses
}

/**
 * Returns the palette key for a member key, with fallback.
 *
 * @param memberKey - The member key to look up.
 * @param colorMap - The member → palette key map.
 * @returns The palette key, or DEFAULT_PALETTE_KEY if not found.
 */
export function getMemberPaletteKey(
  memberKey: string | null | undefined,
  colorMap: Map<string, PaletteKey>
): PaletteKey {
  if (!memberKey) return DEFAULT_PALETTE_KEY
  return colorMap.get(memberKey) ?? DEFAULT_PALETTE_KEY
}
