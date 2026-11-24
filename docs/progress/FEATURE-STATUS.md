# Flamee — tiến độ tính năng

Cập nhật: **14/11/2026**. Đây là ảnh chụp tiến độ của code trong workspace và bằng chứng đã ghi nhận, không phải cam kết tiến độ hay kết quả nghiệm thu phát hành. Cập nhật lại tài liệu khi tích hợp, thay đổi phạm vi hoặc có bằng chứng kiểm thử mới.

## Cách đọc

- **Đã nối API**: code mobile gọi backend thật cho phạm vi được nêu; chưa mặc định là đã nghiệm thu E2E.
- **Một phần**: mới có một số thao tác, còn thiếu luồng hoặc contract.
- **Preview/mock**: dữ liệu minh họa, không đại diện dữ liệu tài khoản và không xác nhận nghiệp vụ thật.
- **Chưa khả dụng**: chưa có luồng mobile hoàn chỉnh; giao diện thông báo giới hạn thay vì báo thành công giả.
- **Chưa nghiệm thu**: chưa có bằng chứng UI, thiết bị và dữ liệu server cho toàn bộ kịch bản tương ứng.

Không tính phần trăm tổng thể: các nhóm khác nhau về khối lượng và chưa có tiêu chí quy đổi thống nhất. Backend có endpoint không đồng nghĩa mobile đã nối hoặc luồng đã được nghiệm thu.

## Tổng quan


| Nhóm                          | Trạng thái mobile                                                  | Phần đã có                                                          | Phần còn lại                                                                  |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Đăng ký, đăng nhập, phiên     | Đã nối API; hardening triển khai hoàn tất; chưa nghiệm thu E2E     | Email/mật khẩu, lưu và khôi phục phiên, refresh, đăng xuất          | Kiểm thử thiết bị, mạng lỗi và đổi tài khoản; Apple/OTP ngoài phạm vi đợt này |
| Hồ sơ, avatar, mật khẩu       | Đã nối API chính; chưa nghiệm thu thiết bị                         | Đọc/sửa thông tin cơ bản, upload/gỡ avatar, đổi mật khẩu, cách quan tâm và loại quan hệ | Kiểm chứng migration/database, luồng trên thiết bị và múi giờ tự động; sở thích tùy ý chưa có contract |
| Ghép đôi                      | Một phần; onboarding mới có code local, chưa deploy                | Tạo/xem/thu hồi/chấp nhận lời mời; đọc cặp; màn chọn kết nối và lưu bỏ qua | Triển khai backend/migration, link sau cài đặt và nghiệm thu đồng thời/hết hạn trên hai máy |
| Home / Kỷ niệm                | Một phần; đã nối API chính                                         | Feed/lịch/chi tiết, tạo và upload, sửa/xóa bài/ảnh                  | Retry khi mất phản hồi, đồng bộ hai máy và nghiệm thu media                   |
| Check-in và cảm xúc           | Một phần                                                           | Form draft, lịch sử và trạng thái đối tác đọc API                   | Gửi đầy đủ draft, privacy, timezone và lịch sử chi tiết                       |
| Smart Nudge                   | Chưa khả dụng trên mobile                                          | Có giao diện thông báo và API backend                               | Nối và nghiệm thu gợi ý, hành động, đánh giá, fallback                        |
| Tiny Moments                  | Chưa hoàn chỉnh trên mobile                                        | Backend có một số API                                               | Gửi/nhận nội dung, media, đọc, phản hồi và xóa E2E                            |
| Tiny Mission, điểm, quà       | **Preview/mock — tạm thời giữ theo yêu cầu người dùng ngày 14/11** | Xem trước nhiệm vụ, ví, thành tựu và quà; backend có API            | Khi được yêu cầu: nối mobile, chốt luật còn thiếu và nghiệm thu               |
| Đồng bộ realtime              | Một phần                                                           | Home tải lại khi mở lại màn hình, quay về app hoặc làm mới thủ công | WebSocket mobile, reconnect, thu hồi quyền và kiểm thử hai máy                |
| Thông báo                     | Chưa hoàn chỉnh                                                    | Có adapter và endpoint token                                        | Push thật, nhắc lịch, cài đặt, quyền và điều hướng khi nhấn                   |
| Cài đặt và vòng đời tài khoản | Một phần                                                           | Menu, đổi mật khẩu, đăng xuất, đã nối API preferences                | Xác minh preferences trên môi trường/thiết bị; hủy kết nối, export/xóa dữ liệu, retention |
| Nghiệm thu phát hành          | Chưa hoàn tất                                                      | Có test tự động và bằng chứng API lịch sử                           | UI E2E, hai thiết bị, accessibility, mạng lỗi, permissions và hồi quy         |


