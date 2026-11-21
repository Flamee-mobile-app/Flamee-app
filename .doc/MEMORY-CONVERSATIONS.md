# Bình luận kỷ niệm và thông báo trong app — 2026-11-15

## Điều chỉnh giao diện 2026-11-16

Trang thông báo dùng danh sách phẳng trên nền ứng dụng: hàng chưa đọc có nền nhạt và chấm màu, hàng đã đọc trong suốt. Hai loại thông báo được xếp theo thời điểm từ dữ liệu server; vẫn phân trang và đọc theo từng nguồn. Nút biểu tượng trên header đánh dấu tất cả đã đọc, có nhãn trợ năng và chỉ khả dụng khi có thông báo chưa đọc. API xác nhận trước khi báo thành công, thao tác chờ có toast loading; dữ liệu chưa có avatar tác giả nên hiển thị biểu tượng thông báo thay vì tự tạo ảnh giả.

Thông báo thao tác: gửi/trả lời/sửa/xóa bình luận, thả/bỏ tim bình luận và tim bài phát toast kết quả sau acknowledgement đúng scope. Lỗi/409 có toast lỗi đồng thời giữ draft và UI phục hồi hiện có; reads/polling không phát toast thành công. Không dựng thông báo success khi backend/migration chưa khả dụng.

Luồng mở mới nhất: nút Bình luận và nội dung thẻ mở trang bài đăng đầy đủ thay vì CommentsSheet. Trang chứa bài + ảnh + tim bài + thread, giữ composer phía dưới. Các quy tắc thread bên dưới tiếp tục áp dụng; xem `POST-DETAIL-PAGE.md`. Tim bài dùng API/migration riêng, không trộn với tim bình luận.

