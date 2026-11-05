"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/components/resource";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="login-form">
      <h1>Quên mật khẩu</h1>
      <p>
        Nhập email được quản trị viên cấp. Bạn sẽ thiết lập mật khẩu mới từ liên
        kết trong email.
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setPending(true);
          setError("");
          setMessage("");
          try {
            const result = await api<{ message: string }>(
              "/api/auth/password-reset",
              { method: "POST", body: JSON.stringify({ email }) },
            );
            setMessage(result.message);
          } catch (cause) {
            setError(
              cause instanceof Error ? cause.message : "Không thể gửi yêu cầu.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={pending}
          />
        </label>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Đang gửi…" : "Gửi liên kết đặt lại"}
        </Button>
      </form>
      <Link href="/login">Về trang đăng nhập</Link>
    </section>
  );
}
