# Flamee Mobile - Redesign Project Summary

Tài liệu này tóm tắt toàn bộ bối cảnh, các bước thực hiện, quyết định thiết kế và trạng thái hiện tại của dự án thiết kế lại giao diện di động Flamee để bất kỳ AI Agent nào tiếp quản tiếp theo có thể nắm bắt context và tiếp tục công việc ngay lập tức.

---

## 1. Mục tiêu dự án (Goals)
*   **Yêu cầu gốc**: Thiết kế lại toàn bộ giao diện các màn hình của ứng dụng Flamee Mobile (React Native / Expo / Expo Router) để khớp chính xác với bản vẽ thiết kế thuộc Layer "Demo" trên Figma.
*   **Figma Link**: [Figma design file](https://www.figma.com/design/Ke9lnLL4XvAeYJw0yb0yhb/Flamee?node-id=0-1&m=dev&t=dLg4aDCKZislw1lR-1)
*   **Tech Stack**: React Native (Expo SDK 54), TypeScript, Expo Router (Feature-based folder structure), Expo Linear Gradient, React Query.

---

## 2. Hệ thống Màu sắc (Color System)
Bảng màu của ứng dụng đã được thiết lập đầy đủ trong file [flameeTheme.ts](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/constants/flameeTheme.ts) khớp 100% với Brand Concept Figma:

*   **Brand Colors**:
    *   `Primary`: `#FF7158` (Cam san hồng)
    *   `Secondary`: `#FCB76D` (Vàng cam)
    *   `Gradient`: Từ `#FCB76D` đến `#FF7158` (Gradients hướng chéo hoặc ngang)
*   **Neutral Colors**:
    *   `Text Primary` (Dark 1): `#2B2B2B` (Màu tối chính của chữ, thay thế cho màu đen `#000000`)
    *   `Text Secondary` (Dark 2): `#555555`
    *   `Light Background`: `#FAF9F7` (Màu kem nhạt làm màu nền chính của các màn hình)
*   **Support Colors**:
    *   `Cream`: `#FFF1E4`
    *   `Muted Coral`: `#FF9B8A`
    *   `Peach`: `#FFC7A1`
    *   `Purple`: `#CDB4FF`
    *   `Lavender`: `#DCCEF7`
*   **Semantic Colors**:
    *   `Warning`: `#F5B041`
    *   `Success`: `#76E69F`
    *   `Danger/Error`: `#E65C5C`

---

## 3. Các màn hình đã Redesign & Vị trí Files

Tất cả các file màn hình nghiệp vụ nằm trong thư mục `features/[feature_name]/screens/`. Cấu trúc Router trong `app/` chỉ re-export các màn hình này.

### Màn hình Đăng nhập & Đăng ký (Auth Flow)
1.  [StartScreen.tsx (Màn hình chính)](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/auth/screens/StartScreen.tsx):
    *   **Ảnh nền gốc**: Sử dụng ảnh nền phong cảnh vẽ tay tải trực tiếp từ Figma (`assets/chinh_mau_1.png`) kết hợp với lớp phủ tối `rgba(0,0,0,0.45)` để tăng tính thẩm mỹ và dễ đọc chữ.
    *   **Logo signature**: Tích hợp logo ngọn lửa khuyết trái tim màu trắng sữa (`assets/flamee_logo.png`) lấy từ Figma.
    *   **Bố cục safe area**: Sử dụng `SafeAreaView` tiêu chuẩn giúp giao diện thích ứng tự nhiên trên tất cả các màn hình di động thực tế.
    *   **Nút Đăng nhập**: Nút gradient cam-vàng, chữ màu vàng-nâu đậm (`#5B4C1B`).
    *   **Nút Đăng ký**: Đổi sang viền trắng sữa kem nhạt (`#FAF9F7`) và lớp nền mờ `rgba(255,255,255,0.08)` (Glassmorphism) để tăng độ tương phản và tính tương tác UI/UX tốt nhất trên nền tranh tối màu.
2.  [LoginScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/auth/screens/LoginScreen.tsx) & [RegisterScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/auth/screens/RegisterScreen.tsx):
    *   Header trên cùng màu tối chứa chữ thương hiệu `🔥 flamee`.
    *   Khung nhập liệu màu kem bo tròn góc lớn (`borderRadius: 63px` tương đương figma panel) từ y-position 361px trở xuống.
    *   Các ô nhập liệu viền gradient, nút bấm chính gradient.

### Màn hình Dashboard & Tính năng chính
3.  [HomeScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/home/screens/HomeScreen.tsx):
    *   Hero section phủ màu sunset và câu chào "Good evening" kèm quote trắng.
    *   Các thẻ kỉ niệm có nút liên kết và layout sắp xếp grid gọn gàng.
4.  [ProfileScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/profile/screens/ProfileScreen.tsx):
    *   Avatar tròn có viền gradient chéo.
    *   3 thẻ thống kê (Kỉ niệm, Nhiệm vụ, Mood) viền gradient mỏng và thẻ báo cáo streak.
    *   Menu cài đặt được kẻ dòng sang trọng.
5.  [AiScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/ai/screens/AiScreen.tsx):
    *   Màn hình chat với Flamee AI, chứa bong bóng gợi ý hội thoại màu kem, khung chat bo tròn và nút gửi dạng tròn màu cam.
6.  [TimelineScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/memories/screens/TimelineScreen.tsx):
    *   Đường timeline dọc màu cam kết nối các cột mốc lịch sử, sử dụng icon vòng tròn nhỏ biểu thị các loại kỉ niệm khác nhau.
7.  [MemoriesScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/memories/screens/MemoriesScreen.tsx):
    *   Lọc kỉ niệm theo các tab tròn và hiển thị danh sách dạng grid 2 cột.
8.  [MoodScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/mood/screens/MoodScreen.tsx):
    *   Bảng chọn emoji tâm trạng, biểu đồ thống kê mood theo tuần của cặp đôi.
9.  [MissionsScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/missions/screens/MissionsScreen.tsx):
    *   Tiêu đề `"Nhiệm vụ nho nhỏ"`. Thẻ nhiệm vụ chính nổi bật có hình vẽ, nút bấm hoàn thành kích thước lớn và danh sách nhiệm vụ thêm viền cam.
10. [DatesScreen.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/dates/screens/DatesScreen.tsx):
    *   Thanh chọn lịch ngày trong tuần màu kem với ngày kích hoạt màu cam.
    *   Thẻ lịch hẹn sắp tới dạng gradient cam. Các ý tưởng hẹn hò bên dưới xếp dọc viền cam mảnh.

---

## 4. Các thư viện được cài đặt bổ sung
*   `expo-linear-gradient`: Dùng để vẽ các dải gradient thương hiệu trên nút bấm, viền và khung tiêu đề.

---

## 5. Lưu ý Kỹ thuật & Khởi động Dự án (For Future Agents)
*   **TypeScript check**: Chạy `npx tsc --noEmit` để đảm bảo không lỗi kiểu dữ liệu. Hiện tại 100% sạch lỗi.
*   **Unit Tests**: Chạy `npm run test` để thực thi Jest. Toàn bộ 9 tests/4 suites đều đã passed.
*   **Lỗi Start Metro Bundler (Mạng/Proxy)**: Khi khởi chạy `npx expo start`, CLI có thể bị lỗi crash `TypeError: fetch failed` do không có kết nối internet hoặc bị proxy chặn kiểm tra phiên bản. 
    *   **Giải pháp**: Bắt buộc khởi động bằng cờ **`--offline`**:
        ```bash
        npx expo start --offline
        ```
        Lệnh này sẽ tắt tính năng xác thực trực tuyến của Expo và khởi chạy Metro Bundler cục bộ thành công trên cổng `8081`.
