# Bottom Navigation Figma với lớp hiển thị và lớp bấm tách biệt

**Ngày:** 2026-07-20  
**Nguồn thiết kế:** [Flamee – node 6528:8281](https://www.figma.com/design/Ke9lnLL4XvAeYJw0yb0yhb/Flamee?node-id=6528-8281)

## Mục tiêu

Đảm bảo bốn icon và caption Bottom Navigation luôn hiển thị đúng bố cục Figma, đồng thời mỗi vị trí có vùng bấm điều hướng đúng route. Lỗi tab bị chảy thành cột ở cạnh trái phải được loại bỏ hoàn toàn.

## Kiến trúc hiển thị

- Lớp nền notch là SVG hiện có, ở z-index 0.
- Lớp hiển thị chứa bốn `View` tuyệt đối, mỗi view giữ một icon 32px và caption trắng 10px ở đúng layout Figma đã được tính theo chiều rộng thanh. Các view này chỉ hiển thị (`pointerEvents="none"`).
- Lớp tương tác chứa bốn `Pressable` trong suốt, tuyệt đối và đồng toạ độ với từng view hiển thị. Chúng không có children, không tự dàn icon hoặc text; mỗi nút dùng `router.replace()` đúng route.
- Badge logo Flamee giữ ở z-index cao nhất, trang trí và không nhận tương tác.

## Bố cục và route

| Thành phần | Vị trí Figma baseline 402px | Route |
| --- | --- | --- |
| Trang chủ | x 23, y 15, rộng 57 | `/(main)/home` |
| Hoạt động | x 100, y 15, rộng 60 | `/(main)/memories` |
| Nhiệm vụ | x 242, y 12, rộng 55 | `/(main)/missions` |
| Hồ sơ | x 321, y 12, rộng 34 | `/(main)/profile` |

Mỗi x và width được helper hiện có scale sang pixel theo width đo được của thanh. `mood` vẫn không có tab, còn `ai`, `dates`, `timeline` vẫn không render BottomNav.

## Kiểm thử

- Test đỏ xác nhận có đủ bốn visual tab với style toạ độ số Figma và bốn nút bấm tương ứng.
- Giữ matrix test điều hướng bốn route và test layout helper.
- Chạy focused Jest, TypeScript và lint; ghi nhận giới hạn full suite hiện tại do `test/setup.ts` thiếu sẵn.

## Ngoài phạm vi

- Không đổi SVG nền, icon, logo, màu, caption, Stack router hay thêm chức năng mới.
