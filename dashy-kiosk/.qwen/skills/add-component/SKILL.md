---
name: add-component
description: Create a new React component following Dashy's conventions — directory structure, TSDoc, inline styles with tokens, barrel exports, and co-located tests.
---

# Add Component

Create a new React component following Dashy's feature-based architecture and conventions.

## When to use

- Adding a new UI element to an existing feature (calendar, weather, navigation, dashboard, kiosk)
- Creating a shared/reusable component used across multiple features
- Not for creating entire feature modules — use `/add-feature` instead
- Not for adding domain logic — use `/add-domain-utility` instead

## Prerequisites

- Understand which feature the component belongs to (calendar, weather, navigation, dashboard, kiosk, or shared)
- Review existing components in that feature for patterns
- Know the component's props and behavior

## Steps

### 1. Determine placement

**Feature-specific component:**
```
src/features/<feature>/components/<ComponentName>/
├── <ComponentName>.tsx
├── <ComponentName>.test.tsx
└── index.ts
```

**Shared/reusable component:**
```
src/shared/components/<ComponentName>/
├── <ComponentName>.tsx
├── <ComponentName>.test.tsx
└── index.ts
```

**Decision logic:**
- Used by only one feature? → `src/features/<feature>/components/`
- Used by 2+ features? → `src/shared/components/`
- Calendar views (DayView, WeekGrid, etc.) go in `src/features/calendar/views/` not `components/`

### 2. Create component file

```typescript
// src/features/<feature>/components/<ComponentName>/<ComponentName>.tsx
/**
 * <ComponentName> — brief description of purpose.
 *
 * More detailed explanation if needed. Describe variants, behavior,
 * and usage context.
 */

import { useState } from 'react'
import type { SomeType } from '@/types'
import { colors, spacing, radii } from '@/theme/tokens'

interface <ComponentName>Props {
  /** Description of prop. */
  prop1: string
  /** Description of optional prop. */
  prop2?: number
  /** Callback handler. */
  onAction?: (value: string) => void
}

/**
 * <ComponentName> component.
 *
 * @param props - Component props.
 * @returns The component UI.
 */
export function <ComponentName>({ prop1, prop2 = 10, onAction }: <ComponentName>Props) {
  const [state, setState] = useState(false)

  const handleClick = () => {
    onAction?.(prop1)
  }

  const rootStyle: React.CSSProperties = {
    padding: `${spacing.md}px`,
    borderRadius: `${radii.lg}px`,
    background: colors.bg,
    // ... more styles using tokens
  }

  return (
    <div style={rootStyle}>
      <span style={{ color: colors.textPrimary }}>{prop1}</span>
      <button onClick={handleClick} style={{ /* ... */ }}>
        Action
      </button>
    </div>
  )
}
```

**Conventions:**
- **Named export** (not default): `export function ComponentName()`
- **PascalCase** for component name and filename
- **Props interface** named `<ComponentName>Props` with JSDoc on each prop
- **TSDoc** on the component with `@param` and `@returns`
- **Inline styles** using design tokens from `@/theme/tokens` — no hardcoded hex/px values
- **No Tailwind utility classes** in components (Tailwind is for CSS custom properties integration, not utility-first styling)
- **Import types** using `import type` syntax
- **Path aliases** (`@/`) for all imports

### 3. Create barrel export

```typescript
// src/features/<feature>/components/<ComponentName>/index.ts
export { <ComponentName> } from './<ComponentName>'
```

**Rules:**
- Always create `index.ts` barrel export
- Re-export the component and any helper components/icons
- Consumers import from `@/features/<feature>/components/<ComponentName>`

### 4. Create test file

```typescript
// src/features/<feature>/components/<ComponentName>/<ComponentName>.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { <ComponentName> } from './<ComponentName>'

describe('<ComponentName>', () => {
  it('renders expected content', () => {
    render(<ComponentName prop1="test" />)
    expect(screen.getByText('test')).toBeInTheDocument()
  })

  it('calls onAction when clicked', () => {
    const onAction = vi.fn()
    render(<ComponentName prop1="test" onAction={onAction} />)
    fireEvent.click(screen.getByText('Action'))
    expect(onAction).toHaveBeenCalledWith('test')
  })

  it('handles optional props correctly', () => {
    render(<ComponentName prop1="test" prop2={20} />)
    // Assert prop2 behavior
  })
})
```

