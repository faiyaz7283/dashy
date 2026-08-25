# Error Handling — Current State & Gaps

> **Status:** Documented — awaiting implementation (separate session)
> **Created:** 2026-08-25
> **Priority:** Medium — React Query migration handles data-fetching errors natively; this covers the remaining gaps
> **Dependency:** React Query migration should be completed first (error handling patterns must be compatible)

---

## Executive Summary

Dashy kiosk has **no consistent error handling standard**. Errors are reduced to `string | null` with no structure, no status codes, and no way to distinguish error types. Most errors are silently swallowed. This document catalogs every gap and proposes a layered solution.

**Compatibility note:** The React Query migration (see `REACT-QUERY-MIGRATION.md`) handles data-fetching errors natively via `useQuery`'s `error`/`isError`/`isPending` states. The error handling work described here must be compatible — it layers on top of React Query, not against it.

---

## Current State

### Error shape

All errors are `string | null`. No custom error classes, no status codes, no structured error objects.

### Two inconsistent API error patterns

| Pattern | Used by | Behavior |
|---------|---------|----------|
| **Simple** (statusText only) | Weather, Calendar, Family | `throw new Error('... API error: ${response.statusText}')` — backend error details lost |
| **Detailed** (JSON body) | Chores only | `parseErrorResponse()` reads `body.detail` / `body.message`, falls back to `statusText` |

The chores pattern is better. All endpoints should use it.

---

## Gap Catalog

### Gap 1: No structured error type

**Problem:** Errors are plain strings. Cannot distinguish network errors, validation errors, auth errors (401), rate limits (429), or server errors (500).

