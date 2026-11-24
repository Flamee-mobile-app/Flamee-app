# Nền popup — 2026-10-27

Theo yêu cầu người dùng, toàn bộ nền popup trong app dùng màu trắng đặc (`$white`), thay cho liquid/glass.

- `AppDialog` và `AppDialogContent`: bỏ blur, gradient phản chiếu và nền bán trong suốt. Các giá trị `surfaceTone` cũ (`glass`, `paper`, `solid`) đều hiển thị trắng để caller hiện tại tương thích.
- `AppSheet`: frame trắng, không dựng `AppGlassBackdrop` khi truyền `blurTarget`. Giữ API props hiện tại, thao tác đóng, kéo, bàn phím và safe area.
- `AppToast`: nền trắng; giữ màu icon/chữ theo loại thông báo.
- Cập nhật 2026-11-15: Android/web đưa viewport thông báo vào root portal, lớp 200000 cao hơn sheet (100000); iOS giữ FullWindowOverlay. Mọi màn dùng cùng vị trí `safeArea.top + spacing.sm` (8), căn giữa phần chiều rộng an toàn, không cộng chiều cao header Home. Viewport chỉ mount khi có toast và được tháo sau exit để không giữ overlay rỗng. Xem `docs/progress/2026-11-15-toast-lifecycle.md` cho vòng đời và cách dùng thông báo bất đồng bộ.
- Giữ lớp overlay làm tối phía sau dialog/sheet. Không thay màu header Home, thanh điều hướng, thẻ nội dung hoặc nền tối của trình xem ảnh toàn màn hình.

Các popup tính năng tiếp tục dùng component chung; không tự thêm lại nền liquid hoặc blur trong feature.

`AppDialog.aboveSheet` hỗ trợ hộp xác nhận phía trên sheet: native dùng React Native Modal transparent/overFullScreen với GestureHandlerRootView và Dialog content inline (không dùng portal chung của sheet). Back/chạm backdrop đi qua guard dismissible, nền không nhận thao tác; giữ surface trắng và safe area/keyboard. Web giữ Dialog modal/portal hiện có. `AppSheet` chạm ngoài yêu cầu caller đóng thay vì tự đóng trước callback. Caller có thể giữ popup khi cần xác nhận bỏ thay đổi.

Sửa stacking2026-11-16: zIndex ở portal chung không đủ bảo đảm alert trên native sheet; đã thay đường aboveSheet bằng native Modal. Emulator xác nhận dialog Xóa trên cùng, Hủy/chạm ngoài giữ sheet; chỉ2nút alert có trong accessibility tree của modal. Ảnh `.local-tools/dialog-layer-modal.png`; không nhấn xác nhận xóa thật. Typecheck và11test liên quan qua.

Toast trong native Modal: dialog aboveSheet và AppImageViewer mount `AppToastModalHost`. Modal trên cùng có viewport riêng (portalToRoot=false, tên host duy nhất), root viewport tạm nhường hiển thị; dữ liệu/timer vẫn chỉ thuộc appToast store chung. Modal đóng thì chuyển cùng notification về root, không reset TTL/operation hoặc tạo toast thứ hai. Đã quan sát toast trong native alert và root, tự hết hạn: `.local-tools/toast-in-native-dialog-visible.png`, `toast-root-visible.png`.

Cập nhật2026-11-16: `AppDialog` có tùy chọn `anchor` để đặt menu cạnh phần tử được nhấn giữ. Vẫn dùng nền trắng/overlay chung; tự chọn phía trên/dưới và giới hạn vào safe area, bàn phím, chiều rộng màn hình. Popup có anchor nằm trên sheet, nội dung dài cuộn trong popup; không ảnh hưởng cách bố trí dialog thường. Bình luận dùng biến thể này cho menu thao tác, không dùng popup tối hoặc blur của ảnh tham khảo.
