# Sync Types

Detect and resolve drift between kiosk TypeScript types and API models.

## When to Use

- After adding or modifying API endpoints
- When kiosk types don't match API responses
- Periodically to ensure type consistency across repos
- Before deploying API changes that affect kiosk

## Current State

**Manual sync with drift detection** (as per repo split plan).

Kiosk types live in `dashy-kiosk/src/types/index.ts`.
API models live in `dashy-api/app/api/models/`.

## Drift Detection

### 1. Check API Schema

Generate OpenAPI spec from API (runs in Docker container):

```bash
docker compose -f compose/docker-compose.dev.yml exec -T api uv run python -c "from app.main import app; import json; print(json.dumps(app.openapi()))" > /tmp/openapi.json
```

### 2. Compare with Kiosk Types

Manually review `dashy-kiosk/src/types/index.ts` against the OpenAPI spec.

Key types to check:
- `WeatherResponse` — matches `dashy-api/app/api/models/weather.py`
- `WeekCalendar` — matches `dashy-api/app/api/models/calendar.py`
- `FamilyMember` — matches `dashy-api/app/api/models/family.py`

### 3. Automated Check (Future)

Add a CI test that compares kiosk types against API OpenAPI spec:

```python
# api/tests/test_type_sync.py
import httpx
import json

def test_openapi_spec_generation():
    """Generate OpenAPI spec for manual comparison."""
    from app.main import app
    spec = app.openapi()
    # Could add assertions here to validate spec structure
    assert "components" in spec
    assert "schemas" in spec["components"]
```

Kiosk could have a test that fetches the spec and validates type structure.

## Updating Types

### When API Changes

1. **Update API models** in `dashy-api/app/api/models/`
2. **Run API tests** to ensure models are correct
3. **Update kiosk types** in `dashy-kiosk/src/types/index.ts` to match
4. **Run kiosk tests** to ensure type compatibility
5. **Commit in both repos**:
   ```bash
   # API
   cd dashy-api/
   git add . && git commit -m "feat: update API models"
   git push origin development

   # Kiosk
   cd ../dashy-kiosk/
   git add . && git commit -m "feat: sync types with API"
   git push origin development

   # Orchestrator
   cd ..
   make submodule-update
   git add dashy-kiosk/ dashy-api/
   git commit -m "chore: sync types across repos"
   ```

### When Kiosk Needs New Fields

1. **Add field to API model** first
2. **Update API adapter** to populate the field
3. **Add API tests** for the new field
4. **Update kiosk type** to include the field
5. **Update kiosk components** to use the field
6. **Commit in both repos** (see workflow above)

## Type Mapping Reference

| API (Python) | Kiosk (TypeScript) |
|------------------|----------------------|
| `str` | `string` |
| `int` | `number` |
| `float` | `number` |
| `bool` | `boolean` |
| `list[T]` | `T[]` |
| `dict[str, T]` | `Record<string, T>` |
| `Optional[T]` | `T \| null` |
| `datetime` | `string` (ISO 8601) |
| Pydantic model | TypeScript interface |

## Future: Codegen

If drift becomes painful, upgrade to automated codegen:

1. **API generates OpenAPI spec** in CI
2. **Kiosk consumes spec** via a tool like `openapi-typescript-codegen`
3. **Types are auto-generated** in `dashy-kiosk/src/types/generated/`
4. **Manual types** live alongside generated ones for custom logic

For now, manual sync is sufficient given the small API surface (3 endpoints).

## Cross-Repo Coordination

When making API changes:

1. **API skill**: Use `add-api-endpoint` in dashy-api
2. **Kiosk skill**: Use `add-api-contract` in dashy-kiosk to wire up the new endpoint
3. **This skill**: Use `sync-types` to ensure types match

The `add-weather-field` skill in dashy-api also notes when kiosk types need updating.
