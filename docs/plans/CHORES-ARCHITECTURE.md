# Chores Module — Architectural Design

> **Status:** Ready for implementation
> **Spec reference:** `docs/chores-spec.md`
> **Last updated:** 2026-08-18

---

## Backend Architecture (dashy-api)

### 1. Domain Layer (`app/domain/chores/`)

**models.py** — Value objects and entities:
```python
@dataclass(frozen=True)
class ChoreCategory:
    id: str
    name: str

@dataclass(frozen=True)
class ChoreTag:
    id: str
    name: str

@dataclass(frozen=True)
class MasterChore:
    id: str
    name: str
    category_id: str
    tags: list[ChoreTag]
    difficulty: int  # 1-5
    frequency: Frequency  # enum: once, daily, weekly, monthly
    estimated_minutes: int | None
    due_time: str | None  # ISO time format
    due_date: str | None  # ISO date format
    expiration_behavior: ExpirationBehavior  # enum
    created_by: str  # member ID
    approved_by: str | None
    status: MasterChoreStatus  # enum: pending_approval, active, archived
    created_at: str  # ISO datetime
    updated_at: str
    deleted_at: str | None

@dataclass(frozen=True)
class ChoreInstance:
    id: str
    master_chore_id: str
    period_start: str | None
    period_end: str | None
    status: InstanceStatus  # enum
    claimed_by: str | None
    assigned_to: str | None
    assigned_by: str | None
    completed_by: str | None
    signoff_by: str | None
    started_at: str | None
    completed_at: str | None
    signed_off_at: str | None
    created_at: str
    updated_at: str
```

**ports.py** — Protocol interfaces:
```python
class ChoresRepository(Protocol):
    async def get_categories(self) -> list[ChoreCategory]: ...
    async def create_category(self, name: str) -> ChoreCategory: ...
    async def get_tags(self) -> list[ChoreTag]: ...
    async def create_tag(self, name: str) -> ChoreTag: ...
    async def get_master_chores(self, include_archived: bool = False) -> list[MasterChore]: ...
    async def create_master_chore(self, chore: MasterChore, tag_ids: list[str]) -> MasterChore: ...
    async def update_master_chore(self, chore_id: str, updates: dict) -> MasterChore: ...
    async def delete_master_chore(self, chore_id: str, permanent: bool = False) -> None: ...
    async def get_instances(self, master_chore_id: str | None = None) -> list[ChoreInstance]: ...
    async def create_instance(self, instance: ChoreInstance) -> ChoreInstance: ...
    async def update_instance(self, instance_id: str, updates: dict) -> ChoreInstance: ...
    async def delete_instance(self, instance_id: str) -> None: ...

class ChoresService(Protocol):
    async def get_all_data(self) -> ChoresData: ...
    async def create_master_chore(self, data: CreateMasterChoreRequest) -> MasterChore: ...
    async def approve_master_chore(self, chore_id: str, approver_id: str) -> MasterChore: ...
    async def claim_instance(self, instance_id: str, member_id: str) -> ChoreInstance: ...
    async def assign_instance(self, instance_id: str, assignee_id: str, assigner_id: str) -> ChoreInstance: ...
    async def update_instance_status(self, instance_id: str, status: InstanceStatus, actor_id: str) -> ChoreInstance: ...
```

**services.py** — Business logic:
- Approval flow logic (auto-approve if adult, pending if kid)
- Claim/assign mutual exclusivity enforcement
- Completion/signoff flow (kid → pending signoff, adult → complete)
- Instance generation from master (frequency → period calculation)
- Expiration behavior application

### 2. Infrastructure Layer (`app/infrastructure/chores/`)

**mock_adapter.py** — Mock data for dev:
- Returns hardcoded categories, tags, master chores, instances
- `CHORES_USE_MOCK=true` in `.env.dev`

### 3. Persistence Layer

