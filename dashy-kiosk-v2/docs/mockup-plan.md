# Dashy Kiosk v2 — Mockup Plan

Track all mockups and their approval status. Each mockup must be explicitly approved before moving to the next.

**Living references:** Mockup files are living design references — they always reflect the current approved design. When modifying a component's visual style, update the corresponding mockup to match. Mockups are the source of truth for approved visual design.

**Rules:**
- One section at a time — don't skip ahead
- Each mockup needs explicit user approval before moving to the next
- Approved decisions are sticky — they carry forward to subsequent mockups
- All mockups use Tailwind v4 CDN, utility classes only, Catalyst patterns, HeadlessUI primitives
- Both light and dark themes must look good in every mockup
- Mockup files live in `mockups/` directory

## Shell & Navigation

| # | File | Purpose | Approved |
|---|------|---------|----------|
| 1 | `layout-shell.html` | Full layout: header + sidebar + status bar + content area. Auto-hide behavior. Both themes. | ✅ |
| 2 | `header.html` | Header detail: date, clock, weather, family pills with event counts, density badge, view switcher (Day/Week/Month/Year), Today button, date picker | ✅ |
| 3 | `sidebar.html` | Sidebar detail: Calendar (refresh icon), Chores (add icon). Collapsed vs expanded states. Auto-hide memory. | ✅ |
| 4 | `status-bar.html` | Status bar detail: settings icon (left), calendar+weather countdowns (center), theme toggle light/dark/auto (right) | ✅ |

## Calendar Views

| # | File | Purpose | Approved |
|---|------|---------|----------|
| 5 | `calendar-day-view.html` | Day view: single column, time slots, event cards, scrollable | ✅ |
| 6 | `calendar-week-view.html` | Week view: 7-day grid, colored top borders per member, event cards, weather per day | ✅ |
| 7 | `calendar-month-view.html` | Month view: full grid, day cells with event dots/counts, fits viewport | ✅ |
| 8 | `calendar-year-view.html` | Year view: 12-month grid, day indicators, member-colored dots | ✅ |

## Chores

| # | File | Purpose | Approved |
|---|------|---------|----------|
| 9 | `chores-board.html` | Chores view: metrics row, member columns, open pool column, chore cards with status colors | ✅ (style/layout approved; metrics and content still under research) |

## Interactive Components

| # | File | Purpose | Approved |
|---|------|---------|----------|
| 10 | `event-popup.html` | Event hover popup: title, time, location, description, recurrence, attendees (2-col grid), content-sized height, no redundant labels | ✅ |
| 11 | `weather-popup.html` | Weather hover popup: current conditions, hourly chart (days 1-2), detail grid, astronomy row. Two variations: full (with chart) and compact (without) | ✅ |
| 12 | `date-picker.html` | Date picker dropdown: ISO calendar grid (Mon–Sun), month + year navigation, today highlight, selected date | ✅ |
| 13 | `chore-create-modal.html` | Chore creation modal: 3 entry-point variations (member column, open pool, sidebar), combobox category with create, tag chips popup, difficulty slider with [N] badge, date+time combined | ✅ |
| 14 | `chore-edit-modal.html` | Chore edit modal: tabbed "This Instance" / "Template" UX, instance tab (status, assignment segmented control, completion/signoff, timestamps), template tab (all master chore fields) | ✅ |

## Sticky Decisions

_Decisions made during mockup phase that carry forward to all subsequent mockups and implementation._

