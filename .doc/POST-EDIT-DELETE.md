# Sửa/xóa bài đăng — 2026-11-16

## Yêu cầu mới nhất: sửa trong popup chi tiết

Toast kết quả: tạo/sửa/xóa bài phát loading và success/error từ cùng operation handle; chỉ báo thành công sau acknowledgement thật và khi scope còn hợp lệ. Sửa/xóa trước đây chỉ cập nhật cache/setFailed nên không có toast, nay đã nối thông báo. Loading được dọn trong finally, không dismiss nhầm toast kết quả. Native modal có viewport toast riêng nên lỗi xóa không bị alert che.

Hiệu chỉnh alert native mới nhất: `AppDialog.aboveSheet` chuyển từ portal chung sang native Modal riêng. Đã kiểm tra trực tiếp Android: alert xóa ở trên sheet, Hủy và chạm ngoài chỉ đóng alert, giữ detail. Không còn dựa vào tăng zIndex để xử lý thứ tự. Chi tiết/bằng chứng `POPUP-SURFACES.md`, `.local-tools/dialog-layer-modal.png`; chưa xóa bài thật.

### Đồng bộ trường tạo/sửa và vị trí ảnh

- Form sửa chỉ hiển thị một ô text200ký tự, dùng cùng label trợ năng/placeholder/multiline với composer tạo, không có ô `description` bổ sung. `description` cũ được giữ nguyên khi lưu, không âm thầm xóa dữ liệu lịch sử.
- Ảnh chính nằm đầu form, trước ô text, dùng `AppPhotoPicker` chung và nút Thay ảnh/Gỡ ảnh đã chọn hoặc Thêm ảnh. Preview không crop, giới hạn theo vùng sheet để nút lưu không bị đẩy quá sâu. Không lặp lại ảnh chính dưới nút lưu. Ảnh còn lại của album cũ được giữ; thao tác này thay/gỡ ảnh đầu tiên, không xóa cả album.
- Picker chỉ tạo draft local, không upload/xóa server khi chọn hoặc gỡ. Dirty check bao gồm thay/gỡ ảnh; bỏ draft dọn file tạm. Khi đang chọn ảnh khóa thao tác gỡ để không xử lý hai thao tác chồng nhau.
- Lưu dùng API thật đã có: upload ảnh mới với stable idempotency key → xóa ảnh cũ qua DELETE `/memories/{id}/images/{image_id}` yêu cầu204 → PUT text và nhận detail mới. Không xóa ảnh cũ trước acknowledgement upload. Checkpoint giữ bước đã thành công, retry không upload trùng; nếu mất acknowledgement delete thì đọc detail xác minh ảnh đã vắng mặt trước khi coi bước xóa hoàn tất. Mỗi bước kiểm scope trước/sau, service mutations vẫn kiểm auth/membership.
- Đây là nhiều API riêng, không phải transaction nguyên tử. Nếu lỗi giữa các bước có thể có thay đổi ảnh đã được server xác nhận; UI báo chưa hoàn tất, khóa draft đã gửi để retry cùng payload/key và refetch đối chiếu. Hủy sau một lần gửi lỗi không có nghĩa rollback các bước đã được server xác nhận. Không báo lưu thành công trước response cuối.
- Sau lưu, cache feed nhận cover/count/thumbnail mới từ detail server khi ảnh thay đổi; chỉnh text đơn thuần giữ media metadata hiện có. Bài chỉ có ảnh vẫn lưu được theo quy tắc composer, tiêu đề rỗng dùng nhãn mặc định của form tạo.

Kiểm tra lượt đồng bộ ảnh: typecheck qua;400test,399qua,1lỗi baseline Check-in ngoài phạm vi. Test thêm kiểm tra form ảnh trước/text duy nhất; chọn ảnh đánh dấu dirty; upload trước delete, retry checkpoint và key, upload lỗi không xóa ảnh cũ, mất delete ack được đối chiếu server, hidden description được giữ; API delete ảnh encode ID, auth và204. Android đã kiểm tra form có ảnh hiện nút Thay ảnh phía trên text, form không ảnh có Thêm ảnh; không bấm lưu/upload/xóa dữ liệu thật. Bằng chứng `.local-tools/edit-photo-ui-form.png`, `edit-photo-ui-final.png`. Chưa nghiệm thu mutation ảnh thật, iOS/web hay kết nối chập chờn thực tế.

