import { z } from "zod";
import {
  body,
  checkOrigin,
  fail,
  HttpError,
  json,
  requireActor,
} from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const input = z
      .object({ profileId: z.uuid(), password: z.string().min(8).max(72) })
      .strict()
      .parse(await body(request));
    const { db, profile } = await requireActor();
    // Bind the mutation to the account shown on the invitation page. Another
    // tab changing the browser's cookies must never change someone else's password.
    if (profile.id !== input.profileId)
      throw new HttpError(
        409,
        "Phiên đăng nhập đã đổi sang tài khoản khác. Hãy mở lại liên kết mời trong browser riêng.",
        "INVITE_SESSION_CHANGED",
      );
    const { error } = await db.auth.updateUser({ password: input.password });
    if (error) {
      if (error.status === 0 || (error.status ?? 0) >= 500)
        throw new HttpError(
          503,
          "Dịch vụ xác thực tạm thời không khả dụng. Hãy thử lại.",
          "AUTH_UNAVAILABLE",
        );
      throw new HttpError(
        422,
        "Không thể đặt mật khẩu. Mật khẩu cần đủ mạnh và khác mật khẩu cũ.",
        "PASSWORD_REJECTED",
      );
    }
    return json({ passwordSet: true });
  } catch (error) {
    return fail(error);
  }
}
