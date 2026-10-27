# Nền popup — 2026-10-27

Theo yêu cầu người dùng, toàn bộ nền popup trong app dùng màu trắng đặc (`$white`), thay cho liquid/glass.

- `AppDialog` và `AppDialogContent`: bỏ blur, gradient phản chiếu và nền bán trong suốt. Các giá trị `surfaceTone` cũ (`glass`, `paper`, `solid`) đều hiển thị trắng để caller hiện tại tương thích.
- `AppSheet`: frame trắng, không dựng `AppGlassBackdrop` khi truyền `blurTarget`. Giữ API props hiện tại, thao tác đóng, kéo, bàn phím và safe area.
- `AppToast`: nền trắng; giữ màu icon/chữ theo loại thông báo.
- Giữ lớp overlay làm tối phía sau dialog/sheet. Không thay màu header Home, thanh điều hướng, thẻ nội dung hoặc nền tối của trình xem ảnh toàn màn hình.

Các popup tính năng tiếp tục dùng component chung; không tự thêm lại nền liquid hoặc blur trong feature.
