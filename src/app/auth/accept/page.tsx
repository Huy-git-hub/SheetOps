"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  verifyInvitationAccess,
  type InvitationAccess,
} from "@/lib/invitations";
import { browserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import {
  useWorkspace,
  type WorkspaceSession,
} from "@/components/workspace-provider";
export default function Accept() {
  const { establish, logout } = useWorkspace();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [retryable, setRetryable] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [account, setAccount] = useState<WorkspaceSession["profile"] | null>(
    null,
  );
  const fragment = useRef<string | null>(null);
  const initialization = useRef<Promise<
    InvitationAccess<WorkspaceSession>
  > | null>(null);
  useEffect(() => {
    let active = true;
    if (!initialization.current) {
      fragment.current ??= window.location.hash;
      // Remove credentials from the address bar before client initialization.
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
      initialization.current = verifyInvitationAccess<WorkspaceSession>(
        browserClient().auth,
        fragment.current,
        () => fetch("/api/session", { cache: "no-store" }),
      );
    }
    void initialization.current.then((result) => {
      if (!active) return;
      setChecking(false);
      setReady(result.state === "ready");
      setRetryable(result.state === "unavailable");
      if (result.state === "ready") {
        fragment.current = "";
        setAccount(result.session.profile);
        establish(result.session);
        setError("");
      } else if (result.state === "unavailable") {
        setError(
          "Dịch vụ xác thực tạm thời không khả dụng. Hãy thử kiểm tra lại; chưa thể kết luận liên kết mời đã hết hạn.",
        );
      } else
        setError(
          "Lời mời không hợp lệ, đã hết hạn hoặc tài khoản chưa được cấp quyền. Hãy mở lại liên kết trong email hoặc liên hệ quản trị viên.",
        );
    });
    return () => {
      active = false;
    };
  }, [establish, attempt]);
  return (
    <section className="login-form">
      <h1>Thiết lập mật khẩu</h1>
      <p>Hoàn tất tài khoản đã được quản trị viên mời.</p>
      {ready && account && (
        <p>
          Tài khoản thiết lập mật khẩu: <strong>{account.email}</strong>
        </p>
      )}
      {checking && <p role="status">Đang kiểm tra lời mời…</p>}
      {retryable && (
        <Button
          type="button"
          disabled={checking}
          onClick={() => {
            setChecking(true);
            setError("");
            initialization.current = null;
            setAttempt((value) => value + 1);
          }}
        >
          Thử kiểm tra lại
        </Button>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!ready || !account || pending) return;
          setPending(true);
          setError("");
          try {
            const response = await fetch("/api/auth/password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profileId: account.id, password }),
            });
            if (!response.ok) {
              const result = await response.json();
              setError(
                result.error?.message ??
                  "Không thể đặt mật khẩu. Vui lòng thử lại.",
              );
              return;
            }
            setPassword("");
            setReady(false);
            try {
              await logout();
            } catch {
              setError(
                "Mật khẩu đã được lưu nhưng chưa đăng xuất được. Hãy thử đăng xuất lại trước khi đăng nhập bằng mật khẩu mới.",
              );
              return;
            }
            router.replace("/login?reason=password_set");
          } catch {
            setError(
              "Không thể kết nối để lưu mật khẩu. Vui lòng kiểm tra kết nối và thử lại.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="field">
          Mật khẩu mới
          <input
            type="password"
            minLength={8}
            maxLength={72}
            disabled={!ready || pending}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={!ready || pending}>
          {pending ? "Đang lưu…" : "Lưu mật khẩu"}
        </Button>
      </form>
    </section>
  );
}
