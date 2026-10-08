# Các luồng chính của app (bản đầu)

**Phiên bản 1.1** · Đi kèm *Tài liệu yêu cầu sản phẩm v1.1*. Số như "yêu cầu 1.4" trỏ về đúng mục đó trong tài liệu yêu cầu.

**Cách đọc:** mỗi luồng là một sơ đồ ngắn kèm vài dòng lưu ý. Trong sơ đồ, **"Người dùng"** là người đang cầm điện thoại, **"Người yêu"** là người còn lại trong cặp. Hình thoi là chỗ rẽ nhánh.

## Danh sách luồng

| # | Luồng | Yêu cầu liên quan |
| --- | --- | --- |
| 1 | Vòng lặp giá trị chính | Mục 0 và 1 |
| 2 | Bắt đầu dùng và mời người yêu | 1.1 đến 1.5, 1.13 |
| 3 | Người yêu chấp nhận lời mời | 1.6 đến 1.8, 1.11 |
| 4 | Chế độ chờ và nhắc mời | 1.9, 1.10, 4.8 |
| 5 | Check-in hằng ngày | 2.1 đến 2.11 |
| 6 | Hệ thống tạo Smart Nudge | 3.1, 3.7 đến 3.10 |
| 7 | Người dùng xử lý Smart Nudge | 3.2 đến 3.5 |
| 8 | Gửi và nhận Tiny Moment | 4.1 đến 4.7 |
| 9 | Quyết định có gửi thông báo không | 5.1 đến 5.7 |
| 10 | Kết thúc kết nối và xóa tài khoản | 1.12, 6.6 |
| 11 | Một ngày điển hình (dùng để nghiệm thu) | Toàn bộ |

---

## 1. Vòng lặp giá trị chính

```mermaid
flowchart LR
    A["Người yêu check-in<br/>tâm trạng và lý do"] --> B["Người dùng thấy<br/>trạng thái đó"]
    B --> C["Smart Nudge<br/>gợi ý một việc nhỏ"]
    C --> D["Người dùng gửi<br/>Tiny Moment"]
    D --> E["Người yêu nhận,<br/>thấy được quan tâm"]
    E --> A
```

Mọi luồng sau đây có một mục đích: giữ cho vòng lặp này chạy liên tục. Hai chỗ dễ đứt nhất là **ghép đôi thất bại** (luồng 2 và 3) và **gợi ý không ai làm** (luồng 7).

---

## 2. Bắt đầu dùng và mời người yêu

```mermaid
flowchart TD
    S(["Mở app lần đầu"]) --> A["Giới thiệu ngắn về app"]
    A --> B["Đăng nhập bằng Apple, Google hoặc số điện thoại"]
    B --> C["Đồng ý Điều khoản và Chính sách quyền riêng tư"]
    C --> D["Bước 1: Thông tin cá nhân<br/>tên, biệt danh, múi giờ"]
    D --> E["Bước 2: Cách tôi muốn được quan tâm<br/>có thể bỏ qua"]
    E --> F["Chọn loại quan hệ<br/>yêu xa hoặc cùng thành phố"]
    F --> G["Bước 3: Tạo lời mời<br/>link và mã 6 ký tự, hết hạn sau 72 giờ"]
    G --> H{"Muốn gửi kèm quà?"}
    H -- "Có" --> I["Ghi âm, chụp ảnh hoặc viết lời nhắn"]
    H -- "Bỏ qua" --> J["Chia sẻ lời mời qua Zalo, Messenger..."]
    I --> J
    J --> K["Bước 4: Check-in lần đầu"]
    K --> L["Xin quyền gửi thông báo"]
    L --> M(["Vào chế độ chờ người yêu"])
```

**Lưu ý:**

- Tối đa 4 bước chính trước khi người dùng thấy giá trị. Bước nào không bắt buộc phải cho bỏ qua.
- Chỉ xin quyền thông báo **sau** khi check-in lần đầu, không xin ngay khi mở app.
- Không hỏi tuổi ở bước đăng nhập.
- Nếu người dùng đã thuộc một cặp khác, chặn ở bước tạo lời mời và giải thích lý do.

---

## 3. Người yêu chấp nhận lời mời

