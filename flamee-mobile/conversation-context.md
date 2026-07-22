# Flamee Mobile - Conversation Context & Technical Specification

> **System Persona & Rules**:
> - Always address the user as **"anh yêu"** (quy tắc hệ thống bắt buộc).
> - Project: Flamee Mobile App (React Native, Expo Router, TypeScript, Reanimated v3, NativeWind/CSS-Interop).

---

## 📐 1. Quy Tắc Kiến Trúc & Thiết Kế (Architectural & Design Standards)

1. **Kiến Trúc Theo Feature (Feature-Driven Architecture)**:
   - Tất cả mã nguồn chức năng thuộc thư mục `features/<feature_name>/`:
     - `screens/`: Màn hình giao diện chính (ví dụ: `MissionsScreen.tsx`).
     - `components/`: Các component hỗ trợ thuộc tính năng.
     - `services/`: Logic xử lý dữ liệu & mock API (`missionService.ts`).
     - `hooks/`: Custom React hooks (`useMissions.ts`).
     - `types/`: Khai báo TypeScript types/interfaces (`types.ts`).
   - Mã nguồn dùng chung lưu tại `shared/`:
     - `shared/components/icons/`: Hệ thống Icon SVG dự án (`FlameeIcon.tsx`).
     - `shared/components/ui/`: Các component UI tái sử dụng (`StateView.tsx`, `BottomNav.tsx`).
     - `shared/constants/flameeTheme.ts`: Brand color palette & font tokens.

2. **Quy Tắc Thiết Kế Giao Diện & Frame Figma**:
   - **Tệt đối KHÔNG sử dụng Frame 2** dưới mọi hình thức.
   - **Bộ Bảng Màu Brand**:
     - Primary Color: `#FF7158` (Coral Orange)
     - Secondary Color: `#FCB76D` (Warm Soft Gold)
     - Light Background: `#FAF9F7` (Nền kem dịu nhẹ toàn màn hình)
     - Support Pastel Colors: `#FFF1E4`, `#FFE6CE`, `#E8F8EE` (Nhiệm vụ đã xong)
     - Text Primary: `#2B2B2B`, Text Secondary: `#555555` / `#888888`
   - **Font Chữ**: `SF-Pro-Rounded-Bold` (`flameeFonts.roundedBold`), `SF-Pro-Bold` (`flameeFonts.bold`), `SF-Pro-Medium` (`flameeFonts.medium`).

3. **Hệ Thống Icon Chuẩn Dự Án (`FlameeIcon`)**:
   - Đăng ký file SVG nguồn trong `assets/icons/manifest.json`.
   - Sinh component React Native SVG qua script `npm run icons:generate` (lưu tại `shared/components/icons/generated/`).
   - Cập nhật `iconNames.ts` và `FlameeIcon.tsx`.
   - Sử dụng thống nhất qua: `<FlameeIcon name="..." size={...} color={...} />`.
   - Icon Logo Flamee Ngọn Lửa (`name="logo"`): Đã trích xuất chuẩn SVG Vector từ Figma (`5785:434`), hỗ trợ nhận prop `color` đổi màu đồng bộ với text.

---

## 🎯 2. Chi Tiết Chức Năng Tiny Mission (Nhiệm Vụ Nho Nhỏ)

Chức năng Tiny Mission bao gồm 3 chế độ xem chính (`MissionViewMode`):

### A. Frame 3: Main Mission Hub (`viewMode === 'hub'`)
- **Nửa Trên (Sunset Gradient Header - `MascotExpHeader.tsx`)**:
  - Top Bar: Icon Logo Flamee (`<FlameeIcon name="logo" size={32} color="#FF7158" />`) + Chữ **Flamee** ở góc trái. Góc phải hiển thị chỉ số **"Chuỗi 3"** (chỉ hiện khi `streakDays > 0`).
  - Sân đài Mascot trung tâm: Mascot Sticker `emotion_08_tuyet_voi.png` (Mascot chim nhỏ dang cánh vui mừng chúc mừng).
  - Icon Hộp Quà + *"Cấp 3"*: Khi lên cấp (`isLevelUp === true`), icon hộp quà nhún nảy spring & xoay tạo hiệu ứng chú ý. Bấm vào icon hộp quà sẽ mở Pop-up nhận thưởng.
  - Thanh EXP Track Pill: Nền trắng bo cong `34px`, đường lấp đầy Coral Orange `#FF7158` hiển thị tỉ lệ `60/100 XP`.
