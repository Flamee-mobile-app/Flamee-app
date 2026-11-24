# Tiny Mission — dữ liệu thật từ API, cập nhật 2026-11-21

## Hiện trạng áp dụng

### Cập nhật 2026-11-24: đổi quà không phụ thuộc tồn kho

Giao diện đổi quà cập nhật cùng ngày: thanh tiến độ ở ví và từng món luôn dùng màu primary cam, kể cả đã đủ điểm. Popup xác nhận có ảnh/tên quà, khối điểm nền peach với chi phí và số dư nổi bật, số dư sau đổi ghi rõ dự kiến; nút xác nhận kèm chi phí và nút “Để sau” dạng ghost. Các con số lấy từ reward/wallet server; dự kiến không cập nhật số dư authoritative hoặc báo đổi thành công trước ACK. Giữ khóa thao tác/loading/toast và cơ chế cuộn của AppDialog. Typecheck đã đạt; chưa nghiệm thu trực quan popup trên thiết bị.

Popup kết quả/mở lại mã dùng cùng bố cục ảnh và tên quà, trạng thái thật từ đơn; điểm đổi và hạn nhận nằm thành hai cột có thể xuống hàng. Mã đầy đủ selectable và nút sao chép nằm chung trong SectionCard peach; clipboard luôn nhận nguyên mã server. Giữ hạn chế sao chép/mở fanpage khi đơn hủy hoặc hết hạn, chỉ hiện liên kết fanpage khi có cấu hình thật. Tiêu đề thành công và dấu check chỉ xuất hiện sau ACK mới; mở từ lịch sử vẫn hiển thị tiêu đề mã nhận quà. Không hiển thị lại đoạn khuyến khích dài để popup gọn hơn. Typecheck và 14 test API/design-system đạt; chưa nghiệm thu bố cục trực tiếp trên thiết bị.

**Liên hệ nhận quà, yêu cầu tiếp theo 2026-11-24:** dùng TikTok `https://www.tiktok.com/@flameenek?_r=1&_t=ZS-9BfiCOaxq3Y` do người dùng cung cấp, thay phần fanpage trong popup nhận mã. Chỉ hiển thị icon TikTok có accessibility label và lời hướng dẫn, không hiển thị URL/nút sao chép link/thông báo thiếu fanpage. Icon đóng gói SVG cục bộ, không gọi dịch vụ favicon. Link áp dụng cho cả đơn mới và lịch sử dù snapshot `fanpage_url` trống; không ghi lại snapshot hoặc sửa database. Đơn hủy/hết hạn và scope không còn hợp lệ không được mở liên hệ. Lỗi mở TikTok có toast; mã nhận quà không đưa vào URL. Quy định này thay thế phần liên hệ fanpage của mô tả trước.

Theo yêu cầu mới, người dùng đủ điểm được đổi quà active dù `stock = 0`. Mobile không khóa nút hoặc hiện “Chưa mở đổi” theo stock. Backend vẫn kiểm tra cặp hợp lệ, giá kỳ vọng, số dư trong transaction và idempotency; tạo mã thật, trừ điểm đúng một lần. Đổi/hủy/hết hạn không trừ hoặc cộng stock; hoàn điểm vẫn chỉ một lần. Trường stock giữ làm metadata tương thích, không bắt buộc khi tạo cấu hình quà. Quy định này thay thế các yêu cầu tồn kho trong phần lịch sử bên dưới.

Database hiện có cần áp dụng `backend/migrations/20261124_rewards_without_stock.sql` trong Supabase SQL Editor, sau đó cập nhật mobile (build lại nếu dùng APK). Migration chỉ thay RPC, giữ điểm/đơn/catalog và quyền hiện tại; không chạy lại `schema.sql` trên database đã có. Bản schema bootstrap cũng đã cập nhật quy tắc mới. Chưa áp dụng lên database thật từ phiên làm việc này.

Các phần preview bên dưới là lịch sử thiết kế. Route chính và chi tiết hiện dùng `ServerTinyMissionContent`, không import `TinyMissionContent`, `MissionViews`, `MissionOverlays` hoặc `previewContent`. Các fixture cũ giữ riêng để đối chiếu thiết kế, không phục vụ dữ liệu runtime.