## Chi tiết và việc cần theo dõi

### Tài khoản và phiên

- [x] Có form đăng ký/đăng nhập email và mật khẩu; request đi qua API cấu hình.
- [x] Có khôi phục và làm mới phiên; đăng xuất xử lý local và thu hồi phiên server theo kết quả thực tế.
- [x] Khi không thể lưu/xóa credential cho phiên vừa được cấp, app không công bố phiên đó và thử thu hồi token tương ứng. Khi refresh trả tài khoản không khớp hoặc thiếu refresh token, app kết thúc phiên cũ và thử thu hồi token mới; thu hồi từ xa chỉ được xác nhận khi server phản hồi thành công.
- [ ] Kiểm tra đăng ký, đăng nhập, restart, refresh, đăng xuất khi mất mạng và chuyển tài khoản trên thiết bị.
- [ ] Nghiệm thu lỗi mật khẩu, lỗi mạng và lỗi server trên UI. Trong lượt 14/11 đã sửa viewport toast Android và xác nhận thông báo thử nghiệm hiển thị trên emulator; đây không phải nghiệm thu toàn bộ auth.

- Lượt rà soát 14/11 bổ sung test cục bộ cho lỗi SecureStore khi đăng nhập/đăng ký/refresh, phản hồi refresh sai tài khoản và race khi đăng nhập tài khoản mới. Bộ auth/phiên, startup và kiểm tra design system liên quan đạt 65/65; typecheck đạt. Không tạo thêm dữ liệu trên backend thật; công cụ điều khiển thiết bị không kết nối được nên chưa đánh dấu nghiệm thu UI.

- [x] **Task 1 theo hạng mục Tổng quan “Đăng ký, đăng nhập, phiên” — hardening code hoàn tất.** Đã xử lý race ghi credential bị thay thế cho login và refresh; test bao gồm B thất bại trước khi lưu, B thành công, credential khác đã xuất hiện và lỗi xóa. Nhánh lỗi xóa báo lỗi storage và thử thu hồi phiên, không khẳng định đã xóa credential hoặc thu hồi server nếu thao tác thất bại. Auth/phiên/startup cục bộ 66/66; typecheck đạt.
- [ ] Nghiệm thu E2E A01–A03 trên Expo Go/thiết bị vẫn đang chờ; kiểm thử tự động không thay thế thao tác UI, restart, mạng lỗi và xác minh trạng thái phiên trên server.

- Apple/OTP chuyển đợt sau; quên/reset mật khẩu đã loại khỏi phạm vi theo quyết định ghi trong báo cáo 27/10. Không tạo OTP hoặc đăng nhập giả.

### Hồ sơ và kết nối

