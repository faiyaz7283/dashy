/**
 * Family domain types.
 *
 * Defines the shape of family member configuration used for calendar
 * event color-coding and display throughout the dashboard.
 */

/** A family member with calendar and display configuration. */
export interface FamilyMember {
  /** Display name for the family member. */
  name: string
  /** Unique identifier used in calendar event member arrays. */
  key: string
  /** Google Calendar ID for this member's events (also used as email). */
  calendar_id: string
  /** Email address. */
  email: string
  /** Theme color for this member's events and indicators (hex). */
  color: string
  /** Palette key for Tailwind class mapping (e.g., 'blue', 'pink'). */
  color_key: string
  /** Single character used for avatar/initial display. */
  initial: string
  /** Date of birth (ISO date string), or null if not set. */
  date_of_birth: string | null
  /** Relationship label (e.g., 'father', 'daughter'), or null. */
  relation: string | null
}
