/** Safe public diagnostics; never return provider messages, addresses or tokens. */
export function invitationFailure(error: unknown) {
  const { status, code } = (error ?? {}) as { status?: number; code?: string };
  if (status === 504 || status === 0 || code === "request_timeout")
    return {
      status: 504,
      code: "INVITE_TIMEOUT",
      message:
        "Supabase xử lý lời mời quá thời gian chờ. Quản trị viên cần kiểm tra kết nối SMTP, host và port. Chưa xác minh thư đã gửi; kiểm tra hộp thư và danh sách người dùng trước khi thử lại.",
    };
  if (status === 429 || code === "over_email_send_rate_limit")
    return {
      status: 429,
      code: "INVITE_RATE_LIMIT",
      message: "Đã chạm giới hạn gửi lời mời. Vui lòng chờ trước khi thử lại.",
    };
  if (code === "email_exists" || code === "user_already_exists")
    return {
      status: 409,
      code: "INVITE_EXISTS",
      message:
        "Email đã có tài khoản. Kiểm tra thành viên hiện có trước khi cấp quyền hoặc gửi lại lời mời.",
    };
  return {
    status: 502,
    code: "INVITE_AUTH_FAILED",
    message:
      "Supabase không hoàn tất lời mời. Kiểm tra Auth logs và nhật ký email provider để phân biệt lỗi SMTP, từ chối thư hoặc cấu hình dịch vụ. Chưa xác minh thư đã gửi.",
  };
}

export function invitationOrigin(
  value: string | undefined,
  production: boolean,
) {
  try {
    const url = new URL(value ?? "");
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      (url.protocol !== "https:" &&
        !(url.protocol === "http:" && local && !production)) ||
      (production && local)
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

type InvitationUser = { id: string; invited_at?: string };
type InvitationAuth = {
  setSession: (tokens: {
    access_token: string;
    refresh_token: string;
  }) => Promise<{ error: unknown }>;
  getUser: (
    jwt?: string,
  ) => Promise<{ data: { user: InvitationUser | null }; error: unknown }>;
};

class InvitationUnavailableError extends Error {}

function checkAuthAvailability(error: unknown) {
  const status = (error as { status?: number } | null)?.status;
  if (status === 0 || (status !== undefined && status >= 500))
    throw new InvitationUnavailableError();
}

/** Invitations and explicit password recovery return verified implicit sessions. */
export async function acceptInvitationSession(
  auth: InvitationAuth,
  fragment: string,
) {
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  if (params.has("error") || params.has("error_code")) return false;
  let invitationToken: string | undefined;
  if (params.has("access_token") || params.has("refresh_token")) {
    if (!["invite", "recovery"].includes(params.get("type") ?? ""))
      return false;
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) return false;
    invitationToken = access_token;
    const { error } = await auth.setSession({ access_token, refresh_token });
    checkAuthAvailability(error);
    if (error) return false;
  }
  const { data, error } = await auth.getUser(invitationToken);
  checkAuthAvailability(error);
  // A reload/callback may use an invited account's cookie, never an unrelated
  // ordinary login (for example the Admin who sent the invitation).
  return !error && !!data.user && (!!invitationToken || !!data.user.invited_at);
}

export type InvitationAccess<T> =
  { state: "ready"; session: T } | { state: "invalid" | "unavailable" };

/** A temporary outage is retryable, but never grants access without fresh checks. */
export async function verifyInvitationAccess<
  T extends { profile: { id: string } },
>(
  auth: InvitationAuth,
  fragment: string,
  loadSession: () => Promise<Response>,
): Promise<InvitationAccess<T>> {
  try {
    let verifiedId: string | undefined;
    const boundAuth: InvitationAuth = {
      setSession: (tokens) => auth.setSession(tokens),
      getUser: async (jwt) => {
        const result = await auth.getUser(jwt);
        if (!result.error) verifiedId = result.data.user?.id;
        return result;
      },
    };
    if (!(await acceptInvitationSession(boundAuth, fragment)))
      return { state: "invalid" };
    const response = await loadSession();
    if ([401, 403].includes(response.status)) return { state: "invalid" };
    if (!response.ok) return { state: "unavailable" };
    const { data } = (await response.json()) as { data: T };
    if (!verifiedId || data?.profile?.id !== verifiedId)
      return { state: "invalid" };
    return { state: "ready", session: data };
  } catch {
    return { state: "unavailable" };
  }
}
