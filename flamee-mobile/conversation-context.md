# Conversation Context & Technical Architecture Summary

File này tổng hợp toàn bộ ngữ cảnh, yêu cầu từ anh yêu, quyết định kiến trúc, quá trình tái thiết kế UI/UX và chi tiết triển khai mã nguồn trong toàn bộ phiên làm việc.

---

## 1. 📌 Quy Tắc Giao Tiếp & Xung Quanh Dự Án
- **Quy tắc xưng hô**: Luôn gọi người dùng là **"anh yêu"** (Đã lưu vào file `.agents/AGENTS.md`).
- **Thư mục dự án**: `d:\FPT\ky7\EXE\project\Flamee-mobile-app\flamee-mobile`.
- **Chuẩn Kiến trúc Frontend**: Đã tuân thủ nghiêm ngặt chuẩn kiến trúc mô tả trong [SKILL.md](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/skills/frontend-development-standards/SKILL.md):
  - Phân chia module theo tính năng trong `features/` (ví dụ `features/mascot/`, `features/mood/`).
  - Giao diện tách biệt hoàn toàn khỏi logic I/O (I/O do `services/` xử lý, state & navigation do `hooks/` quản lý).
  - Không import trực tiếp từ bên trong các feature khác, mọi truy cập liên feature phải qua file `index.ts`.

---

## 2. 🎭 Mascot Animation Engine & Speech Bubble Redesign

### Refactor Mascot từ Rive sang Reanimated 3 Physics Engine:
- Thay thế hoàn toàn Rive engine nặng và cứng bằng **Reanimated 3 Organic Physics Engine** trong `features/mascot/components/MascotVisual.tsx`:
  - 7 trạng thái cảm xúc mascot (`happy`, `calm`, `sad`, `tired`, `angry`, `surprised`, `neutral`).
  - Mỗi cảm xúc có tần số vật lý xoay, co dãn (`scaleX`, `scaleY`, `rotation`), nẩy nhịp riêng và vòng hào quang aura glow tương ứng (`MOOD_AURA_COLORS`).
  - Tích hợp hiệu ứng nẩy dẻo chạm Mascot (`onPressIn`, `onPressOut`, `isPressed`) kết hợp haptic feedback `expo-haptics`.
  - Quản lý 11 PNG sticker mascot Figma trong `MascotArtwork.tsx`.

### Redesign Speech Rail & Action Pills:
- Mở rộng kích thước khung tin nhắn mascot lên `220px` - `280px` (`mascotLayout.ts`).
- Thiết kế lại `MascotActionHalo.tsx`: Thẻ phông màu trắng `#FFFFFF`, nhãn Coral `Flamee`, chữ không bị che mờ hay khuất (`numberOfLines={3}`), các nút hành động rõ chữ (*"Mood check"* & *"Chat AI"*).

---

## 3. 💖 Tính Năng Mood-Checkin (Thiết kế Chuẩn 100% Figma Node 6528:7279)

### Figma Resource Data:
- **Link Figma**: `https://www.figma.com/design/Ke9lnLL4XvAeYJw0yb0yhb/Flamee?node-id=6528-7280&t=f9QDfEHQM9ppt6Si-1`
- **Figma Node ID**: `6528:7279` ("Mood checkin") và `6528:7280` ("Biển 2").
- **Asset Ảnh Nền**: Đã tải file ảnh gốc `mood-background-bien.png` từ Figma node `6528:7280` về `assets/images/brand/mood-background-bien.png` và khai báo trong `brandAssets.ts` (`brandAssets.moodBienBackground`).

