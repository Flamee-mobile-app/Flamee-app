# Quy chuẩn giao diện Flamee

> Home ngày 2026-10-18 chuyển sang feed ảnh theo yêu cầu trực tiếp, giữ màu Flamee. Header dùng một lớp kính trắng ấm có blur/shadow/line đáy; `+`, title/chevron và chuông không có viền hoặc mặt nút riêng. Header mở rộng chỉ có lựa chọn Kỷ niệm và nút đóng, đồng thời tự ẩn/hiện theo hướng cuộn feed. Post không có card nền/shadow. Thay thiết kế Home hero cũ, là ngoại lệ với ContentSurface bao trang. Xem [HOME-MEMORY-FEED.md](HOME-MEMORY-FEED.md). Các trang/control khác giữ quy chuẩn bên dưới.

> Nút `+` Home mở AppSheet kính mờ neo đáy, ban đầu cao 55%, mở rộng 85% khi chọn ảnh. Textarea và preview ảnh nguyên tỉ lệ nằm trong phần cuộn; Hủy/Đăng cố định ở chân sheet. Preview có nút X gỡ và Thay ảnh riêng, không crop hoặc phủ CTA lên ảnh. Dùng native Expo Blur với target thật trên Home; Android cũ fallback translucent, chưa device QA. Nội dung là draft và ảnh chọn thật; Đăng chưa khả dụng khi upload/create chưa nối. Chi tiết và giới hạn trong HOME-MEMORY-FEED.md.

Tài liệu này định nghĩa màu sắc và kiểu chữ dùng chung cho **toàn bộ mobile app**. Các màn hình và component cần dùng chung bộ token giao diện, không tự đặt lại màu hoặc font riêng.

Nguồn nhận diện ban đầu: `img/color.png` và `img/font.png`. Palette bề mặt và CTA dưới đây được cập nhật theo yêu cầu Home clean, minimalist, premium ngày 2026-10-14; hai màu thương hiệu và màu tâm trạng vẫn được giữ.

## Bảng màu

| Nhóm | Token | Mã màu | Cách dùng |
| --- | --- | --- | --- |
| Brand | `primary` | `#FF7158` | Màu thương hiệu chính, CTA và điểm nhấn |
| Brand | `secondary` | `#FCB76D` | Màu thương hiệu phụ, điểm nhấn ấm |
| Brand | `gradient` | `#FCB76D → #FF7158` | Gradient thương hiệu |
| Neutral | `text-primary` | `#302924` | Charcoal ấm, nội dung và tiêu đề chính |
| Neutral | `text-secondary` | `#70655D` | Taupe, nội dung phụ và thời gian |
| Neutral | `background` | `#F8F5F1` | Ivory, nền sáng mặc định |
| Neutral | `surface` | `#FFFCF8` | Trắng ấm, thẻ nội dung |
| Neutral | `surface-muted` | `#F0EAE3` | Linen, vùng phụ, avatar chưa có ảnh |
| Neutral | `border` | `#E6DDD3` | Đường phân tách nhẹ |
| Glass | `glassButton` | `rgba(255,255,255,0.14)` | Nút phụ kính trong |
| Glass | `glassFilter` | `rgba(255,255,255,0.52)` | Filter chưa chọn |
| Glass | `glassDialog` | `rgba(255,252,248,0.48)` | Dialog kính mờ đục hơn nút |
| Glass | `glassCard` | `rgba(255,252,248,0.66)` | Card kính trắng ấm |
| Glass | `glassCardPeach` | `rgba(247,221,204,0.38)` | Card tint đào nhẹ |
| Glass | `glassCardLavender` | `rgba(220,206,247,0.20)` | Card tint lavender nhẹ |
| Action | `primary` | `#FF7158` | Màu CTA chính theo nhận diện Flamee |
| Accent | `accent-soft` | `#F7DDCC` | Apricot tăng nhẹ độ đậm theo yêu cầu ngày 2026-10-17, vùng check-in nổi bật |
| Accent | `accent-text` | `#9A4234` | Chữ và icon coral trên nền sáng |
| Care | `calm-surface` | `#EDF1E9` | Sage nhạt, vùng Smart Nudge |
| Care | `calm-text` | `#52634C` | Chữ và icon trong vùng gợi ý |
| Support | `support-peach-light` | `#FFE6CE` | Nền phụ nhẹ |
| Support | `support-peach` | `#FFC7A1` | Nền hoặc điểm nhấn phụ |
| Support | `support-lavender` | `#CDB4FF` | Điểm nhấn phụ |
| Support | `support-lavender-light` | `#DCCEF7` | Nền phụ nhẹ |
| Support | `support-coral` | `#FF9B8A` | Điểm nhấn phụ |
| Semantic | `warning` | `#F5B041` | Cảnh báo |
| Semantic | `success` | `#76E69F` | Thành công, hoàn tất |
| Semantic | `error` | `#E65C5C` | Lỗi hoặc trạng thái cần chú ý |

Giữ nguyên mã màu trong bảng khi tạo theme dùng chung. Gradient thương hiệu đi từ `secondary` sang `primary`.

### Quy tắc phối tone

- Bề mặt neutral chiếm phần lớn màn hình; không phủ gradient lên thẻ nội dung. Gradient cam giữ cho bottom navigation và FAB thương hiệu.
- Coral là điểm nhấn chính. CTA chính dùng lại `primary`; chữ nội dung màu cam trên nền sáng vẫn phải dùng `accent-text` để giữ độ tương phản.
- Apricot nhấn trạng thái ghi cảm xúc; sage nhấn Smart Nudge trong cùng hero. Các màu semantic không dùng làm nền toàn bộ Home.
- Luồng mới không dùng thang mood cố định 1–5. Emotion được lấy từ catalog cấu hình hoặc nhãn tùy chỉnh; mọi lựa chọn luôn có text label, không chỉ truyền đạt bằng màu hay mascot.
- Nội dung chính dùng `textPrimary`, nội dung phụ dùng `textSecondary`; không tạo bảng xám lạnh song song.
- Thẻ Home tạo phân cấp bằng bề mặt và khoảng trắng; không kết hợp viền đậm và shadow nặng. Header/section dùng 500–700, body 400–500; giữ font hệ thống cho đến khi có binary SF được cấp phép.