- **Nửa Dưới (Curved White Card & Task List - `GamifiedTaskList.tsx`)**:
  - Thẻ card nền trắng bo góc uốn cong `36px` đè lên header gradient.
  - Badge tiêu đề uốn cong *"Nhiệm vụ"*.
  - Các nhiệm vụ đã hoàn thành tự động sắp xếp lên đầu danh sách.
  - Đường dẫn góc dưới bên phải: **"Xem danh sách nhiệm vụ ➔"** chuyển sang `viewMode === 'list'`.

### B. Frame 1: Detailed Mission List Screen (`viewMode === 'list'`)
- **Header Top Bar**:
  - Nút Back góc trái (trở về Hub `viewMode === 'hub'`).
  - Tiêu đề màn hình: **"Nhiệm vụ nho nhỏ"** (màu Coral Orange `#FF7158`).
  - Nút đường dẫn góc phải: **"🔥 Chuỗi"** (chuyển sang `viewMode === 'streak'`).
- **Category Filter Tabs (`MissionCategoryTabs.tsx`)**:
  - 3 Chip Filter: `Hằng ngày` (`'daily'`), `Hằng tuần` (`'weekly'`), `Hàng tháng` (`'monthly'`).
  - Khi bấm đổi tab, màn hình giữ nguyên danh sách và lọc các nhiệm vụ tương ứng (KHÔNG tự động chuyển route).
- **Thẻ Gợi Ý Nổi Bật (`FeaturedSuggestCard.tsx`)**:
  - Thẻ gợi ý nền kem `#FFF1E4`, viền `#FFE6CE`, bo góc `28px`.
  - Nhãn tiêu đề phụ: `"Nhiệm vụ hôm nay"` / `"Nhiệm vụ tuần này"` / `"Nhiệm vụ tháng này"`.
  - Icon hộp quà 3D 🎁 bên trái + Tiêu đề nhiệm vụ gợi ý & điểm `+20 XP`.
  - Nút action full-width: `"Hoàn thành"` (`#FF7158`) hoặc `"Đã xong ✓"` (`#6EBD8B`).
- **Phân Mục "Nhiệm vụ thêm"**:
  - Tiêu đề: **"Nhiệm vụ thêm"** màu Coral Orange (`#FF7158`).
  - Danh sách các nhiệm vụ còn lại hiển thị dạng pill card bo mềm với badge `+20 XP ⭐`.

### C. Frame 4: Streak & Calendar View (`viewMode === 'streak'`)
- **Header Bar**: Nút Back (trở về `viewMode === 'list'`) + Tiêu đề **"Chuỗi Hoàn Thành"**.
- **Banner Đếm Chuỗi**: Biểu tượng ngọn lửa 🔥 + **"3 ngày liên tiếp"**.
- **Lịch Tháng (Month Calendar Card)**: Tiêu đề `"Tháng 5, 2026"`, hiển thị lưới 31 ngày với các ngày chuỗi hoàn thành (10, 11, 12, 13) được tô nổi bật.
- **Biểu Đồ Miền (Area Chart - `react-native-svg`)**:
  - Vẽ bằng `<Svg>`, `<Path>`, `<Defs>`, `<LinearGradient>` với đường cong mềm mại (`stroke="#FF7158"`, `strokeWidth={3.5}`) và vùng phủ màu gradient mờ nhẹ (40% opacity -> 2% opacity).
  - Điểm dữ liệu dạng vòng tròn lấp lánh (`<Circle>`) tại các mốc ngày (`9/5`, `10/5`, `11/5`, `12/5`, `13/5`).
  - Tích hợp Chip Filter: `Tuần này` / `Tháng này` để lọc đường cong biểu đồ miền linh hoạt.

---

## 🎁 3. Hiệu Ứng Pop-Up Nhận Thưởng (`RewardModal.tsx`)

- **Center Dialog Modal**: Hiển thị ở chính giữa màn hình (`alignItems: 'center'`, `justifyContent: 'center'`) với nền mờ tối `rgba(20, 10, 8, 0.65)`.
- **KHÔNG sử dụng Bottom Sheet hay hiệu ứng lật nghiêng mascot**: Mascot đứng thẳng 100% cân đối theo đúng trục giữa ngay khi mở modal.
- **Header**: Badge `"PHẦN THƯỞNG ĐẶC BIỆT 🎁"` + Nút đóng `X` ở góc trên bên phải.
- **Sân Đài VICTORY STAGE**:
  - Bệ đài ánh kim `"VICTORY STAGE"` kèm logo ngọn lửa Flamee được đặt nằm ngay bên dưới chân mascot (không bị đè hay che mất chữ).
  - Mascot Dang Cánh Vui Mừng (`emotion_08_tuyet_voi.png`) đứng thẳng cân đối trên sân đài.
  - Các ngôi sao kim tuyến lấp lánh (`✨`, `⭐`, `🌟`, `🎉`) bùng nổ xung quanh.
