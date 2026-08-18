---
name: mockup
description: Create a static HTML + Tailwind CDN mockup for design exploration before implementing in React. Follows the mockup-first workflow.
---

# Mockup-First Workflow

Dashy uses a mockup-first approach: build static HTML mockups for design exploration, get approval, then implement as React components.

## When to Use

- New UI feature or page
- Redesigning an existing component's layout
- Exploring responsive behavior (landscape vs portrait)
- Testing visual ideas before committing to React structure

## When NOT to Use

- Bug fixes to existing components
- Backend-only changes
- Refactoring without visual changes
- Small tweaks that are obvious in code

## Steps

### 1. Create the mockup file

Location: `mockups/<feature-name>.html`

Use this template:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashy — [Feature Name]</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Custom styles that Tailwind CDN can't handle */
    </style>
</head>
<body class="bg-gray-900 text-white">
    <!-- Mockup content here -->
</body>
</html>
```

### 2. Use hardcoded mock data

Do NOT connect to any API. Use inline data that represents realistic content:
- Family member names: Faiyaz, Trisha, Arya, Raya
- Sample calendar events with times, titles, locations
- Weather data with realistic values
- Use the family color scheme: Faiyaz=#4A90E2 (blue), Trisha=#E24A8D (pink), Arya=#4ADE80 (green), Raya=#FBBF24 (yellow)

### 3. Consider both orientations

Dashy runs on a Pi that can be mounted landscape (1920x1080) or portrait (1080x1920). If the feature is orientation-sensitive, create two mockup files:
- `mockups/<feature>.html` (landscape)
- `mockups/<feature>-portrait.html` (portrait)

Or use CSS media queries within a single file:
```css
@media (orientation: portrait) { /* portrait layout */ }
@media (orientation: landscape) { /* landscape layout */ }
```

### 4. Present for review

Open the mockup in a browser and present to the user. Wait for approval before implementing.

### 5. After approval — implement in React

Once the design is approved, translate the mockup into React components following project conventions:
- Component folder: `src/components/ComponentName/`
- Inline styles from theme tokens (`src/theme/tokens.ts`)
- No Tailwind utility classes in React components (Tailwind CDN is mockup-only)
- SVG icons only, no emojis

## Existing Mockups

The `mockups/` directory already contains mockups for reference:
- `dashboard.html` / `dashboard-portrait.html` — main layout
- `day-view.html`, `week-view.html`, `month-view.html`, `year-view.html` — calendar views
- `weather-icons-mockup.html`, `weather-tooltip.html` — weather features
- `view-switcher.html`, `upcoming-events.html` — UI components
- `indicators-inline.html`, `indicators-statusbar.html` — density indicators

## Key Design Constraints

- **Full viewport layout** — fills the visible window on any display, no page-level scrollbars
- **Dark theme** — background is dark (gray-900 or similar), text is light
- **No emojis** — use SVG icons throughout
- **Family color coding** — events and indicators use member colors
- **Fluid scaling** — design for 1920px base width, scales via CSS zoom