**Test conventions:**
- **Co-located** with component (same directory)
- **File pattern**: `<ComponentName>.test.tsx`
- **Import from Vitest**: `describe`, `it`, `expect`, `vi`
- **Import from Testing Library**: `render`, `screen`, `fireEvent`
- **Arrange-Act-Assert** pattern in each test
- **Test behavior**, not implementation (assert on visible output, not internal state)
- **No snapshot tests** — explicit assertions only
- **Nested describes** for grouping (by variant, feature, or concern)

### 5. Add sub-components (if needed)

If the component has helper icons or sub-components, place them in the same directory:

```
src/features/<feature>/components/<ComponentName>/
├── <ComponentName>.tsx
├── <ComponentName>.test.tsx
├── HelperIcon.tsx          # Sub-component
├── SubComponent.tsx         # Sub-component
└── index.ts
```

Update barrel export:
```typescript
// index.ts
export { <ComponentName> } from './<ComponentName>'
export { HelperIcon } from './HelperIcon'
export { SubComponent } from './SubComponent'
```

**When to split:**
- Component exceeds 200 lines
- Sub-component is reusable within the feature
- Sub-component has distinct responsibility (e.g., icon, badge, indicator)

### 6. Wire into parent component

Import and use the new component:

```typescript
// src/features/<feature>/views/<ViewName>/<ViewName>.tsx
import { <ComponentName> } from '@/features/<feature>/components/<ComponentName>'

export function <ViewName>() {
  return (
    <div>
      <<ComponentName> prop1="value" />
    </div>
  )
}
```

### 7. Run quality gate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Checklist

- [ ] Component file created with TSDoc
- [ ] Props interface defined with JSDoc on each prop
- [ ] Named export (not default)
- [ ] Inline styles use design tokens (no hardcoded values)
- [ ] Barrel export (`index.ts`) created
- [ ] Test file created with co-located tests
- [ ] Tests follow AAA pattern
- [ ] Sub-components split if >200 lines
- [ ] Wired into parent component
- [ ] Quality gate passes

## Example: Adding a TaskItem component to calendar feature

```
src/features/calendar/components/TaskItem/
├── TaskItem.tsx
├── TaskItem.test.tsx
└── index.ts
```

**TaskItem.tsx:**
```typescript
/**
 * TaskItem — displays a single task with checkbox and title.
 *
 * Used in DayView and WeekGrid to show actionable items.
 * Completed tasks show strikethrough text.
 */

import { useState } from 'react'
import { colors, spacing, radii } from '@/theme/tokens'

interface TaskItemProps {
  /** Task title. */
  title: string
  /** Whether task is completed. */
  completed?: boolean
  /** Callback when checkbox is toggled. */
  onToggle?: (completed: boolean) => void
}

/**
 * TaskItem component.
 *
 * @param props - Component props.
 * @returns The task item UI.
 */
export function TaskItem({ title, completed = false, onToggle }: TaskItemProps) {
  const [isChecked, setIsChecked] = useState(completed)

  const handleToggle = () => {
    const newState = !isChecked
    setIsChecked(newState)
    onToggle?.(newState)
  }

  const rootStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.sm}px`,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: `${radii.md}px`,
    background: colors.bgHover,
  }

  const titleStyle: React.CSSProperties = {
    color: isChecked ? colors.textMuted : colors.textPrimary,
    textDecoration: isChecked ? 'line-through' : 'none',
  }

  return (
    <div style={rootStyle}>
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleToggle}
        style={{ cursor: 'pointer' }}
      />
      <span style={titleStyle}>{title}</span>
    </div>
  )
}
```

**index.ts:**
```typescript
export { TaskItem } from './TaskItem'
```

**TaskItem.test.tsx:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TaskItem } from './TaskItem'

describe('TaskItem', () => {
  it('renders task title', () => {
    render(<TaskItem title="Buy groceries" />)
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
  })

  it('shows completed state', () => {
    render(<TaskItem title="Buy groceries" completed={true} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('calls onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn()
    render(<TaskItem title="Buy groceries" onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith(true)
  })
})
```

## Notes

- **No default exports** — always use named exports
- **No Tailwind utilities** — use inline styles with tokens
- **TSDoc is mandatory** — every exported symbol needs documentation
- **Co-locate tests** — `ComponentName.test.tsx` lives next to `ComponentName.tsx`
- **Barrel exports** — every component folder has an `index.ts`
- **Design tokens only** — no hardcoded colors, spacing, or sizing values
