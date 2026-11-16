# Mood Check-in và Smart Nudge

Điểm Mood do người dùng chọn từ 1 (rất tệ) đến 5 (rất tốt), độc lập với cường độ cảm xúc. Check-in mới được chia sẻ đầy đủ với đối phương; dữ liệu cũ giữ nguyên quyền đã lưu. Bản check-in được gửi với idempotency key, chỉ thông báo thành công sau khi server xác nhận đủ dữ liệu.

Màn chọn cảm xúc dùng các GIF mascot đóng gói trong ứng dụng, mỗi cảm xúc tương ứng một GIF lặp. Android bật `expo-build-properties` `gifEnabled`; thay đổi cấu hình native yêu cầu build lại ứng dụng, không được xác nhận chỉ bằng reload JavaScript.

Tiến trình check-in gồm bốn nút mốc nối nhau: Cảm xúc, Lý do, Hôm nay, Ghi chú. Các bước đã qua có dấu tích, bước hiện tại có vòng nhấn và những bước sau dùng màu trung tính; chỉ thể hiện tiến độ, không điều hướng. Trình đọc màn hình nhận số bước hiện tại và tổng số bước.

Sau khi app vào foreground, nếu chưa check-in trong ngày theo timezone thiết bị, app gọi server bảo đảm có một nhắc cho tài khoản và ngày đó. Server lưu nhắc, tạo duy nhất một bản, và tự đánh dấu đã đọc sau check-in. Toast nhắc chỉ hiện trong app; chuông giữ danh sách nhắc và mở nhanh màn check-in. Tính năng này không đăng ký hoặc gửi push hệ điều hành khi app đóng.

Backend chỉ dùng hai Mood v2 chia sẻ đầy đủ mới nhất của hai thành viên cặp còn hiệu lực, mỗi bản thuộc ngày hiện tại theo timezone đã gửi. Gợi ý được tạo cho cả hai bằng mẫu tùy điểm của cả hai; note chỉ được kiểm tra tín hiệu khẩn cấp tại server và không chuyển sang nhà cung cấp AI. Khi hai bản Mood thay đổi, gợi ý cũ không còn hiển thị; context mới tạo gợi ý mới, còn các yêu cầu trùng context được giới hạn nguyên tử. Khi hoãn, backend giữ `status=new` và ghi `snoozed_until`; danh sách ẩn gợi ý đến hết thời hạn. Các thao tác chỉ báo thành công sau ACK hợp lệ.

## Vận hành và kiểm tra

- Deploy code backend cùng các migration Mood v2 phụ thuộc sẵn có và `backend/migrations/20261116_mood_daily_reminders.sql` theo quy trình môi trường; sau đó triển khai mobile. `GET /moods/capabilities` chỉ bật `dual_mood_nudge` khi các cột, RPC v2 và reminder đã có. Khi capability không có, mobile không gửi check-in v2 hay dựng nhắc/gợi ý giả.
- Migration sửa RPC tạo nudge để giữ cooldown cũ cho luồng cũ, và chống trùng theo cặp Mood ở luồng mới. Không tự chạy migration hoặc ghi production từ môi trường phát triển.
- Test local dùng FakeSupabase, transport double và PGlite cô lập: kiểm tra hai tài khoản, bảo vệ quyền, thời điểm/ngày, check-in lại, hoãn, idempotency, timezone, nhắc/đọc và xác nhận ACK. Các test này không chứng minh production đã triển khai hay hai thiết bị đã hoạt động.
- Cần nghiệm thu sau deploy với hai tài khoản thử và Android/iOS: chuyển ngày/timezone, vào lại app, kiểm tra chuông và nhanh đến check-in, cả hai hoàn thành, cập nhật một Mood, hoãn và thao tác khi mất mạng/đổi tài khoản.