## Kiểu chữ

### Tiêu đề

| Cấp | Font | Cỡ chữ |
| --- | --- | ---: |
| H1 | SF Pro Rounded Bold | 32 px |
| H2 | SF Pro Rounded Bold | 28 px |
| H3 | SF Pro Rounded Bold | 24 px |
| H4 | SF Pro Rounded Bold | 20 px |
| H5 | SF Pro Rounded Semibold | 18 px |

Ảnh ghi “SF Compact Rounded” ở nhãn nhóm tiêu đề, trong khi thang chữ ghi “SF Pro Rounded”. Dùng tên font theo thang chữ ở trên; giữ lại ghi chú này để đối chiếu tên family khi khai báo font trên nền tảng.

### Nội dung và điều khiển

| Vai trò | Font | Cỡ chữ |
| --- | --- | ---: |
| Body L | SF Pro Medium | 16 px |
| Body M | SF Pro Medium | 14 px |
| Body S | SF Pro Regular | 12 px |
| Caption | SF Pro Regular | 10 px |
| Button | SF Pro Medium | 16 px |

## Quy tắc dùng chung

- Khai báo palette và font thành một theme/token dùng chung toàn app; màn hình và component lấy giá trị từ đó.
- Dùng đúng cấp chữ theo vai trò nội dung; không tạo thêm font family hoặc cỡ chữ cục bộ nếu chưa cập nhật quy chuẩn.
- Giữ khả năng đọc nội dung và trạng thái bằng chữ/biểu tượng, không chỉ dựa vào màu sắc.

### Hệ button semantic

- Feature dùng đúng bốn component chung: `AppButton` cho CTA,
  `AppFilterChip` cho lựa chọn/filter, `AppIconButton` cho icon-only action và
  `AppTextButton` cho thao tác phụ không cần khối CTA. Không import `Button` từ
  Tamagui trực tiếp trong feature.
- `AppButton` mặc định cao 48 px; `size="large"` cao 56 px dành cho hai CTA
  đầu luồng kết nối theo review ngày 2026-10-18. Radius 16 px, padding ngang 16 px, icon 18 px và gap
  8 px. Variant hợp lệ là `primary`, `secondary`, `ghost`, `destructive`.
  Caller chỉ điều khiển semantic state và layout qua `loading`, `disabled`,
  `fill`, `grow`, `contentAlign`; không override màu, border, radius, shadow,
  padding, chiều cao hoặc motion.
- `AppFilterChip` theo thiết kế duyệt ngày 2026-10-17: bề mặt cao 32 px, radius
  12 px, padding ngang 12 px và chữ `$bodyM` (14 px). Không có viền, dấu tích,
  gạch dưới hoặc shadow. Button thật cao 48 px, bề mặt 32 px nằm giữa để vùng
  chạm đủ lớn trên cả web/native; không dựa vào hit slop chồng lên chip bên cạnh.
- Filter chưa chọn có nền trắng bán trong suốt `glassFilter`, chữ `textSecondary` medium; đã chọn có nền
  `accentSoft`, chữ `accentText` semibold. Nền fade trong 160 ms ở cả hai chiều;
  khi chạm lún 1 px, dùng press/release timing chung. Dành sẵn chiều rộng chữ
  semibold để các nhãn không xê dịch khi chọn. Không đổi màu chỉ vì hover/nhấn.
- Mỗi filter khai báo `selectionMode="single"` (radio) hoặc `"multiple"` (checkbox)
  và checked state. Single chuyển mục qua state của caller, về “Tất cả” để reset
  nếu có; multiple chạm lại để bỏ chọn. Showcase có cả hai mẫu tương tác.
- `AppIconButton` là squircle 44 px, radius 14 px, hit slop 2 px và bắt buộc có
  `accessibilityLabel`. Riêng icon phụ nằm trong ô nhập dùng `tone="plain"`:
  nền trong suốt ở cả hai trạng thái, không bo khối riêng, giữ vùng chạm và
  semantics button. Action sửa avatar dùng `tone="avatar"`: hình tròn 44 px,
  nền đào `glassCardPeach` bán trong suốt, icon `accentText`, không border và
  shadow nâu ấm nông để nổi trên ảnh. `AppTextButton` giữ touch target cao 48 px nhưng không
  có border hoặc shadow CTA. Text button có `emphasis="strong"` dùng chữ bold
  khi cần tăng độ rõ; mặc định giữ semibold. Nút Bỏ qua trên màn chọn kết nối
  dùng accentText + strong, cố định góc dưới bên phải trong safe area, target
  cao 48 px, tách khỏi cụm giữa màn và vùng cuộn.
- Interaction dùng timing 80 ms khi nhấn và 140 ms khi thả; nút lún 3 px bằng
  `transform: [{ translateY: ... }]`, không dùng prop `translateY` trực tiếp vì
  trên web nó không tạo transform. Không scale, spring, bounce hoặc float.
  Disabled opacity là 0.48. Loading khóa tương tác,
  đặt busy state, giữ footprint label/icon và đặt spinner giữa control.
- Pressed và hover giữ nguyên màu nền/chữ/viền, không giảm opacity để giả lập
  lực nhấn. Selected của filter/icon vẫn là trạng thái semantic độc lập.
- Motion dùng animation driver platform-aware của Tamagui: CSS driver trên web
  và React Native driver trên native. Không import/cấu hình cứng driver native
  trong `tamagui.config.ts`; `useButtonInteraction` điều khiển thời lượng press/release
  qua `onPressIn`/`onPressOut` vì web driver không áp dụng transition lồng trong pressStyle.
  Hook dùng `disableClassName` của Tamagui để pressStyle theo trạng thái runtime,
  bảo đảm hiệu ứng nhấn hoạt động cả với cảm ứng khi trình duyệt không bật `:active`.
- Shadow CTA dùng nâu ấm `textPrimary`, offset 0/4, radius 4; primary opacity 0.18,
  secondary 0.12, destructive 0.14. Khi nhấn offset còn 0/1, radius 1 và giảm opacity.
  Elevation chỉ truyền trên Android; text button không có shadow, ghost dùng
  shadow kính nông theo quy định bên dưới.
