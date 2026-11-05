# Nghiệm thu Production ngày 05/11/2026

## Kết luận hiện tại

Các luồng dữ liệu chính đã chạy trên backend/Spreadsheet Production bằng dữ liệu giả: import, tạo/sửa/ẩn/kích hoạt lại, đối chiếu doanh thu, export thủ công và một cron export thực tế. Chưa xác nhận toàn bộ website Vercel sẵn sàng tiếp nhận dữ liệu kinh doanh thật. Bản sửa Auth và các tính năng tài khoản mới hiện được kiểm tra ở localhost, chưa phát hành lên Vercel.

## Phạm vi và định danh đã đối chiếu

- Website: `https://sheetops-sctv-cn1.vercel.app`.
- Deployment được kiểm tra: `dpl_AQ6UdGZkF2mbq5LWz9L7hShpk5p6`, Production, READY, region Singapore.
- Source đang deploy và source local ban đầu: `a09330330b4d8abb880bbfb871a145c92109c8b0`.
- Supabase Production: `vkukdaffksvjlogmoxdd`, ACTIVE_HEALTHY, PostgreSQL 17.11.
- Spreadsheet SheetOps: `17hlZpzBflh0n04z2xl2CD06f-ZfHPWao2DSJW3vSaHg`, đủ Source_Orders/Export_Orders/Export_Staging.
- Định danh lấy từ cấu hình Production của chính Vercel project gắn với domain chủ sở hữu cung cấp; local được đối chiếu, không lấy lịch sử hệ thống cũ làm cấu hình.
- Chủ sở hữu duyệt tạo UAT-001…004 và tài khoản nghiệm thu, cho phép ngoại lệ backup cho bộ dữ liệu giả này. Không duyệt reset database, xóa audit, sửa lịch sử migrations hay áp schema mới trong ngoại lệ đó.
- Local APP_ORIGIN được đặt thành `http://localhost:3000`; APP_ORIGIN Production vẫn là domain HTTPS ở trên.

## Bằng chứng chức năng

| Hạng mục                              | Kết quả                          | Bằng chứng/giới hạn                                                                                                 |
| ------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Trạng thái ban đầu                    | PASS                             | Orders=0, một Admin active, chưa có sync run; năm bảng nghiệp vụ có RLS                                             |
| Đăng nhập Admin                       | PASS local → hosted Auth         | UI Admin hiển thị; account được phục hồi sau sự cố phiên đặt mật khẩu                                               |
| Connection Sheets                     | PASS                             | Ứng dụng đọc được ba tab bằng service account                                                                       |
| Import                                | PASS                             | Preview 3 hợp lệ/0 lỗi; confirm lưu đúng UAT-001/002/003, run import success/3                                      |
| Chặn import lần hai                   | PASS                             | UI báo Orders đã có dữ liệu, nút confirm bị vô hiệu hóa                                                             |
| Validation                            | PASS phạm vi thử                 | Mã trùng bị API 409; tiền âm/lẻ bị UI chặn; ngày vô lý và BIGINT có automated tests                                 |
| Tạo/sửa                               | PASS                             | Admin tạo UAT-004 pending 400000; Editor sửa completed, tồn tại sau refresh                                         |
| Doanh thu                             | PASS                             | 3 đơn ban đầu → 100000; thêm pending vẫn 100000; completed UAT-004 → 500000, 4 đơn/2 completed                      |
| Ẩn/kích hoạt lại                      | PASS                             | Khi UAT-004 ẩn: 3 active/100000; khôi phục: 4 active/500000; các sự kiện giữ trong audit                            |
| Editor và trang Admin                 | PASS                             | Editor sửa đơn được; truy cập trực tiếp /users bị từ chối                                                           |
| Invitation                            | Phát hiện lỗi, đã sửa local      | Thư tới spam, link được Auth xác nhận; trang cũ gộp lỗi 503 thành link sai và có thể dùng nhầm phiên khi reload     |
| Recovery                              | PASS local + chủ sở hữu xác nhận | Link email mới cho tài khoản thử, đặt mật khẩu và đăng nhập thành công ở hai browser                                |
| Admin dùng email giả                  | Cần xử lý trước vận hành thật    | Không thể tự phục hồi qua inbox; lần này chủ sở hữu yêu cầu link recovery trực tiếp và tự đặt mật khẩu              |
| Export thủ công                       | PASS                             | Run manual success/4 lúc 23:54; đối chiếu cùng bốn mã với Sheet                                                     |
| Cron export                           | PASS một lần quan sát            | Run cron/system, daily:2026-11-05, success/4; 23:42:39–23:42:42 UTC+7, trong cửa sổ lịch 23:00                      |
| Nội dung Google Sheets                | PASS                             | Export_Orders có header + đúng 4 đơn, VND và ISO dates dạng text; không duplicate; Source_Orders giữ nguyên 3 dòng  |
| API không đăng nhập/cron thiếu secret | PASS local                       | Orders/users/sync runs và cron đều HTTP 401; request cron không tạo export                                          |
| Viewer/disable phiên đang mở          | PASS bổ sung 06/11/2026          | Mời Viewer, đặt mật khẩu/login; disable chặn phiên cũ và login lại; kích hoạt lại đúng Viewer; có audit và HTTP 403 |
| Đổi tên hiển thị                      | Source/SQL PASS, hosted PENDING  | UI/API có sẵn; RPC mới cần được duyệt và áp trước khi live test                                                     |
| Auth trên URL host                    | Chưa nghiệm thu trực tiếp đầy đủ | Vercel protection; connector fetch và runtime logs trả 403, không phải bằng chứng website lỗi hoặc không có logs    |

