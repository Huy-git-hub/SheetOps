"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { useWorkspace } from "./workspace-provider";
import { api } from "./resource";
import { roleLabels } from "@/lib/domain";

export function AccountView() {
  const { user, refresh, changed } = useWorkspace();
  const [name, setName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  if (!user) return null;
  return (
    <>
      <span className="section-kicker">THÔNG TIN CÁ NHÂN</span>
      <h1>Tài khoản của tôi</h1>
      <section className="panel account-panel">
        <p>
          Email: <strong>{user.email}</strong>
        </p>
        <p>Vai trò: {roleLabels[user.role]}</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (pending) return;
            setPending(true);
            setError("");
            setMessage("");
            try {
              const result = await api<{ full_name: string }>("/api/profile", {
                method: "PATCH",
                body: JSON.stringify({
                  full_name: (name ?? user.full_name).trim(),
                }),
              });
              setName(result.full_name);
              await refresh();
              await changed("users");
              setMessage("Đã cập nhật tên hiển thị.");
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : "Không thể đổi tên.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          <label className="field">
            Tên hiển thị
            <input
              value={name ?? user.full_name}
              onChange={(event) => setName(event.target.value)}
              minLength={1}
              maxLength={200}
              required
              autoComplete="name"
              disabled={pending}
            />
          </label>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Đang lưu…" : "Lưu tên hiển thị"}
          </Button>
        </form>
      </section>
    </>
  );
}
