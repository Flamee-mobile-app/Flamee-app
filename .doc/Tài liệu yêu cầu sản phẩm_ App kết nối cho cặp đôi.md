# Tài liệu yêu cầu sản phẩm: App kết nối cho cặp đôi

**Phiên bản 1.1** · Dành cho đội phát triển · Nền tảng: iOS và Android · Ngôn ngữ ban đầu: tiếng Việt

**Cách đọc tài liệu:** Mục 0 là bản tóm tắt một trang, đọc xong là nắm được toàn bộ sản phẩm. Các mục sau là chi tiết, tra cứu khi làm đến phần nào thì đọc phần đó.

Mức ưu tiên dùng trong tài liệu: **Bắt buộc** (phải có để ra mắt) · **Nên có** (làm nếu kịp, không chặn ra mắt) · **Làm sau** (giai đoạn 2).

---

## 0. Tóm tắt một trang

**Sản phẩm là gì?** App giúp hai người yêu nhau luôn biết người kia đang thế nào, và biết nên làm điều nhỏ nào để quan tâm đúng lúc, mà không ai phải mở lời trước. Bản đầu tập trung vào các cặp **yêu xa**.

**Cách app hoạt động (một vòng lặp):**

1. Một người **check-in**: chọn tâm trạng và lý do.
2. Người kia thấy trạng thái đó, và nhận một **Smart Nudge**: gợi ý một việc nhỏ, cụ thể, kèm sẵn nội dung để gửi.
3. Họ bấm gửi một **Tiny Moment** (ảnh, ghi âm ngắn, lời nhắn).
4. Người đầu tiên nhận được, phản hồi, rồi lại check-in vào hôm sau.

**Bản đầu có 6 phần bắt buộc, theo thứ tự ưu tiên:**

| Thứ tự | Phần | Vì sao quan trọng |
| --- | --- | --- |
| 1 | Ghép đôi và bắt đầu dùng | Không ghép được thì không có sản phẩm |
| 2 | Check-in hằng ngày | Cung cấp thông tin cho phần 3 |
| 3 | **Smart Nudge** ⭐ | Điểm khác biệt duy nhất, làm kỹ nhất |
| 4 | Tiny Moments | Nơi người dùng thực hiện gợi ý |
| 5 | Thông báo | Nhắc đúng lúc, không làm phiền |
| 6 | Hồ sơ, cài đặt, quyền riêng tư | Dữ liệu cảm xúc rất nhạy cảm |

Phần thứ 7 (widget màn hình khóa) thuộc nhóm "Nên có".

**5 nguyên tắc nhớ khi làm:**

1. **Ít thao tác.** Việc chính làm xong trong tối đa 2 đến 3 lần chạm.
2. **Không phạt, không gây áp lực.** Không có câu kiểu "bạn làm mất chuỗi ngày".
3. **Người dùng quyết định.** AI chỉ gợi ý. Người dùng xem và sửa trước khi gửi.
4. **Riêng tư là mặc định.** Người dùng luôn biết người kia thấy được gì.
5. **Lỗi AI không bao giờ hiện ra.** AI hỏng thì dùng nội dung mẫu có sẵn.

---

## 1. Bài toán và hướng giải

**Có hai bài toán:**

1. Hai người yêu xa không biết trạng thái của nhau, và dù biết cũng không rõ nên làm gì.
2. App cho cặp đôi chỉ có ích khi **cả hai** cùng dùng. Nếu chỉ một người dùng thì app chết.

**Hướng giải:**

- Bài toán 1: vòng lặp ở mục 0. Smart Nudge là phần đáng đầu tư nhất.
- Bài toán 2: **lời mời kèm quà** (người mời gửi sẵn một ghi âm hoặc ảnh, người kia phải cài app mới mở được) và **chế độ chờ** (người mời vẫn dùng được app trong lúc đợi người kia).

**Chỉ số thành công của bản đầu:**

| Chỉ số | Mức tối thiểu |
| --- | --- |
| Cặp có cả hai người dùng trong 7 ngày đầu | từ 50% |
| Người được mời chấp nhận trong 48 giờ | từ 60% |
| Cặp còn dùng sau 30 ngày | từ 20% |
| Smart Nudge được người dùng thực hiện | từ 15% |
| Smart Nudge bị đánh giá "sai tông" | dưới 10% |

---

## 2. Danh sách tính năng

**Bản đầu (làm theo thứ tự này):** Ghép đôi → Check-in → Smart Nudge → Tiny Moments → Thông báo → Hồ sơ và quyền riêng tư → Widget (nên có).

**Làm sau, khi bản đầu đạt chỉ số ở mục 1:**

| Thứ tự | Tính năng |
| --- | --- |
| 1 | Lên kế hoạch hẹn hò với AI trợ lý (người dùng là người quyết định, AI chỉ gợi ý) |
| 2 | Dòng thời gian kỷ niệm và nhắc ngày kỷ niệm |
| 3 | Nhiệm vụ nâng cao và trò chơi hóa (chuỗi ngày tùy chọn, huy hiệu) |
| 4 | Quỹ chung của cặp đôi (quản lý tài chính) |
| 5 | Tổng kết tuần của hai người |

---

## 3. Người dùng và thuật ngữ

**Hai nhân vật mẫu:**

