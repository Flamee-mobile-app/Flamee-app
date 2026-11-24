# Icon ứng dụng — 2026-11-24

Theo ảnh được cung cấp, `flamee-mobile/app.json` dùng `./src/public/logofaviconapp.jpg` cho Expo icon (Android/iOS) và web favicon. Ảnh nguồn JPEG vuông 2560 × 2560, nền coral và biểu tượng Flamee màu kem; không chỉnh sửa ảnh gốc.

Thay đổi chỉ icon launcher/favicon. Các asset splash/logo trong nội dung ứng dụng vẫn theo cấu hình riêng hiện có. Mobile cần build lại binary từ source/config mới và cài bản mới để nhận icon; Fast Refresh/Expo Go không cập nhật icon launcher của APK đã cài. Không dùng native resource từ workspace build cũ nếu chưa đồng bộ icon qua prebuild.

Đã kiểm tra kích thước ảnh và Expo config resolve đúng đường dẫn tồn tại. Chưa build/cài APK mới hoặc kiểm chứng launcher thực tế.
