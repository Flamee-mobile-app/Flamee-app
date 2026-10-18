# Backend media pipeline — avatar và kỷ niệm

Ngày: 2026-10-18. Đây là thiết kế được chốt để thay luồng URL ảnh tùy ý và upload sơ khai hiện có bằng media thật, riêng tư và có thể kiểm chứng.

## Phạm vi

- API nhận multipart cho avatar và ảnh kỷ niệm; client không được tự gán URL rồi coi đó là asset hợp lệ.
- Server đọc tối đa `max_upload_size_mb + 1 byte`, giải mã ảnh thật, giới hạn 20 megapixel, sửa orientation, bỏ metadata và chuẩn hóa JPEG.
- Ảnh kỷ niệm có bản lớn tối đa 1600 px và thumbnail tối đa 480 px. Avatar được center-crop vuông 512 px.
- Storage dùng một bucket private `flamee-media`. Database chỉ lưu object path. API trả signed URL sống 900 giây.
- Object key do server sinh dưới `avatars/{user_id}/...` hoặc `memories/{couple_id}/{memory_id}/...`.
- Upload lỗi giữa chừng phải dọn object mới. Thay avatar dọn object cũ sau khi database cập nhật thành công. Xóa ảnh/kỷ niệm phải xóa object Storage và metadata, thao tác lặp lại được.
- Feed lấy toàn bộ metadata ảnh của một trang bằng một query batch, không query theo từng kỷ niệm.
- Không gọi AI, không seed dữ liệu, không chạy migration hoặc ghi Supabase thật trong quá trình triển khai.

## Contract API

- `POST /api/v1/auth/me/avatar`, multipart field `file`: cập nhật avatar của chính user và trả `UserResponse` với signed `avatar_url`.
- `DELETE /api/v1/auth/me/avatar`: gỡ avatar của chính user và object do pipeline quản lý.
- `PUT /api/v1/auth/me`: chỉ sửa text profile; bỏ quyền nhận `avatar_url` tùy ý.
- `POST /api/v1/memories/{memory_id}/images`: giữ route hiện có nhưng trả URL ký và metadata ảnh thật.
- `DELETE /api/v1/memories/{memory_id}/images/{image_id}` và xóa memory dọn cả original/thumbnail.
- `GET /api/v1/memories` và detail ký URL khi trả response; signed URL không được persist.

## Schema chuyển tiếp

- `users.avatar_storage_path` lưu path avatar mới. `avatar_url` cũ chỉ dùng đọc dữ liệu legacy trong giai đoạn chuyển đổi, không còn nhận từ PUT profile.
- `memory_images.storage_path`, `thumbnail_path`, `mime_type`, `size_bytes` lưu asset mới. Hai cột URL cũ được giữ nullable để đọc dữ liệu legacy; pipeline mới không ghi public URL.
- Migration tạo bucket private và không cấp policy client trực tiếp. Bucket public cũ phải được kiểm kê/migrate object trước khi đóng; migration này không tự làm hỏng URL legacy. Migration chỉ là artifact review, không tự áp dụng.

## Giới hạn được báo rõ

- Unit/integration test dùng FakeSupabase và bộ nhớ, không chứng minh RLS hoặc Storage thật hoạt động.
- Cleanup Storage và cập nhật Postgres không phải một transaction phân tán. Pipeline dùng compensation cho upload; thao tác xóa ưu tiên idempotent nhưng vẫn cần job quét orphan khi vận hành thực tế.
- Mobile profile picker đã nối `POST /auth/me/avatar` bằng multipart ngày
  2026-10-18. Picker chỉ tạo draft/preview; nút Lưu mới upload. Draft được giữ
  để retry nếu upload lỗi và chỉ dọn sau response hợp lệ cùng owner. Session và
  avatar bottom nav chỉ đổi sau response này. Nút Đăng kỷ niệm vẫn chưa được mở
  khóa chỉ dựa trên test giả.
- PostgREST `PGRST204` do database chưa áp dụng migration được đổi thành response
  503 `database_migration_required`, không còn rò stack trace 500. Response này
  chỉ chẩn đoán đúng cấu hình; không thay thế việc áp dụng migration thật.

## Evidence source ngày 2026-10-18

- Backend `pytest -q`: 55/55 đạt; còn 7 cảnh báo `datetime.utcnow()` có sẵn trong user service.
- `pip check`: không có dependency hỏng; `compileall` cho `app` và `tests` đạt.
- Mobile profile-avatar contract đã có test multipart/session; evidence cuối của
  lượt triển khai được ghi trong `.doc/DESIGN-SYSTEM-ROLLOUT.md`.
- Chưa chạy migration, chưa upload Supabase thật, chưa E2E Expo Go/iOS/Android và chưa benchmark. Các kết quả trên không chứng minh RLS, native picker hoặc hiệu năng production.