- **Linh (26 tuổi), người mời:** chủ động, hay là người lo cho mối quan hệ. Muốn biết người yêu thế nào và có cách quan tâm đơn giản.
- **Nam (28 tuổi), người được mời:** bận, ít chủ động, hay quên chuyện nhỏ. Không muốn bị bắt làm quá nhiều, cần gợi ý cụ thể.

**Thuật ngữ trong tài liệu:**

| Từ | Nghĩa |
| --- | --- |
| Cặp | Hai tài khoản đã ghép với nhau |
| Check-in | Lần báo tâm trạng của một người |
| Smart Nudge | Gợi ý một việc nhỏ cho người dùng, dựa trên check-in của người yêu |
| Tiny Moment | Một chia sẻ nhỏ: ảnh, ghi âm ≤ 30 giây, lời nhắn hoặc tín hiệu một chạm |
| Số ngày kết nối | Số ngày liên tiếp mà cả hai đều có hoạt động trong app |
| Quản trị viên | Nhân viên nội bộ quản lý nội dung (danh sách tag, câu gợi ý mỗi ngày, nội dung mẫu) |

---

## 4. Yêu cầu chi tiết cho bản đầu

### 4.1 Ghép đôi và bắt đầu dùng (Bắt buộc)

| # | Yêu cầu |
| --- | --- |
| 1.1 | Đăng nhập bằng Apple, Google hoặc số điện thoại (mã xác thực gửi qua tin nhắn). **Không hỏi tuổi.** |
| 1.2 | Nhập thông tin cơ bản: tên hiển thị, biệt danh gọi người yêu, ảnh đại diện (hai mục này không bắt buộc), múi giờ (tự lấy từ điện thoại, sửa được). |
| 1.3 | Chọn loại quan hệ: *Yêu xa* hoặc *Cùng thành phố*. Bản đầu làm tốt cho yêu xa, nhưng vẫn lưu lựa chọn này để dùng ở giai đoạn 2. |
| 1.4 | **Tạo lời mời:** gồm một đường link và một mã 6 ký tự. Mỗi lời mời dùng được 1 lần, hết hạn sau 72 giờ. Có thể tạo lại, khi đó link cũ hết hiệu lực. Chia sẻ bằng menu chia sẻ của điện thoại (Zalo, Messenger, iMessage...). |
| 1.5 | **Quà kèm lời mời** (không bắt buộc): ghi âm đến 30 giây, ảnh hoặc lời nhắn. Người yêu nhận được ngay khi ghép xong. |
| 1.6 | **Người được mời bấm link:** nếu chưa có app, đưa tới cửa hàng ứng dụng. Cài xong mở app, lời mời vẫn hiện ra mà không phải nhập lại. *(Kỹ thuật: cần giải pháp link nhớ được lời mời sau khi cài, gọi là deferred deep link. Firebase Dynamic Links đã ngừng, cần chọn giải pháp khác như Branch hoặc AppsFlyer OneLink.)* |
| 1.7 | Nếu link lỗi, cho nhập mã 6 ký tự bằng tay. |
| 1.8 | Mỗi tài khoản chỉ thuộc một cặp tại một thời điểm. Mời hoặc nhận lời mời khi đã có cặp thì báo lỗi dễ hiểu. |
| 1.9 | **Chế độ chờ:** người mời vẫn vào được app trong lúc đợi. Họ check-in được, soạn sẵn quà, xem trạng thái lời mời và gửi lại khi hết hạn. |
| 1.10 | **Nhắc người mời** lúc 24, 48 và 72 giờ nếu lời mời chưa được chấp nhận (tối đa 3 lần), kèm gợi ý cách nhắn cho người yêu. Dừng ngay khi ghép xong. |
| 1.11 | Ghép xong: cả hai nhận thông báo, vào màn hình chính. Người được mời mở quà (nếu có). |
| 1.12 | **Kết thúc kết nối:** một trong hai người bấm, xác nhận 2 lần. Hai bên mất quyền xem dữ liệu chung. Dữ liệu chung bị xóa sau 30 ngày, trong thời gian đó mỗi người tải được dữ liệu của mình. Người kia nhận thông báo trung tính, không nêu lý do. |
| 1.13 | Từ lúc mở app đến lúc thấy giá trị tối đa 4 bước: thông tin cá nhân → "cách tôi muốn được quan tâm" (yêu cầu 6.4) → mời người yêu → check-in đầu tiên. Bước không bắt buộc phải cho bỏ qua. |

**Cách kiểm tra:**

- Link hết hạn: người được mời thấy câu "Lời mời đã hết hạn, hãy nhờ người mời tạo lại", không thấy lỗi kỹ thuật.
- Cài app sau khi bấm link: sau khi đăng ký, màn hình xác nhận lời mời tự hiện ra.
- Hai người cùng bấm chấp nhận một lúc: chỉ một lần thành công, không tạo ra hai cặp.

### 4.2 Check-in hằng ngày (Bắt buộc)

