# Áp dụng design system đã duyệt — 2026-10-17

> Cập nhật sau rollout: theo yêu cầu gỡ mock ngày 2026-10-17, các service nghiệp vụ local, Premium mẫu và UI gift/popup local đã được xóa. Một số màn feature hiện hiển thị chưa khả dụng thay cho luồng mô phỏng. Bộ control/style vẫn giữ. Các kết quả QA bên dưới là bằng chứng lịch sử trước cleanup; không phải chứng nhận E2E cho bản hiện tại. Xem [trạng thái và kế hoạch backend](BACKEND-FIRST-CLEANUP.md).

**Mục tiêu:** mọi control thông thường dùng bộ Tamagui đã duyệt tại
`/design-system`, theo `QUY_CHUAN_GIAO_DIEN.md`. Người dùng đã duyệt toàn bộ
thiết kế và yêu cầu áp dụng trên toàn mobile app.

**Phạm vi:** UI và composition hiện có; giữ nguyên service, xác thực, quyền riêng
tư, route, dữ liệu, media và callback nghiệp vụ. Không chạy Git, SQL, seed hoặc
ghi dữ liệu lên dịch vụ thật. Không thêm dependency hoặc sửa node_modules.

## Checklist triển khai

- [x] Input auth: mở rộng `AppField` để nhận ref, icon và action phụ; chuyển
  Login/Register, giữ autocomplete, secure entry, validation, submit và focus.
- [x] Overlay: trích `AppSheet` theo mẫu đã duyệt, dùng chung cho preview và
  PartnerNoteSheet; chuyển PairingNoticeModal sang Dialog/Tamagui dùng chung.
- [x] Card: chuyển các thẻ tự dựng ở Home, Timeline, Tasks và Profile sang
  `SectionCard`; card có control con giữ tĩnh, card một hành động dùng `onPress`.
- [x] Lựa chọn: bỏ border, check và opacity press tự dựng ở mood, mascot,
  share scope và action rows; dùng filter/card/icon chung, giữ semantic selection.
- [x] Thao tác phụ: rà ghost/text actions và icon-only actions; bộ Bottom Nav,
  FAB, Radial Menu, artwork startup và reaction chuyên biệt giữ đúng contract riêng.
- [x] Rà source lần cuối, bổ sung kiểm tra chống tái dùng primitive/style cũ;
  chạy typecheck, domain tests và smoke-test web ở viewport hẹp.
- [x] Cập nhật quy chuẩn và kết quả kiểm tra, ghi rõ giới hạn native.

## Kiểm tra cần chú ý

- Form auth: ref/RHF focus, Enter/next, hiện/ẩn password, validation, disabled;
  không gửi login/register thật trong kiểm tra giao diện.
- Card: không lồng button trong button, Enter/Space chạy một lần, cancel nhả press.
- Overlay: dismiss, Escape/back, focus và scroll; giữ safe area, không lộ nội dung riêng.
- Picker: selected và disabled đúng, không thay đổi share-scope contract.
- Layout: 320/390 px và Reduced Motion; kiểm tra web không chứng minh native.

## Ghi nhận ban đầu

- README/CODING-STANDARDS/CODEBASE-BASELINE trong `.doc` chưa có trong workspace;
  áp dụng AGENTS, QUY_CHUAN_GIAO_DIEN và source hiện tại.
- Login/Register còn raw Input + border focus. PartnerNoteSheet và pairing popup
  còn native Modal; nhiều card/action/picker còn dựng bằng YStack/Pressable.
- MomentComposerSheet và NudgeFeedbackSheet là nội dung inline: giữ composition
  hiện tại, dùng control/card chung. Sau rà soát, bước xác nhận thứ hai của
  DoubleConfirmDialog và xác nhận tạo mã mới chuyển sang AppDialog; vẫn giữ
  reducer, điều kiện hợp lệ, busy và callback nghiệp vụ hiện có.
