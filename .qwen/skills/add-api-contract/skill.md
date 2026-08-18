---
name: add-api-contract
description: Wire a new backend API endpoint into the frontend — add response types, endpoint config, fetch function, and consume via useApi hook.
---

# Add API Contract

Wire a new backend API endpoint into the Dashy frontend. This is the frontend counterpart to the backend's `add-api-endpoint` skill.

## When to use

- Backend team added a new API endpoint and the frontend needs to consume it
- Adding a new data source (tasks, notifications, settings, etc.)
- Replacing a hardcoded/mock data flow with a real API call

## Prerequisites

- The backend endpoint exists and returns a known JSON shape
- You know the endpoint URL, HTTP method, and expected refresh interval
- Review the existing patterns in `shared/api/endpoints.ts` and `shared/services/api.ts`

## Files to update

| File | Purpose |
|------|---------|
| `domain/<domain>/types.ts` | Add response type (if new data shape) |
| `shared/api/endpoints.ts` | Add endpoint to ENDPOINTS registry |
| `shared/services/api.ts` | Add fetch function |
| `types/index.ts` | Re-export new types if needed |
| Component file | Consume via `useApi` hook |

## Steps

### 1. Add response type to domain types

If the endpoint returns a new data shape, define the TypeScript types in the appropriate domain directory:

```typescript
// domain/tasks/types.ts

/**
 * A single task from the task service.
 */
export interface Task {
  /** Unique task identifier. */
  id: string
  /** Task title. */
  title: string
  /** Whether the task is completed. */
  completed: boolean
  /** ISO timestamp of when the task was created. */
  created_at: string
  /** Optional due date in ISO format. */
  due_date?: string
  /** Member keys assigned to this task. */
  assignees: string[]
}

/**
 * Response from the tasks API endpoint.
 */
export interface TaskResponse {
  /** List of tasks. */
  tasks: Task[]
  /** Total count (for pagination). */
  total: number
}
```

Keep types in sync with the backend Pydantic models — field names and types must match exactly.

### 2. Re-export from the types barrel

Add the new types to `types/index.ts` so components can import from `@/types`:

```typescript
// types/index.ts

// Tasks domain types
export type { Task, TaskResponse } from '@/domain/tasks/types'
```

### 3. Add endpoint to the ENDPOINTS registry

Add the endpoint configuration to `shared/api/endpoints.ts`:

```typescript
// shared/api/endpoints.ts

export const ENDPOINTS = {
  health: {
    url: '/health',
    method: 'GET',
    refreshInterval: 0,
    cacheTtl: 0,
  },
  calendar: {
    url: '/api/v1/calendar',
    method: 'GET',
    refreshInterval: 120_000, // 2 minutes
    cacheTtl: 120_000, // 2 minutes
  },
  weather: {
    url: '/api/v1/weather',
    method: 'GET',
    refreshInterval: 600_000, // 10 minutes
    cacheTtl: 0, // No client-side caching (backend handles it)
  },
  family: {
    url: '/api/v1/family',
    method: 'GET',
    refreshInterval: 0, // Fetch once on mount
    cacheTtl: 0,
  },
  // New endpoint
  tasks: {
    url: '/api/v1/tasks',
    method: 'GET',
    refreshInterval: 120_000, // 2 minutes
    cacheTtl: 0, // No client-side caching
  },
} as const satisfies Record<string, EndpointConfig>
```

**Refresh interval guidelines:**

| Data type | Refresh interval | Rationale |
|-----------|-----------------|-----------|
| Health | 0 (no auto-refresh) | On-demand only |
| Calendar | 120_000 (2 min) | Events change infrequently |
| Weather | 600_000 (10 min) | Weather updates slowly |
| Family | 0 (fetch once) | Rarely changes |
| Tasks | 120_000 (2 min) | Moderate update frequency |

Align `refreshInterval` with the backend's cache TTL — no point polling faster than the backend refreshes.

### 4. Add fetch function to the API service

Add a typed fetch function to `shared/services/api.ts`:

```typescript
// shared/services/api.ts

import type { TaskResponse } from '@/types'

/**
 * Fetch tasks.
 *
 * @returns Task response with list and total count.
 */
export async function getTasks(): Promise<TaskResponse> {
  return fetchWithRetry<TaskResponse>(`${API_BASE}${ENDPOINTS.tasks.url}`)
}
```

All fetch functions use `fetchWithRetry` for resilience (exponential backoff: 2s, 4s, 8s, 16s, up to 5 retries).

**For endpoints with query parameters:**

```typescript
/**
 * Fetch tasks filtered by completion status.
 *
 * @param completed - Optional filter for completed/incomplete tasks.
 * @returns Task response with list and total count.
 */
export async function getTasks(completed?: boolean): Promise<TaskResponse> {
  const params = new URLSearchParams()
  if (completed !== undefined) {
    params.set('completed', String(completed))
  }
  const query = params.toString()
  const url = query
    ? `${API_BASE}${ENDPOINTS.tasks.url}?${query}`
    : `${API_BASE}${ENDPOINTS.tasks.url}`
  return fetchWithRetry<TaskResponse>(url)
}
```