| # | Yêu cầu |
| --- | --- |
| 2.1 | Chọn tâm trạng trong 5 mức: rất tệ, tệ, bình thường, tốt, rất tốt. Mỗi mức có biểu tượng và màu riêng. |
| 2.2 | Chọn tối đa 3 lý do (tag): Công việc, Học tập, Mệt mỏi, Căng thẳng, Lo lắng, Cô đơn, Nhớ bạn, Vui, Bình yên, Sức khỏe, Gia đình, Bạn bè, Tiền bạc, Khác. Danh sách do server cấu hình, quản trị viên sửa được mà không cần cập nhật app. |
| 2.3 | Ghi chú thêm (không bắt buộc), tối đa 140 ký tự. |
| 2.4 | Mỗi lần check-in chọn mức chia sẻ: *Đầy đủ* (mặc định) · *Chỉ chia sẻ tâm trạng* (ẩn lý do và ghi chú) · *Chỉ mình tôi* (người kia không thấy, không tạo Smart Nudge). |
| 2.5 | Check-in xong trong tối đa 3 lần chạm (tâm trạng → lý do → xong). |
| 2.6 | Được check-in nhiều lần trong ngày. Lần mới nhất là trạng thái hiện tại, lịch sử giữ đủ. "Ngày" tính theo giờ của chính người đó. |
| 2.7 | **Màn hình chính** có thẻ trạng thái người yêu: tâm trạng, lý do, ghi chú (nếu được chia sẻ), thời điểm cập nhật ("2 giờ trước"), giờ hiện tại ở chỗ họ và chênh lệch múi giờ. |
| 2.8 | Nếu người yêu chưa check-in hôm nay: hiện "Chưa cập nhật hôm nay" (không dùng lời trách móc), kèm nút gửi tín hiệu nhẹ như "Nhớ bạn". |
| 2.9 | Mất mạng vẫn check-in được. App lưu tạm trên máy và gửi lên khi có mạng. |
| 2.10 | Nhắc check-in mỗi ngày, mặc định 20:00 giờ địa phương, người dùng đổi được. Không nhắc nếu đã check-in. |
| 2.11 | Check-in xong, nếu người yêu cũng đã check-in thì chuyển thẳng sang Smart Nudge dành cho mình. |
| 2.12 | **Nên có:** xem lịch sử tâm trạng 30 ngày của bản thân và (phần được chia sẻ) của người yêu. |

**Cách kiểm tra:**

- Chọn "Chỉ mình tôi": người kia không nhận thông báo, không thấy dữ liệu, không có Smart Nudge nào được tạo.
- Hai người lệch 12 tiếng múi giờ: mỗi người thấy giờ của người kia, và "hôm nay" tính theo giờ của riêng mình.

### 4.3 Smart Nudge (Bắt buộc, quan trọng nhất)

**Mục tiêu:** biến trạng thái của người yêu thành **một việc nhỏ, cụ thể, làm được trong một chạm**.

| # | Yêu cầu |
| --- | --- |
| 3.1 | Khi người yêu check-in có chia sẻ, hệ thống tạo **1 Smart Nudge** cho người còn lại. |
| 3.2 | Mỗi Smart Nudge gồm: (a) một câu nhận xét ngắn về trạng thái người yêu, (b) loại việc nên làm (nhắn tin, ghi âm, gửi ảnh, gọi điện, việc khác), (c) nội dung soạn sẵn để gửi, (d) lý do gợi ý ngắn gọn. |
| 3.3 | Người dùng chọn: **Làm ngay** (mở khung soạn đúng loại, nội dung điền sẵn) · **Sửa nội dung** · **Để sau** (nhắc lại sau 2 giờ, chỉ một lần) · **Bỏ qua**. |
| 3.4 | Bấm "Làm ngay" xong, gửi được trong tối đa 2 thao tác. Nội dung gửi đi hiện là của người dùng, **không gắn nhãn AI**. |
| 3.5 | Đánh giá 👍 hoặc 👎. Nếu 👎, chọn lý do: Sai tông · Quá chung chung · Không hợp lúc này · Không phải kiểu của chúng tôi · Khác. |
| 3.6 | Cá nhân hóa theo mục "cách tôi muốn được quan tâm" của người yêu (6.4) và theo những gợi ý trước đó đã làm hoặc bỏ qua. |
| 3.7 | **Giới hạn:** tối đa 3 Smart Nudge mỗi ngày cho mỗi người. Nếu gợi ý trước chưa xử lý và mới tạo chưa đến 4 giờ thì không tạo thêm. Mỗi gợi ý hết hạn sau 24 giờ. |
| 3.8 | Tâm trạng tốt cũng có gợi ý (chia sẻ niềm vui, chúc mừng), nhẹ nhàng hơn. |
| 3.9 | **Phương án dự phòng:** nếu AI lỗi hoặc trả lời chậm quá 6 giây, dùng nội dung mẫu theo tâm trạng và lý do. Bản đầu cần ít nhất 60 mẫu. |
| 3.10 | **An toàn:** nếu ghi chú có dấu hiệu khủng hoảng hoặc tự hại, **không** tạo gợi ý nhẹ nhàng thông thường. Thay vào đó khuyến khích liên lạc trực tiếp và hiện thông tin hỗ trợ khủng hoảng (quản trị viên cấu hình). |
| 3.11 | **Nên có:** xem lại gợi ý trong 14 ngày gần nhất. |
| 3.12 | **Nên có:** người mời ở chế độ chờ thấy "ý tưởng quan tâm" chung, không dựa vào dữ liệu người yêu, để có lý do ở lại app. |

**AI hoạt động thế nào:**