- Hero Home và ContentSurface là các bề mặt có contract riêng; giữ tone/hierarchy,
  nhưng control bên trong phải dùng design system.


## Kết quả kiểm tra

- Đã rà 54 file UI (`.tsx`) trong toàn bộ features; kiểm tra AST xác nhận không
  còn primitive control/native Modal/Pressable hoặc press/focus/hover style riêng
  trong feature. Reaction hiện là adapter của AppIconButton, không còn ngoại lệ.
- `npm run typecheck`: đạt.
- `npm run test:domain`: 86/86 đạt (84 kiểm tra cũ và 2 kiểm tra ranh giới design system).
- Web 390/320 px: Login/Register input refs, Enter/next, autocomplete, password
  reveal/hide, validation, focus 1 px và layout; không gửi POST login/register.
- Web: AppDialog/AppSheet mở, nút đóng, Escape dialog, scroll và layout; không
  warning trong lượt kiểm tra. AppChoiceTile chọn qua chạm và Space; radio không
  yêu cầu Enter. Input/textarea giữ màu khi focus, blur/disabled và kích thước.
- Expo export Android: thành công, 4438 modules, Hermes bundle 8.8 MB.
- Expo export iOS: thành công, 4341 modules, Hermes bundle 8.5 MB.
- Các bản export nằm trong thư mục Temp, không phải deployment hay bản cài native.
- Chưa kiểm thử E2E mọi màn sau đăng nhập bằng tài khoản thật, chưa chạy trên
  thiết bị iOS/Android. Không khẳng định blur/native media/notification đã được
  xác minh từ preview web hoặc bundle export. Không tạo tài khoản/dữ liệu giả,
  gọi AI, chạy SQL hay ghi lên backend/Supabase trong đợt này.

## Điều chỉnh sau review: con trỏ nhập và icon mật khẩu — 2026-10-17

- `AppField` đặt con trỏ coral đậm `accentText`: `caretColor` trên web,
  `cursorColor`/`selectionHandleColor` trên Android và `selectionColor` trên iOS.
  Web/Android giữ vùng bôi chọn `accentSoft`; iOS dùng chung màu vùng chọn/con trỏ.
- Thêm `AppIconButton tone="plain"` trong suốt, không bo khối riêng. Login và
  cả hai ô mật khẩu Register dùng tone này; giữ vùng chạm, nhãn ẩn/hiện,
  selected/disabled và callback hiện có.
- Kiểm tra lượt này: `npm run typecheck` đạt; `npm run test:domain` 86/86 đạt.
  Chưa xác minh thay đổi giao diện trên browser hoặc thiết bị native.
  Đã dừng kiểm tra browser theo yêu cầu người dùng và tắt server QA riêng.

## Redesign Profile thành Menu theo ảnh tham chiếu — 2026-10-17

- Header chỉ còn `Menu`; bỏ avatar, tên, trạng thái kết nối và subtitle khỏi
  trang điều hướng. Menu dùng `FeatureScreen` / `ContentSurface` cùng palette app.
- Sáu mục settings giữ nguyên route, chia thành Tài khoản, Kết nối và
  Hỗ trợ & dữ liệu. Nhãn nhóm có đường kẻ ngang, các hàng icon/nhãn/chevron
  xếp dọc, không có khối button hoặc card riêng.
- `AppMenuRow` shared dùng Tamagui.Button, token chung, vùng chạm tối thiểu
  56 px và press 1 px; hỗ trợ disabled, nhãn trợ năng và Reduced Motion.
  Có mẫu tại `/design-system`. Label mới có đủ vi/en.
- Bỏ tải profile/membership ở menu tĩnh; các màn settings/account lifecycle
  tiếp tục xử lý dữ liệu, xác thực và các bước xác nhận của riêng mình.
- Kiểm tra mới: `npm run typecheck` đạt; `npm run test:domain` 86/86 đạt,
  gồm guard AST chống primitive/control style tự dựng trong feature.
  Không dùng browser agent, không kiểm thử trực tiếp trên thiết bị native.