- Bỏ nút Gửi ngang bên dưới composer. Ô trống không hiện nút gửi; khi bắt đầu nhập, icon máy bay giấy xuất hiện ở góc dưới bên phải bên trong ô. Khi sửa dùng icon xác nhận. Nút bị khóa khi nội dung không hợp lệ, đang gửi, chưa tải được dữ liệu hoặc chưa xử lý xung đột version; bản nháp chỉ được xóa sau acknowledgement thật như trước.
- Nút gửi hiện/ẩn bằng fade + scale0.94→1 và trượt2px trong180ms; giữ cố định chiều rộng vùng nút, chỉ animate opacity/transform trên UI thread để không ép TextArea reflow/contentSize mỗi frame khi gõ. Khi ẩn không nhận chạm hoặc focus trợ năng. Reduced motion chuyển trạng thái ngay, không chạy hiệu ứng.
- `AppField.endAction` neo absolute trong mép phải của field, có zIndex riêng và padding phải dành cho nút; TextArea nằm trong vùng co giãn có minWidth0. Tránh native TextArea chiếm hết hàng rồi đẩy Animated.View ra ngoài màn hình. Android đã kiểm tra gõ/xóa draft: nút Gửi có bounds `[891,1726][1007,1841]` nằm trong field `[63,1715][1017,1852]`, ẩn khi xóa hết; không gửi nội dung thử. Ảnh `.local-tools/send-layout-fixed.png`; typecheck và5 test liên quan qua.
- `AppField` ẩn label “Viết bình luận” phía trên theo yêu cầu mới nhất, giữ nhãn trợ năng; nội dung và placeholder bắt đầu ở góc trên trái với padding ngang16/dọc14, cao tối thiểu52, tự giãn tối đa4 dòng. TextArea tự giãn vẫn chiếm phần chiều rộng còn lại trong hàng; composer không bị co chiều cao khi danh sách/bàn phím thay đổi.
- Reply có thụt lề32, nền nhẹ và đường nhánh nối rõ với nhóm bình luận; vẫn một cấp, giữ tên tác giả parent do server trả về nếu parent chưa tải.
- Bình luận gốc và reply dùng cùng nền `$fieldSurface`, bo góc và padding; phân biệt hai cấp bằng thụt lề/đường nhánh và tên parent của reply. Giữ màu highlight cho bình luận được mở từ thông báo.
- Hiệu chỉnh render Android: `AppContextMenuTrigger.surfaceTone` sở hữu nền, radius20 từ token và `overflow: hidden` ngay trên native Pressable, không đặt nền/bo góc ở stack con. Đã quan sát ô root vuông góc trước sửa và cả root/reply bo góc cùng nhau sau sửa trên emulator có dữ liệu thật (`.local-tools/comment-row-before.png`, `comment-row-after.png`); typecheck và5 test liên quan qua, không ghi dữ liệu bình luận trong kiểm tra này.
- Tên tác giả, nhãn trợ năng/avatar, preview menu và “Đang trả lời/Trả lời…” ưu tiên biệt danh `author.username` sau trim; chỉ fallback `full_name` khi chưa có biệt danh. Với parent đã tải, mobile lấy tên từ bản ghi parent thay cho chuỗi tên thật cũ trong `parent_author`. Migration `backend/migrations/20261116_comment_parent_nickname.sql` cập nhật `memory_comment_view.parent_author` lấy biệt danh hiện tại trực tiếp từ users cho trường hợp parent ngoài trang; bootstrap đã đồng bộ, không sửa migration đã áp dụng. Chưa chạy migration mới lên database thật. Typecheck,9 test mobile liên quan và test PostgreSQL cô lập qua, gồm đổi biệt danh sau khi đã tạo reply và fallback khi trống.
- Nhấn giữ nội dung400ms mở popup trắng cạnh bình luận với bản xem trước và các thao tác hợp lệ; giữ nút tim/số tim dưới dòng. Theo yêu cầu mới nhất, bình luận gốc có thêm nút Trả lời căn cuối bên phải cùng hàng tim; chạm mở đúng composer trả lời như trong menu. Reply không có nút trả lời để giữ một cấp. Sửa/Xóa vẫn nằm trong menu. Popup không thêm các reaction hoặc hành động backend chưa hỗ trợ. Chỉ tác giả có Sửa/Xóa; tombstone không có menu hoặc hành động. Xóa vẫn qua hộp xác nhận và contract version hiện có.
- Shared `AppContextMenuTrigger` hỗ trợ nhấn giữ, menu chuột phải, phím Enter/Space/ContextMenu/Shift+F10 và thao tác trợ năng. `AppDialog.anchor` đặt popup dưới hoặc trên target, giới hạn vào safe area/vùng còn lại khi có bàn phím, có cuộn khi nội dung dài. Overlay/menu nằm trên sheet; chạm bên ngoài hoặc Back/Escape để đóng. Cuộn list/đóng sheet cũng đóng menu.

Chuông trên tab chính hiện đi cùng tiêu đề trong nội dung cuộn theo `.doc/MAIN-NAVIGATION.md`, thay thế mô tả chuông nổi ở phần lịch sử bên dưới.

Kiểm tra thay đổi2026-11-16: typecheck qua; toàn bộ mobile377 test,376 qua,1 lỗi Check-in baseline `bubbleToLargeTailGap` ngoài phạm vi sửa. Test mới kiểm tra vị trí popup cạnh target/gần mép màn hình/vùng bàn phím, đóng menu bằng Back/chạm ngoài qua native adapter double, quyền thao tác root/reply/tombstone và composer chỉ hiện nút khi gõ, giữ draft sau API lỗi. Review source độc lập không còn lỗi chặn sau khi bổ sung xử lý đóng menu native và bỏ cộng padding hai lần vào contentSize của TextArea. Emulator ở phiên chưa ghép đôi trong lượt này, chưa nghiệm thu trực tiếp menu nhấn giữ hoặc bàn phím với bình luận thật; chưa kiểm tra iOS/web thực tế. Không tạo account/comment giả trong app hoặc ghi dữ liệu backend để thay thế bước kiểm tra.

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
