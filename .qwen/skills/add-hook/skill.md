---
name: add-hook
description: Create a custom React hook following Dashy's conventions — placement, TSDoc, explicit return types, co-located tests, and feature vs shared decision logic.
---

# Add Hook

Create a custom React hook following Dashy's conventions.

## When to use

- Extracting reusable stateful logic from components
- Encapsulating DOM interactions (event listeners, resize handlers)
- Wrapping API calls or external library integrations
- Not for pure business logic — use `/add-domain-utility` instead

## Prerequisites

- Understand what state/behavior the hook will encapsulate
- Know which feature uses the hook (or if it's cross-cutting)
- Review existing hooks for patterns

## Steps

### 1. Determine placement

**Feature-specific hook:**
```
features/<feature>/hooks/
└── use<HookName>.ts
└── use<HookName>.test.ts
```

**Shared/cross-cutting hook:**
```
shared/hooks/
└── use<HookName>.ts
└── use<HookName>.test.ts
```

**Decision logic:**
- Used by only one feature? → `features/<feature>/hooks/`
- Used by 2+ features? → `shared/hooks/`
- Examples of shared hooks: `useApi`, `useViewNavigation`
- Examples of feature hooks: `useCalendarEvents` (calendar), `useWeatherTooltip` (weather)

### 2. Create hook file

```typescript
// features/<feature>/hooks/use<HookName>.ts
/**
 * use<HookName> — brief description of what the hook does.
 *
 * More detailed explanation if needed. Describe behavior, side effects,
 * and when to use it.
 */

import { useState, useEffect } from 'react'

interface Use<HookName>Options {
  /** Description of option. */
  option1?: string
  /** Description of option. */
  option2?: number
}

interface Use<HookName>Return {
  /** Description of return value. */
  value: string
  /** Description of return value. */
  setValue: (value: string) => void
}

/**
 * use<HookName> hook.
 *
 * @param options - Hook configuration options.
 * @returns Object containing state and setters.
 */
export function use<HookName>(options: Use<HookName>Options = {}): Use<HookName>Return {
  const [value, setValue] = useState(options.option1 || '')

  useEffect(() => {
    // Side effect logic
  }, [options.option2])

  return { value, setValue }
}
```

**Conventions:**
- **camelCase** filename: `useHookName.ts`
- **Named export** (not default): `export function useHookName()`
- **Explicit return type**: Define `Use<HookName>Return` interface
- **Options interface**: If hook takes multiple params, use `Use<HookName>Options`
- **TSDoc** with `@param` and `@returns` tags
- **No barrel export** — import directly: `import { useHookName } from './useHookName'`
- **Co-located test**: `useHookName.test.ts` in same directory

### 3. Create test file

```typescript
// features/<feature>/hooks/use<HookName>.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { use<HookName> } from './use<HookName>'

describe('use<HookName>', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial value', () => {
    const { result } = renderHook(() => use<HookName>())
    expect(result.current.value).toBe('')
  })

  it('accepts options', () => {
    const { result } = renderHook(() => use<HookName>({ option1: 'test' }))
    expect(result.current.value).toBe('test')
  })

  it('updates value', () => {
    const { result } = renderHook(() => use<HookName>())
    
    act(() => {
      result.current.setValue('new value')
    })
    
    expect(result.current.value).toBe('new value')
  })

  it('handles side effects', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    
    renderHook(() => use<HookName>())
    
    expect(addEventListenerSpy).toHaveBeenCalled()
  })
})
```

**Test conventions:**
- **Use `renderHook`** from `@testing-library/react`
- **Use `act`** for state updates
- **Co-located** with hook (same directory)
- **File pattern**: `useHookName.test.ts` (not `.tsx`)
- **Test return values**, not internal state
- **Mock DOM APIs** with `vi.spyOn` when testing side effects
- **Clean up** with `afterEach(() => vi.restoreAllMocks())`

### 4. Wire into component

Import and use the hook:

```typescript
// features/<feature>/components/<ComponentName>/<ComponentName>.tsx
import { use<HookName> } from '@/features/<feature>/hooks/use<HookName>'

export function <ComponentName>() {
  const { value, setValue } = use<HookName>({ option1: 'test' })

  return (
    <div>
      <span>{value}</span>
      <button onClick={() => setValue('new')}>Update</button>
    </div>
  )
}
```

### 5. Run quality gate

```bash
make lint
make typecheck
make test-frontend
```

## Common patterns

### Hook with cleanup

```typescript
export function useEventListener(event: string, handler: () => void): void {
  useEffect(() => {
    window.addEventListener(event, handler)
    
    return () => {
      window.removeEventListener(event, handler)
    }
  }, [event, handler])
}
```

### Hook with ref

```typescript
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  
  useEffect(() => {
    ref.current = value
  }, [value])
  
  return ref.current
}
```

### Hook with memoization

```typescript
export function useFilteredItems(items: Item[], filter: string): Item[] {
  return useMemo(() => {
    return items.filter(item => item.name.includes(filter))
  }, [items, filter])
}
```

### Hook with callback

```typescript
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T
}
```

## Checklist

- [ ] Hook file created with TSDoc
- [ ] Explicit return type interface defined
- [ ] Options interface defined (if multiple params)
- [ ] Named export (not default)
- [ ] Test file created with `renderHook`
- [ ] Tests use `act` for state updates
- [ ] Cleanup in `afterEach` if using spies/mocks
- [ ] Wired into component
- [ ] Quality gate passes

## Example: Adding useLocalStorage hook

**Placement:** `shared/hooks/useLocalStorage.ts` (cross-cutting)

**useLocalStorage.ts:**
```typescript
/**
 * useLocalStorage — sync state with localStorage.
 *
 * Persists state to localStorage and syncs across tabs.
 * Handles JSON serialization/deserialization.
 */

import { useState, useEffect } from 'react'

interface UseLocalStorageOptions<T> {
  /** Default value if key doesn't exist. */
  defaultValue: T
}

interface UseLocalStorageReturn<T> {
  /** Current value. */
  value: T
  /** Update value (persists to localStorage). */
  setValue: (value: T) => void
  /** Remove from localStorage. */
  removeValue: () => void
}

/**
 * useLocalStorage hook.
 *
 * @param key - localStorage key.
 * @param options - Configuration options.
 * @returns Object containing value and setters.
 */
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T> {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : options.defaultValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  const removeValue = () => {
    localStorage.removeItem(key)
    setValue(options.defaultValue)
  }

  return { value, setValue, removeValue }
}
```

**useLocalStorage.test.ts:**
```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default value when key doesn\'t exist', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { defaultValue: 'default' })
    )
    expect(result.current.value).toBe('default')
  })

  it('persists value to localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { defaultValue: 'default' })
    )

    act(() => {
      result.current.setValue('new value')
    })

    expect(result.current.value).toBe('new value')
    expect(localStorage.getItem('test-key')).toBe('"new value"')
  })

  it('removes value from localStorage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', { defaultValue: 'default' })
    )

    act(() => {
      result.current.setValue('new value')
      result.current.removeValue()
    })

    expect(result.current.value).toBe('default')
    expect(localStorage.getItem('test-key')).toBeNull()
  })
})
```

## Notes

- **No barrel export** — import directly from the hook file
- **Explicit return types** — helps catch API changes
- **Test with `renderHook`** — not `render` (that's for components)
- **Use `act`** for state updates in tests
- **Clean up side effects** — return cleanup function from `useEffect`
- **Co-locate tests** — `useHookName.test.ts` next to `useHookName.ts`
