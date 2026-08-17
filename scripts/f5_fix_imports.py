#!/usr/bin/env python3
"""Fix broken relative imports after F5 migration by converting to @/ imports."""

import os
import re

SRC = "/Users/admin/dashy/frontend/src"

# Files that need import fixes
FILES_TO_FIX = [
    "features/calendar/views/DayView/DayView.test.tsx",
    "features/calendar/views/MonthView/MonthView.test.tsx",
    "features/calendar/views/WeekGrid/WeekGrid.test.tsx",
    "features/calendar/views/YearView/YearView.test.tsx",
    "features/calendar/components/DayCard/DayCard.tsx",
    "features/calendar/components/DayIndicator/DayIndicator.tsx",
    "features/calendar/components/DayIndicator/DayIndicator.test.tsx",
    "features/calendar/components/EventItem/EventItem.tsx",
    "features/calendar/components/EventItem/EventItem.test.tsx",
    "features/calendar/components/EventModal/EventModal.tsx",
    "features/calendar/components/EventModal/EventModal.test.tsx",
    "features/calendar/components/EventPopup/EventPopup.tsx",
    "features/calendar/components/EventPopup/EventPopup.test.tsx",
    "features/weather/components/WeatherWidget/WeatherIcon.tsx",
    "features/weather/components/WeatherWidget/WeatherWidget.tsx",
    "features/weather/components/WeatherWidget/WeatherWidget.test.tsx",
    "features/weather/components/WeatherTooltip/WeatherTooltip.tsx",
    "features/weather/components/WeatherTooltip/WeatherTooltip.test.tsx",
    "features/navigation/SideNav/SideNav.tsx",
    "features/navigation/ViewSwitcher/ViewSwitcher.tsx",
    "features/dashboard/Clock/Clock.tsx",
    "features/dashboard/DensityBadge/DensityBadge.tsx",
    "features/dashboard/FamilyPills/FamilyPills.tsx",
    "features/dashboard/Header/Header.tsx",
    "features/kiosk/components/StickyArea/StickyArea.tsx",
]

# Import patterns to fix (convert relative to @/ imports)
IMPORT_FIXES = [
    # ../../types -> @/types
    (r"from ['\"]\.\./\.\./types['\"]", "from '@/types'"),
    # ../../theme/... -> @/theme/...
    (r"from ['\"]\.\./\.\./theme/", "from '@/theme/"),
]

def fix_file(filepath):
    """Fix imports in a single file."""
    full_path = os.path.join(SRC, filepath)
    if not os.path.exists(full_path):
        print(f"  SKIP (not found): {filepath}")
        return False

    with open(full_path, 'r') as f:
        content = f.read()

    original = content

    for pattern, replacement in IMPORT_FIXES:
        content = re.sub(pattern, replacement, content)

    if content != original:
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"  FIXED: {filepath}")
        return True
    else:
        print(f"  NO CHANGE: {filepath}")
        return False

def main():
    print("=== Fixing broken relative imports ===")
    fixed_count = 0
    for filepath in FILES_TO_FIX:
        if fix_file(filepath):
            fixed_count += 1
    print(f"\n✅ Fixed imports in {fixed_count} files")

if __name__ == "__main__":
    main()