- [x] Profile cơ bản, ảnh đại diện và đổi mật khẩu đã có đường gọi API; đổi mật khẩu thành công đóng phiên theo contract.
- [x] Màn Cách quan tâm đọc/lưu API preferences: sáu lựa chọn, ghi chú, biệt danh gọi người yêu và loại quan hệ. Giữ timezone/locale đã có, revision và trạng thái onboarding; xung đột hoặc kết quả lưu không xác nhận yêu cầu tải lại, không ghi đè tự động. Không lưu dữ liệu này vào route, log hoặc storage trên thiết bị.
- [x] Màn Cách quan tâm mặc định tiếng Việt trước khi tải và dùng locale vi/en từ server sau khi tải; tiêu đề, nút quay lại, nội dung, lỗi và thông báo lưu theo locale đó. App hiện chưa có state ngôn ngữ chung, nên cơ chế này chưa đổi ngôn ngữ các màn khác. Phản hồi lưu bị từ chối nếu `onboarding_completed_at` thay đổi ngoài yêu cầu.
- [x] Hai trường tên và biệt danh dùng `AppField` outlined theo mockup hồ sơ đã có; test contract hồ sơ trước đó đã đạt.
- Kiểm tra local 14/11: 47/47 test hồ sơ, avatar, mật khẩu, design system và toast liên quan đạt; typecheck đạt. Không chạy migration hoặc thao tác dữ liệu trên backend thật.
- [x] **Task 2 theo hạng mục Tổng quan “Hồ sơ, avatar, mật khẩu” — triển khai code và sửa feedback review hoàn tất.** Đã bổ sung màn preferences gọi API, xử lý vi/en, kiểm tra phản hồi không tự đổi trạng thái onboarding và làm rõ checklist. Review code độc lập không tìm thấy lỗi chặn trong các điểm sửa. 47/47 test và typecheck là kết quả pane `code` báo cáo; reviewer không chạy lại.
- [ ] Nghiệm thu E2E trên thiết bị và xác minh schema/migration/database vẫn còn mở; chưa đánh dấu toàn bộ hạng mục là nghiệm thu xong.
- [x] Có luồng mã mời và đọc thông tin cặp từ server.
- [x] Luồng mời được ràng buộc theo tài khoản và phiên; mã hết hạn trong khi chờ phản hồi không được dùng lại. Nếu phản hồi chấp nhận bị mất, app chỉ xác nhận kết nối sau khi đọc server và đối chiếu đúng hai thành viên; lỗi nghiệp vụ không được biến thành thành công.
- [x] Sửa local RPC `accept_couple_invite`: kiểm tra lại hạn bằng `clock_timestamp()` sau khóa mã mời và hai tài khoản; không tin `p_now` cũ. Test PostgreSQL cô lập đã tái hiện lỗi cũ ở cả ba khóa và kiểm tra schema/migration mới, nhận đồng thời và thời gian client sai. Migration `backend/migrations/20261114_invite_expiry_lock.sql` **chưa áp dụng** lên server thật.
- Kiểm tra mobile local 14/11: 39/39 kiểm thử mời, refresh phiên và design system đạt; typecheck đạt. PostgreSQL cô lập đã kiểm tra riêng ở mục trên; chưa áp dụng migration lên database đang deploy hoặc nghiệm thu UI hai thiết bị.
- [ ] Nghiệm thu hồ sơ, upload/gỡ avatar, đổi mật khẩu, preferences, xử lý lỗi/mất mạng và xung đột revision trên thiết bị và server thật. OpenAPI của backend `13.239.139.82` có endpoint preferences nhưng chưa xác minh bảng/migration hoặc thực hiện giao dịch xác thực trong lượt này.
- [ ] Xác minh và hoàn thiện tự động cập nhật múi giờ từ thiết bị theo spec; màn preferences hiện giữ giá trị server. Chưa có contract cho danh sách sở thích tùy ý ngoài sáu lựa chọn cách quan tâm; không tạo dữ liệu giả.
- [ ] Kiểm tra mời, hết hạn, tự mời, hai lần chấp nhận, chuyển tài khoản và trạng thái hai thiết bị sau restart.
- [ ] Deferred link sau cài đặt: người dùng chọn tạm hoãn cho đến khi có nhà cung cấp, domain và cấu hình signing. Link `flamee://` hiện tại chỉ áp dụng khi app đã được cài và hệ điều hành xử lý scheme.
- [x] Quyết định người dùng: màn chọn kết nối theo mockup là onboarding; cách muốn được quan tâm do người dùng tự cập nhật trong Hồ sơ; sau khi bỏ qua, những lần sau vào Home.
- [x] Code local dùng màn chọn kết nối với minh họa và hai hành động thật; bỏ qua chỉ được ghi nhận sau phản hồi server, lưu `onboarding_skipped_at` riêng với `onboarding_completed_at`. Tài khoản đã ghép đôi vào Home; link mời đang mở được ưu tiên. Nếu không đọc được trạng thái, UI cho thử lại hoặc vào Home tạm trong phiên, không báo đã lưu bỏ qua.
- [ ] Backend `13.239.139.82` kiểm tra 14/11 vẫn chưa có endpoint onboarding mới. Migration `backend/migrations/20261114_onboarding_skip.sql` đã kiểm thử lặp lại trên PostgreSQL cô lập và giữ dữ liệu có sẵn; cần xác nhận database đích, áp dụng migration này cùng migration sửa RPC, sau đó deploy backend mới. Chưa chạy migration hoặc ghi database thật.
- [ ] Nghiệm thu giao diện theo mockup, lưu bỏ qua/restart/đổi thiết bị, lỗi mạng, session đổi và nhận link trên thiết bị; công cụ điều khiển thiết bị chưa khả dụng.
- Kiểm tra local: build Expo web thành công, typecheck và 39/39 kiểm thử mời/onboarding/định tuyến/design system đạt. Minh họa được tạo mới dựa trên mockup; build không thay thế kiểm tra trực quan trên thiết bị.

