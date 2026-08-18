---
name: add-theme-token
description: Add a new design token to the theme system — update tokens.ts, config.ts (if semantic), and use in components with no hardcoded values.
---

# Add Theme Token

Add a new design token to Dashy's theme system.

## When to use

- Adding a new color, spacing value, typography preset, shadow, or z-index
- Extending the design system for new UI patterns
- Not for component-specific styles — use inline styles with existing tokens

## Prerequisites

- Understand which token category (color, spacing, typography, etc.)
- Know the token's purpose and where it will be used
- Review existing tokens in `src/theme/tokens.ts`

## Steps

### 1. Determine token category

Tokens are organized into categories in `src/theme/tokens.ts`:

| Category | Purpose | Example |
|----------|---------|---------|
| `colors` | Color palette | `primary`, `bg`, `textPrimary` |
| `densityColors` | Density level colors | `none`, `low`, `medium`, `high` |
| `spacing` | Padding, margin, gap | `xs`, `sm`, `md`, `lg`, `xl` |
| `layout` | Layout dimensions | `headerHeight`, `sidebarFull` |
| `radii` | Border radius | `sm`, `md`, `lg`, `xl` |
| `typography` | Font sizes, weights | `headerTitle`, `eventTitle` |
| `shadows` | Box shadows | `cardHover`, `popup` |
| `transitions` | Transition timing | `fast`, `sidebar` |
| `zIndices` | Z-index layers | `stickyArea`, `popup`, `modal` |

### 2. Add token to tokens.ts

Edit `src/theme/tokens.ts` and add the token to the appropriate category:

```typescript
// src/theme/tokens.ts

// Example: Adding a new color
export const colors = {
  // ... existing colors

  /** New token description. */
  newColor: '#123456',
} as const

// Example: Adding a new spacing value
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 48,

  /** New spacing token. */
  '3xl': 64,
} as const

// Example: Adding a new typography preset
export const typography = {
  // ... existing presets

  /** New typography token. */
  newPreset: { size: 14, weight: 500 },
} as const
```

**Conventions:**
- **`as const`** — all token objects use `as const` for type safety
- **JSDoc comment** — describe the token's purpose
- **Group logically** — add near related tokens
- **No hardcoded values in components** — always import from tokens

### 3. Add to config.ts (if semantic/configurable)

If the token needs semantic meaning or user-overridability, add to `src/theme/config.ts`:

```typescript
// src/theme/config.ts
export const themeConfig = {
  colors,
  spacing,
  // ... other tokens

  /** New semantic config. */
  newFeature: {
    /** Description. */
    someValue: colors.newColor,
  },
} as const
```

**When to add to config:**
- Token is user-configurable (e.g., theme colors)
- Token has semantic meaning (e.g., `calendar.timelineStartHour`)
- Token is part of a feature-specific configuration

**When to skip config:**
- Token is a raw design value (e.g., a new spacing value)
- Token is not user-configurable
- Token is used directly from `tokens.ts`

### 4. Use token in component

Import and use the token:

```typescript
// src/features/<feature>/components/<ComponentName>/<ComponentName>.tsx
import { colors, spacing, typography } from '@/theme/tokens'

export function <ComponentName>() {
  const rootStyle: React.CSSProperties = {
    padding: `${spacing.md}px`,
    background: colors.newColor,
    fontSize: `${typography.newPreset.size}px`,
    fontWeight: typography.newPreset.weight,
  }

  return <div style={rootStyle}>Content</div>
}
```

**Rules:**
- **No hardcoded values** — always import from `@/theme/tokens`
- **Use template literals** for px values: `${spacing.md}px`
- **Direct property access** for non-px values: `colors.newColor`

### 5. Run quality gate

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Common patterns

### Adding a color palette

```typescript
// src/theme/tokens.ts
export const newPalette = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
} as const
```

### Adding a density level

```typescript
// src/theme/tokens.ts
export const densityColors = {
  none: { bg: '#f3f4f6', text: '#6b7280' },
  low: { bg: '#dcfce7', text: '#16a34a' },
  medium: { bg: '#fef3c7', text: '#d97706' },
  high: { bg: '#fee2e2', text: '#dc2626' },

  /** New density level. */
  critical: { bg: '#fecaca', text: '#991b1b' },
} as const
```

### Adding a layout dimension

```typescript
// src/theme/tokens.ts
export const layout = {
  headerHeight: 57,
  sidebarFull: 224,
  sidebarCollapsed: 64,

  /** New layout dimension. */
  newPanelWidth: 300,
} as const
```

### Adding a z-index layer

```typescript
// src/theme/tokens.ts
export const zIndices = {
  stickyArea: 10,
  sideNav: 40,
  popup: 1000,
  modal: 1000,

  /** New z-index layer. */
  newLayer: 500,
} as const
```

## Checklist

- [ ] Token added to `src/theme/tokens.ts` in appropriate category
- [ ] Token has JSDoc comment describing purpose
- [ ] Token uses `as const` for type safety
- [ ] Token added to `src/theme/config.ts` (if semantic/configurable)
- [ ] Token used in component with no hardcoded values
- [ ] Quality gate passes

## Example: Adding a "warning" color

**Step 1: Add to tokens.ts**
```typescript
// src/theme/tokens.ts
export const colors = {
  // ... existing colors

  /** Warning color for alerts and cautions. */
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  warningText: '#92400e',
} as const
```

**Step 2: Use in component**
```typescript
// src/features/dashboard/components/AlertBanner/AlertBanner.tsx
import { colors, spacing, radii } from '@/theme/tokens'

export function AlertBanner({ message }: { message: string }) {
  const bannerStyle: React.CSSProperties = {
    padding: `${spacing.md}px`,
    borderRadius: `${radii.md}px`,
    background: colors.warningBg,
    color: colors.warningText,
    border: `1px solid ${colors.warning}`,
  }

  return <div style={bannerStyle}>{message}</div>
}
```

## Notes

- **No hardcoded values** — always import from `@/theme/tokens`
- **`as const`** — ensures type safety and literal types
- **JSDoc comments** — describe token purpose
- **Config vs tokens** — add to `config.ts` only if semantic/configurable
- **Template literals** — use `${token}px` for pixel values
- **Group logically** — add tokens near related values
