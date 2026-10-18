# Home — Dòng thời gian và kỷ niệm

Ngày: 2026-10-18. Yêu cầu trực tiếp: thay toàn bộ Home cũ bằng feed bài ảnh kỷ niệm của hai người theo ảnh tham chiếu. Người dùng xác nhận **giữ màu Flamee, lấy bố cục feed**, không dùng nền đen.

## Bố cục

- Header là một lớp kính trắng ấm mờ đục phủ lên nội dung cuộn, có blur, shadow nông và line tối mảnh ở đáy để tách rõ khỏi nền feed. Nút `+`, selector `Dòng thời gian` và chuông không có viền/mặt nút riêng như ảnh tham chiếu; hierarchy đến từ title đậm, khoảng cách và toàn bộ vật liệu header. Mọi action giữ target 48 px. Khi đang xem lưới, title đổi thành `Kỷ niệm`; không badge/unread giả.
- Bấm title mở rộng **chính header** thành bảng bo góc dưới; chỉ một mục Kỷ niệm với icon đào và chevron, cùng nút đóng không viền. Không sao chép các quick-action/icon trong ảnh mẫu. Chọn Kỷ niệm mở lưới rồi thu header; bấm Dòng thời gian trong bảng quay lại feed. Khi cuộn feed xuống, header trượt ẩn; cuộn lên hoặc về đầu danh sách thì hiện lại. Bỏ hai filter chip khỏi Home.
- Post có nhãn `Kỷ niệm chung`, ngày kỷ niệm, title, ảnh 4:3 bo 18 px và địa điểm nếu có. Tim là biểu tượng album chung, không giả avatar/tác giả. API chưa trả author/comment nên không tự gán tên, giờ đăng hoặc số bình luận.
- Dấu ba chấm mở thông tin thực của record (title, ngày, địa điểm, số ảnh). Chưa có sửa/xóa hoặc gallery đầy đủ mọi ảnh trong record.
- Bỏ greeting/ngày hiện tại, avatar hồ sơ, hero cảm xúc, card kết nối/recent Moment. Xóa sáu component Home cũ không còn caller; giữ domain utilities/test thuần riêng.
- Post đi trực tiếp trên nền kem, không card nền, viền hoặc shadow. Đây là ngoại lệ Home theo yêu cầu trực tiếp thay quy tắc ContentSurface bao trang; các feature khác giữ quy chuẩn.
- `memoryFeedTokens`: max-width 560, gutter 20, post gap 36, grid gap 12, radius ảnh 18, khoảng tránh bottom nav 116. Giữ palette, typography, control motion và bottom navigation hiện có.

## Contract dữ liệu

- `features/moments/memoryApi.ts`: **read-only** `GET /api/v1/memories`, bearer token, Zod và timeout 12 giây. Không POST/PUT/DELETE/upload. Server lấy couple từ user xác thực; không nhận couple ID của client để cấp quyền.
- Home refresh `/auth/me` trước khi lấy album. Chưa có couple thì hiển thị kết nối theo kết quả thật; lỗi server không biến thành chưa ghép đôi hoặc feed rỗng thành công.
- Snapshot scope theo account/couple, revision guard bỏ kết quả cũ sau chuyển account/rời màn. Không persist hoặc log bài/URL media; không đặt nội dung riêng tư vào route params.
- Sắp theo `memory_date` mới nhất; date-only giữ đúng ngày lịch khi format. Lưới chỉ chứa record có URL ảnh và image count > 0.
- Empty chỉ sau response rỗng hợp lệ. Mạng/timeout/schema/HTTP/auth lỗi thì error + retry. Loading là skeleton post; ảnh lỗi có tải lại.
- `FlatList` virtualize post/grid, không lồng ScrollView; kéo để tải lại. Header selector vẫn có ở loading/error/unpaired.
- Route Timeline cũ chuyển về Home mới. Tiny Moment vẫn là contract khác, không được tự đổi field thành album.

## Các thao tác chưa khả dụng