- `GET /missions/today`: bốn nhiệm vụ server giao theo ngày/múi giờ chung, ID thật, owner thật, nội dung/điểm/version/hoàn thành từ server. Trang chi tiết chỉ nhận assignment ID, tra lại danh sách hôm nay bằng bearer; không dùng allowlist ID mẫu hoặc đưa nội dung riêng tư vào route.
- `POST /missions/{id}/complete`, `/swap`: chỉ tự hoàn thành phần của mình; nhiệm vụ chung cần hai người. Đổi tối đa hai lần cho cả cặp/ngày, mỗi nhiệm vụ một lần trước completion, giữ mức điểm. Client chặn thao tác không phù hợp nhưng server vẫn kiểm quyền/version. Giữ idempotency key cho lần thử lại sau lỗi chưa xác nhận, không tự retry mutation hoặc giả cộng điểm.
- `GET /wallet`, `/wallet/ledger`: ví chung và lịch sử điểm thật. Phần thưởng tuần/tháng đọc `GET /missions/achievements`, dùng đúng target/bonus/completed_count/credited_at của kỳ do server trả.
- API thành tựu hiện chưa có số đếm theo từng ngày. UI hiển thị kỳ và tiến độ/mốc thưởng thật, bỏ lịch mẫu với số ngày/số hoàn thành tự đặt. Không suy ra dữ liệu lịch ngày từ tổng kỳ.
- `GET /rewards`: danh mục/giá/tồn kho/fanpage thật, có phân trang. Danh mục trống hiển thị chưa có quà, không dựng các món quà/ảnh/tồn kho mẫu. Minh họa hộp quà chung chỉ mang tính trang trí.
- `POST /redemptions`: gửi ID quà, giá kỳ vọng và idempotency key, chỉ hiện mã khi receipt ACK khớp tài khoản/cặp/quà/giá/trạng thái. Wallet/catalog/orders được invalidate để lấy số dư/tồn kho mới, không tính số dư authoritative ở client.
- `GET /redemptions`, `/redemptions/{id}`: lịch sử thật có phân trang; mở lại mã kiểm tra trạng thái mới từ server. Sao chép mã/link và mở fanpage HTTPS thật; mã hết hạn/hủy không cho sao chép để nhận quà. Không lưu mã vào storage, route params hoặc log. Không tích hợp nút hủy/fulfillment/operator trong thay đổi mobile này.
- Tất cả request xác thực bằng auth service và kiểm scope session/account/couple/membership revision trước/sau API; cache bị hủy/xóa khi scope đổi. Dữ liệu tên/avatar lấy từ connection API, không dùng tên Linh/Nam hoặc identity mẫu. Tải lần đầu/lỗi/chưa ghép đôi/trống có trạng thái riêng; không thay lỗi API bằng feed rỗng hoặc số dư 0 giả.
- Hoàn thành/đổi nhiệm vụ/đổi quà có khóa thao tác lặp, loading và toast kết quả sau ACK; timeout giữ key và hướng dẫn tải lại/kiểm tra. Tải lại/tải thêm chủ động có toast, polling và refetch khi reconnect tắt.

## Kiểm tra bản tích hợp

- Typecheck đạt; 14 test frontend API/scope/design system và contract SQL đạt. Test SQL chạy hai migration missions/rewards trong PGlite cô lập, xác minh bốn assignment, completion đúng owner, swap, credit một lần, period, redemption replay không trừ hai lần và đọc mã thật trong database kiểm thử.
- 5 test backend mission/reward API đạt với test doubles; có cảnh báo deprecation dependency sẵn có.
- Android emulator đã đăng nhập tài khoản thử và đọc API thật: wallet 0, bốn nhiệm vụ ngày 2026-11-21, tên hai thành viên thật; Thành tựu hiển thị kỳ/tiến độ thật; catalog quà hiện trống và không còn notice/dữ liệu preview. Việc mở nhiệm vụ hôm nay cho phép backend tạo assignment trong ngày theo luồng bình thường.
- Không tự complete/swap/redeem trên dịch vụ thật, không seed quà/tồn kho/fanpage, không chạy migration hoặc deploy backend. Chưa nghiệm thu mutation/toast trong popup với hai thiết bị/iOS, full boundary ngày hoặc realtime thay đổi từ thiết bị đối phương. Không có subscription/polling mới; mở lại màn hoặc tải lại để đọc cập nhật từ người kia.
- Backend đang chạy đã có các endpoint trên trong OpenAPI. Database môi trường khác cần `20261110_missions.sql` và `20261110_rewards.sql`; phải kiểm tra, review và triển khai theo phạm vi được phép, không chạy bootstrap lại trên database hiện có.