- Theo yêu cầu review ngày 2026-10-17, bỏ toàn bộ focus border và focus outline
  của bốn button chung, kể cả focus bằng bàn phím. Dùng `Tamagui.Button` với
  `unstyled` và khai báo style rõ ràng để không kế thừa màu/viền/outline mặc định.
  Thiết kế button và filter đã được duyệt; `/design-system` là trang kiểm tra chung.
- Nút phụ `AppButton variant="ghost"` dùng nền `glassButton`, không có border
  ở mọi trạng thái, kể cả focus. Web dùng gradient phản sáng mỏng và inset
  highlight trong `glassTokens`, không dùng stroke làm đường bao kính.
  Khi nhấn giữ nguyên nền, lún 3 px và thu shadow; không cộng dồn boxShadow
  của vật liệu web với các legacy shadow props. Native dùng shadow nâu ấm nông.
  Hành động Bỏ qua/Hủy/Giữ mã/Xem thêm dùng nút này; `AppTextButton` chỉ giữ
  cho liên kết nội tuyến như quên mật khẩu hoặc chuyển Login/Register.
- Ngoại lệ chuyên biệt gồm Bottom Navigation, FAB, Radial Menu, checkbox, card
  press và backdrop; không copy style của các ngoại lệ
  thành button thông thường.
  `MomentReactionButton` là adapter nghiệp vụ dùng `AppIconButton` chung.

## Đăng nhập

- Hero có chiều cao tối thiểu bằng `heroMinHeight + top safe area` và nhận phần
  chiều cao dư của viewport. Surface form co theo nội dung và nằm sát bottom
  safe area; không dùng `flexGrow` hoặc `minHeight` theo viewport cho form.
- Thứ tự form: tiêu đề, trường đăng nhập, tùy chọn, CTA chính, nhà cung cấp đăng
  nhập, rồi mới đến “Bạn chưa có tài khoản?”. Cụm đăng ký nằm ngay dưới action
  Google với khoảng cách 16 px; không chèn flexible spacer hoặc neo xuống đáy.
  Google và cụm đăng ký nằm trong cùng một khối không giãn. ScrollView content
  và stack bao ngoài lấp viewport để phần chiều cao dư được phân bổ cho hero,
  không tạo vùng nền form trống phía dưới.
  Tiêu đề cách field đầu tiên 16 px.
- Không hiển thị thông báo kỹ thuật về mock/local login trong giao diện người
  dùng.

### Khung nội dung tính năng (quyết định ngày 2026-10-14)

- Mỗi giao diện tính năng mới dùng `FeatureScreen`: chỉ có title ở ngoài vùng nội dung, không có subtitle hoặc eyebrow của trang.
- Toàn bộ nội dung, bộ lọc, form, CTA và trạng thái empty/error nằm trong một `ContentSurface` chung. Surface dùng `$surface`, bo góc `$xl`, padding `$lg`, không có viền đậm.
- Theo yêu cầu rà soát ngày 2026-10-18, không thay nội dung trang/tab bằng khối
  “Đang chuẩn bị”. Skeleton theo bố cục vẫn được giữ cho lần tải đầu chưa có
  dữ liệu. Render khung trang ngay, giữ dữ liệu đã
  được xác nhận khi refresh cùng account/couple; lần tải đầu chưa có dữ liệu
  không được hiện empty hoặc kết luận chưa kết nối trước khi API trả về.
  Control cần dữ liệu server bị khóa trong lúc đọc; thao tác lưu/gửi/upload và
  kéo tải lại vẫn có phản hồi loading ngay trên control. Splash khởi động là
  luồng riêng, không phải loader của tab. `AsyncStateView` không còn variant
  loading; trạng thái lỗi/retry, empty thật và chưa tích hợp vẫn có nội dung rõ.
- Shadow lấy từ `featureTokens.surfaceShadow`: nâu ấm `textPrimary`, offset 8 px, blur 24 px, opacity 0.12, elevation 4 trên Android. Không tạo shadow riêng trong từng screen.
- Max-width 560 px; màn hình có bottom nav dùng clearance chung để nội dung cuối không bị che. Danh sách dài dùng SectionList/FlatList bên trong surface; tránh lồng nhiều card có shadow.
- Title của trang không nằm trong surface. Nhãn form, tiêu đề nhóm ngày và trạng thái bên trong surface vẫn dùng typography chung.
- Chuẩn này áp dụng từ các màn mới và các màn được sửa trong đợt này: Timeline, Kết nối, composer Cảm xúc/Khoảnh khắc và danh sách Gợi ý. Không tự đổi toàn bộ màn cũ khi chưa nằm trong phạm vi công việc.
- Luồng kết nối là ngoại lệ bố cục theo mẫu người dùng chốt ngày 2026-10-18:
  bỏ title/header “Kết nối với người ấy” và logo ở mọi bước. Review mới nhất
  bỏ hiệu ứng chữ và panel đáy trên màn chọn: mascot Flamee 136 px cùng bubble
  nhắc kết nối nằm ngay trên hai nút Tạo mã mời / Nhập mã mời cao 56 px. Cả
  cụm max-width 360 px, đặt giữa màn, nền kem chung; không blur/gradient hoặc
  animation vào màn. Không bọc cả cụm trong card; màn nhỏ cuộn được. Các bước
  nhập mã/chia sẻ/chờ vẫn giữ panel trắng ấm và keyboard handling hiện có.
  Không tab hai nhánh hoặc thanh
  đánh số bước. Chỉ còn icon quay lại nhỏ để rời luồng/đổi lựa chọn.
- Nhập mã chỉ có tiêu đề ngắn trong panel đáy, `AppField` và nút Kết nối.
  Người dùng bấm Kết nối mới validate rồi accept trên server; không tự accept
  khi mở link, gõ xong hay chỉ tải preview. Trong xử lý khóa form, phản hồi trên
  CTA/toast; lỗi giữ mã để sửa/thử lại. Panel tránh bàn phím và cuộn riêng khi
  nội dung dài, không kéo trôi khỏi đáy.
- Success dùng hai avatar/tên từ couple response thật, nối nhau qua biểu tượng
  tim. Ảnh thiếu/lỗi dùng chữ cái từ tên thật; không dùng ảnh stock hoặc tài
  khoản mẫu. Người tạo đọc `GET /couple` sau khi invite được chấp nhận; người
  nhận dùng ngay hai member trong response accept. Scope phải gồm đúng user
  hiện tại; không coi preview hoặc tạo mã là đã kết nối.
