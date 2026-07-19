# Lưới tab Bottom Navigation khớp Figma

**Ngày:** 2026-07-20  
**Nguồn thiết kế:** [Flamee – node 6528:8281](https://www.figma.com/design/Ke9lnLL4XvAeYJw0yb0yhb/Flamee?node-id=6528-8281)

## Mục tiêu

Sửa vị trí và vùng bấm của bốn tab Bottom Navigation đang lệch trên thiết bị, trong khi giữ nguyên nền notch và logo SVG đã đúng. Bố trí phải tái tạo trực tiếp baseline 402px của node Figma thay vì phụ thuộc vào phần trăm CSS-like trong React Native.

## Mapping và hành vi

| Tab Figma | Toạ độ baseline | Route |
| --- | --- | --- |
| Trang chủ | x 23, y 15, rộng 57 | `/(main)/home` |
| Hoạt động | x 100, y 15, rộng 60 | `/(main)/memories` |
| Nhiệm vụ | x 242, y 12, rộng 55 | `/(main)/missions` |
| Hồ sơ | x 321, y 12, rộng 34 | `/(main)/profile` |

Logo Flamee giữa vẫn chỉ trang trí. Route `mood` vẫn hiện BottomNav nhưng không có tab Figma tương ứng; các route `ai`, `dates`, `timeline` vẫn ẩn BottomNav.

## Thiết kế kỹ thuật

- `BottomNav` đo chiều rộng thanh bằng `onLayout`, rồi tính `x` và width của từng tab bằng `barWidth / 402`. Mỗi style nhận số pixel React Native, không nhận giá trị `%`.
- Toạ độ dọc, icon 32px, caption 10px, notch và logo không đổi so với node Figma.
- Giữ tab wrapper riêng cho icon và caption, đồng thời mở rộng vùng chạm bằng `hitSlop` mà không thay đổi hình ảnh.
- `BOTTOM_NAV_ITEMS` tiếp tục là nguồn mapping duy nhất. Không đổi Stack router hay thêm route mới.

## Kiểm thử

- Viết test đỏ xác nhận bốn label điều hướng đến chính xác các `ROUTES` tương ứng.
- Viết test cho helper layout: tại width 402 nó trả đúng toạ độ Figma; tại width khác, x và width scale tuyến tính.
- Giữ test bốn tab, logo trang trí và SVG renderer hiện có; chạy focused Jest, TypeScript và lint.

## Ngoài phạm vi

- Không thay đổi nền, notch, logo, SVG glyph, nhãn, màu sắc hoặc các màn hình route.