```mermaid
flowchart TD
    S(["Người yêu bấm link mời"]) --> A{"Đã cài app chưa?"}
    A -- "Chưa" --> B["Đưa tới cửa hàng ứng dụng"]
    B --> C["Cài và mở app"]
    C --> D["App nhận lại lời mời<br/>không phải nhập lại"]
    A -- "Rồi" --> D
    D --> E{"Lời mời còn dùng được?"}
    E -- "Hết hạn" --> X1["Báo: Lời mời đã hết hạn,<br/>hãy nhờ người mời tạo lại"]
    E -- "Đã dùng hoặc bị hủy" --> X2["Báo: Lời mời không còn hiệu lực"]
    E -- "Còn" --> F{"Đã đăng nhập chưa?"}
    F -- "Chưa" --> G["Đăng ký và đồng ý điều khoản"]
    F -- "Rồi" --> H
    G --> H{"Đã có cặp khác chưa?"}
    H -- "Có" --> X3["Báo lỗi, hướng dẫn kết thúc kết nối cũ"]
    H -- "Chưa" --> I["Nhập thông tin nhanh<br/>tên, biệt danh, múi giờ"]
    I --> J["Màn hình xác nhận<br/>hiện tên và ảnh người mời"]
    J --> K["Bấm Kết nối"]
    K --> L["Hệ thống tạo cặp,<br/>vô hiệu lời mời,<br/>giao quà nếu có"]
    L --> M["Cả hai nhận thông báo đã ghép"]
    M --> N["Người yêu mở quà"]
    N --> O(["Cả hai vào màn hình chính"])
    D -. "Link bị lỗi" .-> P["Nhập mã 6 ký tự bằng tay"]
    P --> E
```

**Cần kiểm thử kỹ:**

- Chức năng "nhận lại lời mời sau khi cài app" trên cả iPhone và Android.
- Lời mời hết hạn đúng sau 72 giờ.
- Hai người cùng bấm chấp nhận một lúc: chỉ một lần thành công, không được tạo ra hai cặp.

---

## 4. Chế độ chờ và nhắc mời

```mermaid
flowchart TD
    A(["Người mời ở chế độ chờ"]) --> B["Màn hình: Đang chờ người yêu<br/>hiện trạng thái lời mời"]
    B --> C["Vẫn check-in được<br/>và soạn sẵn quà"]
    B --> D["Xem ý tưởng quan tâm chung"]
    B --> T{"Đã chờ bao lâu?"}
    T -- "24 giờ" --> R1["Nhắc lần 1<br/>kèm gợi ý cách nhắn người yêu"]
    T -- "48 giờ" --> R2["Nhắc lần 2"]
    T -- "72 giờ" --> R3["Nhắc lần 3"]
    R3 --> X{"Lời mời hết hạn?"}
    X -- "Có" --> Y["Hiện nút Gửi lại lời mời<br/>link cũ hết hiệu lực"]
    Y --> B
    X -- "Người yêu đã chấp nhận" --> Z(["Ghép đôi thành công<br/>giao quà đã soạn"])
```

Nhắc tối đa 3 lần, dừng ngay khi ghép xong.

---

## 5. Check-in hằng ngày

```mermaid
flowchart TD
    T(["Đến giờ nhắc hoặc người dùng tự mở"]) --> A["Màn hình check-in"]
    A --> B["Chọn tâm trạng 1 đến 5"]
    B --> C["Chọn tối đa 3 lý do"]
    C --> D["Ghi chú thêm, không bắt buộc"]
    D --> E{"Mức chia sẻ"}
    E -- "Chỉ mình tôi" --> L["Lưu riêng<br/>không báo người yêu<br/>không tạo Smart Nudge"]
    E -- "Đầy đủ hoặc chỉ tâm trạng" --> F{"Có mạng không?"}
    F -- "Không" --> G["Lưu tạm trên máy<br/>có mạng thì gửi"]
    F -- "Có" --> H["Gửi lên hệ thống"]
    G --> H
    H --> I["Hệ thống lưu, báo người yêu<br/>và bắt đầu tạo Smart Nudge (luồng 6)"]
    L --> J
    I --> J["Hiện: Đã cập nhật"]
    J --> K{"Người yêu đã check-in hôm nay chưa?"}
    K -- "Rồi" --> M["Chuyển ngay tới Smart Nudge<br/>dành cho người dùng (luồng 7)"]
    K -- "Chưa" --> N["Về màn hình chính<br/>hiện Chưa cập nhật hôm nay<br/>và nút gửi tín hiệu nhẹ"]
```