- **Thông Điệp Chúc Mừng & Nút Action**:
  - Thẻ thông báo nền kem `#FFF1E4`, tiêu đề **"Chúc mừng bạn! 🎉"** và câu thông báo:
    > *"Chúc mừng bạn đã nhận được một mascot, vui lòng liên hệ qua các kênh social để nhận quà nhé!"*
  - Nút **"Nhận quà ngay ✨"** dạng Gradient Coral Orange (`#FF7158` -> `#E0533C`) kèm hiệu ứng rung Haptics thông báo thành công.

---

## ⚡ 4. Tương Tác Juicy UI Transition & Dismissal Nhiệm Vụ

Tương tác loại bỏ nhiệm vụ đã xong được đồng bộ 100% trên toàn bộ tất cả các danh sách nhiệm vụ (Hub `Frame 3`, Card Gợi Ý `Frame 1`, Danh Sách Nhiệm Vụ Thêm `Frame 1`):
1. **Khi bấm nhiệm vụ chưa hoàn thành**: Kích hoạt hiệu ứng nhún Haptic + chuyển trạng thái hoàn thành (`completeMissionById`), cộng điểm XP và tính toán level up.
2. **Khi bấm vào nhiệm vụ đã hoàn thành (`"Đã xong ✓"`)**: Kích hoạt hiệu ứng **Juicy UI Transition**:
   - Thu nhỏ kích thước (`scale` spring về `0.4`).
   - Mờ dần độ đục (`opacity` timing về `0`).
   - Khép dần chiều cao (`height` timing về `0`).
   - Tự động xóa nhiệm vụ khỏi danh sách active qua callback `onDismissTask(id)`.

---

## 📁 5. Cấu Trúc File & Mã Nguồn Đã Thực Hiện

```
flamee-mobile/
├── assets/
│   ├── icons/
│   │   ├── manifest.json                  # Đăng ký icon key 'logo' -> flamee-logo.svg
│   │   └── flamee-logo.svg                # Vector SVG Logo ngọn lửa Flamee
│   └── images/
│       └── mascot/
│           ├── emotion_08_tuyet_voi.png    # Mascot chim dang cánh vui mừng
│           └── emotion_05_rat_vui.png
├── features/
│   └── missions/
│       ├── components/
│       │   ├── MascotExpHeader.tsx        # Top Header (Sunset Gradient, Logo, Mascot, EXP Bar)
│       │   ├── GamifiedTaskList.tsx       # White Curved Card Task List + Juicy UI
│       │   ├── MissionCategoryTabs.tsx    # Filter Tabs (daily, weekly, monthly)
│       │   ├── FeaturedSuggestCard.tsx    # Card Gợi Ý "Nhiệm vụ hôm nay" + Juicy UI
│       │   ├── StreakCalendarView.tsx     # Streak Banner, Lịch & Biểu Đồ Miền (Area Chart)
│       │   └── RewardModal.tsx            # Center Dialog Pop-Up Nhận Thưởng
│       ├── services/
│       │   └── missionService.ts          # Mock data (daily, weekly, monthly) & level-up logic
│       ├── screens/
│       │   └── MissionsScreen.tsx         # Container screen coordinating Hub, List, & Streak
│       ├── index.ts                       # Barrel export
│       └── types.ts                       # Mission, UserProgress, MissionCategory, MissionViewMode
├── scripts/
│   └── generate-icons.mjs                 # Script SVG to React Native Component (đã hỗ trợ fill='#fff')
└── shared/
    └── components/
        └── icons/
            ├── FlameeIcon.tsx             # Main Icon Component (hỗ trợ name='logo')
            ├── iconNames.ts               # Tuple list FLAMEE_ICON_NAMES
            └── generated/
                └── LogoIcon.tsx           # Auto-generated React Native SVG Logo Component
```

---

## 🧪 6. Kết Quả Kiểm Thử (Verification Status)

- ⚡ **TypeScript Typecheck (`npx tsc --noEmit`)**: **0 Error (PASS)**.
- 🧪 **Jest Unit Test Suite**: **PASS (24/24 Test Suites Passed, 90/90 Tests Passed)**.
