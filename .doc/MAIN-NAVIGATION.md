# Pill nav — cập nhật 2026-11-16

## Điều chỉnh theo yêu cầu 2026-11-16 (ưu tiên hơn mô tả lịch sử bên dưới)

- Nút Flamee mở tổng quan cảm xúc `/(main)/moments`, không tự khởi động check-in. Người dùng chủ động chọn hành động của mình trên màn tổng quan để mở `/mood/check-in`. Quick action cảm xúc trong Profile vẫn mở check-in trực tiếp.
- `moments` không đặt `href: null`: Expo Router hiện tại chuyển `href: null` thành `hidden: true` và redirect khi truy cập. Chỉ ẩn khỏi pill nav qua danh sách `tabRouteNames`.
- Mood không xóa partner/tải lại connection vô điều kiện khi chuyển tab; dùng cache theo phiên/couple và giữ avatar đã xác nhận khi refresh. Chi tiết cache, URL ảnh và kiểm tra trong `AVATAR-LOADING.md`.
- Header các tab chính gồm tiêu đề nội dung của tab và chuông thông báo thật (giữ inbox/badge hiện có). Header nằm trong nội dung cuộn, không sticky, không có chuông nổi riêng ở layout. Root header chỉ tiếp tục phục vụ các màn ngoài `(main)`, gồm title/back của luồng check-in và màn chi tiết.
- Layout cung cấp header qua `MainScreenHeaderContext`; `AppScreen` đặt header trong ScrollView, Home/Kỷ niệm đặt trong `FlatList.ListHeaderComponent`. Home tự xử lý safe area, bỏ khoảng trống dành cho chuông nổi cũ. Không lồng ScrollView quanh FlatList.
- Lịch mở tháng hiện tại ngay dưới header, các tháng cũ nối tiếp phía dưới; không còn đảo FlatList. Thống kê nằm sau danh sách tháng. Feed, dữ liệu API và quyền truy cập không thay đổi.
- Feed Home dùng skeleton pulse đến khi ảnh thực sự hiện, thumbnail→cover fade và prefetch có giới hạn theo vùng nhìn thấy; xem `HOME-IMAGE-LOADING.md`.
- Sửa bài trực tiếp trong popup chi tiết, giữ ở popup khi còn bản nháp; thoát phải xác nhận bỏ thay đổi nếu đã sửa. Xóa mở dialog cảnh báo phía trên sheet để xác nhận. Xem yêu cầu mới nhất trong `POST-EDIT-DELETE.md`.
- Chạm nội dung/ảnh thẻ hoặc Bình luận mở trang bài đăng riêng, có thread và composer; không mở sheet bình luận cũ. Chỉ nút ba chấm giữ sheet thao tác nhanh. Xem `POST-DETAIL-PAGE.md` cho viewer toàn màn hình, API tim bài và giới hạn deployment.

Kiểm tra 2026-11-16: `npm run typecheck` và 13 test điều hướng/lịch/design-system qua. Toàn suite 371/372 qua; test `uses an intrinsic thought bubble, centered avatar and 56px picker row` thất bại vì kỳ vọng `bubbleToLargeTailGap: 6` trong tokens, ngoài các file chỉnh sửa của yêu cầu này. Android emulator đã xác nhận nhấn Flamee mở tổng quan có lịch tuần/hành động của hai người, cuộn làm title và chuông rời màn hình; Kỷ niệm mở với title/chuông và tháng hiện tại. Ảnh `.local-tools/flamee-main-header-mood.png`, `.local-tools/flamee-main-header-calendar.png`; không thao tác lưu check-in hoặc ghi dữ liệu server trong lượt kiểm tra.

## Lịch sử 2026-11-15

Yêu cầu mới nhất của người dùng thay thế quy tắc FAB chỉ có hiệu ứng ngày 2026-10-26. Thứ tự cố định từ trái sang phải:

| Vị trí | Chức năng | Route |
| --- | --- | --- |
| 1 | Home / feed | `/(main)` |
| 2 | Kỷ niệm, icon lịch | `/(main)/memories` |
| Giữa, nút Flamee | Mood Check-in | `/mood/check-in` |
| 3 | Tiny Mission | `/(main)/tasks` |
| 4 | Hồ sơ | `/(main)/profile` |

Nút Flamee mở trực tiếp Mood Check-in, không mở Tiny Mission hoặc menu. Giữ hiệu ứng nhấn/thả, bóng và reduced motion. Dùng navigate để tránh xếp lặp route check-in. Nhãn/hint vi/en mô tả đúng chức năng mở ghi lại cảm xúc.

Home và Kỷ niệm không còn header nổi `+ / title chọn view / chuông`; title/back của các màn tính năng khác giữ nguyên. Chuông inbox mới là nút nổi riêng ở góc phải trên các tab chính, không dựng lại thanh header. Padding list là safe area trên +72 (gap8, nút48, gap16), đủ tránh chuông che bài/lịch. Nút thêm bài dạng tròn gọn 48, nền trắng với bóng mềm, dấu +22 dùng gradient cam–đào thương hiệu; neo góc phải ngay trên pill nav (gap16, tính theo chiều cao nav và safe area), thay cho CTA ngang đầu feed. Chỉ hiện nút thêm ở Home/Kỷ niệm khi đã bootstrap và có account/couple; mở đúng composer hiện có. Trạng thái rỗng và nút thêm tại ngày hiện tại của lịch vẫn dùng luồng tạo bài thật hiện có. Xem MEMORY-CONVERSATIONS.md cho inbox/badge và quyền bình luận.

Kỷ niệm dùng lại HomeScreen ở view calendar, cùng query/cache/API, không sao chép dữ liệu backend hoặc thêm dữ liệu giả. Route `moments` (dashboard cảm xúc cũ) vẫn tồn tại cho liên kết hiện có nhưng được ẩn khỏi pill nav. `timeline` và link Home cũ có `view=memories` redirect sang route chính xác để capsule chọn đúng tab. `useFabActions` vẫn dùng cho các quick action Profile; emotion intent mở `/mood/check-in`.

Đã kiểm tra Android emulator: Kỷ niệm chọn tab lịch, không có header nổi; nhấn Flamee mở Mood Check-in và quay lại được; tab lấp lánh mở Tiny Mission. Ảnh bằng chứng trong `.local-tools/flamee-nav-memories.png`, `flamee-nav-mood.png`, `flamee-nav-tiny.png`. Phiên emulator chưa ghép đôi nên chưa kiểm tra trực tiếp lịch có dữ liệu ảnh thật trong lượt này. Không dùng kiểm tra điều hướng để xác nhận thao tác ghi Mood/Tiny Mission đã tích hợp backend.