| Decision | Details | Made In |
|----------|---------|---------|
| Tailwind v4 CDN | `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` | Setup |
| Dark mode via `.dark` class | `@custom-variant dark (&:where(.dark, .dark *))` | Setup |
| Tailwind utility classes only | No inline `style="..."` with `var(--dt-*)` | Setup |
| oxlint + oxfmt | Replaces ESLint + Prettier | Setup |
| TypeScript 7.0.2 | Latest stable | Setup |
| vite-plus migration | When stable (currently v0.2.9), migrate to unified toolchain | Setup |
| **useUiScale for scaling** | CSS `zoom` at app root, `scale = max(1, viewportWidth / 1920)`. Never scales down. All elements scale uniformly. No Tailwind breakpoints for layout. | Mockup #1 |
| **Fixed heights** | Header: `h-16` (64px), Status bar: `h-12` (48px). Scaled via useUiScale. | Mockup #1 |
| **Edge-triggered auto-hide** | 15px edge threshold. Elements stay visible while hovering. Independent per edge. | Mockup #1 |
| **Sidebar dynamic bounds** | Sidebar adjusts top/bottom based on header/status bar visibility. | Mockup #1 |
| **Sidebar transition speed** | 0.4s ease for all auto-hide elements (header, sidebar, status bar). Consistent feel. | Mockup #1 |
| **Tailwind UI nav pattern** | Sidebar items: `rounded-md p-2 text-sm/6 font-semibold`, `-mx-2` removed, `px-2` on container. Icons centered when collapsed. | Mockup #3 |
| **Pill with border** | All pill badges use `inset-ring inset-ring-{color}/20` pattern from Tailwind Plus. | Mockup #2 |
| **Sidebar collapse UX fix** | When collapsing via toggle button, prevent immediate auto-hide. Solution: debounce hide after collapse, or check if mouse is still near left edge before hiding. | Mockup #3 |
| **Status bar center is feature-scoped** | Center content reflects the active feature's status (e.g., calendar/weather refresh timers on Calendar view). On Chores or future features, it shows relevant status or is blank. | Mockup #4 |
| **Header member pills update dynamically** | Member pills and total event count in header update based on the day's events shown in the calendar view. | Mockup #5 |
| **Sub-hour event card sizing** | Events shorter than 1 hour need compact layout (truncated title, smaller avatar) to fit within limited vertical space. Address in Mockup #10 (event popup). | Mockup #5 |
| **Mockup Tailwind-only enforcement** | All mockups must use ONLY Tailwind utility classes. No inline `style="..."` with CSS vars, no hardcoded colors, no CSS-in-JS. Each mockup has a warning comment at the top. Dynamic class generation in mockups requires a hidden sentinel div — in React, use JSX so classes are always present. | Mockup #5 |
| **Standardized content card pattern** | All feature views (day, week, month, year, chores) use the same content card wrapper: outer `p-2 bg-bg`, inner `rounded-lg bg-white dark:bg-bg shadow-xs ring-1 ring-border overflow-hidden flex flex-col`. This ensures uniform padding, border, and margin across all views. | Mockup #6 |
| **Dynamic event overflow in week view** | Week view cards must dynamically show "+N more events" only when events exceed available space. In React, use a custom hook (e.g., `useEventOverflow`) with ResizeObserver to measure container height and calculate visible count. No inline styles or one-off TypeScript functions — must be a reusable hook following kiosk-v2 patterns. | Mockup #6 |
| **Density heatmap coloring** | Calendar views use density-based heatmap coloring to visualize event volume. **Week view**: Each day card's top border color is based on that day's event count relative to the week's max (≤33% = low/green, ≤66% = medium/yellow, >66% = high/red). **Month view**: Each week's side indicator uses density coloring based on weekly event totals. **Year view**: Two levels — (1) weekly density heatmap on month cards, (2) monthly density heatmap on the month's event counter pill (colored ring/badge showing relative event volume). In React, implement as a pure utility function (e.g., `getDensityColor(eventCount, maxCount)`) that returns the appropriate Tailwind color class. No inline calculations or hardcoded color logic in components. | Mockup #6 |
| **Navigation arrows for calendar views** | All calendar views (day, week, month, year) have fixed-position prev/next arrow buttons overlaying the content area. Buttons are transparent until hover, centered vertically on left/right edges. They overlay content without shifting it (same behavior as sidebar/header/status bar). Day view: prev/next day. Week view: prev/next week. Month view: prev/next month. Year view: prev/next year. | Mockup #6 |
| **Event popup: content-sized height** | Event popup height matches its content. Use `items-start` on flex container so siblings don't stretch to tallest. Consistent `p-4` padding regardless of content height. | Mockup #10 |
| **Event popup: no redundant labels** | Icons already indicate what each row represents. Don't prefix with "Repeats:", "Organizer:", etc. Just show the value. No organizer row (redundant). | Mockup #10 |
| **Event popup: attendees 2-col grid** | Attendees use `grid grid-cols-2 gap-x-3 gap-y-1.5`, not `flex-wrap`. Each attendee is avatar + status label in one cell. | Mockup #10 |
| **Event popup: no hardcoded px widths** | Use Tailwind scale classes (e.g., `w-80`) that scale via `useUiScale` for consistent look across screen sizes. | Mockup #10 |
| **Old mockup files as SVG reference** | Legacy mockups (`00-legacy-weather-icons.html`, `00-legacy-weather-tooltip.html`) in `mockups/` contain valuable SVG icon designs. Use these SVGs as starting point for kiosk-v2 weather icons, with improvements for theme-safety and Tailwind integration. | Mockup #11 |
| **Date picker suppresses header auto-hide** | While the date picker dropdown is open, the header stays visible and does not auto-hide. The picker is part of the header — clicking the calendar icon activates it, so the header remains pinned until the picker is dismissed. | Mockup #12 |
| **Date picker is cohesive with view state** | The entire navigation unit (Day, Week, Month, Year, Today, Calendar icon) shares a single selected-date state. Picking a date in the picker updates all views to use that date as the anchor. The "Today" button in the header (not the picker footer) resets the cohesive unit back to the current day. Reuse existing `dashy-kiosk` date-navigation logic — do not re-invent. | Mockup #12 |
| **Chore create modal: 3 entry points** | Create chore has 3 entry points with different assignment behavior: (1) Member column `+` → assigned-to locked/pre-filled with member, (2) Open Pool `+` → no assigned-to field, (3) Sidebar `+` → assigned-to editable dropdown with "Open Pool" option. | Mockup #13 |
| **Category combobox with dynamic create** | Category field is a text input combobox — dropdown shows existing categories + "+ Create '...'" option at bottom with border-t separator. The create text dynamically updates as user types via `oninput`. | Mockup #13 |
| **Tags: input + hover popup with removable chips** | Tags field is a text input. Hover popup shows tag chips with × buttons for removal (e.g., `[quick ×][daily ×]`). No comma-separated display. | Mockup #13 |
| **Difficulty: native range slider with [N] badge** | Difficulty uses native `<input type="range">` slider (1–5). Numeric badge `[N]` on left side. No text labels (Easy/Hard removed). | Mockup #13 |
| **Chore edit modal: tabbed Instance/Template UX** | Edit chore uses two tabs: "This Instance" (status, assignment segmented control, completion/signoff, timestamps) and "Template" (all master chore fields). Both tabs have Delete + Cancel/Save footer. | Mockup #14 |
| **Assignment segmented control** | Instance tab uses Open/Claimed/Assigned segmented control. Only one can be active. Claimed/Assigned show member row below. | Mockup #14 |
| **Date picker reuse in chore modals** | Chore create/edit modals should reuse the date picker component from Mockup #12 (not native `<input type="date">`). Noted for implementation. | Mockup #13 |