**Task kế tiếp theo thứ tự Tổng quan:** Ghép đôi.

### Home / Kỷ niệm

- [x] Có feed và lịch từ dữ liệu server, xem chi tiết, tạo bài và upload ảnh; đã nối sửa nội dung và xóa bài. Theo yêu cầu 2026-11-15, mobile bỏ thao tác xóa riêng từng ảnh cùng handler/service/API client liên quan; nút xóa bài và xác nhận xóa dùng màu destructive. Xóa bài vẫn xóa toàn bộ ảnh theo contract server; bỏ ảnh nháp trong composer giữ nguyên.
- [x] Home dùng cache trong 30 giây; khi vào lại màn hình hoặc app trở về foreground chỉ tải nền dữ liệu đang hiển thị nếu đã cũ hoặc đã bị đánh dấu cần cập nhật. Kéo làm mới vẫn yêu cầu dữ liệu mới ngay. Polling Home mỗi 5 giây đã được bỏ; thay đổi từ thiết bị khác không tự xuất hiện trong khi người dùng đứng yên trên Home.

- Tải nền không bật vòng xoay kéo-làm-mới; vòng xoay chỉ phản ánh lượt tải lại do người dùng yêu cầu.
- Khi server trả URL ký mới cho cùng ảnh, feed và chi tiết giữ URL cũ còn hạn để tránh tải lại ảnh không cần thiết; đổi ảnh hoặc URL gần hết hạn sẽ dùng URL mới. Tải lại thủ công lấy URL mới để hỗ trợ thử lại khi ảnh lỗi.

- [ ] Nghiệm thu ảnh thật và quyền riêng tư giữa hai tài khoản trên hai thiết bị.
- [ ] Kiểm tra mất mạng/mất response sau create hoặc upload, retry và trường hợp bài chữ tồn tại khi upload ảnh thất bại.
- [ ] Nghiệm thu sửa/xóa, đồng bộ và phân trang trên hai thiết bị. Code bình luận/reply một cấp/heart và inbox đã nối mobile + backend ngày2026-11-15; migration `20261115_memory_conversation.sql` đã áp dụng vào Supabase `crxkzjnvwlnjuxmbtnqm`, kiểm schema/RLS/grants6/6 đạt. Backend chưa deploy; người dùng sẽ push để CI/CD chạy. Xem `.doc/MEMORY-CONVERSATIONS.md` và `docs/progress/2026-11-15-conversation-migration-applied.md`; chưa coi đây là nghiệm thu API/ghi dữ liệu hai thiết bị sau deploy.

### Cảm xúc, Nudge và Moments

- [x] Lịch sử cảm xúc và trạng thái đối tác đọc API, có trạng thái loading/lỗi/trống và lọc theo phạm vi được phép trong code.

- Lịch sử và trạng thái cảm xúc đối tác dùng thời gian cache 30 giây; thao tác thử lại thủ công vẫn gọi API ngay.

- [ ] Nối gửi toàn bộ draft check-in, gồm contract cho các trường UI hiện tại, idempotency và quyền riêng tư; kiểm tra nhiều lần/ngày và timezone.
- [ ] Nối Smart Nudge, chuyển trạng thái và đánh giá; kiểm tra AI fallback, nội dung hỗ trợ và ranh giới dữ liệu riêng tư.
- [ ] Nối Tiny Moments với media riêng tư, chi tiết, phản hồi, trạng thái đọc, xóa và xử lý retry.

- Dữ liệu tạm trong form không chứng minh đã lưu server. Các ranh giới `full`, `mood_only`, `private_only` cần được kiểm chứng xuyên suốt API, UI và AI.

