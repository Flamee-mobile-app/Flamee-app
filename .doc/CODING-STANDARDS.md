# Flamee — quy chuẩn code

Ngày áp dụng: 2026-10-11. Phạm vi: toàn repository. Căn cứ: spec local, tài liệu frontend, quy chuẩn giao diện và kiến trúc backend trong [mục lục](README.md).

## 1. Quy trình thay đổi

1. Đọc AGENTS.md, mục lục docs, baseline và module liên quan trước khi sửa.
2. Với lỗi, truy vết từ triệu chứng tới caller, cấu hình và dependency đã cài; xác định nguyên nhân trước khi thay mã.
3. Chọn bản sửa nhỏ nhất giải quyết nguyên nhân. Giữ public contract và hành vi ngoài phạm vi; không gom refactor không liên quan.
4. Không chỉnh vendor, lockfile hoặc dependency để che lỗi ứng dụng. Không dùng ignoreLogs/console suppression thay bản sửa.
5. Kiểm tra phù hợp với yêu cầu người dùng và khả năng môi trường. Ghi rõ kết quả, giới hạn và lỗi đã có; không chạy script tác động dữ liệu thật làm bước kiểm tra.
6. Tuân thủ PERMISSION-RULES-SKILL cho Git và thao tác phá hủy. Giữ nguyên thay đổi của người khác.

## 2. Kiến trúc mobile

- app/ chỉ chứa route/layout Expo Router có default React component export. Root layout ghép provider từ src/providers/; provider, store và helper không nằm trong app/ vì Router tự quét thành route. Screen, hook, schema và service thuộc src/features/<feature>/.
- Metadata phiên dùng chung ở src/shared/state/sessionStore.ts; entry resolver ở src/shared/navigation/entryRoute.ts; lifecycle startup thuộc features/startup và xuất qua index.ts.
- src/shared/ chứa UI, token, localization, helper và adapter dùng chung; không chứa state nghiệp vụ toàn app.
- Feature xuất domain/service API qua index.ts; route có thể dùng barrel screens.ts riêng để ghép screen mà không khiến import UI kéo theo chu trình giữa các feature. Import giữa feature chỉ qua public entry point; không mở rộng deep import hiện còn trong source.
- Hướng phụ thuộc: app → features → shared. shared không import features/app; tránh vòng phụ thuộc giữa feature.
- Mỗi feature sở hữu local service và dữ liệu của nó. Không thêm src/demo, src/local-runtime, scenario switcher, reducer/provider gom mọi domain.
- Business rule và validation ở service/schema; screen chỉ xử lý presentation và interaction. Đồng hồ, persistence và native dependency cần tách để có thể thay adapter.
- TypeScript strict: dùng type/domain error rõ nghĩa, validate dữ liệu không tin cậy bằng Zod; không dùng any hoặc ép kiểu để lách contract.
- Component PascalCase; function/hook camelCase; hook bắt đầu use; theo convention thư mục hiện có. Tên phải phản ánh local, pending, unavailable đúng thực tế.

## 3. State và vòng đời local

- Zustand session chỉ giữ metadata phiên cần thiết. Không persist mood, note, message, media, nudge, queue hoặc hồ sơ nhạy cảm vào Zustand/AsyncStorage/plain SQLite.
- TanStack Query là cache server khi tích hợp; React state là state UI. Không tạo hai nguồn sự thật cho một domain.
- Runtime hiện dùng bộ nhớ: cold restart mất bản ghi; sign-out kết thúc phiên nhưng giữ bản ghi trong cùng process để tài khoản local khác nhận lời mời.
- Sign-out, unpair và delete-account là ba hành động khác nhau. Khi đổi vòng đời, xử lý cache, notification, temporary media và dữ liệu theo đúng ownership.
- Không gọi lưu cục bộ là gửi thành công lên server. Pending trong bộ nhớ không phải durable offline queue.
- SQLCipher chỉ dùng khi native build thực sự hỗ trợ và kiểm tra mã hóa thành công. Không bật adapter legacy trong Expo Go chỉ vì có expo-sqlite.

## 4. UI, typography và Tamagui

- Dùng Tamagui 2 và @tamagui/lucide-icons-2 cho UI chuẩn; longhand props như paddingHorizontal, backgroundColor, fontSize.
- Dùng src/shared/constants/tokens.ts và tamagui.config.ts làm nguồn token triển khai; thay đổi palette/thang chữ phải đối chiếu QUY_CHUAN_GIAO_DIEN và ghi quyết định.
- Thang fontSize semantic: caption 10, bodyS 12, bodyM 14, bodyL 16, button 16, h5 18, h4 20, h3 24, h2 28, h1 32. Không sao chép magic number khắp screen.
- Phân biệt size của control với fontSize: control 48 là chiều cao, không phải chữ 48. Button tra font theo size ngay cả khi đã đặt fontSize hoặc không có icon.
- Font body và heading phải có alias true và control ở size/lineHeight trỏ tới typography.button. Letter spacing phải có cùng bộ key. Alias là tương thích thư viện, không thêm bậc chữ sản phẩm.
- Với size token mới trên Button/Input/Text, kiểm tra font lookup và các token layout liên quan. Không dựa vào fallback $4 khi font chỉ có key semantic.
- System là font fallback hiện tại. Chỉ công bố SF Pro / SF Pro Rounded đã đóng gói khi có asset và loader đúng.
- Ưu tiên AppText/AppButton/shared components; native primitives được phép tại adapter/media/animation có lý do. Không dùng DOM, CSS web hoặc window/document cho native screen.
- Với Tamagui 2 trên cả web/native, dùng role và aria-* cho accessibility; optimized native view đã cài chuyển chúng sang native props. Native primitive vẫn dùng props React Native. SVG/icon trang trí dùng aria-hidden; không truyền boolean accessible xuống SVG web.
- Import icon qua public subpath @tamagui/lucide-icons-2/icons/<Tên> để tránh kéo cả bộ icon vào graph development. Không deep import dist/ hoặc sửa vendor.
- Text qua localization vi/en; hỗ trợ nội dung dài, font scaling, safe area, keyboard, reduced motion và accessibility label. Có state loading, empty, error, denied/unavailable khi cần.

