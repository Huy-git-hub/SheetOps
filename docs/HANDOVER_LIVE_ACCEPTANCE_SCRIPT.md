# Kịch bản hướng dẫn trực tiếp và nghiệm thu SheetOps

**Dành cho:** em hướng dẫn, anh là người nhận và chủ hệ thống.  
**Bối cảnh:** thao tác trên máy của anh, bằng tài khoản của anh.  
**Mục đích:** anh hiểu hệ thống, tự sở hữu tài nguyên, nhìn thấy một quy trình nghiệp vụ chạy thật và biết cách sử dụng sau khi em về.  
**Tài liệu này là kịch bản để thực hiện, chưa phải biên bản xác nhận các bước cloud đã PASS.**

## 1. Đầu buổi: nói gì để anh hiểu trong 3 phút

**Em nói:**

> “Hôm nay mình làm hai việc. Đầu tiên, em giúp anh dựng một website thuộc tài khoản của anh, không dùng database hay mật khẩu của em. Sau đó, anh tự nhập thử đơn, kiểm tra doanh thu, phân quyền và xuất Google Sheets. Cuối buổi anh phải biết đăng nhập ở đâu, dữ liệu nằm đâu, khi lỗi cần xem đâu và muốn sửa tính năng thì yêu cầu như thế nào.”

Giải thích bằng bảng này, không cần bắt anh nhớ các từ kỹ thuật ngay:

| Thành phần                   | Cách nói với anh                                                               | Anh cần giữ quyền gì?                         |
| ---------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------- |
| GitHub                       | “Tủ giữ bản thiết kế và lịch sử sửa website.”                                  | Sở hữu repository, quyền quản lý thành viên   |
| Vercel                       | “Nơi chạy website để anh mở bằng đường link.”                                  | Sở hữu project, domain và cấu hình deploy     |
| Supabase PostgreSQL          | “Kho dữ liệu chính: đơn hàng, tài khoản có quyền gì, lịch sử thao tác.”        | Sở hữu project và cách sao lưu/khôi phục      |
| Supabase Auth                | “Bộ phận kiểm tra email, mật khẩu và phiên đăng nhập.”                         | Quản lý tài khoản đăng nhập                   |
| Google Cloud service account | “Tài khoản máy để website được phép đọc/ghi đúng file Sheets.”                 | Quản lý tài khoản máy và key bí mật           |
| Google Sheets                | “Nguồn nhập lần đầu và bản xuất để xem/chia sẻ; không phải kho dữ liệu chính.” | Sở hữu file, quản lý Share                    |
| SMTP                         | “Dịch vụ gửi thư mời để người dùng đặt mật khẩu.”                              | Quản lý sender, thông tin gửi mail và hạn mức |

**Câu hỏi kiểm tra lại:** “Nếu anh sửa trực tiếp một ô ở Export_Orders, website có tự cập nhật theo không?”  
**Câu trả lời cần hiểu:** Không. Website lấy dữ liệu từ PostgreSQL; lần export sau có thể thay nội dung tab xuất.

## 2. Chốt phạm vi trước khi bấm tạo tài nguyên

**Em hỏi:**

> “Tối nay mình diễn tập bằng dữ liệu giả, hay đưa dữ liệu thật vào để dùng luôn? Anh đồng ý mình tạo tài nguyên trong tài khoản anh và chạy những thao tác nào? Nếu dịch vụ yêu cầu trả phí thì mình dừng để anh quyết định.”

Ghi lựa chọn trước khi làm:

- [ ] **A — Diễn tập bằng dữ liệu giả:** dùng database và Spreadsheet mới, riêng cho buổi nghiệm thu. Đây là đường đi mặc định của kịch bản dưới.
- [ ] **B — Dùng thật ngay:** không nhập bộ dữ liệu giả dưới vào database thật. Dùng nhánh hướng dẫn ở mục 12; phải có dữ liệu thật đã duyệt, backup và kế hoạch nghiệm thu phù hợp.

**Điểm rất dễ nhầm:** chỉ import khi Orders trống hoàn toàn, kể cả các đơn đã ẩn. Ẩn dữ liệu giả không làm database trở về trạng thái chưa import. Với A, lúc chuyển sang dùng thật hãy chuẩn bị database/Sheet trống riêng theo kế hoạch được duyệt, không xóa/reset database diễn tập để “làm sạch” theo thói quen. Nếu không có quota miễn phí cho tài nguyên riêng, dừng phần cloud hoặc chia buổi; không tự mua thêm.

Tên môi trường cũng cần giải thích:

> “Production trên Vercel nghĩa là bản website chính của project đó. Nếu project này được tạo riêng để diễn tập thì nó vẫn chỉ chứa dữ liệu giả. Nó không phải hệ thống đang chạy của em và chưa phải lời hứa đã sẵn sàng cho dữ liệu thật của anh.”

Nếu theo A và đây là một project diễn tập độc lập chưa có môi trường staging, `APP_ENV=production` khai báo đúng backend/Sheet của **project diễn tập mới**. Không tự điền ref giả để vượt guard staging. Staging/Preview đúng nghĩa cần tài nguyên độc lập theo [chương 11](setup/11-staging.md).

## 3. Chuẩn bị và phân chia thời gian

