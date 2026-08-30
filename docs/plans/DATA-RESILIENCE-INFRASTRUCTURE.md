# Data Resilience Infrastructure — Stale-While-Revalidate + Metrics

**Status:** In Progress (Phase 5 Complete)
**Created:** 2026-08-30
**Priority:** Critical (production data loss)

---

## Problem Statement

The Dashy kiosk on the Pi experiences intermittent data loss:
- **Calendar events disappear** — some family members' events vanish, then reappear
- **Weather shows wrong data** — temperatures don't match phone's live weather
- **Refresh button ineffective** — clicking refresh doesn't restore missing data

**Root cause:** Pi is on WiFi (Verizon hotspot `Verizon_G4JKF7`) with intermittent DNS failures and connection resets. When upstream APIs fail, the backend either:
1. Returns empty/partial results (calendar) and caches them
2. Falls back to mock data (weather) and caches it

The frontend then displays this fabricated/incomplete data instead of the last known good data.

---

## Root Cause Analysis

### Network Instability
Pi logs show:
```
Unable to find the server at oauth2.googleapis.com  (DNS failure)
[Errno 101] Network is unreachable
[Errno 104] Connection reset by peer
current_weather_api_error → falling back to mock data
```

These are classic WiFi/cellular hotspot symptoms. The Verizon G4JKF7 is a mobile hotspot with inherent instability.

### Design Flaws
1. **No stale-while-revalidate pattern** — when cache expires and API fails, there's no fallback to previously cached data
2. **Mock data in production** — adapters fall back to mock data when APIs fail, then cache the mock data
3. **Silent failures** — adapters return empty results instead of signaling errors
4. **No visibility** — users can't tell when data is stale or fabricated

---

## Solution Architecture

### Industry-Standard Pattern: Stale-While-Revalidate (SWR)

The SWR pattern is used by HTTP CDNs, service workers, React Query, and Next.js. The principle:

> **Once you have real data, keep serving it until you successfully fetch newer real data. Never fabricate data.**

```
┌─────────────────────────────────────────────────────────┐
│  Request arrives                                        │
│                                                         │
│  1. Fresh cache hit?  → return immediately              │
│  2. Stale cache hit?  → return stale, log warning       │
│  3. No cache at all → try API with retry                │
│     a. API succeeds → cache + return                    │
│     b. API fails    → 503 (nothing to serve)            │
│                                                         │
│  On successful API fetch:                               │
│     - Write fresh key (TTL: configurable)               │
│     - Write stale key (TTL: configurable, longer)       │
└─────────────────────────────────────────────────────────┘
```

### Project-Wide Infrastructure (DRY)

The solution is a **single `Cache.fetch()` method** that encapsulates the entire SWR lifecycle. Any route or service that needs resilient data fetching calls it once:

```python
return await cache.fetch(
    key="weather:imperial",
    fetcher=lambda: weather_provider.get_weather("imperial"),
    fresh_ttl=settings.WEATHER_CACHE_TTL,
    stale_ttl=settings.WEATHER_STALE_TTL,
    retry_config=WEATHER_RETRY,
)
```

This replaces the manual cache-check-then-fetch pattern in every route. Future features (shopping lists, etc.) automatically get the same resilience.

### Retry with Exponential Backoff

Transient network errors (DNS failures, connection resets) are handled by retry logic with exponential backoff:
- 3 attempts by default
- Delays: 1s → 2s → 4s
- Only retries on transient errors (network, timeout, 5xx)
- Non-transient errors (4xx, auth failures) fail immediately

### Data Freshness Metrics

A REST-compliant `/api/v1/metrics` endpoint exposes:
- Last successful fetch timestamp per data source
- Current cache state (fresh/stale/missing)
- Data age (how old is the cached data)
- Network health (upstream API reachability)

The frontend displays these metrics via hover tooltips on the status bar refresh timers.

---

## Implementation Plan

### Phase 1: Core SWR Infrastructure

**Goal:** Add `Cache.fetch()` method with SWR pattern and retry logic.

**Files:**
- `dashy-api/app/core/cache.py` — Add `RetryConfig` dataclass, `fetch()` method
- `dashy-api/app/core/exceptions.py` — Add `UpstreamServiceError` base exception
- `dashy-api/app/config.py` — Add `*_STALE_TTL` settings

