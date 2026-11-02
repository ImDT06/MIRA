# MIRA – Prototype giao diện web

Prototype front-end theo tài liệu SE215 (tab *UI Design System* và *Screen Inventory & User Flow*). Không có backend hay AI thật: dữ liệu lưu trong localStorage của trình duyệt, MIRA trả lời theo kịch bản.

## Chạy

```bash
npm install
npm run dev
```

Tài khoản mẫu: `minh@mira.demo` / `mira1234`. Mã OTP khi đăng ký mới: `123456`.

## Cấu trúc thư mục

```
src/
├─ App.tsx, main.tsx, index.css   Điểm vào, định tuyến, token thiết kế
├─ components/                    Dùng chung, không biết gì về nghiệp vụ
│  └─ ui/                         Thành phần theo Phụ lục B
├─ layout/                        Khung ứng dụng: thanh bên, thanh trên, chuông thông báo
├─ features/                      Mỗi khu vực chức năng một thư mục
│  ├─ auth/                       S01–S03
│  ├─ chat/                       S05 và kịch bản trả lời của MIRA
│  ├─ today/                      S04
│  ├─ memory/                     S07, S08
│  ├─ space/                      S09–S12
│  ├─ automation/                 S13, S14
│  ├─ permissions/                S06, S15, S16
│  └─ settings/                   S18
├─ store/                         Dữ liệu dùng chung, dữ liệu mẫu, thông báo và nhật ký
├─ lib/                           Hàm tiện ích
└─ demo/                          Công cụ demo, không thuộc sản phẩm
```

Khi nối backend, phần cần thay nằm chủ yếu ở `store/`, `features/*/actions.ts` và `features/chat/engine.ts`, `script.ts`.

## Tiến độ

| Bước | Nội dung | Trạng thái |
|---|---|---|
| 1 | Token, logo, khung responsive, thành phần ở Phụ lục B | Xong |
| 2 | F1: S01–S03, S04 ở trạng thái trống | Xong |
| 3 | Lõi chat: S05, S06, S16 và phần chat của F3–F6 | Xong |
| 4 | S04 đầy đủ (bản tin), S07–S12 | Xong |
| 5 | F7–F8: S13–S15, S17, S18 | Xong |

## Bảng điều khiển demo

Nút hình bình thí nghiệm (Ctrl+Shift+D để ẩn khi trình bày). Dùng để nhảy tới điểm bắt đầu của từng luồng, đổi Sáng/Tối, bật trạng thái đang tải/lỗi, mô phỏng lỗi mạng, gửi email thất bại, trùng giờ, và đặt lại toàn bộ dữ liệu. Có cả trang đối chiếu thành phần giao diện.

## Khác với tài liệu

Doc chỉ ràng buộc chức năng (màn hình, luồng, quy tắc). Giao diện (font, cỡ chữ, màu, thành phần) được chọn theo thẩm mỹ, không bám tab UI Design System. Font hiện dùng: Inter. Các điểm dưới đây cần nhóm cập nhật lại vào doc.

- **Màn chính là khung chat:** sau đăng nhập vào chat thay vì Trang chủ (ảnh hưởng F1, F2). S04 đổi tên thành "Hôm nay" (`/today`), đồng thời có check-in và tóm tắt ngay trên màn chat mới.
- **Điều hướng:** thanh bên gồm Trò chuyện mới, các mục, lịch sử chat và menu tài khoản, thu gọn được trên màn từ 1024 px. Dưới 1024 px là ngăn kéo mở bằng nút menu, thay cho thanh dưới cùng 5 mục và thanh icon 72 px của tablet.
- **Thanh trên cùng:** cao 56 px, không có tiêu đề cỡ Heading 1; tiêu đề trang nằm trong nội dung.
- **Tin nhắn:** MIRA không có bong bóng; tin của người dùng nền `bg/muted` thay vì `primary`.
- **Trò chuyện tạm thời:** là nút "Tạm thời" trên thanh trên cùng thay vì công tắc.

