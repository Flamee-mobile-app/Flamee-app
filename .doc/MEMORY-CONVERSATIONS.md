# Bình luận kỷ niệm và thông báo trong app — 2026-11-15

Theo phạm vi người dùng đã duyệt: sheet bình luận, trả lời một cấp, thả/bỏ tim, sửa/xóa bình luận của mình và chuông mở inbox giữa hai thành viên hiện tại. Phạm vi này là thông báo trong app; chưa cấu hình push lên màn khóa, token thiết bị hoặc dịch vụ push.

## Trải nghiệm

- Feed dùng số `comment_count` server; nếu backend cũ không có trường này thì chỉ hiển thị nhãn Bình luận, không dựng số giả. Nhấn mở sheet gắn đúng bài. Từ lịch/ngày/chi tiết cũng mở được bình luận.
- Nội dung văn bản 1–1000 Unicode code point, có emoji/xuống dòng. Trả lời nằm dưới bình luận gốc; chỉ một cấp. Parent chưa có trong trang đã tải vẫn có tên tác giả do server trả về, không dựng nội dung parent giả.
- Gửi có stable idempotency key theo nội dung/parent. Chỉ xóa draft sau acknowledgement đúng memory/parent và còn cùng scope. Lỗi giữ draft; nội dung chỉnh sửa tại thiết bị khác trả409, người dùng phải nạp bản mới rồi xác nhận lại. Không tự ghi đè nội dung mới bằng version cũ.
- Heart dùng trạng thái mong muốn PUT/DELETE, cập nhật UI từ acknowledgement trước khi mở khóa, sau đó refresh counts. Xóa có xác nhận, chỉ tác giả được phép; parent trở thành tombstone trống, các reply còn lại vẫn đọc được.
- Chuông góc trên phải các tab chính, badge số chưa đọc từ API. Badge `!` là lỗi tải, không phải số0 giả. Nội dung Home/Kỷ niệm chừa safe area +8+48+16 cho chuông; không khôi phục thanh header đã bỏ.
- Inbox có phân trang, pull-to-refresh, đọc một/tất cả. Chạm mở đúng memory/comment bằng ID, không đưa nội dung riêng vào params. Comment mục tiêu được highlight và cuộn đến; target đã mất hiện không khả dụng.
- Đồng bộ foreground: bình luận 10 giây, inbox/badge 15 giây và refetch khi mở lại. Không gọi đây là push/realtime WebSocket. Background ngừng polling; đổi account/couple/session/revision tạo scope cache mới và dọn draft. 403/404 không tiếp tục render nội dung cache bị thu hồi quyền; 403 yêu cầu đồng bộ lại membership.

## Backend và quyền

Mobile → API xác thực hiện có → ConversationService → ConversationRepository → RPC `memory_conversation_operation` trên Supabase. Actor lấy từ bearer đã xác thực; client không gửi tác giả, couple hay người nhận.

RPC đọc lại current couple, khóa couple và kiểm cả hai thành viên cùng couple active trong giao dịch. Tất cả memory/comment/notification ID được kiểm scope. Gửi, heart, đếm và tạo thông báo cùng giao dịch. Không tự thông báo cho người tạo; lặp cùng key/cùng desired heart không tạo bản trùng. Bỏ tim xóa event heart tương ứng; xóa bài cascade comments/hearts, inbox cũ chuyển target không khả dụng.

Tables `memory_comments`, `memory_comment_hearts`, `couple_notifications` bật RLS và thu hồi quyền trực tiếp của PUBLIC/anon/authenticated. RPC chỉ service_role được execute. `request_hash` SHA256 giữ kiểm tra idempotency sau khi sửa/xóa mà không lưu bản nội dung đã xóa.

## Contract

Prefix `/api/v1`:

| API | Hành vi |
| --- | --- |
| GET `/memories/{memory_id}/comments?limit=20&offset=0` | Trang mới nhất, tổng record (kể cả tombstone) và count bình luận còn nội dung |
| POST cùng đường dẫn + Idempotency-Key | `{body,parent_id?}`; trả201 kèm comment server |
| GET `/memories/{memory_id}/comments/{id}` | Target trong thông báo/đọc lại version |
| PUT cùng đường dẫn | `{body,version}`; chỉ tác giả,409 khi version cũ |
| DELETE cùng đường dẫn `?version=…` | Trả200 tombstone, không phải204 |
| PUT/DELETE `/memories/{memory_id}/comments/{id}/heart` | Đặt/bỏ heart; trả200 comment và count xác nhận |
| GET `/notifications?limit=20&offset=0` | `{items,total,unread_count}` trong current couple và recipient |
| PUT `/notifications/{id}/read`, PUT `/notifications/read-all` | Acknowledgement inbox/counters; không optimistic đánh dấu thành công |

401 vẫn là unauthorized để coordinator refresh token hiện có xử lý;403 là quyền couple bị từ chối;404 target không thuộc scope/đã mất;409 version/idempotency conflict; thiếu migration trả503 thay vì empty/success giả.

## Triển khai và kiểm tra

Migration: `backend/migrations/20261115_memory_conversation.sql`; đã đưa cùng SQL vào bootstrap `backend/schema.sql`. Theo yêu cầu người dùng, ngày2026-11-15 đã áp dụng nguyên bản vào project Supabase `crxkzjnvwlnjuxmbtnqm`, xác minh6/6 kiểm tra schema/RLS/grants và yêu cầu PostgREST reload schema. Chi tiết trong `docs/progress/2026-11-15-conversation-migration-applied.md`. Chưa deploy backend; người dùng sẽ push để CI/CD triển khai. Không chạy lại bootstrap trên database hiện hữu.

Kiểm tra SQL PostgreSQL cô lập bằng PGlite: `node --test backend/tests/conversation_sql.test.mjs` (test dependency riêng trong `.local-tools/conversation-pg-test`, không đổi package của app). Kiểm tra auth/payload/schema qua pytest FakeSupabase và test API/model mobile. Các test doubles chỉ phục vụ test, không phải service thay thế trong app.

Android emulator đã mở chuông/inbox ở trạng thái chưa ghép đôi (`.local-tools/flamee-conversation-bell.png`, `flamee-conversation-inbox.png`). Chưa nghiệm thu gửi/thả tim/thông báo trên hai thiết bị ghép đôi với backend thật, bàn phím sheet có dữ liệu thật, iOS/web hoặc push notification.

25 kiểm tra backend liên quan đã đạt; kiểm thử PostgreSQL cô lập chạy với role service_role đạt và xác minh role authenticated không có quyền trực tiếp. Review độc lập đã hoàn tất; không còn lỗi chặn trong source sau khi xử lý cache bị thu hồi quyền, trạng thái heart, cuộn target, nhóm reply và phục hồi409. Xem ledger trong kế hoạch để biết kết quả suite mở rộng và giới hạn môi trường test.

Kiểm tra cuối: typecheck đạt; full mobile371 test,370 đạt và1 lỗi Check-in baseline (`bubbleToLargeTailGap`), không thuộc thay đổi conversation. TestAPI/model conversation9/9 đạt.
