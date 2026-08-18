---
name: add-frontend-test
description: Workflow for adding frontend tests following Dashy's three-tier testing strategy (unit, component, integration).
---

# Add Frontend Test

Write frontend tests following Dashy's three-tier testing strategy.

## When to use

- Adding tests for a new component, hook, or utility
- Improving coverage for existing code
- Verifying a bug fix with a regression test

## Prerequisites

- Understand the three test tiers and when to use each
- Know the file location conventions (co-located vs `src/test/`)
- Review existing tests for patterns: `src/shared/utils/recurrence.test.ts`, `src/features/calendar/components/EventItem/EventItem.test.tsx`

## Test tiers

| Tier | Location | Purpose | Tools |
|------|----------|---------|-------|
| Unit | Co-located `*.test.ts` | Pure utils, hook logic | Vitest, `renderHook` |
| Component | Co-located `*.test.tsx` | Rendering + interaction | Vitest + Testing Library |
| Integration | `src/test/integration/` | Full feature flows | Vitest + MSW + Testing Library |

## Conventions

- **Co-locate tests**: `ComponentName.test.tsx` lives next to `ComponentName.tsx`
- **File pattern**: `*.test.ts` or `*.test.tsx`
- **Use `describe`/`it` blocks** (not `test`)
- **Arrange-Act-Assert** pattern in each test
- **No snapshot tests** — explicit assertions only
- **Test behavior, not implementation details** — query by text, role, or label; avoid querying by class name or data attribute
- **Use `vi.fn()` for mocks**, `vi.mock()` for module mocks
- **Mock data** goes in the test file (small) or `src/test/mocks/` (shared/large)
- **Group related tests** with nested `describe` blocks (see EventItem pattern: `describe('card variant')`, `describe('interactions')`)

## Steps

### 1. Determine the test tier

Decide which tier based on what you're testing:

- **Pure function with no React?** → Unit test (`.test.ts`)
- **React component or hook?** → Component test (`.test.tsx`)
- **Multi-component feature flow with API calls?** → Integration test (`src/test/integration/`)

### 2. Create the test file

Co-locate the test file next to the source file:

```
src/shared/utils/dateFormat.ts
src/shared/utils/dateFormat.test.ts    ← co-located

src/features/calendar/components/EventItem/EventItem.tsx
src/features/calendar/components/EventItem/EventItem.test.tsx    ← co-located
```

### 3. Write unit tests (utils)

Follow the `recurrence.test.ts` pattern — import from `vitest`, use `describe`/`it`, test edge cases:

```typescript
import { describe, it, expect } from 'vitest'
import { getOrdinalSuffix } from './dateFormat'

describe('getOrdinalSuffix', () => {
  it('returns st for 1, 21, 31', () => {
    expect(getOrdinalSuffix(1)).toBe('st')
    expect(getOrdinalSuffix(21)).toBe('st')
    expect(getOrdinalSuffix(31)).toBe('st')
  })

  it('returns nd for 2, 22', () => {
    expect(getOrdinalSuffix(2)).toBe('nd')
    expect(getOrdinalSuffix(22)).toBe('nd')
  })

  it('returns rd for 3, 23', () => {
    expect(getOrdinalSuffix(3)).toBe('rd')
    expect(getOrdinalSuffix(23)).toBe('rd')
  })

  it('returns th for 4-20 and 24-30', () => {
    expect(getOrdinalSuffix(4)).toBe('th')
    expect(getOrdinalSuffix(11)).toBe('th')
    expect(getOrdinalSuffix(12)).toBe('th')
    expect(getOrdinalSuffix(13)).toBe('th')
    expect(getOrdinalSuffix(24)).toBe('th')
  })
})
```

### 4. Write hook tests

Use `renderHook` and `act` from Testing Library:

```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { useUiScale } from './useUiScale'

describe('useUiScale', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the default scale factor', () => {
    const { result } = renderHook(() => useUiScale())
    expect(result.current.scaleFactor).toBeGreaterThan(0)
  })

  it('updates scale when viewport changes', () => {
    const { result } = renderHook(() => useUiScale())
    const initialScale = result.current.scaleFactor

    act(() => {
      window.innerWidth = 800
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current.scaleFactor).not.toBe(initialScale)
  })
})
```

### 5. Write component tests

Follow the `EventItem.test.tsx` pattern — define mock data at the top, group tests with nested `describe`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ComponentName } from './ComponentName'
import type { CalendarEvent, FamilyMember } from '@/types'

// Mock data — define at the top of the file
const mockMembers: FamilyMember[] = [
  {
    name: 'Faiyaz',
    key: 'faiyaz',
    calendar_id: 'faiyaz@gmail.com',
    color: '#4A90E2',
    initial: 'F',
  },
]

const mockEvent: CalendarEvent = {
  id: '1',
  title: 'Team Standup',
  start: '2026-08-04T09:00:00',
  end: '2026-08-04T09:30:00',
  all_day: false,
  members: ['faiyaz'],
}

