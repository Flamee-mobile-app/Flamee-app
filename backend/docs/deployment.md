# Deployment: Local → Cloud

> Hướng dẫn từ setup local đến deploy lên cloud (Railway/Render/Fly.io).

---

## 1. Local Setup (Development)

### 1.1. Yêu cầu
- Python 3.11+
- Git
- (Tuỳ chọn) OpenAI API key

### 1.2. Setup project

```bash
# Clone repo
cd D:\Flamee-app
cd backend

# Tạo virtual env
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Cài dependencies
pip install -r requirements.txt

# Copy env file
copy .env.example .env
# Sửa .env: thêm OPENAI_API_KEY nếu có
```

### 1.3. requirements.txt (tối thiểu cho MVP)

```txt
# Core
fastapi==0.115.0
uvicorn[standard]==0.32.0
pydantic==2.9.0
pydantic-settings==2.5.0
python-multipart==0.0.12

# Database
sqlalchemy==2.0.35
alembic==1.13.3
# SQLite không cần driver (Python built-in)
# Postgres sẽ thêm: psycopg2-binary==2.9.9

# Auth
pyjwt==2.9.0
passlib[bcrypt]==1.7.4

# AI
httpx==0.27.2

# Background tasks (dev: APScheduler)
apscheduler==3.10.4

# Test
pytest==8.3.3
pytest-asyncio==0.24.0
```

### 1.4. .env.example

```bash
# App
FLAMEE_APP_ENV=development
FLAMEE_DEBUG=true
FLAMEE_SECRET_KEY=change-me-in-production-min-32-chars

# Database (SQLite local)
FLAMEE_DATABASE_URL=sqlite:///./flamee.db

# AI Provider
FLAMEE_AI_PROVIDER=openai          # openai | anthropic | ollama
FLAMEE_AI_CHAT_MODEL=gpt-4o-mini  # tuỳ provider
FLAMEE_AI_TIMEOUT_SECONDS=30

# OpenAI (chọn 1 trong các provider)
FLAMEE_OPENAI_API_KEY=sk-xxx

# Anthropic (alternative)
# FLAMEE_AI_PROVIDER=anthropic
# FLAMEE_AI_CHAT_MODEL=claude-3-5-haiku-20241022
# FLAMEE_ANTHROPIC_API_KEY=sk-ant-xxx

# Ollama (local)
# FLAMEE_AI_PROVIDER=ollama
# FLAMEE_AI_CHAT_MODEL=llama3.2
# FLAMEE_OLLAMA_BASE_URL=http://localhost:11434

# CORS
FLAMEE_CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Upload (local: thư mục, cloud: S3)
FLAMEE_UPLOAD_DIR=./uploads
FLAMEE_MAX_UPLOAD_SIZE_MB=10
```

### 1.5. Chạy app

```bash
# Seed data (date plan templates, ...)
python -m app.scripts.seed_data

# Chạy dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Mở browser:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 2. Database Migration

### 2.1. Local (SQLite) — MVP đơn giản

Dùng `Base.metadata.create_all()` trong startup event. Không cần Alembic cho dev.

```python
# app/main.py
from app.database import Base, engine
from app.models import User, Couple, Memory, Mood, DatePlan  # import all models

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
```

### 2.2. Production (PostgreSQL) — dùng Alembic

```bash
# Khởi tạo Alembic (chỉ 1 lần)
alembic init alembic

# Cấu hình alembic.ini + env.py để dùng SQLAlchemy models

# Generate migration
alembic revision --autogenerate -m "initial schema"

# Apply
alembic upgrade head