Thời gian cron thực tế không chứng minh cam kết chạy chính xác 23:00 mỗi ngày. Không gọi cron có secret từ local trong buổi thử này. Quy nguồn scheduler dựa trên run system/daily trong khung lịch; chưa lấy được Vercel runtime logs để đối chiếu request.

## Thay đổi source chuẩn bị phát hành

### Bổ sung nghiệm thu thu hồi quyền ngày 06/11/2026

Thử qua integrated browser tại localhost:3000, nối đúng backend Production `vkukdaffksvjlogmoxdd`. Admin mới mời lại mailbox nghiệm thu với quyền Viewer (Auth/profile mới, không phải tài khoản đã xóa trong lần bảo trì).

- Chủ sở hữu nhận email, tự đặt mật khẩu và đăng nhập tại browser riêng. Local logs ghi password setup 200 và login 200.
- Admin vô hiệu hóa qua UI lúc 00:31:51 UTC+7. Đối chiếu database: role=viewer, is_active=false; có audit do Admin thực hiện.
- Chủ sở hữu xác nhận cả phiên cũ sau refresh và đăng nhập lại đều bị chặn. Logs tương ứng có GET /api/session 403 và POST /api/auth/login 403.
- Admin kích hoạt lại lúc 00:33:04, giữ nguyên Viewer. UI và database xác nhận active=true; audit có đủ created → inactive → active.
- Case thu hồi quyền trước đây bị dừng do công cụ đã được thực hiện lại và hoàn tất. Đây là bằng chứng local → hosted Auth/database, chưa thay thế kiểm chứng bundle đang host trên Vercel hoặc kiểm thử API mutation của Viewer.

Admin dùng email giả trước đó đã được thay bằng Admin mới trong lần bảo trì riêng ngày 06/11. Không còn lấy tài khoản cũ đó làm điều kiện vận hành hiện tại.

1. Tách lỗi Auth tạm thời khỏi link không hợp lệ, thêm nút thử lại; xác minh token và profile phải cùng tài khoản.
2. Hiển thị email trước khi đặt mật khẩu; API lưu mật khẩu kiểm tra lại phiên và profileId. Phiên Admin thông thường không được dùng như một lời mời khi không có token recovery/invite.
3. Quên mật khẩu: cùng origin, redirect cố định từ cấu hình, không tạo user mới, không tiết lộ email có tài khoản hay không, giữ rate limit Supabase Auth.
4. Tài khoản của tôi: đổi tên của chính mình; không nhận id/role/email/is_active từ input. RPC khóa đúng profile active và giữ audit trong giao dịch.
5. Sửa thông báo tiền âm/lẻ; giữ nguyên hợp đồng VND/BIGINT và nghiệp vụ đơn hàng.
6. Build dùng `next build --webpack`: Turbopack production worker bị panic trên máy Windows với cả Node 26 và Node 24. Không thay dependencies hay cấu trúc nghiệp vụ để vượt lỗi này.

Migration mới duy nhất: `20261105163217_update_own_profile_name.sql`.

SHA-256: `7249778e941e62c7412ad79333fedfe9839912b1a219c2115362f0b235a247c4`.