## Lịch sử frontend được duyệt ngày 2026-10-25

### Mốc đổi quà hiện vật — 2026-11-21

#### Danh mục và lưới ảnh theo thiết kế cũ

Hiệu chỉnh tiếp theo: thẻ quà nền trắng, bo 20px, shadow nhẹ từ token card chung; ảnh có khoảng viền trắng 4px và bo 16px. Điểm cỡ h5, thanh tiến độ mảnh 4px, trạng thái rút gọn “Còn … điểm”/“Đã đủ điểm”. CTA chưa khả dụng dùng secondary nhẹ, CTA đủ điểm và có phân bổ hàng dùng primary. “Quà đã đổi” chỉ còn một nút text kèm icon ở góc phải phần đầu khối điểm; bỏ nút căn giữa và icon lịch sử trùng. Không thay điều kiện đổi hoặc số dư. Typecheck/4 test design system đạt; đã xem khối điểm và lưới quà trên Android emulator với catalog thật, không gửi yêu cầu đổi quà.

Theo yêu cầu tiếp theo, `LiveMissionRewards` dùng lưới hai cột có ảnh tỷ lệ 1.25, tên quà, giá điểm, số điểm còn thiếu và nút đổi. Không dùng lại số dư/trạng thái fixture. `rewardArtwork.ts` chỉ ánh xạ ID catalog server tới ảnh minh họa cũ; không cung cấp dữ liệu nghiệp vụ. Cả năm món có ảnh minh họa local; dây buộc tóc dùng `assets/hair-tie.png` được tạo bằng built-in ImageGen, prompt lưu tại `design/tiny-mission/hair-tie-image-prompt.md`. Popup receipt dùng cùng artwork và tên snapshot thật.

Danh mục khởi tạo được chuẩn bị trong `backend/migrations/20261121_physical_reward_catalog.sql`: dây buộc tóc 100, bộ thiệp yêu thương 500, móc khóa couple 800, cốc đôi 1500 và túi vải Flamee 2000 điểm. File chỉ bổ sung các ID ổn định còn thiếu, không ghi đè giá/tồn kho/link/active đã cấu hình, không tạo đơn hoặc sửa ví điểm. Tất cả ban đầu chưa có phân bổ hàng đổi (`stock=0`) và chưa có fanpage (`null`), nên hiện mốc nhưng nút “Chưa mở đổi”; không tạo tồn kho dương giả. Đây là số phần được phân bổ cho hệ thống đổi quà, không khẳng định số hàng đang nằm trong kho vật lý. Khi có phân bổ thật, operator cập nhật stock để mở đổi. UI không hiển thị số lượng theo yêu cầu.

Cần áp dụng file catalog này trên Supabase để danh sách xuất hiện; không fallback sang catalog hardcoded khi database trống hoặc API lỗi. File đã cho phép fanpage null nên có thể chạy sau migration missions/rewards gốc, không bắt buộc chạy migration fanpage tùy chọn trước. Chưa thực thi trên môi trường thật.

Kiểm tra cập nhật: typecheck và 7 test SQL/mốc/design system đạt. SQL kiểm tra đủ 5 mốc, chưa phân bổ hàng/link, chạy lại không đặt lại giá/tồn kho đã sửa và không thay balance/order hiện có. Chưa kiểm tra trực tiếp lưới mới trên Android với catalog thật vì chưa áp dụng file catalog.

