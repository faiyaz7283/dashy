# Sync Types

Detect and resolve drift between frontend TypeScript types and backend API models.

## When to Use

- After adding or modifying API endpoints
- When frontend types don't match backend responses
- Periodically to ensure type consistency across repos
- Before deploying API changes that affect frontend

## Current State

**Manual sync with drift detection** (as per repo split plan).

Frontend types live in `dashy-kiosk/src/types/index.ts`.
Backend models live in `dashy-api/app/api/models/`.

## Drift Detection

### 1. Check Backend API Schema

Generate OpenAPI spec from backend:

```bash
cd backend/
uv run python -c "from app.main import app; import json; print(json.dumps(app.openapi()))" > /tmp/openapi.json
```

### 2. Compare with Frontend Types

Manually review `frontend/src/types/index.ts` against the OpenAPI spec.

Key types to check:
- `WeatherResponse` — matches `backend/app/api/models/weather.py`
- `WeekCalendar` — matches `backend/app/api/models/calendar.py`
- `FamilyMember` — matches `backend/app/api/models/family.py`

### 3. Automated Check (Future)

Add a CI test that compares frontend types against backend OpenAPI spec:

```python
# backend/tests/test_type_sync.py
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

Frontend could have a test that fetches the spec and validates type structure.

## Updating Types

### When Backend Changes

1. **Update backend models** in `backend/app/api/models/`
2. **Run backend tests** to ensure models are correct
3. **Update frontend types** in `frontend/src/types/index.ts` to match
4. **Run frontend tests** to ensure type compatibility
5. **Commit in both repos**:
   ```bash
   # Backend
   cd backend/
   git add . && git commit -m "feat: update API models"
   git push origin development
   
   # Frontend
   cd ../frontend/
   git add . && git commit -m "feat: sync types with backend API"
   git push origin development
   
   # Orchestrator
   cd ..
   make submodule-update
   git add frontend/ backend/
   git commit -m "chore: sync types across repos"
   ```

### When Frontend Needs New Fields

1. **Add field to backend model** first
2. **Update backend adapter** to populate the field
3. **Add backend tests** for the new field
4. **Update frontend type** to include the field
5. **Update frontend components** to use the field
6. **Commit in both repos** (see workflow above)

## Type Mapping Reference

| Backend (Python) | Frontend (TypeScript) |
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

1. **Backend generates OpenAPI spec** in CI
2. **Frontend consumes spec** via a tool like `openapi-typescript-codegen`
3. **Types are auto-generated** in `frontend/src/types/generated/`
4. **Manual types** live alongside generated ones for custom logic

For now, manual sync is sufficient given the small API surface (3 endpoints).

## Cross-Repo Coordination

When making API changes:

1. **Backend skill**: Use `add-api-endpoint` in dashy-api
2. **Frontend skill**: Use `add-api-contract` in dashy-kiosk to wire up the new endpoint
3. **This skill**: Use `sync-types` to ensure types match

The `add-weather-field` skill in dashy-api also notes when frontend types need updating.
