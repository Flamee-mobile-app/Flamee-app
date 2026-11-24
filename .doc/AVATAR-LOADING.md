# Avatar Home và Mood — 2026-11-16

## Hoàn thiện lần tải đầu

Sửa trước đây bỏ setPartner(null) khi focus nhưng vẫn đợi vào Mood mới đọc connection; undefined trong lúc chờ bị coi như avatar không có. `ConnectionWarmup` nay sống bên trong QueryClientProvider, dùng cùng key/options với Mood và khởi động sau bootstrap/account/couple hợp lệ, trước khi tab Mood được mở. Observer cấp app giữ cache qua thời gian tab không dùng; foreground fetch chỉ khi dữ liệu stale. Prefetch native avatar mình và hai thành viên đã xác nhận, dedup URL theo scope (tối đa8), không fake profile/persist payload. Đổi scope vẫn prune cache cũ và không warm partner khi không còn hợp lệ.

`AppProfileAvatar.loading` phân biệt dữ liệu chưa xác định với avatar null đã xác nhận. Mood chờ connection hoặc recovery hiển thị skeleton, không chân dung mẫu tạm; ảnh remote chưa decode có skeleton phủ tới onLoad. Recovery nhận promise để không đổi sang fallback trong khi xin URL mới. Ảnh cùng object đã decode vẫn giữ khi gia hạn, lỗi thật kết thúc loading và retry giới hạn như trước. Đọc nền không phát toast thành công.

Kiểm tra: typecheck qua; full406test,405qua,1lỗi Check-in baseline ngoài phạm vi. Test mới mô phỏng bootstrap trước focus, dùng cùng connection cache, prefetch cả hai ảnh, foreground còn fresh không gọi lại và đổi account không warm partner cũ; avatar pending không render portrait fallback. Android đổi Home→Mood có ảnh, `.local-tools/mood-avatar-warmed.png`; chưa đo cache lạnh/mạng chậm trên thiết bị hoặc xác nhận timing từng frame bằng video. Không khẳng định mạng có thể trả ảnh tức thì; khi dữ liệu/bitmap chưa có dùng skeleton thay ảnh mẫu.

## Nguyên nhân và hành vi sau sửa

- Mood trước đây xóa partner mỗi lần focus, rồi gọi `/couple` trực tiếp, không cache. Nay dùng TanStack Query với key theo session/account/couple, freshness60giây; vào lại trong khoảng này dùng dữ liệu đã xác nhận. Khi stale thì refetch nền và giữ avatar/tên hiện có nếu lỗi mạng. Dữ liệu connection bị dọn khi đổi phiên/tài khoản/cặp đôi. Lỗi nghiệp vụ/quyền không tiếp tục hiển thị partner từ cache và yêu cầu đồng bộ session.
- Feed vốn giữ signed URL của ảnh kỷ niệm nhưng bỏ qua avatar tác giả, gây đổi source mỗi lần cấp token. Nay giữ URL avatar cùng object khi token vẫn còn hơn30giây; nhận URL mới khi gần hết hạn, đổi object, xóa avatar hoặc người dùng chủ động refresh. Decode `exp` chỉ phục vụ freshness của ảnh, không xác thực/kiểm quyền.
- `AppProfileAvatar` giữ bitmap đã tải trong lúc nạp URL mới của cùng object/cùng owner seed; không dùng bitmap cũ cho tài khoản, object khác hoặc khi URI bị xóa. Xử lý sự kiện ảnh cũ bị trễ theo URI/owner hiện tại. Tắt fade mặc định của native Image và giữ source ổn định để tránh trắng hình khi tab/scroll.
- Khi tải avatar lỗi, component chỉ gọi `onRefresh` tối đa một lần cho mỗi object/owner trong vòng đời instance, không tạo vòng lặp token→lỗi→fetch. Home dùng refresh feed đã có single-flight cho avatar người khác; avatar của mình dùng refresh auth đã coalesce. Mood refetch connection với tùy chọn bỏ retention để không tái sử dụng URL vừa lỗi; trong lúc đó giữ ảnh cùng object đã tải được.
- Avatar của mình trên Home lấy từ session đã xác nhận, đồng nhất với Mood/pill nav và phản ánh ngay việc cập nhật/xóa avatar. Không thêm kho profile giả, persist signed URL hoặc thay backend.

## Kiểm tra

- `npm run typecheck`: qua.
- Full mobile suite:383test,382qua;1lỗi baseline `checkInUiContract` kỳ vọng `bubbleToLargeTailGap: 6`, ngoài các file sửa.
- Test bổ sung kiểm tra cache connection/single-flight, giữ avatar khi refresh lỗi, dọn cache khi đổi phiên, signed URL còn hạn/hết hạn/thay ảnh/xóa ảnh, hồi phục URL lỗi trước expiry, bitmap không lẫn owner và sự kiện ảnh cũ không ghi đè ảnh mới.
- Review source độc lập không còn lỗi quan trọng sau khi sửa bypass URL retention khi ảnh tải lỗi.
- Android emulator: mở Mood có ảnh người ấy, chuyển qua Home rồi quay lại Mood nhiều lần, ảnh giữ nguyên và Home có avatar. Bằng chứng `.local-tools/avatar-mood-verified.png`, `avatar-home-return.png`. Không cập nhật/xóa profile hoặc ghi backend trong kiểm tra. Chưa kiểm tra iOS/web, lỗi mạng thật hoặc chờ token hết hạn15phút trên thiết bị; các nhánh này được kiểm tra bằng test doubles/đồng hồ kiểm thử.
