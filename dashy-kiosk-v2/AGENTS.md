# Agent Rules — Dashy Kiosk v2

This file is read by all AI coding agents (Kimi Code, Claude Code, Qwen Code, Warp, etc.).
It contains **hard behavior rules**, not project background. For project knowledge, hardware details, architecture, and deployment history, see `README.md`.

**Detailed guides:**
- [Styling Guide](docs/guides/styling.md) — Tailwind rules, hardcoded values, common patterns
- [Workflow Guide](docs/guides/workflow.md) — Pre-implementation checklist, self-review, code review gate

## 0. NO OLD CODE RULE (NON-NEGOTIABLE)

**This is a ground-up rewrite. The old kiosk (`../dashy-kiosk/`) exists only as a running reference at `dashy.local`.**

- **Never** read, copy, or import from `../dashy-kiosk/src/`
- **Never** reference old component paths, old type definitions, or old utility functions
- **Never** replicate old styling patterns (inline styles, `const styles` objects, CSS Modules)
- **Never** use old dependency versions — all deps must be latest stable
- If you need API contracts, type shapes, or business logic rules, **ask the user** — do not look them up in old code
- All components are built **from approved mockups only**
- The old kiosk's tests, logic, and patterns inform *what* to build, not *how* to build it

## 1. Frontend Tech Stack (Latest Stable)

All dependencies pinned to latest stable versions. Verify before upgrading.

| Package | Version | Purpose |
|---------|---------|---------|
| **tailwindcss** | ^4.3.3 | Utility-first CSS framework |
| **@tailwindcss/vite** | ^4.3.3 | Vite plugin for Tailwind v4 |
| **@headlessui/react** | ^2.2.10 | Unstyled accessible UI primitives |
| **react** | ^19.2.8 | UI library |
| **react-dom** | ^19.2.8 | React DOM renderer |
| **lucide-react** | ^1.33.0 | SVG icon library |
| **vite** | ^8.2.1 | Build tool and dev server |
| **typescript** | ^7.0.2 | Type system |
| **vitest** | ^4.1.11 | Test runner |
| **oxlint** | ^1.79.0 | Linter (replaces ESLint + typescript-eslint) |
| **oxfmt** | ^0.64.0 | Formatter (replaces Prettier) |
| **pnpm** | 11.22.0 | Package manager |

**Mockup CDN:** Use `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` (v4). Do NOT use `https://cdn.tailwindcss.com` (serves v3).

## 2. pnpm Only (NON-NEGOTIABLE)

Use **pnpm** as the sole package manager. Never use npm, yarn, or any other package manager. All pnpm commands run inside Docker containers via the orchestrator's Makefile targets.

## 3. Docker-first development (NON-NEGOTIABLE)

**Never run development tools directly on the host machine.** All commands must run inside Docker containers via the orchestrator's Makefile targets.

### Forbidden on the host

Never run these directly on the local machine:

- `pnpm`, `npm`, `yarn`, `node`, `npx`
- `tsc`, `oxlint`, `oxfmt`, `vitest`

### Approved commands

Use the orchestrator's `make` targets (from the `dashy/` directory):

| Task | Command |
|------|---------|
| Install deps | `make install-kiosk-v2` |
| Add package | `make add-kiosk-v2 PACKAGE=<name>` |
| Add dev package | `make add-kiosk-v2-dev PACKAGE=<name>` |
| Remove package | `make remove-kiosk-v2 PACKAGE=<name>` |
| Lint | `make lint-kiosk-v2` |
| Format | `make format-kiosk-v2` |
| Type check | `make typecheck-kiosk-v2` |
| Run tests | `make test-kiosk-v2` |
| Build | `make build-kiosk-v2` |

If a command you want is missing from the orchestrator's Makefile, add a target there — do not bypass Docker.

## 3a. Pre-Implementation Checklist (NON-NEGOTIABLE)

