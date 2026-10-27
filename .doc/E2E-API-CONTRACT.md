# Ma trận API cho kế hoạch hoàn thiện E2E

Rà source local ngày 2026-10-26. Tài liệu này phân biệt endpoint đã tồn tại, API client đã có và chức năng đã được nghiệm thu. Không có thao tác ghi Supabase hoặc gọi AI thật trong lần rà.

## Quyết định sản phẩm đã xác nhận

- Người dùng duyệt `docs/superpowers/plans/2026-10-26-app-e2e-completion.md`.
- Người dùng chọn giữ check-in theo UI hiện tại: note tối đa **60 ký tự**, cho chọn **nhiều lý do**, không áp dụng giới hạn 3 lý do của tài liệu lịch sử.
- Người dùng chốt bản E2E đầu tiên dùng **email/mật khẩu**; Google/Apple/OTP chuyển sang đợt kế tiếp, không chặn nghiệm thu bản này.
- Quên/reset mật khẩu được người dùng loại khỏi phạm vi luôn; entry không hoạt động đã được gỡ khỏi login. Endpoint legacy còn trả 501 để không báo thành công giả.
- Nghiệm thu dùng môi trường development hiện có; live write chỉ chạy bài account workflow đã được cho phép cụ thể.
- UI/kiểu lịch và các control chung đã duyệt được giữ; FAB chỉ hiệu ứng tương tác.
- Quy tắc ngày chung/điểm/lượt đổi/quà/fanpage Tiny Mission chưa có quyết định bổ sung; giá trị preview không là contract production.

## Endpoint đang tồn tại và khoảng cách tích hợp

Đường dẫn dưới đây có tiền tố `/api/v1`. Backend dùng envelope `success/data` khi thành công; mobile parse schema và từ chối response không hợp lệ. Mã lỗi HTTP/body phải được giữ khi mở rộng client, không biến lỗi thành dữ liệu rỗng.

| Nhóm | Backend hiện có | Mobile/điều cần làm |
| --- | --- | --- |
| Auth | POST `/auth/register`, `/auth/login`, `/auth/refresh`; GET `/auth/me` | Đã có client và session coordinator; xác minh trên hai tài khoản/thiết bị vẫn cần môi trường test |
| Logout | POST `/auth/logout` → `{logged_out:true}` | Đã bổ sung client/service thu hồi đúng phiên; local access bị xóa ngay; server không xác nhận thì trả `localOnly` và UI báo rõ |
| Profile | PUT `/auth/me`; POST/DELETE `/auth/me/avatar` | UI text/avatar upload đã có; đã bổ sung removeAvatar API/service và xác nhận gỡ trong UI. Cần nghiệm thu thiết bị thật; preferences còn thiếu |
| Password | POST `/auth/change-password`; POST `/auth/forgot-password`, `/auth/reset-password` | Đã nối API/service/UI đổi mật khẩu; ack xong đóng phiên local và đăng nhập lại. Sai mật khẩu hiện tại trả 400/current_password_invalid thay vì 401. Forgot/reset vẫn **501**, chưa có kênh xác minh thật |
| OAuth/OTP | Không có luồng mobile/provider đã tích hợp | Người dùng đã chuyển sang đợt kế tiếp. Không dùng email/password để giả OAuth hoặc OTP |
| Invite | POST/GET/DELETE `/couple/invite-code`; POST `/couple/validate-invite`, `/couple/accept-invite`; GET `/couple` | Client đã có; server chủ sở hữu từ bearer, code 6 ký tự, kiểm tra lỗi/atomic accept. Deferred link sau cài đặt/quà lời mời chưa khép kín |
| Couple lifecycle | PUT `/couple/anniversary`, DELETE `/couple` | Chưa nối đầy đủ UI; cần kiểm retention/export/purge/thu hồi quyền trước nghiệm thu unpair |
| Memories | GET/POST `/memories`; GET/PUT/DELETE `/memories/{id}`; POST `/memories/{id}/images`; DELETE ảnh theo router hiện có | List/detail/create/upload đã có; các thao tác sửa/xóa chưa nối client. Create/upload đang dùng Idempotency-Key |
| Mood | POST/GET `/moods`; GET `/moods/partner/latest`; POST `/moods/alerts/{id}/read`; DELETE `/moods/{id}` | Chưa có mood API client. Backend note 140/reasons 3 khác quyết định mới; backend chỉ cho một số mood enum, không đủ GIF catalog/custom feeling hiện tại |
| Smart Nudge | GET `/nudges/active`; POST `/nudges/{id}/action`, `/nudges/{id}/rate` | Backend có pipeline; UI chưa nối. State action completed/snoozed/dismissed, rating thumbs_up/down; ownership và privacy phải kiểm trước AI/template fallback |
| Tiny Moments | POST/GET `/tiny-moments` | Payload hiện `moment_type`, `content`, `nudge_id`; chưa đủ private media reference, detail/reaction/reply/read/delete/pagination/idempotency cho luồng mới |
| Push/realtime | POST `/users/me/device-token`; WebSocket `/ws` | Có backend và native adapter rời; chưa có luồng settings/token/provider/tap và query invalidation hoàn chỉnh |
| Tiny Mission | Chưa có router mission/wallet/redemption | Thiết kế API trong plan là **đề xuất**, chưa phải endpoint có thể gọi |
| Preferences/export/delete | Chưa đủ endpoint/worker cho toàn bộ scope | Thiết kế cùng lifecycle ở Task 9; không gửi trường chưa hỗ trợ vào profile DTO cũ |

