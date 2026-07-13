# Flamee — API Reference

Tài liệu tham chiếu chi tiết cho REST API của Flask clone "Flamee" (ứng dụng nhật ký đôi — MVP Phase 1).

Phiên bản: **0.1.0** · Ngày: 2026-07-10 · Stack: **FastAPI 0.118 + Python 3.14** · Storage backend: **mock** (SQLite / Postgres sẽ được swap in Phase 2).

Tất cả dữ liệu dưới đây được dump trực tiếp từ runtime endpoint `/openapi.json` của app, không suy diễn. Verify bằng:

```bash
python backend/run.py                       # http://127.0.0.1:8000/docs
python backend/run.py                       # http://127.0.0.1:8000/openapi.json
```

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tong-quan-kien-truc)
2. [Quy ước chung](#2-quy-uoc-chung)
3. [Auth & phân quyền](#3-auth--phan-quyen)
4. [Base URL & endpoints](#4-base-url--endpoints)
5. [Schemas tham chiếu](#5-schemas-tham-chieu)
6. [Chi tiết từng nhóm endpoint](#6-chi-tiet-tung-nhom-endpoint)
7. [Mã lỗi](#7-ma-loi)
8. [Mô hình dữ liệu nội bộ](#8-mo-hinh-du-lieu-noi-bo)
9. [Demo accounts & seed data](#9-demo-accounts--seed-data)

---

## 1. Tổng quan kiến trúc

### Layer tách biệt

```
┌─────────────────────────────────────────────────────────────┐
│  app/api/      ← FastAPI routers (HTTP layer)              │
│    ├── auth.py    → /api/v1/auth/*                          │
│    ├── couple.py  → /api/v1/couple/*                        │
│    └── memory.py  → /api/v1/memories/*                      │
├─────────────────────────────────────────────────────────────┤
│  app/services/ ← Business logic (no HTTP / no DB)           │
│    ├── auth_service.py     : register, login, OTP, profile  │
│    ├── couple_service.py   : invite + couple lifecycle      │
│    └── memory_service.py   : memory CRUD + image upload     │
├─────────────────────────────────────────────────────────────┤
│  app/repositories/ ← Generic BaseRepository + typed repos  │
│    ├── base.py      ← BaseRepository[T] (CRUD + find_one)  │
│    ├── user_repo.py       : get_by_email                    │
│    ├── couple_repo.py     : find_by_user / find_by_couple /│
│    │                       find_latest_by_user / get_by_code│
│    └── memory_repo.py     : find_by_couple (filter),        │
│                            find_by_memory                   │
├─────────────────────────────────────────────────────────────┤
│  app/storage/   ← Pluggable backends (Phase 0: mock)        │
│    ├── base.py            : Storage ABC                     │
│    ├── mock_storage.py    : in-memory + json persistence    │
│    └── factory.py         : FLAMEE_STORAGE=mock|sqlite|...  │
├─────────────────────────────────────────────────────────────┤
│  app/models/    ← Pure dataclasses (User, Couple, Memory…)  │
│  app/schemas/   ← Pydantic v2 (request / response DTOs)    │
│  app/core/      ← security, exceptions, constants, errors  │
│  app/ai/        ← AI provider interface (mock for now)      │
└─────────────────────────────────────────────────────────────┘
```

### Storage contract

Mọi thứ đi qua `Storage` ABC (xem `app/storage/base.py`):

| Method                                            | Mục đích                                       |
|---------------------------------------------------|------------------------------------------------|
| `get(table, key)`                                 | Lấy 1 record theo `id` (hoặc `None`)           |
| `find(table, where=None)`                         | Lấy tất cả record match filter                 |
| `find_one(table, where)`                          | Lấy record đầu tiên match                       |
| `insert(table, record)`                           | Tạo mới — bắt buộc có field `id`              |
| `update(table, key, patch)`                       | Merge patch vào record hiện tại                |
| `delete(table, key)`                              | Xóa theo `id`                                  |
| `count(table, where=None)`                        | Đếm match                                       |
| `clear(table=None)`                               | Xóa toàn bộ (chỉ dùng trong test)              |

Bộ lọc `where` (xem `_COMPARATORS`):

```python
{"field": value}                  # exact equality
{"field__in": [v1, v2, ...]}      # membership
{"field__gt": v}                  # >
{"field__gte": v}                 # >=
{"field__lt": v}                  # <
{"field__lte": v}                 # <=
# Multiple keys are AND-combined.
```

### Tables (collections)

Đặt tên trong `app/core/constants.py`:

```python
USERS          = "users"
COUPLES        = "couples"
COUPLE_MEMBERS = "couple_members"
INVITE_CODES   = "invite_codes"
MEMORIES       = "memories"
MEMORY_IMAGES  = "memory_images"
```

---

## 2. Quy ước chung

### 2.1 Request / response envelope

**Tất cả endpoint** (kể cả lỗi) đều wrap trong 2 kiểu envelope:

**Success:**

```json
{
  "success": true,
  "data": <endpoint-specific payload>
}
```

Helper: `app.api.response.ok(data) → {"success": True, "data": data}` (xem `app/api/response.py`).

**Domain error:**

```json
{
  "success": false,
  "error": {
    "code": "conflict",
    "message": "Email đã tồn tại"
  }
}
```

Helper: `domain_error_handler()` ở `app/core/handlers.py` đổi mọi `DomainError` thành response này.

**HTTPException / FastAPI validation errors:** trả về cấu trúc mặc định của FastAPI (`{ "detail": [...] }`), **không** qua envelope.

### 2.2 Status codes

| Code | Ý nghĩa                                                |
|------|--------------------------------------------------------|
| 200  | OK (default)                                           |
| 201  | Created — áp dụng cho register / invite / memory        |
| 204  | No Content — cho DELETE memory / image                  |
| 400  | Validation error (Pydantic / domain `ValidationError`)  |
| 401  | Missing / invalid / expired token (`AuthError`)         |
| 403  | Forbidden (`ForbiddenError`) — hiện chưa route nào dùng |
| 404  | Not found (`NotFoundError`)                            |
| 409  | Conflict — duplicate / state conflict (`ConflictError`) |
| 422  | FastAPI validation (request body sai schema)            |

### 2.3 Content-Type

- Request: `application/json` (mặc định) hoặc `multipart/form-data` cho upload ảnh
- Response: `application/json; charset=utf-8`
- Tất cả timestamp: ISO-8601 UTC (e.g. `"2026-07-10T10:23:45.123456+00:00"`)
- Tất cả UUID: lowercase `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 2.4 Datetime format

- Date-only (anniversary, memory_date): `YYYY-MM-DD` (e.g. `"2024-03-15"`)
- Datetime (created_at, expires_at): ISO-8601 với timezone UTC

Helper: `to_iso(dt)` ở `app/utils/time.py` — trả về ISO chuẩn có `+00:00`.

### 2.5 Limit / quota

- **Password**: 6–128 chars (min 6 enforced ở register, change-password, reset-password)
- **JWT TTL**: 24 giờ (config qua `FLAMEE_JWT_TTL_HOURS`)
- **OTP TTL**: 600 giây = 10 phút (config qua `FLAMEE_OTP_TTL_SECONDS`)
- **Invite code TTL**: 168 giờ = 7 ngày (config qua `FLAMEE_INVITE_CODE_TTL_HOURS`)
- **Upload ảnh**: max `FLAMEE_MAX_UPLOAD_SIZE_MB=5` MB (mặc định, đổi qua env)
- **Invite code format**: prefix `FLM` + 6 alphanumeric chars (e.g. `FLM3K7X2`), uppercase letters + digits

### 2.6 Validation rules chung

| Field               | Rule                                                         |
|---------------------|--------------------------------------------------------------|
| `email`             | Pydantic `EmailStr` (RFC-valid, lowercase canonical)         |
| `password`          | `6 ≤ len ≤ 128`                                              |
| `title`             | `1 ≤ len ≤ 200` (memory title)                               |
| `description`       | `len ≤ 4000` (memory)                                        |
| `location`          | `len ≤ 200`                                                  |
| `avatar_url`        | `len ≤ 512` (trim whitespace, rỗng → null)                  |
| `memory_date`       | `4 ≤ len ≤ 32` (free-form string, không validate format)     |
| `category`          | `1 trong 7 giá trị MemoryCategory enum` (xem §5.5)           |
| `anniversary`       | `len ≤ 32` (string), format free                             |
| `gender`            | `len ≤ 20` (string free-form)                                |
| `full_name`         | `1 ≤ len ≤ 120`                                              |

---

## 3. Auth & phân quyền

### 3.1 Header chuẩn cho protected endpoints

```
Authorization: Bearer <access_token>
```

Token là JWT HS256, payload chứa:

```json
{
  "sub": "<user_id>",
  "iat": <unix epoch>,
  "exp": <unix epoch, +24h>
}
```

Xem `app/core/security.py::create_access_token` / `decode_token`.

### 3.2 Current-user resolution (`get_current_user`)

Đặt tại `app/api/deps.py`. Mọi protected endpoint inject `current: dict = Depends(get_current_user)`, trả về raw user record (dict) với các field:

```
{
  "id", "email", "full_name", "avatar_url",
  "birth_date", "gender", "couple_id",
  "created_at", "updated_at", "password_hash"
}
```

(có chứa `password_hash` ở raw record — bị strip đi trong `UserResponse`.)

### 3.3 Couple-member check (`get_current_couple_member`)

Inject `(user_record, couple_member_record)`. Raise `NotFoundError("User is not part of any couple")` nếu user chưa ghép đôi.

**Lưu ý thực tế:** các endpoint `memories/*` không dùng dependency này; thay vào đó dùng helper `_ensure_couple_id(current, storage)` ngay trong router để raise `NotFoundError("Bạn chưa thuộc couple nào")`.

### 3.4 Quyền truy cập tài nguyên

- User chỉ thấy / sửa / xóa **couple của mình**
- Memory được guard bằng `memory.couple_id == current couple_id` (kiểm tra trong service)
- Không có cross-couple access: nếu memory `couple_id` khác `couple_id` của caller → `NotFoundError("Memory không tồn tại")` (404, không leak existence)

### 3.5 Cross-user consent

Hiện tại **mọi endpoint authenticated đều cho phép user gọi**, không phân biệt partner1/partner2. Nếu cần RBAC chi tiết hơn (vd chỉ partner1 được update anniversary) — chưa có.

---

## 4. Base URL & endpoints

**Local (uvicorn reload):**

```
http://127.0.0.1:8000      ← dev
http://0.0.0.0:8000        ← bind interface (không truy cập được từ trình duyệt)
http://localhost:8000      ← alias 127.0.0.1
```

**qua ngrok (nếu đang chạy):**

```
https://<random>.ngrok-free.dev
```

(URL này trỏ thẳng về localhost, dùng cho test từ Postman / mobile client.)

**Swagger UI:** `/docs` (render OpenAPI 3.1) · **OpenAPI JSON:** `/openapi.json` · **ReDoc:** `/redoc`

### 4.1 Bảng tổng hợp (20 endpoint + 1 health)

Lấy trực tiếp từ runtime OpenAPI spec:

| #   | Method | Path                                          | Tag        | Auth? | Mã trạng thái                                    |
|-----|--------|-----------------------------------------------|------------|-------|--------------------------------------------------|
| 1   | POST   | `/api/v1/auth/register`                       | auth       | No    | 201 / 409                                       |
| 2   | POST   | `/api/v1/auth/login`                          | auth       | No    | 200 / 401                                       |
| 3   | GET    | `/api/v1/auth/me`                             | auth       | Yes   | 200 / 401                                       |
| 4   | PUT    | `/api/v1/auth/me`                             | auth       | Yes   | 200 / 400                                       |
| 5   | POST   | `/api/v1/auth/change-password`                | auth       | Yes   | 200 / 401 / 400                                 |
| 6   | POST   | `/api/v1/auth/forgot-password`                | auth       | No    | 200                                             |
| 7   | POST   | `/api/v1/auth/reset-password`                 | auth       | No    | 200 / 401                                       |
| 8   | POST   | `/api/v1/couple/invite-code`                  | couple     | Yes   | 201                                             |
| 9   | GET    | `/api/v1/couple/invite-code`                  | couple     | Yes   | 200                                             |
| 10  | POST   | `/api/v1/couple/accept-invite`                | couple     | Yes   | 200 / 404 / 409 / 400                           |
| 11  | GET    | `/api/v1/couple`                              | couple     | Yes   | 200 / 404                                       |
| 12  | PUT    | `/api/v1/couple/anniversary`                  | couple     | Yes   | 200 / 404                                       |
| 13  | GET    | `/api/v1/memories`                            | memories   | Yes   | 200 / 404                                       |
| 14  | POST   | `/api/v1/memories`                            | memories   | Yes   | 201 / 404                                       |
| 15  | GET    | `/api/v1/memories/{memory_id}`                | memories   | Yes   | 200 / 404                                       |
| 16  | PUT    | `/api/v1/memories/{memory_id}`                | memories   | Yes   | 200 / 404                                       |
| 17  | DELETE | `/api/v1/memories/{memory_id}`                | memories   | Yes   | 204 / 404                                       |
| 18  | POST   | `/api/v1/memories/{memory_id}/images`         | memories   | Yes   | 201 / 404 / 400                                 |
| 19  | DELETE | `/api/v1/memories/{memory_id}/images/{image_id}` | memories | Yes   | 204 / 404                                       |
| 20  | GET    | `/health`                                     | default    | No    | 200                                             |

---

## 5. Schemas tham chiếu

Tất cả schema được định nghĩa trong `app/schemas/`. OpenAPI dump được verify trùng khớp.

### 5.1 UserResponse

```json
{
  "id": "uuid",
  "email": "alice@demo.com",
  "full_name": "Alice",
  "avatar_url": null,
  "couple_id": "uuid|null",
  "created_at": "ISO-8601 string"
}
```

**Không bao gồm**: `password_hash`, `birth_date`, `gender`, `updated_at` (cố ý, để tránh leak).

File nguồn: `app/schemas/auth.py`.

### 5.2 AuthResponse

```json
{
  "user": { /* UserResponse */ },
  "access_token": "eyJhbGciOiJIUzI1..."
}
```

### 5.3 RegisterRequest

```json
{
  "email": "alice@demo.com",
  "password": "Demo1234!",
  "full_name": "Alice"
}
```

Validation: `email` hợp lệ; `password` 6–128; `full_name` 1–120.

### 5.4 LoginRequest

```json
{ "email": "alice@demo.com", "password": "Demo1234!" }
```

### 5.5 MemoryCategory enum

Từ `app/core/constants.py::MemoryCategory`:

```
first_date | anniversary | trip | milestone | gift | moment | other
```

Schema `CreateMemoryRequest` / `UpdateMemoryRequest` normalise input: lower-case + thay `-` / space bằng `_`. `"first-date"` → `"first_date"`, `"Anniversary"` → `"anniversary"`. Nếu không khớp bất kỳ giá trị enum nào → 422 (Pydantic validation).

### 5.6 CreateMemoryRequest

```json
{
  "title": "First date at the coffee shop",
  "description": "We talked for hours over lattes.",
  "category": "first_date",
  "memory_date": "2024-03-15",
  "location": "The Coffee House",
  "is_pinned": false,
  "reminder_enabled": false
}
```

`title` required, `description` / `location` optional. `memory_date` required 4–32 chars (free-form).

### 5.7 UpdateMemoryRequest

Tất cả field **optional** (`exclude_unset` semantics: chỉ field nào gửi mới được patch):

```json
{
  "title": "New title",
  "category": "trip",
  "is_pinned": true
}
```

### 5.8 MemoryImageResponse

```json
{
  "id": "uuid",
  "url": "data:image/png;base64,...",
  "thumbnail_url": "data:image/png;base64,...",
  "width": null,
  "height": null,
  "uploaded_by": "uuid",
  "created_at": "ISO-8601 string"
}
```

Trong MVP, `width` / `height` luôn `null` và `url` = `thumbnail_url` = data URL base64 (chưa có resize pipeline).

### 5.9 MemoryListItem

```json
{
  "id": "uuid",
  "title": "...",
  "category": "first_date",
  "memory_date": "2024-03-15",
  "location": "...",
  "is_pinned": false,
  "thumbnail_url": "data:...|null",
  "image_count": 0
}
```

### 5.10 MemoryListResponse

```json
{
  "items": [/* MemoryListItem[] */],
  "total": 5
}
```

### 5.11 MemoryResponse (full)

```json
{
  "id": "uuid",
  "title": "...",
  "description": "...",
  "category": "first_date",
  "memory_date": "2024-03-15",
  "location": "...",
  "is_pinned": false,
  "reminder_enabled": false,
  "created_by": "uuid",
  "created_at": "ISO-8601 string",
  "updated_at": "ISO-8601 string",
  "images": [/* MemoryImageResponse[] */]
}
```

### 5.12 CoupleResponse

```json
{
  "id": "uuid",
  "partner1": {
    "id": "uuid",
    "full_name": "Alice",
    "avatar_url": null
  },
  "partner2": {
    "id": "uuid",
    "full_name": "Bob",
    "avatar_url": null
  },
  "anniversary": "2024-03-15",
  "created_at": "ISO-8601 string",
  "status": "active",
  "my_role": "partner1|partner2"
}
```

`partner1` luôn là người tạo invite, `partner2` là người accept. `my_role` cho biết caller thuộc role nào. `status` luôn `"active"` ở MVP (chưa có flow dissolve).

### 5.13 CreateInviteResponse / GetInviteResponse

```json
{
  "code": "FLM3K7X2",
  "expires_at": "2026-07-17T10:23:45.123456+00:00",
  "status": "pending|accepted|expired|cancelled",
  "is_pending": true
}
```

`is_pending = status == "pending"` (helper convenience).

### 5.14 AcceptInviteRequest

```json
{ "code": "FLM3K7X2" }
```

### 5.15 UpdateAnniversaryRequest

```json
{ "anniversary": "2024-03-15" }
```

`anniversary: str | null` — gửi `null` để xóa.

### 5.16 ChangePasswordRequest

```json
{ "current_password": "OldPass1", "new_password": "NewPass2" }
```

### 5.17 ForgotPasswordRequest

```json
{ "email": "alice@demo.com" }
```

### 5.18 ForgotPasswordResponse

```json
{ "otp": "482915", "expires_in": 600 }
```

**Trong MVP**, OTP trả về trực tiếp trong response (không gửi email). Chỉ dành cho dev / test. Production sẽ phải gửi qua email service.

### 5.19 ResetPasswordRequest

```json
{ "email": "alice@demo.com", "otp": "482915", "new_password": "NewPass2" }
```

### 5.20 UpdateProfileRequest

Tất cả field optional (giống UpdateMemoryRequest, dùng `exclude_unset` semantics):

```json
{
  "full_name": "Alice B.",
  "avatar_url": "https://...",
  "birth_date": "1995-04-12",
  "gender": "female"
}
```

### 5.21 HTTPValidationError (FastAPI mặc định)

Khi body sai schema, response **không** qua envelope:

```json
{ "detail": [ { "loc": [...], "msg": "...", "type": "..." } ] }
```

---

## 6. Chi tiết từng nhóm endpoint

### 6.1 Auth endpoints (`app/api/auth.py`)

#### 6.1.1 POST `/api/v1/auth/register`

Tạo user mới, trả về token luôn (auto-login).

**Request body** (`RegisterRequest`):

```json
{ "email": "alice@demo.com", "password": "Demo1234!", "full_name": "Alice" }
```

**Success 201**:

```json
{
  "success": true,
  "data": {
    "user": { /* UserResponse */ },
    "access_token": "eyJ..."
  }
}
```

**Errors**:

| Code | Condition                                  | Body                |
|------|--------------------------------------------|---------------------|
| 409  | Email đã tồn tại (`ConflictError`)         | `{success:false, error:{code:"conflict", message:"Email đã tồn tại"}}` |
| 422  | Body sai schema (email không hợp lệ, …)    | FastAPI default detail array |

**Behavior**:

- Hash password với bcrypt (round 12) qua `passlib.context.CryptContext`. Xem `app/core/security.py::hash_password`.
- Tạo UUID cho `id` qua `app/utils/ids.py::generate_uuid`.
- JWT có `iat`/`exp` theo `FLAMEE_JWT_TTL_HOURS` (default 24h).

#### 6.1.2 POST `/api/v1/auth/login`

**Request body** (`LoginRequest`):

```json
{ "email": "alice@demo.com", "password": "Demo1234!" }
```

**Success 200**: same shape như register.

**Errors**:

| Code | Condition                                                    | Body                                                              |
|------|--------------------------------------------------------------|-------------------------------------------------------------------|
| 401  | Sai email hoặc password (`AuthError`)                       | `{success:false, error:{code:"unauthorized", message:"Email hoặc mật khẩu không đúng"}}` |
| 422  | Body sai schema                                              | (default)                                                          |

#### 6.1.3 GET `/api/v1/auth/me`

**Headers**: `Authorization: Bearer <token>` (required).

**Success 200**:

```json
{
  "success": true,
  "data": {
    "id": "uuid", "email": "...", "full_name": "...",
    "avatar_url": null, "couple_id": null,
    "created_at": "ISO..."
  }
}
```

**Errors**: 401 với 3 nguyên nhân:

- Missing `Authorization` header (`"Missing Authorization header"`)
- Header không phải `Bearer <token>` (`"Invalid Authorization header"`)
- Token hết hạn / chữ ký sai (`"Invalid or expired token"`)
- User bị xóa khỏi storage (`"User no longer exists"`)

#### 6.1.4 PUT `/api/v1/auth/me`

Cập nhật profile. Tất cả field optional.

**Request body** (`UpdateProfileRequest`):

```json
{
  "full_name": "Alice B.",
  "avatar_url": "https://cdn.example.com/avatars/alice.png",
  "birth_date": "1995-04-12",
  "gender": "female"
}
```

**Validation**:

- `avatar_url`: trim whitespace, chuỗi rỗng → null
- `full_name`: nếu gửi phải khác rỗng (1–120)

**Success 200**: trả về `UserResponse` đã update.

**Errors**: 400 nếu input invalid; 401 nếu token bad.

**Service detail**: gọi `AuthService.update_profile()` — chỉ patch field nào không None, thêm `updated_at` mới (`to_iso(now_utc())`).

#### 6.1.5 POST `/api/v1/auth/change-password`

**Request body**:

```json
{ "current_password": "Demo1234!", "new_password": "Demo5678@" }
```

**Success 200**:

```json
{ "success": true, "data": { "updated": true } }
```

**Errors**:

| Code | Condition                                                            |
|------|----------------------------------------------------------------------|
| 401  | Token invalid (từ dependency `get_current_user`)                     |
| 401  | `current_password` không đúng (`"Mật khẩu hiện tại không đúng"`)    |
| 422  | `new_password` < 6 chars                                              |

Service verify với `verify_password(plain, hashed)` (bcrypt check), rồi `hash_password(new)` để overwrite.

#### 6.1.6 POST `/api/v1/auth/forgot-password`

**Request body**: `{ "email": "alice@demo.com" }` (`ForgotPasswordRequest`).

**Success 200**:

```json
{
  "success": true,
  "data": { "otp": "482915", "expires_in": 600 }
}
```

Trong MVP: response **luôn chứa OTP** ngay cả khi email không tồn tại — đây là cố ý trade-off cho dev, không phải leak-proof cho production.

Tạo OTP 6 số qua `generate_otp()` (dùng `secrets.choice` cho mỗi chữ số). Lưu vào in-memory `AuthService._otp_store: dict[email → {otp, expires_at}]`. Reset mỗi lần gọi.

#### 6.1.7 POST `/api/v1/auth/reset-password`

**Request body**:

```json
{ "email": "alice@demo.com", "otp": "482915", "new_password": "Demo5678@" }
```

**Success 200**: `{"success": true, "data": {"updated": true}}`

**Errors**:

| Code | Condition                                                |
|------|----------------------------------------------------------|
| 401  | OTP không match / không tồn tại → `"OTP không hợp lệ"` |
| 401  | OTP expired → `"OTP đã hết hạn"`                       |
| 401  | Email không tồn tại → `"User không tồn tại"`           |
| 422  | `new_password` < 6 chars                                 |

Service so sánh OTP + check `expires_at > now_utc()`, hash password mới, pop OTP khỏi store.

### 6.2 Couple endpoints (`app/api/couple.py`)

#### 6.2.1 POST `/api/v1/couple/invite-code`

Tạo mã invite cho current user. **Hành vi quan trọng**: mọi invite `status="pending"` trước đó của user này sẽ bị **set `cancelled`** trước khi tạo cái mới (đảm bảo 1 user chỉ có 1 active code).

**Success 201**:

```json
{
  "success": true,
  "data": {
    "code": "FLM3K7X2",
    "expires_at": "2026-07-17T10:23:45.123456+00:00",
    "status": "pending",
    "is_pending": true
  }
}
```

`InviteCode` model chứa các field internal: `id`, `user_id`, `created_at`, `used_by`. Response chỉ expose 4 field public ở trên.

Code generation (`generate_invite_code()` ở `app/utils/ids.py`):

- Retry tối đa 5 lần trong service (`CoupleService._pick_unique_code`) — nếu vẫn collide (gần như không thể với code 6-char alphanumeric), raise `ConflictError("Could not generate a unique invite code")`.
- Format: `"FLM"` + 6 chars từ `string.ascii_letters + string.digits`.

#### 6.2.2 GET `/api/v1/couple/invite-code`

Trả về invite **mới nhất** của user (gọi `couple_repo.find_latest_by_user(user_id)`). Không lọc status — bao gồm cả `accepted`/`cancelled`/`expired`.

**Success 200**:

- Nếu có invite: `{ success: true, data: { code, expires_at, status, is_pending } }`
- Nếu chưa tạo: `{ success: true, data: null }`

#### 6.2.3 POST `/api/v1/couple/accept-invite`

Accept invite để lập couple.

**Request body**: `{ "code": "FLM3K7X2" }`

**Success 200**: trả về full `CoupleResponse` (mới tạo).

**Errors**:

| Code | Condition                                                                                                  |
|------|------------------------------------------------------------------------------------------------------------|
| 400  | `couple_service._validate_invite` → tự accept invite của mình (`ValidationError`, message "Bạn không thể tự accept invite của mình") |
| 404  | Invite không tồn tại (implicit qua Conflict message)                                                       |
| 409  | Invite không pending hoặc expired (`ConflictError`, "Invite code không hợp lệ hoặc đã hết hạn")            |
| 409  | Caller đã thuộc couple (`ConflictError`, "Bạn đã thuộc một couple")                                       |
| 409  | Người tạo invite đã thuộc couple khác (`ConflictError`, "Người tạo invite đã thuộc một couple")            |

**Side effects khi accept** (theo service `accept_invite`):

1. `invite.status = "accepted"`, `used_by = caller_id`
2. `couple` được tạo với `partner1 = invite owner`, `partner2 = caller`, `status = "active"`
3. 2 records `CoupleMember` được tạo với `role = "partner1"` / `"partner2"`
4. Cả 2 user được update `couple_id = new couple_id`

#### 6.2.4 GET `/api/v1/couple`

Lấy couple của current user.

**Success 200**: full `CoupleResponse`.

**Errors**:

- 401 nếu thiếu / sai token
- 404 (`NotFoundError`, "Bạn chưa thuộc couple nào") nếu user chưa ghép đôi

#### 6.2.5 PUT `/api/v1/couple/anniversary`

Cập nhật / xóa anniversary.

**Request body**: `{ "anniversary": "2024-03-15" }` hoặc `{ "anniversary": null }`

**Success 200**: full `CoupleResponse` (updated).

**Errors**: giống GET `/couple` (404 nếu không trong couple).

### 6.3 Memory endpoints (`app/api/memory.py`)

**Tất cả memory endpoint** đều helper `_ensure_couple_id(current, storage)` trước khi vào service, raise `NotFoundError("Bạn chưa thuộc couple nào")` nếu user chưa ghép đôi. Service cũng tự check `memory.couple_id == couple_id` để chống cross-couple access.

#### 6.3.1 GET `/api/v1/memories`

List memory của couple hiện tại. **Phân trang**: chưa có — trả về toàn bộ.

**Query params**:

- `category: str | None` — lọc theo `MemoryCategory`. Nếu không hợp lệ → 400.
- `year: int | None` (1900–2999) — lọc theo năm của `memory_date`.

**Success 200**:

```json
{
  "success": true,
  "data": {
    "items": [/* MemoryListItem[] — sort by created_at DESC theo service */],
    "total": 5
  }
}
```

#### 6.3.2 POST `/api/v1/memories`

Tạo memory mới.

**Request body** (`CreateMemoryRequest`): xem §5.6.

**Success 201**: full `MemoryResponse` (với `images: []`).

#### 6.3.3 GET `/api/v1/memories/{memory_id}`

**Path params**: `memory_id: uuid`.

**Success 200**: full `MemoryResponse` (với images).

**Errors**:

| Code | Condition                                                            |
|------|----------------------------------------------------------------------|
| 404  | Memory không tồn tại hoặc không thuộc couple của caller (`"Memory không tồn tại"`) |

#### 6.3.4 PUT `/api/v1/memories/{memory_id}`

Update memory (partial). Field nào gửi mới update.

**Success 200**: full `MemoryResponse`.

**Errors**: giống GET memory.

#### 6.3.5 DELETE `/api/v1/memories/{memory_id}`

**Success 204**: No Content.

**Side effects**: xóa luôn tất cả `MemoryImage` của memory đó (`image_repo.delete_by_memory(memory_id)`).

#### 6.3.6 POST `/api/v1/memories/{memory_id}/images`

Upload ảnh. Dùng **multipart/form-data** với field `file`.

**Request**:

```
POST /api/v1/memories/{memory_id}/images
Content-Type: multipart/form-data; boundary=...
Authorization: Bearer <token>

--boundary
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

<binary bytes>
--boundary--
```

**Success 201**: `MemoryImageResponse`.

**Errors**:

| Code | Condition                                                       |
|------|----------------------------------------------------------------|
| 400  | File > `FLAMEE_MAX_UPLOAD_SIZE_MB` MB (`ValidationError`, "File vượt quá giới hạn N MB") |
| 404  | Memory không tồn tại                                             |

**Detail kỹ thuật**:

- Content được đọc hết qua `file.file.read()` (`_read_within_limit`)
- Encode base64 (chuẩn ASCII) + thêm prefix `data:<mime>;base64,` → lưu vào cả `url` và `thumbnail_url` (giống nhau trong MVP)
- `width` / `height` chưa đọc → set `null`
- Mime lấy từ `file.content_type`, default `"image/png"` nếu không có header

#### 6.3.7 DELETE `/api/v1/memories/{memory_id}/images/{image_id}`

**Path params**: `memory_id`, `image_id`.

**Success 204**: No Content.

**Errors**:

| Code | Condition                                                |
|------|----------------------------------------------------------|
| 404  | Memory hoặc image không tồn tại hoặc không match (`"Image không tồn tại"`) |

### 6.4 Health endpoint

#### 6.4.1 GET `/health`

**Success 200**:

```json
{ "status": "ok" }
```

Không qua envelope (theo `app/main.py::health`).

---

## 7. Mã lỗi

### 7.1 DomainError (mapped sang envelope)

Từ `app/core/exceptions.py`:

| Exception           | HTTP | error.code          | message                                              |
|---------------------|------|---------------------|------------------------------------------------------|
| `AuthError`         | 401  | `unauthorized`      | thường do dependency raise (e.g. token hết hạn)      |
| `ForbiddenError`    | 403  | `forbidden`         | hiện chưa route nào throw                             |
| `NotFoundError`     | 404  | `not_found`         | message thường tiếng Việt                             |
| `ConflictError`     | 409  | `conflict`          | email tồn tại / couple tồn tại / invite mismatch      |
| `ValidationError`   | 400  | `validation_error`  | upload > max size / anniversary format / ...          |
| `DomainError` base  | 400  | `domain_error`      | chỉ khi subclass không set                            |

### 7.2 Error response

```json
{
  "success": false,
  "error": { "code": "<string>", "message": "<string>" }
}
```

Traceback / stack **không** exposed (handler chỉ đổi code + message).

### 7.3 Validation 422 (Pydantic)

Khi body sai schema Pydantic, response **KHÔNG** qua envelope mà là FastAPI default:

```json
{ "detail": [{ "loc": ["body","email"], "msg": "value is not a valid email address", "type": "value_error.email" }] }
```

---

## 8. Mô hình dữ liệu nội bộ

Dataclass models (Phase 0 foundation), xem `app/models/`:

### 8.1 User

| Field          | Type   | Note                                  |
|----------------|--------|---------------------------------------|
| id             | str    | UUID v4                                |
| email          | str    | Unique, lowercase canonical           |
| password_hash  | str    | bcrypt hash                            |
| full_name      | str    | 1–120 chars                            |
| avatar_url     | str\|None | ≤ 512 chars                       |
| birth_date     | str\|None | Free-form, "YYYY-MM-DD"             |
| gender         | str\|None | ≤ 20 chars                          |
| couple_id      | str\|None | NULL khi chưa ghép đôi              |
| created_at     | str    | ISO-8601 UTC                          |
| updated_at     | str    | ISO-8601 UTC                          |

### 8.2 Couple

| Field         | Type   | Note                                |
|---------------|--------|-------------------------------------|
| id            | str    | UUID                                 |
| partner1_id   | str    | user_id — invite creator             |
| partner2_id   | str\|None | user_id — invite acceptor; NULL khi chỉ mới tạo invite (nhưng MVP auto-accept) |
| anniversary   | str\|None | "YYYY-MM-DD" / free-form          |
| status        | str    | "active" \| "dissolved"             |
| created_at    | str    | ISO-8601                             |
| updated_at    | str    | ISO-8601                             |

### 8.3 CoupleMember

| Field      | Type | Note                                  |
|------------|------|---------------------------------------|
| id         | str  | UUID                                   |
| couple_id  | str  | FK                                     |
| user_id    | str  | FK                                     |
| role       | str  | "partner1" \| "partner2"             |
| joined_at  | str  | ISO-8601                               |

### 8.4 InviteCode

| Field      | Type   | Note                                                  |
|------------|--------|-------------------------------------------------------|
| id         | str    | UUID                                                   |
| code       | str    | "FLM" + 6 alphanumeric                                 |
| user_id    | str    | FK to User (creator)                                   |
| status     | str    | "pending" \| "accepted" \| "expired" \| "cancelled"   |
| created_at | str    | ISO-8601                                               |
| expires_at | str    | ISO-8601 (created + 7 days by default)                 |
| used_by    | str\|None | FK to User (acceptor); NULL until accepted         |

### 8.5 Memory

| Field             | Type   | Note                                |
|-------------------|--------|-------------------------------------|
| id                | str    | UUID                                 |
| couple_id         | str    | FK                                   |
| created_by        | str    | FK to User                           |
| title             | str    | 1–200 chars                          |
| description       | str\|None | ≤ 4000 chars                    |
| category          | str    | MemoryCategory enum value            |
| memory_date       | str    | 4–32 chars, free-form                |
| location          | str\|None | ≤ 200 chars                     |
| is_pinned         | bool   | default false                        |
| reminder_enabled  | bool   | default false                        |
| created_at        | str    | ISO-8601                             |
| updated_at        | str    | ISO-8601                             |

### 8.6 MemoryImage

| Field         | Type   | Note                                                  |
|---------------|--------|-------------------------------------------------------|
| id            | str    | UUID                                                   |
| memory_id     | str    | FK                                                     |
| url           | str    | "data:<mime>;base64,..." (MVP)                          |
| thumbnail_url | str\|None | Same as `url` for now; null-able for future pipeline |
| uploaded_by   | str    | FK to User                                             |
| width         | int\|None | NULL until pipeline (Phase 2)                      |
| height        | int\|None | NULL until pipeline (Phase 2)                      |
| created_at    | str    | ISO-8601                                               |

---

## 9. Demo accounts & seed data

Khi `FLAMEE_SEED=true` (mặc định), app tự động seed data nếu storage rỗng (xem `mock/seed.py`). Password chung: `Demo1234!`.

### 9.1 Demo users

| Email               | Name  | Couple ID | Gắn với couple |
|---------------------|-------|-----------|----------------|
| `alice@demo.com`    | Alice | (couple)  | partner1       |
| `bob@demo.com`      | Bob   | (couple)  | partner2       |

### 9.2 Couple

- `anniversary` = today (UTC)
- `status` = `"active"`
- Seed 5 memories trong couple đó (xem `mock/seed.py::_MEMORY_TEMPLATES`)

### 9.3 Demo memories

| Title                              | Category     | Date offset | Location              |
|------------------------------------|--------------|-------------|------------------------|
| First date at the coffee shop      | first_date   | -650 days   | The Coffee House       |
| Beach trip to Da Nang              | trip         | -380 days   | Da Nang                |
| Our first anniversary              | anniversary  | -280 days   | Riverside Restaurant   |
| Adopted a puppy!                   | milestone    | -120 days   | Home                   |
| Surprise birthday gift             | gift         | -45 days    | Home                   |

Login `alice@demo.com / Demo1234!` rồi `GET /api/v1/memories` sẽ thấy 5 items này.

### 9.4 Run từ scratch

```bash
cd backend
copy .env.example .env      # chỉnh FLAMEE_SECRET_KEY nếu muốn
pip install -r requirements.txt
python run.py               # http://127.0.0.1:8000/docs
```

Reset seed (xóa data mock):

```bash
del mock\data.json          # Windows
rm mock/data.json           # Mac/Linux
```

Restart `python run.py` → seed chạy lại.

---

## 10. Phụ lục

### 10.1 Mở rộng nhanh

- **Swap storage sang SQLite:** đổi `FLAMEE_STORAGE=sqlite`, tạo `app/storage/sqlite_storage.py` implement `Storage` ABC, đăng ký trong `app/storage/factory.py`.
- **Swap storage sang Postgres:** tương tự với `FLAMEE_STORAGE=postgres`.
- **Real OTP qua email:** thay trả OTP trong response bằng send email, lưu OTP cache qua Redis thay vì `dict` in-memory.
- **Resize ảnh:** thêm pipeline trong `MemoryService.upload_image` — dùng `Pillow` hoặc gọi sang cloud function, set `thumbnail_url` riêng.
- **Real file storage:** thay `data:base64` bằng URL trỏ về S3/R2 — chỉ cần đổi `_to_data_url()`.

### 10.2 Đường dẫn nhanh tới file nguồn

| File                                             | Vai trò                                   |
|--------------------------------------------------|--------------------------------------------|
| `backend/app/main.py`                            | App factory, CORS, exception handler, lifespan startup (seed) |
| `backend/app/config.py`                          | Pydantic Settings (env prefix `FLAMEE_`)    |
| `backend/app/core/security.py`                   | hash_password, JWT, OTP generation         |
| `backend/app/core/exceptions.py`                 | DomainError hierarchy                      |
| `backend/app/core/handlers.py`                   | Exception → JSONResponse (envelope)        |
| `backend/app/core/constants.py`                  | Enums + collection names                   |
| `backend/app/api/response.py`                    | `ok()` success envelope                    |
| `backend/app/api/deps.py`                        | `get_current_user`, `get_storage`          |
| `backend/app/api/auth.py`                        | Router /auth                             |
| `backend/app/api/couple.py`                      | Router /couple                           |
| `backend/app/api/memory.py`                      | Router /memories                         |
| `backend/app/services/auth_service.py`           | register/login/OTP/profile logic            |
| `backend/app/services/couple_service.py`         | invite + couple + accept logic             |
| `backend/app/services/memory_service.py`         | memory CRUD + base64 upload                |
| `backend/app/repositories/*.py`                  | Typed repos over `Storage`                 |
| `backend/app/storage/base.py`                    | Storage ABC + `apply_where` helper        |
| `backend/app/storage/mock_storage.py`            | In-memory + json persistence               |
| `backend/app/storage/factory.py`                 | `get_storage()` / `reset_storage()`         |
| `backend/mock/seed.py`                           | Demo users + couple + memories             |
| `backend/tests/conftest.py`                      | Per-test storage isolation, fixtures        |
| `backend/tests/test_auth.py`                     | 10 auth tests                             |
| `backend/tests/test_couple.py`                   | 5 couple tests                            |
| `backend/tests/test_memory.py`                   | 9 memory tests                            |

### 10.3 Lệnh nhanh để chạy

```bash
cd backend
python -m pytest tests/ -q          # 24 passed
python run.py                       # Swagger UI: http://127.0.0.1:8000/docs
curl http://127.0.0.1:8000/health   # {"status":"ok"}
```

---

*Tài liệu này được viết hoàn toàn từ source code tại `D:\Flamee-app\backend` và OpenAPI spec live. Cập nhật lần cuối: 2026-07-10.*