- **Chip đang chọn:** dùng nền `accent/soft`, viền `accent`, chữ `accent/strong` thay vì nền `accent` đặc, để không cạnh tranh với nút chính. Mọi nút thêm mới ghi rõ đối tượng ("Thêm việc", "Thêm sự kiện"...).
- **Bổ sung để giao diện chuyên nghiệp hơn, doc chưa có:** màn Hôm nay dạng 2 cột với dòng thời gian, tiến độ mục tiêu và thói quen; câu trả lời có định dạng; tìm nhanh Ctrl+K (tìm được cả khi gõ không dấu); ô chọn và lịch chọn ngày tự thiết kế; công cụ giao diện và demo chuyển vào menu tài khoản (Ctrl+Shift+D mở bảng demo).
- **Bổ sung khi rà từng màn, doc chưa có:** vạch giờ hiện tại và tô cột hôm nay trên lịch; số lượng trên bộ lọc việc; tiến độ "x/y xong" ở Việc ưu tiên; cảnh báo ở S07 khi Trí nhớ đang tắt; công tắc bật/tắt ngay trên S14; nút "Điền sẵn" tài khoản mẫu ở S01.
- **Dark Mode:** Toast dùng `text/on-primary` thay vì chữ trắng; lớp phủ hộp thoại cố định màu tối; thêm `success/soft` `#1D3A2E`, `warning/soft` `#3D2E14`, `danger/soft` `#43222A`.
- **Vị trí Toast:** riêng màn chat, toast nằm cao hơn ô nhập trên desktop và ở đầu màn hình trên điện thoại, vì đặt sát góc dưới sẽ che nút Gửi/Dừng. Các màn khác giữ góc dưới bên phải.
- **Check-in:** doc chỉ nêu "Bình thường" và "Mệt"; "Vui" và "Căng thẳng" là tạm đặt.
- **Bổ sung theo các agent hiện nay, doc chưa có:** nút + và kéo thả, dán ảnh/tệp vào chat (tối đa 5 tệp, mỗi tệp 10 MB); tìm, đổi tên, xoá cuộc trò chuyện; sửa tin nhắn gần nhất rồi gửi lại; nút về tin mới nhất.
- **Sở thích:** S18 có nút "Lưu vào Trí nhớ" theo FR-00, doc mục S18 chưa liệt kê.
- **S16:** làm dạng hộp thoại để quay lại S06 liền mạch.
- **Thẻ Bản tin:** nền navy ở Sáng, nền `bg/surface` ở Tối để không thành khối sáng lớn.
- **S10 và S06:** chỉ sửa hoặc xoá sự kiện nằm trên Google Calendar mới qua hộp xác nhận; sự kiện tự tạo (nhãn "Bạn tạo") lưu trong MIRA và có Hoàn tác. Doc chỉ có 2 nhãn Google và MIRA tạo.

## Giới hạn của bản demo

- Workflow không tự chạy theo giờ: lịch chạy chỉ được lưu, kết quả có khi bấm "Chạy ngay". Bản tin sáng hôm nay của tài khoản mẫu là dữ liệu có sẵn.
- Tính cách MIRA mới đổi câu mở đầu trong kịch bản chia sẻ áp lực. Ngôn ngữ và múi giờ chỉ được lưu, chưa làm đổi giao diện hay giờ hiển thị.
- Nút mic chỉ mô phỏng, điền sẵn một câu mẫu.
- Tệp đính kèm chỉ lưu tên, dung lượng và ảnh thu nhỏ; MIRA chưa đọc được nội dung tệp.
- "Tạo lại" chạy lại đúng kịch bản nên ra cùng nội dung.
- Dữ liệu mẫu của tài khoản Minh là nội dung giả; khi nâng phiên bản dữ liệu, bản lưu cũ của tài khoản này bị thay bằng bộ mới.
- Mật khẩu lưu dạng chữ thường trong localStorage, đừng dùng mật khẩu thật.