**Before writing ANY implementation code, you MUST invoke the `/pre-implementation-checklist` skill.** This is not optional — it's a mandatory workflow step.

The skill will guide you through:
- AGENTS.md compliance check
- Duplication detection (search for existing components/hooks)
- Prop drilling check (3+ levels → use Context API)
- Hardcoded values check (use tokens, not magic numbers)
- Testing requirements

**Why this is mandatory:** We've had multiple incidents where code was written with violations despite having rules documented. This skill forces you to check before coding, not after.

## 4. Verify before declaring done

### 4a. Self-Review (NON-NEGOTIABLE)

**Before presenting code to the user, you MUST invoke the `/self-review` skill.** This is your responsibility — do not wait for the user to catch violations.

The skill will guide you through:
- Re-reading relevant AGENTS.md sections
- Searching for duplicated logic across views
- Verifying no prop drilling
- Verifying no hardcoded values
- Verifying shared components/hooks are used
- Verifying tests exist

**If violations are found:** Fix them before presenting the code. Do not present code with known violations.

### 4b. Code Review Gate (Before Quality Gates)

**Before running automated quality gates, you MUST invoke the `/code-review-gate` skill.** This performs a manual code review that catches issues automated tools miss.

The skill will guide you through:
- Pattern violation checks (duplicated logic, prop drilling, hardcoded values)
- Code quality checks (shared components/hooks, magic numbers, DRY principle)
- Component structure review

**If violations are found:** Fix them before proceeding to quality gates.

### 4c. Quality Gates (NON-NEGOTIABLE)

**After completing the code review gate, you MUST invoke the `/quality-gate` skill.** This runs the automated quality checks.

The skill will run:
1. `make lint-kiosk-v2` (oxlint)
2. `make typecheck-kiosk-v2` (tsc --noEmit)
3. `make test-kiosk-v2` (vitest)
4. `make build-kiosk-v2` (vite build)

All four must pass before you tell the user the task is complete.

## 5. Git workflow

- Work on the `development` branch. `main` is for stable releases.
- Do not run `git commit`, `git push`, `git reset`, `git rebase`, or other git mutations unless the user explicitly asks.
- Ask for confirmation before each git mutation, even if confirmed earlier in the conversation.
- Keep commits atomic and write messages that describe "why," not just "what."
- Include `Co-Authored-By: Qwen <noreply@qwen.ai>` in AI-assisted commits.

## 6. Frontend code standards

- **TypeScript required** — all new components must be `.tsx`. Avoid `any`; if unavoidable, add a comment explaining why.
- **One component per folder** — each component lives in its own folder under `src/features/` with `Component.tsx`, `Component.test.tsx`, and `index.ts` barrel export.
- **Every new component/hook needs tests** — at minimum a render test. Add tests as you build.
- **Reusable logic goes in `src/shared/hooks/`** — not inside components.
- **Shared types go in `src/types/`**.
- **No emojis in source or UI** — use SVG icons.

## 7. Styling — Tailwind Only (NON-NEGOTIABLE)

**Tailwind utility classes only.** No inline `style="..."` with `var(--dt-*)`. No `const styles` objects. No CSS Modules. No styled-components.

