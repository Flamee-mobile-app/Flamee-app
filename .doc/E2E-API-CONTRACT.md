# Ma trận API cho kế hoạch hoàn thiện E2E

**Yêu cầu Mood mới nhất:** check-in mới luôn chia sẻ đầy đủ (`share_level: "all"`, `is_private: false`); không cung cấp lựa chọn `mood_only` hoặc `private_only` trong luồng tạo mới. Không thay đổi quyền của check-in đã lưu; khi đọc dữ liệu cũ vẫn phải tôn trọng quyền server đã lưu. Chia sẻ với đối phương không tự cho phép gửi ghi chú riêng vào AI. Quy tắc này thay thế yêu cầu chọn ba mức chia sẻ trong các đoạn lịch sử bên dưới.

**Tiến độ nối gửi:** nút Chia sẻ gọi POST `/moods` với bearer, draft v2 và Idempotency-Key; client thu riêng cường độ và điểm Mood. Client chỉ cho gửi khi backend xác nhận capability. Chưa xác minh migration v2 và migration nhắc mới trên database production. Test API client đã chạy bằng test double, không gửi dữ liệu thật.

**Yêu cầu mới nhất:** `mood_score` là điểm tâm trạng do user chọn, 1 rất tệ→5 rất tốt, độc lập với cường độ cảm xúc. Backend code mới chỉ tạo gợi ý hai chiều khi cả hai có check-in v2 đầy đủ, cùng cặp và còn thuộc ngày hiện tại theo timezone từng người. Khi vào app chưa check-in, backend tạo tối đa một nhắc mỗi người/ngày; toast trong app có thể ẩn và nhắc lưu trong chuông để mở nhanh. Đây là thông báo trong ứng dụng, chưa phải push hệ điều hành khi app đóng. Gợi ý dual-mood dùng mẫu theo cả hai điểm, không gửi note/reasons sang AI; bản cũ vẫn giữ quyền riêng tư đã lưu. Mỗi thao tác hiển thị toast theo xác nhận server. Code và migration mới chưa được deploy hay nghiệm thu hai thiết bị; client kiểm tra capability và báo chưa khả dụng trên backend cũ. Xem [MOOD-CHECKIN-E2E.md](MOOD-CHECKIN-E2E.md).

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
- Tiny Mission hiện dùng contract server tại `20261110_missions.sql`/`20261110_rewards.sql`: ngày chung theo ví, điểm theo rule version, tối đa hai lượt đổi/cặp/ngày, quà/tồn kho/fanpage do operator quản lý. Giá trị preview không là contract production. Chi tiết mobile hiện hành: [TINY-MISSION.md](TINY-MISSION.md).

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
| Mood | POST/GET `/moods`; GET `/moods/partner/latest`, `/moods/capabilities`, `/moods/reminders`; POST `/moods/reminders/ensure` | Nối gửi v2 và lịch sử; nhắc được lưu server theo tài khoản/ngày, kể cả khi chưa ghép đôi. Cần deploy backend và migration mới. |
| Smart Nudge | GET `/moods/nudge`; GET `/nudges/{id}`; POST `/nudges/{id}/action` | Nối gợi ý theo hai Mood mới nhất và thao tác xác nhận/hoãn/bỏ. Snooze lưu status `new` cùng `snoozed_until`; xác nhận client kiểm cả hai trường. |
| Tiny Moments | POST/GET `/tiny-moments` | Payload hiện `moment_type`, `content`, `nudge_id`; chưa đủ private media reference, detail/reaction/reply/read/delete/pagination/idempotency cho luồng mới |
| Memory conversation | GET/POST `/memories/{id}/comments`; GET/PUT/DELETE `/memories/{id}/comments/{comment_id}`; PUT/DELETE `…/{comment_id}/heart` | Code mới: stable send key, owner-only edit/delete với version, reply một cấp, desired-state heart; acknowledgement200/201, không parse như DELETE memory204. Cần migration20261115 và deployment; chưa nghiệm thu hai thiết bị |
| Memory post heart | GET/PUT/DELETE `/memories/{id}/heart` | Desired-state, JSON200 với memory_id/count/hearted; actor từ bearer, kiểm activepair/server membership, không optimistic. Cần migration20261116_memory_post_hearts và deploy; chưa áp dụng lên dịch vụ thật. |
| In-app inbox | GET `/notifications`; PUT `/notifications/{id}/read`; PUT `/notifications/read-all` | Couple/recipient từ server; chuông/badge, phân trang, read-one/all, target bị xóa không khả dụng; polling foreground. Xem MEMORY-CONVERSATIONS.md |
| Push/realtime | POST `/users/me/device-token`; WebSocket `/ws` | Có backend và native adapter rời; chưa có luồng settings/token/provider/tap và query invalidation hoàn chỉnh. Inbox bình luận mới không đồng nghĩa đã cấu hình push màn khóa |
| Tiny Mission | Router missions/wallet/rewards/redemptions đã có và được xác minh trong OpenAPI server | Mobile đọc/ghi qua API với ACK, version và idempotency; trạng thái quà trống phản ánh catalog thật, không seed quà mẫu |
| Preferences/export/delete | GET/PUT `/users/me/preferences`; chưa đủ endpoint/worker cho export/delete | Preferences đã nối mobile theo revision; export/delete vẫn chưa hoàn chỉnh |

## Ràng buộc không được map mất dữ liệu

Quyết định sản phẩm đã tìm thấy và còn thiếu được đối chiếu trong [DECISIONS.md](../docs/progress/2026-10-27-app-e2e-status/DECISIONS.md). Retention 30 ngày là yêu cầu đã có; triển khai `break_up` hiện chưa đáp ứng, không coi audit lịch sử ghi đã sửa là bằng chứng hiện tại.

1. Check-in mới chỉ gửi `all`; dữ liệu lịch sử `mood_only` / `private` vẫn được bảo vệ theo quyền server đã lưu.
2. Check-in draft có các feeling GIF như `discouraged`, `energetic`, `unbothered`, `broken_down`, `awful`, có custom feeling, sleepHours và attachment. Backend hiện thiếu một phần trường/enum. Không tự đổi `awful` thành `sad` rồi bỏ danh tính cảm xúc gốc để API nhận được.
3. Note tối đa 60 ký tự Unicode và nhiều lý do được gửi theo contract v2; không báo lưu khi response không xác nhận đủ draft.
4. Một activity/media không mặc nhiên là cùng entity: Home dùng memories, Tiny Moment có entity riêng. Không gửi media URI local hoặc URL không được kiểm quyền vào trường content để giả upload.
5. Check-in cá nhân khi chưa ghép đôi thuộc user; không tự gán ngược vào cặp khi ghép sau.
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
