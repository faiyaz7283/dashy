#!/bin/bash

# Wait for X display to be ready
for i in {1..30}; do
    if DISPLAY=:0 xset q >/dev/null 2>&1; then
        echo "Display ready after ${i}s"
        break
    fi
    sleep 1
done

# Wait for backend services to be available
for i in {1..60}; do
    if curl -s https://dashy.local >/dev/null 2>&1; then
        echo "Backend ready after ${i}s"
        break
    fi
    sleep 2
done

# Hide the mouse cursor after a short idle period (kiosk / wall-mounted display)
# unclutter-xfixes uses the X11-XFixes extension and works reliably under
# LightDM/Openbox on the Pi. --start-hidden keeps the cursor hidden on boot
# until the mouse is actually moved.
unclutter-xfixes --timeout 2 --jitter 1 --start-hidden --ignore-scrolling &

# Start Chromium
exec chromium --noerrdialogs --disable-infobars --kiosk --incognito \
    --disable-features=TranslateUI --disable-session-crashed-bubble \
    --start-fullscreen --password-store=basic \
    --disable-password-manager --disable-save-password-bubble \
    https://dashy.local