**Implementation:**
```python
@dataclass
class RetryConfig:
    max_attempts: int = 3
    backoff_seconds: list[float] = field(default_factory=lambda: [1.0, 2.0, 4.0])
    transient_errors: tuple[type[Exception], ...] = (ConnectionError, TimeoutError, OSError)

class Cache:
    async def fetch(
        self,
        key: str,
        fetcher: Callable[[], Awaitable[Any]],
        fresh_ttl: int,
        stale_ttl: int,
        retry_config: RetryConfig = RetryConfig(),
    ) -> Any:
        """Stale-while-revalidate fetch with retry."""
        # 1. Check fresh cache
        fresh = await self.get(f"{key}:fresh")
        if fresh is not None:
            return fresh
        
        # 2. Check stale cache
        stale = await self.get(f"{key}:stale")
        if stale is not None:
            logger.warning("serving_stale_data", key=key)
            return stale
        
        # 3. Fetch with retry
        last_error = None
        for attempt, delay in enumerate(retry_config.backoff_seconds):
            try:
                result = await fetcher()
                # Write both fresh and stale
                await self.set(f"{key}:fresh", result, fresh_ttl)
                await self.set(f"{key}:stale", result, stale_ttl)
                return result
            except tuple(retry_config.transient_errors) as e:
                last_error = e
                if attempt < len(retry_config.backoff_seconds) - 1:
                    await asyncio.sleep(delay)
        
        # 4. All retries failed
        raise UpstreamServiceError(f"Failed after {retry_config.max_attempts} attempts") from last_error
```

**Config additions:**
```python
WEATHER_CACHE_TTL: int = 600      # 10 min (fresh)
WEATHER_STALE_TTL: int = 86400    # 24 hr (stale)
CALENDAR_CACHE_TTL: int = 300     # 5 min (fresh)
CALENDAR_STALE_TTL: int = 604800  # 7 days (stale)
```

**Success Criteria:**
- [x] `RetryConfig` dataclass defined with configurable attempts, backoff, transient error types
- [x] `Cache.fetch()` implements SWR pattern (fresh → stale → retry → raise)
- [x] `UpstreamServiceError` exception class defined
- [x] Config has `*_STALE_TTL` settings for weather and calendar
- [x] Unit tests for `Cache.fetch()` covering all paths (fresh hit, stale hit, retry success, retry failure)
- [x] Integration test with real Redis verifying SWR behavior
- [x] Quality gates pass: `make lint-api && make test-api`
- [x] Code review gate passed
- [x] Committed and pushed to `development`

---

### Phase 2: Adapter Cleanup — Remove Mock Fallbacks

**Goal:** Adapters raise errors instead of returning mock/empty data.

**Files:**
- `dashy-api/app/infrastructure/weather/owm_adapter.py` — Remove all mock fallbacks, raise `UpstreamServiceError`
- `dashy-api/app/infrastructure/calendar/google_adapter.py` — Remove silent `[]` returns, raise `UpstreamServiceError`

**Weather adapter changes:**
```python
async def get_weather(self, units: str = "imperial") -> WeatherResponse:
    client = get_http_client()
    
    current_data = await self._fetch_current(client)
    if current_data is None:
        raise UpstreamServiceError("Weather API unreachable")
    
    # ... fetch daily/hourly ...
    
    if daily_data is None and hourly_data is None:
        raise UpstreamServiceError("Forecast API unreachable")
    
    return _build_response(current_data, hourly_data, daily_data, units)
```

**Calendar adapter changes:**
```python
async def fetch_events(self, calendar_id: str, date_range: DateRange) -> list[dict]:
    loop = asyncio.get_running_loop()
    try:
        return await loop.run_in_executor(None, self._fetch_events_sync, calendar_id, date_range)
    except (HttpError, Exception) as e:
        raise UpstreamServiceError(f"Calendar API failed for {calendar_id}") from e
```

**Success Criteria:**
- [x] `OWMWeatherAdapter.get_weather()` raises `UpstreamServiceError` on failure (no mock fallback)
- [x] `GoogleCalendarAdapter.fetch_events()` raises `UpstreamServiceError` on failure (no `[]` return)
- [x] All mock fallback code removed from production adapters
- [x] Existing tests updated to expect exceptions instead of mock/empty data
- [x] New tests verify adapters raise on network failures
- [x] Quality gates pass: `make lint-api && make test-api`
- [x] Code review gate passed
- [x] Committed and pushed to `development`