- Gọi AI qua một lớp trung gian, để sau này đổi nhà cung cấp mà không phải sửa nghiệp vụ.
- **Dữ liệu gửi cho AI:** tâm trạng, lý do, ghi chú, giờ địa phương của người yêu, loại quan hệ, sở thích được quan tâm, 5 gợi ý gần nhất. **Không gửi** tên thật, số điện thoại, email hay vị trí chính xác (dùng biệt danh).
- **AI trả về dạng JSON** gồm: `observation` (nhận xét, ≤ 120 ký tự), `action_type` (text, voice, photo, call hoặc other), `draft` (nội dung soạn sẵn, ≤ 280 ký tự), `reason` (lý do, ≤ 100 ký tự), `tone` (gentle, playful, supportive hoặc celebratory).
- **Quy tắc viết:** tiếng Việt tự nhiên, gọi theo biệt danh. Chỉ một gợi ý. Việc làm được trong dưới 2 phút. Không phán xét, không chẩn đoán tâm lý, không tư vấn y tế, không hứa hẹn. Không lặp cùng một cấu trúc câu trong 5 gợi ý liền nhau.
- Kết quả phải qua kiểm tra định dạng và bộ lọc nội dung. Không đạt thì dùng nội dung mẫu.
- **Tốc độ:** 95% gợi ý tạo xong trong dưới 4 giây. **Chi phí:** có mức tối đa số lần gọi AI cho mỗi cặp mỗi ngày (cấu hình được).
- **Chấm chất lượng:** chuẩn bị bộ ít nhất 100 tình huống mẫu (tâm trạng × lý do × bối cảnh), người thật chấm theo 4 tiêu chí: đúng tông, cụ thể, tự nhiên, an toàn. Ít nhất 80% phải đạt mức "tốt" mới được phát hành.

**Cách kiểm tra:**

- Người yêu check-in "Căng thẳng, Công việc, ghi chú: Hôm nay nộp deadline": gợi ý phải nhắc đúng chuyện deadline (không phải câu chung chung "hãy động viên bạn ấy"), có loại việc hợp lý và nội dung gửi được ngay.
- AI quá chậm: người dùng vẫn nhận gợi ý từ nội dung mẫu trong tối đa 7 giây, không thấy lỗi.
- Ghi chú có dấu hiệu khủng hoảng: không có câu đùa hay gợi ý nhẹ nhàng, có hiện thông tin hỗ trợ.

### 4.4 Tiny Moments (Bắt buộc)

| # | Yêu cầu |
| --- | --- |
| 4.1 | Bốn loại: **Ảnh** (chụp mới hoặc chọn từ thư viện) · **Ghi âm** (tối đa 30 giây) · **Lời nhắn** (tối đa 200 ký tự) · **Tín hiệu một chạm** ("Nhớ bạn", "Đang nghĩ về bạn", "Chúc ngủ ngon"). |
| 4.2 | **Ảnh:** thu nhỏ cạnh dài tối đa 1600 px, dung lượng sau nén tối đa 2 MB. Có thể thêm chú thích 100 ký tự và dòng chữ vị trí ("Đang ở Hà Nội"). Bản đầu **không** lưu tọa độ chính xác. |
| 4.3 | **Ghi âm:** nhấn giữ hoặc chạm để bắt đầu/dừng, có đồng hồ đếm, tự dừng ở 30 giây, nghe lại trước khi gửi. |
| 4.4 | **Gợi ý mỗi ngày:** mỗi ngày hiện một gợi ý chia sẻ ("Chụp thứ bạn đang nhìn thấy"). Có ít nhất 30 gợi ý, xoay vòng không lặp trong 30 ngày. Quản trị viên sửa được. |
| 4.5 | **Dòng chung** của hai người, mới nhất ở trên. Phân biệt người gửi. Giờ gửi hiển thị theo múi giờ của người xem. |
| 4.6 | **Phản hồi:** thả một trong 6 biểu tượng cảm xúc, hoặc trả lời bằng chữ, ghi âm, ảnh (câu trả lời cũng là một Tiny Moment). |
| 4.7 | **Xóa:** người gửi xóa được, xóa cho cả hai bên và xóa luôn tệp gốc. Người nhận có thể lưu ảnh hoặc ghi âm về máy. |
| 4.8 | Quà đã soạn ở chế độ chờ (1.9) được giao ngay khi ghép xong. |
| 4.9 | **Nên có:** hiển thị "đã xem" cho người gửi, người dùng có thể tắt. |
| 4.10 | **Nên có:** **số ngày kết nối liên tiếp.** Một ngày được tính khi **cả hai** đều có ít nhất 1 hoạt động (check-in hoặc Tiny Moment). Hiện dạng "Hai bạn đã kết nối X ngày". Khi đứt chuỗi: không thông báo, không phạt, không dùng chữ "mất". Số quay về 0, kỷ lục vẫn giữ. |
| 4.11 | **Nên có:** nghe lại ghi âm với tốc độ 1x hoặc 1.5x. |

**Cách kiểm tra:**

- Ghi âm chạm 30 giây: tự dừng, cho nghe lại, rồi gửi hoặc ghi lại.
- Người gửi xóa Tiny Moment: người nhận không còn thấy, đường link cũ đến tệp cũng không mở được.

### 4.5 Thông báo (Bắt buộc)

