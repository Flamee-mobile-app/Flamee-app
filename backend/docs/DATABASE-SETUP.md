# Database setup after backend alignment and dev media merge (2026-10-18)

## Chọn đúng SQL

- **Supabase project mới, chưa có bảng ứng dụng:** chạy toàn bộ `backend/schema.sql`
  trong SQL Editor. File có transaction và đã bao gồm phần backend alignment.
  Không chạy lại bootstrap này trên database đã có bảng.
- **Database đã có schema cũ:** review rồi chạy theo thứ tự:
  `20261014_invite_flow.sql`, `20261017_profile_username.sql`,
  `20261017_backend_alignment.sql`, `20261018_private_media_pipeline.sql`
  trong `backend/migrations/`.
  Không chạy `schema.sql` và không xóa bảng để tránh lỗi trùng tên.

Alignment thêm 6 bảng: auth_sessions, smart_nudges, tiny_moments,
smart_nudge_ratings, subscription_plans, payment_orders; bổ sung các cột model
users/couples/moods/memory_images đang sử dụng và RPC rotate_auth_session.
Không seed tài khoản, plan, đơn hàng hay dữ liệu mẫu.

Migration dành cho schema cũ trong repo, không tự sửa mọi schema tùy chỉnh.
`CREATE TABLE IF NOT EXISTS` không bổ sung cột vào bảng cùng tên đã được tạo
khác contract; nếu đã chỉnh DB thủ công cần đối chiếu trước khi áp dụng.

## Quyền và dữ liệu hiện có

Flamee dùng JWT do backend ký, không dùng Supabase Auth JWT để truy cập bảng
trực tiếp. Alignment bật RLS và thu hồi quyền bảng của `anon`/`authenticated`;
backend sử dụng `service_role`. Client chỉ gọi FastAPI. Không đưa service key
vào mobile. Migration không xóa dữ liệu; share_level còn NULL được suy ra từ
is_private, bảo toàn trạng thái private.

Bootstrap mới tạo bucket `flamee-media` private. Migration media tạo bucket này
hoặc đặt nó private nếu đã tồn tại; không di chuyển/xóa object legacy trong
bucket public khác. Upload avatar và memory mới dùng pipeline của dev: decode
ảnh thật, JPEG/thumbnail, chỉ lưu path và trả signed URL TTL 900 giây. Đây là
code đã tích hợp, chưa phải chứng nhận Storage thật hoạt động.

## Auth sau sửa

Register/login trả `user`, `access_token`, `refresh_token`, `expires_at`.
Session được lưu trong database; chỉ lưu SHA-256 digest của refresh token.
`POST /api/v1/auth/refresh` nhận `{"refresh_token":"..."}`; RPC thay digest và
jti atomically. Token cũ không dùng lại được, access token cũ cũng hết hiệu lực.
`POST /api/v1/auth/logout` dùng Bearer token và thu hồi session hiện tại.
Cả hai API đổi mật khẩu yêu cầu mật khẩu hiện tại và thu hồi các session cũ.
Token cũ không có session phải đăng nhập lại; lỗi session store không cho qua auth.

Register và tạo session vẫn là hai lần ghi: nếu session insert lỗi sau user
insert, tài khoản có thể đã được tạo. Khi đó sửa database rồi login, không dùng
việc API trả 500 để kết luận tài khoản chưa tồn tại.

## Cấu hình

Điền trong `backend/.env`:

```dotenv
FLAMEE_SUPABASE_URL=<project URL>
FLAMEE_SUPABASE_SERVICE_KEY=<server service role key>
FLAMEE_SECRET_KEY=<random secret at least 32 characters>
FLAMEE_DEBUG=true
FLAMEE_AI_PROVIDER=gemini
FLAMEE_GEMINI_API_KEY=<private API key>
FLAMEE_GEMINI_MODEL=<model available to this key>
FLAMEE_CORS_ORIGINS=["http://localhost:8081"]
```

Giá trị Gemini model cũ trong `.env.example` không phải bằng chứng model còn
khả dụng; phải xác minh bằng API với key thật trước test AI. Auth/CRUD không cần AI.
Không commit `.env` hay gửi key vào log/chat.

Chạy từ `D:\Flamee-app\backend`:

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Mở http://127.0.0.1:8000/docs. `/health` chỉ kiểm tra app, không kiểm tra database.

## Giới hạn và nghiệm thu

- Forgot/reset password, checkout và manual payment activation
  chưa tích hợp: trả 501. Google login chưa có route, không nhận token giả.
- Plans đọc database thật, không fallback giá mẫu khi DB rỗng/lỗi.
- Các bảng payment là cấu trúc dữ liệu, không đồng nghĩa cổng thanh toán hoạt động.
- Unit tests dùng FakeSupabase và chặn mạng ngoài; không chứng minh SQL/RPC/RLS
  chạy đúng trên PostgreSQL. Test schema kiểm tra field model và bootstrap/migration.
- Chưa chạy SQL, tạo dữ liệu thật hay gọi Gemini trong đợt sửa này. Máy hiện không
  có PostgreSQL/psql để chạy integration SQL cục bộ.
- Sau khi người dùng áp dụng SQL và cấu hình môi trường phát triển, cần test thật:
  register/login, GET/PUT profile, refresh/replay/logout, đổi mật khẩu, ghép đôi,
  CRUD memory text, isolation giữa các tài khoản và lời gọi Gemini với dữ liệu test.
  Test ghi dữ liệu và dùng quota AI cần phạm vi cho phép cụ thể.

## Kết quả lịch sử trước merge dev (2026-10-17)

- Nhóm config/schema/auth/session/profile/recovery: 41/41 đạt.
- 4 test readiness bổ sung đạt: không giấu lỗi DB bằng plan mẫu, không ghi
  đơn hàng hoặc upload khi tính năng chưa tích hợp.
- Toàn bộ `python -B -m pytest -q --tb=line --show-capture=no`: 77 passed,
  18 failed. Chưa coi toàn bộ backend đạt nghiệm thu.
- 18 test chưa đạt: 8 test upload đòi pipeline chưa có; 1 test thanh toán đòi
  giá/checkout mẫu; 1 test Google login dùng token giả; 7 test nudge chưa có
  kết quả sinh nudge trong môi trường cô lập mạng; 1 test mã mời gửi chuỗi sai
  định dạng nhưng mong 409 thay vì 422.
- Kiểm tra cú pháp Python: 64 file app parse thành công. Test schema chỉ kiểm
  tra contract nguồn; chưa chạy SQL/PostgreSQL/RPC thật.
- Còn cảnh báo deprecation từ thư viện và quyền ghi `.pytest_cache`; không tắt
  cảnh báo hay thay dependencies để né lỗi.