---

### Phase 3: Route Migration — Use `cache.fetch()`

**Goal:** Migrate weather and calendar routes to use the new `Cache.fetch()` method.

**Files:**
- `dashy-api/app/api/routes/weather.py` — Simplify to one-liner using `cache.fetch()`
- `dashy-api/app/api/routes/calendar.py` — Simplify to one-liner using `cache.fetch()`

**Weather route:**
```python
@router.get("")
async def get_weather(cache: CacheDep, provider: WeatherProviderDep, query: WeatherQuery = Depends()):
    return await cache.fetch(
        key=f"weather:{query.units}",
        fetcher=lambda: provider.get_weather(query.units),
        fresh_ttl=settings.WEATHER_CACHE_TTL,
        stale_ttl=settings.WEATHER_STALE_TTL,
        retry_config=RetryConfig(
            transient_errors=(httpx.HTTPError, ConnectionError, TimeoutError)
        ),
    )
```

**Calendar route:**
```python
@router.get("")
async def get_calendar(cache: CacheDep, provider: CalendarProviderDep, family_service: FamilyServiceDep, query: CalendarQuery = Depends()):
    date_range = parse_date_range(query.start_date, query.end_date)
    
    async def fetch_all_events():
        members = await family_service.get_all_members()
        all_events = []
        for member in members:
            events = await provider.fetch_events(member.email, date_range)
            all_events.extend(parse_events(events, member))
        return deduplicate_events(all_events)
    
    return await cache.fetch(
        key=f"calendar:{query.start_date}:{query.end_date}",
        fetcher=fetch_all_events,
        fresh_ttl=settings.CALENDAR_CACHE_TTL,
        stale_ttl=settings.CALENDAR_STALE_TTL,
        retry_config=RetryConfig(
            transient_errors=(HttpError, ConnectionError, TimeoutError, OSError)
        ),
    )
```

**Success Criteria:**
- [x] Weather route uses `cache.fetch()` with SWR pattern
- [x] Calendar route uses `cache.fetch()` with SWR pattern
- [x] Routes return 503 when all retries fail and no stale cache exists
- [x] Routes serve stale data when fresh cache expired but stale exists
- [ ] Manual testing: kill network, verify stale data is served
- [x] Quality gates pass: `make lint-api && make test-api`
- [x] Code review gate passed
- [x] Committed and pushed to `development`

---

### Phase 4: Data Freshness Metrics Endpoint

**Goal:** REST-compliant `/api/v1/metrics` endpoint exposing data freshness and network health.

**Files:**
- `dashy-api/app/api/routes/metrics.py` — New route
- `dashy-api/app/core/cache.py` — Add `get_with_metadata()` method to return TTL info
- `dashy-api/app/main.py` — Register metrics router

**Endpoint design (REST compliant):**
```
GET /api/v1/metrics
Response 200:
{
  "data_sources": {
    "weather": {
      "status": "fresh",           # fresh | stale | missing
      "last_fetch": "2026-08-30T16:45:23Z",
      "age_seconds": 127,
      "fresh_ttl": 600,
      "stale_ttl": 86400
    },
    "calendar": {
      "status": "stale",
      "last_fetch": "2026-08-30T10:00:00Z",
      "age_seconds": 24323,
      "fresh_ttl": 300,
      "stale_ttl": 604800
    }
  },
  "network_health": {
    "google_calendar": {
      "reachable": true,
      "last_check": "2026-08-30T16:47:30Z",
      "latency_ms": 245
    },
    "openweathermap": {
      "reachable": true,
      "last_check": "2026-08-30T16:47:30Z",
      "latency_ms": 189
    }
  },
  "cache": {
    "connected": true,
    "hits": 1234,
    "misses": 56,
    "errors": 2
  }
}
```

