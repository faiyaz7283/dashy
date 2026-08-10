# Event Component Architecture Analysis

> **Handoff document for AI agents.** This document contains everything needed to refactor the event component architecture. No additional analysis required.

## Current State: How Events Are Presented Per View

### Week View
- **Component**: `DayCard` → `EventCard`
- **Event rendering**: Full event cards with avatar, title, time range
- **Hover**: Scale effect (1.01) on EventCard
- **Click**: Navigates to DayView (on the day card, not individual events)
- **Popup**: None
- **Modal**: None

### Day View
- **Component**: `DayView` (renders events directly, no EventCard)
- **Event rendering**: Custom positioned blocks on timeline + custom all-day bars
- **Hover**: Scale effect + box-shadow on timed event blocks
- **Click**: Opens `EventModal` with full details
- **Popup**: None
- **Modal**: `EventModal` (time, location, owner, guests, edit/delete buttons)

### Month View
- **Component**: `MonthView` (renders inline event strips directly, no EventCard)
- **Event rendering**: Mini strips (avatar + title, max 3, "+N more")
- **Hover**: Shows `EventPopup` with event details
- **Click**: Navigates to DayView
- **Popup**: `EventPopup` (date label, title, time, location, member avatars)
- **Modal**: None

### Year View
- **Component**: `YearView` (renders event dots only)
- **Event rendering**: 4px colored dots next to dates
- **Hover**: Shows `EventPopup` with event details
- **Click**: Navigates to MonthView (month) or DayView (day)
- **Popup**: `EventPopup`
- **Modal**: None

---

## Inconsistencies & Problems

### 1. EventCard Is Only Used in WeekView
`EventCard` exists as a reusable component but is only consumed by `DayCard` (WeekView). MonthView, DayView, and YearView all render their own event representations inline, duplicating the "avatar + title + color" pattern.

### 2. Duplicate Rendering Logic
The pattern "colored avatar + event title + member-colored background/border" is duplicated in:
- `EventCard.tsx` (WeekView)
- `MonthView.tsx` inline event strips (lines 284-330)
- `DayView.tsx` all-day events (lines 157-201)
- `DayView.tsx` timed event blocks (lines 259-333)
- `EventPopup.tsx` event items (lines 77-171)
- `AllDaySection.tsx` (unused standalone component)

### 3. Inconsistent Interaction Model
| View | Hover | Click | Popup | Modal |
|------|-------|-------|-------|-------|
| Week | Scale on card | Navigate to DayView | ❌ | ❌ |
| Day | Scale on block | Open EventModal | ❌ | ✅ |
| Month | Show EventPopup | Navigate to DayView | ✅ | ❌ |
| Year | Show EventPopup | Navigate to MonthView/DayView | ✅ | ❌ |

WeekView has no way to see event details without navigating away. DayView is the only view with a modal.

### 4. TypeScript Types Are Outdated
`frontend/src/types/index.ts` `CalendarEvent` interface is missing all the new backend fields:
- `description`
- `organizer`
- `attendees`
- `recurring_event_id`
- `is_recurring_instance`
- `recurrence_rule`

This means the frontend can't use any of the enhanced backend data.

### 5. AllDaySection Component Exists But Isn't Used
`AllDaySection.tsx` is a complete component that duplicates the all-day rendering logic already inline in `DayView.tsx`. It's not imported anywhere.

### 6. No Recurring Event Indicators
No view shows any visual indication that an event is recurring, despite the backend now providing `recurrence_rule` and `is_recurring_instance`.

### 7. EventPopup and EventModal Show Different Data
- `EventPopup`: title, time, location, member avatars (compact)
- `EventModal`: title, time, location, owner, guests (detailed)

They should be consistent in what data they present, just at different detail levels.

---

## Proposed Unified Architecture

### Single Source of Truth: `EventItem` Component
A core presentational component that renders a single event in a consistent style. All views use this component with different size/variant props.

```
EventItem (core component)
├── variant: "card" | "strip" | "block" | "dot"
├── size: "sm" | "md" | "lg"
├── showTime: boolean
├── showAvatar: boolean
├── onClick?: () => void
├── onHover?: () => void
└── event: CalendarEvent
```

### Unified Interaction: `useEventInteraction` Hook
A hook that manages popup/modal state consistently across all views.

```
useEventInteraction()
├── hoveredEvent: CalendarEvent | null
├── selectedEvent: CalendarEvent | null
├── handleHover: (event, position) => void
├── handleClick: (event) => void
├── clearHover: () => void
└── clearSelection: () => void
```

### View-Specific Layouts
Each view handles its own layout/positioning but delegates event rendering to `EventItem`:

- **WeekView**: `EventItem` variant="card" → hover shows popup, click opens modal
- **DayView**: `EventItem` variant="block" (timed) / variant="card" (all-day) → click opens modal
- **MonthView**: `EventItem` variant="strip" → hover shows popup, click opens modal
- **YearView**: `EventItem` variant="dot" → hover shows popup, click navigates

### Updated TypeScript Types
Sync `CalendarEvent` interface with backend model to include all new fields.

---

## Files to Create/Modify

### New Files
1. `components/EventItem/EventItem.tsx` - Core event rendering component
2. `hooks/useEventInteraction.ts` - Unified popup/modal state management

### Modified Files
1. `types/index.ts` - Add missing CalendarEvent fields
2. `components/EventCard/EventCard.tsx` - Refactor to use EventItem or deprecate
3. `components/EventPopup/EventPopup.tsx` - Use EventItem internally
4. `components/EventModal/EventModal.tsx` - Add recurring info, description, attendees
5. `components/DayView/DayView.tsx` - Use EventItem for event blocks
6. `components/MonthView/MonthView.tsx` - Use EventItem for inline strips
7. `components/WeekGrid/WeekGrid.tsx` - Add popup/modal via useEventInteraction
8. `components/YearView/YearView.tsx` - Use EventItem variant="dot"
9. `components/AllDaySection/AllDaySection.tsx` - Use EventItem or deprecate