**app/persistence/models.py** — Add SQLModel tables:
```python
class ChoreCategoryTable(SQLModel, table=True):
    __tablename__ = "chore_categories"
    id: str = Field(primary_key=True)
    name: str = Field(unique=True, index=True)
    created_at: datetime

class ChoreTagTable(SQLModel, table=True):
    __tablename__ = "chore_tags"
    id: str = Field(primary_key=True)
    name: str = Field(unique=True, index=True)
    created_at: datetime

class MasterChoreTable(SQLModel, table=True):
    __tablename__ = "master_chores"
    id: str = Field(primary_key=True)
    name: str
    category_id: str = Field(foreign_key="chore_categories.id")
    difficulty: int
    frequency: str  # stored as string, converted to enum in domain
    estimated_minutes: int | None
    due_time: str | None
    due_date: str | None
    expiration_behavior: str
    created_by: str = Field(foreign_key="family_members.id")
    approved_by: str | None = Field(foreign_key="family_members.id")
    status: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None

class ChoreTagLinkTable(SQLModel, table=True):
    __tablename__ = "chore_tag_links"
    master_chore_id: str = Field(foreign_key="master_chores.id", primary_key=True)
    tag_id: str = Field(foreign_key="chore_tags.id", primary_key=True)

class ChoreInstanceTable(SQLModel, table=True):
    __tablename__ = "chore_instances"
    id: str = Field(primary_key=True)
    master_chore_id: str = Field(foreign_key="master_chores.id")
    period_start: date | None
    period_end: date | None
    status: str
    claimed_by: str | None = Field(foreign_key="family_members.id")
    assigned_to: str | None = Field(foreign_key="family_members.id")
    assigned_by: str | None = Field(foreign_key="family_members.id")
    completed_by: str | None = Field(foreign_key="family_members.id")
    signoff_by: str | None = Field(foreign_key="family_members.id")
    started_at: datetime | None
    completed_at: datetime | None
    signed_off_at: datetime | None
    created_at: datetime
    updated_at: datetime
```

**app/persistence/chores_repository.py** — Repository implementation:
- Converts between SQLModel tables and domain entities
- Handles tag relationships via join table
- Implements all `ChoresRepository` protocol methods

### 4. API Layer

**app/api/models/chores.py** — Pydantic request/response models:
```python
class ChoreCategoryResponse(BaseModel):
    id: str
    name: str

class ChoreTagResponse(BaseModel):
    id: str
    name: str

class MasterChoreResponse(BaseModel):
    id: str
    name: str
    category: ChoreCategoryResponse
    tags: list[ChoreTagResponse]
    difficulty: int
    frequency: str
    estimated_minutes: int | None
    due_time: str | None
    due_date: str | None
    expiration_behavior: str
    created_by: str
    approved_by: str | None
    status: str
    created_at: str
    updated_at: str

class ChoreInstanceResponse(BaseModel):
    id: str
    master_chore_id: str
    period_start: str | None
    period_end: str | None
    status: str
    claimed_by: str | None
    assigned_to: str | None
    assigned_by: str | None
    completed_by: str | None
    signoff_by: str | None
    started_at: str | None
    completed_at: str | None
    signed_off_at: str | None

class ChoresResponse(BaseModel):
    categories: list[ChoreCategoryResponse]
    tags: list[ChoreTagResponse]
    master_chores: list[MasterChoreResponse]
    instances: list[ChoreInstanceResponse]

class CreateMasterChoreRequest(BaseModel):
    name: str
    category_id: str
    tag_ids: list[str]
    difficulty: int = Field(ge=1, le=5)
    frequency: str
    estimated_minutes: int | None = None
    due_time: str | None = None
    due_date: str | None = None
    expiration_behavior: str
    created_by: str
    approved_by: str | None = None

class CreateCategoryRequest(BaseModel):
    name: str

class CreateTagRequest(BaseModel):
    name: str

class ClaimInstanceRequest(BaseModel):
    member_id: str

class AssignInstanceRequest(BaseModel):
    assignee_id: str
    assigner_id: str

class UpdateInstanceStatusRequest(BaseModel):
    status: str
    actor_id: str
```

**app/api/routes/chores.py** — FastAPI endpoints:
```
GET    /api/v1/chores              # Get all (categories, tags, masters, instances)
POST   /api/v1/chores/masters      # Create master chore
PUT    /api/v1/chores/masters/{id} # Update master chore
DELETE /api/v1/chores/masters/{id} # Delete/archive master chore
POST   /api/v1/chores/masters/{id}/approve  # Approve pending master
POST   /api/v1/chores/instances/{id}/claim  # Claim instance
POST   /api/v1/chores/instances/{id}/assign # Assign instance
PUT    /api/v1/chores/instances/{id}/status # Update instance status
POST   /api/v1/chores/categories   # Create category
POST   /api/v1/chores/tags         # Create tag
```