See [Styling Guide](docs/guides/styling.md#tailwind-only-non-negotiable) for detailed rules and examples.

**Quick reference:**
- All layout, spacing, colors, typography use Tailwind utility classes
- Design tokens consumed via `@theme` block in `src/index.css`
- Dark mode: use Tailwind's `dark:` variant
- Mockups must also use Tailwind classes

## 7b. Mockups Are Living References (NON-NEGOTIABLE)

Approved mockup files in `mockups/` are **living design references** — they always reflect the current approved visual design.

- When modifying a component's visual style in React, **update the corresponding mockup to match**
- Mockups are the source of truth for approved visual design
- File naming: `mockups/<component-name>.html`

## 7c. No Hardcoded Values — Ask Before Hardcoding (NON-NEGOTIABLE)

**Hardcoding is a code smell. Never hardcode values without explicit user approval.**

See [Styling Guide](docs/guides/styling.md#no-hardcoded-values--ask-before-hardcoding-non-negotiable) for detailed rules and examples.

**Quick reference:**
- Shell dimensions use CSS custom properties (`--shell-header-height`, etc.)
- Colors use design tokens (`bg-primary`, `text-text-muted`, etc.)
- If you're about to write a magic number or pixel value — **stop and ask**

## 7d. Common Patterns — When to Extract (NON-NEGOTIABLE)

**When to extract shared components, hooks, and when to use Context API.**

See [Styling Guide](docs/guides/styling.md#common-patterns--when-to-extract-non-negotiable) for detailed rules and examples.

**Quick reference:**
- Same markup in 2+ views → Extract to shared component
- Same logic in 2+ components → Extract to shared hook
- Props passed through 3+ levels → Use Context API

## 8. Architecture & design principles

- **Configurable, not hardcoded** — family members, colors, API keys, and similar data come from `.env` or config files.
- **Frontend-first for UI work** — build the UI with mock data, define the API contract, then build the backend to match.
- **Fluid full-viewport layout** — every feature must fill the visible window on any display. No page-level scrollbars, no hardcoded viewport assumptions, no `vw`/`clamp` sizing in components. See `README.md` for the detailed scaling model.
- **Floating layers** — popups/modals portal to `document.body` and apply the `useUiScale` factor to their content wrapper only.
- **Latest stable versions** — do not pin to old versions without a documented compatibility reason.

## 9. Code style

- Match the existing file's style, naming, and comment density.
- Minimal changes. No opportunistic refactors.
- Oxlint + Oxfmt enforced via `make lint` / `make format`.
- No `console.log` except `console.warn`/`console.error`.

## 10. Universal coding standards

These standards apply to **all code** in the project. Every agent must follow them.

### Documentation

- **Every** public module, function, component, hook, and type must have proper documentation
- **TypeScript frontend:** JSDoc comments on exported functions, components, hooks, and types
- Private helpers get documentation when the logic is non-obvious
- Documentation is for humans — write it to be read, not to satisfy a linter

### Readable code

- Code is read far more often than it is written — optimize for readability
- Descriptive names over comments — if you need a comment to explain what code does, rename it
- Small, focused functions — one job per function
- No magic numbers or strings — use named constants
- Consistent patterns within a file and across the project

### Naming conventions

**TypeScript (frontend):**
- Files (components): `PascalCase.tsx` (e.g., `WeatherCard.tsx`)
- Files (hooks/utils): `camelCase.ts` (e.g., `useWeather.ts`)
- Components: `PascalCase` (e.g., `WeatherCard`)
- Functions/variables: `camelCase` (e.g., `getWeather()`)
- Types/interfaces: `PascalCase` (e.g., `WeatherResponse`)
- Constants: `UPPER_SNAKE_CASE` or `camelCase` (e.g., `MAX_RETRIES` or `apiUrl`)
- Directories: `camelCase/` or `kebab-case/` (e.g., `components/`, `hooks/`)

### Enforcement

- Linters and formatters enforce these automatically — `make lint` must pass
- Code review (human or agent) catches what linters miss
- All new code must comply; existing code upgraded during migration phases

## 11. Testing

- **Three-tier testing strategy:**
  1. **Unit tests** — domain logic, pure functions (fast, deterministic)
  2. **Component tests** — React Testing Library for component rendering and interaction
  3. **Integration tests** — full feature flows with mocked API
- **vitest** for test runner, **@testing-library/react** for component tests
- Tests live alongside components: `Component.test.tsx`
- All new features need tests before declaring done

## 12. When in doubt

If you are about to run a command and are unsure whether it violates the pnpm-only rule or the no-old-code rule, stop and ask the user. It is better to confirm than to introduce the wrong pattern.
