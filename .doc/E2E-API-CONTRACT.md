# Ma trận API cho kế hoạch hoàn thiện E2E

Rà source local ngày 2026-10-26. Tài liệu này phân biệt endpoint đã tồn tại, API client đã có và chức năng đã được nghiệm thu. Không có thao tác ghi Supabase hoặc gọi AI thật trong lần rà.

**Cập nhật 14/11/2026:** mobile đã nối màn cách quan tâm với `GET/PUT /users/me/preferences`, theo revision và bearer; xác nhận lưu yêu cầu `onboarding_completed_at` không đổi. Màn mặc định vi trước khi tải và dùng locale từ server khi tải thành công. Kết quả vẫn cần nghiệm thu trên thiết bị và database đã áp dụng migration; các mô tả cũ bên dưới về preferences chưa có là checkpoint lịch sử.

**Onboarding local 14/11/2026:** `GET /users/me/onboarding` trả `pending/skipped/completed`; `POST /users/me/onboarding/skip` ghi lựa chọn riêng, không hoàn tất onboarding hoặc thay đổi nội dung preferences. Cần review và áp dụng migration `20261114_onboarding_skip.sql`, deploy backend trước khi client dùng endpoint thật; chưa thực hiện lên môi trường đang chạy.

**Hạn mã mời 14/11/2026:** RPC giữ chữ ký cũ, bỏ sử dụng thời gian do caller cung cấp cho quyết định và dùng `clock_timestamp()` sau khi lấy khóa invite/users. Migration `20261114_invite_expiry_lock.sql` đã kiểm tra với PostgreSQL cô lập; chưa áp dụng lên database đang deploy.

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
| Profile | PUT `/auth/me`; POST/DELETE `/auth/me/avatar`; GET/PUT `/users/me/preferences` | UI text/avatar và preferences đã nối API; preferences giữ timezone/locale, dùng revision, không tự hoàn tất onboarding. Cần nghiệm thu thiết bị và schema thật |
| Password | POST `/auth/change-password`; POST `/auth/forgot-password`, `/auth/reset-password` | Đã nối API/service/UI đổi mật khẩu; ack xong đóng phiên local và đăng nhập lại. Sai mật khẩu hiện tại trả 400/current_password_invalid thay vì 401. Forgot/reset vẫn **501**, chưa có kênh xác minh thật |
| OAuth/OTP | Không có luồng mobile/provider đã tích hợp | Người dùng đã chuyển sang đợt kế tiếp. Không dùng email/password để giả OAuth hoặc OTP |
| Invite | POST/GET/DELETE `/couple/invite-code`; POST `/couple/validate-invite`, `/couple/accept-invite`; GET `/couple` | Client đã có; server chủ sở hữu từ bearer, code 6 ký tự, kiểm tra lỗi/atomic accept. Deferred link sau cài đặt/quà lời mời chưa khép kín |
| Couple lifecycle | PUT `/couple/anniversary`, DELETE `/couple` | Chưa nối đầy đủ UI; cần kiểm retention/export/purge/thu hồi quyền trước nghiệm thu unpair |
| Memories | GET/POST `/memories`; GET/PUT/DELETE `/memories/{id}`; POST `/memories/{id}/images`; DELETE `/memories/{id}/images/{image_id}` | Mobile đã nối sửa title/description và xóa bài; theo yêu cầu 2026-11-15 đã bỏ nút và logic client xóa riêng từng ảnh. Endpoint xóa ảnh phía backend vẫn tồn tại. DELETE bài chỉ xác nhận HTTP 204, không parse JSON rỗng. Create/upload dùng Idempotency-Key; sửa/xóa không tự retry ngoài refresh xác thực, timeout phải đọc lại. Chưa nghiệm thu hai thiết bị |
| Mood | POST/GET `/moods`; GET `/moods/partner/latest`; POST `/moods/alerts/{id}/read`; DELETE `/moods/{id}` | Đã nối mobile history và partner latest. GET history có limit 1–100 (default 20), offset >=0, giữ data array; owner từ bearer. Partner/digest lọc couple hiện tại, private và mood_only. Gửi check-in chưa nối: note 140/reasons 3/enum cũ chưa đủ draft mới |
| Smart Nudge | GET `/nudges/active`; POST `/nudges/{id}/action`, `/nudges/{id}/rate` | Backend có pipeline; UI chưa nối. State action completed/snoozed/dismissed, rating thumbs_up/down; ownership và privacy phải kiểm trước AI/template fallback |
| Tiny Moments | POST/GET `/tiny-moments` | Payload hiện `moment_type`, `content`, `nudge_id`; chưa đủ private media reference, detail/reaction/reply/read/delete/pagination/idempotency cho luồng mới |
| Memory conversation | GET/POST `/memories/{id}/comments`; GET/PUT/DELETE `/memories/{id}/comments/{comment_id}`; PUT/DELETE `…/{comment_id}/heart` | Code mới: stable send key, owner-only edit/delete với version, reply một cấp, desired-state heart; acknowledgement200/201, không parse như DELETE memory204. Cần migration20261115 và deployment; chưa nghiệm thu hai thiết bị |
| In-app inbox | GET `/notifications`; PUT `/notifications/{id}/read`; PUT `/notifications/read-all` | Couple/recipient từ server; chuông/badge, phân trang, read-one/all, target bị xóa không khả dụng; polling foreground. Xem MEMORY-CONVERSATIONS.md |
| Push/realtime | POST `/users/me/device-token`; WebSocket `/ws` | Có backend và native adapter rời; chưa có luồng settings/token/provider/tap và query invalidation hoàn chỉnh. Inbox bình luận mới không đồng nghĩa đã cấu hình push màn khóa |
| Tiny Mission | Chưa có router mission/wallet/redemption | Thiết kế API trong plan là **đề xuất**, chưa phải endpoint có thể gọi |
| Preferences/export/delete | GET/PUT `/users/me/preferences`; chưa đủ endpoint/worker cho export/delete | Preferences đã nối mobile theo revision; export/delete vẫn chưa hoàn chỉnh |

## Ràng buộc không được map mất dữ liệu

Quyết định sản phẩm đã tìm thấy và còn thiếu được đối chiếu trong [DECISIONS.md](../docs/progress/2026-10-27-app-e2e-status/DECISIONS.md). Retention 30 ngày là yêu cầu đã có; triển khai `break_up` hiện chưa đáp ứng, không coi audit lịch sử ghi đã sửa là bằng chứng hiện tại.

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