## Review Menu: card theo nhóm, Premium mẫu và quick action — 2026-10-17

- Theo yêu cầu mới, bỏ surface lớn bao Menu; mỗi nhóm là một `SectionCard`
  tĩnh, title nằm ngoài/phía trên. Nhóm không bị kéo giãn theo viewport;
  vẫn giữ clearance để nội dung cuối không bị bottom navigation che.
- Giữ sáu mục settings, thêm Các gói đăng ký và Cũng thuộc Flamee phía dưới.
  Premium chỉ là preview tháng/năm với giá/quyền lợi mẫu, không mở route/tab,
  gọi thanh toán, lưu entitlement hoặc thay đổi tài khoản.
- Bốn quick action nhỏ tái sử dụng `useFabActions("accent")`; Bottom Nav giữ
  tone mặc định. Callback/route intent của các luồng hiện có không thay đổi.
- Kiểm tra mới: `npm run typecheck` đạt; `npm run test:domain` 86/86 đạt.
  Không dùng browser agent; chưa xác minh layout/thao tác trên điện thoại.

## Review Menu: compact, divider và Chế độ tối — 2026-10-17

- Hàng Menu cao tối thiểu 48 px, chữ 14 px/icon 18 px. Card compact radius
  16 px, padding ngang 12 px, không padding dọc thừa. Mỗi hai mục có divider
  1 px inset sau icon; title vẫn ngoài card. Không đổi density mặc định nơi khác.
- Cũng thuộc Flamee chuyển từ lưới icon sang cùng cấu trúc `AppMenuRow` có
  divider. Giữ callback/intent hiện có; Premium mẫu cũng giảm spacing/type scale.
- Thêm hàng Chế độ tối trong Tài khoản, state Bật/Tắt và role switch.
  Store appearance không lưu dữ liệu tài khoản, chỉ giữ preference trong process.
  Root theme/background/status bar, nền trang, caret và icon theo theme;
  toast giữ light theme theo contract trắng sáng đã duyệt.
- Kiểm tra mới: typecheck đạt; domain tests 88/88 đạt, gồm toggle không đổi
  session và contrast tối tối thiểu 4.5:1 cho chữ/accent trên các bề mặt chính.
  Không chạy browser agent hoặc kiểm thử thiết bị; chưa xác minh native E2E.

## Review Menu: cân lại kích thước và căn giữa — 2026-10-17

- Sau feedback density quá nhỏ, hàng tăng từ 48 lên 52 px, nhãn 14 lên 16 px,
  icon 18 lên 20 px. Card compact radius 18 px, padding ngang 16 px và
  trên/dưới đều 8 px; title cách card 8 px. Divider inset theo icon là 32 px.
- Sửa căn hàng tại `AppMenuRow`: khai báo flexDirection row và căn giữa cả
  hai trục. Button unstyled không kế thừa hướng row/căn giữa của Tamagui;
  justifyContent flex-start trước đó dồn child về đầu hàng trên native.
- Kiểm tra mới: typecheck đạt; domain tests 88/88 đạt. Không dùng browser
  agent; chưa xác minh cân chỉnh trực tiếp trên thiết bị.

## Yêu cầu gỡ dark mode, giữ button placeholder — 2026-10-17

- Gỡ appearance store và hai tests của chức năng đó, palette tối tự dựng và
  mọi wiring chuyển theme/background/status bar/caret. App trở lại theme sáng.
- Giữ hàng Chế độ tối trong Tài khoản với icon/nhãn/chevron và callback trống,
  không có trạng thái Bật/Tắt, role switch hoặc route. Giữ nguyên sizing,
  căn giữa và divider đã sửa ở lượt trước.
- Kiểm tra mới: typecheck đạt; domain tests 86/86 đạt; source không còn tham
  chiếu appearance store/darkColors. Không dùng browser agent/test thiết bị.
