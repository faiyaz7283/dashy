# Mockup to React Translation Patterns

This document defines how mockup patterns translate to React implementation. All agents must follow these patterns when converting approved mockups to code.

## Core Principle

Mockups use vanilla JavaScript for rapid prototyping. Implementation uses React + HeadlessUI + Tailwind with reusable hooks. **Never copy mockup JS directly** — translate to the patterns below.

---

## Auto-Hide Behavior

### Mockup Pattern
```javascript
// Vanilla JS in mockup
document.addEventListener('mousemove', (e) => {
  if (e.clientY < threshold) showHeader();
});
setTimeout(() => hideHeader(), 3000);
```

### React Implementation
```tsx
// Custom hook: src/shared/hooks/useAutoHide.ts
export function useAutoHide(edge: 'top' | 'left' | 'bottom', threshold: number = 15) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nearEdge = isNearEdge(e, edge, threshold);
      if (nearEdge || isHovering) {
        setIsVisible(true);
      } else {
        const timeout = setTimeout(() => setIsVisible(false), 3000);
        return () => clearTimeout(timeout);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [edge, threshold, isHovering]);

  return { isVisible, bindHover: { onMouseEnter: () => setIsHovering(true), onMouseLeave: () => setIsHovering(false) } };
}
```

### Usage
```tsx
const { isVisible, bindHover } = useAutoHide('top');

<header className={`transition-all duration-400 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`} {...bindHover}>
  ...
</header>
```

---

## Theme Toggle

### Mockup Pattern
```javascript
// Vanilla JS in mockup
function toggleTheme() {
  const themes = ['auto', 'light', 'dark'];
  currentTheme = themes[(currentIndex + 1) % themes.length];
  document.documentElement.classList.toggle('dark');
}
```

### React Implementation
```tsx
// Custom hook: src/shared/hooks/useTheme.ts
type Theme = 'light' | 'dark' | 'auto';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('auto');

  const toggleTheme = () => {
    const themes: Theme[] = ['auto', 'light', 'dark'];
    const next = themes[(themes.indexOf(theme) + 1) % themes.length];
    setTheme(next);
  };

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
    } else if (theme === 'light') {
      html.classList.remove('dark');
    } else {
      // Auto: respect system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }, [theme]);

  return { theme, toggleTheme };
}
```

### Usage
```tsx
const { theme, toggleTheme } = useTheme();

<button onClick={toggleTheme}>
  {theme === 'light' && <SunIcon />}
  {theme === 'dark' && <MoonIcon />}
  {theme === 'auto' && <AutoIcon />}
</button>
```

---

## Sidebar State

### Mockup Pattern
```javascript
// Vanilla JS in mockup
let sidebarExpanded = false;
function toggleSidebar() {
  sidebarExpanded = !sidebarExpanded;
  sidebar.classList.toggle('w-56');
}
```

### React Implementation
```tsx
// Custom hook: src/shared/hooks/useSidebarState.ts
export function useSidebarState() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggle = () => setIsExpanded(!isExpanded);

  return {
    isExpanded,
    toggle,
    width: isExpanded ? 'w-56' : 'w-16',
  };
}
```

### Usage
```tsx
const { isExpanded, toggle, width } = useSidebarState();

<aside className={`${width} transition-all duration-400`}>
  <button onClick={toggle}>
    <ChevronIcon className={isExpanded ? 'rotate-180' : ''} />
  </button>
</aside>
```

---

## HeadlessUI Component Mapping

| Mockup Element | HeadlessUI Component | Tailwind Classes |
|----------------|---------------------|------------------|
| Dropdown menu | `Menu` | `absolute z-50 bg-white border border-border rounded-lg shadow-lg` |
| Modal dialog | `Dialog` | `fixed inset-0 z-50 flex items-center justify-center` |
| Popover (date picker) | `Popover` | `absolute z-50 bg-white border border-border rounded-lg shadow-lg` |
| Tab group (view switcher) | `Tab.Group` | `flex bg-bg-hover rounded-lg p-1` |
| Toggle (theme) | `Switch` | `relative inline-flex h-6 w-11 items-center rounded-full` |

---

## Transition Patterns

### Mockup Pattern
```javascript
// CSS in mockup
.auto-hide {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.hidden-top {
  opacity: 0;
  transform: translateY(-100%);
}
```

### React Implementation
```tsx
// Use Tailwind transition utilities + HeadlessUI Transition
import { Transition } from '@headlessui/react'

<Transition
  show={isVisible}
  enter="transition-all duration-400 ease-out"
  enterFrom="opacity-0 -translate-y-full"
  enterTo="opacity-100 translate-y-0"
  leave="transition-all duration-400 ease-in"
  leaveFrom="opacity-100 translate-y-0"
  leaveTo="opacity-0 -translate-y-full"
>
  <header>...</header>
</Transition>
```

---

## Fixed Heights

### Mockup Pattern
```html
<header class="h-16">...</header>
<footer class="h-12">...</footer>
```

### React Implementation
```tsx
// Use Tailwind fixed heights (same as mockup)
// Heights are absolute pixels, scaled via useUiScale at root level
<header className="h-16">...</header>
<footer className="h-12">...</footer>
```

**Note:** Fixed pixel heights are intentional. The `useUiScale` hook applies CSS `zoom` at the app root, which scales all elements uniformly. This maintains proportional appearance across resolutions without needing responsive breakpoints for every element.

---

## Scaling Strategy

**Decision:** Use `useUiScale` hook (not Tailwind responsive breakpoints).

**Why:**
- Uniform scaling across all elements (header, sidebar, content, modals)
- Single source of truth (root-level `zoom`)
- No need to manage breakpoints for every component
- Matches current Dashy behavior

**Implementation:**
```tsx
// src/features/kiosk/hooks/useUiScale.ts
export function useUiScale(): number {
  const [scale, setScale] = useState(() => Math.max(1, window.innerWidth / 1920));

  useEffect(() => {
    const onResize = () => setScale(Math.max(1, window.innerWidth / 1920));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return scale;
}

// src/App.tsx
const uiScale = useUiScale();

<div style={{ zoom: uiScale }} className="h-screen w-screen overflow-hidden">
  ...
</div>
```

**Design width:** 1920px (matches current Dashy)

---

## Checklist for Agents

When converting mockups to React:

- [ ] Replace vanilla JS event listeners with custom hooks
- [ ] Replace `classList.toggle` with Tailwind state-driven classes
- [ ] Replace `setTimeout` with `useEffect` cleanup
- [ ] Replace inline `onclick` with React event handlers
- [ ] Use HeadlessUI components for dropdowns, modals, popovers
- [ ] Use HeadlessUI `Transition` for show/hide animations
- [ ] Apply `useUiScale` at app root (not per-component)
- [ ] Keep fixed heights from mockup (scaled via root zoom)
- [ ] Add TSDoc to all new hooks and components
- [ ] Add tests for all new hooks

---

## References

- [Mockup Plan](./mockup-plan.md)
- [AGENTS.md](../AGENTS.md)
- [HeadlessUI Docs](https://headlessui.com)
- [Tailwind Docs](https://tailwindcss.com/docs)