- Bước chia sẻ lời mời không dùng content card hoặc badge trạng thái; chỉ hiển thị trực tiếp mã kết nối sáu ký tự trong các ô OTP, thời gian còn lại theo Giờ/Phút/Giây và cụm thao tác Chia sẻ/Sao chép/Tạo mã mới. Countdown lấy trực tiếp từ `expiresAt`, cập nhật mỗi giây; mã hết hạn khóa thao tác chia sẻ/sao chép. Tạo mã mới phải có bước xác nhận vì làm mã cũ mất hiệu lực.

## Chất liệu kính và dialog

- `glassTokens` và các màu `glass*` là nguồn dùng chung. Filter không có viền,
  kể cả nền trắng bán trong suốt ở trạng thái chưa chọn. Không giảm opacity
  toàn component vì sẽ làm mờ cả chữ và các nút bên trong.
- Popup Tamagui dùng `AppDialogContent` (kế thừa `Tamagui.Dialog.Content`),
  nền `glassDialog`, radius 28 px, padding 24 px, không border. Web dùng sheen
  và `glassTokens.dialogReflection`, native dùng `glassTokens.dialogShadow`.
  Backdrop tối 32%; nút phụ kính trong và CTA coral
  nổi rõ hơn bề mặt popup. Popup thông báo ghép đôi dùng cùng token chất liệu.
- Web dùng `backdropFilter`: filter blur 6 px, nút phụ blur 16 px + saturation
  160%, dialog blur 28 px + saturation 135%. Blur chỉ tác động nền, không làm
  mờ chữ hoặc icon. Showcase dùng nền kính trung tính bán trong suốt, không
  gradient tím/đào hoặc hình trang trí màu, để làm nổi bật nút bên trong.
  Native giữ nền bán trong suốt và shadow; chưa tích hợp blur native.
  Không coi preview web là bằng chứng blur đã hoạt động trên thiết bị.
- Feature dùng `AppDialog` cho composition popup: title/description, overlay,
  vùng cuộn và `AppDialogContent` dùng chung. `dismissible={false}` khóa dismiss
  khi đang xử lý. Pairing notice, xác nhận tạo mã mới và bước xác nhận thao tác
  tài khoản dùng cùng wrapper; không tự dựng native Modal với màu/padding riêng.
- Sheet dùng `AppSheet`, trích trực tiếp từ mẫu đã duyệt: `Tamagui.Sheet`, nền
  `surface`, bo góc trên `$xl`, padding `$xl`, handle `border`, overlay 0.45,
  snap point mặc định 55%. Nội dung cuộn và chừa bottom safe area. Partner note
  và trang preview dùng cùng wrapper, kèm nút đóng `AppIconButton`.

## Card (thiết kế đã duyệt)

- Dùng `SectionCard`, bọc trực tiếp `Tamagui.Card`. `cardTokens` quy định
  radius 22 px, padding 20 px và shadow nâu ấm nông: offset 2 px, blur 8 px,
  opacity 0.06. Không border hoặc focus outline; không kế thừa style mặc định.
- Nền kính `glassCard` trắng ấm bán trong suốt; `tone="peach"` và
  `tone="lavender"` dùng tint nhẹ từ token tương ứng, giữ nguyên ý nghĩa của
  caller. Web dùng `glassTokens.cardBackdrop`: blur 12 px + saturation 115%.
  Chữ, icon và control bên trong nằm trên lớp vật liệu, không bị giảm opacity
  hoặc phủ màu. Native giữ nền bán trong suốt và shadow, chưa có blur native.
- Card chứa form, button hoặc control là container tĩnh, không truyền `onPress`.
  Chỉ control con nhận phản hồi; không làm cả khối cùng chuyển động.
- Card có một hành động chung truyền `onPress` và `accessibilityLabel`;
  hiển thị chevron và render button thực trên web. Không đặt nút, link hoặc
  input bên trong card dạng này để tránh lồng control tương tác.
- Card nhấn được lún 1 px trong 80 ms, shadow thu còn offset 1 px/blur 2 px/
  opacity 0.04; nhả về vị trí và shadow ban đầu trong 140 ms. Giữ nguyên màu
  nền, chữ, kích thước và border; hover/focus không tự nâng card hoặc đổi màu.
  Enter kích hoạt khi nhấn, Space khi nhả; không lặp action khi giữ phím.
  Blur hoặc hủy thao tác nhả trạng thái pressed. Reduced Motion bỏ dịch chuyển
  và transition, vẫn thu shadow để phản hồi thao tác.
- Disabled khóa hành động và giảm opacity một lần theo token chung. Card thường
  không tự nhận role button hoặc tham gia tab order. `/design-system` có mẫu
  container chứa nút, hai tint, card có thể nhấn và disabled để review.
- `ContentSurface` và hero chuyên biệt vẫn theo quy chuẩn riêng. Không chuyển
  toàn bộ vùng nội dung màn hình thành card kính hoặc lồng nhiều card có shadow.
  Kiểm tra web không thay thế kiểm tra blur/shadow và thao tác trên thiết bị native.

## Phản hồi hệ thống bằng toast

- Mọi phản hồi ngắn sau thao tác dùng `AppToastProvider` và API `appToast` dùng chung; không tự dựng toast riêng trong feature.
- Theo review mới nhất ngày 2026-10-18, toast gọn hơn và có chiều sâu: nền sáng
  `surface`, max-width 360 px, radius 18 px, padding ngang 14 px/dọc 10 px,
  cao tối thiểu 48 px. Shadow nâu ấm offset 3/blur 12/opacity .10 (Android
  elevation 5). Không border, outline, dải màu hoặc nút X.
- Dùng icon chính thức `@tamagui/lucide-icons-2`: CircleCheck cho success,
  CircleAlert cho error, TriangleAlert cho warning, Info cho info và LoaderCircle
  cho loading. Icon 18 px trong nền tròn 28 px; loading quay nhẹ 1 vòng/giây,
  Reduced Motion giữ icon tĩnh. Icon không thay thế nội dung chữ và ẩn với
  trình đọc màn hình để không đọc lặp.
