---
name: add-docker-service
description: Add a new infrastructure service to docker compose — configure networking, volumes, health checks, and API integration.
---

# Add Docker Service

Add a new infrastructure service (database, message queue, monitoring, etc.) to Dashy's docker compose setup.

## When to use

- Adding PostgreSQL (already present — use as reference for new databases)
- Adding message queues (RabbitMQ, Redis Streams)
- Adding monitoring tools (Prometheus, Grafana)
- Adding any infrastructure dependency

## When NOT to use

- Adding Redis — already exists
- Adding application services (API/kiosk) — those exist

## Prerequisites

- Understand the service you're adding
- Know the Docker image name and version
- Understand networking requirements (internal vs external)
- Know persistence requirements (volumes)

## Steps

### 1. Add service to dev compose

Edit `compose/docker-compose.dev.yml`:

```yaml
name: dashy-dev

services:
  # ... existing services (redis, kiosk, api)
  
  # New service
  <service>:
    image: <image>:<tag>
    container_name: dashy-dev-<service>
    expose:
      - "<port>"
    volumes:
      - <service>-data:/data  # Persistence
    environment:
      - <SERVICE>_SETTING=value
    networks:
      - dashy-dev-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "<health-check-command>"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 2. Add service to prod compose

Edit `compose/docker-compose.prod.yml`:

```yaml
name: dashy-prod

services:
  # ... existing services
  
  # New service (same configuration as dev)
  <service>:
    image: <image>:<tag>
    container_name: dashy-prod-<service>
    expose:
      - "<port>"
    volumes:
      - <service>-data:/data
    environment:
      - <SERVICE>_SETTING=value
    networks:
      - dashy-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "<health-check-command>"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3. Add volume definition

Add to the `volumes` section at the bottom:

```yaml
volumes:
  redis-data:
  <service>-data:  # New volume
```

### 4. Update API dependencies

If API depends on the new service:

```yaml
services:
  api:
    # ... existing config
    depends_on:
      redis:
        condition: service_healthy
      <service>:
        condition: service_healthy  # Wait for service to be ready
    environment:
      - <SERVICE>_URL=<service>://<service>:<port>
```

### 5. Add environment variables

Add to API environment:

```yaml
services:
  api:
    environment:
      - <SERVICE>_URL=<service>://<service>:<port>
      - <SERVICE>_USERNAME=${<SERVICE>_USERNAME}
      - <SERVICE>_PASSWORD=${<SERVICE>_PASSWORD}
```

Add to `.env.example`:

```bash
# <Service> Configuration
<SERVICE>_URL=<service>://localhost:<port>
<SERVICE>_USERNAME=admin
<SERVICE>_PASSWORD=secret
```

### 6. Update API code

Add configuration to `app/config.py`:

```python
class Settings(BaseSettings):
    # ... existing settings
    
    # <Service> settings
    <SERVICE>_URL: str = "<service>://localhost:<port>"
    <SERVICE>_USERNAME: str = ""
    <SERVICE>_PASSWORD: str = ""
```

Create client/adapter if needed:

```python
# app/infrastructure/<service>/client.py
"""<Service> client for Dashy."""

from app.core.logging import get_logger

logger = get_logger(__name__)


class <Service>Client:
    """Client for <Service> service."""
    
    def __init__(self, url: str, username: str, password: str) -> None:
        """Initialize client.
        
        Args:
            url: Service URL.
            username: Authentication username.
            password: Authentication password.
        """
        self.url = url
        self.username = username
        self.password = password
        self.client = self._create_client()
    
    def _create_client(self):
        """Create service client."""
        # Initialize client library
        pass
```

### 7. Test the setup

```bash
# Start dev environment
make dev-up

# Check service is running
docker compose -f compose/docker-compose.dev.yml ps

# Check service logs
docker compose -f compose/docker-compose.dev.yml logs <service>

# Verify API can connect
docker compose -f compose/docker-compose.dev.yml exec api \
  uv run python -c "from app.config import settings; print(settings.<SERVICE>_URL)"
```

