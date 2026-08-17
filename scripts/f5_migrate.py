#!/usr/bin/env python3
"""F5 migration: move files to feature-based structure and update imports."""

import os
import re
import subprocess

SRC = "/Users/admin/dashy/frontend/src"

# ── Phase 1: Move files ─────────────────────────────────────────────
# (old_path_relative_to_src, new_path_relative_to_src)
MOVES = [
    # Calendar views
    ("components/DayView", "features/calendar/views/DayView"),
    ("components/WeekGrid", "features/calendar/views/WeekGrid"),
    ("components/MonthView", "features/calendar/views/MonthView"),
    ("components/YearView", "features/calendar/views/YearView"),
    # Calendar components
    ("components/DayCard", "features/calendar/components/DayCard"),
    ("components/DayIndicator", "features/calendar/components/DayIndicator"),
    ("components/EventItem", "features/calendar/components/EventItem"),
    ("components/EventModal", "features/calendar/components/EventModal"),
    ("components/EventPopup", "features/calendar/components/EventPopup"),
    ("components/DateDisplay", "features/calendar/components/DateDisplay"),
    ("components/DatePicker", "features/calendar/components/DatePicker"),
    # Calendar hooks
    # (hooks moved in-place below)

    # Weather
    ("components/WeatherWidget", "features/weather/components/WeatherWidget"),
    ("components/WeatherTooltip", "features/weather/components/WeatherTooltip"),

    # Navigation
    ("components/Sidebar", "features/navigation/Sidebar"),
    ("components/SideNav", "features/navigation/SideNav"),
    ("components/ViewSwitcher", "features/navigation/ViewSwitcher"),
    ("components/StatusBar", "features/navigation/StatusBar"),

    # Dashboard
    ("components/Header", "features/dashboard/Header"),
    ("components/Clock", "features/dashboard/Clock"),
    ("components/FamilyPills", "features/dashboard/FamilyPills"),
    ("components/DensityBadge", "features/dashboard/DensityBadge"),
    ("components/AppShell.tsx", "features/dashboard/AppShell/AppShell.tsx"),

    # Kiosk
    ("components/StickyArea", "features/kiosk/components/StickyArea"),

    # Shared components
    ("components/ErrorBoundary", "shared/components/ErrorBoundary"),
    ("components/LoadingSkeleton", "shared/components/LoadingSkeleton"),
]

# Hook moves (as individual files, not directories)
HOOK_MOVES = [
    # Calendar hooks
    ("hooks/useCalendarEvents.ts", "features/calendar/hooks/useCalendarEvents.ts"),
    ("hooks/useCalendarEvents.test.ts", "features/calendar/hooks/useCalendarEvents.test.ts"),
    ("hooks/useEventInteraction.ts", "features/calendar/hooks/useEventInteraction.ts"),
    ("hooks/useEventInteraction.test.ts", "features/calendar/hooks/useEventInteraction.test.ts"),
    # Weather hooks
    ("hooks/useWeatherTooltip.ts", "features/weather/hooks/useWeatherTooltip.ts"),
    # Kiosk hooks
    ("hooks/useEdgeProximity.ts", "features/kiosk/hooks/useEdgeProximity.ts"),
    ("hooks/useEdgeProximity.test.ts", "features/kiosk/hooks/useEdgeProximity.test.ts"),
    ("hooks/useIdleCursor.ts", "features/kiosk/hooks/useIdleCursor.ts"),
    ("hooks/useIdleCursor.test.ts", "features/kiosk/hooks/useIdleCursor.test.ts"),
    ("hooks/useOrientation.ts", "features/kiosk/hooks/useOrientation.ts"),
    ("hooks/useUiScale.ts", "features/kiosk/hooks/useUiScale.ts"),
    ("hooks/useUiScale.test.ts", "features/kiosk/hooks/useUiScale.test.ts"),
    ("hooks/useViewportWidth.ts", "features/kiosk/hooks/useViewportWidth.ts"),
    ("hooks/useViewportWidth.test.ts", "features/kiosk/hooks/useViewportWidth.test.ts"),
    # Dashboard hooks
    ("hooks/useSidebar.ts", "features/dashboard/hooks/useSidebar.ts"),
    ("hooks/useSidebar.test.ts", "features/dashboard/hooks/useSidebar.test.ts"),
    # Shared hooks
    ("hooks/useApi.ts", "shared/hooks/useApi.ts"),
    ("hooks/useViewNavigation.ts", "shared/hooks/useViewNavigation.ts"),
]

# Util/service moves
UTIL_MOVES = [
    ("utils/dateFormat.ts", "shared/utils/dateFormat.ts"),
    ("utils/density.ts", "shared/utils/density.ts"),
    ("utils/recurrence.ts", "shared/utils/recurrence.ts"),
    ("utils/recurrence.test.ts", "shared/utils/recurrence.test.ts"),
    ("services/api.ts", "shared/services/api.ts"),
    ("services/api.test.ts", "shared/services/api.test.ts"),
]


def run_git_mv(old, new):
    """Run git mv for a file or directory."""
    old_full = os.path.join(SRC, old)
    new_full = os.path.join(SRC, new)
    if not os.path.exists(old_full):
        print(f"  SKIP (not found): {old}")
        return
    # Ensure parent directory exists
    os.makedirs(os.path.dirname(new_full), exist_ok=True)
    result = subprocess.run(
        ["git", "mv", old_full, new_full],
        capture_output=True,
        text=True,
        cwd="/Users/admin/dashy",
    )
    if result.returncode != 0:
        print(f"  ERROR: git mv {old} -> {new}: {result.stderr.strip()}")
    else:
        print(f"  OK: {old} -> {new}")