- Tab Đổi quà có vùng tiến độ số điểm hiện có/mốc tiếp theo; mỗi quà thật có tên, mốc điểm, tiến độ và số điểm còn thiếu. Mốc tối thiểu là 100 điểm. Chỉ dùng reward đang active từ catalog server, sắp theo giá; không tạo sản phẩm/mốc quà giả nếu catalog trống. Khi chưa có catalog, chỉ hiển thị tiến độ tới mức tối thiểu 100, không gắn một món quà chưa được cấu hình vào mốc đó.
- Ẩn số lượng tồn kho trên UI theo yêu cầu. Backend vẫn kiểm tra số dư, giá và tồn kho trong transaction; ẩn số lượng không có nghĩa cho phép hàng không tồn kho. Các loại quà như móc khóa couple/dây buộc tóc, giá từng món và phân bổ tồn kho cần cấu hình thật qua operator; không tự seed hoặc coi quà minh họa là hàng có thể nhận.
- Xác nhận đổi vẫn gửi ID, giá kỳ vọng và idempotency key. Sau receipt ACK đúng account/couple/reward/price, popup “Đổi quà thành công” hiển thị tên/mô tả quà snapshot, minh họa hộp quà chung, giá đã trừ và mã thật. Không đồng nghĩa quà đã giao: trạng thái chờ nhận/gửi/đã nhận vẫn theo server.
- Số dư được tải lại từ API rồi tính lại điểm còn thiếu cho mọi mốc; không tự trừ số dư authoritative ở client. Trong lúc chưa tải được số dư mới sau đổi, app ẩn số dư cũ và vô hiệu đổi thêm, có nút thử lại khi lỗi. Không báo thành công sau scope switch.
- Fanpage có thể chưa được bổ sung. `RewardInput.fanpage_url` và dữ liệu client cho phép null; popup ẩn nút mở/sao chép link khi chưa có URL, vẫn giữ mã nhận quà. Không dựng link giả.
- Backend API/service chặn giá tạo/cập nhật quà và giá kỳ vọng đổi mới dưới 100. Các receipt lịch sử có giá cũ vẫn đọc được. SQL RPC và role service giữ nguyên, client không có quyền gọi RPC trực tiếp.
- Cần deploy code backend mới và review/áp dụng `backend/migrations/20261121_optional_reward_fanpage.sql` để DB cũ chấp nhận quà chưa có link. Migration chỉ bỏ NOT NULL của fanpage, không sửa quà/tồn kho/điểm; chưa chạy trên dịch vụ thật. Bootstrap mới cũng cho phép URL null. Không chạy lại `schema.sql` trên DB hiện có.
- Kiểm tra: typecheck; 17 test frontend/API/mốc/SQL cô lập/design system và 7 test backend mission/reward. SQL test tạo quà 100 điểm không có link trong DB cô lập, kiểm tra receipt, balance sau đổi và retry không trừ hai lần. Chưa nghiệm thu đổi quà/toast thật vì catalog thật hiện trống; không tạo tồn kho hoặc cộng điểm thật để giả kiểm thử.

### Hiệu chỉnh màu và thao tác tải ngày 2026-11-21

Giao diện dữ liệu thật bỏ nút “Tải lại dữ liệu” chung. Giữ nút thử lại khi đọc lỗi và tải thêm theo phân trang; mutation thành công vẫn invalidate query, mở lại màn lấy cache cũ theo cơ chế hiện có, không bật polling.

Màu dùng chung từ `missionColorTokens`: nhóm chăm sóc bản thân (nước/nghỉ mắt/tử tế) xanh sage; nhóm kết nối (cảm ơn/lắng nghe/chia sẻ/lên kế hoạch) coral đậm; nhóm kỷ niệm màu vàng nâu. Title và điểm của một nhiệm vụ cùng màu nhóm, áp dụng thống nhất ở danh sách và chi tiết. Trạng thái chưa làm dùng xám trung tính, làm một phần dùng nâu cam trên nền peach, hoàn tất/nhận thưởng dùng xanh sage; chữ và dấu check vẫn thể hiện trạng thái, không chỉ dựa vào màu. Điểm thưởng thành tựu và giá quà dùng cùng màu điểm chung.

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
