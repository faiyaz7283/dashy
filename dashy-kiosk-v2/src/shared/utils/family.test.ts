/**
 * Tests for family utility functions.
 *
 * Validates adult detection and member lookup logic.
 */

import { describe, it, expect } from 'vitest'
import { isAdult, findFirstAdult } from './family'
import type { FamilyMember } from '@/types/family'

describe('family utilities', () => {
  const adultMember: FamilyMember = {
    key: 'faiyaz',
    name: 'Faiyaz',
    calendar_id: 'cal1',
    email: 'faiyaz@test.com',
    color: '#3b82f6',
    color_key: 'blue',
    initial: 'F',
    date_of_birth: '1990-01-01',
    relation: 'father',
  }

  const childMember: FamilyMember = {
    key: 'arya',
    name: 'Arya',
    calendar_id: 'cal3',
    email: 'arya@test.com',
    color: '#22c55e',
    color_key: 'green',
    initial: 'A',
    date_of_birth: '2015-06-15',
    relation: 'daughter',
  }

  const noDobMember: FamilyMember = {
    key: 'unknown',
    name: 'Unknown',
    calendar_id: 'cal4',
    email: 'unknown@test.com',
    color: '#6b7280',
    color_key: 'gray',
    initial: 'U',
    date_of_birth: null,
    relation: null,
  }

  describe('isAdult', () => {
    it('returns true for member 18 or older', () => {
      expect(isAdult(adultMember)).toBe(true)
    })

    it('returns false for member under 18', () => {
      expect(isAdult(childMember)).toBe(false)
    })

    it('returns false for member with no DOB', () => {
      expect(isAdult(noDobMember)).toBe(false)
    })
  })

  describe('findFirstAdult', () => {
    it('returns first adult from mixed list', () => {
      const members = [childMember, adultMember]
      expect(findFirstAdult(members)).toBe(adultMember)
    })

    it('returns null when no adults in list', () => {
      const members = [childMember]
      expect(findFirstAdult(members)).toBeNull()
    })

    it('returns null for empty list', () => {
      expect(findFirstAdult([])).toBeNull()
    })

    it('skips members with no DOB', () => {
      const members = [noDobMember, adultMember]
      expect(findFirstAdult(members)).toBe(adultMember)
    })
  })
})
