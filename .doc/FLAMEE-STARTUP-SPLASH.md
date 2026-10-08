# Splash khởi động Flamee

Đã tích hợp vào ứng dụng React Native / Expo SDK 57, không có route demo riêng.

## Tài nguyên và chuyển động

- Nguồn hình: `flamee-mobile/src/public/Flamee.png` (1058 × 266, có alpha).
- `logo.png` có nền đen, không được dùng trên splash.
- Biểu tượng và wordmark được crop PNG lossless; đã so sánh từng pixel RGBA với nguồn. Không đổi màu, font hay tỷ lệ ảnh.
- Trái tim ánh sáng đầu chuỗi là phần trang trí tạm thời; trái tim âm bản trong logo gốc được giữ nguyên.
- Video `Flamee-Boot-Splash.mp4` dài 6,2 giây được dùng tham chiếu. Timeline native được rút về 2.460 ms, sau đó chuyển cảnh 140 ms khi ứng dụng sẵn sàng.
- Reanimated chạy timeline, vòng sáng, hai tia hội tụ, hai dải sáng và sáu hạt sáng trên UI thread. Gradient dùng SVG hiện có, không thêm thư viện video/gradient.
- Layout theo kích thước màn hình, safe-area insets và font scale. Khi Reduce Motion bật, hiển thị bố cục hoàn chỉnh và tiếp tục khởi động; không chạy hạt sáng/vòng sáng.

## Điều phối

- `SessionInitializer` tiếp tục chạy song song như cũ. Code hiện tại đọc `localAuthService` trong bộ nhớ, chưa đọc SecureStore.
- Root navigator luôn được mount. Splash phủ lên trên và chặn tương tác/accessibility của nội dung bên dưới trong lúc khởi động.
- Chỉ ẩn splash native sau khi overlay đã layout và hai ảnh đã tải. Một PNG trong suốt 1 × 1 làm drawable cho nền chờ native tối.
- Route index vẫn dùng `resolveEntryRoute`; chỉ thêm điều kiện chờ hoạt ảnh. Provider không gọi router hay sửa deep link.
- Dùng `useSegments` để phân biệt root với các nhóm `(auth)`, `(main)`… vì các nhóm index đều có pathname `/`.
- Nếu khởi tạo chậm, giữ logo hoàn chỉnh và loading nhẹ. Deadline 15 giây đưa lỗi treo khởi tạo về root ErrorBoundary hiện có; lỗi đọc dữ liệu của index vẫn dùng FoundationScreen hiện có.
- Lỗi tải ảnh cũng đi qua root ErrorBoundary. Retry sau lỗi khởi động dùng hình hoàn chỉnh, không chạy lại chuỗi xuất hiện.
- Cờ hoàn tất chỉ sống trong JS process; không persist, không reset khi đổi route/đăng xuất và không có AppState listener phát lại splash.
- Status bar ẩn trong splash; khi unmount, StatusBar của root tiếp quản. ErrorBoundary chủ động phục hồi status bar.

## Tệp tạo hoặc sửa

Các đường dẫn sau tương đối với `flamee-mobile/`, trừ dòng cuối.

| Tệp | Thao tác | Lý do |
| --- | --- | --- |
| `app/_layout.tsx` | Sửa | Gắn StartupProvider, đảm bảo native splash và status bar thoát khi lỗi |
| `app/index.tsx` | Sửa | Chờ hoạt ảnh trước Redirect, báo lỗi khởi tạo cho overlay |
| `app/providers/StartupProvider.tsx` | Tạo | Phối hợp layout, session, hoạt ảnh, route và fallback |
| `app/providers/startupLifecycle.ts` | Tạo | Cờ theo process và điều kiện chuyển tiếp có thể kiểm tra độc lập |
| `src/features/startup/index.ts` | Tạo | Public export của feature |
| `src/features/startup/components/StartupSplash.tsx` | Tạo | Layout Tamagui, timeline, giảm chuyển động, accessibility, loading |
| `src/features/startup/components/StartupArtwork.tsx` | Tạo | Logo nguyên bản và các lớp ánh sáng native |
| `src/features/startup/assets/flamee-symbol.png` | Tạo | Crop biểu tượng trong suốt, 223 × 266 |
| `src/features/startup/assets/flamee-wordmark.png` | Tạo | Crop wordmark trong suốt, 772 × 168 |
| `src/features/startup/assets/native-background.png` | Tạo | Drawable trong suốt cho splash native |
| `scripts/prepare-startup-assets.cjs` | Tạo | Ghi lại cách crop lossless; từ chối ghi đè tài nguyên đã có |
| `src/shared/constants/tokens.ts` | Sửa | Palette và thông số splash; giữ palette toàn app hiện có |
| `src/shared/localization/messages.ts` | Sửa | Tagline và nhãn splash tiếng Việt/Anh |
| `app.json` | Sửa | Cấu hình nền chờ expo-splash-screen |
| `package.json` | Sửa | Thêm expo-splash-screen tương thích SDK 57 |
| `package-lock.json` | Sửa | Khóa dependency tương ứng |
| `.doc/FLAMEE-STARTUP-SPLASH.md` (root workspace) | Tạo | Ghi chú tích hợp và kiểm tra |

## Kiểm tra đã thực hiện

- `npm run typecheck`: pass sau thay đổi cuối cùng.
- `npx expo install --check`: dependencies up to date.
- `npx expo config --type public --json`: pass; SDK 57, portrait, iOS 16.4 và plugin splash đúng cấu hình.
- Metro bundle đầy đủ trên iOS và Android: HTTP 200, bao gồm StartupSplash, cổng route segments, ảnh trong suốt và worklets.
- Assertions chạy trực tiếp qua Node, không tạo test source: crop RGBA nguyên vẹn; signed-out → auth; phiên hợp lệ → onboarding/invite/waiting/home; chờ đủ layout + hoạt ảnh + session; giải phóng đúng ở route group/deep link/lỗi; cờ process không reset khi sign-out.
- Đã tái hiện lỗi kiểm tra pathname `/`, sửa bằng segments và chạy lại assertion regression thành công.
- Android AVD `Medium_Phone`, Expo Go 57.0.9: splash xuất hiện và thoát đến welcome; đăng nhập cục bộ bằng UI đi tới onboarding; chuyển route không phát lại splash.
- Android background → recent apps → foreground: vẫn ở onboarding với cùng process và phiên; bản ghi thao tác không có splash phát lại.
- Không tạo file `*.test.*` / `*.spec.*`, không thêm demo runtime hay dữ liệu nghiệp vụ persist.

## Giới hạn còn lại

- Chưa kiểm tra trên iOS hoặc thiết bị vật lý, chưa đo FPS trên thiết bị tầm trung.
- Chưa chạy thao tác bật/tắt Reduce Motion trên thiết bị; đã kiểm tra đường xử lý trong code.
- Expo Go không mô phỏng đầy đủ splash native của bản standalone. Cần kiểm tra cold launch bằng bản native trước khi phát hành: <https://docs.expo.dev/versions/latest/sdk/splash-screen/>.
- Runtime hiện có cảnh báo Expo Router quét các module trong `app/providers` / `entryRoute`, các vòng import feature và token Tamagui `$4` / SVG `$primary` ở UI hiện có. Chưa thay cấu trúc hoặc sửa các feature đó trong tác vụ splash.
- Cài dependency báo 25 vấn đề audit (11 moderate, 14 high). Không chạy audit fix hoặc nâng các dependency khác.
