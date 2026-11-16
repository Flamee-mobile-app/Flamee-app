# Toast cho thao tác dữ liệu và native Modal

## Nguyên nhân

- MemoryActions xóa bài, useInlineMemoryEdit và CommentsPanel mutations không gọi toast kết quả; cập nhật cache/setFailed chưa đủ để thông báo xuất hiện.
- Luồng tạo đã có success/error nhưng chưa có loading; root toast không thể vượt native Modal bằng zIndex. Khi có alert native hoặc viewer, toast ở root có thể bị cửa sổ modal che.

## Sửa

- Tạo/sửa/xóa bài dùng appToast.operation trước await, loading và kết quả đúng API acknowledgement, scope còn hợp lệ. Failure giữ draft và báo kết quả chưa xác nhận, không nói chắc chưa ghi server khi timeout. Cuối request dọn loading theo ID, không dọn nhầm success/error mới.
- Bình luận/reply/edit/delete và comment/post heart có success/error theo hành động. Polling và reads không tạo success toast. Đổi phiên/route tiếp tục thu hồi operation cũ theo store; không cho response cũ báo thành công sang tài khoản mới.
- AppToastModalHost trong AppDialog.aboveSheet và AppImageViewer có ToastViewport native nằm trong modal, không portal về root. Host native trên cùng giữ quyền trình bày; root không render trùng notification. Dùng cùng global notification/timer, không provider phụ reset store hoặc khởi tạo timer thứ hai. Khi modal đóng, toast còn TTL chuyển về root cùng ID.
- Design-system dialog preview dùng aboveSheet để kiểm thử native Modal mà không ghi backend.

## Kiểm tra

- Typecheck qua; full mobile405test,404qua,1lỗi Check-in baseline `bubbleToLargeTailGap` ngoài phạm vi.
- Tests tạo/sửa/xóa xác nhận loading trước ack, success sau ack, failure/mismatch và scope switch không báo success sai; host registry/modal handoff giữ ID, đúng viewport name, không render trùng; existing TTL/pause/reset/late-operation tests đều qua.
- Android emulator: design-system toast nút demo trong native dialog hiển thị trên dialog (`.local-tools/toast-in-native-dialog-visible.png`, XML); toast tự biến mất (`toast-in-native-dialog-expired.xml`, count0); đóng dialog rồi thử root toast có1record (`toast-root-visible.xml`/PNG). Không tạo/xóa bài thật để QA. Chưa nghiệm thu các mutation thật hai thiết bị hoặc iOS/web trong lượt này.
