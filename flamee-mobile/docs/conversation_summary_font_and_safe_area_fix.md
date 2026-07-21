# Summary của Toàn bộ Conversation - Flamee Mobile App

> **Ngày thực hiện**: 21-07-2026  
> **Dự án**: `Flamee-mobile-app`  
> **Mục tiêu**: Cấu hình hệ thống Font chữ SF Pro tập trung, sửa toàn bộ lỗi giao diện Font chữ hệ thống fallback, và giải quyết triệt để lỗi khoang an toàn (Safe Area / Status Bar Notch / Home Indicator Overlap) cho toàn bộ ứng dụng.

---

## 1. Các Quy định & Context từ Người dùng (User Directives)
- **Cách xưng hô**: Đã ghi nhận và lưu quy tắc xưng hô trong dự án tại `.agents/AGENTS.md` (gọi người dùng là `"anh yêu của em"` hoặc `"anh yêu"`).
- **Định hướng làm việc**: Người dùng cung cấp context giao diện để hỗ trợ giải quyết vấn đề trực tiếp, không cần hỏi những bước không cần thiết.

---

## 2. Bài toán 1: Sửa hệ thống Font chữ (System-Wide Custom Font Integration)

### 2.1. Vấn đề & Nguyên nhân gốc rễ (Root Cause)
1. **Thiếu module đóng gói Font dùng chung**: Các trang tự nhúng và cấu hình font riêng rẽ hoặc sử dụng tên chuỗi cứng (`'SF-Pro'`, `'SF-Pro-Rounded'`).
2. **Cơ chế tải Font trong Expo/React Native**: Khi dùng `useFonts({ 'SF-Pro-Bold': require(...) })`, React Native yêu cầu thuộc tính `fontFamily` phải khớp **chính xác 100%** với key đã đăng ký.
3. **Lỗi Fallback về Font hệ thống (Roboto / System Default)**:
   - Các màn hình áp dụng `fontFamily: 'SF-Pro-Medium'` kèm theo thuộc tính `fontWeight: '700'` hoặc `'bold'`.
   - Hệ điều hành Android & iOS không thể ghép nối `fontFamily: 'SF-Pro-Medium'` với trọng lượng weight `700`, dẫn đến việc hệ thống **hủy bỏ custom font** và **tự động fallback về font mặc định của máy**.
4. **Cảnh báo Monkey-Patching**: Đoạn mã can thiệp runtime vào `React Native Text/TextInput` prototype cũ trong `app/_layout.tsx` gây ra cảnh báo không ổn định.

### 2.2. Các giải pháp đã triển khai
1. **Đóng gói Font Assets dùng chung**:
   - Tạo file [shared/assets/fontAssets.ts](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/shared/assets/fontAssets.ts) gom 8 tập tin font SF Pro (`SF-Pro-Rounded-Bold`, `SF-Pro-Rounded-Semibold`, `SF-Pro-Rounded-Medium`, `SF-Pro-Rounded-Regular`, `SF-Pro-Bold`, `SF-Pro-Medium`, `SF-Pro-Regular`, `SF-Pro-Light`).
   - Re-export qua `shared/assets/index.ts`.
2. **Cập nhật Design Tokens (`flameeTheme.ts`)**:
   - Khai báo mapping `flameeFonts` với các key font đã load.
   - Cập nhật toàn bộ các biến thể typography (`heading`, `display`, `title`, `subtitle`, `body`, `caption`, `micro`,...) trong [flameeTheme.ts](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/shared/constants/flameeTheme.ts).
3. **Bộ tự động chuyển đổi Font Weight (`AppText.tsx`)**:
   - Xây dựng hàm `resolveFontStyle` thông minh trong [AppText.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/shared/components/ui/AppText.tsx).
   - Tự động nhận diện khi style có thuộc tính `fontWeight` (`700`, `600`, `bold`,...), chuyển đổi trực tiếp sang tên font SF Pro tương ứng và bóc tách thuộc tính `fontWeight` ra để OS **không bao giờ bị fallback về font mặc định**.
4. **Loại bỏ Monkey-patching & Cập nhật màn hình**:
   - Dọn dẹp `app/_layout.tsx`, load font sạch qua `useFonts(fontAssets)`.
   - Cập nhật toàn bộ các màn hình Auth (`StartScreen`, `LoginScreen`, `RegisterScreen`), Main Tabs (`HomeScreen`, `MoodScreen`, `DatesScreen`, `MissionsScreen`, `ProfileScreen`, `AiScreen`), Feature Timeline (`TimelineOverview`, `TimelineHero`, `TimelineListCard`), Feature Memory Book (`MemoryBookScreen`, `MemoryBookCard`, `CreateMemoryBookScreen`, `EditMemoryBookScreen`, `MemoryBookDetailScreen`), và UI component (`GradientButton`).

---

## 3. Bài toán 2: Sửa triệt để lỗi Safe Area (Notch & Home Indicator Overlap)

### 3.1. Vấn đề & Nguyên nhân gốc rễ (Root Cause)
1. **Tràn lề mép trên (Top Status Bar / Notch Overlap)**:
   - Tiêu đề màn hình *"Thêm kỉ niệm mới"* bị chèn trực tiếp lên thanh Status bar (đồng hồ `23:13`, sóng, vạch pin).
2. **Tràn lề mép dưới (Bottom Home Indicator Overlap)**:
   - Các nút bấm thao tác (*"Hủy"*, *"Tiếp tục"*, *"Sửa"*,...) bị vạch đen Home Indicator dưới cùng của iPhone che khuất.
