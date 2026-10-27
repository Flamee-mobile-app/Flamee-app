# Ma trận nghiệm thu E2E Flamee

Kế hoạch: `docs/superpowers/plans/2026-10-26-app-e2e-completion.md`. Contract: `.doc/E2E-API-CONTRACT.md`. Chỉ tick **Đạt E2E** khi có build/môi trường, thao tác trên UI và dữ liệu server kiểm chứng; chưa có ca nào ở bảng này được nghiệm thu trên hai thiết bị trong lượt hiện tại.

## Baseline offline — 2026-10-26, trước sửa logout

| Kiểm tra | Kết quả |
| --- | --- |
| Mobile `npm run typecheck` | Đạt |
| Mobile domain suite | 278 test: 276 đạt, 2 lỗi contract UI |
| Backend pytest, loại live_readonly/live_workflow | 132 đạt, 4 deselected, 10 warning deprecation Starlette HTTP 422 |
| Supabase live/schema/migration | Chưa chạy |
| Android/iOS UI E2E | Chưa chạy |

Hai lỗi baseline phải được xử lý theo thiết kế đã duyệt, không xóa assertion để có bộ test xanh:

- `checkInUiContract.test.ts`: “uses an intrinsic thought bubble, centered avatar and 56px picker row” — assertion gap dương không khớp token đuôi bubble đang overlap âm.
- `profileFeedbackContract.test.ts`: “profile name and username fields use the white outlined surface” — contract yêu cầu outlined trong khi source dùng elevated.

## Ca nghiệm thu

| ID | Kịch bản và kết quả mong đợi | Mốc | Đạt E2E |
| --- | --- | --- | --- |
| A01 | A đăng ký/login, restart khôi phục đúng account; token hết hạn refresh một lần | M1 | Chưa |
| A02 | Logout thu hồi phiên server; token cũ gọi me/refresh bị từ chối, dữ liệu local sạch | M1 | Chưa |
| A03 | Logout mất mạng báo local-only; login B không bị response của A ghi đè | M1 | Chưa |
| A04 | Recovery/provider xác thực thật; lỗi không tạo account/OTP giả | M1 | Chưa |
| I01 | A mời B; B preview/accept; hai máy thấy đúng cặp sau restart | M1 | Chưa |
| I02 | Invite hết hạn/tự mời/đã có cặp/double accept có kết quả đúng, không tạo hai cặp | M1 | Chưa |
| H01 | A đăng chữ/ảnh; B tải feed, lịch, chi tiết và xem ảnh thật | M1 | Chưa |
| H02 | Mất response sau create/upload, retry không tạo bản ghi/file trùng | M1 | Chưa |
| H03 | Sửa/xóa bài/ảnh; B đồng bộ; C không truy cập ảnh ngoài cặp | M1 | Chưa |
| C01 | Check-in UI hiện tại lưu note ≤60 ký tự và nhiều lý do, restart đọc lại đúng | M2 | Chưa |
| C02 | Full/mood_only/private_only lọc đúng response, AI, fallback, notification và log | M2 | Chưa |
| C03 | Qua nửa đêm/DST, hai múi giờ, nhiều lần/ngày hiển thị đúng lịch sử/latest | M2 | Chưa |
| N01 | A check-in → B nhận Nudge đúng người; snooze/dismiss/rate lưu thật | M2 | Chưa |
| N02 | AI lỗi/timeout/JSON sai dùng fallback; khủng hoảng dùng nội dung hỗ trợ được duyệt | M2 | Chưa |
| T01 | B sửa draft Nudge → gửi text/signal/photo/voice ≤30s → A nhận/phản hồi | M2 | Chưa |
| T02 | Mic/ảnh denied, upload gián đoạn, response mất, app restart đều không báo gửi giả | M2 | Chưa |
| S01 | Foreground/reconnect cập nhật ≤5 giây trên mạng nghiệm thu; event trùng không nhân đôi | M3 | Chưa |
| P01 | Push foreground/background/app đóng; tap đúng entity, quiet hours/privacy đúng | M3 | Chưa |
| O01 | Check-in offline mã hóa → restart → online chỉ đồng bộ một lần, đúng account | M3 | Chưa |
| L01 | Unpair/delete hai bước thu hồi quyền cả hai máy ngay, export/purge theo retention | M3 | Chưa |
| M01 | 4 mission/ngày đúng owner; shared chỉ thưởng khi cả hai xong; không đánh dấu thay | M4 | Chưa |
| M02 | Completion/swap đồng thời, chuyển ngày/tuần/tháng không thưởng trùng hoặc mất điểm | M4 | Chưa |
| R01 | Đổi quà đồng thời kiểm ví/tồn kho nguyên tử; retry trả cùng mã, số dư không âm | M4 | Chưa |
| R02 | Mất response sau commit → restart lấy lại mã → fanpage đối soát → giao một lần | M4 | Chưa |
| X01 | Full regression Android/iOS, accessibility, denied permissions, slow network, scope isolation | M5 | Chưa |