**Quy tắc:** check-in nhiều lần trong ngày được, lần mới nhất là trạng thái hiện tại. "Ngày" tính theo múi giờ của từng người.

---

## 6. Hệ thống tạo Smart Nudge

```mermaid
flowchart TD
    E(["Người yêu vừa check-in"]) --> A{"Có chia sẻ cho người dùng?"}
    A -- "Chỉ mình họ" --> X1(["Dừng, không tạo"])
    A -- "Có" --> B{"Quá giới hạn?<br/>3 gợi ý mỗi ngày,<br/>hoặc gợi ý cũ chưa xử lý<br/>và mới tạo dưới 4 giờ"}
    B -- "Có" --> X2(["Dừng, không tạo thêm"])
    B -- "Không" --> C{"Ghi chú có dấu hiệu<br/>khủng hoảng?"}
    C -- "Có" --> D["Tạo gợi ý an toàn:<br/>khuyến khích liên lạc trực tiếp<br/>kèm thông tin hỗ trợ"]
    C -- "Không" --> F["Gom thông tin:<br/>tâm trạng, lý do, ghi chú,<br/>giờ của người yêu,<br/>cách muốn được quan tâm,<br/>5 gợi ý gần nhất"]
    F --> G["Gọi AI, chờ tối đa 6 giây"]
    G --> H{"AI trả lời đúng định dạng<br/>và qua bộ lọc nội dung?"}
    H -- "Không" --> I["Dùng nội dung mẫu<br/>theo tâm trạng và lý do"]
    H -- "Có" --> J
    I --> J["Lưu gợi ý<br/>ghi rõ nguồn: AI hay nội dung mẫu"]
    D --> J
    J --> K["Gửi thông báo cho người dùng"]
    K --> Z(["Gợi ý sẵn sàng"])
```

**Quy tắc quan trọng:**

- 95% gợi ý phải tạo xong trong dưới 4 giây.
- **Người dùng không bao giờ thấy lỗi AI.** AI hỏng thì dùng nội dung mẫu.
- Gợi ý hết hạn sau 24 giờ.

---

## 7. Người dùng xử lý Smart Nudge

```mermaid
flowchart TD
    A(["Người dùng mở gợi ý<br/>từ thông báo, màn hình chính<br/>hoặc sau khi check-in"]) --> B["Hiện: nhận xét + việc nên làm<br/>+ nội dung soạn sẵn"]
    B --> C{"Người dùng chọn"}
    C -- "Làm ngay" --> D["Mở khung soạn đúng loại<br/>nội dung điền sẵn"]
    C -- "Sửa nội dung" --> E["Sửa nội dung soạn sẵn"]
    E --> D
    C -- "Để sau" --> F["Nhắc lại sau 2 giờ<br/>chỉ một lần"]
    C -- "Bỏ qua" --> G["Đóng gợi ý"]
    D --> H["Gửi đi (luồng 8)<br/>nội dung hiện là của người dùng<br/>không ghi là AI viết"]
    H --> I["Hỏi nhanh: 👍 hay 👎"]
    G --> I
    I --> J{"Chọn 👎?"}
    J -- "Có" --> K["Chọn lý do:<br/>sai tông, quá chung chung,<br/>không hợp lúc này,<br/>không phải kiểu của chúng tôi, khác"]
    J -- "Không" --> Z(["Xong"])
    K --> Z
    F --> A
```

**Đây là luồng đo xem sản phẩm có giá trị thật không.** Hai chỉ số cần theo dõi: tỷ lệ bấm "Làm ngay" (mục tiêu từ 15%) và tỷ lệ 👎 vì "sai tông" (dưới 10%). Nếu chưa đạt, sửa nội dung gợi ý trước khi làm thêm tính năng khác.

---

## 8. Gửi và nhận Tiny Moment