Cập nhật xác nhận xóa theo yêu cầu mới nhất: nhấn Xóa bài đăng mở `AppDialog` cảnh báo “Xóa bài đăng?” phía trên sheet, có mô tả không thể hoàn tác, Xóa bài đăng/Hủy. Không còn thay vùng thao tác bằng xác nhận inline. Hủy/Back/chạm ngoài dialog không gọi DELETE và giữ sheet chi tiết. Khi đang xóa khóa đóng/gửi lặp; lỗi hiện trong dialog, chỉ loại bài khỏi cache sau204. Typecheck và9test liên quan qua, gồm mở đúng lớp dialog, Hủy không gọi API và giữ single-flight/ack-only. Emulator hiện ở đăng nhập nên chưa kiểm tra dialog này với bài thật; không thao tác ghi dịch vụ.

Phần này thay thế luồng sửa trên feed trong mô tả lịch sử bên dưới. Runtime `ErrorBoundary` phát sinh trong kiểm tra được xác định là lỗi sau import ExpoCrypto/ExpoSQLite; khởi động lại một phiên Expo Go đã vào màn đăng nhập, xem `RUNTIME-ERRORBOUNDARY-20261116.md`. Chưa kiểm tra lại popup với account thật sau lần restart do phiên không remembered.

- Nhấn Sửa chuyển title/nội dung sang form ngay trong AppSheet chi tiết, giữ ảnh trong popup. Không đóng sheet, không mở editor trên Home hoặc điều hướng khỏi Kỷ niệm. Lưu qua PUT thật và cập nhật cache sau acknowledgement như trước; lưu xong trở lại nội dung chi tiết.
- Chạm ngoài, nút X, Back hoặc Hủy khi chưa thay đổi sẽ đóng/bỏ chế độ sửa ngay. Nếu title/description khác bản gốc thì hiện “Bỏ thay đổi?” với Bỏ thay đổi/Tiếp tục chỉnh sửa. Chọn tiếp tục giữ nguyên sheet và draft; chọn bỏ mới reset. Hủy form chỉ quay về xem chi tiết, còn đóng popup thì thoát cả sheet. Trong lúc lưu khóa thoát; scope/focus mất thì dọn draft riêng tư.
- `AppSheet` chuyển chạm overlay thành yêu cầu qua callback của caller, tắt cơ chế tự đóng nội bộ trước callback để caller có thể giữ sheet chờ xác nhận.
- `AppDialog.aboveSheet` dùng native Portal có stacking wrapper và GestureHandlerRootView thay cho PortalItem không có wrapper của Dialog native; hộp xác nhận nằm trên sheet và nhận thao tác. Back/chạm ngoài hộp xác nhận chỉ giữ bản nháp và quay về editor. Web giữ Dialog modal hiện có.
- Đã bỏ editor/route editMemoryId/scroll-to-edit khỏi main feed; draft thuộc HomeOverlays và form trong MemoryDetailView, dùng chung hook mutation hiện có.

Kiểm tra cuối: typecheck qua;395test,394qua,1lỗi Check-in baseline `bubbleToLargeTailGap`. Test mới kiểm tra editor nằm trong sheet, dirty compare/hoàn tác về giá trị ban đầu, đóng sạch không hỏi, dirty close giữ popup, keep/discard và native stacking wrapper/Back. Đã quan sát form sửa nằm trong sheet và tái hiện lỗi sheet tự đóng trước quyết định trên emulator, sau đó sửa cơ chế overlay và native portal. Chưa kiểm tra lại giao diện native sau bản sửa portal cuối: runtime emulator khi mở lại báo thiếu native module `ExpoCrypto`. Không thay dependency để né lỗi, không lưu/xóa bài thật trong lượt này. Ảnh kiểm tra trung gian `.local-tools/edit-in-sheet-form.png`, `edit-in-sheet-discard3.png`; các ảnh này không phải bằng chứng bản portal cuối hoạt động.