## Bằng chứng cần lưu cho mỗi ca

Build app/backend/schema, nền tảng/thiết bị, tài khoản test đã ẩn danh, thời điểm và bước thao tác, expected/actual, request/event ID để tra server, ảnh/video đã làm sạch dữ liệu. Không lưu mật khẩu, JWT, API key, private note hoặc signed media URL vào artifact công khai.

## Trạng thái triển khai local

Lượt bổ sung lịch sử/đối tác và Home polling ngày 2026-10-27: đã bỏ preview khỏi lịch tuần/tháng runtime, thêm API pagination, privacy theo cặp, private flag ưu tiên giữ riêng tư, polling foreground. Mobile 310/312 với hai lỗi baseline; backend 138 passed/5 deselected trước private-flag fix, sau fix bộ mood/privacy/AI boundary 13 passed. C01/C03/S01 vẫn Chưa vì chưa gửi đầy đủ check-in, kiểm timezone preference hoặc nghiệm thu hai máy. Xem `docs/progress/2026-10-27-app-e2e-status/IMPLEMENTATION.md`.

Ngày 2026-10-27: đã nối mobile sửa title/description, xóa bài và xóa ảnh trên chi tiết Home; có xác nhận, khóa thao tác lặp và guard scope. Typecheck đạt; bộ memory mobile 34/34, backend memory 28/28 đạt. Full mobile checkpoint 301/303 với hai lỗi baseline; hai test scope bổ sung sau đó đạt riêng. Chưa có bằng chứng UI hai thiết bị, mất response sau commit hay realtime nên **H03 vẫn Chưa**. Chi tiết trong E2E-EXECUTION-LOG.

Logout API/service đã có 10 test mới theo RED→GREEN; bộ auth/session/localSignOut liên quan 40/40 đạt. Đây là kiểm tra boundary/runtime local, chưa tick A02/A03 E2E thật. Mốc M0/M1 chưa hoàn tất vì còn contract, môi trường và kiểm chứng thiết bị.

- Bổ sung gỡ avatar API/service/UI và 4 test xác nhận null/owner/stale read.
- Bổ sung đổi mật khẩu API/service/UI và validation form. Có 5 test session/mật khẩu, 1 test schema, 2 test backend về lỗi current password; đều đã chạy RED→GREEN.
- Backend regression sau cập nhật: 134 passed, 4 deselected, 10 warning deprecation có từ baseline. Chưa chạy live schema/migration hoặc workflow ghi dịch vụ thật.
- Test điều hướng đã cập nhật danh sách route cho section password, đồng thời vẫn kiểm privacy/terms không được mở thành page.

## Bằng chứng development API thật

Người dùng đã chọn development và cho phép bài `backend/tests/test_live_account_workflow.py`. Run đạt: `account-f2e2a9e327b2`, 22 bước API/30.53s. Đã kiểm tra đăng ký hai account, profile/avatar, invite preview/accept, hai bên đọc cùng cặp, sai mật khẩu hiện tại giữ phiên, đổi mật khẩu thu hồi access/refresh, đăng nhập lại và logout thu hồi access/refresh, phiên đối tác còn hợp lệ.

Hai test read-only schema/RPC và private bucket cũng đạt. Đây là bằng chứng server/database/storage thật cho các bước API tương ứng A01/A02/I01; **chưa tick cột UI E2E** vì chưa thao tác app trên hai thiết bị và chưa kiểm tất cả nhánh lỗi.

Lần chạy đầu dừng do harness mong 200 cho API tạo invite trả đúng 201; các bước profile/avatar trước đó đã chạy thật. Hai lượt giữ lại tổng 4 account test/1 cặp; metadata ở E2E-EXECUTION-LOG. Không tự dọn dữ liệu.

Theo quyết định người dùng, quên/reset mật khẩu bỏ khỏi release scope; OAuth/OTP chuyển đợt kế tiếp. A04 được hoãn/loại theo các quyết định này, không làm giả flow để tick đạt.

Checkpoint local cuối đợt tài khoản: typecheck đạt, mobile 299 test/297 đạt với đúng hai lỗi UI baseline đã nêu; bộ auth/session/schema 51/51 đạt. API smoke thật đã đạt nhưng app trên hai thiết bị chưa được nghiệm thu.
