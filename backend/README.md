# Flamee backend local

## Trạng thái sau cleanup 2026-10-17

- Forgot/reset-password trả 501 `feature_unavailable`; đã gỡ OTP trả trong response và OTP store trong bộ nhớ. Chưa có email delivery thật.
- Upload ảnh mới trả `thumbnail_url: null` vì chưa có thumbnail pipeline. Bucket, quyền riêng tư, bounded upload, cleanup và pagination vẫn cần hoàn thiện; không coi unit test FakeSupabase là kiểm tra upload thật.
- Mobile profile đã dùng GET/PUT `/auth/me` cho `full_name`/`username`. Migration username đã viết nhưng **chưa áp dụng**. Các feature chưa nối API không còn giả lưu local.
- Hướng xử lý và nghiệm thu: [.doc/BACKEND-FIRST-CLEANUP.md](../.doc/BACKEND-FIRST-CLEANUP.md). Không chạy migration/SQL hoặc ghi backend thật trong đợt cleanup.

## Chạy hằng ngày trên Windows

Từ root project:

```powershell
.\backend\start.cmd
```

Hoặc từ thư mục backend:

```powershell
.\start.cmd
```

Script tự chuyển vào đúng thư mục, dùng Python của `.venv`, nạp `.env` và chạy
FastAPI với reload theo `FLAMEE_DEBUG`. Không cần activate venv, cài Python global
hoặc đổi ExecutionPolicy. Giữ terminal mở; Ctrl+C để dừng. Chỉ chạy một instance
ở port 8000. Nếu server đã chạy từ phiên setup thì không chạy thêm instance.

- Health: `http://127.0.0.1:8000/health`
- API docs: `http://127.0.0.1:8000/docs`
- Điện thoại cùng Wi-Fi: `http://192.168.1.129:8000`
- Mobile URL: `http://192.168.1.129:8000/api/v1` trong `flamee-mobile/.env.local`

IP Wi-Fi có thể thay đổi. Xem lại bằng `ipconfig` khi đổi mạng.

## Cột profile `username` — 2026-10-17

Backend hỗ trợ biệt danh tùy chọn `username` qua register, login và cả hai
nhánh profile `/api/v1/users/me`, `/api/v1/auth/me`. Giới hạn 40 ký tự sau trim,
không bắt buộc unique; chuỗi rỗng bỏ biệt danh, thiếu/null giữ nguyên khi PUT.
Contract đầy đủ nằm trong [database docs](docs/database.md).

Review và áp dụng [migration username](migrations/20261017_profile_username.sql)
trên database phát triển trước khi dùng backend mới cho các thao tác ghi.
Migration này chưa được agent chạy lên Supabase; các test dùng database giả
trong bộ nhớ, không xác minh schema hoặc auth E2E trên dịch vụ thật.

## Môi trường đã thiết lập

- CPython 3.12.15 portable ở `.python`, virtualenv ở `.venv`.
- Công cụ uv ở `.tools/uv/uv.exe`; archive chính thức đã kiểm tra SHA256.
- Dependency trong `requirements.txt` đã cài; snapshot phiên bản đã kiểm tra ở
  `requirements-local.lock.txt`.
- `.env` chứa cấu hình riêng và JWT secret ngẫu nhiên. Không commit hoặc log key.
- `.python`, `.venv`, `.tools`, `.cache` và `.env` đã được ignore.

Kiểm tra môi trường/test:

```powershell
.\.venv\Scripts\python.exe -m pip check
.\.venv\Scripts\python.exe -m pytest -q
```

Nếu cần khôi phục đúng dependency trên một venv đã có Python:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-local.lock.txt
```

## Kết quả setup ngày 2026-10-14

- Dependency check sạch; 24/24 test backend qua với FakeSupabaseClient.
- Server thực khởi động; `/health` trả `ok` qua localhost và IP LAN.
- Chưa tạo user, seed hoặc chạy SQL trên Supabase thật.
- Project URL Supabase đã cung cấp trả DNS `NXDOMAIN` từ DNS công khai; kiểm tra
  bảng `users` thật bị timeout trên mạng hiện tại. Cần kiểm tra URL và trạng thái
  project trong dashboard trước khi register/login thật có thể hoạt động.
- Source hiện khởi tạo AI client ngay lúc import. Vì vậy toàn bộ app hiện cần
  `FLAMEE_OPENAI_API_KEY` để khởi động, dù auth không gọi AI. Key do người dùng cung
  cấp đã được cấu hình; chưa gọi AI API hoặc xác nhận billing/quota của key.

Hướng dẫn chi tiết: [mobile/auth/local setup](../.doc/MOBILE-AUTH-LOCAL-SETUP.md).
Kiến trúc: [backend/docs/README.md](docs/README.md).