**Implementation:**
```python
class Cache:
    async def get_with_metadata(self, key: str) -> dict | None:
        """Get value with TTL metadata."""
        # Use Redis TTL command to get remaining TTL
        value = await self._client.get(key)
        ttl = await self._client.ttl(key)
        return {
            "value": json.loads(value) if value else None,
            "ttl_remaining": ttl,
        }

@router.get("/metrics")
async def get_metrics(cache: CacheDep):
    weather_fresh = await cache.get_with_metadata("weather:imperial:fresh")
    weather_stale = await cache.get_with_metadata("weather:imperial:stale")
    
    # Determine status
    if weather_fresh and weather_fresh["ttl_remaining"] > 0:
        status = "fresh"
        last_fetch = ...  # calculate from TTL
    elif weather_stale:
        status = "stale"
    else:
        status = "missing"
    
    # Network health check (non-blocking, cached)
    network_health = await check_upstream_reachability()
    
    return {
        "data_sources": {...},
        "network_health": network_health,
        "cache": cache.get_stats(),
    }
```

**Success Criteria:**
- [x] `/api/v1/metrics` endpoint returns data freshness info for weather and calendar
- [x] Endpoint shows cache status (fresh/stale/missing) per data source
- [x] Endpoint shows network health (upstream API reachability)
- [x] Endpoint is REST compliant (proper status codes, JSON structure)
- [x] Network health check is non-blocking and cached (doesn't slow down response)
- [x] Tests verify all status paths (fresh, stale, missing)
- [x] Quality gates pass: `make lint-api && make test-api`
- [x] Code review gate passed
- [x] Committed and pushed to `development`

---

### Phase 5: Frontend Metrics Display

**Goal:** Integrate metrics endpoint into the settings page (full settings UI work deferred to future session).

**Scope:**
- Wire settings icon in status bar to open settings panel
- Add metrics button/link in settings panel
- Create full metrics page displaying data freshness, network health, and cache stats
- Metrics page should be categorized and sectioned with color-coded status indicators
- Explore Tailwind CSS / Headless UI / Catalyst for dedicated dashboard/metrics styles
- No mockup needed — "just going with the flow"

**Files:**
- `dashy-kiosk/src/features/settings/` — New settings feature directory
- `dashy-kiosk/src/shared/hooks/useMetrics.ts` — New hook to fetch `/api/v1/metrics`
- `dashy-kiosk/src/shared/api/endpoints.ts` — Add metrics endpoint

**Metrics Page Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  Data Freshness Metrics                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Weather Data                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Status: 🟢 Fresh                                │   │
│  │ Age: 2 minutes ago                              │   │
│  │ Last fetch: 2026-08-30 16:45:23 UTC             │   │
│  │ Fresh TTL: 10 minutes                           │   │
│  │ Stale TTL: 24 hours                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Calendar Data                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Status: 🟡 Stale                                │   │
│  │ Age: 4 hours ago                                │   │
│  │ Last fetch: 2026-08-30 12:45:23 UTC             │   │
│  │ Fresh TTL: 5 minutes                            │   │
│  │ Stale TTL: 7 days                               │   │
│  │                                                 │   │
│  │ Per-Member Status:                              │   │
│  │   • Faiyaz: 🟢 Success (12 events)              │   │
│  │   • Trisha: 🟢 Success (8 events)               │   │
│  │   • Arya: 🔴 Failed (connection timeout)        │   │
│  │   • Raya: 🟢 Success (15 events)                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Network Health                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Google Calendar: 🟢 Reachable (245ms)           │   │
│  │ OpenWeatherMap: 🟢 Reachable (189ms)            │   │
│  │ Last check: 2026-08-30 16:47:30 UTC             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Cache Statistics                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Hits: 1,234                                     │   │
│  │ Misses: 56                                      │   │
│  │ Errors: 2                                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Implementation Notes:**
- All timestamps displayed in configured timezone (from `/api/v1/config`)
- Color-coded status indicators: 🟢 fresh/success, 🟡 stale/warning, 🔴 failed/error
- Metrics endpoint polled every 30s (configurable)
- Responsive design for kiosk display

**Success Criteria:**
- [x] Settings icon in status bar opens settings panel
- [x] Settings panel has button/link to metrics page
- [x] Metrics page displays weather data freshness with status, age, last fetch
- [x] Metrics page displays calendar data freshness with per-member breakdown
- [x] Metrics page displays network health (upstream API reachability)
- [x] Metrics page displays cache statistics
- [x] All timestamps converted to configured timezone
- [x] Color-coded status indicators (fresh/stale/missing, success/failed)
- [x] Metrics endpoint polled every 30s
- [x] Quality gates pass: `make lint-kiosk && make typecheck-kiosk && make test-kiosk`
- [x] Code review gate passed
- [ ] Committed and pushed to `development`

---

### Phase 6: Pi Infrastructure — WiFi + Connectivity

**Goal:** Fix Pi WiFi power management and add connectivity monitoring.

**Tasks:**

**1. Disable WiFi power management:**
```bash
# Run on Pi
sudo iw dev wlan0 set power_save off

# Make persistent across reboots
sudo nano /etc/NetworkManager/conf.d/default-wifi-powersave.conf
# Add:
[connection]
wifi.powersave = 2  # 2 = disable powersave
```

**2. Add connectivity health check script:**
```bash
#!/bin/bash
# /usr/local/bin/dashy-connectivity-check.sh
# Checks upstream API reachability and logs to systemd journal

GOOGLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://www.googleapis.com/)
OWM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://api.openweathermap.org/)

logger -t dashy-connectivity "google=$GOOGLE_STATUS owm=$OWM_STATUS"
```

**3. Add systemd timer for periodic checks:**
```ini
# /etc/systemd/system/dashy-connectivity-check.timer
[Unit]
Description=Dashy connectivity check

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

**Success Criteria:**
- [ ] WiFi power management disabled on Pi (`iw dev wlan0 get power_save` shows `off`)
- [ ] Power save setting persists across reboots
- [ ] Connectivity check script runs every 5 minutes
- [ ] Connectivity logs visible in `journalctl -t dashy-connectivity`
- [ ] Manual test: unplug Pi ethernet (if applicable), verify WiFi stays stable
- [ ] Documented in `README.md` under "Troubleshooting" section
- [ ] Committed (scripts in `scripts/` directory, systemd units in `deploy/pi/`)

---

## Testing Strategy

### Unit Tests
- `Cache.fetch()` — all paths (fresh hit, stale hit, retry success, retry failure)
- `RetryConfig` — transient error detection
- Adapter error handling — verify exceptions raised on failure

### Integration Tests
- SWR behavior with real Redis — verify fresh/stale key lifecycle
- Retry logic with mocked HTTP client — verify backoff timing
- Metrics endpoint — verify all status paths

### Manual Testing
- Kill network on Pi, verify stale data is served
- Restore network, verify fresh data is fetched
- Check metrics endpoint shows correct status transitions
- Verify hover tooltips display correct data

---

## Deployment Considerations

### Backward Compatibility
- Existing cache keys (`weather:imperial`) will not match new keys (`weather:imperial:fresh`)
- First deploy will see cache misses until new keys are populated
- No data loss — just a cold start

### Monitoring
- Watch logs for `serving_stale_data` warnings — indicates network issues
- Monitor `/api/v1/metrics` endpoint for status transitions
- Set up alerts if status stays `stale` for > 1 hour

### Rollback Plan
If issues arise:
1. Revert to previous commit
2. Restart API containers: `make dev-restart` or `make deploy-restart`
3. Old cache keys will be used again

---

## Success Metrics

After deployment, we should see:
- **Zero** "falling back to mock data" warnings in production logs
- **Zero** empty calendar responses when network is up
- Stale data served during network outages (visible in metrics)
- User can see data freshness status via hover tooltips
- WiFi power management disabled, fewer network drops

---

## Future Enhancements (Out of Scope)

- **Circuit breaker pattern** — if upstream API fails N times, stop trying for M minutes (overkill for 2-min polling)
- **Background refresh** — proactively refresh cache before it expires (complexity not justified)
- **Multi-region failover** — if one API region is down, try another (not needed for single-location kiosk)

---

## Known Issues

### ~~Pre-existing Test Failure~~ (RESOLVED 2026-08-30)

**Test:** `tests/unit/test_chores_services.py::TestInstanceGeneration::test_generate_instance_archives_old_instances`

**Status:** ✅ Fixed in Phase 1 (commit 4db9541)

**Resolution:** Changed test to use timezone-aware date comparison with range check instead of exact date match. Test now passes consistently regardless of timezone boundary conditions.

---

## References

- [Stale-While-Revalidate (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate)
- [React Query SWR pattern](https://tanstack.com/query/latest/docs/react/guides/stale-while-revalidate)
- [AWS Well-Architected: Retry with backoff](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/retry-requests.html)
- [Pi WiFi power management](https://www.raspberrypi.com/documentation/computers/configuration.html#configuring-networking)
