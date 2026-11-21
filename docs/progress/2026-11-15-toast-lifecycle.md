# Toast: vị trí, vòng đời và kết quả thao tác

## Quy tắc hiển thị

Giữ thiết kế card trắng, màu icon/chữ theo tone, typography, rộng tối đa 360, animation vào 220 ms/ra 180 ms và thời gian đọc mặc định 3 giây. Vẫn chỉ một thông báo, thông báo mới thay thông báo cũ; không thêm hàng đợi.

Tất cả màn dùng một công thức: top = safe-area top + 8; căn giữa chiều rộng còn lại sau safe-area trái/phải, chừa gutter 16 mỗi bên. Không phụ thuộc route auth/main, header mở rộng hay orientation. Android/web dùng root portal lớp 200000 (cao hơn sheet 100000); iOS dùng FullWindowOverlay với cùng công thức tọa độ.

Viewport tồn tại khi có record toast, kể cả 180 ms exit, rồi được tháo. Cleanup có kiểm tra ID để không xóa toast thay thế. Không trông chờ duy nhất vào callback animation của thư viện.

## Vòng đời

- Store là nơi duy nhất sở hữu timer; timer Tamagui đặt Infinity để không có hai đồng hồ đóng cùng toast.
- Timer đọc kết quả được tạm dừng khi app xuống nền; kết quả tới trong background nhận đủ thời gian đọc khi trở lại. Giữ pause/resume do focus/hover/gesture của thư viện, nhưng resume tương tác không được bật timer trong background.
- Loading có watchdog 45 giây foreground: chuyển sang warning “Chưa nhận được kết quả”, nhắc kiểm tra dữ liệu. Đây không phải lỗi API và không hủy request. Kết quả server xác nhận đến muộn vẫn được phép thay warning nếu thao tác chưa bị thay thế hoặc mất scope.
- Người dùng có thể chạm/vuốt/escape để ẩn loading như các toast khác. Việc ẩn thông báo không hủy thao tác dữ liệu.
- Đổi route: đóng loading và thu hồi quyền phát kết quả của operation cũ; giữ kết quả đã xác nhận đủ TTL để thông báo trước điều hướng vẫn đọc được.
- Đổi session/account: reset nội dung và operation cũ đồng bộ qua session store. Provider unmount/recovery cũng dọn timer, overlay và nội dung. Không giữ thông báo tài khoản trước sang tài khoản mới.

## Call sites bất đồng bộ

Tạo handle trước await, dùng cùng handle cho loading và kết quả:

```tsx
const feedback = appToast.operation();
feedback.loading(getMessage(locale, "profileSaving"));
try {
  const saved = await service.save(input);
  // Kiểm tra scope và contract dữ liệu server trước khi áp dụng saved.
  feedback.success(getMessage(locale, "settingsSaved"));
} catch {
  feedback.error(getMessage(locale, "profileSaveFailed"));
} finally {
  feedback.dismiss(); // Chỉ đóng loading của handle, không đóng toast kết quả mới.
}
```

Handle cũ không thể thay thông báo của operation mới hoặc sau route/session reset. `appToast.success/error/info/warning` trực tiếp dành cho phản hồi đồng bộ hoặc sự kiện domain đã kiểm scope. Password-change/sign-out có kết quả cố ý phát ở session đăng xuất mới: caller phải xác nhận server acknowledgement/trạng thái identity trước khi phát.

Đã chuyển các luồng login/register failure, Profile load/save/avatar, Care Settings save, memory publish, invite accept/share/copy/skip và các phản hồi media/clipboard sang handle. Các sự kiện polling/auth vẫn dùng scope guard của domain. Không thêm backend mô phỏng hoặc xác nhận thành công từ timer.

Success chỉ xuất hiện sau dữ liệu/acknowledgement được service xác nhận. Lưu Profile thành công một phần vẫn báo riêng text/ảnh. Nội dung lỗi không khẳng định dữ liệu chưa được ghi khi mất response; yêu cầu tải lại kiểm tra. Native Share chỉ xác nhận đã mở tùy chọn chia sẻ, không suy diễn người nhận đã nhận lời mời.

## Kiểm tra và giới hạn

Unit tests dùng đồng hồ giả cho race, watchdog, pause/resume, route/session reset, cleanup và duration không hợp lệ; test frame kiểm tra safe-area dọc/ngang. Các test typography/card width vẫn giữ.

Đã kiểm tra Android emulator API 35 qua catalog UI (không ghi nghiệp vụ thật): toast hiển thị tại header, nổi trên dialog và sheet, tự hết hạn sau 3 giây. Ảnh: `.local-tools/flamee-toast-above-dialog.png`, `flamee-toast-above-sheet.png`, `flamee-toast-sheet-expired.png`, `flamee-toast-final-visible.png`, `flamee-toast-final-expired.png`. Watchdog 45 giây và race được xác minh bằng fake clock, chưa dùng thao tác ghi lên server thật để gây timeout.

Loading cũng đã kiểm tra đóng bằng chạm trên Android: `.local-tools/flamee-toast-loading-visible.png` và `flamee-toast-loading-dismissed.png`. Typecheck đạt; 20 test toast/profile liên quan đạt; full suite 361/362, còn test Check-in có lỗi baseline `bubbleToLargeTailGap: 6` trong khi token là `-6`; không đổi token ngoài phạm vi toast.

Chưa kiểm tra trực tiếp iOS, web, thiết bị thật hoặc toàn bộ nghiệp vụ sau đăng nhập. Trong catalog Android còn quan sát thấy frame sheet có thể lưu hình sau khi đóng dù nền đã nhận lại tương tác; toast đã hết hạn/được tháo độc lập. Không coi kiểm tra toast là bằng chứng vòng đời sheet đã được sửa.