Khung tham khảo cho buổi cùng làm từ đầu: khoảng 3–4 giờ; đây là dự trù, không cam kết. Nếu source, tài khoản và cấu hình đã sẵn thì phần trình diễn nghiệp vụ khoảng 45–60 phút. DNS, xác minh sender, tải phần mềm hoặc hạn mức dịch vụ có thể khiến phải hẹn tiếp.

| Chặng | Việc cần xong                                              | Dự trù                        |
| ----- | ---------------------------------------------------------- | ----------------------------- |
| 1     | Hiểu hệ thống, chọn diễn tập/dùng thật, kiểm tra tài khoản | 15 phút                       |
| 2     | Source và repository riêng                                 | 15–25 phút                    |
| 3     | Database/Auth, Google Cloud/Sheets và cấu hình local       | 50–80 phút                    |
| 4     | First Admin, Vercel và SMTP                                | 35–60 phút, chưa tính chờ DNS |
| 5     | Anh tự thực hiện kịch bản nghiệp vụ                        | 45–60 phút                    |
| 6     | Tổng kết, hướng dẫn vận hành, ghi mục còn chờ              | 15 phút                       |

Chuẩn bị trước khi tới máy anh:

- [ ] ZIP đúng full SHA đã PASS CI, manifest và biên bản cùng bản; không mang `.env.local`, key JSON hoặc mật khẩu của em.
- [ ] Máy anh có Node.js 24, npm và Git; có thể cài editor. Docker chỉ cần cho bài kiểm thử database/backup bằng tooling local, không phải điều kiện để mở website đã deploy.
- [ ] Anh đăng nhập được GitHub, Supabase, Google và Vercel của mình, có quyền xác minh email/2FA.
- [ ] Một mailbox Admin và một mailbox người dùng thử mà anh/em có thể thực sự nhận thư. Không giả định địa chỉ alias nào cũng được nhà cung cấp hỗ trợ.
- [ ] Có phương án SMTP/sender; nếu cần xác thực domain gửi thì anh có quyền DNS. Domain website miễn phí của Vercel không tự cho quyền DNS của domain email.
- [ ] Internet ổn định, nơi lưu secrets riêng và nơi lưu bằng chứng đã che thông tin nhạy cảm.

**Quy tắc khi ngồi cạnh nhau:** anh tự đăng nhập và giữ password/2FA. Em hướng dẫn thao tác; không chụp secret, không dán toàn bộ env vào chat, không đẩy JSON key lên GitHub.

## 4. Chặng dựng hệ thống — em hướng dẫn, anh thao tác

### 4.1. Nhận source và tạo GitHub riêng

**Em nói:** “Mình nhận đúng bản đã kiểm tra; anh không clone nhầm main cũ của em.”

