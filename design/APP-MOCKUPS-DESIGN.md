# Flamee — quy chuẩn bộ mockup v1

- Platform: cross-platform premium neutral, khung iPhone đen mảnh nhìn thẳng, một thiết bị trong một ảnh, canvas dọc 1024×1536, khoảng lề ngoài cân bằng.
- Chất liệu: nền stone/kem #EEECEA, ContentSurface ivory #FFFCF8; grain cực nhẹ và shadow ấm. Không hiệu ứng kính tràn lan; kính chỉ ở header Home/overlay chung.
- Màu: coral #FF7158, apricot #FCB76D, chữ #302924, chữ phụ #70655D, viền #E6DDD3, sage cho hoàn thành. Không purple/blue mặc định.
- Chữ: humanist/rounded sans; title tương đương 24 pt, title màn con 20 pt, body 14–16 pt; tiếng Việt có dấu, CTA ngắn. Title đen, không eyebrow/subtitle của trang và không divider dưới title.
- Header: Home có + / Dòng thời gian hoặc Kỷ niệm + dropdown / chuông. Màn khác có tên tính năng; màn con có back. Không đặt thêm global header Flamee lên mọi màn.
- Navigation: một pill coral/apricot nổi, bốn icon Home/Heart/Flag/Profile chia hai bên; FAB giữa tròn chứa ngọn lửa trắng, không phải dấu +, không có route hoặc menu. Active tab có capsule nhẹ. Auth/pairing/fullscreen check-in/settings drilldown không có bottom nav.
- Component đặc trưng: bottom action sheet, thought bubble, settings group cells, photo-led card strip. Decorative asset: flame/heart sticker và dotted arc nhỏ. Motion-implied: sheet rise và calm tab transition.
- Illustrations: flame mascot painterly; dùng cùng đôi avatar mặc định local làm tham chiếu. Ảnh kỷ niệm theo ánh sáng ấm tự nhiên, khung ảnh ổn định. Không dùng ảnh thật của tài khoản development.
- Forms: control chung bo góc, primary coral, secondary peach; button đủ lớn, field dễ đọc. Popup/sheet theo app, title coral/apricot nhỏ, nền frosted/cream, không headline đen khổng lồ riêng.
- Hiện trạng: dữ liệu mood/check-in ghi rõ preview/draft; Nudge/notification/care/data/support chưa nối đầy đủ hiển thị pending/unavailable. Không biến placeholder thành thao tác đã lưu thật.
- Scope: không quên/reset, không Google/Apple/OTP trong bản này; note check-in 60 ký tự, nhiều lý do. Các route alias và catalog nội bộ không nhân đôi ảnh.
- Tạo ảnh mới cho từng màn; không crop board hay screenshot Tiny Mission để giả một màn thiết kế mới.

Bộ ảnh dùng [37 prompt màn hình](APP-MOCKUPS-PROMPTS.json). Ảnh được kiểm trực quan về chữ, safe area, palette, trạng thái nghiệp vụ và consistency trước khi bàn giao.