### Chi Tiết Cấu Trúc Giao Diện `MoodCheckinModal.tsx`:
1. **Nửa Trên (Background Biển 2 & Carousel Mascot)**:
   - **Ảnh nền**: `mood-background-bien.png` phủ 100% full screen kèm lớp mờ tối 45% (`rgba(0, 0, 0, 0.45)`).
   - **Header Pill Badge (`Mood check-in`)**: Kích thước `240px x 46px, borderRadius: 40px`, màu cam mờ `rgba(255, 113, 88, 0.22)`, chữ trắng `fontSize: 26px`.
   - **Phụ đề**: *"Hôm nay bạn cảm thấy thế nào?"* chữ trắng `fontSize: 18px`.
   - **Hàng Mascot Xoay Vòng Đường Cong Parabol (Parabolic Arc Wheel)**:
     - 5 sticker mascot hiển thị theo vòng cong hình vòm U-shape:
       - **Center Mascot (Active)**: Phóng to **108px x 108px** (`borderRadius: 54px`), vòng tròn thủy tinh mờ phát sáng (`backgroundColor: rgba(255, 255, 255, 0.25)`, `borderColor: rgba(255, 255, 255, 0.6)`), vị trí cao nhất (`translateY: 0px`). Sticker size `72px`.
       - **Side Mascot Cận Center**: Thu nhỏ **56px x 56px** (`borderRadius: 28px`), hạ thấp xuống theo đường cong (`translateY: 22px`), opacity `0.6`. Sticker size `36px`.
       - **Side Mascot Xa 2 Bên**: Thu nhỏ **56px x 56px**, hạ thấp hơn (`translateY: 53px`), opacity `0.35`.
     - Tự động uốn cong tính toán vị trí `translateY` và `scale` mượt mà khi cuộn lướt hoặc chạm chọn.
     - **Nhãn tên mood center**: *"Tuyệt vời"*, *"Hạnh phúc"*, *"Bình yên"*, *"Bình thường"*, *"Bất ngờ"*, *"Giận dữ"*, *"Mệt mỏi"*, *"Buồn"*.

2. **Nửa Dưới (Khối Mái Vồng Cầu Dome `#FFF1E4`)**:
   - Khối vòm cong `#FFF1E4` với `borderTopLeftRadius: 180, borderTopRightRadius: 180` tràn 100% chiều ngang màn hình.
   - Bao bọc bởi `KeyboardAvoidingView` đảm bảo khi mở bàn phím giao diện vẫn phẳng mượt.
   - Tiêu đề: *"Hãy viết lời nhắn nhủ\nđến đối phương nhé!"* chữ Cam Coral `#FF7158`, `fontSize: 24px, lineHeight: 30px`.
   - **Frame 322 Chat Message Input Card**: Kích thước **294px x 124px**, màu hồng cam mờ `rgba(255, 113, 88, 0.18)`, `borderRadius: 24px`, placeholder *"Hãy viết vài lời nhắn nhủ đến đối phương nhé"*.
   - **Frame 234 Nút Lưu**: Kích thước **294px x 42px**, `borderRadius: 32px`, Gradient `#FCB76D` -> `#FF7158`, chữ *"Lưu"* màu `#FFE6CE`.

---

## 4. 📂 Danh Sách File Đã Tạo & Cập Nhật

- **`features/mascot/`**:
  - `components/MascotVisual.tsx`: Engine vật lý Reanimated 3 cho 7 cảm xúc + Hào quang Aura glow.
  - `components/HomeMascotCompanion.tsx`: Logic chạm nẩy dẻo & haptics.
  - `components/MascotArtwork.tsx`: Map 11 PNG sticker mascot.
  - `components/MascotActionHalo.tsx`: Redesign speech rail & action pills.
  - `mascotLayout.ts`: Mở rộng kích thước speech bubble.
  - `services/mascotNudgeResolver.ts`: Hỗ trợ đầy đủ các mood level.

- **`features/mood/`**:
  - `types.ts`: Định nghĩa kiểu dữ liệu `MoodCheckinItem`, `MoodCheckinDraft`, `MoodEntry`, `MoodSummary`, `MoodLevel`.
  - `services/moodService.ts`: Khai báo `MOOD_CHECKIN_OPTIONS` (8 sticker), `saveMoodCheckin()`, `getLatestMoodCheckin()`, `getMoodSummary()`.
  - `hooks/useMoodCheckin.ts`: Hook điều phối state chọn mood qua carousel index, quản lý lời nhắn & submit.
  - `hooks/useMoodSummary.ts`: React Query hook cho mood summary.
  - `components/MoodCheckinModal.tsx`: Modal full-screen triển khai thiết kế 1:1 Figma.
  - `screens/MoodScreen.tsx`: Tích hợp banner check-in & modal.
  - `index.ts`: Module export công khai.

- **`shared/assets/`**:
  - `brandAssets.ts`: Đã thêm `moodBienBackground: require('../../assets/images/brand/mood-background-bien.png')`.
  - `assets/images/brand/mood-background-bien.png`: File ảnh gốc Biển 2 tải từ Figma Node `6528:7280`.

---

## 5. 🧪 Kiểm Thử & Xác Nhận Tuân Thủ

- **TypeScript Typecheck (`npx tsc --noEmit`)**: **0 Lỗi**.
- **Jest Unit Testing (`npm test -- --runInBand`)**: **23/23 Test Suites PASS** (87/87 Tests PASS).
