# Khởi động — mockup v1

Theo phong cách Tiny Mission đã duyệt. Mỗi ảnh là một màn hoặc trạng thái độc lập; đây là mockup thiết kế, không phải screenshot app hoặc bằng chứng API.

- [Khởi động](01-splash.png) — implemented

Prompt chung và prompt từng màn: [APP-MOCKUPS-PROMPTS.json](../../APP-MOCKUPS-PROMPTS.json). Quy chuẩn xuyên suốt: [APP-MOCKUPS-DESIGN.md](../../APP-MOCKUPS-DESIGN.md).

## Hành vi khởi động (2026-11-15)

Thiết kế đang áp dụng giữ bố cục [mockup loader v4](../../../flamee-splash-loader-mockup-v4.png) và đổi màu nền theo [mockup v2](../../../flamee-splash-loader-mockup-v2.png) mới nhất: vùng sáng vàng kem ở giữa, chuyển qua đào nhạt và kem ấm ở rìa, giảm sắc hồng. Logo lớn xếp dọc với wordmark, slogan, ba chấm và thanh tải gradient. Không đưa thanh home indicator trong mockup vào UI; đây là thành phần của hệ điều hành. Thay thế nền kem trơn và animation cũ.

**Đang bật chế độ xem thử theo yêu cầu:** `PREVIEW_STARTUP_SPLASH = true` trong `StartupProvider.tsx` phát splash mỗi lần khởi động runtime mới, kể cả khi còn session hoặc đã xem. Reload đầy đủ hoặc tắt hẳn rồi mở app để xem lại; chuyển màn hay đưa app từ nền lên không phát lại. Chế độ này không ghi cờ đã xem. Sau khi người dùng duyệt hiệu ứng, đổi cờ về `false` để áp dụng hành vi bên dưới.

- Splash giới thiệu chỉ phát một lần trên bản cài, khi chưa có session được khôi phục. Chờ kết quả khôi phục session trước khi quyết định phát để tránh lóe animation cho người còn đăng nhập.
- `BrandSplash` hiện thương hiệu bằng fade 0,24 giây, giữ phần giới thiệu tối thiểu 1 giây; thanh tải hoàn tất trong 0,22 giây trước fade chuyển màn 0,2 giây. Không vẽ tim, morph hay bay logo. Ba chấm nhịp nhẹ để báo app đang xử lý, dừng khi chuyển màn. Giảm chuyển động sẽ bỏ fade/nhịp chấm và vẫn giữ thương hiệu tĩnh trong 1 giây.
- Thanh tải biểu diễn các mốc công việc, không phải phần trăm byte/API: layout + asset sẵn sàng (30%), session đã khôi phục (70%), màn đích đã mount (90%), đủ điều kiện bàn giao (100%). Không tự tăng theo timer khi session hoặc điều hướng đang chờ. Thanh vẫn tiếp tục khi công việc thật hoàn tất; không trì hoãn thêm để chạy animation dài.
- Loader chờ route gốc xác định và chuyển đến màn đích, bao gồm truy vấn onboarding khi cần. Lỗi session/onboarding sẽ đóng splash để lộ giao diện phục hồi có nút thử lại; timeout tổng vẫn dùng cơ chế ErrorBoundary hiện có. Loader không che một lỗi bằng thông báo thành công.
- Ghi nhớ đã xem sau khi splash kết thúc hoặc khi bỏ qua vì có session. Mở lại app, điều hướng, đưa app từ nền lên và đăng xuất không phát lại splash giới thiệu.
- Native lưu cờ UI trong SQLite riêng `flamee-startup-preferences.db`; web dùng localStorage. Cờ không chứa thông tin tài khoản và không bị xóa cùng credential đăng nhập. Nếu không đọc được cờ thì cho phép hiển thị lần đầu; nếu không ghi được thì vẫn cho vào app, lần mở sau có thể hiện lại.
- Splash native bắt buộc của hệ điều hành vẫn có thể hiện ngắn trong lúc app khởi tạo; điều kiện trên áp dụng cho splash animation của Flamee. Không thêm thời gian chờ có chủ ý khi còn session.

## Xem ảnh

Tinh chỉnh theo phản hồi: vùng sáng kem thu gọn quanh logo (tâm 50%/44%, bán kính 42%/24%). Lớp cam đào cũng thu về cùng tâm, bán kính 48%/30%, bắt đầu tan từ mốc 15% ra nền kem để không phủ gần hết màn hình.

### Khởi động

![Khởi động](01-splash.png)

