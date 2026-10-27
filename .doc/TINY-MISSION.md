# Tiny Mission — frontend được duyệt ngày 2026-10-25

## Phạm vi đã chốt

- Hệ thống giao 4 nhiệm vụ/ngày, kết hợp cá nhân và chung; được đổi nhiệm vụ.
- Mỗi người tự đánh dấu phần của mình, không duyệt chéo.
- Điểm chung của cặp dùng đổi quà hiện vật; có tiến độ/thành tựu tuần và tháng.
- Đổi quà trừ điểm ngay và cấp mã; popup cho mở fanpage, sao chép mã và link.
- Thiết kế: `design/tiny-mission/v1/`. Người dùng đã duyệt; làm frontend trước, backend sau.

## Giới hạn bản frontend

Giao diện xem trước dùng nội dung mẫu tách trong feature, ghi rõ là bản xem trước. Không tạo service giả, không lưu điểm/nhiệm vụ/mã vào session hoặc storage, không gửi dữ liệu mẫu lên server. Các thao tác nghiệp vụ chưa kết nối phải thông báo chưa khả dụng; không xác nhận đã hoàn thành hay đổi quà thật. Link fanpage chưa được cung cấp nên không mở một fanpage tự đặt.

Chia 2 cá nhân (mỗi người 1) + 2 chung, mức điểm và mốc thưởng trong thiết kế là giá trị minh họa. Giới hạn đổi nhiệm vụ, múi giờ ngày chung, phân bổ quà và mã thật sẽ được chốt trong contract backend.

## Header và avatar

Theo yêu cầu mới, chỉ Dòng thời gian/Kỷ niệm giữ header kính. Các tính năng khác dùng tiêu đề tên tính năng màu đen, căn trái, không nền kính, không menu/chuông. Màn con vẫn có nút quay lại. Giữ một host tại root và metadata hiện có để tránh lặp header.

Header tính năng không có divider/separator. Host cao 52 px, cách nội dung 4 px; tiêu đề chính 24 px và tiêu đề màn con 20 px. Tiêu đề giữ một dòng và tự co trong giới hạn để không chồng lên vùng nút quay lại trên màn hình hẹp.

Hai chân dung minh họa dùng làm ảnh fallback cục bộ khi không có ảnh hồ sơ hoặc ảnh tải lỗi. Lựa chọn theo định danh ổn định, không suy đoán giới tính, không thay đổi avatar_url trên server. Ảnh người dùng tải lên luôn được ưu tiên.

## Hiệu chỉnh theo mockup ngày 2026-10-26

- Hôm nay: thanh tab chung, ví điểm viền mảnh, tiến độ nằm cạnh tiêu đề ngày, bốn thẻ có minh họa màu và trạng thái nằm trong thẻ; nút đổi nhiệm vụ tách khỏi vùng mở chi tiết để không lồng control.
- Chi tiết: route `/tiny-mission/[mission]` ngoài tab navigator; nhận duy nhất ID mẫu trong allowlist, có quay lại và không có thanh điều hướng dưới. Minh họa gọi video, badge loại nhiệm vụ/điểm, trạng thái hai người và CTA nằm trong một ContentSurface.
- Đổi nhiệm vụ: AppSheet nền kem, tiêu đề đen, tóm tắt nhiệm vụ, sơ đồ chuyển đổi, nhắc điều kiện và hai CTA. Nhiệm vụ đã có người đánh dấu không được đổi.
- Thành tựu: linh vật đôi, chọn tuần/tháng, bảng 7 ngày, tổng tiến độ và thẻ mốc thưởng; điều hướng kỳ chưa có dữ liệu được disable.
- Đổi quà: tab có icon/gạch chân, ví điểm coral, ảnh quà tỷ lệ 1.25, lưới hai cột; popup xác nhận có ảnh/tổng điểm và popup mã có tóm tắt quà, vùng sao chép mã/link.
- Giữ header gọn đã được yêu cầu sau mockup; dùng font system fallback hiện có vì chưa có binary font Rounded được cấp phép. Không thay header hoặc navigation của module khác.
- Các mở rộng ở shared là tùy chọn: button outline/flat/compact, text button compact, chip segment/tab, card flat/paper, sheet title plain và dialog paper/header action. Giá trị mặc định của control cũ được giữ nguyên.

Minh họa mới: `flamee-mobile/src/features/tiny-mission/assets/video-call.png` và `flame-couple.png`; prompt nằm trong `design/tiny-mission/implementation-assets.json`. Ảnh render thực tế và phạm vi QA nằm trong `design/tiny-mission/qa-2026-10-26/README.md`.

## Đồng bộ component theo phản hồi ngày 2026-10-26

Yêu cầu này thay thế các tùy biến tương ứng ở phần hiệu chỉnh phía trên:

- Cả ba mục Hôm nay, Thành tựu và Đổi quà dùng cùng một thanh tab icon/gạch chân (`AppFilterChip presentation="tab"`), không đổi kiểu thanh nav khi chuyển mục.
- Tuần/Tháng dùng `AppFilterChip` mặc định của hệ thống, bỏ segmented control nền pill riêng.
- Lịch dùng `AppCalendarGrid` và `AppCalendarDay` giống module lịch của app. Ngày hiển thị số nhiệm vụ hoàn thành trên 4 trong vòng tròn dùng chung, có số ngày và đánh dấu hôm nay/tương lai. Tháng 10/2026 có đúng 31 ngày, căn thứ theo tuần bắt đầu Thứ Hai. Không còn grid chấm tự dựng riêng.
- Các popup và sheet dùng nền/title/spacing mặc định của `AppDialog`/`AppSheet`; nút primary/secondary chuẩn. Bỏ `hideTitle`, title riêng, nền paper, close action riêng và nút outline/flat trong các overlay của Tiny Mission.
- Giữ giới hạn preview, không thay đổi điểm hoặc trạng thái nhiệm vụ khi chưa kết nối backend.

Ảnh render cập nhật nằm trong `design/tiny-mission/qa-system-controls/README.md`. `AppCalendarGrid` dùng flex basis bằng 0 cho từng cột để ô trống đầu/cuối tháng có cùng độ rộng với ô có nội dung.

### Thử nghiệm cách đánh dấu lịch tháng

Theo phản hồi tiếp theo, lịch tháng bỏ phân số trong vòng tròn. `AppCalendarDay` bổ sung variant `progress` dùng lại token và bố cục lịch chung: số ngày ở giữa ô bo góc; bốn vạch phía dưới tương ứng bốn nhiệm vụ. Ngày hoàn thành đủ có nền xanh dịu và dấu check; ngày làm một phần có nền peach nhẹ và vạch coral; hôm nay có viền coral; ngày tương lai chỉ hiện số ngày mờ. Chú giải nằm dưới lịch. Lịch tuần giữ nguyên. Đây chỉ là cách trình bày dữ liệu preview, không thay đổi việc ghi nhận nhiệm vụ hoặc điểm.