- Title của success dùng `calmText`, error/warning dùng `accentText`, info dùng
  `textPrimary`; loading/default và description dùng `textSecondary` để đủ rõ trên nền trắng.
  Tất cả đều là màu có sẵn của app; không tạo bảng màu toast riêng.
  Title `$bodyM` (14 px), description `$bodyS` (12 px) chỉ khi cần. Lỗi dùng
  live region `assertive`, các trạng thái còn lại dùng `polite`.
- Toast nằm giữa phía trên, tôn trọng safe area và chỉ hiện một toast tại một
  thời điểm, tránh lộ các lớp xếp chồng thành đường ở mép trên. Tự đóng sau 3 giây
  (loading theo vòng đời riêng), hỗ trợ vuốt lên, chạm hoặc phím Escape để đóng.
- Motion có kiểm soát bằng Tamagui.Toast: fade + dịch 10 px/scale .98 khi vào
  trong 220 ms, ra nhẹ 6 px trong 180 ms. Reduced Motion bỏ dịch/scale. Chỉ một
  record toast hiện tại; record đóng được giữ để chạy exit, và dismiss của
  operation cũ không được làm tắt thông báo kết quả mới. Loading không đóng
  bởi chạm/vuốt/Escape, chỉ kết thúc theo lifecycle thao tác.
- iOS đặt viewport trong `FullWindowOverlay` để toast nằm trên native navigation
  screens. Viewport không portal lại xuống root trên nền tảng này; vùng bao
  không chặn thao tác của phần màn hình nằm ngoài toast.
- Web/native dùng controlled Tamagui.Toast và ToastViewport, timer/focus/swipe
  do thư viện quản lý. Khi chạm đóng trên web, nhả focus đang ở trong toast
  trước khi unmount. Không sửa thư viện, thêm dependency hoặc tắt cảnh báo.
- Trạng thái đang chạy vẫn phải hiện ngay trên control bằng loading/disabled. Toast chỉ thông báo kết quả hoặc thay đổi trạng thái, không thay thế phản hồi trực tiếp của nút.
- Nội dung toast mô tả đúng kết quả quan sát được. Ví dụ đóng share sheet là “Chưa chia sẻ lời mời”, không báo thành công.
- Lỗi ngắn phát sinh từ thao tác hoặc request nền phải dùng toast; không chèn
  `StatusBanner` vào giữa form làm dịch chuyển nội dung. Validation nhập liệu
  vẫn đặt bằng trạng thái `error` của đúng `AppField`. Trạng thái dữ liệu cần tồn
  tại lâu hoặc có CTA xử lý riêng vẫn được trình bày bằng chữ/control thường
  trong nội dung màn hình. Feature không import hoặc render `StatusBanner`.

## Input và textarea (thiết kế đã duyệt)

- Dùng `AppField` chung, bọc trực tiếp `Tamagui.Input` / `Tamagui.TextArea`.
  Kích thước và hiệu ứng lấy từ `fieldTokens`: cao tối thiểu 52 px, textarea
  tối thiểu 112 px, radius 18 px, padding ngang 16 px/dọc 14 px, chữ `$bodyL`.
  Nhãn luôn nằm ngoài ô; không dùng floating label hoặc placeholder thay nhãn.
- Con trỏ dùng `accentText` coral đậm để rõ trên nền kem và nền lỗi: web đặt
  `caretColor`, Android đặt `cursorColor`/`selectionHandleColor`, iOS dùng
  `selectionColor` vì nền tảng dùng chung màu này cho con trỏ và vùng chọn.
  Web/Android giữ vùng bôi chọn `accentSoft`. Icon mắt nằm trực tiếp trong ô
  mật khẩu bằng `AppIconButton tone="plain"`, không có nền hoặc khối bo riêng
  khi ẩn/hiện; vẫn có nhãn trợ năng và khóa thao tác khi form đang xử lý.
- Bề mặt kem bán trong suốt `fieldSurface`, có inset shadow nâu ấm rất nhẹ
  trên web để tạo độ lõm. Không border hoặc outline, kể cả hover, nhấn,
  focus bằng cảm ứng hay bàn phím. Native bỏ underline mặc định của Android;
  chưa có inset shadow native và cần kiểm tra trực tiếp trên thiết bị.
- Khi focus, giữ nguyên màu nền, chữ và nhãn. Ô nhập nâng 1 px bằng transform
  trong 160 ms; inset shadow mờ đi và shadow nâu ấm nông (offset 2 px,
  blur 6 px, opacity 0.08) từ `fieldTokens` hiện
  lên cùng thời gian. Blur hạ ô về chỗ cũ và thu shadow. Không scale, thay đổi
  kích thước layout, tô viền hoặc phủ lớp màu lên nội dung. Chữ và con trỏ nằm
  trên các lớp shadow, giữ nguyên độ rõ khi nhập. Áp dụng cả ô đang báo lỗi.
  Reduced Motion bỏ nâng/hạ và transition, giữ shadow để nhận biết ô đang focus.
  Native dùng shadow chung và elevation trên Android; cần kiểm tra trên thiết bị.
- Lỗi dùng nền đào `accentSoft`, nhãn, icon cảnh báo và thông báo `accentText`;
  không viền đỏ bao toàn ô. Thông báo nằm bên dưới, liên kết bằng
  `aria-describedby` và ô lỗi có `aria-invalid` trên web. Native dùng hint
  của input. Label có liên kết với ID duy nhất; callback `onBlur` của form vẫn chạy.
- Disabled dùng nền `fieldDisabled` và chữ `textSecondary`, không giảm opacity
  toàn field khiến nội dung khó đọc. Giữ disabled thực tế, không chỉ đổi màu.
  Textarea giữ giới hạn nhập và bộ đếm ký tự do feature cung cấp.
- `/design-system` dùng chính `AppField` của các form trong app và có mẫu
  thường, lỗi, nhiều dòng và disabled để review. Login/Register cũng dùng
  `AppField`: `inputRef` giữ RHF focus, `startIcon`/`endAction` nhận nội dung icon
  và nút phụ, không cho caller override style. Giữ autocomplete, secure entry,
  submit/next, validation và disabled. Auth vẫn giữ hero/layout đã duyệt.

### Lựa chọn có hình

