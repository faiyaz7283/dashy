---
name: add-feature
description: Scaffold a complete new feature module following Dashy's architecture — directory structure, components, hooks, views, barrel exports, and integration with AppShell.
---

# Add Feature

Scaffold a complete new feature module following Dashy's feature-based architecture.

## When to use

- Adding a completely new feature area (e.g., tasks, notes, reminders)
- Not for adding components to existing features — use `/add-component` instead
- Not for adding domain logic — use `/add-domain-utility` instead

## Prerequisites

- Clear understanding of the feature's purpose and scope
- Identified components, hooks, and views needed
- Know how the feature integrates with existing features (if at all)

## Steps

### 1. Create feature directory structure

```
src/features/<featureName>/
├── components/
│   └── <ComponentName>/
│       ├── <ComponentName>.tsx
│       ├── <ComponentName>.test.tsx
│       └── index.ts
├── views/                    # If feature has multiple view variants
│   └── <ViewName>/
│       ├── <ViewName>.tsx
│       ├── <ViewName>.test.tsx
│       └── index.ts
├── hooks/
│   └── use<FeatureHook>.ts
│   └── use<FeatureHook>.test.ts
└── index.ts                  # Feature barrel export
```

**Directory naming:**
- Feature directory: `camelCase` (e.g., `calendar`, `weather`, `tasks`)
- Component directories: `PascalCase` (e.g., `TaskItem`, `TaskList`)
- View directories: `PascalCase` (e.g., `DayView`, `ListView`)
- Hook files: `camelCase` (e.g., `useTasks.ts`)

### 2. Create feature barrel export

```typescript
// src/features/<featureName>/index.ts
/**
 * <FeatureName> feature module.
 *
 * Brief description of the feature's purpose.
 */

// Components
export { ComponentA } from './components/ComponentA'
export { ComponentB } from './components/ComponentB'

// Views
export { ViewA } from './views/ViewA'

// Hooks
export { useFeatureHook } from './hooks/useFeatureHook'
```

**Rules:**
- Export public API only (components, views, hooks that other features use)
- Internal helpers stay unexported
- Consumers import from `@/features/<featureName>`

### 3. Create domain types (if needed)

If the feature has domain-specific types, add them to `src/domain/<featureName>/`:

```
src/domain/<featureName>/
├── types.ts
└── utils.ts
```

See `/add-domain-utility` for detailed workflow.

### 4. Create initial components

Use `/add-component` skill for each component. Example structure:

```typescript
// src/features/tasks/components/TaskItem/TaskItem.tsx
/**
 * TaskItem — displays a single task with checkbox and title.
 */

import { colors, spacing, radii } from '@/theme/tokens'

interface TaskItemProps {
  /** Task title. */
  title: string
  /** Whether task is completed. */
  completed?: boolean
  /** Callback when toggled. */
  onToggle?: (completed: boolean) => void
}

export function TaskItem({ title, completed = false, onToggle }: TaskItemProps) {
  // Implementation
}
```

### 5. Create hooks (if needed)

Use `/add-hook` skill for each hook. Example:

```typescript
// src/features/tasks/hooks/useTasks.ts
/**
 * useTasks — manages task list state and persistence.
 */

import { useState } from 'react'
import type { Task } from '@/domain/tasks/types'

interface UseTasksReturn {
  tasks: Task[]
  addTask: (task: Task) => void
  toggleTask: (id: string) => void
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([])

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task])
  }

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    )
  }

  return { tasks, addTask, toggleTask }
}
```

### 6. Create views (if needed)

Views are top-level page-like components that compose other components:

```typescript
// src/features/tasks/views/TaskListView/TaskListView.tsx
/**
 * TaskListView — main view for displaying and managing tasks.
 *
 * Composes TaskList, TaskItem, and filtering controls.
 */

import { useState } from 'react'
import { TaskItem } from '@/features/tasks/components/TaskItem'
import { useTasks } from '@/features/tasks/hooks/useTasks'
import { colors, spacing } from '@/theme/tokens'

export function TaskListView() {
  const { tasks, toggleTask } = useTasks()

  const viewStyle: React.CSSProperties = {
    padding: `${spacing.xl}px`,
    background: colors.bg,
  }

  return (
    <div style={viewStyle}>
      <h1>Tasks</h1>
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          title={task.title}
          completed={task.completed}
          onToggle={(completed) => toggleTask(task.id)}
        />
      ))}
    </div>
  )
}
```

### 7. Wire into AppShell (if needed)

If the feature needs to be accessible from the main app, integrate it into `AppShell`:

```typescript
// src/features/dashboard/AppShell/AppShell.tsx
import { TaskListView } from '@/features/tasks'

export function AppShell() {
  // ... existing code

  const renderView = () => {
    switch (currentView) {
      case 'day':
        return <DayView />
      case 'week':
        return <WeekGrid />
      case 'month':
        return <MonthView />
      case 'year':
        return <YearView />
      case 'tasks':  // New feature
        return <TaskListView />
    }
  }

  return (
    <div>
      {/* ... existing layout */}
      <main>{renderView()}</main>
    </div>
  )
}
```

### 8. Add navigation (if needed)

If the feature needs navigation, update `src/shared/config/navigation.ts`:

```typescript
// src/shared/config/navigation.ts
export const NAV_ITEMS = [
  { icon: CalendarIcon, label: 'Calendar', view: 'calendar' },
  { icon: WeatherIcon, label: 'Weather', view: 'weather' },
  { icon: TaskIcon, label: 'Tasks', view: 'tasks' },  // New
]
```

### 9. Run quality gate

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Checklist

- [ ] Feature directory created with proper structure
- [ ] Feature barrel export (`index.ts`) created
- [ ] Domain types added (if needed)
- [ ] Components created with TSDoc and tests
- [ ] Hooks created with TSDoc and tests
- [ ] Views created (if needed)
- [ ] Wired into AppShell (if needed)
- [ ] Navigation updated (if needed)
- [ ] Quality gate passes

## Example: Adding a "tasks" feature

**Directory structure:**
```
src/features/tasks/
├── components/
│   ├── TaskItem/
│   │   ├── TaskItem.tsx
│   │   ├── TaskItem.test.tsx
│   │   └── index.ts
│   └── TaskList/
│       ├── TaskList.tsx
│       ├── TaskList.test.tsx
│       └── index.ts
├── views/
│   └── TaskListView/
│       ├── TaskListView.tsx
│       ├── TaskListView.test.tsx
│       └── index.ts
├── hooks/
│   ├── useTasks.ts
│   └── useTasks.test.ts
└── index.ts
```

**Domain types:**
```typescript
// src/domain/tasks/types.ts
export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
}
```

**Feature barrel export:**
```typescript
// src/features/tasks/index.ts
export { TaskItem } from './components/TaskItem'
export { TaskList } from './components/TaskList'
export { TaskListView } from './views/TaskListView'
export { useTasks } from './hooks/useTasks'
```

## Notes

- **Feature directory**: `camelCase` (e.g., `tasks`, `notes`)
- **Component directories**: `PascalCase` (e.g., `TaskItem`)
- **Barrel exports**: Export public API only
- **Views vs components**: Views are page-level, components are building blocks
- **Integration**: Wire into AppShell and navigation as needed
- **Domain types**: Add to `src/domain/<featureName>/` if feature has domain logic