# Rollback
alembic downgrade -1
```

**Lưu ý**: Khi deploy cloud, KHÔNG chạy `create_all()` trên prod. Chỉ dùng Alembic.

---

## 3. Deploy lên Cloud

### 3.1. Tổng quan: 3 lựa chọn phổ biến

| Platform | Free tier | Độ dễ | Phù hợp |
|----------|-----------|--------|---------|
| **Railway** | $5 credit/tháng | ⭐⭐⭐⭐⭐ | MVP, startup |
| **Render** | 750h/tháng (web) | ⭐⭐⭐⭐ | MVP, production |
| **Fly.io** | Free tier nhỏ | ⭐⭐⭐ | Global deployment |

→ **Khuyến nghị MVP**: Railway (đơn giản nhất, tích hợp sẵn Postgres).

### 3.2. Chuẩn bị

#### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App
COPY . .

# Create upload dir
RUN mkdir -p uploads

# Run
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### .dockerignore
```
venv/
__pycache__/
*.pyc
.env
uploads/
*.db
.git/
```

### 3.3. Deploy lên Railway (khuyến nghị)

#### Bước 1: Tạo project
- Vào https://railway.app → New Project → Deploy from GitHub.
- Chọn repo Flamee.

#### Bước 2: Add PostgreSQL
- Trong project → New → Database → PostgreSQL.
- Railway tự tạo `DATABASE_URL`.

#### Bước 3: Config Environment Variables
Trong service backend → Variables, thêm:
```
FLAMEE_APP_ENV=production
FLAMEE_DEBUG=false
FLAMEE_SECRET_KEY=<random-32-chars>
FLAMEE_DATABASE_URL=${{Postgres.DATABASE_URL}}   # Railway variable ref
FLAMEE_AI_PROVIDER=openai
FLAMEE_AI_CHAT_MODEL=gpt-4o-mini
FLAMEE_OPENAI_API_KEY=sk-xxx
FLAMEE_CORS_ORIGINS=https://your-mobile-app-domain.com
```

#### Bước 4: Config Build
- Railway tự detect Dockerfile.
- Hoặc dùng Procfile: `web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### Bước 5: Add Alembic migration
- Trong railway.toml hoặc Procfile, thêm release command:
```toml
[deploy]
releaseCommand = "alembic upgrade head"
```

#### Bước 6: Deploy
- Push code → Railway auto-deploy.
- Domain: `https://<your-app>.up.railway.app`

### 3.4. Deploy lên Render

Tương tự Railway:
1. Tạo Web Service từ GitHub.
2. Add PostgreSQL Database.
3. Config env vars.
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Release command (qua Build Hook): `alembic upgrade head`

### 3.5. Deploy lên Fly.io

```bash
# Install flyctl
# https://fly.io/docs/hands-on/install-flyctl/

# Login
flyctl auth login

# Launch
cd backend
flyctl launch

# Add Postgres
flyctl postgres create
flyctl postgres attach <postgres-app-name>

# Set secrets
flyctl secrets set \
  FLAMEE_SECRET_KEY=xxx \
  FLAMEE_OPENAI_API_KEY=sk-xxx \
  FLAMEE_AI_PROVIDER=openai

# Deploy
flyctl deploy
```

---

## 4. Môi trường (Environment)

### 4.1. Tách biệt rõ ràng

| Env | Database | AI Provider | Upload Storage |
|-----|----------|-------------|----------------|
| **dev** | SQLite | OpenAI / Ollama | Local folder |
| **staging** | PostgreSQL | OpenAI | S3 / R2 |
| **prod** | PostgreSQL | OpenAI / Anthropic | S3 / R2 |

### 4.2. Config pattern

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_env: str = "development"  # development | staging | production
    debug: bool = True
    secret_key: str

    # DB - swap qua env
    database_url: str = "sqlite:///./flamee.db"

    # AI - swap qua env
    ai_provider: str = "openai"
    ai_chat_model: str = "gpt-4o-mini"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    ollama_base_url: str = "http://localhost:11434"

    # Upload
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    class Config:
        env_prefix = "FLAMEE_"
        env_file = ".env"
        case_sensitive = False
```

---

## 5. Upload files - Local vs Cloud

### 5.1. MVP (Local)
```python
# services/upload_service.py
import shutil
from pathlib import Path

class UploadService:
    def __init__(self, upload_dir: str):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save(self, file_content: bytes, filename: str) -> str:
        file_path = self.upload_dir / filename
        file_path.write_bytes(file_content)
        return f"/uploads/{filename}"
```

API endpoint serve file:
```python
# app/main.py
from fastapi.staticfiles import StaticFiles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
```

URL lưu trong DB: `/uploads/abc123.jpg` → truy cập qua `http://localhost:8000/uploads/abc123.jpg`.

### 5.2. Cloud (S3/Cloudflare R2)

