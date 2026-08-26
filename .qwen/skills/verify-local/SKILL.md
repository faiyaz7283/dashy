# Verify Local Development

Verify that code changes work correctly in the local development environment before committing or deploying.

## When to Use

- After making code changes
- Before running quality gate
- Before deploying to production
- When debugging issues that only appear in local dev

## Prerequisites

- Docker containers running (`make dev-up`)
- All quality gate checks passing (`make lint && make typecheck && make test && make build`)

## Verification Steps

### 1. Check Container Health

```bash
# Verify all containers are running
docker compose -f compose/docker-compose.dev.yml ps

# Check API logs for errors
docker compose -f compose/docker-compose.dev.yml logs api --tail 50

# Check kiosk logs for errors
docker compose -f compose/docker-compose.dev.yml logs kiosk --tail 50
```

### 2. Test API Endpoints

```bash
# Health check
curl -sk https://api.dashy.local/health

# Family members (should return seeded data or empty array)
curl -sk https://api.dashy.local/api/v1/family

# Calendar (should return mock data in dev, real data in prod)
curl -sk https://api.dashy.local/api/v1/calendar

# Weather (should return mock data in dev, real data in prod)
curl -sk https://api.dashy.local/api/v1/weather
```

### 3. Verify Environment-Specific Behavior

**Local Development** (`ENVIRONMENT=development`):
- `WEATHER_USE_MOCK=true` → mock weather data
- `CALENDAR_USE_MOCK=true` → mock calendar data
- Database: PostgreSQL on `postgres-data` volume (dev container, persists across restarts)
- Test database: Separate `dashy_test` PostgreSQL database (used by `make test-api`, isolated from dev data)

**Production** (`ENVIRONMENT=production`):
- `WEATHER_USE_MOCK=false` → real OpenWeatherMap API
- `CALENDAR_USE_MOCK=false` → real Google Calendar API
- Database: PostgreSQL on `postgres-data` volume (prod container, persistent)

### 4. Test Kiosk

Open browser to `https://dashy.local` and verify:
- Dashboard loads without errors
- Calendar view shows events (mock in dev, real in prod)
- Weather widget displays data
- Family members appear with correct colors
- No console errors in DevTools

### 5. Test CRUD Operations (if applicable)

```bash
# Create a test family member
curl -sk -X POST https://api.dashy.local/api/v1/family \
  -H "Content-Type: application/json" \
  -d '{"key":"test","name":"Test User","email":"test@example.com","color":"#FF0000","initial":"T"}'

# Verify it appears in the list
curl -sk https://api.dashy.local/api/v1/family

# Clean up
curl -sk -X DELETE https://api.dashy.local/api/v1/family/test
```

## Common Issues

### Database Not Initialized
**Symptom**: API returns 500 errors, logs show "no such table"
**Fix**: Run `make migrate` to apply pending migrations. Check state with `make migrate-status`. If the database is in an inconsistent state, try `make migrate-rollback` then `make migrate`. Restart API container if needed.

### Mock Data Not Showing
**Symptom**: Calendar/weather endpoints return empty data
**Fix**: Check `.env.dev` has `WEATHER_USE_MOCK=true` and `CALENDAR_USE_MOCK=true`

### Family Members Empty
**Symptom**: Calendar shows no events even with mock data
**Fix**: Database may be empty. Check if seeder ran on startup. Manually add members via API or check `.env.dev` FAMILY_MEMBERS config.

### Kiosk Not Loading
**Symptom**: Browser shows blank page or errors
**Fix**: Check kiosk container logs. Verify Vite dev server is running. Check for TypeScript errors.

## Success Criteria

- [ ] All containers running without errors
- [ ] Health endpoint returns 200
- [ ] Family members endpoint returns data
- [ ] Calendar endpoint returns events (mock or real based on environment)
- [ ] Weather endpoint returns data (mock or real based on environment)
- [ ] Kiosk loads without console errors
- [ ] CRUD operations work (if tested)

## Integration with Workflow

This skill should be run:
1. **After** quality gate passes
2. **Before** committing changes
3. **Before** checking CI status
4. **Before** deploying to production