- Theo yêu cầu mới nhất ngày 2026-10-18, `+` mở `MemoryComposerDialog` dùng **AppSheet neo đáy**, thay popup giữa màn hình. Sheet mở ở 55% và chuyển chương trình lên 85% khi chọn ảnh. Composer khóa drag của toàn sheet để chân/footer không bị kéo khỏi đáy; chỉ body cuộn, tắt bounce/overscroll và giữ keyboard avoidance. Giữ kính sáng Flamee, title giữa, textarea, ô chọn ảnh nét đứt khi chưa có ảnh; Hủy/Đăng cố định ở chân sheet, có safe-area.
- Người dùng có thể nhập nội dung và chọn/thay/gỡ ảnh thật từ thư viện qua native adapter. Preview dùng kích thước ảnh thật và `contain`, giới hạn theo viewport/phần body để xem nguyên ảnh; không crop. Nút X ở góc ảnh gỡ về ô chọn ban đầu; Thay ảnh là nút riêng dưới preview, không lồng button. Library picker không bắt crop ảnh. Đây chỉ là draft tạm trong component. Hủy/chạm ngoài/Escape/Back/kéo đóng bỏ nội dung và dọn file nén tạm do adapter sở hữu; không xóa ảnh gốc của thư viện. Kết quả picker đến sau khi đóng hoặc gỡ được dọn, không khôi phục draft.
- Đăng vẫn disabled, kèm thông báo nội dung/ảnh chưa được gửi, vì create/upload chưa tích hợp. Không POST, tạo record local hoặc báo thành công giả. Chuông và thông tin kỷ niệm vẫn dùng AppSheet như trước.
- Chuông mở `AppSheet` Thông báo, thông báo luồng này chưa khả dụng; không giả danh sách đã tải, badge hoặc quyền OS.
- Không chèn ảnh stock/reference, seed account hoặc bài mẫu. Test doubles chỉ ở tests. Không chạy browser agent hoặc ghi dịch vụ thật.

## Giới hạn backend hiện có

List album chưa phân trang. Backend source hiện đã batch metadata/signing và tạo thumbnail private thật, nhưng migration chưa được áp dụng và chưa có E2E Supabase/benchmark; mobile composer vẫn chưa POST. Không gọi N request detail để vá thiếu author. Cursor pagination và author/comment contract vẫn còn thiếu theo [kế hoạch backend](BACKEND-FIRST-CLEANUP.md).

Chưa kiểm tra UI trên Expo Go/thiết bị hoặc browser; không suy ra thiết bị hoạt động từ typecheck/bundle.

## Popup kính — triển khai trước khi chuyển sang sheet ngày 2026-10-18

- Bản đầu dùng shared `AppDialog`, `AppField`, `AppPhotoPicker`, `AppButton`; bản hiện tại thay AppDialog bằng AppSheet theo yêu cầu tiếp theo. Field ẩn nhãn hiển thị nhưng giữ accessibility label. Input vẫn tuân contract vật liệu/focus của AppField.
- AppDialog thêm props opt-in: blur target, title căn giữa, mô tả ẩn bằng VisuallyHidden và keyboard avoidance. Callers dialog hiện có giữ mặc định cũ, không đổi toàn bộ dialog sang form.
- Thêm đúng một dependency `expo-blur ~57.0.3` bằng Expo installer tương thích SDK 57. Native content có BlurView đặt sau Home BlurTargetView. Web giữ CSS backdrop blur; Android dùng `dimezisBlurViewSdk31Plus`, Android dưới 12 fallback translucent theo thiết kế thư viện để tránh blur chậm. iOS dùng native blur.
- Nguồn API/hành vi nền tảng: [Expo BlurView SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/). Chưa kiểm chứng hiệu ứng blur/keyboard/permission trên điện thoại; bundle JS không xác nhận native rendering.
- `AppPhotoPicker` là control shared chuyên chọn ảnh, radius 18, ô trống cao 156 có viền dashed. Bản hiện tại hiển thị preview nguyên tỉ lệ với các action gỡ/thay là sibling, không lồng nút; không tự style Button/Pressable ở feature.
- Test draft kiểm tra thay ảnh dọn bản cũ, hủy/denied giữ bản đã chọn và file đến sau dispose được dọn. Ảnh không được giả lập ở production.
- Installer báo audit tổng dependency có 25 vulnerabilities (11 moderate, 14 high). Không chạy audit fix/force hoặc đổi dependencies khác trong yêu cầu thiết kế này; chưa audit phạm vi các cảnh báo.

Kiểm tra sau bổ sung popup: typecheck đạt; domain tests 94/94 đạt. Android export đạt 4411 modules, HBC khoảng 8.6 MB, output `C:/Users/Huy/AppData/Local/Temp/flamee-memory-dialog-android-cfc2e53dca5b4a6c905526d9dc87e3ab`. Có warning môi trường NO_COLOR/FORCE_COLOR, không bị tắt. Chưa device/browser QA; không xác nhận native blur hay bàn phím hoạt động chỉ từ bundle.

## Sheet tạo kỷ niệm — thay thế popup giữa màn hình ngày 2026-10-18