- `AppChoiceTile` là biến thể lựa chọn hình/mascot dùng cùng chất liệu và motion
  với filter: nền `glassFilter`, selected `accentSoft`, không border, tick hoặc
  outline; nhấn lún 1 px, nền selected fade 160 ms, không đổi màu khi nhấn.
- `choiceTokens`: rộng 72 px, cao 108 px, vùng hình 56 px. Nhãn `$bodyS` tối đa
  hai dòng, artwork và chữ nằm trên lớp nền. Có role radio/checked và label;
  Reduced Motion bỏ chuyển động và fade. Mood/mascot picker dùng component này.
- Lựa chọn có cả title/description như share scope hoặc loại mối quan hệ dùng
  `SectionCard selectionMode="single" selected={...}`: role radio, không chevron.
  Giữ nguyên các giá trị full/mood_only/private_only và callback của feature.

## Phạm vi áp dụng toàn app ngày 2026-10-17

- Người dùng đã duyệt toàn bộ design system và yêu cầu áp dụng toàn app.
  Feature lấy control từ shared; không import primitive Button/Input/TextArea/
  Switch/Checkbox/Card/Dialog/Sheet để tự style, không dùng stack với onPress
  hoặc tự thêm press/focus/hover style. Hai kiểm tra trong
  `designSystemUsage.test.ts` bảo vệ ranh giới này.
- Card Home/partner/moment/timeline/task dùng `SectionCard`. Card một hành động
  nhận `onPress`; nút phát âm thanh/retry nằm ngoài card nhấn được để tránh
  lồng button trong button. Avatar/action icon và reaction dùng `AppIconButton`.
- Toast ngắn sau lưu settings, quyền thông báo, quà lời mời và gửi/retry moment
  dùng `appToast` chung (3 giây). Pending/offline, lỗi cần phục hồi, giải thích
  quyền và màn kết quả cần CTA vẫn hiển thị inline; không biến chúng thành
  thông báo tự biến mất. Banner dùng nền neutral/đào và text từ palette hiện có.
- Artwork, avatar, media, badge chỉ đọc, skeleton, ô mã mời chỉ hiển thị và speech
  bubble trang mời không phải control nhập/chọn. Hero Home, header/hero auth,
  ContentSurface và Bottom Nav/FAB/Radial Menu giữ contract chuyên biệt hiện có.

## Menu cá nhân — bố cục duyệt ngày 2026-10-17

- Tab Hồ sơ hiển thị header chỉ có `Menu`, không có eyebrow, subtitle, tên
  hoặc khối avatar. Theo review tiếp theo, Menu dùng `AppScreen` với từng
  `SectionCard` riêng, không có một `ContentSurface` lớn bao tất cả nhóm.
  Đây là ngoại lệ của khung một surface cho màn tính năng. Giữ palette Flamee,
  max-width và bottom-navigation clearance từ `featureTokens`.
- Các nhóm xếp dọc, cách nhau `$lg`: Tài khoản (Hồ sơ của tôi, Thông báo,
  Chế độ tối),
  Kết nối (Cách quan tâm, Kết nối và tài khoản), Hỗ trợ & dữ liệu (Hỗ trợ,
  Dữ liệu của tôi), Các gói đăng ký và Cũng thuộc Flamee. Title nhóm `$bodyM`
  semibold, màu `textSecondary`, nằm **ngoài và phía trên card**. Không lồng
  card trong card hoặc kéo giãn một card để lấp chiều cao viewport.
- Card Menu dùng `SectionCard density="compact"`: radius 18 px, padding ngang
  16 px và padding trên/dưới đều 8 px. Các card khác giữ mặc định.
  Title cách card `$sm`. Giữa hai hàng có line 1 px màu `border`, bắt đầu
  sau vùng icon (inset 32 px), không có line thừa trên đầu hoặc dưới cuối nhóm.
- Hàng điều hướng dùng `AppMenuRow` từ shared: icon 20 px, nhãn `$bodyL`,
  mũi tên 18 px ở mép phải; cao tối thiểu 52 px, nhãn dài được xuống dòng.
  Button `unstyled` khai báo rõ `flexDirection="row"` và căn giữa cả hai trục
  để nội dung không dồn lên đầu theo hướng column mặc định trên native.
  Không nền button, border, bo khối hoặc shadow riêng. Press lún 1 px với
  timing 80/140 ms; Reduced Motion bỏ chuyển động. Giữ semantics button,
  nhãn trợ năng và disabled. `/design-system` có mẫu cùng component.
- Sáu mục giữ route và chức năng hiện có. Đăng xuất/hủy kết nối/xóa dữ liệu
  vẫn nằm trong Kết nối và tài khoản với flow xác nhận đang áp dụng. Không
  thêm mục chặn người dùng hoặc link chính sách chưa có chức năng.
- Menu không tải hồ sơ hoặc membership chỉ để render danh sách tĩnh; các
  màn đích tiếp tục sở hữu việc tải dữ liệu, kiểm tra phiên và xử lý lỗi.
- Gói Premium là preview theo yêu cầu người dùng: chọn Theo tháng/Theo năm
  ngay trên Menu, hiển thị giá minh họa và quyền lợi mẫu. Không có route/tab
  mới, checkout, lưu trạng thái premium hoặc cấp entitlement. Nút Sắp ra mắt
  bị disabled và có ghi chú rõ gói mẫu/chưa mở thanh toán.
- Cũng thuộc Flamee dùng chính `AppMenuRow` và line chia như các cụm khác,
  không dùng lưới icon hoặc tile riêng. Bốn quick action: Cảm xúc,
  Gợi ý, Khoảnh khắc, Kết nối. Tái sử dụng `useFabActions` từ public export
  của main-navigation để mở đúng flow hiện có; không sao chép routing intent.
- Theo yêu cầu mới nhất, Chế độ tối chỉ giữ một hàng button placeholder trong
  nhóm Tài khoản: icon, nhãn và chevron, chưa gắn hành động hoặc route.
  Không có Bật/Tắt, role switch, appearance store hoặc palette tối tự dựng.
  App tiếp tục dùng theme sáng đã duyệt.

## Chỉnh sửa hồ sơ — bố cục duyệt ngày 2026-10-18

- Màn chỉnh sửa hồ sơ là ngoại lệ trực tiếp của `ContentSurface`: dùng nền app,
  header gọn với nút quay lại và title căn giữa, avatar thật ở giữa, hai trường
  Tên hiển thị/Biệt danh và CTA Lưu cố định ở cuối vùng an toàn. Không dựng card
  loading toàn trang; session đang có render ngay và `/auth/me` chỉ refresh nền.
