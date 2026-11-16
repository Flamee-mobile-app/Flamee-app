# Tải ảnh Home — 2026-11-16

## State và trình bày

- Giữ FlatList ảo hóa và TanStack Query hiện có: dữ liệu đã xác nhận/phân trang không bị thay bởi trạng thái rỗng khi refresh. Giữ chiều cao/aspect ratio của ảnh để không nhảy bố cục.
- `AppRemoteImage` chỉ bỏ skeleton sau khi thumbnail hoặc ảnh lớn đã tải/giải mã và hoàn thành fade180ms; việc có URL thumbnail không có nghĩa thumbnail đã sẵn sàng. Skeleton dùng pulse mềm trên UI thread, dừng khi ảnh hiện hoặc card không được ưu tiên. Reduced motion dùng trạng thái tĩnh và hiện ảnh ngay.
- Thumbnail nhỏ hiện trước, giữ nguyên phía dưới trong lúc ảnh lớn tải và chuyển opacity. Thumbnail lỗi không làm hỏng ảnh lớn; ảnh lớn lỗi vẫn giữ thumbnail nếu xem được. Chỉ báo lỗi thật qua UI retry hiện có khi không còn ảnh nào sử dụng được. Component được reset theo URI ảnh lớn, sự kiện ảnh đã tháo không điều khiển instance mới.
- Image dùng source memo và cache native `force-cache`, bỏ fade mặc định của Android để tránh hai lớp animation. Không thêm dependency hoặc cache profile/feed giả.

## Ưu tiên tải và tải trước

- Full-size chỉ bắt đầu tải cho các card đang nhìn thấy và một card lân cận mỗi phía. Request đã bắt đầu không bị tháo/tải lại chỉ vì cuộn card khỏi vùng ưu tiên.
- Theo viewability của FlatList, prefetch bốn thumbnail phía trước rồi tối đa hai cover kế tiếp. Hàng đợi tối đa6URI, tối đa2tác vụ đồng thời, dedup64URI đã thử; cuộn thay hướng sẽ thay thế công việc chưa chạy, không tải trước toàn bộ feed/album.
- Hàng đợi giữ cùng instance qua blur/focus để không nhân đôi request đang chạy; rời Home xóa việc chờ và ngừng khởi động request mới. Các native prefetch đã chạy có thể hoàn tất. Khi scope Home bị tháo, dispose hàng đợi và bỏ theo dõi; không tạo store persistent hoặc log signed URL.
- Native prefetch dùng cùng hệ thống cache với Image. Tốc độ thực vẫn phụ thuộc mạng, kích thước ảnh và cache; không xem test đơn vị là benchmark băng thông hoặc thời gian tải.

## Kiểm tra

- Typecheck qua. Full suite389test:388qua,1lỗi Check-in baseline `bubbleToLargeTailGap` ngoài phạm vi.
- Test mới: URL preview chưa sẵn sàng vẫn có skeleton; preview giữ khi full lỗi; preview lỗi rồi full thành công; chỉ báo lỗi một lần khi cả hai thất bại; trì hoãn full ngoài viewport, không restart request khi cuộn; prefetch ưu tiên/giới hạn/dedup/dispose và blur/focus khi request chưa hoàn tất.
- Review độc lập đã xác nhận xử lý việc queue bị nhân đôi khi đổi tab nhanh; không còn finding quan trọng trong phạm vi.
- Android emulator: cuộn qua các bài có ảnh, cuộn nhanh xuống/lên và kiểm tra ảnh thật hiển thị; không thấy lỗi JS/worklet trong log lọc. Bằng chứng `.local-tools/feed-loading-scroll.png`, `feed-loading-fast-scroll.png`. Không ghi dữ liệu backend. Chưa kiểm tra iOS/web, mạng bị giới hạn hoặc đo thời gian tải với cache lạnh trên thiết bị; các trạng thái lỗi/chờ được kiểm tra bằng test doubles.
