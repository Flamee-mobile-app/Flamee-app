# Trang bài đăng và trình xem ảnh — 2026-11-16

## Bố cục toàn trang theo yêu cầu mới nhất

- Hàng tương tác chỉ dùng icon tim/icon bình luận kèm số server đã xác nhận; bỏ chữ Thử lại/Thả tim/Bình luận hiển thị cạnh icon, giữ nhãn trợ năng. Count bình luận lấy từ response comments để cập nhật đúng cả khi detail backend cũ thiếu count. Tim chưa tải được không dựng số0 giả. Bỏ đường phân cách dưới tương tác/trên composer và câu gợi ý khi chưa có bình luận. Đã kiểm tra Android tại `.local-tools/post-actions-clean.png`; typecheck và6test liên quan qua.

- Bỏ FeatureScreen/ContentSurface bao thẻ cho riêng trang bài đăng theo yêu cầu trực tiếp. Dùng AppScreen nền trắng phẳng, không ambient/card/shadow/bo góc ngoài, không maxWidth/gutter của feature card. Các màn khác giữ design system cũ.
- Quay lại đặt cùng hàng tác giả/avatar/ngày trong nội dung bài thay cho một hàng title Bài đăng lớn riêng. Text/identity/actions/comments lề16, ảnh toàn chiều rộng không bo góc, contain và cao tối đa45%viewport để cân bằng với nội dung/thảo luận.
- CommentsPanel.edgeToEdge đặt lề riêng cho thread và composer, không bọc cả trang trong một surface. Composer cố định dưới danh sách, nền trắng và đường phân cách trên. Post và thread vẫn cuộn chung một FlatList.
- Typecheck và6test liên quan qua. Đã xem ảnh emulator ở trang có bài/ảnh thật: `.local-tools/post-flat-check.png`; xác nhận không còn wrapper thẻ, header tác giả/ảnh/action và composer nằm trên cùng nền màn hình. Không ghi dữ liệu backend. Tim vẫn hiện thử lại khi endpoint/migration chưa triển khai như giới hạn phía dưới.

## Điều hướng và bố cục

- Chạm vùng nội dung/ảnh của thẻ Home hoặc nút Bình luận mở trang `/memory/[memoryId]/comments` với ID bài, không còn mở CommentsSheet. Các liên kết thông báo tới cùng route vẫn hỗ trợ `commentId` và cuộn/highlight bình luận mục tiêu.
- Trang có tác giả/biệt danh/avatar thật, ngày, text, ảnh, tim, nhãn bình luận và thread bình luận. Bố cục mới nhất ở phần trên thay thế header/title và ContentSurface cũ. Post header nằm trong ListHeaderComponent của FlatList bình luận, tránh ScrollView lồng; mở trang bình thường không tự cuộn xuống bình luận cuối. Composer nằm dưới danh sách, giữ bàn phím/safe area, gửi thật qua API hiện có.
- Skeleton bình luận chỉ ở dưới post header trong lần đọc đầu; phản hồi lỗi quyền không tiếp tục hiển thị header riêng tư trong list.
- Nút ba chấm của thẻ vẫn mở sheet thao tác nhanh sửa/xóa hiện có. Luồng sửa/bỏ draft và alert xác nhận xóa giữ nguyên. HomeOverlays legacy intent comments redirect về trang mới.
- Chạm ảnh trong trang mở `AppImageViewer` toàn màn hình, ảnh dùng `contain` trong vùng còn lại, không crop bất kể ảnh ngang/dọc. Trang dùng contained frame giới hạn45%viewport cho mỗi ảnh. Viewer có tác giả/text/tim/bình luận ở dưới, nút đóng; bình luận quay lại trang với composer. Viewer đóng khi mất focus/scope hoặc bài không còn khả dụng.
- Detail API trả `author` đã lọc id/full_name/username/avatar_url ký quyền truy cập và `comment_count`; mobile tương thích response backend cũ và dùng summary cùng scope đã có trong cache khi cần. Không đưa text/URL ảnh vào route params.

## Tim bài viết

- Đây là chức năng khác tim bình luận. Thêm GET/PUT/DELETE `/api/v1/memories/{id}/heart`, bearer xác định actor, desired-state PUT/DELETE trả JSON200 `{memory_id,heart_count,hearted}`; không dùng204 của DELETE bài/ảnh cho route này.
- API → MemoryHeartService → MemoryHeartRepository → RPC `memory_post_heart_operation`. Migration `backend/migrations/20261116_memory_post_hearts.sql` tạo bảng `memory_post_hearts` có RLS, không cho anon/authenticated gọi bảng/RPC trực tiếp; chỉ service_role. RPC kiểm activecouple và membership cả hai phía từ server, khóa cùng thứ tự couple→users→memory, scope memory trong pair, unique(memory_id,user_id), cascade khi xóa post. Lặp cùng desired-state không tăng/giảm đếm sai.
- Mobile cache theo session/account/couple/revision và postID, chỉ đổi tim/count sau acknowledgement hợp lệ, không optimistic hoặc tạo số0 giả khi chưa tải. Backend/migration chưa khả dụng hiển thị retry, không báo thao tác thành công; lỗi ghi có thông báo và đối chiếu query.
- Chưa thêm thông báo push hoặc inbox cho tim bài trong phạm vi này.
- **Chưa deploy backend hoặc chạy migration lên database thật.** Cần áp dụng migration và deploy API để tim bài cũng như author detail mới hoạt động đầy đủ. Bootstrap `backend/schema.sql` đã đồng bộ migration tim bài và parent nickname riêng sau migration conversation cũ, không viết lại lịch sử SQL đã áp dụng.

## Kiểm tra

- Typecheck qua. Full mobile402test:401qua,1lỗi Check-in baseline `bubbleToLargeTailGap` ngoài phạm vi.
- Frontend test kiểm tra trang chứa post trong list header, không nhảy cuối khi mở, biệt danh, mở/đóng viewer, API heart dùng bearer/method đúng/ID encode và chặn ack nhầm bài. Tests kích thước ảnh ngang/dọc hiện có vẫn qua trong suite.
- Backend pytest29test liên quan qua (8warning deprecation hiện có); PostgreSQL cô lập1test tim bài qua, gồm auth scope, idempotency, cascade và grants. Không chạy SQL hay mutation lên dịch vụ thật.
- Emulator ở màn đăng nhập khi kiểm tra lượt này; chưa nghiệm thu trang/ảnh/tim mới trên thiết bị với tài khoản thật, iOS/web hoặc hai thiết bị. Các kiểm tra UI mới là component test với dependency doubles, không phải ảnh chụp chứng nhận thiết bị.
