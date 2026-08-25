/**
 * Tests for memberColors utilities.
 *
 * Validates the palette-based color system that maps member keys to generic
 * palette keys (blue, pink, green, etc.) without hardcoding member names.
 */

import { describe, it, expect } from 'vitest'
import {
  isValidPaletteKey,
  buildMemberColorMap,
  getMemberPaletteKey,
  DEFAULT_PALETTE_KEY,
  paletteBgClasses,
  paletteBgOpacityClasses,
  paletteBgHoverClasses,
  paletteBorderClasses,
  paletteBorderTopClasses,
  paletteTextClasses,
  paletteRingClasses,
  type PaletteKey,
} from './memberColors'

describe('memberColors', () => {
  describe('isValidPaletteKey', () => {
    it('returns true for valid palette keys', () => {
      expect(isValidPaletteKey('blue')).toBe(true)
      expect(isValidPaletteKey('pink')).toBe(true)
      expect(isValidPaletteKey('green')).toBe(true)
      expect(isValidPaletteKey('amber')).toBe(true)
      expect(isValidPaletteKey('purple')).toBe(true)
      expect(isValidPaletteKey('teal')).toBe(true)
      expect(isValidPaletteKey('red')).toBe(true)
      expect(isValidPaletteKey('indigo')).toBe(true)
    })

    it('returns false for invalid palette keys', () => {
      expect(isValidPaletteKey('faiyaz')).toBe(false)
      expect(isValidPaletteKey('trisha')).toBe(false)
      expect(isValidPaletteKey('orange')).toBe(false)
      expect(isValidPaletteKey('')).toBe(false)
      expect(isValidPaletteKey('BLUE')).toBe(false)
    })
  })

  describe('buildMemberColorMap', () => {
    it('builds a map from member keys to palette keys', () => {
      const members = [
        { key: 'alice', color_key: 'blue' },
        { key: 'bob', color_key: 'pink' },
        { key: 'charlie', color_key: 'green' },
      ]

      const colorMap = buildMemberColorMap(members)

      expect(colorMap.get('alice')).toBe('blue')
      expect(colorMap.get('bob')).toBe('pink')
      expect(colorMap.get('charlie')).toBe('green')
    })

    it('uses DEFAULT_PALETTE_KEY for invalid color_key values', () => {
      const members = [
        { key: 'alice', color_key: 'invalid-color' },
        { key: 'bob', color_key: 'faiyaz' },
        { key: 'charlie', color_key: '' },
      ]

      const colorMap = buildMemberColorMap(members)

      expect(colorMap.get('alice')).toBe(DEFAULT_PALETTE_KEY)
      expect(colorMap.get('bob')).toBe(DEFAULT_PALETTE_KEY)
      expect(colorMap.get('charlie')).toBe(DEFAULT_PALETTE_KEY)
    })

    it('handles empty members array', () => {
      const colorMap = buildMemberColorMap([])
      expect(colorMap.size).toBe(0)
    })

    it('handles all valid palette keys', () => {
      const members = [
        { key: 'm1', color_key: 'blue' },
        { key: 'm2', color_key: 'pink' },
        { key: 'm3', color_key: 'green' },
        { key: 'm4', color_key: 'amber' },
        { key: 'm5', color_key: 'purple' },
        { key: 'm6', color_key: 'teal' },
        { key: 'm7', color_key: 'red' },
        { key: 'm8', color_key: 'indigo' },
      ]

      const colorMap = buildMemberColorMap(members)

      expect(colorMap.get('m1')).toBe('blue')
      expect(colorMap.get('m2')).toBe('pink')
      expect(colorMap.get('m3')).toBe('green')
      expect(colorMap.get('m4')).toBe('amber')
      expect(colorMap.get('m5')).toBe('purple')
      expect(colorMap.get('m6')).toBe('teal')
      expect(colorMap.get('m7')).toBe('red')
      expect(colorMap.get('m8')).toBe('indigo')
    })
  })

  describe('getMemberPaletteKey', () => {
    it('returns the palette key for a known member', () => {
      const colorMap = new Map<string, PaletteKey>([
        ['alice', 'blue'],
        ['bob', 'pink'],
      ])

      expect(getMemberPaletteKey('alice', colorMap)).toBe('blue')
      expect(getMemberPaletteKey('bob', colorMap)).toBe('pink')
    })

    it('returns DEFAULT_PALETTE_KEY for unknown member', () => {
      const colorMap = new Map<string, PaletteKey>([
        ['alice', 'blue'],
      ])

      expect(getMemberPaletteKey('unknown', colorMap)).toBe(DEFAULT_PALETTE_KEY)
    })

    it('returns DEFAULT_PALETTE_KEY for null member key', () => {
      const colorMap = new Map<string, PaletteKey>([
        ['alice', 'blue'],
      ])

      expect(getMemberPaletteKey(null, colorMap)).toBe(DEFAULT_PALETTE_KEY)
    })

    it('returns DEFAULT_PALETTE_KEY for undefined member key', () => {
      const colorMap = new Map<string, PaletteKey>([
        ['alice', 'blue'],
      ])

      expect(getMemberPaletteKey(undefined, colorMap)).toBe(DEFAULT_PALETTE_KEY)
    })

    it('returns DEFAULT_PALETTE_KEY for empty string member key', () => {
      const colorMap = new Map<string, PaletteKey>([
        ['alice', 'blue'],
      ])

      expect(getMemberPaletteKey('', colorMap)).toBe(DEFAULT_PALETTE_KEY)
    })
  })

  describe('static palette mappings', () => {
    const allPaletteKeys: PaletteKey[] = ['blue', 'pink', 'green', 'amber', 'purple', 'teal', 'red', 'indigo']

    it('paletteBgClasses has all palette keys', () => {
      for (const key of allPaletteKeys) {
        expect(paletteBgClasses[key]).toBeDefined()
        expect(paletteBgClasses[key]).toContain('bg-')
      }
    })

    it('paletteBgOpacityClasses has all palette keys', () => {
      for (const key of allPaletteKeys) {
        expect(paletteBgOpacityClasses[key]).toBeDefined()
        expect(paletteBgOpacityClasses[key]).toContain('/10')
      }
    })

    it('paletteBgHoverClasses has all palette keys', () => {
      for (const key of allPaletteKeys) {
        expect(paletteBgHoverClasses[key]).toBeDefined()
        expect(paletteBgHoverClasses[key]).toContain('hover:')
        expect(paletteBgHoverClasses[key]).toContain('/20')
      }
    })

    it('paletteBorderClasses has all palette keys', () => {
      for (const key of allPaletteKeys) {
        expect(paletteBorderClasses[key]).toBeDefined()
        expect(paletteBorderClasses[key]).toContain('border-')
      }
    })

    it('paletteBorderTopClasses has all palette keys', () => {
      for (const key of allPaletteKeys) {
        expect(paletteBorderTopClasses[key]).toBeDefined()
        expect(paletteBorderTopClasses[key]).toContain('border-t-')
      }
    })

    it('paletteTextClasses has all palette keys with dark mode variants', () => {
      for (const key of allPaletteKeys) {
        expect(paletteTextClasses[key]).toBeDefined()
        expect(paletteTextClasses[key]).toContain('text-')
        expect(paletteTextClasses[key]).toContain('dark:text-')
      }
    })

    it('paletteRingClasses has all palette keys', () => {
      for (const key of allPaletteKeys) {
        expect(paletteRingClasses[key]).toBeDefined()
        expect(paletteRingClasses[key]).toContain('ring-')
      }
    })
  })

  describe('DEFAULT_PALETTE_KEY', () => {
    it('is a valid palette key', () => {
      expect(isValidPaletteKey(DEFAULT_PALETTE_KEY)).toBe(true)
    })

    it('is blue', () => {
      expect(DEFAULT_PALETTE_KEY).toBe('blue')
    })
  })
})
