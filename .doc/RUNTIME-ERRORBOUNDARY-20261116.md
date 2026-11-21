# Lỗi ErrorBoundary sau import native module — 2026-11-16

Log Android ghi lỗi `Cannot find native module 'ExpoCrypto'`, `ExpoSQLite` trước cảnh báo các route thiếu default export và `Cannot read property 'ErrorBoundary' of undefined` trong ContextNavigator. Source root layout có cả default component và ErrorBoundary hợp lệ. Không sửa useMemo/export để che lỗi.

Expo Go đã cài58.0.5, package Expo SDK58; expo-crypto58.0.7 và expo-modules-core58.0.26 khớp bundledNativeModules/dependency Expo trong checkout. Log có hai JS runtime cùng AppContext/JSI và cảnh báo `Expo Modules v2 was already installed`. Suy luận từ log: lỗi đăng ký native module trong phiên runtime trùng, không có bằng chứng route source thiếu export.

Kiểm tra: dừng hẳn `host.exp.exponent` bằng `adb shell am force-stop host.exp.exponent` rồi mở lại một phiên tới Metro hiện có bằng deep link `exp://127.0.0.1:8081` (đã có adb reverse). Sau khởi động lại, emulator vào màn đăng nhập Flamee; log lọc mới không còn ExpoCrypto/ExpoSQLite/ErrorBoundary. Không xóa dữ liệu app, sửa dependency/node_modules hoặc tắt warning. Session trước không remembered nên mở lại về đăng nhập, không tự tạo account/đăng nhập giả để QA.

Bằng chứng log cũ `.local-tools/runtime-error.log`, trạng thái sau restart `.local-tools/runtime-check.xml`. Chưa xác minh trên thiết bị khác; nếu tái diễn cần xem lỗi native đầu tiên trong log thay vì chỉ stack useMemo phía sau.

Lần tái diễn 22:28 ngày 16/11: log của Expo Go lại có `Expo Modules v2 was already installed`, sau đó thiếu cả `ExpoCrypto` và `ExpoSQLite`; `ErrorBoundary` xuất hiện sau hai lỗi native. Đã force-stop Expo Go và mở lại Metro đang chạy qua `exp://127.0.0.1:8081`, không xóa dữ liệu. Process mới khởi tạo AppContext/JSI một lần, không ghi lại ba lỗi trên trong log kiểm tra và hiện màn đăng nhập. Đây là biện pháp khôi phục phiên, chưa xác định nguyên nhân gốc khiến runtime đôi tái diễn; cần thu thập trình tự mở/reload khi lặp lại và xác minh trên native build độc lập.
