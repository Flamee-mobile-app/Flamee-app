# Mood Check-in và Smart Nudge

Điểm Mood do người dùng chọn từ 1 (rất tệ) đến 5 (rất tốt), độc lập với cường độ cảm xúc. Check-in mới được chia sẻ đầy đủ với đối phương; dữ liệu cũ giữ nguyên quyền đã lưu. Bản check-in được gửi với idempotency key, chỉ thông báo thành công sau khi server xác nhận đủ dữ liệu.

Ba thanh đánh giá ngày, cường độ cảm xúc và giấc ngủ dùng chung `AppSlider` với kéo mượt, ẩn vạch chia và số trên nút kéo. Điểm đánh giá ngày vẫn được chốt theo số nguyên từ 1 đến 5.

## Hiển thị sau chia sẻ

**Cập nhật 2026-11-24:** theo yêu cầu mới, bong bóng cảm xúc trên màn chính hiển thị thêm GIF/emoji/sticker đã lưu trong `attachments`, dùng cùng renderer với màn chi tiết. Quy định này thay thế giới hạn chỉ tên cảm xúc/ghi chú ngày 21/11 bên dưới. Không tự thêm mascot mặc định khi người dùng không đính kèm; ID không có trong catalog được bỏ qua. Chủ tài khoản được xem media của mình; đối phương chỉ thấy media khi chia sẻ đầy đủ. Giữ giới hạn 24 giờ và cách ly phiên/cặp hiện có. Vùng bong bóng dùng token cao 176px và media 32px để có chỗ cho ghi chú hai dòng và media xuống hàng, giữ avatar hai người thẳng hàng; cần kiểm chứng trên thiết bị nhỏ và với cỡ chữ lớn.

- Hai cụm hồ sơ trên màn cảm xúc nằm trong một `SectionCard` nền trắng chung, không có thẻ riêng cho từng hồ sơ; mỗi cụm vẫn bấm được bằng control dùng chung để mở check-in hoặc cảm xúc đối phương. Hai cụm đọc check-in thật từ lịch sử của chủ tài khoản và API cảm xúc đối phương. Theo chỉnh sửa ngày 2026-11-21, bong bóng chỉ hiển thị tên cảm xúc và ghi chú đã lưu trong 24 giờ gần nhất, không có sticker hoặc ảnh đính kèm; đối phương chỉ hiện ghi chú khi chia sẻ đầy đủ. Bong bóng dùng `AppThoughtBubble fitContent`, co theo chiều rộng/chiều cao nội dung và padding, giới hạn trong bề rộng thẻ. Tên cảm xúc tối đa một dòng (15px), ghi chú tối đa hai dòng (14px); trạng thái chưa chia sẻ được rút gọn. Avatar hồ sơ 88px có viền sáng mảnh, vùng bong bóng 100px và vùng tên 40px dùng token chung để giảm khoảng trống và giữ bố cục cân đối. Vùng bố trí bên ngoài bong bóng dùng token chung để giữ hai avatar và tên hồ sơ thẳng hàng; không ép nền bong bóng theo chiều cao vùng này. Không có bản gần đây thì hiện trạng thái chưa chia sẻ, không hiển thị dữ liệu mẫu. Không polling cảm xúc và không tự tải lại khi mạng kết nối lại. Query cập nhật khi mở lại màn với cache đã cũ, sau chia sẻ thành công hoặc khi người dùng chủ động tải lại. Một timer cục bộ ẩn bản hết hạn 24 giờ mà không gọi API; tải nền giữ nội dung đã có, không đổi trạng thái rỗng sang loading và không xóa cảm xúc đối phương chỉ vì màn mất focus. Thay đổi tài khoản/cặp hoặc quyền truy cập vẫn phải ẩn dữ liệu cũ.
- Lịch tuần/tháng dùng GIF tương ứng trong catalog cảm xúc mới trước bộ emoji legacy. Mỗi ngày lấy bản mới nhất, ưu tiên `local_date` đã được server xác nhận; dữ liệu cũ chưa có ngày này dùng timestamp như trước.
- Chi tiết ngày giữ dữ liệu server gốc: sticker, giờ tạo, điểm ngày, cường độ, giấc ngủ, lý do, ghi chú và đính kèm. Nội dung riêng tư chỉ phục vụ chủ tài khoản, không đưa vào route params hoặc toast. Tải lại/tải thêm chủ động có toast kết quả và bỏ phản hồi sau đổi tài khoản/phiên.

