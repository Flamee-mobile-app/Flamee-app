# Smart Nudge — giao diện ngày 2026-11-21

## Phạm vi

Thay giao diện thẻ `SmartNudgeCard` và màn chi tiết `NudgeScreen`, giữ API thật, quyền receiver/couple, version khi cập nhật và toast acknowledgement hiện có. Chỉ truyền ID nudge qua route; observation/draft/reason không đưa vào params hoặc log.

## Thiết kế

- Thẻ xem trước là một `SectionCard` trắng: tên Smart Nudge, tiêu đề theo loại hành động, observation rút gọn, mascot local và chỉ dẫn mở gợi ý. Toàn bộ thẻ có thể bấm; không tạo nút lồng trong thẻ.
- Chi tiết dùng `FeatureScreen`/`ContentSurface`. Theo chỉnh sửa tinh gọn ngày 2026-11-21: chỉ giữ mascot, tiêu đề hành động cỡ h4 và draft đầy đủ trong `AppThoughtBubble showTail={false}` căn giữa. Bỏ observation ở chi tiết, nhãn lời nhắn, các chấm đuôi bong bóng và toàn bộ phần giải thích vì sao phù hợp. Không có disclosure thay thế. Observation vẫn dùng ở thẻ xem trước; reason vẫn thuộc dữ liệu API nhưng không hiển thị trong chi tiết.
- Mascot là minh họa thương hiệu, không đại diện cho cảm xúc đối phương hoặc dữ liệu suy diễn. Tiêu đề dựa trên `action_type`, trạng thái `crisis_safe` dùng nội dung/mascot nhẹ nhàng. Nội dung hiển thị giữ nguyên từ server, không tự viết lại lời nhắn. Trạng thái đã xử lý được rút gọn thành “Đã thực hiện”, “Đã để sau”, “Đã bỏ qua”, “Đã hết hạn”.
- CTA chính là hoàn thành; để sau và bỏ qua nằm chung hàng phía dưới. Giữ điều kiện snooze_count, thời điểm snooze, khóa thao tác đang chờ và acknowledgement đúng version. Gợi ý đã xử lý hiển thị trạng thái server tương ứng.
- Không tự sao chép/gửi lời nhắn. Hoàn thành vẫn là xác nhận thực hiện từ người dùng, không có mô phỏng gửi tin nhắn.
- Không polling nudge mỗi 15 giây hoặc refetch khi mạng kết nối lại. Tải khi mở lại màn với cache cũ, sau invalidation check-in/thao tác hoặc retry chủ động; giữ scope session/account/couple/revision.
- Kích thước minh họa/icon dùng `nudgeTokens`; nhãn mới có vi/en.

## Kiểm tra

- Typecheck đạt.
- Test frontend API acknowledgement snooze và design-system usage: 5 passed.
- Kiểm tra trực tiếp Expo Go trên Android emulator: thẻ mở đúng màn chi tiết với dữ liệu API thật, mascot/text không chồng lấn, CTA mặc định nằm trong viewport; mở phần reason có thể đọc đầy đủ và màn cuộn được.
- Không bấm hoàn thành/để sau/bỏ qua trong phiên kiểm tra giao diện này, giữ bản nudge cho người dùng kiểm thử. Chưa nghiệm thu mutation/toast thật trên Android/iOS hoặc mọi cỡ chữ hệ thống.
- Bản tinh gọn sau đó: typecheck và 5 test API/design-system đạt. Emulator đã quay về màn đăng nhập nên chưa xác minh trực tiếp bố cục tinh gọn sau đăng nhập; ảnh kiểm tra bản trước không phải bằng chứng cho bản tinh gọn.