## Ràng buộc không được map mất dữ liệu

1. Mobile canonical privacy là `full / mood_only / private_only`, backend mood hiện là `all / mood_only / private`. Phải có DTO adapter và test từng nhánh; không đổi giá trị tùy tiện ở UI.
2. Check-in draft có các feeling GIF như `discouraged`, `energetic`, `unbothered`, `broken_down`, `awful`, có custom feeling, sleepHours và attachment. Backend hiện thiếu một phần trường/enum. Không tự đổi `awful` thành `sad` rồi bỏ danh tính cảm xúc gốc để API nhận được.
3. Note 60 ký tự và nhiều lý do là quyết định đã xác nhận; ghi rõ cách đếm Unicode/trim và danh mục lý do trong contract tích hợp. Chưa bật gửi API khi còn mismatch.
4. Một activity/media không mặc nhiên là cùng entity: Home dùng memories, Tiny Moment có entity riêng. Không gửi media URI local hoặc URL không được kiểm quyền vào trường content để giả upload.
5. Mood API hiện yêu cầu đã có couple, trong khi spec có check-in lúc chờ ghép đôi. Cần giải quyết quyền sở hữu check-in cá nhân/khả năng ghép sau trước khi đánh dấu waiting mode hoàn tất.
6. Nudge quota/ngày cá nhân, ngày chung Tiny Mission và ngày local hiển thị là ba khái niệm khác nhau; chỉ server quyết định kỳ nghiệp vụ đã chốt.

## Logout: kết quả và vòng đời phiên

`AuthApi.logout(token): Promise<void>` chỉ xác nhận khi response hợp lệ có `logged_out:true`. `AuthService.signOut()` trả `{kind:'revoked'|'localOnly'|'noSession'}` sau khi xóa quyền truy cập local ngay lập tức.

- Token hết hạn: dùng refresh của **phiên vừa kết thúc** để thu hồi, không publish hoặc persist token mới.
- Logout A trả về muộn sau login B: không xóa B hoặc dùng token B gọi logout A. UI không phát thông báo logout cũ khi đã có account mới.
- Login/refresh phát hành credential sau khi bị hủy: thử thu hồi đúng access token vừa được phát hành rồi trả cancelled; không khôi phục local identity. Mất mạng vẫn có thể khiến server chưa thu hồi được; không tuyên bố đã thu hồi mọi phiên.
- Lỗi xóa secure storage vẫn tới caller dưới dạng AuthError storage. Đây không phải chức năng logout-all-devices.
- Test transport doubles chỉ nằm trong test, không được đưa vào runtime.

## Kết quả development và điều kiện còn thiếu

- Development đã được chọn. Hai test read-only về schema/RPC và private bucket đạt; không chạy migration.
- Account workflow ghi dữ liệu đã được cho phép và đạt 22 bước API thật: đăng ký, hồ sơ/avatar, invite/accept, đổi mật khẩu, logout và thu hồi token. Chi tiết run ID/data giữ lại ở E2E-EXECUTION-LOG.
- Android: ban đầu có `emulator-5554`, nhưng lần kiểm tra tiếp theo adb không còn thiết bị. Chưa chạy UI E2E trên emulator trong lượt này.
- Chưa thấy Maestro trong PATH và chưa thấy thư mục native Android/iOS trong mobile checkout. Chưa chọn/cài runner hoặc tạo development build.
- Chưa có bằng chứng hai thiết bị và iOS chạy đúng phiên/schema hiện tại; health hoặc pytest FakeSupabase không thay thế bằng chứng này.
- Không bật `FLAMEE_TEST_LIVE_WORKFLOW` hoặc chạy migration tự động. Test tổng hợp cũ có thể gọi Gemini có phí. Test account riêng dùng `FLAMEE_TEST_LIVE_ACCOUNT`, chỉ thực thi khi được cho phép và không gọi AI.