**app/api/deps.py** — Add dependency aliases:
```python
ChoresRepositoryDep = Annotated[ChoresRepository, Depends(get_chores_repository)]
ChoresServiceDep = Annotated[ChoresService, Depends(get_chores_service)]
```

**app/core/container.py** — Add factory functions:
```python
@lru_cache()
def get_chores_repository() -> ChoresRepository:
    settings = get_settings()
    if settings.CHORES_USE_MOCK:
        return MockChoresRepository()
    return ChoresRepository(session=get_db_session())

@lru_cache()
def get_chores_service() -> ChoresService:
    return ChoresServiceImpl(repository=get_chores_repository())
```

**app/main.py** — Register routes:
```python
from app.api.routes import chores
app.include_router(chores.router, prefix="/api/v1")
```

### 5. Database Migration

**alembic/versions/** — New migration file:
- Create `chore_categories` table with seed data (Kitchen, Bathroom, Outdoor, Laundry, General)
- Create `chore_tags` table
- Create `master_chores` table
- Create `chore_tag_links` join table
- Create `chore_instances` table

### 6. Configuration

**app/core/config.py** — Add settings:
```python
CHORES_USE_MOCK: bool = Field(default=True)
```

**env/.env.dev** — Add:
```
CHORES_USE_MOCK=true
```

**env/.env.prod** — Add:
```
CHORES_USE_MOCK=false
```

### 7. Testing

**tests/unit/domain/chores/** — Pure business logic tests:
- Approval flow (auto-approve vs pending)
- Claim/assign mutual exclusivity
- Completion/signoff flow
- Instance generation from frequency

**tests/integration/chores/** — Repository tests with real SQLite:
- CRUD operations for categories, tags, masters, instances
- Tag relationship queries
- Filtering and sorting

**tests/api/chores/** — HTTP endpoint tests:
- All CRUD endpoints
- Request validation
- Error handling

---

## Frontend Architecture (dashy-kiosk)

### 1. Domain Layer (`src/domain/chores/`)

**types.ts** — TypeScript types (must match backend Pydantic models):
```typescript
export interface ChoreCategory {
  id: string;
  name: string;
}

export interface ChoreTag {
  id: string;
  name: string;
}

export interface MasterChore {
  id: string;
  name: string;
  category: ChoreCategory;
  tags: ChoreTag[];
  difficulty: number;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  estimated_minutes: number | null;
  due_time: string | null;
  due_date: string | null;
  expiration_behavior: 'disappear' | 'carry_over' | 'stay_visible' | 'convert_to_open';
  created_by: string;
  approved_by: string | null;
  status: 'pending_approval' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ChoreInstance {
  id: string;
  master_chore_id: string;
  period_start: string | null;
  period_end: string | null;
  status: 'open' | 'claimed' | 'assigned' | 'in_progress' | 'completed_pending_signoff' | 'completed' | 'overdue' | 'expiring_soon';
  claimed_by: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  completed_by: string | null;
  signoff_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  signed_off_at: string | null;
}

export interface ChoresData {
  categories: ChoreCategory[];
  tags: ChoreTag[];
  master_chores: MasterChore[];
  instances: ChoreInstance[];
}
```

**utils.ts** — Pure business logic:
- `isOpenPoolInstance(instance)` — checks if unclaimed/unassigned
- `isMemberInstance(instance, memberId)` — checks if claimed/assigned to member
- `getStatusBadgeColor(status)` — returns color token for status
- `formatDifficulty(level)` — returns display string
- `formatPeriod(periodStart, periodEnd)` — returns human-readable period

### 2. Feature Layer (`src/features/chores/`)

**components/ChoreBoard/** — Main board component:
```
src/features/chores/components/ChoreBoard/
  ChoreBoard.tsx          # Main board with metrics row + columns
  ChoreBoard.test.tsx
  index.ts
```

**components/MetricsBar/** — Top metrics row:
```
src/features/chores/components/MetricsBar/
  MetricsBar.tsx          # Compact metrics with collapsible handle
  MetricsBar.test.tsx
  index.ts
```

**components/OpenPoolColumn/** — Open pool column:
```
src/features/chores/components/OpenPoolColumn/
  OpenPoolColumn.tsx      # Conditionally rendered column
  OpenPoolColumn.test.tsx
  index.ts
```

**components/MemberColumn/** — Member column:
```
src/features/chores/components/MemberColumn/
  MemberColumn.tsx        # One per family member
  MemberColumn.test.tsx
  index.ts
```

**components/ChoreCard/** — Individual chore card:
```
src/features/chores/components/ChoreCard/
  ChoreCard.tsx           # Card with status badge, attribution
  ChoreCard.test.tsx
  index.ts
```

**components/ChoreModal/** — Detail/edit modal:
```
src/features/chores/components/ChoreModal/
  ChoreModal.tsx          # Create/edit chore modal
  ChoreModal.test.tsx
  index.ts
```

**hooks/useChores.ts** — Data fetching hook:
```typescript
export function useChores(): UseChoresReturn {
  // Uses useApi hook with ENDPOINTS.chores
  // Returns { data, loading, error, refetch, lastRefresh }
}
```

**hooks/useChoreActions.ts** — Mutation hook:
```typescript
export function useChoreActions(): UseChoreActionsReturn {
  // Returns functions: createMaster, claimInstance, assignInstance, updateStatus, etc.
  // Handles API calls and refetch
}
```

**views/ChoresView/** — Top-level view:
```
src/features/chores/views/ChoresView/
  ChoresView.tsx          # Composes ChoreBoard, fetches data
  ChoresView.test.tsx
  index.ts
```

### 3. API Integration

**shared/api/endpoints.ts** — Add to ENDPOINTS registry:
```typescript
export const ENDPOINTS = {
  // ... existing
  chores: {
    url: '/api/v1/chores',
    method: 'GET',
    refreshInterval: 60000, // 1 minute
    cacheTtl: 60000,
  },
} as const;
```

**types/index.ts** — Re-export chores types:
```typescript
export * from '@/domain/chores/types';
```

### 4. Navigation

**shared/config/navigation.ts** — Add chores to sidebar:
```typescript
export const NAV_ITEMS = [
  // ... existing
  { id: 'chores', label: 'Chores', icon: CheckSquare },
];
```

### 5. Design Tokens

**theme/tokens.ts** — Add chores-specific tokens:
```typescript
export const colors = {
  // ... existing
  choresStatusColors: {
    open: '#4A90E2',      // blue
    claimed: '#FBBF24',   // yellow
    assigned: '#9333EA',  // purple
    inProgress: '#F97316', // orange
    pendingSignoff: '#EC4899', // pink
    completed: '#10B981', // green
    overdue: '#EF4444',   // red
    expiringSoon: '#F59E0B', // amber
  },
};
```

### 6. Testing

**Unit tests** — Co-located with components/hooks:
- `ChoreCard.test.tsx` — renders status badges, attribution
- `ChoreBoard.test.tsx` — column layout, conditional rendering
- `useChores.test.ts` — data fetching, loading states

**Integration tests** — `src/test/integration/`:
- Full flow: create chore → claim → complete → signoff
- Open pool conditional rendering
- Metrics calculation

---

## Type Synchronization

Frontend types in `src/domain/chores/types.ts` must match backend Pydantic models in `app/api/models/chores.py` exactly. The `sync-types` skill documents drift detection via OpenAPI spec.

---

## Integration with Existing Systems

**Family members** — Already exists in `app/domain/family/` and `src/domain/family/`. Chores reference member IDs for `created_by`, `claimed_by`, `assigned_to`, etc.

**Database** — Uses existing SQLModel + Alembic setup. New tables added via migration.

**Cache** — Redis cache for `/api/v1/chores` endpoint with 60s TTL.

**Docker** — No new services needed. Existing kiosk + API + Redis setup handles it.

---

## Implementation Order

1. **Backend domain + infrastructure** — models, ports, services, mock adapter
2. **Backend persistence** — SQLModel tables, repository, Alembic migration
3. **Backend API** — routes, Pydantic models, dependency injection
4. **Backend tests** — unit, integration, API
5. **Frontend domain** — types, utils
6. **Frontend components** — ChoreCard, columns, board, modal
7. **Frontend hooks** — useChores, useChoreActions
8. **Frontend integration** — API endpoints, navigation, design tokens
9. **Frontend tests** — unit, component, integration
10. **Quality gate** — lint, typecheck, test, build