**Impact:** Cannot implement smart retry logic (don't retry 400s, do retry 500s), cannot show contextual error messages, cannot redirect on auth failures.

**Proposed fix:** Create `ApiError` class extending `Error` with `status`, `detail`, and `isRetryable` properties.

### Gap 2: No centralized error parsing

**Problem:** Each fetch function handles errors differently. Weather/Calendar/Family lose backend error details. Only Chores has `parseErrorResponse()`.

**Impact:** Inconsistent error messages, lost debugging information.

**Proposed fix:** Single `parseApiError(response: Response): Promise<ApiError>` function used by all fetch code.

### Gap 3: AppShell silently swallows errors

**Problem:** `AppShell.tsx` calls `useFamilyData()`, `useCalendarData()`, `useWeatherData()`, and `useChoresData()` but **ignores `error` from all four**. Errors are silently dropped at the top level.

**Impact:** Users see loading states or empty UI with no indication something went wrong.

**Proposed fix:** With React Query, errors surface via `useQuery`'s `error`/`isError`. AppShell (or a global error context) should display a non-blocking error indicator.

### Gap 4: Calendar views have no error UI

**Problem:** All four calendar views (Day, Week, Month, Year) handle `isLoading` but **never check `error`**. If a calendar fetch fails, the view shows a loading placeholder or empty state.

**Impact:** User sees "Loading calendar..." forever, or an empty calendar with no explanation.

**Proposed fix:** Each view should render an error state when `isError` is true. With React Query context provider (Phase 3), this is handled at the provider level.

### Gap 5: Weather silently disappears on failure

**Problem:** `Header.tsx` consumes `useWeatherData()` but only destructures `current` and `forecast` — ignores `error`. If weather fetch fails, the weather section simply doesn't render (guarded by `{weather && forecast[0] && ...}`).

**Impact:** User sees no weather with no indication of failure.

**Proposed fix:** Show a subtle error indicator in the weather section (e.g., "Weather unavailable" with a retry icon).

### Gap 6: Chore mutations have no error handling

**Problem:** `useChoreActions.ts` wraps mutation functions (create, update, delete, claim, assign) with **no try/catch**. Modal components (`ChoreCreateModal`, `ChoreEditModal`) also have no error handling. If a mutation fails, the error becomes an unhandled promise rejection.

**Impact:** User clicks "Save" and nothing happens. No feedback, no error message.

**Proposed fix:** With React Query, use `useMutation` which provides `error` state. Show error feedback via toast notification or inline error message in the modal.

### Gap 7: No Error Boundary

**Problem:** No React Error Boundary exists anywhere in the codebase. A rendering error (e.g., accessing property of null, type mismatch) crashes the entire application with a white screen.

**Impact:** Complete app crash on any render error. No recovery, no user feedback.

**Proposed fix:** Add a top-level `ErrorBoundary` component with a fallback UI ("Something went wrong" + retry button). Consider per-feature error boundaries for calendar/chores/weather sections.

### Gap 8: No error logging

**Problem:** No `console.error` or `console.warn` calls anywhere in production code. Errors are silently caught and reduced to strings.

**Impact:** Impossible to debug issues from browser console or error reporting tools.

**Proposed fix:** Log errors at the boundary (Error Boundary, global error handler). React Query's `onError` callback can log failed queries.

### Gap 9: No global error handler

**Problem:** No `window.onerror` or `window.addEventListener('unhandledrejection')` handler. Unhandled promise rejections (from chore mutations) are invisible.

**Impact:** Silent failures with no visibility.

**Proposed fix:** Add global error handler in `main.tsx` that logs unhandled errors. Consider integrating with an error reporting service in the future.

---

## Proposed Architecture

### Layer 1: `ApiError` class

```typescript
// src/shared/errors/ApiError.ts

/**
 * Structured API error carrying HTTP status and parsed response body.
 *
 * Preserves status code and backend error details so consumers can make
 * decisions: retry, show specific message, redirect on 401, etc.
 */
export class ApiError extends Error {
  /** Whether this error is worth retrying (server errors, network issues). */
  public readonly isRetryable: boolean

  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.isRetryable = status >= 500 || status === 429 || status === 0
  }
}
```

### Layer 2: Centralized error parsing

```typescript
// src/shared/errors/parseApiError.ts

/**
 * Parse a failed Response into a structured ApiError.
 *
 * Handles FastAPI's default error format ({ detail: "..." }) and
 * falls back to statusText. Always returns — never throws.
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let detail: string | undefined
  try {
    const body = await response.json()
    detail = body.detail ?? body.message
  } catch {
    // Response body is not JSON
  }

  return new ApiError(
    detail ?? response.statusText ?? 'Unknown error',
    response.status,
    detail,
  )
}
```

### Layer 3: React Query error handling (data fetching)

React Query's `useQuery` returns `error`, `isError`, `isPending`. The migration replaces `useApi` — each hook gets error handling for free:

```typescript
const { data, error, isError, isPending } = useQuery({
  queryKey: ['weather'],
  queryFn: async () => {
    const response = await fetch(ENDPOINTS.weather.url)
    if (!response.ok) throw await parseApiError(response)
    return response.json()
  },
})
```

React Query's retry logic (configured in `queryClient.ts`) already handles transient failures. `ApiError.isRetryable` can be used to customize retry behavior:

```typescript
retry: (failureCount, error) => {
  if (error instanceof ApiError && !error.isRetryable) return false
  return failureCount < 2
}
```

### Layer 4: Error Boundary (render crashes)

```typescript
// src/shared/components/ErrorBoundary.tsx
// Catches React rendering errors, shows fallback UI, prevents full app crash
```

Place at:
- **Top level:** Wraps entire app in `main.tsx`
- **Per-feature (optional):** Wraps calendar/chores/weather sections independently

### Layer 5: Mutation error handling

With React Query's `useMutation`:

```typescript
const mutation = useMutation({
  mutationFn: createChore,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chores'] }),
  onError: (error) => {
    console.error('Failed to create chore:', error)
    // Show toast notification
  },
})
```

### Layer 6: Global error handler

```typescript
// In main.tsx
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})
```

---

## Compatibility with React Query Migration

The React Query migration must be done in a way that makes the error handling work straightforward:

| Migration decision | Error handling compatibility |
|---|---|
| `queryFn` throws on `!response.ok` | ✅ Use `parseApiError` to throw structured `ApiError` |
| React Query `retry` option | ✅ Can check `ApiError.isRetryable` to skip non-retryable errors |
| React Query `error` state | ✅ Replaces `useApi`'s `error: string \| null` — consumers check `isError` + `error.message` |
| `placeholderData: keepPreviousData` | ✅ Shows stale data during errors — no skeleton flash |
| `useMutation` for chores | ✅ Provides `error` state for mutation failures |

**Key rule:** When migrating each hook in Phases 2-4, use `parseApiError` in the `queryFn` instead of `throw new Error('... API error: ${response.statusText}')`. This ensures structured errors from day one, even before the dedicated error handling session.

---

## Implementation Priority

| Priority | Item | Effort |
|----------|------|--------|
| **Now (during React Query migration)** | Use `parseApiError` in all `queryFn` functions | Small |
| **Now (during React Query migration)** | Add `ApiError` class | Small |
| **Now (during React Query migration)** | Add top-level Error Boundary | Small |
| **Later (dedicated session)** | Per-feature error UI (calendar views, weather, chores) | Medium |
| **Later (dedicated session)** | Toast notification system for mutations | Medium |
| **Later (dedicated session)** | Global error handler + logging | Small |
| **Later (dedicated session)** | `ApiError.isRetryable` integration with React Query retry | Small |

---

## Files to Create/Modify (Future Session)

| File | Action |
|------|--------|
| `src/shared/errors/ApiError.ts` | **New** — Custom error class |
| `src/shared/errors/parseApiError.ts` | **New** — Centralized error parser |
| `src/shared/errors/index.ts` | **New** — Barrel export |
| `src/shared/errors/ApiError.test.ts` | **New** — Tests |
| `src/shared/errors/parseApiError.test.ts` | **New** — Tests |
| `src/shared/components/ErrorBoundary.tsx` | **New** — Error boundary component |
| `src/shared/components/ErrorBoundary.test.tsx` | **New** — Tests |
| `src/main.tsx` | Add Error Boundary wrapper + global error handler |
| `src/features/calendar/views/*.tsx` | Add error state UI |
| `src/features/shell/Header.tsx` | Add weather error indicator |
| `src/features/chores/hooks/useChoreActions.ts` | Add mutation error handling |

---

## References

- React Query error handling: https://tanstack.com/query/v5/docs/react/guides/query-retries
- React Error Boundary: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- FastAPI error format: `{"detail": "..."}` (default) or `{"message": "..."}` (custom)
- Current `parseErrorResponse` (chores only): `src/features/chores/api/choresApi.ts`
- React Query migration plan: `docs/plans/REACT-QUERY-MIGRATION.md`
