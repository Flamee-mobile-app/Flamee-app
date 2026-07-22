# Conversation Summary: Mascot Redesign, Figma MCP Extraction & Rive Animation Upgrade

Tài liệu này tổng hợp và đóng gói toàn bộ ngữ cảnh (Context), các quyết định kiến trúc, quy trình làm việc và chi tiết code đã thay đổi trong phiên làm việc này. File này được lưu để phục vụ việc nạp lại ngữ cảnh (Resume Context) cho các phiên làm việc tiếp theo.

---

## 1. Tổng quan Các Mục tiêu Đã Hoàn thành

1. **Sửa lỗi màu chữ bộ lọc Sổ Kỷ niệm (Memory Book Filter Pills)**:
   - Sửa lỗi đè màu của `AppText.tsx`: Cho phép `style.color` được ưu tiên hơn `color` prop mặc định (`#2B2B2B`).
   - Cập nhật `MemoryBookScreen.tsx`: Thẻ được chọn (*"Tất cả"*) có nền cam Coral, chữ **TRẮNG PURE (`#FFFFFF`)**. Thẻ chưa chọn (*"Chuyến đi"*, *"Đặc biệt"*, *"Yêu thích"*) có viền cam, nền trắng, chữ **CAM CORAL (`#FF7E67`)** đúng 100% hình thiết kế mẫu.

2. **Trích xuất trọn bộ 11 Mascot Stickers từ Figma qua Figma MCP Server**:
   - Sử dụng MCP Tools `get_figma_data` và `download_figma_images` truy vấn file Figma `Ke9lnLL4XvAeYJw0yb0yhb`.
   - Tải đầy đủ 11 Sticker biểu cảm mascot (cả bản PNG chất lượng cao và bản Vector SVG) về thư mục `assets/images/mascot/`:
     - `emotion_11_binh_thuong.png` (Neutral)
     - `emotion_04_hanh_phuc.png` / `emotion_08_tuyet_voi.png` (Happy)
     - `emotion_06_binh_yen.png` (Calm)
     - `emotion_09_buon.png` / `emotion_10_rat_buon.png` (Sad)
     - `emotion_13_met_moi.png` (Tired)
     - `emotion_12_gian_du.png` (Angry)
     - `emotion_07_bat_ngo.png` (Surprised)
     - `mascot_default.png` (Mascot Gốc)

3. **Redesign Giao diện Mascot Companion (Compact Speech Rail)**:
   - Thu nhỏ kích thước Mascot từ 96px xuống **64px** ở góc phải bên dưới màn hình.
   - Nâng vị trí bong bóng thoại **Speech Rail** nổi lên **góc trên đỉnh mascot** (`bottom: MASCOT_VISUAL_SIZE + 8`), không bao giờ bị đè hay đè lên thanh Bottom Navigation bar.
   - Đuôi bong bóng thoại (`tail`) nằm ở góc dưới bên phải bubble chĩa trực tiếp xuống đỉnh đầu mascot.
   - Tích hợp 2 nút điều hướng icon nhỏ (**Mood Check** & **AI Chat**) ngay trên cùng hàng ngang ở cuối Speech Rail.
   - Chiều cao tổng thể thu gọn chỉ còn **64px – 72px**, tiết kiệm diện tích tối đa.

4. **Xây dựng Kiến trúc Rive Animation Controller (`rive.app`)**:
   - Cấu hình [metro.config.js](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/metro.config.js) hỗ trợ nạp định dạng file `.riv`.
   - Tạo Hook [useMascotRiveController.ts](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/mascot/hooks/useMascotRiveController.ts) quản lý Rive State Machine `MascotStateMachine` với 7 giá trị `mood` (0=Neutral, 1=Happy, 2=Calm, 3=Sad, 4=Tired, 5=Angry, 6=Surprised).
   - Tạo Component [MascotRiveArtwork.tsx](file:///d:/FPT/ky7/EXE/project/Flamee-mobile-app/flamee-mobile/features/mascot/components/MascotRiveArtwork.tsx) điều khiển Rive 60 FPS kèm cơ chế **Graceful Fallback** tự động về 11 Sticker Figma PNG/SVG nét mịn.

---

## 2. Chi tiết Danh sách Files Đã Thay đổi / Tạo mới

| Đường dẫn File | Loại thay đổi | Mô tả chi tiết |
| :--- | :--- | :--- |
| `shared/components/ui/AppText.tsx` | MODIFY | Cho phép `style.color` đè màu `color` prop mặc định |
| `features/memory-book/screens/MemoryBookScreen.tsx` | MODIFY | Cập nhật màu chữ filter pills chuẩn màu trắng & màu cam coral |
| `assets/images/mascot/*` | NEW (11 PNGs, 11 SVGs) | Chứa bộ 11 Sticker Mascot biểu cảm xuất từ Figma |
| `features/mascot/components/MascotArtwork.tsx` | MODIFY | Render sticker biểu cảm chính chủ từ Figma theo `MascotMood` |
| `features/mascot/components/MascotArtwork.test.tsx` | MODIFY | Unit test xác minh render MascotArtwork & MascotRiveArtwork |
| `features/mascot/components/MascotVisual.tsx` | MODIFY | Đổi kích thước Mascot 64px & sử dụng MascotRiveArtwork |
| `features/mascot/mascotLayout.ts` | MODIFY | Đặt `MASCOT_VISUAL_SIZE = 64`, `MASCOT_ACTION_HIT_SIZE = 36`, `MASCOT_BOTTOM_GAP = 18` |
| `features/mascot/mascotLayout.test.ts` | MODIFY | Cập nhật unit test kiểm tra thông số layout compact mới |
| `features/mascot/components/MascotActionHalo.tsx` | MODIFY | Redesign Speech Rail góc trên mascot & 2 inline action icons |
| `metro.config.js` | MODIFY | Khai báo mở rộng file `.riv` trong `resolver.assetExts` |
| `features/mascot/hooks/useMascotRiveController.ts` | NEW | Controller quản lý State Machine & Input state của Rive |
| `features/mascot/components/MascotRiveArtwork.tsx` | NEW | Component điều khiển Rive Animation & Fallback Sticker |
| `docs/conversation_summary_mascot_redesign_and_rive_upgrade.md` | NEW | File tổng hợp ngữ cảnh đóng gói toàn bộ phiên làm việc |

---

## 3. Kết quả Kiểm thử & Verification State

- **TypeScript Typecheck**:
  ```bash
  npx tsc --noEmit
  # Result: 0 Errors
  ```
- **Jest Unit Testing**:
  ```bash
  npm test -- --runInBand
  # Result: 22 passed, 22 total Test Suites | 82 passed, 82 total Tests
  ```

---

## 4. Hướng dẫn Nạp lại Ngữ cảnh (Resume Context Instructions)

Nếu ở phiên làm việc tiếp theo người dùng muốn nạp lại dữ liệu, chỉ cần gửi câu lệnh:
> "Nạp file doc `docs/conversation_summary_mascot_redesign_and_rive_upgrade.md` để tiếp tục làm việc."
