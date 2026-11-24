# Khắc phục check-in bị chặn — 2026-11-21

## Bằng chứng

- Mobile `.env.local` trỏ tới `http://13.239.139.82:8000/api/v1`.
- OpenAPI trên server không có `GET /api/v1/moods/capabilities`, các route reminder hoặc `/moods/nudge`; gọi capabilities không đăng nhập trả HTTP 405.
- Source backend trong workspace đã có các route này. Mobile kiểm tra capability trước khi POST check-in, nên server hiện tại chưa đáp ứng điều kiện gửi.
- HTTP 405 không chứng minh database thiếu migration; cần kiểm tra database trước khi chạy SQL.

## Phạm vi sửa trên server cần được duyệt

1. Xác nhận quyền SSH và host key của server hiện tại; lưu thông tin image/release đang chạy để có thể rollback. Không suy ra máy hiện tại từ IP EC2 cũ trong tài liệu lịch sử.
2. Kiểm tra schema/RPC bằng quyền backend, không ghi dữ liệu người dùng và không đưa credential vào log.
3. Đối chiếu các migration Mood phụ thuộc: `20261110_mood_draft_v2.sql`, `20261110_nudge_generation_guard.sql`, `20261110_nudge_transitions.sql`, sau đó `20261116_mood_daily_reminders.sql`. Chỉ áp dụng phần thiếu theo thứ tự; không chạy bootstrap `schema.sql` trên database hiện có.
4. Build và triển khai backend từ source đã kiểm tra, giữ env hiện tại và image cũ để rollback. Không tự push hoặc thay nhánh Git.
5. Kiểm tra health, OpenAPI có endpoint mới, thiếu bearer bị từ chối; kiểm tra có đăng nhập rằng capabilities trả `dual_mood_nudge: true`. Nếu false, tiếp tục xác định schema/RPC thiếu, không bỏ gate mobile.
6. Kiểm thử ghi và chia sẻ bằng tài khoản thử chỉ khi đã có phạm vi cho phép: ACK khớp nội dung, lịch sử có bản vừa tạo, đối phương đọc được theo quyền; retry không tạo bản trùng. Không dùng ghi chú riêng tư trong log.

Triển khai có thể làm API gián đoạn ngắn; migration thay đổi schema/RPC. Chưa có thao tác triển khai hoặc SQL thật trong lượt điều tra này.

## Sau khi người dùng triển khai backend

Health trả 200; OpenAPI đã có capabilities, nudge và reminder routes. Capabilities không có bearer trả 401, thay cho 405 trước triển khai. Người dùng vẫn thấy thông báo unavailable. Chưa có phản hồi capabilities có đăng nhập hoặc quyền truy cập database nên chưa xác định được migration/RPC cụ thể còn thiếu. Không kết luận mọi migration đã áp dụng chỉ dựa trên OpenAPI.

Chẩn đoán chỉ đọc trong Supabase SQL Editor: `backend/docs/check-mood-readiness.sql`. Kết quả chỉ chứa tên điều kiện và boolean, không chứa cảm xúc, ghi chú hoặc credential.

## Kết quả kiểm tra cục bộ

- `test_mood_reminder_api.py`, `test_dual_mood_context.py`, `test_mood_submission.py`, `test_mood_privacy.py`: 25 passed; 11 cảnh báo deprecation từ dependency hiện có.
- `node --test backend/tests/mood_daily_reminders_sql.test.mjs`: 2 passed trên PGlite cô lập.
- Trước đó `moodServiceCore.test.ts`: 2 passed; gate không gửi check-in khi server chưa hỗ trợ.
- Chưa xác minh schema thật, triển khai backend hoặc nghiệm thu ghi/chia sẻ trên thiết bị.