### Tiny Mission — quyết định tạm thời

Giữ giao diện preview/mock hiện tại theo yêu cầu người dùng. Nhiệm vụ, người tham gia, tiến độ, ví và quà trong preview là dữ liệu minh họa; các thao tác chưa kết nối không ghi điểm, tạo mã hay xác nhận đổi quà thật. Không coi số điểm và giá quà mẫu là luật sản phẩm.

Code backend hiện đã có endpoint mission, wallet, achievements và redemption; điều này chưa làm mobile thành tính năng thật. Khi phạm vi được mở lại, đối chiếu contract, luật ngày chung, nhiệm vụ, điểm, tồn kho, mã quà và vận hành trước khi nối và nghiệm thu. Tài liệu quyết định 27/10 là lịch sử; nhận định trong tài liệu đó rằng backend mission chưa tồn tại không còn phản ánh source hiện tại.

### Đồng bộ, thông báo và dữ liệu tài khoản

- [ ] Hoàn thiện WebSocket mobile, reconnect và thu hồi quyền cho kết nối đang mở; kiểm thử đồng thời hai máy.
- [ ] Hoàn thiện push thật, vòng đời token, quyền thiết bị, quiet hours và mở đúng nội dung khi nhấn thông báo.
- [x] Đã nối preferences với API.
- [ ] Xác minh preferences lưu/đọc trên đúng môi trường và thiết bị.
- [ ] Thiết kế và kiểm chứng hủy kết nối, xuất dữ liệu và xóa tài khoản theo quyền sở hữu và retention; không coi endpoint đơn lẻ là đủ để đáp ứng toàn bộ chính sách.

## Kiểm tra và môi trường


| Bằng chứng                      | Kết quả                                                        | Giới hạn                                                                                                                                                            |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile typecheck, 14/11/2026    | `npm run typecheck` đạt                                        | Không chứng minh UI hay thiết bị hoạt động.                                                                                                                         |
| Mobile domain suite, 14/11/2026 | 348/349 đạt; 1 lỗi | `checkInUiContract.test.ts`: bố cục thought bubble. Lỗi `profileFeedbackContract.test.ts` đã xử lý theo mockup hồ sơ. |
| Backend test local 14/11/2026 | 40 đạt; 13 cảnh báo deprecation | Preferences, onboarding, couple và preflight dùng test doubles; chưa kiểm chứng PostgreSQL thật hoặc service đã deploy. |
| Backend hồi quy offline 14/11/2026 | 227 đạt, 15 deselected, 50 cảnh báo deprecation | Loại live và SQL integration; test thiếu cột migration bổ sung sau lượt chạy đã đạt riêng trong bộ preferences 20/20. |
| PostgreSQL cô lập 14/11/2026 | 52 test backend liên quan đạt, 13 cảnh báo deprecation | Bao gồm RPC từ schema và migration, ba trường hợp chờ khóa qua hạn, nhận đồng thời và migration onboarding lặp lại; chưa kiểm chứng database/server thật. |
| Backend CI, báo cáo 10/11/2026  | 231 đạt, 8 deselected; báo cáo có 17 kiểm tra live development | Là kết quả lịch sử của môi trường được nêu trong báo cáo, không phải lượt chạy lại hiện tại.                                                                        |
| QA APK local, 14/11/2026 | APK điện thoại `flamee-mobile/qa/flamee-mobile-qa-http-arm64-v8a.apk` đã xác minh: 60,028,696 byte; SHA-256 `4FDED1F00F051BBFAC55836BAC22557327B3931971174CB355DB0630802F7882`; package `com.flamee.mobile`, ABI `arm64-v8a`, URL `http://13.239.139.82:8000/api/v1`, manifest HTTP và chữ ký V2 debug. APK emulator `flamee-mobile/qa/flamee-mobile-qa-http-x86_64.apk` vẫn có sẵn. | APK QA ký debug, dùng HTTP; `usesCleartextTraffic` nằm trong cấu hình Android dùng chung. Chưa cài/chạy trên điện thoại hoặc xác nhận login/đọc dữ liệu. Không dùng làm bản phát hành. |
| E2E UI Android/iOS hai thiết bị | Chưa có bằng chứng nghiệm thu đầy đủ                           | Xem ma trận E2E; API test và test doubles không thay thế được UI/device E2E.                                                                                        |


