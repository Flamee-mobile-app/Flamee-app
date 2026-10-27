# Triển khai bổ sung và phần chưa hoàn tất — 2026-10-27

## Kết quả lượt này

- Lịch cảm xúc và lịch tuần ở màn cảm xúc đọc `GET /moods` thật, bỏ dữ liệu preview khỏi hai đường chạy này. Có loading/error/empty riêng, tải lại và tải thêm 50 bản ghi/lần. Ngày theo giờ thiết bị, chọn bản ghi mới nhất theo timestamp server; khử trùng ID khi các trang chồng nhau. Không đổi mood không có trong catalog thành một cảm xúc khác.
- Backend `GET /moods` thêm `limit` (1–100, mặc định 20), `offset` (>=0), giữ envelope và data dạng array để tương thích client cũ. Truy vấn chỉ dữ liệu của bearer user; thứ tự created_at DESC, id DESC.
- Popup đối tác đọc `GET /moods/partner/latest` thật; hiện thời điểm, cảm xúc và note/reasons được phép chia sẻ. Không gán trạng thái trống khi API lỗi. `mood_only` được loại note/reasons thêm một lần ở adapter mobile; payload private bị từ chối.
- Cache history theo account/session; cache đối tác thêm couple. Chuyển phiên/cặp hủy request và dọn cache scope cũ. Dữ liệu cảm xúc không được đưa vào route params, log hoặc persistent storage.
- Backend trạng thái đối tác, alert và dữ liệu nguồn digest giới hạn theo cặp hiện tại. Không lấy lại mood/alert của cặp trước. Digest không đọc private hoặc note/reasons mood_only. Cờ legacy `is_private=true` luôn ưu tiên giữ riêng tư dù share_level mặc định là all.
- Home tự invalidate feed/detail đang mở mỗi 5 giây khi app active; tải lại khi quay về Home hoặc foreground. Không tạo request chồng nhau từ polling, dừng lịch polling khi rời màn/đổi scope. Đây là polling, chưa phải WebSocket hoặc bảo đảm đồng bộ trong 5 giây; request mạng có thể lâu hơn.

## Kiểm tra

- Mobile typecheck đạt sau nối lịch sử/đối tác/polling.
- Full mobile: **310/312 đạt**, còn hai lỗi baseline `checkInUiContract` (gap bubble) và `profileFeedbackContract` (outlined/elevated). Không bỏ assertion để làm xanh suite.
- Backend hồi quy offline: **138 passed, 5 deselected**, 13 deprecation warnings, trước sửa ưu tiên cờ private cuối cùng. Sau bản sửa đó, nhóm mood/history/privacy/AI boundary: **13 passed**, 5 deprecation warnings.
- Test doubles được bổ sung hỗ trợ ilike và nhiều order để kiểm đúng contract query; không đổi dependency hoặc runtime backend thành mô phỏng.
- Chưa chạy UI/browser/native, hai thiết bị, backend/Supabase thật, migration, push hoặc AI có phí. Không tick E2E chỉ từ unit test/typecheck.

## Chưa hoàn tất và lý do cụ thể

| Phần | Trạng thái và công việc cần làm |
| --- | --- |
| Gửi check-in | Chưa bật. Backend vẫn note 140/reasons 3, enum cũ, yêu cầu có cặp; UI có note 60, nhiều reasons, custom feeling, sleep, attachments. Cần mở rộng schema/validation/persistence, idempotency, privacy projection và kiểm thử round-trip toàn payload. Chưa viết/chạy migration trong lượt này; không tự bỏ dữ liệu UI để API nhận được. |
| Lịch sử nâng cao | Lịch chỉ hiển thị mood mới nhất/ngày trong các trang đã tải; chưa có chi tiết tất cả lần trong ngày. Timezone đang theo thiết bị, chưa có preference timezone server. Offset pagination có thể dịch chuyển khi thêm/xóa đồng thời; có khử trùng client, chưa có cursor snapshot. |
| Smart Nudge | UI chưa nối; vẫn cần state transition nguyên tử, quyền sau unpair, rating retry và nội dung crisis được duyệt trước nghiệm thu. Thứ tự check-in → Nudge → gửi Moment chưa khép kín. Đây còn là công việc triển khai, không chỉ thiếu cấu hình. |
| Tiny Moments | Chưa nối luồng đầy đủ: thiếu contract private media, detail/reaction/read/delete, pagination và idempotency. Endpoint content hiện có không thay thế upload thật. |
| Realtime | Home có polling; WebSocket chưa nối mobile. Backend hiện kiểm phiên/cặp lúc kết nối, cần thêm vòng đời thu hồi quyền cho kết nối đang mở, reconnect và kiểm scope trước bật xuyên suốt. |
| Push/nhắc lịch | Chưa triển khai worker/token lifecycle/tap routing/quiet hours; cần credentials, native build và thiết bị để nghiệm thu push thật. |
| Profile/onboarding | Name/avatar đã có; care/relationship/preferences và trạng thái onboarding chưa có contract/persistence đầy đủ. Deferred link cần chọn provider và cấu hình link/signing của hai nền tảng. |
| Unpair/export/delete | Chưa nối nút vào backend hiện xóa cặp ngay. Spec đã quy định retention 30 ngày nhưng còn thiếu schema/jobs, export riêng theo ownership, thu hồi WS/media và chính sách ledger/quà chưa giao. Cần xử lý đồng bộ trước khi bật thao tác ảnh hưởng dữ liệu. |
| Tiny Mission/đổi quà | Không dùng giá trị preview làm luật thật. Thiếu timezone chung, điểm/mốc, hạn mức đổi nhiệm vụ, catalog/giá/tồn kho, fanpage, hạn mã, xác nhận giao và hoàn điểm. Chi tiết trong DECISIONS.md. |
| Hai lỗi UI baseline | Chưa sửa: cần đối chiếu thiết kế đã duyệt thay vì thay UI để chiều assertion cũ. Không coi đây là lỗi do API vừa nối. |
| E2E phát hành | Chưa có kiểm chứng hai máy Android/iOS, mạng lỗi và permissions cho phần mới. Các mục acceptance tiếp tục để Chưa. |

Các phần trên không được xem là đã hoàn tất hoặc đều bị chặn bởi người dùng: nhiều phần còn cần thực hiện thêm code/test. Phần chưa phù hợp để tự quyết là quy tắc điểm/quà/dữ liệu và cấu hình ngoài chưa được cung cấp; migration/live write chỉ thực hiện khi có phạm vi môi trường được xác nhận.