| Mã | Thông báo | Khi nào gửi | Mặc định |
| --- | --- | --- | --- |
| A | Nhắc check-in | Đến giờ đã chọn mà chưa check-in | Bật |
| B | Người yêu vừa check-in, có Smart Nudge | Người yêu check-in có chia sẻ | Bật |
| C | Người yêu gửi Tiny Moment | Có Tiny Moment mới | Bật |
| D | Có phản hồi | Có biểu tượng hoặc trả lời mới (gom trong 15 phút) | Bật |
| E | Nhắc mời người yêu | 24, 48, 72 giờ sau khi mời mà chưa ghép | Bật |
| F | Đã ghép đôi thành công | Người kia chấp nhận | Bật |
| G | Nhắc nhẹ nhàng | Hai bạn chưa có hoạt động nào trong 48 giờ | Bật, tắt được |
| H | Nhắc lại gợi ý "để sau" | 2 giờ sau khi bấm "Để sau" | Bật |

| # | Yêu cầu |
| --- | --- |
| 5.1 | Gửi qua dịch vụ thông báo của Apple (APNs) và Google (FCM). Xin quyền thông báo **sau** khi người dùng đã thấy giá trị (sau check-in đầu tiên), không xin ngay khi mở app. |
| 5.2 | **Giờ yên tĩnh:** mặc định 23:00 đến 07:00 giờ địa phương của người nhận. Thông báo rơi vào khung này được giữ lại đến hết giờ. |
| 5.3 | **Tối đa 4 thông báo mỗi ngày** cho mỗi người (không tính loại F và thông báo bảo mật). Khi vượt, ưu tiên theo thứ tự: B > C > D > A > G. |
| 5.4 | Người dùng bật/tắt từng loại và đổi giờ trong cài đặt. |
| 5.5 | **Chế độ riêng tư:** khi bật, thông báo hiện nội dung chung chung, không lộ ghi chú hay lý do trên màn hình khóa. |
| 5.6 | Bấm thông báo mở đúng màn hình: loại B mở Smart Nudge, loại C mở đúng Tiny Moment đó. |
| 5.7 | Một người có nhiều thiết bị. Xóa mã thiết bị khi đăng xuất hoặc khi dịch vụ báo mã không còn hợp lệ. |

### 4.6 Hồ sơ, cài đặt và quyền riêng tư (Bắt buộc)

| # | Yêu cầu |
| --- | --- |
| 6.1 | Sửa hồ sơ: tên, biệt danh, ảnh, múi giờ, giờ nhắc. |
| 6.2 | Màn hình **"Ai thấy gì"** giải thích dữ liệu nào chia sẻ với người yêu, dữ liệu nào không. |
| 6.3 | Màn hình đồng ý Điều khoản và Chính sách quyền riêng tư. Nói rõ dữ liệu cảm xúc là dữ liệu nhạy cảm và có dùng AI để xử lý. Lưu lại phiên bản và thời điểm đồng ý. |
| 6.4 | **"Cách tôi muốn được quan tâm":** chọn nhiều mục trong *Lời nói động viên · Ghi âm · Ảnh hoặc video · Gọi điện · Để tôi yên một lúc · Quà nhỏ bất ngờ*, kèm một ô ghi thêm tối đa 140 ký tự. Người yêu chỉ thấy bản tóm tắt trong Smart Nudge, không thấy nguyên văn. |
| 6.5 | **Tải dữ liệu của mình** về (tệp ZIP hoặc JSON, gửi link tải). |
| 6.6 | **Xóa tài khoản:** xác nhận 2 lần. Dữ liệu cá nhân xóa trong tối đa 30 ngày. Nếu đang có cặp thì tự động kết thúc kết nối. Người kia nhận thông báo trung tính. |
| 6.7 | Tắt thông báo tạm thời: 1 giờ, 8 giờ hoặc 24 giờ. |
| 6.8 | Liên hệ hỗ trợ, báo lỗi hoặc báo cáo nội dung ngay trong app. |
| 6.9 | **Nên có:** khóa app bằng Face ID, vân tay hoặc mã PIN. |
| 6.10 | **Nên có:** xóa hàng loạt dữ liệu cũ do mình đã gửi theo khoảng thời gian. |

### 4.7 Widget màn hình (Nên có)

| # | Yêu cầu |
| --- | --- |
| 7.1 | Widget nhỏ trên iOS và Android: tâm trạng hiện tại của người yêu, giờ ở chỗ họ, thời điểm cập nhật. |
| 7.2 | Bấm widget mở app tại thẻ trạng thái hoặc Smart Nudge. |
| 7.3 | Tôn trọng chế độ riêng tư: ẩn chi tiết khi điện thoại khóa nếu người dùng bật. |

---

## 5. Làm sau (giai đoạn 2)

Phần này chỉ để dev **chừa chỗ mở rộng**. Mỗi tính năng sẽ có tài liệu riêng khi bắt đầu làm.