Ngày 14/11, backend `13.239.139.82:8000` trả `/health` và `/openapi.json` HTTP 200, OpenAPI version `0.3.0`; có các endpoint auth, profile/couple và preferences nhưng chưa có `/users/me/onboarding` hoặc `/users/me/onboarding/skip`. Người dùng xác nhận Supabase project đang dùng là database của backend; chưa xác minh giao dịch đăng nhập/đọc bằng tài khoản hiện có hoặc áp dụng hai migration mới trên database đó. Báo cáo deploy 10/11 ghi IP cũ `32.236.230.247`; không chuyển các kết quả cũ sang IP mới nếu chưa đối chiếu deployment. Backend hiện chỉ HTTP. Chỉ dùng tài khoản thử nghiệm qua HTTP; không gửi mật khẩu thật.

**Mục tiêu APK để chấm trên điện thoại Android thông thường:** đã tạo APK QA `arm64-v8a`, sẵn sàng chuyển sang điện thoại để cài và thử. Còn thiếu bằng chứng cài/chạy, đăng nhập tài khoản hiện có và đọc dữ liệu từ database mong muốn. Backend chỉ HTTP; dùng tài khoản thử nghiệm, không dùng thông tin đăng nhập thật. OpenAPI hiện có auth/profile/preferences nhưng chưa công bố endpoint onboarding mới; onboarding skip chưa dùng được với backend đang deploy. APK chưa phải bản phát hành.

## Thứ tự theo dõi đề xuất

Bạn đang thực hiện task theo thứ tự các hàng trong **Tổng quan**. Danh sách dưới đây được giữ làm khung đánh giá tiến độ và mức sẵn sàng nghiệm thu; mỗi mục được đối chiếu với các hạng mục Tổng quan tương ứng.

1. Khép kín và nghiệm thu tài khoản, ghép đôi và Home trên hai thiết bị; xử lý hai lỗi UI test theo thiết kế đã duyệt. *(Tổng quan: Đăng ký, đăng nhập, phiên; Ghép đôi; Home / Kỷ niệm. Hardening code auth đã xong; E2E, ghép đôi, Home và hai lỗi UI vẫn còn theo trạng thái từng hàng.)*
2. Hoàn thiện contract và gửi check-in, sau đó kiểm tra lịch sử, timezone và privacy. *(Tổng quan: Check-in và cảm xúc.)*
3. Nối Smart Nudge và Tiny Moments; nghiệm thu lỗi mạng, media và AI fallback. *(Tổng quan: Smart Nudge; Tiny Moments.)*
4. Hoàn thiện realtime, push và vòng đời dữ liệu; xác minh preferences đã nối trên môi trường/thiết bị. *(Tổng quan: Đồng bộ realtime; Thông báo; Hồ sơ, avatar, mật khẩu; Cài đặt và vòng đời tài khoản.)*
5. Giữ Tiny Mission mock cho đến khi có yêu cầu tiếp tục; khi đó nối backend và nghiệm thu điểm/quà theo contract đã chốt. *(Tổng quan: Tiny Mission, điểm, quà.)*
6. Chạy hồi quy, accessibility và E2E Android/iOS trên hai thiết bị trước khi đánh dấu phát hành. *(Tổng quan: Nghiệm thu phát hành; cổng tổng thể bao trùm các hạng mục trên.)*

## Nguồn đối chiếu

- [Báo cáo tiến độ 27/10](2026-10-27-app-e2e-status/README.md), [triển khai và giới hạn](2026-10-27-app-e2e-status/IMPLEMENTATION.md), [quyết định lịch sử](2026-10-27-app-e2e-status/DECISIONS.md).
- [Ma trận nghiệm thu E2E](../../.doc/E2E-ACCEPTANCE.md), [contract API](../../.doc/E2E-API-CONTRACT.md), [nhật ký thực thi](../../.doc/E2E-EXECUTION-LOG.md).
- [Quyết định Tiny Mission](../../.doc/TINY-MISSION.md), [báo cáo backend EC2 10/11](2026-11-10-ec2-backend/README.md).
- Source mobile `flamee-mobile/src/features/` và backend `backend/app/api/`; các README cũ là bằng chứng theo ngày, không thay thế source hiện tại.
