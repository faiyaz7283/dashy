#!/bin/bash
# Dashy connectivity health check script
# Checks upstream API reachability and logs to systemd journal
# Designed to run via systemd timer every 5 minutes

set -euo pipefail

# Check Google Calendar API reachability
GOOGLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://www.googleapis.com/ || echo "000")

# Check OpenWeatherMap API reachability
OWM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://api.openweathermap.org/ || echo "000")

# Log to systemd journal with dashy-connectivity tag
logger -t dashy-connectivity "google=$GOOGLE_STATUS owm=$OWM_STATUS"

# Exit with error if both services are unreachable
if [[ "$GOOGLE_STATUS" == "000" && "$OWM_STATUS" == "000" ]]; then
    logger -t dashy-connectivity "ERROR: Both upstream services unreachable"
    exit 1
fi

exit 0