- Avatar dùng `AppIconButton` chồng ở góc ảnh để mở thư viện. Ảnh chọn được giữ
  thành draft cục bộ và phải preview ngay trên form; chọn ảnh không gọi API.
  Nút Lưu mới gửi multipart đến `POST /auth/me/avatar`. Upload lỗi giữ draft để
  người dùng thử lại; chỉ sau response đúng owner có `avatar_url` HTTP(S) dùng
  được mới cập nhật avatar của tab Hồ sơ trên bottom navigation và dọn file
  tạm. Response 2xx thiếu URL ảnh vẫn là lỗi upload, không được báo thành công.
  Ảnh gửi đi phải lấy từ cùng draft đang preview; khởi tạo lại effect khi phát
  triển không được làm mất draft hoặc xóa file đang hiển thị.
- Nút Lưu chỉ gọi `PUT /auth/me` khi tên hoặc biệt danh thật sự thay đổi. Một
  lượt chỉ đổi avatar không được tạo request text profile thừa; nếu cả hai thay
  đổi thì text được server xác nhận trước, sau đó mới upload avatar.
- Khi bấm Lưu, trạng thái đang lưu phải xuất hiện ngay; sau response thành công
  phải có `appToast.success` và trạng thái xác nhận ngắn trên CTA. Refresh, lưu
  text hoặc upload avatar thất bại phải gọi `appToast.error` và giữ
  nguyên dữ liệu/draft để thử lại; không render banner cảnh báo trong form. Tên
  trống hoặc vượt giới hạn và biệt danh vượt giới hạn hiển thị lỗi tại đúng ô.
- Bottom navigation hiển thị ảnh tròn thay glyph Hồ sơ khi có signed
  `avatar_url`; URL lỗi hoặc hết hạn rơi về glyph, không lưu ảnh/URL giả và không
  coi preview cục bộ là cập nhật thành công.
  Theo review tiếp theo, avatar dùng token gốc 40 px và scale cùng pill nav,
  thay kích thước glyph 30 px để khuôn mặt dễ nhận diện hơn.

## Switch và checkbox (thiết kế đã duyệt)

- Dùng `AppSwitch` và `AppCheckbox` từ shared; hai component bọc trực tiếp
  `Tamagui.Switch` / `Tamagui.Checkbox`, giữ hành vi bàn phím, label liên kết,
  checked/mixed và disabled của thư viện. Không dựng control giả bằng view.
- Kích thước, chuyển động và shadow lấy từ `controlTokens`. Vùng chạm cao
  tối thiểu 48 px; switch rộng 60 px, checkbox rộng 48 px. Không có border,
  vòng focus hoặc lớp nền mặc định bao ngoài control.
- Switch có track 52 × 30 px: nền kem `surfaceMuted` khi tắt, coral `primary`
  khi bật. Núm trắng mờ 24 px có shadow nâu ấm nông, trượt 22 px trong 180 ms;
  track chuyển opacity cùng thời gian. Không bounce, đổi kích thước hoặc tô viền.
- Checkbox có mặt 24 × 24 px, radius 8 px: nền kem khi bỏ chọn, đào nhạt
  `accentSoft` và dấu tick `accentText` khi chọn. Trạng thái mixed dùng dấu trừ.
  Nền và dấu tick fade 160 ms cả lúc chọn lẫn bỏ chọn, không vẽ hiệu ứng tô ô.
- Nhấn làm control lún 1 px, xuống 80 ms và nhả 140 ms. Disabled giảm opacity
  một lần theo `buttonTokens.disabledOpacity`, label đi kèm cũng thể hiện disabled.
  Reduced Motion bỏ chuyển động và fade. Luôn có accessibility label rõ nghĩa.
- Web dùng inset shadow rất nhẹ để tạo độ lõm cho track/mặt checkbox; native
  giữ nền kem/đào và shadow của núm, chưa có inset shadow. Cần kiểm tra trực tiếp
  trên thiết bị trước khi khẳng định hiệu ứng native tương đương preview web.
- Trang `/design-system`, checkbox ghi nhớ đăng nhập và switch nhắc thông báo
  dùng cùng component shared. Feature mới phải tái sử dụng các component này.

## Điều hướng chính phía dưới

