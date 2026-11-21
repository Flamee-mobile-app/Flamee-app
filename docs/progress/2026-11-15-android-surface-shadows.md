# Android: lớp xám quanh control dùng chung

## Nguyên nhân và cách sửa

Tái hiện trên Expo Go, Android emulator API 35: focus ô mật khẩu ở Login làm xuất hiện vùng xám trong toàn bộ khung bo góc, còn vùng TextInput ở giữa giữ màu nền sáng. AppField trước đó đổ bóng bằng shadow props và Android elevation lên bề mặt bán trong suốt. Bóng elevation hiện xuyên qua phần nền này. Thay riêng shadow của AppField bằng outset boxShadow đã loại bỏ vùng xám khi focus trên cùng emulator.

Android dùng outset boxShadow có alpha tường minh, không dùng elevation cho các bề mặt chung này. Helper resolveSurfaceShadow chuyển shadowRadius sang CSS blur (2 lần radius), resolve màu token và giữ shadow cũ trên iOS/web. Không sửa dependency, màu nền, nội dung form hoặc logic nghiệp vụ.

Phạm vi áp dụng: AppField, AppButton (cả trạng thái press và depth), SectionCard, ContentSurface, AppIconButton avatar, AppSwitch thumb, AppHeaderPill, AppDialogContent, AppToast, nền trắng bán trong suốt của FAB, header Home và panel Invite. Checkbox, filter, choice và menu đã rà source/catalog; chúng không dùng elevation tạo bóng lên nền. Animation startup cũ không còn được mount nên không thay đổi.

Outset boxShadow native yêu cầu New Architecture và Android API 28 trở lên, phù hợp runtime đã kiểm tra. Android cũ hơn có thể không hiện bóng; không dùng elevation fallback vì có thể tái tạo lỗi. Kiểm tra release/thiết bị cũ vẫn cần thực hiện.

## Xác minh

- Tái hiện và chụp trước sửa: `.local-tools/flamee-ui-before-20261115.png`.
- Login sau sửa, password focus và bàn phím mở: `.local-tools/flamee-ui-focus-after.png`; vùng xám trong khung đã biến mất.
- Catalog `/design-system`: kiểm tra nhóm button, ghost sáng, loading/disabled, filter/choice, input thường, lỗi, textarea, disabled và focus. Ảnh `.local-tools/flamee-ui-catalog.png`, `flamee-ui-catalog-fields.png`, `flamee-ui-catalog-focused-field.png`.
- Các ảnh chỉ là bằng chứng render Android emulator. Không coi đây là E2E toàn bộ màn đã đăng nhập, xác minh API hay bằng chứng iOS/web/thiết bị thật đã hoạt động.
- Unit test riêng cho chuyển shadow và alpha; typecheck và suite domain được chạy. Suite vẫn có lỗi Check-in đã tồn tại: `checkInUiContract.test.ts`, “uses an intrinsic thought bubble, centered avatar and 56px picker row”, chờ `bubbleToLargeTailGap: 6` trong khi token hiện là `-6`; không thay đổi ngoài phạm vi để làm xanh test.