## 5. Nghiệp vụ và quyền riêng tư

- Scope check-in là full / mood_only / private_only. private_only không sang partner, notification hoặc AI; mood_only chỉ chia sẻ mood, không reason/note.
- Giữ giới hạn đã xác nhận: mood 1–5, reason tối đa 3, note 140; invite local 6 ký tự / 72 giờ; voice tối đa 30 giây. Giới hạn khác lấy từ schema/service feature và spec tương ứng.
- Không đưa note, draft, message, invite token, credential hoặc media URI vào route params, analytics, console, crash report. Params ưu tiên ID đã kiểm tra quyền; draft nằm trong state có vòng đời rõ.
- Không giả SMS/OAuth, AI, upload, push, export file hoặc gửi support. Capability chưa có trả trạng thái unavailable và UX đúng với khả năng hiện có.
- Ngoại lệ tạm thời do người dùng yêu cầu ngày 2026-10-11: mock login không credential trong development được phép để tiếp tục code. Guard __DEV__ tại cả UI và auth service; EXPO_PUBLIC_MOCK_LOGIN=false tắt được. Không coi session này là verified, không tự seed consent/pair/domain data hoặc bật trong release. Chi tiết ở LOGIN-SPLASH-TRANSITION.
- Native permission chỉ hỏi tại thao tác cần quyền; từ chối vẫn có đường dùng core flow. Không tạo demo:// media thay bản ghi thật.
- Cleanup chỉ với file ứng dụng sở hữu. Không xóa file thư viện ảnh gốc của người dùng. Export lọc dữ liệu theo chủ thể và loại bỏ credential/invite token/media URI.
- Nudge thông thường không thay nội dung hỗ trợ an toàn chưa xác nhận. AI/template phải phản ánh đúng nguồn; tránh chẩn đoán hoặc khẳng định cảm xúc của người khác.

## 6. Backend và API

- API router nhận/validate request, inject identity, gọi service, trả schema/envelope. Business rule ở service; Supabase access ở repository. Không mở rộng truy vấn trực tiếp trong route.
- Pydantic cho request/response; model nội bộ không được lộ password_hash/secret. Python có type hints và domain exception, không trả traceback cho client.
- Identity lấy từ token đã xác minh. Mọi thao tác với couple/resource cần kiểm tra membership/ownership bằng dữ liệu server; ID do client hoặc LLM cung cấp không phải authorization.
- Service-role key chỉ ở backend. Khi thay đổi AI, áp dụng sharing scope trước fact extraction, prompt, vector search và alert; không suy luận dữ liệu private là dữ liệu couple.
- Backend hiện Supabase PostgreSQL/Storage, không thêm SQLite/SQLAlchemy/Alembic từ ví dụ docs lịch sử. Schema thay đổi phải có kế hoạch cập nhật DB, không tự chạy schema.sql trên cloud.
- Ghép đôi/consume invite cần bảo đảm atomicity khi triển khai thực; local lock không giải quyết race giữa nhiều process backend.
- Tách ngày lịch và timestamp có timezone. Check-in theo local day/timezone người dùng; thời điểm lưu server theo UTC có timezone.
- API mobile/backend hiện khác auth, invite, mood và memory. Khi kết nối thật, xác định mapping/contract rõ ràng; không ép payload bằng cast.
- AI provider qua interface; khởi tạo theo capability/config. Không log mood, fact, prompt hoặc chat chứa dữ liệu nhạy cảm. Tool side effect cần cùng authorization như REST API.
- Không chạy các script test_*.py ở root backend như test suite: một số thao tác ghi/xóa dữ liệu Supabase thật.

## 7. Kiểm tra và bàn giao

- Khi được yêu cầu kiểm tra: mobile dùng npm run typecheck; npm run test:domain chỉ có ý nghĩa nếu thực sự phát hiện test. Backend pytest trong tests/ dùng fake client, không thay thế kiểm tra DB cloud/RLS.
- Bug UI/native cần kiểm tra màn hình trên runtime liên quan để kết luận hành vi thiết bị; typecheck chỉ chứng minh tính hợp lệ tĩnh.
- Nếu tool không chạy được, báo lỗi môi trường và kiểm tra thay thế đã dùng. Không báo một command đã chạy khi chỉ gọi compiler API.
- Khi bàn giao, nêu file thay đổi, nguyên nhân, kết quả kiểm tra thực có và phần chưa xác nhận. Cập nhật docs nếu hành vi/contract/kiến trúc đổi.