```mermaid
sequenceDiagram
    autonumber
    actor A as Người gửi
    participant App as App
    participant BE as Hệ thống
    participant Kho as Kho lưu tệp
    participant TB as Dịch vụ thông báo
    actor B as Người nhận

    A->>App: Chọn loại: ảnh, ghi âm, lời nhắn, tín hiệu
    alt Có ảnh hoặc ghi âm
        App->>App: Thu nhỏ ảnh, hoặc ghi âm tối đa 30 giây và nghe lại
        App->>BE: Xin link tải tệp lên
        BE-->>App: Link tải lên (ngắn hạn)
        App->>Kho: Tải tệp lên
    end
    A->>App: Bấm Gửi
    App->>BE: Gửi Tiny Moment
    BE->>BE: Lưu, cập nhật số ngày kết nối
    BE-->>App: Đã gửi, hiện trong dòng chung
    BE->>TB: Thông báo loại C
    TB-->>B: Người yêu vừa gửi cho bạn
    B->>App: Mở dòng chung
    App->>BE: Lấy danh sách
    BE-->>App: Danh sách kèm link xem tệp (ngắn hạn)
    BE-->>A: Đã xem (nếu bật)
    B->>App: Thả biểu tượng hoặc trả lời
    App->>BE: Gửi phản hồi
    BE->>TB: Thông báo loại D (gom trong 15 phút)
    TB-->>A: Có phản hồi
```

**Trường hợp đặc biệt:**

- Tải tệp lỗi giữa chừng: giữ bản nháp, cho thử lại.
- Người gửi xóa: xóa cho cả hai bên, tệp gốc bị xóa, link cũ không mở được.
- **Cách tính số ngày kết nối (nên có):** một ngày được tính khi cả hai đều có ít nhất 1 hoạt động. Hôm sau nếu chỉ có một người hoặc không ai hoạt động thì số quay về 0, kỷ lục vẫn giữ, không gửi thông báo, không hiện chữ "mất". Cách xử lý khi hai người lệch múi giờ lớn đang chờ chốt (câu hỏi 3 trong tài liệu yêu cầu).

---

## 9. Quyết định có gửi thông báo không

Luồng này dùng chung cho cả 8 loại thông báo (A đến H, xem mục 4.5 tài liệu yêu cầu).

```mermaid
flowchart TD
    E(["Có việc cần báo cho người dùng"]) --> A{"Người dùng có bật loại này?"}
    A -- "Tắt" --> X1(["Bỏ qua"])
    A -- "Bật" --> B{"Là loại F (đã ghép đôi)<br/>hoặc thông báo bảo mật?"}
    B -- "Phải" --> S
    B -- "Không" --> C{"Hôm nay đã đủ 4 thông báo?"}
    C -- "Đủ" --> D{"Quan trọng hơn<br/>thông báo đã gửi?"}
    D -- "Không" --> X2(["Bỏ qua hoặc gộp vào lần sau"])
    D -- "Có" --> Q
    C -- "Chưa" --> Q{"Đang trong giờ yên tĩnh<br/>của người nhận?"}
    Q -- "Có" --> W["Giữ lại đến hết giờ yên tĩnh"]
    Q -- "Không" --> K
    W --> K{"Là nhắc check-in<br/>mà họ đã check-in rồi?"}
    K -- "Đúng" --> X3(["Hủy nhắc"])
    K -- "Không" --> P{"Bật chế độ riêng tư?"}
    P -- "Có" --> G["Nội dung chung chung<br/>không lộ lý do hay ghi chú"]
    P -- "Không" --> H["Nội dung đầy đủ"]
    G --> S
    H --> S["Gửi thông báo<br/>bấm vào mở đúng màn hình"]
```

**Thứ tự ưu tiên khi vượt mức 4 thông báo:** B > C > D > A > G.

---

## 10. Kết thúc kết nối và xóa tài khoản