- **Lên kế hoạch hẹn hò với AI trợ lý:** người dùng tạo buổi hẹn (thời gian, địa điểm, ngân sách), bấm "Gợi ý ý tưởng", AI đưa 3 đến 5 ý tưởng, người dùng chọn và sửa, rồi gửi cho người yêu xác nhận. Kèm nhắc "lần cuối hai bạn đi hẹn hò là X ngày trước" và gợi ý hẹn hò online cho cặp yêu xa. Dữ liệu cần chừa sẵn: loại quan hệ, vị trí, bảng kế hoạch, lớp kết nối với dịch vụ thời tiết và địa điểm.
- **Dòng thời gian kỷ niệm:** sự kiện (ngày, tiêu đề, ảnh, ghi chú), đếm ngày yêu, nhắc trước ngày kỷ niệm 7 ngày và 1 ngày, đưa Tiny Moment yêu thích vào dòng thời gian.
- **Nhiệm vụ nâng cao:** thư viện nhiệm vụ theo chủ đề, chuỗi ngày tùy chọn (cả hai cùng đồng ý), huy hiệu. Chỉ làm nếu dữ liệu cho thấy số ngày kết nối giúp giữ chân người dùng mà không gây áp lực.
- **Quỹ chung:** sổ chi tiêu nhập tay (chưa nối ngân hàng), danh mục, chia ai trả ai nợ, ngân sách tháng, mục tiêu tiết kiệm. Cần rà soát pháp lý và bảo mật trước khi làm.
- **Tổng kết tuần:** AI tóm tắt tuần của hai người, gửi mỗi Chủ nhật, có thể tắt.

---

## 6. Yêu cầu về chất lượng và bảo mật

| Nhóm | Yêu cầu |
| --- | --- |
| Thiết bị hỗ trợ | iOS 15 trở lên, Android 8 trở lên. Đề xuất dùng một bộ mã cho cả hai hệ điều hành (Flutter hoặc React Native). Widget cần viết riêng cho từng hệ điều hành. |
| Tốc độ | Mở app từ đầu ≤ 3 giây trên máy tầm trung. Gửi check-in ≤ 1 giây khi mạng tốt. Tải 20 mục trong dòng chung ≤ 2 giây. |
| Cập nhật gần tức thì | Trạng thái và Tiny Moment mới hiện lên trong tối đa 5 giây khi cả hai đang mở app. |
| Ổn định | Hoạt động ≥ 99.5% thời gian. Thông báo gửi thành công ≥ 95%. Không mất check-in hay Tiny Moment khi mất mạng (lưu tạm và thử gửi lại, gửi trùng cũng không tạo bản sao). |
| Bảo mật | Mã hóa khi truyền (TLS 1.2 trở lên) và khi lưu. Ghi chú check-in và lời nhắn được mã hóa riêng từng trường. Thời hạn đăng nhập ngắn, có làm mới. Đường link tải ảnh và ghi âm chỉ có hiệu lực ≤ 15 phút. **Mọi API đều phải kiểm tra người gọi có thuộc cặp đó không.** Giới hạn số lần gọi theo người dùng và địa chỉ IP. Không ghi nội dung nhạy cảm vào log. |
| Quyền riêng tư và pháp lý | Dữ liệu cảm xúc là dữ liệu nhạy cảm. Trước khi ra mắt cần rà soát Nghị định 13/2023/NĐ-CP và yêu cầu của App Store, Google Play (mô tả dữ liệu thu thập, cho xóa tài khoản ngay trong app). Hợp đồng với nhà cung cấp AI phải cam kết không dùng dữ liệu để huấn luyện. **Vì không hỏi tuổi,** cần xác định mức phân loại độ tuổi trên cửa hàng ứng dụng và nhờ chuyên gia pháp lý tư vấn về dữ liệu trẻ em. |
| Dễ tiếp cận | Hỗ trợ cỡ chữ của hệ thống, độ tương phản đủ, đọc được bằng trình đọc màn hình (tâm trạng không chỉ dựa vào màu). |
| Ngôn ngữ | Mọi chữ hiển thị để trong tệp riêng, định dạng ngày giờ theo vùng. Ra mắt tiếng Việt, sẵn sàng thêm tiếng Anh. |
| Theo dõi hệ thống | Báo lỗi app, nhật ký có cấu trúc, bảng theo dõi: số thông báo gửi và mở, tỷ lệ lỗi AI, thời gian tạo gợi ý, chi phí AI mỗi cặp. |
| Mở rộng | API không lưu trạng thái. Các việc nền (tạo gợi ý, gửi thông báo, nhắc nhở) chạy qua hàng đợi. Dữ liệu thiết kế theo mã cặp để dễ chia nhỏ sau này. |

---

## 7. Dữ liệu cần lưu

Mọi thời gian lưu theo giờ UTC, kèm múi giờ của người dùng để tính "ngày". Xóa mềm với Tiny Moment và tài khoản, có việc nền dọn sạch khi đến hạn.