3. **Nguyên nhân kỹ thuật**:
   - File root layout `app/_layout.tsx` thiếu `<SafeAreaProvider>` từ `react-native-safe-area-context`, khiến mọi hàm `useSafeAreaInsets()` đo đạc trả về `0` inset.
   - Màn hình Modal native (`CreateTimelineScreen`, `EditTimelineScreen`, `TimelineFilterScreen`) chạy trong cửa sổ window riêng biệt trên iOS/Android, nếu không được bù lùi khoang an toàn chủ động thì sẽ bị tràn lề tuyệt đối.

### 3.2. Các giải pháp đã triển khai
1. **Bọc Root Layout với `<SafeAreaProvider>`**:
   - Cập nhật [app/_layout.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/app/_layout.tsx) bọc toàn bộ ứng dụng bằng `<SafeAreaProvider>`.
2. **Xây dựng Custom Hook `useAppSafeArea`**:
   - Tạo [shared/hooks/useAppSafeArea.ts](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/shared/hooks/useAppSafeArea.ts) tính toán khoang an toàn với giá trị sàn tối thiểu:
     - `safeTop`: `Math.max(insets?.top || 0, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44)` (đảm bảo ít nhất 44px trên iOS Notch / Dynamic Island và 24-40px trên Android).
     - `safeBottom`: `Math.max(insets?.bottom || 0, Platform.OS === 'ios' ? 34 : 16)` (đảm bảo ít nhất 34px trên iPhone Home Indicator và 16px trên Android Nav Bar).
   - Đảm bảo tuân thủ 100% quy tắc React Hooks (`react-hooks/rules-of-hooks`) và tương thích hoàn toàn với môi trường Jest test.
3. **Áp dụng đồng bộ lên các màn hình & Modal**:
   - `CreateTimelineScreen.tsx`: `header` có `paddingTop: safeArea.top`, `footer` có `paddingBottom: safeArea.bottom + 8px`.
   - `EditTimelineScreen.tsx`, `TimelineFilterScreen.tsx`.
   - `MemoryBookScreen.tsx`, `CreateMemoryBookScreen.tsx`, `EditMemoryBookScreen.tsx`, `MemoryBookDetailScreen.tsx`.
   - `TimelineOverview.tsx`.

---

## 4. Danh sách Tập tin Đã chỉnh sửa & Tạo mới

### Tập tin Tạo mới (`[NEW]`):
- `flamee-mobile/shared/assets/fontAssets.ts`: Gom 8 tập tin font SF Pro cho `useFonts`.
- `flamee-mobile/shared/hooks/useAppSafeArea.ts`: Custom hook tính toán khoang an toàn an toàn cho iOS & Android.

### Tập tin Cập nhật (`[MODIFY]`):
- `flamee-mobile/app/_layout.tsx`: Bọc `<SafeAreaProvider>`, load `fontAssets`, xóa monkey-patching.
- `flamee-mobile/shared/assets/index.ts`: Export `fontAssets`.
- `flamee-mobile/shared/hooks/index.ts`: Export `useAppSafeArea`.
- `flamee-mobile/shared/constants/flameeTheme.ts`: Thêm `flameeFonts`, nâng cấp typography tokens.
- `flamee-mobile/shared/components/ui/AppText.tsx`: Nâng cấp bộ giải quyết font weight tự động.
- `flamee-mobile/shared/components/ui/GradientButton.tsx`: Đổi tên font cứng sang `flameeFonts`.
- `flamee-mobile/features/auth/screens/StartScreen.tsx`
- `flamee-mobile/features/auth/screens/LoginScreen.tsx`
- `flamee-mobile/features/auth/screens/RegisterScreen.tsx`
- `flamee-mobile/features/home/screens/HomeScreen.tsx`
- `flamee-mobile/features/mood/screens/MoodScreen.tsx`
- `flamee-mobile/features/dates/screens/DatesScreen.tsx`
- `flamee-mobile/features/missions/screens/MissionsScreen.tsx`
- `flamee-mobile/features/profile/screens/ProfileScreen.tsx`
- `flamee-mobile/features/ai/screens/AiScreen.tsx`
- `flamee-mobile/features/timeline/components/TimelineHero.tsx`
- `flamee-mobile/features/timeline/components/TimelineOverview.tsx`
- `flamee-mobile/features/timeline/components/TimelineOverview.test.tsx`
- `flamee-mobile/features/timeline/screens/CreateTimelineScreen.tsx`
- `flamee-mobile/features/timeline/screens/EditTimelineScreen.tsx`
- `flamee-mobile/features/timeline/screens/TimelineFilterScreen.tsx`
- `flamee-mobile/features/memory-book/screens/MemoryBookScreen.tsx`
- `flamee-mobile/features/memory-book/screens/CreateMemoryBookScreen.tsx`
- `flamee-mobile/features/memory-book/screens/EditMemoryBookScreen.tsx`
- `flamee-mobile/features/memory-book/screens/MemoryBookDetailScreen.tsx`
- `flamee-mobile/features/memory-book/components/MemoryBookCard.tsx`

---

## 5. Kết quả Kiểm thử & Xác minh (Verification Results)

1. **Kiểm tra Kiểu dữ liệu TypeScript (`npx tsc --noEmit`)**:
   - **Kết quả**: Passed (0 errors).
2. **Kiểm thử Đơn vị Jest (`npm test -- --runInBand`)**:
   - **Kết quả**: 12/12 Test Suites PASSED (59/59 tests PASSED 100%).
