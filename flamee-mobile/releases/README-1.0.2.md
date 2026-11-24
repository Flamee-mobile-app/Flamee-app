# Flamee 1.0.2 — APK ngày 2026-11-24

File bàn giao: `flamee-1.0.2-universal.apk` (134,335,929 byte, khoảng 128,1 MiB).

SHA-256: `977d3df66a23156edb099e43c766060545d8ecc2d3a3ea6a4c29815fd89bbd21`.

## Cài đặt và tương thích

APK độc lập, không cần Expo Go/Metro. Android tối thiểu 7.0/API24; target API36; package `com.flamee.mobile`, versionCode `20261124`. Bao gồm ARM32 (`armeabi-v7a`), ARM64 (`arm64-v8a`), x86 và x86_64. Không cam kết chạy trên mọi ROM hoặc giả lập.

Khóa ký 1.0.1 không còn tại đường dẫn cũ. Người dùng đã cho phép tạo khóa mới: để cài đè bản ký bằng khóa khác, Android sẽ từ chối. Cần tự gỡ bản Flamee cũ trước khi cài 1.0.2; gỡ app làm mất phiên và dữ liệu cục bộ trên thiết bị. Dữ liệu tài khoản trên server không bị xóa bởi thao tác gỡ app.

Khóa mới và credential được giữ ngoài repository:

- `C:\Users\Huy\.flamee\signing\flamee-release-20261124.p12`
- `C:\Users\Huy\.flamee\signing\flamee-release-20261124-credentials.json`

Chủ dự án cần sao lưu an toàn hai file này để tiếp tục cập nhật ứng dụng bằng cùng khóa. Không gửi khóa/credential cho người cài APK. Certificate SHA256: `53b16fddfbae2f93cc95fa735ec7460fa2253283c6a6a75cfd47b8dff6faa148`.

## Bằng chứng kiểm tra

- Snapshot gồm 529 file source/asset khớp code hiện tại; app config tăng version 1.0.2/20261124, giữ icon mới. Ba tài liệu bắt buộc README/CODING-STANDARDS/CODEBASE-BASELINE trong `.doc` vẫn thiếu ở checkout này.
- Typecheck đạt. Gradle `:app:assembleRelease` thành công, 603 task, nhúng JavaScript và 69 asset. Không sửa dependency/node_modules hoặc tắt New Architecture.
- Chữ ký APK V2 hợp lệ, zipalign 16KB đạt. Kiểm tra 54 thư viện ELF64 LOAD/RELRO không có lỗi alignment. Chưa nghiệm thu thực tế trên hệ thống 16KB.
- Cài trực tiếp và cold start thành công trên AVD Android15/x86_64 sạch `Flamee_Release_QA_20261124`, hiển thị màn đăng nhập; crash buffer không có native crash của app ở lượt kiểm tra. Không đăng nhập/tạo dữ liệu thử trong lượt nghiệm thu bản này.
- Chưa kiểm tra điện thoại ARM thật, Android7, giả lập của người dùng từng báo lỗi hoặc full regression các chức năng.
- Backend hiện vẫn là `http://13.239.139.82:8000/api/v1`, usesCleartextTraffic giữ theo môi trường hiện tại. APK này chưa được xuất bản Play Store hoặc tạo link download công khai.

## Dọn build cũ

Đã thống kê và được người dùng duyệt xóa:

- `D:\flamee-release-20261121`: khoảng 2,51 GiB, có junction node_modules tới dependency dùng chung.
- `D:\fr21cxx`: khoảng 1,31 GiB cache native.

Lệnh xóa đã bị hệ thống thực thi từ chối với `blocked by policy`; không có file nào bị xóa bởi lệnh này. Người dùng có thể dọn thủ công đúng hai thư mục sau khi đã giữ APK mới. Không xóa thư mục dependency nguồn, SDK, source hoặc khóa ký mới.

Build mới vẫn ở `D:\flamee-release-20261124`; staging native app ở `D:\fr24cxx`. Khóa ký và file bàn giao không nằm trong hai thư mục cũ đã duyệt xóa. Script short-native-paths trong build workspace xử lý giới hạn đường dẫn Windows/Ninja; các thư viện dùng staging fr21cxx có thể được tái tạo khi build sau.