| Bảng | Nội dung chính |
| --- | --- |
| Người dùng | Cách đăng nhập, tên, biệt danh, ảnh, múi giờ, ngôn ngữ, ngày tạo, ngày xóa |
| Cặp | Trạng thái (đang chờ / đang hoạt động / đã kết thúc), loại quan hệ, ngày tạo, ngày kết thúc, ngày dọn dữ liệu |
| Thành viên của cặp | Mã cặp, mã người dùng, vai trò (người mời / người được mời), ngày tham gia |
| Lời mời | Mã cặp, người mời, mã 6 ký tự, token của link, ngày hết hạn, trạng thái, quà đính kèm |
| Check-in | Người check-in, mã cặp, tâm trạng (1 đến 5), danh sách lý do, ghi chú (đã mã hóa), mức chia sẻ, ngày theo giờ địa phương, thời điểm tạo |
| Smart Nudge | Mã cặp, người nhận, check-in nguồn, nhận xét, loại việc, nội dung soạn sẵn, lý do, giọng điệu, nguồn (AI / nội dung mẫu), trạng thái (mới / đã làm / để sau / bỏ qua / hết hạn), thời điểm tạo và xử lý |
| Đánh giá Smart Nudge | Mã gợi ý, 👍 hoặc 👎, lý do |
| Tiny Moment | Mã cặp, người gửi, loại, khóa tệp, nội dung chữ (đã mã hóa), chú thích, trả lời cho Tiny Moment nào, từ Smart Nudge nào, thời điểm tạo, ngày xóa |
| Biểu tượng phản hồi | Tiny Moment, người thả, biểu tượng, thời điểm |
| Cách tôi muốn được quan tâm | Người dùng, danh sách lựa chọn, ghi chú |
| Gợi ý chia sẻ mỗi ngày | Nội dung, đang dùng hay không, thứ tự |
| Cài đặt thông báo | Bật/tắt từng loại, giờ nhắc check-in, giờ yên tĩnh, chế độ riêng tư |
| Thiết bị | Người dùng, hệ điều hành, mã thiết bị nhận thông báo, lần cuối hoạt động |
| Đồng ý điều khoản | Người dùng, loại văn bản, phiên bản, thời điểm |
| Số ngày kết nối | Mã cặp, ngày, cả hai có hoạt động không, chuỗi hiện tại, chuỗi kỷ lục |
| Sự kiện theo dõi | Tên sự kiện, người dùng, cặp, thông tin kèm theo, thời điểm |

---

## 8. Danh sách API

Dùng REST. Mã định danh dạng UUID. Danh sách dùng phân trang theo con trỏ. Lỗi trả về có mã và câu giải thích tiếng Việt. Các API tạo dữ liệu nhận một khóa chống gửi trùng (Idempotency-Key).

