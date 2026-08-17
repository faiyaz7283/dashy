/**
 * Member color utilities — derive full color palette from a single color.
 *
 * Converts a single hex color into a complete palette (bg, border, text, avatar)
 * for consistent member styling across the UI.
 */

/**
 * Member color palette derived from a single color.
 */
export interface MemberColorPalette {
  /** Light background color. */
  bg: string
  /** Border color. */
  border: string
  /** Text color. */
  text: string
  /** Avatar background color. */
  avatar: string
}

/**
 * Parse a hex color to RGB components.
 *
 * @param hex - Hex color string (e.g., "#3b82f6" or "3b82f6").
 * @returns RGB components as [r, g, b] array.
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.slice(0, 2), 16)
  const g = parseInt(cleanHex.slice(2, 4), 16)
  const b = parseInt(cleanHex.slice(4, 6), 16)
  return [r, g, b]
}

/**
 * Convert RGB components to hex color string.
 *
 * @param r - Red component (0-255).
 * @param g - Green component (0-255).
 * @param b - Blue component (0-255).
 * @returns Hex color string (e.g., "#3b82f6").
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')
}

/**
 * Lighten a color by mixing with white.
 *
 * @param hex - Base hex color.
 * @param amount - Lightening amount (0-1, where 0 = no change, 1 = white).
 * @returns Lightened hex color.
 */
function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

/**
 * Darken a color by mixing with black.
 *
 * @param hex - Base hex color.
 * @param amount - Darkening amount (0-1, where 0 = no change, 1 = black).
 * @returns Darkened hex color.
 */
function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

/**
 * Derive a full color palette from a single member color.
 *
 * Generates light background, border, text, and avatar colors from the base color.
 *
 * @param color - Base hex color (e.g., "#3b82f6").
 * @returns Complete color palette for the member.
 *
 * @example
 * ```ts
 * const palette = getMemberColorPalette('#3b82f6')
 * // { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', avatar: '#3b82f6' }
 * ```
 */
export function getMemberColorPalette(color: string): MemberColorPalette {
  return {
    bg: lighten(color, 0.9),
    border: lighten(color, 0.7),
    text: darken(color, 0.3),
    avatar: color,
  }
}
