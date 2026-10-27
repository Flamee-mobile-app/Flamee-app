# Flamee — bộ mockup các tính năng còn lại

Ngày 2026-10-27 · v1 · 37 ảnh độc lập · tạo bằng built-in image_gen.

Bộ hình này là đề xuất thiết kế theo phong cách Tiny Mission đã duyệt, không phải screenshot chứng minh tính năng đã hoạt động. Mỗi tính năng đóng gói trong `design/<feature>/v1/` giống `design/tiny-mission/v1/`. Tiny Mission giữ bộ riêng, không tạo lại trong đợt này.

## Quy ước

Nền kem, typography đen gọn; Home dùng header kính, các màn tính năng dùng title thường; pill nav coral với FAB ngọn lửa chỉ có hiệu ứng. Check-in giữ ghi chú 60 ký tự và chọn nhiều lý do. Quên/reset mật khẩu không nằm trong bộ này. OAuth/OTP thuộc đợt sau. Màn chưa nối API được vẽ với trạng thái chưa khả dụng, không thêm công tắc hoặc dữ liệu hoạt động giả.

Tài khoản Linh/Nam và ảnh sinh hoạt trong mockup chỉ là nội dung thiết kế, không lấy từ dữ liệu người dùng thật.

## Khởi động

[Mở thư mục ảnh và xem toàn bộ màn](startup/v1/README.md)

- [Khởi động](startup/v1/01-splash.png)

## Đăng nhập và đăng ký

[Mở thư mục ảnh và xem toàn bộ màn](auth/v1/README.md)

- [Đăng nhập](auth/v1/01-login.png)
- [Đăng ký](auth/v1/02-register.png)

## Mời và ghép đôi

[Mở thư mục ảnh và xem toàn bộ màn](couple/v1/README.md)

- [Chọn cách kết nối](couple/v1/01-choose.png)
- [Tạo lời mời](couple/v1/02-create.png)
- [Mã mời kết nối](couple/v1/03-code.png)
- [Chờ người ấy](couple/v1/04-waiting.png)
- [Nhập mã mời](couple/v1/05-enter-code.png)
- [Ghép đôi thành công](couple/v1/06-connected.png)
- [Lời mời hết hạn](couple/v1/07-expired.png)

## Home, dòng thời gian và kỷ niệm

[Mở thư mục ảnh và xem toàn bộ màn](home/v1/README.md)

- [Dòng thời gian](home/v1/01-timeline-v2.png)
- [Lịch kỷ niệm](home/v1/02-memory-calendar.png)
- [Kỷ niệm trong ngày](home/v1/03-day-memories.png)
- [Chi tiết kỷ niệm](home/v1/04-memory-detail.png)
- [Xem ảnh toàn màn hình](home/v1/05-photo-viewer.png)
- [Tạo bài đăng](home/v1/06-create-post.png)
- [Home chưa có kỷ niệm](home/v1/07-empty-feed.png)

## Cảm xúc và check-in

[Mở thư mục ảnh và xem toàn bộ màn](checkins/v1/README.md)

- [Mood của chúng ta](checkins/v1/01-overview.png)
- [Check-in: chọn cảm xúc](checkins/v1/02-feeling.png)
- [Check-in: lý do](checkins/v1/03-reasons.png)
- [Check-in: mức độ và giấc ngủ](checkins/v1/04-intensity.png)
- [Check-in: ghi chú](checkins/v1/05-note.png)
- [Lịch sử cảm xúc](checkins/v1/06-history.png)
- [Trạng thái người ấy](checkins/v1/07-partner.png)
- [Xác nhận bỏ bản nháp](checkins/v1/08-exit-confirm.png)

## Hồ sơ và cài đặt

[Mở thư mục ảnh và xem toàn bộ màn](profile-settings/v1/README.md)

- [Menu hồ sơ](profile-settings/v1/01-profile-menu.png)
- [Chỉnh sửa hồ sơ](profile-settings/v1/02-edit-profile-v2.png)
- [Xác nhận gỡ avatar](profile-settings/v1/03-remove-avatar.png)
- [Đổi mật khẩu](profile-settings/v1/04-password.png)
- [Cách muốn được quan tâm](profile-settings/v1/05-care.png)

## Tài khoản và dữ liệu

[Mở thư mục ảnh và xem toàn bộ màn](account-lifecycle/v1/README.md)

- [Tài khoản và kết nối](account-lifecycle/v1/01-account.png)
- [Xác nhận đăng xuất](account-lifecycle/v1/02-logout.png)
- [Dữ liệu của tôi](account-lifecycle/v1/03-data.png)
- [Hỗ trợ](account-lifecycle/v1/04-support.png)

## Thông báo

[Mở thư mục ảnh và xem toàn bộ màn](notifications/v1/README.md)

- [Cài đặt thông báo](notifications/v1/01-settings.png)
- [Thông báo trên Home](notifications/v1/02-home-sheet.png)

## Gợi ý quan tâm

[Mở thư mục ảnh và xem toàn bộ màn](smart-nudge/v1/README.md)

- [Gợi ý quan tâm chưa khả dụng](smart-nudge/v1/01-unavailable.png)

## Không tạo thành màn riêng

Các route alias/redirect như onboarding hiện chuyển sang ghép đôi, timeline alias và route legacy trùng nội dung dùng chung bộ hình tương ứng. Trang design-system/QA nội bộ không thuộc màn tính năng người dùng. Các tính năng tương lai như quỹ chung, gọi video nội bộ, AI hẹn hò và thanh toán không tự thêm vào bộ này.

