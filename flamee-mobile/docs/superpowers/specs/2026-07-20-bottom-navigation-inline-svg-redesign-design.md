# Bottom navigation Figma bằng SVG inline

**Ngày:** 2026-07-20  
**Nguồn thiết kế:** [Flamee – node 6528:8281](https://www.figma.com/design/Ke9lnLL4XvAeYJw0yb0yhb/Flamee?node-id=6528-8281)

## Mục tiêu

Thay cách render bottom navigation dựa trên `expo-image` và các asset trong `assets/navigation` bằng các phần tử `react-native-svg` được khai báo trực tiếp trong mã. Kết quả phải dùng đúng hình nền notch, icon tab và logo SVG anh yêu đã cung cấp, đồng thời sửa lỗi thanh navigation bị thu nhỏ, lệch lên trên và mất notch ở ảnh hiện tại.

## Phạm vi và hành vi giữ nguyên

- Thanh vẫn chỉ xuất hiện ở `home`, `memories`, `mood`, `missions` và `profile`.
- Bốn tab tương tác vẫn là Trang chủ, Hoạt động, Nhiệm vụ và Hồ sơ; logo Flamee ở giữa không phải tab, không route và không nhận thao tác.
- Giữ Expo Router Stack, `router.replace()`, metadata route và accessibility hiện tại.
- Không dùng `expo-image`, file ảnh cục bộ hoặc asset SVG cục bộ để render BottomNav.

## Thiết kế và cách render

- `BottomNav` có chiều cao thiết kế 72px và đặt sát đáy viewport, không cộng bottom safe-area vào container. Điều này khớp node Figma và loại bỏ khoảng trống dưới thanh trong ảnh lỗi.
- Một `Svg` nền phủ toàn bộ thanh dùng đúng `Path` Union Figma, `viewBox="20 18 402 72"` để thể hiện phần crop được Figma áp dụng cho source 442 × 112. Gradient SVG dùng `#FCB76D` đến `#FF7158`; shadow RN giữ offset `(0, 2)`, opacity `0.1`, radius `20`.
- Bốn icon được render bằng `Path` SVG nguyên bản Figma trong khung 32px; các toạ độ tab giữ chuẩn baseline 402px: Home `(23,15)`, Memories `(100,15)`, Missions `(242,12)`, Profile `(321,12)`. Chúng được nội suy theo chiều rộng màn hình, không dùng các phần trăm inset dễ lệch theo asset intrinsic size.
- Badge logo là `Svg` 56 × 56 với gradient chéo Figma. Bên trong dùng SVG anh yêu gửi (36 × 42), nhúng trực tiếp trong component thay vì tạo file asset. SVG này có phần `data:image/png;base64` bên trong do chính Figma export; vì vậy không có request hay file hình bên ngoài, nhưng glyph Flamee vẫn là raster nguyên bản Figma để khớp thiết kế tuyệt đối.
- Caption giữ SF Pro Regular 10px màu trắng và vị trí đúng theo Figma. Không thêm animation hay active-color mới.

## Kiến trúc mã

- `components/ui/BottomNav.tsx` là file duy nhất đổi production code: bỏ `expo-image`, `expo-linear-gradient` và safe-area hook; thêm `react-native-svg` cho nền, icons và badge logo.
- Có các component nội bộ nhỏ: `BottomNavBackground`, `BottomNavIcon`, `FlameeLogoBadge`. Không xuất API mới ra ngoài.
- `components/ui/BottomNav.test.tsx` cập nhật mock không còn `expo-image`/gradient và bổ sung các assertion cấu trúc để ngăn tái dùng image asset hoặc safe-area padding.

## Kiểm thử và xác nhận

- Viết trước test component kiểm tra bốn tab, click route và xác nhận không render `ExpoImage`/`LinearGradient` legacy.
- Chạy focused Jest, `npx tsc --noEmit`, `npm run lint`.
- Chạy `npm test` chỉ để ghi nhận lỗi baseline đã có: `test/setup.ts` bị thiếu; không tạo lại file này.
- Có thể không xác nhận trực quan qua browser do browser backend không khả dụng trong môi trường; đối chiếu geometry trực tiếp với design context node `6528:8281`.

## Ngoài phạm vi

- Không thay đổi màn hình, router, route metadata, hay các asset cũ ngoài phần render của BottomNav.
- Không cố gắng vector hoá lại glyph logo từ PNG embedded của SVG Figma vì điều đó sẽ làm lệch hình gốc.