### 8. Add health check to API

If API depends on the service, add health check:

```python
# app/main.py
@app.get("/health")
async def health_check() -> dict:
    """Return service health status."""
    cache = await get_cache()
    
    # Check new service
    <service>_healthy = await check_<service>_health()
    
    return {
        "status": "ok" if <service>_healthy else "degraded",
        "environment": settings.ENVIRONMENT,
        "cache": {
            "connected": cache.is_connected,
        },
        "<service>": {
            "connected": <service>_healthy,
        },
    }
```

### 9. Update Makefile (if needed)

If the service needs special commands:

```makefile
# Add to Makefile
.PHONY: <service>-logs
<service>-logs:  ## View <service> logs
	docker compose -f compose/docker-compose.dev.yml logs -f <service>

.PHONY: <service>-shell
<service>-shell:  ## Open shell in <service> container
	docker compose -f compose/docker-compose.dev.yml exec <service> sh
```

### 10. Update documentation

Add to `README.md`:

```markdown
## Infrastructure Services

Dashy uses the following infrastructure services:

- **Redis**: Cache layer (port 6379)
- **<Service>**: <Purpose> (port <port>)

All services are automatically started with `make dev-up`.
```

## Examples

### PostgreSQL (already configured — reference)

PostgreSQL 18 is already set up in both dev and prod compose files. Key configuration:

```yaml
# compose/docker-compose.dev.yml
services:
  postgres:
    image: postgres:18-alpine
    container_name: dashy-dev-postgres
    expose:
      - "5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    networks:
      - dashy-dev-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

API configuration uses individual `POSTGRES_*` settings (not a single URL):

```python
# app/config.py — constructs URL from individual settings
POSTGRES_USER: str
POSTGRES_PASSWORD: str
POSTGRES_DB: str
POSTGRES_HOST: str = "postgres"
POSTGRES_PORT: int = 5432
```

### RabbitMQ (message queue)

```yaml
services:
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: dashy-dev-rabbitmq
    expose:
      - "5672"   # AMQP protocol
      - "15672"  # Management UI
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    environment:
      - RABBITMQ_DEFAULT_USER=dashy
      - RABBITMQ_DEFAULT_PASS=dashy
    networks:
      - dashy-dev-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  rabbitmq-data:
```

### Prometheus (monitoring)

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: dashy-dev-prometheus
    expose:
      - "9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - dashy-dev-network
    restart: unless-stopped

volumes:
  prometheus-data:
```

## Networking patterns

### Internal only (API can access)

```yaml
services:
  <service>:
    networks:
      - dashy-dev-network  # Internal network
```

### External access (via Traefik)

```yaml
services:
  <service>:
    networks:
      - dashy-dev-network
      - traefik-public  # Traefik network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.<service>.rule=Host(`<service>.dashy.local`)"
      - "traefik.http.routers.<service>.entrypoints=websecure"
      - "traefik.http.routers.<service>.tls=true"
      - "traefik.http.services.<service>.loadbalancer.server.port=<port>"
```

## Checklist

- [ ] Service added to `docker-compose.dev.yml`
- [ ] Service added to `docker-compose.prod.yml`
- [ ] Volume defined for persistence
- [ ] API `depends_on` updated (if needed)
- [ ] Environment variables added
- [ ] API configuration updated
- [ ] Client/adapter created (if needed)
- [ ] Service tested and accessible
- [ ] Health check added to `/health` endpoint
- [ ] Makefile updated (if needed)
- [ ] Documentation updated

## Notes

- Use Alpine images when available (smaller size)
- Always add health checks for dependencies
- Use internal networks for services not exposed externally
- Volume-mount data for persistence across restarts
- Match dev and prod configurations
- Test with `make dev-up` before committing
- All `docker compose exec` commands for the API container must use `uv run` prefix (e.g., `uv run python -c "..."`)
- If adding a new database, integrate with the existing Alembic migration system — see `make migrate-create` and the `add-db-migration` skill in dashy-api