| Nhóm | API |
| --- | --- |
| Đăng nhập | `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `DELETE /me` |
| Hồ sơ | `GET, PATCH /me` · `PUT /me/care-preferences` · `GET, PATCH /me/notification-settings` · `POST /me/devices` |
| Ghép đôi | `POST /invites` · `GET /invites/{token}` · `POST /invites/{token}/accept` · `POST /invites/{id}/revoke` · `POST /couple/unpair` · `GET /couple` |
| Check-in | `POST /checkins` · `GET /checkins?from&to` · `GET /couple/partner-status` |
| Smart Nudge | `GET /nudges?status=` · `POST /nudges/{id}/act` (làm / để sau / bỏ qua) · `POST /nudges/{id}/feedback` |
| Tiny Moment | `POST /moments` · `GET /moments?cursor` · `DELETE /moments/{id}` · `POST /moments/{id}/reactions` · `POST /media/upload-url` |
| Nội dung | `GET /daily-prompt` · `GET /config/tags` |
| Dữ liệu cá nhân | `POST /me/export` · `GET /me/export/{id}` |
| Quản trị (nội bộ) | Thêm, sửa, xóa: lý do check-in, gợi ý mỗi ngày, nội dung mẫu, thông tin hỗ trợ khủng hoảng. Xem số liệu, xử lý báo cáo. |
| Cập nhật tức thời | WebSocket hoặc SSE theo mã cặp, gồm 4 sự kiện: `partner.checkin`, `moment.new`, `nudge.new`, `couple.status` |

---

## 9. Sự kiện cần theo dõi

- **Bắt đầu:** đăng ký xong · xem và hoàn thành từng bước giới thiệu.
- **Ghép đôi:** tạo lời mời · chia sẻ lời mời · mở lời mời · chấp nhận lời mời · cặp bắt đầu hoạt động.
- **Hằng ngày:** check-in (tâm trạng, số lý do, mức chia sẻ) · xem trạng thái người yêu.
- **Smart Nudge:** được tạo (nguồn, thời gian tạo) · được xem · được làm (loại việc) · bị bỏ qua · đánh giá (👍/👎, lý do).
- **Tiny Moment:** gửi (loại, có từ Smart Nudge không) · xem · thả biểu tượng.
- **Khác:** thông báo gửi và mở (theo loại) · hoàn thành một ngày kết nối · kết thúc kết nối · xóa tài khoản.

**Bảng theo dõi tối thiểu:** tỷ lệ ghép đôi thành công theo từng bước · cả hai người cùng dùng sau 1, 7, 30 ngày · tỷ lệ Smart Nudge được thực hiện · tỷ lệ 👎 theo lý do · chi phí AI mỗi cặp.

---

## 10. Lộ trình gợi ý

Chỉ gợi ý thứ tự, không cam kết thời gian.

| Giai đoạn | Nội dung |
| --- | --- |
| Chuẩn bị | Chốt thiết kế giao diện cho bắt đầu, check-in và Smart Nudge. Dựng hạ tầng, đăng nhập. **Làm thử Smart Nudge** (viết nội dung mẫu, chạy thử với người thật) song song. |
| Đợt 1-2 | Ghép đôi và bắt đầu dùng (gồm link nhớ lời mời, chế độ chờ). Màn hình đồng ý điều khoản và hồ sơ. |
| Đợt 3-4 | Check-in, thẻ trạng thái người yêu, thông báo cơ bản. |
| Đợt 5-6 | **Smart Nudge:** gọi AI, nội dung mẫu dự phòng, kiểm tra an toàn, đánh giá chất lượng. |
| Đợt 7-8 | Tiny Moments, hoàn thiện thông báo, tải và xóa dữ liệu. |
| Đợt 9 | Widget, số ngày kết nối, kiểm tra tốc độ và bảo mật. |
| Thử nghiệm kín | 20 đến 30 cặp yêu xa thật dùng thử, đo các chỉ số ở mục 1, phỏng vấn sau. |

**Khuyến nghị bắt buộc:** trước hoặc trong giai đoạn chuẩn bị, chạy thử Smart Nudge thủ công (qua Zalo hoặc Telegram) với 10 đến 15 cặp để xem gợi ý có khiến họ hành động không. Nếu không, các phần khác chưa cần vội.

---

## 11. Điều kiện để ra mắt

**Mỗi chức năng được coi là xong khi:** đã được người khác xem lại mã · có kiểm thử tự động cho phần nghiệp vụ chính · đạt các cách kiểm tra trong tài liệu này · không còn lỗi nghiêm trọng · đã gắn sự kiện theo dõi · chữ hiển thị đã đưa vào tệp riêng · đã kiểm tra cỡ chữ lớn và trình đọc màn hình.

**Ra mắt khi:**

- Toàn bộ mục "Bắt buộc" xong và được kiểm thử trên ít nhất 8 thiết bị đại diện của cả hai hệ điều hành.
- Smart Nudge đạt từ 80% mức "tốt" ở bộ tình huống mẫu, và đạt 100% ở các tình huống khủng hoảng.
- Đã kiểm tra bảo mật, đặc biệt là không ai xem được dữ liệu của cặp khác.
- Đã rà soát pháp lý và quyền riêng tư (xem mục 6), chính sách có trong app và trên cửa hàng.
- Thử nghiệm kín đạt chỉ số ở mục 1, hoặc có kế hoạch cải thiện được thống nhất.

---

## 12. Rủi ro chính

| Rủi ro | Cách giảm |
| --- | --- |
| Chỉ một người dùng | Lời mời kèm quà, chế độ chờ, nhắc mời, đo tỷ lệ chấp nhận |
| Smart Nudge sai tông gây phản tác dụng | Bộ tình huống mẫu, nội dung dự phòng, nút 👍/👎, người dùng duyệt trước khi gửi, giới hạn số lượng |
| Check-in nhàm chán sau 2 đến 3 tuần | Gợi ý mỗi ngày đa dạng, gợi ý không lặp cấu trúc, giữ ít thao tác |
| Lộ dữ liệu cảm xúc | Mã hóa, đường link ngắn hạn, kiểm tra quyền ở mọi API, chỉ gửi AI phần dữ liệu cần thiết |
| Chi phí AI tăng theo số người dùng | Mức tối đa mỗi cặp mỗi ngày, dùng nội dung mẫu cho tình huống phổ biến |
| Cạnh tranh với Zalo, Messenger | Giá trị của app nằm ở Smart Nudge, không cạnh tranh ở nhắn tin |
| Cặp hết yêu xa nên bỏ app | Giai đoạn 2: hẹn hò và dòng thời gian cho cặp ở gần nhau |

**Giả định:** có ít nhất 1 lập trình viên mobile (dùng chung mã cho 2 hệ điều hành), 1 đến 2 lập trình viên backend, 1 designer, 1 người kiểm thử, 1 người quản lý sản phẩm. Ngân sách AI đã được duyệt.

---

## 13. Câu hỏi cần chốt trước khi bắt đầu code

| # | Câu hỏi | Ai quyết định |
| --- | --- | --- |
| 1 | Có bắt buộc số điện thoại khi đăng nhập không? (ảnh hưởng chi phí gửi mã và tỷ lệ hoàn tất đăng ký) | Quản lý sản phẩm |
| 2 | Chọn nhà cung cấp AI nào, và có cam kết không huấn luyện bằng dữ liệu của mình không? | Trưởng nhóm kỹ thuật, Pháp lý |
| 3 | Quy tắc tính "một ngày kết nối" khi hai người lệch múi giờ nhiều: dùng ngày UTC chung hay "cả hai hoàn thành trong 24 giờ"? | Quản lý sản phẩm, Dev |
| 4 | Nội dung và số điện thoại hỗ trợ khủng hoảng hiển thị ở Việt Nam là gì? | Quản lý sản phẩm, Pháp lý |
| 5 | Phân loại độ tuổi trên cửa hàng ứng dụng, và xử lý dữ liệu trẻ em (xem mục 6). Đã chốt: **không giới hạn tuổi khi đăng nhập**. | Quản lý sản phẩm, Pháp lý |
| 6 | Tên thương hiệu và bộ nhận diện để thiết kế giao diện | Người sáng lập |
| 7 | Tiny Moment lưu bao lâu: mãi mãi hay giới hạn dung lượng, thời gian? | Quản lý sản phẩm, Trưởng nhóm kỹ thuật |
| 8 | Chọn giải pháp link nhớ lời mời sau khi cài app (xem yêu cầu 1.6) | Trưởng nhóm kỹ thuật |