def do_moves():
    """Execute all file moves."""
    print("=== Phase 1: Moving files ===")

    print("\n-- Component directories --")
    for old, new in MOVES:
        run_git_mv(old, new)

    print("\n-- Hook files --")
    for old, new in HOOK_MOVES:
        run_git_mv(old, new)

    print("\n-- Util/service files --")
    for old, new in UTIL_MOVES:
        run_git_mv(old, new)


def update_imports():
    """Update all import paths across the codebase."""
    print("\n=== Phase 2: Updating imports ===")

    # Build the complete mapping of old import paths to new ones
    # These are the path portions that appear after @/ in imports
    path_mapping = {}

    # Component moves
    component_map = {
        "components/DayView": "features/calendar/views/DayView",
        "components/WeekGrid": "features/calendar/views/WeekGrid",
        "components/MonthView": "features/calendar/views/MonthView",
        "components/YearView": "features/calendar/views/YearView",
        "components/DayCard": "features/calendar/components/DayCard",
        "components/DayIndicator": "features/calendar/components/DayIndicator",
        "components/EventItem": "features/calendar/components/EventItem",
        "components/EventModal": "features/calendar/components/EventModal",
        "components/EventPopup": "features/calendar/components/EventPopup",
        "components/DateDisplay": "features/calendar/components/DateDisplay",
        "components/DatePicker": "features/calendar/components/DatePicker",
        "components/WeatherWidget": "features/weather/components/WeatherWidget",
        "components/WeatherTooltip": "features/weather/components/WeatherTooltip",
        "components/Sidebar": "features/navigation/Sidebar",
        "components/SideNav": "features/navigation/SideNav",
        "components/ViewSwitcher": "features/navigation/ViewSwitcher",
        "components/StatusBar": "features/navigation/StatusBar",
        "components/Header": "features/dashboard/Header",
        "components/Clock": "features/dashboard/Clock",
        "components/FamilyPills": "features/dashboard/FamilyPills",
        "components/DensityBadge": "features/dashboard/DensityBadge",
        "components/AppShell": "features/dashboard/AppShell",
        "components/StickyArea": "features/kiosk/components/StickyArea",
        "components/ErrorBoundary": "shared/components/ErrorBoundary",
        "components/LoadingSkeleton": "shared/components/LoadingSkeleton",
    }
    path_mapping.update(component_map)

    # Hook moves
    hook_map = {
        "hooks/useCalendarEvents": "features/calendar/hooks/useCalendarEvents",
        "hooks/useEventInteraction": "features/calendar/hooks/useEventInteraction",
        "hooks/useWeatherTooltip": "features/weather/hooks/useWeatherTooltip",
        "hooks/useEdgeProximity": "features/kiosk/hooks/useEdgeProximity",
        "hooks/useIdleCursor": "features/kiosk/hooks/useIdleCursor",
        "hooks/useOrientation": "features/kiosk/hooks/useOrientation",
        "hooks/useUiScale": "features/kiosk/hooks/useUiScale",
        "hooks/useViewportWidth": "features/kiosk/hooks/useViewportWidth",
        "hooks/useSidebar": "features/dashboard/hooks/useSidebar",
        "hooks/useApi": "shared/hooks/useApi",
        "hooks/useViewNavigation": "shared/hooks/useViewNavigation",
    }
    path_mapping.update(hook_map)

    # Util/service moves
    util_map = {
        "utils/dateFormat": "shared/utils/dateFormat",
        "utils/density": "shared/utils/density",
        "utils/recurrence": "shared/utils/recurrence",
        "services/api": "shared/services/api",
    }
    path_mapping.update(util_map)

    # Sort by key length descending to avoid partial replacements
    # (e.g., replace @/hooks/useCalendarEvents before @/hooks/use)
    sorted_keys = sorted(path_mapping.keys(), key=len, reverse=True)

    # Build regex patterns for @/ imports
    patterns = []
    for old_path in sorted_keys:
        new_path = path_mapping[old_path]
        # Escape for regex
        escaped = re.escape(old_path)
        # Match @/old_path followed by / or end-of-string (quote/slash boundary)
        # Capture the quote character to preserve ' vs "
        pattern = re.compile(r"(@/)" + escaped + r"(/|(?=['\"]))")
        patterns.append((pattern, f"@/{new_path}\\2"))

    # Also handle relative imports within moved files
    # This is trickier — we need to convert relative imports to @/ imports
    # We'll handle this by scanning each file and resolving relative paths

    # Collect all source files
    all_files = []
    for root, dirs, files in os.walk(SRC):
        # Skip node_modules, dist, docs
        dirs[:] = [d for d in dirs if d not in ("node_modules", "dist", "docs", "assets", ".git")]
        for f in files:
            if f.endswith((".ts", ".tsx")):
                all_files.append(os.path.join(root, f))

    print(f"  Scanning {len(all_files)} files...")

    updated_count = 0
    for filepath in all_files:
        with open(filepath, "r") as f:
            content = f.read()

        original = content

        # Apply @/ import path replacements
        for pattern, replacement in patterns:
            content = pattern.sub(replacement, content)

        if content != original:
            with open(filepath, "w") as f:
                f.write(content)
            updated_count += 1

    print(f"  Updated imports in {updated_count} files")


def main():
    do_moves()
    update_imports()
    print("\n✅ Migration complete! Run `make lint && make typecheck && make test && make build` to verify.")


if __name__ == "__main__":
    main()
