---
name: add-svg-icon
description: Create custom SVG icon components for domain-specific illustrations — check lucide-react first, then build inline SVG with value-aware coloring.
---

# Add SVG Icon

Create custom SVG icon components for domain-specific illustrations that are not covered by the standard icon library.

## When to use

- The feature needs a domain-specific illustration (weather metrics, calendar indicators, etc.)
- The icon must react to data values (temperature-based coloring, intensity levels, etc.)
- The design calls for a custom visual not available in any icon library
- Not for standard UI icons (arrows, close buttons, settings) — use lucide-react for those
- Not for emoji or unicode glyphs — the Pi kiosk lacks emoji fonts

## When NOT to use

- lucide-react already has the icon you need — just `import { IconName } from 'lucide-react'`
- The icon is a standard UI pattern (check, x, chevron, search, etc.)
- You need an animated or interactive element — use a React component instead

## Prerequisites

- Check if lucide-react has the icon: `grep -r "from 'lucide-react'" src/` to see what's already imported
- Have the SVG path data ready (from Figma export, hand-drawn, or adapted from an open-source icon set)
- Decide if the icon needs dynamic props (data-driven coloring, sizing, etc.)

## Decision flow

```
Need an icon?
├── Is it a standard UI icon? (arrow, check, close, search, etc.)
│   └── YES → import from 'lucide-react'
├── Does it need data-driven visual changes? (color by temperature, size by intensity)
│   └── YES → create custom SVG component (this skill)
└── Is it a domain-specific illustration? (thermometer, humidity drop, moon phase)
    └── YES → create custom SVG component (this skill)
```

## Directory structure

Place icons in an `icons/` directory under the parent component that uses them:

```
src/features/<feature>/components/<ParentComponent>/icons/
├── IconName.tsx
└── (more icons...)
```

**Existing icon locations:**

```
src/features/weather/components/WeatherTooltip/icons/
├── ThermometerIcon.tsx    # Temperature-aware coloring + ice crystals
├── FeelsLikeFaceIcon.tsx  # 6 face expressions by temperature
├── HumidityIcon.tsx       # Water drop with intensity levels
├── WindIcon.tsx           # Wind lines with speed-based intensity
├── PrecipIcon.tsx         # Cloud + rain drops by probability
├── SunriseIcon.tsx        # Static sun with upward arrow
├── SunsetIcon.tsx         # Static sun with downward arrow
├── UVIcon.tsx             # Sun with rays by UV intensity
├── PressureIcon.tsx       # Gauge with needle position
└── MoonIcon.tsx           # 8 moon phases via circle clipping

src/features/weather/components/WeatherWidget/
└── WeatherIcon.tsx        # 15 OWM conditions with day/night variants

src/features/calendar/components/EventItem/
├── RecurringIcon.tsx      # Repeating arrows glyph
└── MapPinIcon.tsx         # Location pin
```

## Steps

### 1. Check lucide-react first

Before creating a custom icon, verify lucide-react doesn't already have it:

```bash
# See all lucide icons currently imported in the project
grep -rh "from 'lucide-react'" src/ | sort -u
```

If lucide has the icon, use it directly:

```tsx
import { Thermometer } from 'lucide-react'

// In JSX:
<Thermometer size={20} color="#EF4444" />
```

### 2. Create the icon component

Create `src/features/<feature>/components/<ParentComponent>/icons/<IconName>.tsx`.

**Conventions:**
- PascalCase filename matching the exported component name
- Named export: `export function IconName()`
- Inline SVG with explicit `width`, `height`, and `viewBox`
- Default size: `width="20" height="20" viewBox="0 0 24 24"`
- No external dependencies — pure SVG elements only
- TSDoc comment describing the icon and its behavior
- Helper functions (color computation, etc.) defined above the component

**Example — static icon (from `EventItem/RecurringIcon.tsx`):**

```tsx
/**
 * RecurringIcon — small SVG glyph shown next to recurring event titles.
 *
 * SVG instead of an emoji/unicode glyph because Chromium on the Raspberry Pi
 * lacks emoji fonts (same reason WeatherIcon exists).
 */

interface RecurringIconProps {
  /** Icon size in pixels. */
  size?: number
}

export function RecurringIcon({ size = 11 }: RecurringIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, color: 'inherit', opacity: 0.6 }}
    >
      <title>Recurring event</title>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  )
}
```

**Example — data-driven icon with value-aware coloring (from `WeatherTooltip/icons/ThermometerIcon.tsx`):**

```tsx
/**
 * Thermometer icon with temperature-aware coloring.
 */

function getThermometerColor(temp: number): string {
  if (temp < 0) return '#60A5FA'   // freezing
  if (temp < 32) return '#3B82F6'  // cold
  if (temp < 50) return '#60A5FA'  // cool
  if (temp < 70) return '#22C55E'  // mild
  if (temp < 85) return '#F59E0B'  // warm
  if (temp < 100) return '#F97316' // hot
  return '#EF4444'                 // extreme hot
}

export function ThermometerIcon({ temp }: { temp: number }) {
  const color = getThermometerColor(temp)
  const showIceCrystals = temp < 0

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 14.76V3.5a2.5 2.5 0 1 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
        fill={color}
      />
      <circle cx="11.5" cy="17.5" r="2" fill="#fff" />
      {showIceCrystals && (
        <g stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round">
          <line x1="6" y1="7" x2="4" y2="5" />
          <line x1="17" y1="7" x2="19" y2="5" />
          <line x1="5" y1="10" x2="3" y2="10" />
          <line x1="18" y1="10" x2="20" y2="10" />
        </g>
      )}
    </svg>
  )
}
```