## Lịch sử triển khai trước yêu cầu mới

## Luồng giao diện

Nguyên nhân cũ: `MemoryActions` nằm trong AppSheet chi tiết nhưng mở thêm AppDialog; dialog có thể nằm dưới sheet, khiến Sửa/Xóa trông như không phản hồi. Hai thao tác không còn mở popup lồng.

- Sửa bài đăng: đợi sheet chi tiết thoát xong rồi hiện AppField cho tiêu đề/nội dung cùng nút Lưu thay đổi/Hủy ngay trên thẻ bài đã đăng. Giữ ảnh hiện có. Bản nháp được giữ ở hook cấp Home, không nằm trong row ảo hóa nên không mất vì cuộn.
- Sửa từ Kỷ niệm: về timeline với `editMemoryId` duy nhất trong route params; khởi tạo bằng detail đã xác nhận trong cache cùng scope. Không đưa nội dung bài vào params. Cuộn đến bài cần sửa, thử lại có giới hạn khi row cũ chưa được đo; bỏ retry khi đổi editor/focus/scope hoặc đã tới target.
- Xóa bài đăng: hiển thị cảnh báo không thể hoàn tác, Xác nhận xóa và Hủy ngay trong sheet hiện tại. Không gọi DELETE khi mới nhấn Xóa hoặc khi Hủy. Khóa gửi lặp khi request đang chạy.
- Callback thoát sheet cũ chỉ được kích hoạt edit khi revision vẫn khớp, đang đóng và cùng focus/scope; show selection mới hoặc unmount sẽ bỏ pending edit.

## API và cache

- Giữ API thật hiện có: PUT `/memories/{id}` cho `{title,description}`, DELETE cùng endpoint phải trả204. Không sửa backend hoặc chạy migration trong lượt này.
- Kiểm scope phiên/account/couple trước request và trước publish; service tiếp tục kiểm membership revision/server authorization. Không thêm hạn chế owner-only trái quyền couple hiện có.
- Hủy query đang chạy trước mutation để response đọc cũ không ghi đè bài vừa lưu/xóa. Chỉ cập nhật cache sau acknowledgement: cập nhật detail và trường text của feed, giữ metadata/ảnh/pages còn lại; xóa chỉ loại đúng ID và không giảm total hai lần. Sau đó invalidate để đối chiếu server.
- Lỗi/mismatched acknowledgement không báo thành công, giữ draft hoặc bước xác nhận và yêu cầu kiểm tra lại. Đổi account trong khi chờ không được publish sang scope cũ. Nếu đóng sheet khi DELETE đang chạy, acknowledgement vẫn được đồng bộ cache khi scope còn hợp lệ.

## Kiểm tra

- Typecheck qua; full suite394test,393qua;1lỗi Check-in baseline `bubbleToLargeTailGap` ngoài phạm vi sửa.
- Test mới: feed reconciliation; edit mở inline; delete chỉ gọi khi xác nhận, single-flight và ack-only; lỗi API giữ draft; sai ID không cập nhật cache; response đến sau khi đổi account không publish.
- Review source độc lập: đã xử lý scroll đến bài cũ chưa đo bằng pending target/retry giới hạn và cleanup; không còn finding quan trọng trong phạm vi.
- Android emulator: nhấn Sửa thấy form trên thẻ Home, Hủy trở về bài cũ; nhấn Xóa thấy cảnh báo và Xác nhận xóa/Hủy ngay trong sheet, Hủy hoạt động. Ảnh `.local-tools/post-inline-edit.png`, `post-delete-confirm.png`. Không nhấn Lưu/Xác nhận xóa trên dữ liệu thật; các nhánh ghi được kiểm tra bằng API test doubles. Chưa nghiệm thu mutation thật hai thiết bị hoặc iOS/web.