- `AppSheet` thêm props opt-in cho blur target, title giữa, vị trí snap, footer cố định và đo chiều cao body. Các caller không truyền giữ bề mặt/default snap cũ. Escape/Android Back đóng sheet; keyboard movement dùng API có sẵn của Tamagui, không thêm dependency.
- Ảnh được scale theo tỉ lệ, bề ngang khả dụng và chiều cao body/viewport; không dùng chiều cao 156 hoặc `cover` cho ảnh đã chọn. Ảnh ngang/dọc đều hiển thị đầy đủ. Body có thể cuộn trong sheet để chuyển giữa nội dung và ảnh, footer luôn ở ngoài vùng cuộn.
- Draft có thao tác remove riêng, revision vô hiệu kết quả picker đang chạy khi gỡ/đóng. Tests kiểm tra gỡ dọn đúng một lần, chọn tiếp và kết quả thay ảnh đến muộn bị dọn. Không ảnh backend hoặc dữ liệu giả được tạo.
- Adapter ảnh dùng import native tĩnh để tránh chờ async chunk lúc bấm chọn và nén ảnh 1600 px tối đa hai lượt (quality 0.8 rồi 0.55) thay cho sáu lượt tuần tự trước đây. Vẫn cần đo thời gian thực trên thiết bị với ảnh lớn.
- Kiểm tra sau thay đổi: `npm run typecheck` đạt, `npm run test:domain` 96/96 đạt (thêm 2 test gỡ ảnh). Android export đạt 4413 modules, HBC khoảng 8.6 MB; output `C:/Users/Huy/AppData/Local/Temp/flamee-bottom-composer-android-7c2b6c5e63644fa4bd8f9d371fac8864`. Warning môi trường NO_COLOR/FORCE_COLOR được giữ nguyên. Đây là JS/assets bundle, chưa chạy Expo Go/device hoặc browser QA; không xác nhận native blur, snap, preview và bàn phím chỉ từ bundle.

## Header mở rộng — bổ sung ngày 2026-10-18

- `MemoryFeedHeader` là sibling được render **sau** BlurTargetView chứa FlatList, không nằm bên trong blur target của chính nó. AppGlassBackdrop dùng Expo Blur trên native và CSS backdrop blur trên web; phương thức Android cũ giữ fallback translucent đã nêu ở trên.
- Home bỏ top SafeArea padding của AppScreen rồi tự đưa `insets.top` vào header và phần chừa đầu feed. Lớp kính kéo tới vùng status bar, nút/header text nằm dưới tai thỏ; các màn khác giữ safe-area mặc định.
- Header chỉ phủ nội dung, không đẩy feed xuống khi mở. Chiều cao 60 → 136 px (cộng top inset), bo góc dưới 0 → 28 px, fade/translate nội dung 200 ms bằng Reanimated. Reduced Motion chuyển tức thì.
- Nút X, Android Back và Escape đóng bảng mà không đổi view. Chọn view đóng bảng và đưa focus về trigger; mở bảng đưa focus vào heading. Các nút thu gọn bị vô hiệu và ẩn accessibility khi bảng mở; option panel unmount khi đóng để tránh tab vào nội dung ẩn.
- Đây là disclosure ngay trên Home, không điều hướng sang trang hay mở thêm modal. Không thay logic tải album, đăng ảnh hoặc thông báo.
- Typecheck và 94 domain tests hiện có đạt; chưa kiểm tra thao tác/focus/blur trực tiếp trên browser hoặc điện thoại.
- Android export sau sửa header đạt: 4413 modules, HBC khoảng 8.6 MB, output `C:/Users/Huy/AppData/Local/Temp/flamee-glass-header-android-222450adbb4a48e3bd900e90eda72bcb`. Đây là JS/assets bundle; warning môi trường NO_COLOR/FORCE_COLOR vẫn được giữ. Không phải chứng nhận UI/native hoạt động trên thiết bị.

## Kiểm tra source — 2026-10-18

- `npm run typecheck`: đạt sau khi gỡ component cũ và hoàn tất source mới.
- `npm run test:domain`: 91/91 đạt, bao gồm 5 test mới về API đọc thật, không fallback lỗi thành empty, date-only và lọc lưới ảnh. Tổng này cũng gồm test navigation đang có trong checkout chung.
- `npx --no-install expo export --platform android`: đạt, 4402 modules, HBC khoảng 8.6 MB. Output `C:/Users/Huy/AppData/Local/Temp/flamee-home-feed-android-516b0bb0ddbd46cbb70031f802f7ca7c`. Toolchain có warning môi trường NO_COLOR/FORCE_COLOR; không tắt chúng. Đây là JS/assets bundle, không phải APK hoặc kiểm tra thiết bị.
- Không chạy browser agent, không seed/post/upload hoặc truy cập album riêng trên dịch vụ thật bằng account giả. Backend source không thay đổi trong redesign; không chạy lại backend suite cho thay đổi UI/client-only này. Chưa kiểm tra iOS hoặc E2E trên điện thoại.