describe('ComponentName', () => {
  describe('rendering', () => {
    it('renders expected content', () => {
      render(<ComponentName event={mockEvent} members={mockMembers} />)
      expect(screen.getByText('Team Standup')).toBeInTheDocument()
    })

    it('renders member initial', () => {
      render(<ComponentName event={mockEvent} members={mockMembers} />)
      expect(screen.getByText('F')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onClick handler', () => {
      const onClick = vi.fn()
      render(<ComponentName event={mockEvent} members={mockMembers} onClick={onClick} />)
      fireEvent.click(screen.getByText('Team Standup'))
      expect(onClick).toHaveBeenCalledWith(mockEvent)
    })

    it('stops click propagation', () => {
      const onParentClick = vi.fn()
      const onClick = vi.fn()
      render(
        <div onClick={onParentClick}>
          <ComponentName event={mockEvent} members={mockMembers} onClick={onClick} />
        </div>,
      )
      fireEvent.click(screen.getByText('Team Standup'))
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onParentClick).not.toHaveBeenCalled()
    })
  })
})
```

### 6. Mock global fetch (if needed)

For tests that exercise API calls, mock `fetch` globally:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('getWeather', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns weather data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current: { temperature: 72 } }),
    })

    const result = await getWeather()
    expect(result.current.temperature).toBe(72)
  })

  it('throws after max retries', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    await expect(getWeather()).rejects.toThrow('Network error')
  }, 60000) // Extended timeout for retry tests
})
```

### 7. Run tests and verify

```bash
make test-frontend
```

Check specific file:

```bash
# Inside the container (use make test-frontend for the full suite)
npx vitest run src/shared/utils/dateFormat.test.ts
```

### 8. Check coverage (if needed)

```bash
make test-frontend  # Coverage is included in the output
```

**Coverage targets:**

| Scope | Target |
|-------|--------|
| Utils and hooks | 80% |
| Components | 70% |

## Mock data patterns

### CalendarEvent

```typescript
const mockEvent: CalendarEvent = {
  id: '1',
  title: 'Team Standup',
  start: '2026-08-04T09:00:00',
  end: '2026-08-04T09:30:00',
  all_day: false,
  members: ['faiyaz'],
}
```

### FamilyMember

```typescript
const mockMember: FamilyMember = {
  name: 'Faiyaz',
  key: 'faiyaz',
  calendar_id: 'faiyaz@gmail.com',
  color: '#4A90E2',
  initial: 'F',
}
```

### WeatherResponse

```typescript
const mockWeather: WeatherResponse = {
  current: {
    temperature: 72,
    condition: 'clear',
    humidity: 45,
    wind_speed: 8,
  },
  forecast: {
    daily: [
      { date: '2026-08-04', high: 78, low: 62, condition: 'partly_cloudy' },
    ],
    hourly: [
      { time: '2026-08-04T09:00:00', temperature: 70, condition: 'clear' },
    ],
  },
}
```

## Checklist

- [ ] Determined correct test tier (unit, component, integration)
- [ ] Created test file co-located with source
- [ ] Used `describe`/`it` blocks (not `test`)
- [ ] Followed Arrange-Act-Assert pattern
- [ ] Used explicit assertions (no snapshots)
- [ ] Tested behavior, not implementation details
- [ ] Added edge case tests
- [ ] Mock data defined at top of file or in `src/test/mocks/`
- [ ] `make test-frontend` passes
- [ ] Coverage meets targets (80% utils/hooks, 70% components)

## Example: Testing a new utility function

Scenario: You added a `formatTemperature` function to `shared/utils/dateFormat.ts`.

1. Create `shared/utils/dateFormat.test.ts` (or add to existing file)
2. Import the function and `describe`/`it`/`expect` from vitest
3. Write tests for each branch: Fahrenheit, Celsius, rounding, edge cases
4. Run `make test-frontend`

## Example: Testing a new component

Scenario: You created a `TaskItem` component.

1. Create `TaskItem.test.tsx` next to `TaskItem.tsx`
2. Define mock data at the top (tasks, members)
3. Group tests: `describe('rendering')`, `describe('interactions')`, `describe('edge cases')`
4. Use `screen.getByText()`, `screen.getByRole()`, `screen.queryByText()` for assertions
5. Use `fireEvent` or `userEvent` for interactions
6. Use `vi.fn()` for callback props
7. Run `make test-frontend`

## Notes

- Prefer `screen.getByRole()` over `screen.getByText()` when possible — it's more accessible
- Use `screen.queryByText()` to assert something is **not** present (returns `null` instead of throwing)
- For async operations, use `waitFor` or `findBy*` queries
- Long-running retry tests need extended timeout: `it('...', async () => { ... }, 60000)`
- Always call `vi.restoreAllMocks()` in `afterEach` to prevent test pollution
- Integration tests with MSW are not yet set up — use component-level mocking until then
