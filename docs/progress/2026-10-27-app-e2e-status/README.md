# Tiến độ hoàn thiện Flamee E2E

Cập nhật: 2026-10-27. Phạm vi: từ phần đã bổ sung sau khi duyệt kế hoạch đến các chức năng còn thiếu và thứ tự triển khai. Kế hoạch gốc: [2026-10-26-app-e2e-completion.md](../../superpowers/plans/2026-10-26-app-e2e-completion.md). Bằng chứng chi tiết: [E2E-EXECUTION-LOG.md](../../../.doc/E2E-EXECUTION-LOG.md).

## Phần đã bổ sung sau khi duyệt kế hoạch

- **Lịch sử cảm xúc/đối tác:** lịch tuần/tháng đọc API thật, có phân trang và lỗi riêng; popup đối tác hiển thị trạng thái được phép chia sẻ. Backend giới hạn dữ liệu đối tác/digest theo cặp hiện tại, giữ privacy của legacy flag.
- **Đồng bộ Home:** polling foreground 5 giây, tải lại khi về Home/resume, dừng khi rời màn hoặc đổi scope. Chưa phải WebSocket.
- **Chi tiết lượt triển khai tiếp:** [IMPLEMENTATION.md](IMPLEMENTATION.md) ghi phần đã làm, kiểm thử và lý do từng phần chưa hoàn tất.
- **Home:** đã nối sửa tiêu đề/nội dung, xóa bài và xóa từng ảnh qua API hiện có; có xác nhận xóa, khóa thao tác lặp, cập nhật/invalidate cache đúng scope và bỏ kết quả trả muộn. Chưa nghiệm thu UI hai thiết bị hoặc realtime.
- **Rà soát quyết định:** xem [DECISIONS.md](DECISIONS.md) cho quy định đã tìm thấy, khoảng trống điểm/quà/fanpage và sai lệch retention trong source.
- **Đăng xuất qua API:** thu hồi phiên server; phân biệt trường hợp chỉ đăng xuất local khi mất kết nối.
- **Gỡ avatar:** có popup xác nhận, gọi API thật và cập nhật ảnh mặc định.
- **Đổi mật khẩu:** nối UI → API; đổi thành công đóng phiên và yêu cầu đăng nhập lại. Lỗi mật khẩu hiện tại sai được trả riêng, tránh đăng xuất nhầm.
- **Bảo vệ khi đổi tài khoản:** response cũ không được ghi đè dữ liệu hoặc hủy phiên tài khoản mới.
- **Tài liệu thực thi:** lập ma trận API, tiêu chí nghiệm thu và nhật ký triển khai.

## Tiến độ theo nhóm tính năng

| Nhóm | Đã có | Còn thiếu |
| --- | --- | --- |
| Đăng nhập/đăng ký | Email/mật khẩu, khôi phục phiên qua API | Nghiệm thu UI trên hai thiết bị và các nhánh lỗi |
| Hồ sơ | Đọc/sửa tên, biệt danh; upload/gỡ avatar; đổi mật khẩu | Sở thích, cách muốn được quan tâm và thông tin quan hệ |
| Ghép đôi | Tạo mã, kiểm tra mã, nhận lời mời, đọc thông tin cặp qua API | Khép kín onboarding, link sau cài đặt và nghiệm thu đồng thời/hết hạn |
| Dòng thời gian/kỷ niệm | Đọc, tạo bài, upload ảnh, feed/lịch/chi tiết; sửa tiêu đề/nội dung, xóa bài/ảnh qua API | Nghiệm thu thao tác mới trên thiết bị; hoàn thiện retry khi mất response và đồng bộ hai máy |
| Check-in cảm xúc | UI draft; lịch sử tuần/tháng và trạng thái đối tác đọc API thật, có phân trang/privacy | Gửi đầy đủ draft lên server, idempotency, waiting mode; timezone preference và chi tiết các lần trong ngày |
| Smart Nudge | Có code backend, giao diện chưa khả dụng | Nối gợi ý, hành động, đánh giá; kiểm quyền riêng tư và AI fallback |
| Tiny Moments | Backend có một phần | Luồng gửi/nhận, media riêng tư, phản hồi, trạng thái đọc chưa khép kín |
| Realtime | Có WebSocket nền; Home có polling khi foreground và refresh khi resume | WebSocket xuyên suốt, reconnect, thu hồi quyền kết nối đang mở và nghiệm thu hai máy |
| Thông báo | Có adapter và endpoint device token | Push thật, nhắc lịch, cài đặt và mở đúng màn khi bấm thông báo |
| Cài đặt/vòng đời tài khoản | Menu và đăng xuất thật | Lưu preferences, hủy kết nối, xuất/xóa dữ liệu và chính sách giữ dữ liệu |
| Tiny Mission | UI preview nhiệm vụ, thành tựu, ví và đổi quà | Chưa có backend giao nhiệm vụ, hoàn thành, cộng/trừ điểm, thành tựu, cấp/tra mã nhận quà |

## Bằng chứng kiểm tra đã ghi nhận

- Lượt tích hợp lịch sử/đối tác: typecheck đạt; mobile **310/312**, còn hai lỗi baseline. Backend offline **138 passed/5 deselected** trước sửa private flag cuối; nhóm mood/privacy/AI boundary sau sửa **13 passed**. Chi tiết checkpoint trong IMPLEMENTATION.md.
- **22 bước API thật trên development đạt**, gồm tài khoản, hồ sơ/avatar, ghép đôi, đổi mật khẩu và đăng xuất.
- Checkpoint đợt tài khoản: mobile **297/299 test đạt**, còn hai lỗi UI baseline; backend **134 test đạt**. Đây là kết quả đã ghi trong nhật ký đợt đó, không phải lượt chạy mới khi lập báo cáo này.
- **Chưa nghiệm thu UI E2E Android/iOS trên hai thiết bị.** Các kết quả API/test trên không chứng minh toàn app hoạt động hoàn chỉnh.

Các chỉnh sửa sau đợt tài khoản chủ yếu là giao diện/mockup, đổi popup sang trắng và sửa IP API gây timeout đăng nhập; chúng chưa làm tăng phần nghiệp vụ đã nối API.

Đoạn trên mô tả checkpoint trước lượt triển khai Home ngày 2026-10-27. Lượt mới đã thêm các mutation Home nêu trên; kết quả kiểm tra và giới hạn xem nhật ký E2E. Toàn bộ phần còn thiếu trong bảng chưa được hoàn thành.

## Thứ tự triển khai còn lại

1. Khép kín tài khoản/ghép đôi và Home.
2. Kết nối check-in và lịch sử cảm xúc với API thật.
3. Hoàn thiện Smart Nudge và Tiny Moments.
4. Nối realtime, thông báo và cài đặt/vòng đời tài khoản.
5. Xây backend Tiny Mission cho nhiệm vụ, điểm, thành tựu và đổi quà.
6. Nghiệm thu toàn app trên hai thiết bị và chạy hồi quy.

Google/Apple/OTP đã chuyển đợt sau. Quên/reset mật khẩu đã bỏ theo yêu cầu của người dùng.

Chi tiết điều kiện nghiệm thu: [E2E-ACCEPTANCE.md](../../../.doc/E2E-ACCEPTANCE.md). Phạm vi endpoint và khoảng cách tích hợp: [E2E-API-CONTRACT.md](../../../.doc/E2E-API-CONTRACT.md).
