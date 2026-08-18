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
  /** Google Calendar ID for this member's events. */
  calendar_id: string
  /** Theme color for this member's events and indicators. */
  color: string
  /** Single character used for avatar/initial display. */
  initial: string
}
