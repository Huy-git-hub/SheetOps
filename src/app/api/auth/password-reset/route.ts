import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { publicConfig } from "@/lib/supabase/server";
import { upstreamFetch } from "@/lib/supabase/transport";
import { invitationOrigin } from "@/lib/invitations";
import { body, checkOrigin, fail, HttpError, json } from "@/lib/server/http";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { email } = z
      .object({ email: z.email() })
      .strict()
      .parse(await body(request));
    const origin = invitationOrigin(
      process.env.APP_ORIGIN,
      process.env.VERCEL_ENV === "production",
    );
    if (!origin)
      throw new HttpError(503, "Chưa cấu hình liên kết đặt lại mật khẩu.");
    const { url, key } = publicConfig();
    // Email opens in any browser; no caller-controlled redirect or service key.
    // Supabase Auth owns email throttling. Keep account existence private.
    const auth = createClient(url, key, {
      global: { fetch: upstreamFetch },
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }).auth;
    const { error } = await auth.resetPasswordForEmail(email.trim(), {
      redirectTo: new URL("/auth/accept", origin).href,
    });
    if (error?.status === 429)
      throw new HttpError(
        429,
        "Bạn yêu cầu quá nhanh. Vui lòng chờ trước khi thử lại.",
      );
    if (error)
      throw new HttpError(
        503,
        "Chưa gửi được yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.",
      );
    return json(
      {
        message:
          "Nếu email có tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư rác.",
      },
      202,
    );
  } catch (error) {
    return fail(error);
  }
}