Migration chỉ thêm hai functions public/private, không sửa hoặc xóa bảng/cột/dữ liệu, không thay bảy migrations đã cài. Runtime cũ vẫn tương thích. Database hiện chưa có CLI migration history; không dùng db push/repair để tự đánh dấu các file cũ.

## Kiểm tra và giới hạn

- 133 unit/API regression tests qua sau thay đổi mật khẩu tối thiểu 8 ký tự; format/lint/typecheck đã qua.
- Production webpack build đã qua; lệnh build cuối được chạy lại sau thay đổi source.
- `test:install-db` đã thử và bị chặn ở image_pull do `docker ENOENT`; chưa có Docker Server, không gọi cloud để thay thế bài này.
- Bổ sung kiểm chứng bằng PGlite 0.5.15/PostgreSQL 18.6 trong bộ nhớ: đủ tám migrations, tự đổi tên/permissions/disabled/audit qua; nâng cấp từ bảy migrations với order BIGINT và audit có sẵn không làm thay đổi dữ liệu. Đây là kiểm tra bổ sung, không thay thế Docker PostgreSQL 17, hosted Auth/PostgREST hay full restore.
- Không chạy cleanup/fixture, failure injection hoặc performance load suites trên Production. Các file tooling SQL thử nghiệm chỉ dùng local synthetic fixtures.
- Thấy các lỗi Auth 503 và thời gian phản hồi có lúc 10–48 giây trong phiên local; sau đó các request phục hồi. Chưa có kiểm chứng mạng/Vercel để quy nguyên nhân cho SQL. Không công bố P95 hoặc khả năng tải lớn từ bốn đơn UAT.
- Advisor hiện có cảnh báo leaked-password protection chưa bật; không tự đổi plan/billing. Các index chưa dùng trên database mới không phải lý do để xóa index.
- Backup/full restore chưa được chứng minh. Ngoại lệ seed dữ liệu giả không phải phê duyệt schema/release hoặc chứng nhận an toàn dữ liệu thật.

## Trước khi phát hành và dùng thật

### Bổ sung backup/restore trước release ngày 06/11/2026

Đã tạo logical dump Production bằng PostgreSQL 17.11 qua Direct Connection riêng tư, mã hóa AES-256-GCM, kiểm tra archive và phục hồi vào database local riêng trong một transaction. So sánh số dòng/digest SQL ở UTC của orders (4), profiles (2), audit_logs (24), sync_runs (3), workspace_settings (1), auth.users (2), auth.identities (2) đều khớp. Đồng thời cài mới đủ tám migrations và kiểm tra self-name permissions/audit bằng PostgreSQL 17.11 local đã qua.

Archive, khóa, manifest, danh sách roles cần chuẩn bị và biên bản restore đã lưu trong thư mục [SheetOps của người nhận](https://drive.google.com/drive/folders/1ti-ttmohuLFQtxKc-7lT3JHz_VV0tndu), đọc metadata xác nhận đúng parent và shared=false. Khóa và archive cùng tài khoản Drive: người có quyền đọc cả hai có thể giải mã. Không chứa connection string hoặc external service secrets trong package.

Kiểm chứng này xác nhận khả năng phục hồi logical schema/data vào PostgreSQL local; không khẳng định full hosted Supabase Auth disaster recovery, khôi phục SMTP/Vercel/Google credentials hoặc Storage object bytes. Chủ sở hữu yêu cầu bỏ nghiệm thu giao diện host trong lần release này; không ghi PASS cho bước đã bỏ.

Chốt đúng commit và CI, duyệt migration mới/target, có backup và đích restore hoặc quyết định ngoại lệ riêng của chủ sở hữu. Áp migration cộng thêm trước code; không áp lại bảy file cũ. Khi rollback code, giữ functions cộng thêm, không DROP dữ liệu để hoàn tác. Deployment trước ở SHA đã nêu là ứng viên rollback tương thích schema, nhưng còn các lỗi Auth phát hiện trong buổi thử.

Sau release cần nghiệm thu URL host với tài khoản Admin/Editor/Viewer, đổi tên thực tế và quyền/audit, kết quả recovery về đúng origin, responsive, sync/export và logs. Dùng email Admin nhận thư thật trước vận hành kinh doanh. Giữ SCREENSHOT NEEDED cho các Dashboard dịch vụ chưa chụp; tài liệu lịch sử không thay thế bằng chứng này.