### 5. Consume in a component using the useApi hook

Use the `useApi` hook for automatic data fetching and refresh:

```typescript
import { useApi } from '@/shared/hooks/useApi'
import { getTasks } from '@/shared/services/api'
import { ENDPOINTS } from '@/shared/api/endpoints'

function TaskList() {
  const { data, loading, error, refetch } = useApi(getTasks, {
    refetchInterval: ENDPOINTS.tasks.refreshInterval,
  })

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorBanner message={error} onRetry={refetch} />

  return (
    <ul>
      {data?.tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  )
}
```

**useApi hook signature:**

```typescript
function useApi<T>(
  fetchFn: () => Promise<T>,
  options?: UseApiOptions,
): UseApiResult<T>

interface UseApiOptions {
  /** Auto-refresh interval in ms (0 = no auto-refresh). */
  refetchInterval?: number
  /** Retry interval when in error state (default: 10000ms). */
  errorRetryInterval?: number
}

interface UseApiResult<T> {
  /** Fetched data, or null before first successful fetch. */
  data: T | null
  /** True while the initial fetch is in progress. */
  loading: boolean
  /** Error message string, or null if no error. */
  error: string | null
  /** Manually trigger a refetch. */
  refetch: () => void
  /** Timestamp (Date.now()) of the last successful fetch. */
  lastRefresh: number | null
}
```

### 6. Add tests

Test the fetch function in `shared/services/api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTasks } from './api'

describe('getTasks', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns task data on success', async () => {
    const mockResponse = {
      tasks: [{ id: '1', title: 'Buy milk', completed: false, created_at: '2026-08-04T10:00:00', assignees: [] }],
      total: 1,
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await getTasks()
    expect(result.tasks).toHaveLength(1)
    expect(result.tasks[0].title).toBe('Buy milk')
  })

  it('throws after max retries on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    await expect(getTasks()).rejects.toThrow('Network error')
  }, 60000)
})
```

### 7. Run quality gate

```bash
make lint
make typecheck
make test
make build
```

All four must pass before declaring the task complete.

## Checklist

- [ ] Added response type to `domain/<domain>/types.ts` (if new data shape)
- [ ] Re-exported types from `types/index.ts`
- [ ] Added endpoint to ENDPOINTS registry in `shared/api/endpoints.ts`
- [ ] Set appropriate `refreshInterval` (aligned with backend cache TTL)
- [ ] Added fetch function to `shared/services/api.ts` using `fetchWithRetry`
- [ ] Added TSDoc on the fetch function
- [ ] Consumed endpoint in component via `useApi` hook
- [ ] Handled loading, error, and data states in the component
- [ ] Added tests for the fetch function
- [ ] `make lint` passes
- [ ] `make typecheck` passes
- [ ] `make test` passes
- [ ] `make build` passes

## Example: Adding a "notifications" endpoint

Scenario: Backend added `GET /api/v1/notifications` returning `{ notifications: Notification[], unread_count: number }`.

1. **Define types** in `domain/notifications/types.ts`:
   ```typescript
   export interface Notification {
     id: string
     title: string
     message: string
     read: boolean
     created_at: string
   }

   export interface NotificationResponse {
     notifications: Notification[]
     unread_count: number
   }
   ```

2. **Re-export** from `types/index.ts`:
   ```typescript
   export type { Notification, NotificationResponse } from '@/domain/notifications/types'
   ```

3. **Add endpoint** to `shared/api/endpoints.ts`:
   ```typescript
   notifications: {
     url: '/api/v1/notifications',
     method: 'GET',
     refreshInterval: 60_000, // 1 minute
     cacheTtl: 0,
   },
   ```

4. **Add fetch function** to `shared/services/api.ts`:
   ```typescript
   export async function getNotifications(): Promise<NotificationResponse> {
     return fetchWithRetry<NotificationResponse>(`${API_BASE}${ENDPOINTS.notifications.url}`)
   }
   ```

5. **Consume** in component:
   ```typescript
   const { data, loading, error } = useApi(getNotifications, {
     refetchInterval: ENDPOINTS.notifications.refreshInterval,
   })
   ```

6. **Test** and run quality gate.

## Notes

- Always use `fetchWithRetry` — never raw `fetch` — for API calls that should be resilient
- The `ENDPOINTS` registry uses `as const satisfies Record<string, EndpointConfig>` for type safety
- `refreshInterval: 0` means "fetch once on mount, no auto-refresh" — use for static data like family members
- Client-side `cacheTtl` is separate from backend caching — only the calendar endpoint uses it currently
- If the backend returns an error shape, handle it in the fetch function or let `useApi` surface it via the `error` field
- Keep response types in sync with backend Pydantic models — field names must match exactly (snake_case in both)