Màn chọn cảm xúc dùng các GIF mascot đóng gói trong ứng dụng, mỗi cảm xúc tương ứng một GIF lặp. Android bật `expo-build-properties` `gifEnabled`; thay đổi cấu hình native yêu cầu build lại ứng dụng, không được xác nhận chỉ bằng reload JavaScript.

Tiến trình check-in gồm bốn nút mốc nối nhau: Cảm xúc, Lý do, Hôm nay, Ghi chú. Các bước đã qua có dấu tích, bước hiện tại có vòng nhấn và những bước sau dùng màu trung tính; chỉ thể hiện tiến độ, không điều hướng. Trình đọc màn hình nhận số bước hiện tại và tổng số bước.

Sau khi app vào foreground, nếu chưa check-in trong ngày theo timezone thiết bị, app gọi server bảo đảm có một nhắc cho tài khoản và ngày đó. Server lưu nhắc, tạo duy nhất một bản, và tự đánh dấu đã đọc sau check-in. Toast nhắc chỉ hiện trong app; chuông giữ danh sách nhắc và mở nhanh màn check-in. Tính năng này không đăng ký hoặc gửi push hệ điều hành khi app đóng.

Backend chỉ dùng hai Mood v2 chia sẻ đầy đủ mới nhất của hai thành viên cặp còn hiệu lực, mỗi bản thuộc ngày hiện tại theo timezone đã gửi. Gợi ý được tạo cho cả hai bằng mẫu tùy điểm của cả hai; note chỉ được kiểm tra tín hiệu khẩn cấp tại server và không chuyển sang nhà cung cấp AI. Khi hai bản Mood thay đổi, gợi ý cũ không còn hiển thị; context mới tạo gợi ý mới, còn các yêu cầu trùng context được giới hạn nguyên tử. Khi hoãn, backend giữ `status=new` và ghi `snoozed_until`; danh sách ẩn gợi ý đến hết thời hạn. Các thao tác chỉ báo thành công sau ACK hợp lệ.

## Vận hành và kiểm tra

- Sửa ngày 2026-11-24: khi chọn GIF/emoji/sticker trong ghi chú, draft chỉ lưu `{ kind, id }`. Không lưu nguyên đối tượng gợi ý có `label` và `source`: `label` bị gửi vào JSON và API từ chối với HTTP 422 do attachment cấm trường ngoài contract. Regression test kiểm tra cả ba loại và round-trip API bằng transport double. APK đã xuất trước bản sửa cần build lại; test local không thay thế nghiệm thu trên thiết bị.

Thiết kế và giới hạn kiểm chứng giao diện Smart Nudge mới: [SMART-NUDGE-UI.md](SMART-NUDGE-UI.md).

- Deploy code backend cùng các migration Mood v2 phụ thuộc sẵn có và `backend/migrations/20261116_mood_daily_reminders.sql` theo quy trình môi trường; sau đó triển khai mobile. `GET /moods/capabilities` chỉ bật `dual_mood_nudge` khi các cột, RPC v2 và reminder đã có. Khi capability không có, mobile không gửi check-in v2 hay dựng nhắc/gợi ý giả.
- Migration sửa RPC tạo nudge để giữ cooldown cũ cho luồng cũ, và chống trùng theo cặp Mood ở luồng mới. Không tự chạy migration hoặc ghi production từ môi trường phát triển.
- Test local dùng FakeSupabase, transport double và PGlite cô lập: kiểm tra hai tài khoản, bảo vệ quyền, thời điểm/ngày, check-in lại, hoãn, idempotency, timezone, nhắc/đọc và xác nhận ACK. Các test này không chứng minh production đã triển khai hay hai thiết bị đã hoạt động.
- Cần nghiệm thu sau deploy với hai tài khoản thử và Android/iOS: chuyển ngày/timezone, vào lại app, kiểm tra chuông và nhanh đến check-in, cả hai hoàn thành, cập nhật một Mood, hoãn và thao tác khi mất mạng/đổi tài khoản.