1. Đối chiếu full SHA và SHA-256 ZIP với biên bản. Giải nén vào thư mục mới trên máy anh.
2. Mở thư mục có README/package.json; không giải nén đè lên dự án khác.
3. Anh tạo **Private repository trống** tại [GitHub New repository](https://github.com/new).
4. Làm theo [chương 2](setup/02-github.md): khởi tạo main, commit bằng danh tính Git của anh, thêm origin mới, push main, tạo/push dev. Không cần nhánh handover trong repository mới.
5. Mở repository trên web, chỉ vào tên Owner; vào Actions xem đúng commit.

**PASS khi:** repository thuộc anh, main/dev cùng nội dung khởi tạo, không env riêng tư/keys/dependencies trong danh sách file. SHA commit khởi tạo mới có thể khác source SHA vì anh tạo lịch sử mới; đó là bình thường.

### 4.2. Tạo kho dữ liệu và cấu trúc ban đầu

**Em nói:** “Tạo project mới giống như chuẩn bị một kho trống. Chạy migrations là dựng các ngăn và ổ khóa của kho, chưa tự nhập đơn.”

1. [Supabase Dashboard](https://supabase.com/dashboard) → New project, tổ chức của anh, tên rõ là diễn tập nếu chọn A; lưu database password riêng. Dừng nếu yêu cầu billing ngoài phạm vi anh duyệt.
2. Lấy ref, URL, publishable key và secret key theo [chương 3](setup/03-supabase.md). Public key có thể tới browser; secret key chỉ trên server.
3. Xác nhận đây là database mới trống. Anh đồng ý áp schema trên project mới này, rồi mới chạy **đúng bảy migrations theo thứ tự chương 3** trong SQL Editor, từng file một.
4. Lưu nhật ký file/version, hash, thời điểm và kết quả; không nhấn Run lại khi chưa biết lần trước đã chạy tới đâu.
5. Kiểm tra đủ bảng và RLS; Orders/Profile ban đầu chưa có dữ liệu. Auth bật Email, tắt public signup; thêm đúng URL local theo chương 3.

**PASS khi:** SQL không lỗi, đủ schema/RLS, chưa có business data. Đưa anh xem Orders trống để làm bằng chứng trước import. Không coi việc có bảng là đã kiểm chứng hosted Auth.

### 4.3. Tạo tài khoản máy Google và file Sheets

**Em nói:** “Mình không đưa mật khẩu Google của anh vào website. Mình cấp cho tài khoản máy quyền trên đúng file cần dùng.”

1. [Google Cloud Console](https://console.cloud.google.com/) → tạo project mới → APIs & Services → Library → Google Sheets API → Enable.
2. IAM & Admin → Service Accounts → tạo account → Keys → tạo JSON key, lưu ngoài thư mục source.
3. Lấy `client_email` và nội dung `private_key` theo [chương 4](setup/04-google-cloud.md). Không đưa nguyên JSON hoặc đường dẫn file vào biến private key.
4. [Google Sheets](https://sheets.google.com/) → file mới → tạo Source_Orders, Export_Orders, Export_Staging. Share cho service account email quyền Editor.
5. Lấy ID file từ URL, không lấy gid của tab. Giữ hai tab export trống; Source sẽ chuẩn bị ở mục 5.

**PASS khi:** file thuộc anh, ba tab đúng tên và đúng email máy có quyền Editor; chưa kết luận API hoạt động cho tới khi web kiểm tra kết nối thành công.

### 4.4. Cấu hình và chạy local

**Em nói:** “File env là giấy chỉ đường và các chìa khóa để website biết dùng kho/file nào. File này không được đưa lên GitHub.”

PowerShell ở thư mục source của anh:

```powershell
node --version
npm --version
git --version
npm ci
if (-not (Test-Path -LiteralPath .env.local)) {
    Copy-Item -LiteralPath .env.example -Destination .env.local
} else {
    Write-Output '.env.local da co; mo kiem tra, khong ghi de'
}
```

Copy chỉ khi `.env.local` **chưa có**; nếu đã tồn tại, mở kiểm tra, không ghi đè. Điền [bảng env](setup/ENVIRONMENT.md) bằng tài nguyên mới:

- APP_ENV=production cho target mới đã chốt ở mục 2; production ref khớp URL, không có staging ref trong cấu hình này.
- URL/publishable key/secret key đều cùng một Supabase project.
- Email/private key thuộc account máy vừa tạo.
- GOOGLE_SPREADSHEET_ID và PRODUCTION_GOOGLE_SPREADSHEET_ID cùng là file mới của buổi này.
- APP_ORIGIN=http://localhost:3000; CRON_SECRET sinh ngẫu nhiên và lưu riêng.

Giữ đúng newline trong Google key theo [chương 6](setup/06-local.md), không tự sửa phần thân key. Kiểm tra Git ignore rồi chạy:

```powershell
git check-ignore .env.local
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

**PASS khi:** các checks thành công, localhost:3000 có trang login, env không bị Git theo dõi. Chưa có Admin nên chưa đăng nhập được là bình thường. Một terminal chạy dev phải tiếp tục mở; dùng terminal khác cho bootstrap.

### 4.5. Tạo Admin đầu tiên

**Em nói:** “Tạo tài khoản đăng nhập chưa tự cấp quyền quản trị. Em chỉ cấp First Admin cho đúng tài khoản của anh.”

1. Supabase → Authentication → Users → Add user → tạo email/password của anh, xác nhận email bằng trusted dashboard nếu có tùy chọn.
2. Copy UID, đặt BOOTSTRAP_ADMIN_ID và BOOTSTRAP_ADMIN_NAME vào file env riêng tư theo [chương 8](setup/08-first-admin.md).
3. Anh xác nhận đúng project và user cần cấp Admin rồi chạy:

```powershell
npm run admin:bootstrap
```

4. Đăng nhập local; mở Người dùng, Đồng bộ và Cài đặt. Kiểm tra profile Admin active/audit qua hướng dẫn, xóa hai giá trị bootstrap khỏi file sau khi xong.

**PASS khi:** anh đăng nhập được Admin và thấy các trang quản trị. Không cần chạy bootstrap lần hai chỉ để trình diễn; kiểm thử tự động đã có kiểm tra chặn trùng. Không reset quyền hoặc xóa Admin khi gặp lỗi.

### 4.6. Đưa website lên Vercel

**Em nói:** “Local chạy nhờ máy anh. Bản Vercel để anh mở link từ thiết bị khác, không cần giữ npm run dev trên máy.”

1. Anh xác nhận muốn triển khai project mới → [Vercel Dashboard](https://vercel.com/dashboard) → Add New → Project → chọn repository của anh, framework Next.js, build npm run build.
2. Production Branch=main. Nhập cấu hình target mới vào scope **Production** theo [chương 7](setup/07-vercel.md), không bật chung Preview với secrets này, không thêm bootstrap vars hoặc migration/seed vào build.
3. Deploy lấy domain HTTPS. Cập nhật APP_ORIGIN trong Vercel về origin đó; Redeploy. Trong Supabase, cập nhật Site URL và allowlist đúng origin/auth/accept, origin/auth/callback.
4. Từ đây làm nghiệm thu trên **URL Vercel của anh**, không vô tình kiểm tra localhost hoặc website cũ của em. Nếu lại dùng local gửi invite thì phải kiểm tra APP_ORIGIN local tương ứng; đừng trộn hai đường link.

**PASS khi:** deployment đúng commit và Ready; link mới mở login từ browser/thiết bị khác. Không promote bundle Preview dùng backend staging sang Production. Ready chưa chứng minh database/Sheets/invitation đúng.

### 4.7. Nối SMTP trước khi trình diễn mời user

**Em nói:** “Mời được trên màn hình chưa có nghĩa thư đã vào hộp thư. Mình sẽ mở inbox thật để kiểm chứng.”

1. Theo [chương 9](setup/09-smtp.md), dùng SMTP của anh, xác minh sender/domain nếu được yêu cầu. Ví dụ có thể dùng Brevo; không tự nâng gói.
2. Supabase → Authentication → Email/Emails → SMTP Settings → Enable custom SMTP → điền Host, Port, Username, Password, Sender, Save.
3. Không đặt SMTP password vào source/Vercel env của ứng dụng; SMTP cấu hình tại Supabase.
4. Nếu chờ DNS/sender hoặc tài khoản chưa được phép gửi, ghi **BLOCKED SMTP**. Có thể tiếp tục phần Admin/CRUD, nhưng không ký PASS invitation.

**PASS khi:** test case UAT-04 bên dưới nhận được thư thật, đặt password và login đúng website. Default SMTP Supabase có giới hạn gửi, không coi nó là cấu hình gửi thư Production hoàn chỉnh. [Tài liệu chính thức](https://supabase.com/docs/guides/auth/auth-smtp).

## 5. Bộ dữ liệu giả dùng để đối chiếu bằng mắt

**Chỉ dùng cho lựa chọn A.** Không đưa vào database thật đã có dữ liệu hoặc chuẩn bị import dữ liệu thật.

Trong Source_Orders, chọn cột A:F → Format → Number → Plain text. Dán nguyên khối TSV dưới vào A1; mỗi giá trị phân tách bằng tab, không phải một chuỗi vào một ô:

```text
order_code	customer_name	order_date	status	total_amount	note
UAT-001	Khách hàng thử A	2026-11-05	completed	100000	Dữ liệu giả nghiệm thu
UAT-002	Khách hàng thử B	2026-11-05	pending	200000	Dữ liệu giả nghiệm thu
UAT-003	Khách hàng thử C	2026-11-05	cancelled	300000	Dữ liệu giả nghiệm thu
```

Ngày minh họa là 05/11/2026; nếu đổi ngày, cập nhật bộ lọc tương ứng. Không đổi mã giữa các test case hoặc chạy import lại để “bắt đầu lần nữa”.

Chuẩn bị hai phiên browser **khác kho cookie**: phiên Admin và phiên User thử. Có thể dùng hai browser hoặc hai profiles riêng. Hai cửa sổ ẩn danh của cùng browser có thể dùng chung phiên ẩn danh; không coi chúng là hai tài khoản độc lập.

Trước khi so KPI: chọn cùng khoảng ngày gồm ngày dữ liệu, trạng thái Tất cả và xóa search. Sau mutation chuyển/refresh đúng màn hình, chờ cập nhật xong rồi so. Một đơn được tạo ở tab khác chưa hiện ngay trên màn hình đang mở không tự chứng minh mất dữ liệu; refresh lại để kiểm tra.

## 6. Kịch bản nghiệm thu nghiệp vụ — để anh tự bấm

Mỗi test: em giải thích một câu → anh thao tác → hai người đối chiếu kết quả → ghi PASS/FAIL/BLOCKED. Không tick trước vì CI đã xanh.

### UAT-01 — Đăng nhập và phiên làm việc

**Em nói:** “Người không đăng nhập không được mở dữ liệu nội bộ. Anh thử tự vào xem.”

1. Mở URL/orders trong phiên chưa đăng nhập → phải về login.
2. Anh đăng nhập Admin, mở Dashboard/Đơn hàng, refresh trang → vẫn có phiên và đúng người dùng.
3. Đăng xuất, mở lại /orders → lại về login. Đăng nhập lại để tiếp tục.

**PASS:** không đọc dữ liệu nội bộ khi chưa login; phiên đúng người, logout có tác dụng. Không thử password sai hàng loạt gây rate limit.

### UAT-02 — Kết nối Sheets và import đúng một lần

**Em nói:** “Mình xem trước để kiểm tra, rồi anh mới đồng ý nhập. Đây là nhập ban đầu, không phải đồng bộ hai chiều.”

1. Admin → **Trung tâm đồng bộ** → kiểm tra kết nối theo nút hiển thị; phải đọc được file mới.
2. Bấm **Xem trước nhập** → cần 3 dòng hợp lệ, 0 lỗi. Đối chiếu UAT-001/002/003 và tiền.
3. Anh đồng ý rồi bấm **Xác nhận nhập 3 đơn**, xác nhận dialog.
4. Mở Đơn hàng → có đúng 3 đơn; refresh vẫn còn. Source_Orders không bị ghi đè; lịch sử đồng bộ ghi import thành công 3 dòng.
5. Dashboard/Báo cáo cùng bộ lọc → tổng 3 đơn, hoàn thành 1, doanh thu **100.000 VND**. Đơn pending/cancelled không cộng doanh thu.

**PASS:** khớp dữ liệu và số tiền; lưu screenshot không chứa secrets. Sau import, preview/import lại phải báo Orders đã có dữ liệu hoặc không cho Confirm. Không xóa/ẩn đơn để ép import lại.

### UAT-03 — Dữ liệu không hợp lệ phải bị từ chối

**Em nói:** “Không phải cứ nhập được vào ô là hệ thống được phép lưu.”

1. Thử tạo mã UAT-001 lần nữa → không lưu trùng.
2. Thử trường bắt buộc trống, tiền âm hoặc tiền lẻ → form/API phải chặn, không tạo thêm đơn.
3. Kiểm tra ngày có thật. Nếu input ngày của browser không cho gõ ngày vô lý thì ghi nhận chặn tại UI; không cố lách bằng công cụ lạ. Ngày sai như 2026-02-30 còn được bộ automated tests kiểm tra, không gắn nhãn đã test API thật nếu chưa thực hiện.

**PASS:** sau các thử nghiệm, danh sách vẫn có 3 đơn như trước. Thông báo giúp sửa input; không có bản ghi sai được lưu.

### UAT-04 — Thư mời Editor thật, tạo/sửa và Dashboard

**Em nói:** “Anh cấp cho người nhập liệu quyền sửa đơn, nhưng không quản lý user hoặc đồng bộ.”

1. Phiên Admin → Người dùng & vai trò → **Mời người dùng**: mailbox thử, họ tên, role Editor → Gửi lời mời.
2. Mở inbox/spam thật → kiểm tra sender/domain → mở link trong browser/profile dành cho user thử → đặt password và login website của anh. Ghi nhận delivery thật; không chụp token hoặc link đầy đủ.
3. Kiểm tra user thử đúng role Editor; mở /users và /sync → không được truy cập trang Admin.
4. Editor tạo **UAT-004**, khách “Khách hàng thử D”, ngày 2026-11-05, trạng thái pending, tiền **400000**, ghi chú dữ liệu giả.
5. Refresh danh sách và Dashboard → tổng 4 đơn, hoàn thành 1, doanh thu **100.000 VND**.
6. Sửa UAT-004 thành completed → tổng 4 đơn, hoàn thành 2, doanh thu **500.000 VND**. Refresh, xem Báo cáo/CSV cùng bộ lọc để đối chiếu.

**PASS:** dữ liệu tồn tại sau refresh, đúng phép tính, Editor không vào trang Admin. Nếu SMTP chưa xong và chỉ làm bằng Admin thì ghi **CRUD Admin PASS / Editor BLOCKED**, không gộp hai việc thành một PASS.

### UAT-05 — Ẩn/kích hoạt lại và audit

**Em nói:** “Ẩn là ngừng tính vào vận hành, không phải xóa mất dấu vết. Mã đã dùng vẫn được giữ.”

1. Admin hoặc Editor ẩn UAT-004, xác nhận dialog. Kiểm tra bộ lọc đơn đang hoạt động: còn 3; doanh thu **100.000 VND**.
2. Khi UAT-004 đang ẩn, thử tạo lại mã UAT-004 → phải bị từ chối.
3. Chọn bộ lọc có đơn đã ẩn, tìm UAT-004, bấm **Kích hoạt lại**. Trở về bộ lọc đơn hoạt động → tổng 4 đơn, hoàn thành 2, doanh thu **500.000 VND**.
4. Admin → **Cài đặt → Nhật ký kiểm toán**: tìm thao tác vừa làm, người thực hiện và thời gian. Kiểm tra sự kiện tạo/sửa/ẩn/kích hoạt lại; không cần đưa dữ liệu audit thô vào báo cáo công khai.

**PASS:** tiền và số lượng đổi đúng; có lịch sử, không mất đơn. Tên UI có thể khác “restore”, hãy dùng nhãn đang hiển thị trong bản đã deploy.

### UAT-06 — Đổi từ Editor sang Viewer và vô hiệu hóa

**Em nói:** “Anh tự cấp quyền; khi nhân sự đổi vai trò hoặc nghỉ, anh có thể thu hồi quyền ngay.”

1. Dùng lại user thử đã nhận thư và đặt password ở UAT-04; không mời lại cùng email chỉ để làm lại kịch bản. Nếu bước đó BLOCKED thì các bước dưới cũng chưa thể nghiệm thu.
2. Phiên Admin đổi user thử từ Editor sang Viewer, xác nhận. Giữ nguyên phiên user thử đang mở để xem quyền cũ có bị thu hồi không.
3. Trong phiên user thử, refresh hoặc chuyển trang → Viewer chỉ xem, không tạo/sửa/ẩn/kích hoạt lại; /users và /sync bị từ chối. Không chỉ dựa vào chuyện nút bị ẩn để kết luận server có bảo vệ.
4. Nếu em kiểm tra thêm backend, dùng đoạn **chỉ đọc** dưới trong DevTools của đúng phiên Viewer trên website mới. Nó chỉ hỏi danh sách user; expected HTTP 403, không thay đổi đơn hoặc tài khoản:

```javascript
fetch("/api/users", { credentials: "same-origin" })
  .then(async (response) => ({
    status: response.status,
    body: await response.json(),
  }))
  .then(console.log);
```

Không dán code vào Console nếu chưa đọc hiểu hoặc browser đang cảnh báo self-XSS; có thể ghi **kiểm tra API thủ công chưa thực hiện** và giữ kết quả CI về bảo vệ mutations làm bằng chứng riêng. GET /api/users=403 chứng minh chặn API Admin này, không thay thế test mọi mutation Viewer.

5. Admin **Vô hiệu hóa** user thử. Tại phiên thử cũ, refresh/mở Đơn hàng → không còn đọc được business data, quay về login hoặc báo mất quyền phù hợp. Không vô hiệu chính Admin đang dùng.

**PASS theo từng mục:** nhận thư / đặt password / quyền Editor / đổi Viewer / thu hồi phiên. SMTP bị chặn thì các mục phụ thuộc chưa chạy phải ghi BLOCKED, không tạo user “tắt” bằng SQL để che thiếu sót.

### UAT-07 — Xuất Google Sheets và đối chiếu dữ liệu

**Em nói:** “Bây giờ anh xuất từ kho chính ra Sheets. Mình đối chiếu nội dung, không chỉ nhìn thông báo thành công.”

1. Giữ UAT-004 đã kích hoạt lại. Admin → Trung tâm đồng bộ → **Xuất lên Sheets**.
2. Mở Export_Orders → cần **4 dòng dữ liệu, không tính header**; đúng UAT-001…004, ngày, status, tiền và updated_at.
3. UAT-003 cancelled vẫn có trong bản xuất vì chưa ẩn; nó không đóng góp doanh thu. Export không phải danh sách chỉ các đơn completed.
4. Kiểm tra Source_Orders vẫn 3 dòng ban đầu, không tự có UAT-004: hướng export không ghi ngược Source.
5. Xuất lần nữa → vẫn 4 dòng, không append thành 8. Sync history có run thành công, số dòng đúng. Nội dung Export_Staging là vùng ứng dụng quản lý, không sửa tay.

**PASS:** dữ liệu chính xác và không lặp. Nếu muốn chứng minh đơn ẩn không được xuất, ẩn UAT-004 → export kiểm tra còn 3 → kích hoạt lại → export về 4; ghi thêm hai thao tác vào nhật ký. Chỉ làm trên môi trường giả đã chốt.

### UAT-08 — Cron: tách kiểm tra bảo vệ và lịch thật

**Em nói:** “Xuất tay PASS chứng minh export chạy được. Muốn chứng minh tự động thì mình phải thấy một run do lịch thật kích hoạt.”

1. Xem Vercel Cron Jobs của project mới: route /api/cron/daily-export; lịch trong source là `0 16 * * *` UTC, tương ứng 23:00 UTC+7.
2. Có thể kiểm tra endpoint thiếu token bằng trình duyệt/terminal trên đúng domain mới. Trong cấu hình hoàn chỉnh, ứng dụng trả 401, không tạo export. Nếu nhận HTML 403 của Vercel Protection hoặc 503 cấu hình thì đó là vấn đề khác, chưa chứng minh ứng dụng trả 401.
3. Để cron tự chạy theo lịch, sau đó xem run trigger cron, business date, status và row_count khớp 4. Nếu làm sau khung chạy, theo dõi lần tiếp theo; không đổi lịch Production chỉ để trình diễn.
4. Gói Vercel có thể chỉ bảo đảm độ chính xác theo giờ; không hứa đúng 23:00:00 và không kết luận lỗi chỉ vì 23:05 chưa thấy run. [Giới hạn cron chính thức](https://vercel.com/docs/cron-jobs/usage-and-pricing).

**Trạng thái cuối buổi có thể là:** “Manual export PASS; cron authentication PASS; scheduled cron PENDING, hẹn kiểm tra ngày/khung giờ …”. Không đổi thành Full E2E PASS khi phần lịch thật còn chờ.

## 7. Bảng số cần cầm bên cạnh khi trình diễn

Áp dụng khi cùng khoảng ngày, status Tất cả, search trống và chỉ có bộ dữ liệu giả trên:

| Mốc                        | Đơn đang hoạt động | Hoàn thành đang hoạt động | Doanh thu                 |
| -------------------------- | ------------------ | ------------------------- | ------------------------- |
| Sau import UAT-001…003     | 3                  | 1                         | 100.000 VND               |
| Tạo UAT-004 pending 400000 | 4                  | 1                         | 100.000 VND               |
| Sửa UAT-004 completed      | 4                  | 2                         | 500.000 VND               |
| Ẩn UAT-004                 | 3                  | 1                         | 100.000 VND               |
| Kích hoạt lại UAT-004      | 4                  | 2                         | 500.000 VND               |
| Export cuối                | 4 dòng dữ liệu     | Không lọc riêng completed | Dashboard vẫn 500.000 VND |

Nếu số khác, kiểm tra bộ lọc, dữ liệu đã có, status và visibility trước khi kết luận công thức lỗi. Không sửa tay database để làm số “đẹp”.

## 8. Khi đang trình diễn mà gặp lỗi

| Hiện tượng                        | Em xử lý như thế nào?                                                         | Trạng thái nghiệm thu                  |
| --------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------- |
| Database không trống trước import | Dừng; xác nhận có dữ liệu gì và chọn quy trình phù hợp, không reset           | BLOCKED import                         |
| 503 backend                       | Đối chiếu APP_ENV, ref/URL và scope deploy; redeploy nếu đổi public env       | FAIL cấu hình cho đến khi sửa/xác minh |
| Sheets 403/404                    | Kiểm tra API enabled, email Share Editor và file ID; không cấp public edit    | BLOCKED Sheets                         |
| Chưa nhận thư                     | Xem SMTP logs, sender/DNS, spam, rate limit; không click gửi liên tục         | BLOCKED invitation                     |
| Link mời sai domain               | Kiểm tra APP_ORIGIN + Auth URL Configuration; không gửi tiếp trước khi sửa    | FAIL redirect                          |
| Invite link hết hạn/đã dùng       | Kiểm tra tài khoản đã đặt password chưa; không xóa user có lịch sử để thử lại | Ghi kết quả thật từng bước             |
| KPI khác dự tính                  | So cùng filters/status/visibility, refresh và đọc lại bản ghi                 | Chưa PASS phép đối chiếu               |
| Export failed nhưng Sheet đã đổi  | Giữ dữ liệu, kiểm tra run/readback; không suy ra failed nghĩa là chưa ghi     | Cần đối soát trước retry               |
| Service đòi nâng gói              | Dừng, giải thích lựa chọn cho anh                                             | BLOCKED, không tự thanh toán           |

**Câu nói để tránh buổi hướng dẫn bị cuốn vào debug vô hạn:**

> “Đoạn này đang chờ dịch vụ/cấu hình, mình ghi rõ còn thiếu. Em không đánh dấu đã xong. Mình tiếp tục phần độc lập làm được, rồi quay lại kiểm tra khi đủ điều kiện.”

Không chủ động thu hồi quyền Google hoặc giả lập outage trên môi trường dùng thật. Failure recovery nâng cao chỉ thử trên tài nguyên giả cô lập với phạm vi được duyệt.

## 9. Cuối buổi: để anh tự làm lại, em không chạm chuột

**Em nói:** “Bây giờ anh thao tác, em chỉ quan sát. Mục nào anh còn cần em nhắc thì mình tập lại.”

- [ ] Anh tự mở đúng URL, đăng nhập và đăng xuất.
- [ ] Anh tìm một mã đơn, lọc theo ngày/trạng thái, đọc đúng doanh thu completed.
- [ ] Anh giải thích được pending/cancelled và đơn ẩn không cộng doanh thu.
- [ ] Anh chỉ được nơi tạo/sửa/ẩn/kích hoạt lại đơn, hiểu thao tác có lịch sử.
- [ ] Anh chỉ được nơi mời user, đổi quyền, vô hiệu hóa; không tự hạ quyền Admin cuối.
- [ ] Anh tự bấm Xuất lên Sheets và kiểm tra số dòng/nội dung.
- [ ] Anh phân biệt Source_Orders, Export_Orders và PostgreSQL; biết import ban đầu không chạy tùy ý lần nữa.
- [ ] Anh biết tìm sync history và cung cấp thời điểm/mã đơn/lỗi đã che thông tin khi cần hỗ trợ.
- [ ] Anh biết secrets nằm ở đâu, ai có quyền đọc và cách phục hồi tài khoản; không phải nhớ từng chuỗi key.

## 10. Hướng dẫn vận hành sau khi em về

**Mỗi ngày:** mở Dashboard, kiểm tra đơn và run export gần nhất. Nếu cron lỗi, xem nguyên nhân, đối chiếu Sheet và dùng manual export khi phù hợp; không xóa lịch sử sync để thử lại.

**Khi có nhân sự mới:** Admin mời email, gán đúng vai trò, người đó tự đặt password. Khi nghỉ việc: vô hiệu hóa và kiểm tra phiên cũ mất quyền. Không chia sẻ chung tài khoản Admin cho cả nhóm.

**Khi muốn sửa tính năng:** mở repository của anh trong Codex, đưa yêu cầu cụ thể. Ví dụ có thể dùng:

> “Đọc AGENTS.md. Trên dev, thêm bộ lọc theo khách hàng. Giữ cách tính doanh thu và phân quyền. Chuẩn bị code/test, cho tôi xem diff và kết quả CI; không merge main, deploy Production, chạy SQL cloud hoặc sửa dữ liệu thật. Nếu cần migration, giải thích trước và chờ tôi duyệt riêng.”

Giải thích: dev là bản để sửa thử; main là bản website chính. Nếu Vercel nối main, merge PR có thể tự deploy, nên không bấm merge khi chưa sẵn sàng. Mọi schema change phải có migration; sau cài bằng SQL Editor, cần đối chiếu history theo [chương 13](setup/13-development-workflow.md) trước dùng CLI db push.

**Backup:** chốt người phụ trách, tần suất, nơi lưu archive/key tách biệt và thời điểm thử restore. Google Sheets không thay thế backup. Full restore chưa thử thì ghi rõ chưa thử, không lấy kết quả encryption/SQL fixture để bảo đảm khôi phục Auth thật.

**Chuyển máy:** code có thể clone lại từ repository của anh, nhưng secrets phải được lấy từ kho riêng có kiểm soát; không kỳ vọng GitHub lưu hộ các file env. Website Vercel đã deploy không phụ thuộc việc máy anh có mở terminal hay không.

## 11. Mẫu biên bản nghiệm thu để điền ngay tại bàn

Không điền password, private key, access token, full invite URL hoặc dữ liệu khách hàng thật vào bảng này.

| Thông tin                           | Điền tại buổi hướng dẫn                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| Ngày/giờ và người hướng dẫn         | …                                                                                    |
| Người nhận/chủ sở hữu               | …                                                                                    |
| Chế độ                              | A: diễn tập / B: dùng thật                                                           |
| Repository và owner                 | …                                                                                    |
| Source SHA / commit deploy thực tế  | … / …                                                                                |
| URL website được nghiệm thu         | …                                                                                    |
| Tên môi trường database/Spreadsheet | …; ghi định danh theo chính sách nội bộ, không secrets                               |
| Phạm vi được anh duyệt              | Tạo tài nguyên / áp schema / bootstrap / deploy mới / thao tác dữ liệu thử / khác: … |
| Gói dịch vụ/hạn mức cần lưu ý       | …; không mặc định nâng phí                                                           |

| Hạng mục                                     | PASS / FAIL / BLOCKED / PENDING | Bằng chứng và ghi chú         |
| -------------------------------------------- | ------------------------------- | ----------------------------- |
| Sở hữu repository/tài nguyên đúng người nhận | …                               | …                             |
| Auth/login/logout/phiên                      | …                               | …                             |
| Sheets connection + import 3 dòng            | …                               | …                             |
| CRUD + validation                            | …                               | …                             |
| KPI/Reports đúng bảng số                     | …                               | …                             |
| Ẩn/kích hoạt lại + audit                     | …                               | …                             |
| SMTP inbox + đặt password                    | …                               | …                             |
| Editor/Viewer + đổi quyền/disable            | …                               | …                             |
| Export đúng 4 dòng, không duplicate          | …                               | …                             |
| Cron authentication                          | …                               | …                             |
| Cron theo lịch thật                          | …                               | Hẹn kiểm tra: …               |
| Anh tự thao tác lại                          | …                               | …                             |
| Backup/restore sẵn sàng cho dữ liệu thật     | …                               | Không gộp với functional demo |

**Kết luận chọn một:**

- [ ] Đã hướng dẫn và nghiệm thu chức năng trên dữ liệu giả; chưa chuyển sang dùng dữ liệu thật.
- [ ] Nghiệm thu một phần; các mục còn chờ: …; người xử lý: …; thời điểm kiểm tra lại: …
- [ ] Đủ điều kiện dùng dữ liệu thật trong phạm vi đã thống nhất, có xác nhận riêng của chủ sở hữu về dữ liệu, backup/restore, quyền và vận hành.

**Em nói kết thúc:**

> “Anh đang giữ source và tài khoản của anh. Hôm nay mình đã trực tiếp xác minh các mục có bằng chứng trong bảng này. Những mục còn chờ em ghi rõ, không tính là đã xong. Sau đây anh tự vận hành theo checklist; thay đổi code hoặc dữ liệu thật đều có bước anh duyệt.”

## 12. Nếu anh chọn dùng dữ liệu thật ngay tối nay

Không dùng bộ UAT ở mục 5 vào database Production thật. Điều chỉnh buổi nghiệm thu như sau:

1. Anh duyệt file nguồn thật, quyền truy cập và backup trước thay đổi. Xác nhận Orders thực sự trống nếu muốn import ban đầu.
2. Preview dữ liệu thật, sửa mọi lỗi, đối chiếu số dòng và tổng expected từ nguồn đã duyệt; anh xác nhận mới import. Không sửa nghiệp vụ hoặc bỏ validation cho qua dữ liệu lỗi.
3. Chụp/ghi số liệu nền: số đơn đang hoạt động `N`, số completed `C`, doanh thu `R`, cùng filters; không đưa dữ liệu nhạy cảm vào báo cáo chia sẻ.
4. Chỉ khi anh cho phép, tạo **một đơn thử rõ nhãn** bằng mã riêng chưa dùng, pending 400000: số đơn `N+1`, completed `C`, doanh thu vẫn `R`. Đổi completed: completed `C+1`, doanh thu `R+400000`. Ẩn sau kiểm tra: KPI hoạt động trở về `N`, `C`, `R`, nhưng bản ghi/mã/audit vẫn tồn tại. Không hứa “xóa sạch như chưa từng chạy”.
5. Không thay đổi trạng thái/ẩn đơn thật chỉ để trình diễn. Các test duplicate, invalid import, outage và full cleanup thực hiện trên môi trường thử riêng, không đưa thành tiêu chí phải phá thử Production.
6. Export đúng snapshot đã chốt; đối chiếu bản ghi thử đã ẩn không ra Sheet. Theo dõi cron thật và ký nhận từng mục còn chờ.
7. Nếu chưa có backup/restore hoặc quyền vận hành rõ ràng, kết thúc ở mức hướng dẫn/chạy thử; không tự kết luận đã sẵn sàng tiếp nhận dữ liệu kinh doanh.

## 13. Tài liệu mở sẵn trong buổi hướng dẫn

- [Bắt đầu cài mới](setup/README.md) và [bảng env](setup/ENVIRONMENT.md).
- [Repository/SHA/ZIP](setup/02-github.md), [Supabase/migrations](setup/03-supabase.md), [Google Cloud](setup/04-google-cloud.md), [Sheets](setup/05-spreadsheet.md).
- [Local](setup/06-local.md), [Vercel](setup/07-vercel.md), [First Admin](setup/08-first-admin.md), [SMTP](setup/09-smtp.md).
- [Checklist kỹ thuật](setup/10-verification.md), [staging](setup/11-staging.md), [vận hành](setup/12-operations.md), [phát triển dài hạn](setup/13-development-workflow.md).
- [Các bước đã kiểm chứng ở bản source](HANDOVER_FINAL_REVIEW.md): CI/schema SQL không thay thế việc nghiệm thu cloud trực tiếp trên tài khoản anh.

Ảnh Dashboard dịch vụ chưa có cứ giữ **SCREENSHOT NEEDED**. Tối hướng dẫn có thể bổ sung ảnh thật đã che thông tin sau khi anh đồng ý; không chụp bí mật và không dùng ảnh cũ làm bằng chứng hệ thống mới.