```mermaid
flowchart TD
    A(["Người dùng vào Cài đặt"]) --> B{"Chọn gì?"}
    B -- "Kết thúc kết nối" --> C["Cảnh báo: sẽ mất quyền<br/>xem dữ liệu chung"]
    B -- "Xóa tài khoản" --> M["Giải thích dữ liệu sẽ bị xóa<br/>và gợi ý tải dữ liệu trước"]
    C --> D{"Xác nhận lần 1?"}
    D -- "Không" --> Z(["Hủy"])
    D -- "Có" --> E["Xác nhận lần 2"]
    M --> N{"Muốn tải dữ liệu về?"}
    N -- "Có" --> O["Tạo tệp, gửi link tải"]
    N -- "Không" --> P["Xác nhận lần 2"]
    O --> P
    P --> Q["Đăng xuất khỏi mọi thiết bị"]
    Q --> R{"Đang có cặp?"}
    R -- "Có" --> E
    R -- "Không" --> V["Đánh dấu đã xóa<br/>dữ liệu cá nhân bị xóa trong tối đa 30 ngày"]
    E --> F["Cặp chuyển sang đã kết thúc<br/>hẹn ngày dọn dữ liệu chung sau 30 ngày"]
    F --> G["Cả hai mất quyền xem dữ liệu chung"]
    F --> H["Người kia nhận thông báo trung tính<br/>không nêu lý do"]
    G --> I["Trong 30 ngày: mỗi người<br/>tải được dữ liệu của mình"]
    I --> J["Hết 30 ngày: xóa dữ liệu chung"]
    G --> K(["Mỗi người có thể mời<br/>hoặc nhận lời mời mới"])
    G -. "Nếu đang xóa tài khoản" .-> V
```

---

## 11. Một ngày điển hình (dùng để nghiệm thu)

**Kịch bản:** Linh ở Hà Nội, Nam ở New York, lệch nhau 12 giờ. Hai người đã ghép đôi.

```mermaid
sequenceDiagram
    autonumber
    actor L as Linh (Hà Nội)
    participant BE as Hệ thống và AI
    actor N as Nam (New York)

    L->>BE: Check-in 20:00: Căng thẳng, Công việc, "Mai nộp deadline"
    BE->>BE: Tạo Smart Nudge cho Nam (AI, có nội dung mẫu dự phòng)
    BE-->>N: Thông báo: Linh đang căng thẳng vì deadline
    N->>BE: Mở gợi ý, bấm Làm ngay (ghi âm 20 giây, lời gợi ý điền sẵn)
    N->>BE: Gửi ghi âm
    BE-->>L: Thông báo: Nam gửi ghi âm cho bạn
    L->>BE: Nghe xong, thả biểu tượng ❤️
    BE-->>N: Thông báo: Linh đã phản hồi
    N->>BE: Check-in lúc 20:00 giờ New York: Mệt, Công việc
    BE-->>L: Thông báo kèm Smart Nudge cho Linh
    Note over BE: Cuối ngày cả hai đều có hoạt động, số ngày kết nối tăng 1
```

**Đạt khi:**

- Mọi thông báo đến đúng giờ địa phương của người nhận, không rơi vào giờ yên tĩnh.
- Gợi ý nhắc đúng chuyện "deadline".
- Nam gửi được sau tối đa 2 thao tác kể từ khi mở gợi ý.
- Dữ liệu trên hai điện thoại khớp nhau trong tối đa 5 giây khi cả hai đang mở app.

---

## Phụ lục: Vòng đời của các đối tượng chính

| Đối tượng | Các trạng thái và cách chuyển |
| --- | --- |
| Cặp | Đang chờ → (người kia chấp nhận) → Đang hoạt động → (kết nối bị kết thúc hoặc xóa tài khoản) → Đã kết thúc → (sau 30 ngày) → Dữ liệu bị xóa |
| Lời mời | Đang mở → Đã chấp nhận, hoặc Hết hạn, hoặc Bị hủy |
| Smart Nudge | Mới → Đã làm, hoặc Để sau (quay lại Mới một lần), hoặc Bỏ qua, hoặc Hết hạn sau 24 giờ |
| Check-in | Đầy đủ, hoặc Chỉ tâm trạng, hoặc Chỉ mình tôi (không báo người yêu, không tạo Smart Nudge) |

## Phụ lục: Việc cần chốt trước khi vẽ giao diện

1. Cách tính số ngày kết nối khi lệch múi giờ lớn (ảnh hưởng luồng 8 và 11).
2. Có bắt buộc số điện thoại khi đăng nhập không (ảnh hưởng luồng 2 và 3).
3. Nội dung và số điện thoại hỗ trợ khủng hoảng (ảnh hưởng luồng 6).
4. Giải pháp link nhớ lời mời sau khi cài app (ảnh hưởng luồng 3).
5. Màn hình Smart Nudge quyết định giá trị của cả sản phẩm, nên thiết kế và cho người thật dùng thử trước các màn hình khác.