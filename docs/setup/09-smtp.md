# 9. SMTP và invitation

Ví dụ cụ thể nếu chưa chọn nhà cung cấp: tạo tài khoản tại [Brevo](https://app.brevo.com/). Không chọn gói trả phí nếu chưa được chấp thuận. Có thể dùng SMTP khác với các field tương đương.

- **Settings → Senders, Domains & Dedicated IPs**: thêm domain gửi thuộc quyền bạn, xác thực DNS theo Dashboard, tạo sender. Domain Vercel được cấp cho website không cấp quyền DNS để xác thực sender; cần domain email riêng hoặc phương án được nhà cung cấp chấp nhận.
- **Settings → SMTP & API → SMTP** ([mở trang](https://app.brevo.com/settings/keys/smtp)): lấy Server/Port/Login; **Generate SMTP key**, lưu key một lần trong kho riêng. Dùng SMTP key, không dùng API key hay password đăng nhập. [Hướng dẫn SMTP key](https://help.brevo.com/hc/en-us/articles/7959631848850-Create-and-manage-your-SMTP-keys).
- Điền Supabase Host=`smtp-relay.brevo.com`, Port=587, Username=Login trên trang SMTP, Password=SMTP key, sender đã xác thực. **Transactional → Email logs** để kiểm tra thư mời. [Hướng dẫn tích hợp Supabase chính thức](https://developers.brevo.com/docs/supabase-smtp-integration).

1. Đăng ký SMTP của người nhận, xác minh email/domain gửi. Dashboard SMTP → **SMTP credentials/settings**: lấy hostname, port, username, password/API credential, sender email/name. Nếu dùng domain riêng, thêm SPF/DKIM theo nhà cung cấp tại DNS và chờ verified. Không đoán DNS records hoặc dùng sender chủ cũ.
2. Supabase → **Authentication → Email → SMTP Settings** (có thể nằm trong Project Settings → Authentication): bật Custom SMTP, điền rồi Save. Lưu tại Supabase; ứng dụng không có biến `SMTP_*` trong .env.local hoặc Vercel. Default SMTP bị giới hạn; không dùng làm bằng chứng gửi mail ổn định. [Tài liệu chính thức](https://supabase.com/docs/guides/auth/auth-smtp).
3. Kiểm tra URL Configuration và APP_ORIGIN là domain mới. Template **Invite user** phải giữ liên kết xác nhận Supabase hợp lệ; không tùy biến trước khi lời mời mặc định hoạt động.
4. Web → **Người dùng → Mời người dùng**: nhập mailbox bạn kiểm soát, tên/role Viewer. Kiểm tra inbox/spam, mở link ở cửa sổ riêng tư, đặt password tại /auth/accept, đăng nhập. Provider logs phải có delivery; API accepted chưa chứng minh thư tới inbox.
5. Link đã dùng/hết hạn: thử /login bằng password đã đặt; Admin kiểm tra invitation và gửi lại theo UI khi phù hợp. Không xóa user có lịch sử để chữa link. Tránh click lặp; mail scanner có thể tiêu thụ link.

**Xác minh:** nhận thư thật, domain đúng, đặt password được; Viewer không sửa đơn. Disable Viewer rồi phiên cũ phải mất quyền. **SCREENSHOT NEEDED:** `screenshots/09-invitation.png`: field labels SMTP che values, thư đã che token, trang đặt mật khẩu.

## Quên mật khẩu và tên hiển thị

- Trang đăng nhập → **Quên mật khẩu?** → nhập email đã được cấp → **Gửi liên kết đặt lại**. Kiểm tra inbox/spam và mở email mới nhất. Không xóa Auth user/profile để gửi lại: đặt mật khẩu mới cập nhật tài khoản hiện có, giữ vai trò và lịch sử.
- Trước khi nhập mật khẩu, trang phải ghi đúng **Tài khoản thiết lập mật khẩu: email của bạn**. Nếu khác email, dừng và mở email trong browser/profile riêng. Link cũ có thể đã dùng hoặc hết hạn; yêu cầu một link recovery mới thay vì gửi invite trùng.
- Mật khẩu mới cần 8–72 ký tự. Người dùng tự nhập; không dán mật khẩu hoặc URL có token vào chat/log. Lưu thành công sẽ đăng xuất, sau đó đăng nhập lại bằng mật khẩu mới.
- Nếu Auth tạm thời không khả dụng, dùng **Thử kiểm tra lại**. Lỗi dịch vụ không đồng nghĩa link đã hết hạn. Thông báo gửi recovery không xác nhận tài khoản có tồn tại và chưa chứng minh thư đến inbox.
- Sau đăng nhập → menu tài khoản góc trên → **Tài khoản của tôi** → sửa **Tên hiển thị** → **Lưu tên hiển thị**. Mỗi người chỉ sửa tên của chính mình; email/vai trò/trạng thái không đổi. PostgreSQL lưu tên và audit trong cùng giao dịch. Cần migration `20261105163217_update_own_profile_name.sql`; bản cài trước đó chỉ áp file mới sau review/backup, không chạy lại bảy file cũ.
- Giữ template recovery mặc định có liên kết xác nhận Supabase hợp lệ. APP_ORIGIN và Auth allowlist phải gồm đúng `/auth/accept` của môi trường sử dụng. Không bật public signup hoặc nới wildcard để chữa lỗi redirect.