Phase 2. Pattern:
```python
# services/storage.py
from abc import ABC, abstractmethod

class Storage(ABC):
    @abstractmethod
    def upload(self, content: bytes, filename: str) -> str:
        """Return public URL."""
        ...

class LocalStorage(Storage):
    # như trên

class S3Storage(Storage):
    def __init__(self, bucket: str, region: str):
        self.bucket = bucket
        # ...

    def upload(self, content: bytes, filename: str) -> str:
        # upload lên S3, return CDN URL
        ...

# app/main.py
def get_storage() -> Storage:
    if settings.is_production:
        return S3Storage(...)
    return LocalStorage(settings.upload_dir)
```

---

## 6. Background Jobs (Cron)

### 6.1. Dev: APScheduler (chạy trong app process)

```python
# app/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Chạy mood analysis mỗi tối 21:00
    scheduler.add_job(
        analyze_all_couples_mood,
        "cron",
        hour=21,
        minute=0,
    )
    # Memory reminder mỗi sáng 08:00
    scheduler.add_job(
        check_memory_reminders,
        "cron",
        hour=8,
        minute=0,
    )
    scheduler.start()
```

```python
# app/main.py
from app.scheduler import start_scheduler

@app.on_event("startup")
async def on_startup():
    Base.metadata.create_all(bind=engine)
    if not settings.is_production:
        start_scheduler()
```

### 6.2. Production: Railway Cron / Render Cron Jobs / External Trigger

Cách đơn giản nhất cho MVP:
- **Railway Cron Plugin**: thêm cron job trỏ vào `/internal/*` endpoints.
- **Render Cron**: tương tự.
- **External (free)**: cron-job.org gọi HTTP vào giờ cố định.

**Lý do tách `/internal/*`**: có thể chạy được cả trên local (APScheduler) lẫn cloud (external cron) mà không cần đổi code.

---

## 7. Monitoring & Logging

### 7.1. Logging

```python
# app/core/logging.py
import structlog

def setup_logging():
    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(),  # dev
            # structlog.processors.JSONRenderer(),  # prod
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
    )
```

Cloud platform (Railway/Render) sẽ capture stdout → dashboard.

### 7.2. Health check endpoint

```python
# app/main.py
@app.get("/health")
def health():
    return {
        "status": "ok",
        "env": settings.app_env,
        "version": "0.1.0",
        "ai_provider": settings.ai_provider,
    }
```

Cloud platforms dùng endpoint này để check app còn sống không.

---

## 8. Security Checklist

- [x] `SECRET_KEY` random 32+ chars, không commit vào git
- [x] `DEBUG=false` ở production
- [x] CORS config đúng (không dùng `*` ở prod)
- [x] Password hash bằng bcrypt (không lưu plain text)
- [x] JWT có expiry
- [x] Internal endpoints có secret token
- [x] HTTPS (cloud platform tự lo)
- [x] Validate input ở Pydantic (không tin tưởng client)
- [x] Upload: validate mime type + size
- [x] SQL injection: SQLAlchemy ORM đã lo
- [ ] Rate limit (phase 2)
- [ ] CSRF (không cần cho API stateless)

---

## 9. Cost Estimate (MVP)

| Service | Free tier | Estimate |
|---------|-----------|----------|
| Railway hosting | $5 credit/tháng | $0 nếu dùng free |
| Railway Postgres | $5/0.5GB/tháng | $0-5 |
| OpenAI API (gpt-4o-mini) | Pay-as-go | $5-20/tháng (100-500 users) |
| **Tổng** | | **~$10-25/tháng** |

→ Có thể chạy MVP với chi phí cực thấp, scale dần.

---

## 10. Migration Roadmap (sau MVP)

Khi user tăng:
1. **Add Redis**: cache AI results, rate limit.
2. **Add S3/Cloudflare R2**: upload files.
3. **Add Celery**: background jobs (thay APScheduler).
4. **Add CDN (Cloudflare)**: static assets.
5. **Add Sentry**: error tracking.
6. **Add PostHog/Amplitude**: analytics.
7. **Horizontal scale**: stateless API → nhiều instances.

Nhưng MVP **không cần** những thứ này. Keep it simple.