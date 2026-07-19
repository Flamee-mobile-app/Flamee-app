# Bottom navigation khớp Figma

**Ngày:** 2026-07-20  
**Nguồn thiết kế:** [Flamee – node 6528:8281](https://www.figma.com/design/Ke9lnLL4XvAeYJw0yb0yhb/Flamee?node-id=6528-8281)

## Mục tiêu

Thay bottom navigation hiện có bằng thanh điều hướng khớp thiết kế Figma: nền gradient vàng-cam rộng toàn màn hình, phần lõm tròn ở chính giữa và logo Flamee nổi phía trên. Giữ Expo Router Stack hiện hữu và chỉ hiển thị thanh này tại năm route chính: `home`, `memories`, `mood`, `missions`, `profile`.

## Hành vi và route

| Thành phần hiển thị | Route | Hành vi |
| --- | --- | --- |
| Trang chủ | `/(main)/home` | Tab tương tác, điều hướng thay thế route hiện tại. |
| Hoạt động | `/(main)/memories` | Tab tương tác; đổi nhãn hiển thị từ “Kỉ niệm” sang nhãn trong Figma. |
| Nhiệm vụ | `/(main)/missions` | Tab tương tác. |
| Hồ sơ | `/(main)/profile` | Tab tương tác; đổi nhãn hiển thị từ “Profile” sang nhãn trong Figma. |
| Logo Flamee ở giữa | Không có | Chỉ là nhận diện thương hiệu; không nhận tương tác và không phải tab. |

`/(main)/mood` vẫn là một route chính: nav tiếp tục hiển thị tại đây, nhưng không có tab nào được chọn. Các route `ai`, `dates`, và `timeline` không render nav.

## Kiến trúc

- `lib/navigation/routes.ts` tách hai tập dữ liệu rõ trách nhiệm:
  - Danh sách năm path cho phép mount bottom navigation.
  - Danh sách bốn tab tương tác theo đúng Figma.
- `isMainNavigationPath()` vẫn là predicate duy nhất mà `app/(main)/_layout.tsx` dùng để quyết định render nav.
- `components/ui/BottomNav.tsx` chỉ nhận route state từ Expo Router, render bốn tab, cùng logo trang trí ở giữa.
- Không đổi Stack router, không thêm route và không chuyển sang Expo Tabs.

## Hình ảnh và style

- Dùng các asset Figma gốc cho nền `Union`, icon tab và logo để bảo toàn hình dạng thiết kế; lưu asset cục bộ trong repository để không phụ thuộc URL Figma hết hạn.
- Kích thước theo Figma baseline: thanh 72px; logo nổi 56px, đặt cao hơn mép trên thanh 28px; logo bên trong 36 × 42px.
- Nền là gradient `#FCB76D` tới `#FF7158`; dùng shadow đen 10% với offset dọc 2px và blur 20px. Glass effect không có API tương đương trong React Native hiện tại nên không thêm dependency mới; nền asset và shadow là biểu đạt trực quan tương ứng.
- Tab icon 32px; caption SF Pro Regular 10px màu trắng. Không đổi màu active để khớp Figma; vẫn công bố `accessibilityState.selected` cho tab thực tế.
- Thanh đáp ứng chiều rộng thiết bị; các vị trí tab được phân bổ theo tỉ lệ từ layout baseline 402px để không cố định cho một kích thước máy.
- Khu vực bottom safe-area được giữ để nội dung không chồng lên vùng gesture của thiết bị.

## Khả năng tiếp cận và tương tác

- Mỗi trong bốn tab có `accessibilityRole="tab"`, nhãn tiếng Việt và trạng thái selected chính xác.
- Logo giữa bị loại khỏi cây tương tác/accessibility vì là phần trang trí.
- Chạm tab sử dụng `router.replace()` để không tích lũy history khi chuyển khu vực chính.

## Kiểm thử và xác nhận

- Viết test trước cho predicate visibility: năm route chính trả về `true`; `ai`, `dates`, `timeline` và `login` trả về `false`.
- Viết test trước cho metadata bốn tab: route `mood` không xuất hiện trong tập tab tương tác, nhưng vẫn thuộc tập path hiển thị nav.
- Chạy focused Jest bằng `jest-expo`, `npx tsc --noEmit` và `npm run lint`.
- Việc chạy toàn bộ `npm test` hiện bị chặn bởi file có sẵn đã xóa `test/setup.ts`; lỗi này nằm ngoài phạm vi redesign và không được khôi phục trong task.

## Ngoài phạm vi

- Không chỉnh các màn hình nội dung, route phụ, hay chuyển đổi router.
- Không bổ sung hành vi nhấn logo, animation mới, glass library, hoặc thay đổi UI không liên quan.