- Thanh điều hướng chính là một pill responsive có bốn tab: Trang chủ, Hoạt động, Nhiệm vụ và Hồ sơ; FAB thương hiệu nằm giữa phần notch.
- Nền dùng gradient thương hiệu từ `secondary` lên `primary`, phủ kính trắng 15% và shadow nhẹ. Kích thước phải tính từ chiều rộng viewport; khoảng đáy được suy ra từ safe area nhưng giới hạn trong 14–18 px và chiều rộng bar được giới hạn trên tablet.
- Chạm FAB mở tab `timeline` — Dòng thời gian & kỷ niệm, không tự mở composer. Tab này chỉ truy cập qua FAB; bốn tab hiện có giữ nguyên. FAB có ring active khi timeline được chọn.
- Theo yêu cầu ngày 2026-10-17, tạm bỏ Radial Menu khỏi pill nav. FAB chỉ có hành động chạm để mở Timeline; nhấn giữ không có menu, vòng tiến trình hoặc hành động riêng. Lối tắt Cảm xúc/Gợi ý/Khoảnh khắc/Kết nối trong trang Hồ sơ vẫn giữ nguyên và tuân theo trạng thái khả dụng của backend.
- Chưa ghép đôi vẫn ghi cảm xúc cá nhân được. Khoảnh khắc và Timeline có empty state dẫn sang Kết nối, không tự quay về Home hoặc tạo couple giả. Kết nối đang chờ mở lời mời hiện tại; paired hiển thị partner thật và đường quản lý kết nối.
- Pill nav chỉ hiện icon, không có nhãn chức năng bên dưới. Dùng cặp outline/filled chính thức của Ionicons cho Home/Heart/Sparkles/Person, baseline 30 px và scale theo viewport. SVG được đóng gói trong shared cùng nguồn revision và giấy phép MIT; không tải icon hoặc font từ mạng lúc chạy. Tab thường dùng outline trắng, tab active dùng glyph filled riêng màu trắng ấm `surface`, giữ chi tiết và khoảng rỗng của thiết kế gốc. Không áp `fill` để biến icon outline thành filled hoặc tự vá glyph bằng mask. Không đổi kích thước hoặc vị trí icon khi chọn. Tên chức năng vẫn lấy từ localization để làm accessibility label.
- Tab và FAB dùng `Tamagui.Button` với `unstyled`, giữ touch target tối thiểu 48 px, nền tương tác trong suốt và không thêm border/outline. Đây là control điều hướng chuyên biệt trong shared, không thay đổi contract của `AppIconButton` thông thường.
- Tab đang chọn dùng nền cam đào `supportPeach` (#FFC7A1) bo capsule cùng icon active trắng kem `surface` (#FFFCF8), theo yêu cầu cuối cùng của người dùng. Màu fill của từng shape trong glyph active và stroke của glyph outline được gán trực tiếp từ token vào SVG, không dựa vào màu kế thừa hoặc `currentColor` để tránh fallback đen. Capsule nằm trong pill với inset baseline 6 px và scale theo viewport. Nền trượt tới tab mới trong 240 ms ease-out, được clip theo hình pill để không phủ phần notch khi đi qua FAB. Icon chuyển opacity trong 160 ms. Trạng thái selected luôn lấy từ route thực cùng accessibility state, không đổi trước khi điều hướng được chấp nhận.
- Khi Timeline được chọn qua FAB, nền đánh dấu của bốn tab fade đi; FAB giữ vòng active tĩnh, không có vòng chạy. Khi quay lại tab thường, nền xuất hiện ở tab đích; khi đổi kích thước viewport, nền cập nhật ngay theo layout mới. Reduced Motion cập nhật selected ngay, bỏ trượt và fade.
- FAB dùng phản hồi nút thông thường: lún 3 px trong 80 ms khi nhấn, trở về trong 140 ms khi thả, shadow thu khi nhấn; không tự nâng, nhấp nháy hoặc trì hoãn action để chờ animation. Reduced Motion chỉ đổi shadow. Notch dùng cung bán nguyệt của bản bottom nav đầu tiên, giữ hai đầu pill bo tròn lớn và viền FAB mảnh khoảng 2 px.
- Bottom navigation là lớp overlay tuyệt đối trên scene. Vùng trong suốt phía trên pill không chiếm layout và không bắt thao tác; nội dung của các tab được phép tiếp tục phía sau bar thay vì bị cắt thành một dải nền trắng.
- Baseline của bar là cao 64 px và FAB 60 px, tiếp tục scale theo viewport; mọi tab và FAB giữ touch target tối thiểu 48 px.

## Home

- Header: ngày theo múi giờ của người dùng, lời chào từ hồ sơ thật, avatar thật hoặc chữ cái đầu; avatar mở Hồ sơ.
- Hero dùng shadow màu nâu trung tính với opacity thấp để tạo chiều sâu; card thường dùng shadow nông hơn. Không dùng viền đậm hoặc shadow đen nặng. CTA hero co theo nội dung, không kéo ngang toàn thẻ khi không cần thiết.
- Hero là signature surface duy nhất: trạng thái ghi cảm xúc dùng apricot, Smart Nudge dùng sage và thay nội dung tại chỗ. Action text/photo/voice mở đúng Tiny Moment composer; call/other mở chi tiết Nudge.
- Composer yêu cầu emotion từ catalog hoặc nhãn tùy chỉnh và note sau trim 1–100 ký tự; mascot là tùy chọn tối đa một. Không hiển thị ShareScopePicker trong luồng mới. Note tạo khi chưa ghép đôi không tự chia sẻ sau khi kết nối.
- CTA tiếng Việt dùng `Cảm xúc hôm nay bạn như thế nào?` khi cập nhật và `Gửi "tí" yêu thương nhé` cho Smart Nudge. Không hiển thị streak, số ngày hoặc mood giả.
- Không gian chung có trạng thái none/waiting/paired. Giữ CTA lời mời còn hiệu lực, tạm ẩn 24 giờ và không nhắc trong phiên theo ONBOARDING-PAIRING-FLOW; nội dung cặp chỉ xuất hiện khi có membership thật.
- Thẻ người ấy chỉ preview note tối đa hai dòng, không hiện emotion, tone hoặc mascot. Chạm note mở detail bằng check-in ID; detail mới hiển thị mascot nếu có. Legacy `full`/`mood_only`/`private_only` vẫn được lọc trước khi render.
- Home paired chỉ giữ một Moment gần nhất hoặc empty state nhỏ sau khi backend tương ứng được tích hợp. FAB hiện chỉ mở Timeline; các lối tắt sản phẩm còn nằm trong trang Hồ sơ, không mở lại radial menu. Bốn định dạng Tiny Moment nằm trong composer Khoảnh khắc khi tính năng khả dụng.
- Smart Nudge local chỉ nhận `emotionTone` có cấu trúc, không đọc note và không gọi AI bên ngoài.
- Lần tải đầu dùng skeleton theo bố cục; khi refresh giữ khung trang/dữ liệu đã xác nhận, không thay nội dung bằng loader. Lỗi có đường thử lại. Layout co giãn trên điện thoại, giới hạn 560 px trên màn hình lớn; hỗ trợ text scaling và touch target tối thiểu 48 px.

## Dòng thời gian & kỷ niệm — bản local

- Dòng thời gian gom Tiny Moment gốc theo ngày của timezone người xem, mới nhất trước; reply được xem tại detail, không lặp thành một sự kiện riêng.
- Kỷ niệm hiển thị mốc kết nối thực từ membership cùng ảnh/ghi âm đã lưu thành công. Nội dung pending/failed không được gọi là kỷ niệm đã lưu.
- Chạm entry mở Moment detail bằng ID, không truyền note/media qua route params. Giữ kiểm tra membership và không render dữ liệu của account/couple cũ khi đổi phiên.
- Bản local này không tạo thêm schema sự kiện, đếm ngày yêu, yêu thích hoặc lịch nhắc ngày kỷ niệm. Các phần mở rộng giai đoạn 2 trong tài liệu yêu cầu vẫn cần spec riêng; không mô phỏng chúng bằng dữ liệu giả.