**Example — multi-level intensity icon (from `WeatherTooltip/icons/HumidityIcon.tsx`):**

```tsx
/**
 * Humidity icon with intensity-based coloring.
 */

export function HumidityIcon({ humidity }: { humidity: number }) {
  let opacity = 0.5
  let color = '#BFDBFE'

  if (humidity >= 80) {
    opacity = 1
    color = '#1D4ED8'
  } else if (humidity >= 60) {
    opacity = 0.85
    color = '#3B82F6'
  } else if (humidity >= 30) {
    opacity = 0.7
    color = '#60A5FA'
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        fill={color}
        opacity={opacity}
      />
    </svg>
  )
}
```

**Rules:**
- Colors are hardcoded hex values (not from theme tokens) — icons are domain-specific illustrations
- Helper functions (color computation) are defined as module-level functions, not inside the component
- Use `<title>` for accessibility when the icon conveys meaning without text
- Use `fill="none"` on the root `<svg>` and set `fill` on individual elements
- For `stroke`-based icons, set `strokeLinecap="round"` and `strokeLinejoin="round"`
- Use `style={{ flexShrink: 0 }}` when the icon sits inline with text to prevent squishing

### 3. Import and use in the parent component

```tsx
import { ThermometerIcon } from './icons/ThermometerIcon'

// In JSX:
<ThermometerIcon temp={current.temperature} />
```

If multiple icons are used together, import them all at the top:

```tsx
import { ThermometerIcon } from './icons/ThermometerIcon'
import { HumidityIcon } from './icons/HumidityIcon'
import { WindIcon } from './icons/WindIcon'

// In JSX — tooltip row:
<div className="tooltip-row">
  <ThermometerIcon temp={day.high} />
  <span>{day.high}°</span>
</div>
<div className="tooltip-row">
  <HumidityIcon humidity={day.humidity ?? 0} />
  <span>{day.humidity}%</span>
</div>
```

### 4. Run quality gate

```bash
pnpm lint
pnpm typecheck
pnpm build
```

All three must pass (no tests needed for purely visual SVG components, but add a render test if the icon has complex conditional logic).

## Checklist

- [ ] Checked lucide-react first — confirmed the icon is not available there
- [ ] Icon component created in `icons/` directory under the parent component
- [ ] PascalCase filename matching the exported function name
- [ ] Named export (not default export)
- [ ] Inline SVG with explicit `width`, `height`, and `viewBox`
- [ ] TSDoc comment describing the icon
- [ ] Props interface defined if the icon has dynamic values
- [ ] Helper functions (color computation, etc.) defined at module level
- [ ] No external dependencies — pure SVG elements only
- [ ] Imported and used in the parent component
- [ ] Quality gate passes (`pnpm lint && pnpm typecheck && pnpm build`)

## Example: Adding a DewPointIcon to the weather tooltip

1. Check lucide-react — no dew point icon exists there
2. Create `src/features/weather/components/WeatherTooltip/icons/DewPointIcon.tsx`
3. Implement with a water-drop + thermometer hybrid SVG
4. Add `getDewPointColor(temp: number)` helper for temperature-based coloring
5. Import in `WeatherTooltip.tsx` and use in the dew point row
6. Quality gate passes

## Example: Adding a simple static icon to calendar events

1. Need a "location" icon next to event addresses
2. Check lucide-react — `MapPin` exists, but the project uses a custom `MapPinIcon` for consistent sizing
3. Create `src/features/calendar/components/EventItem/MapPinIcon.tsx`
4. Accept `size` prop with default, use `stroke="currentColor"` to inherit text color
5. Add `style={{ flexShrink: 0, color: 'inherit', opacity: 0.6 }}` for inline use
6. Import and use next to the location text in `EventItem.tsx`
7. Quality gate passes

## Notes

- Icons use hardcoded hex colors, not theme tokens — they are domain-specific illustrations with semantic coloring (red = hot, blue = cold)
- The Raspberry Pi kiosk (Chromium) lacks emoji fonts — all visual indicators must be SVG
- Default icon size is 20×20 with a 24×24 viewBox — match this unless the design requires otherwise
- For icons that sit inline with text, always add `flexShrink: 0` to prevent squishing
- Use `currentColor` for stroke-based icons that should inherit the parent's text color
- Keep SVG paths simple — complex paths increase bundle size and render time on the Pi
- If an icon needs many conditional elements (like `FeelsLikeFaceIcon` with 6 expressions), consider extracting the color/shape logic into a helper function
