import { describe, expect, it, vi } from "vitest";
import {
  acceptInvitationSession,
  invitationFailure,
  invitationOrigin,
  verifyInvitationAccess,
} from "../src/lib/invitations";

describe("invitation diagnostics", () => {
  it("distinguishes timeout, rate limit and duplicate accounts without leaking provider details", () => {
    expect(invitationFailure({ status: 504 }).code).toBe("INVITE_TIMEOUT");
    expect(invitationFailure({ status: 429 }).status).toBe(429);
    expect(invitationFailure({ code: "email_exists" }).status).toBe(409);
    const failure = invitationFailure({
      status: 500,
      message: "SMTP_PASSWORD=secret",
    });
    expect(failure.code).toBe("INVITE_AUTH_FAILED");
    expect(JSON.stringify(failure)).not.toContain("secret");
  });
  it("requires a canonical origin and production HTTPS", () => {
    expect(invitationOrigin("https://sheetops.vercel.app", true)).toBe(
      "https://sheetops.vercel.app",
    );
    expect(invitationOrigin("http://localhost:3000", false)).toBe(
      "http://localhost:3000",
    );
    for (const value of [
      undefined,
      "invalid",
      "http://localhost:3000",
      "https://host/path",
      "https://user:pass@host",
      "https://host/?query=1",
      "javascript:alert(1)",
    ])
      expect(invitationOrigin(value, true)).toBeNull();
  });
});

describe("invitation session acceptance", () => {
  const client = () => ({
    setSession: vi.fn().mockResolvedValue({ error: null }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "test", invited_at: "2026-11-05T00:00:00Z" } },
      error: null,
    }),
  });
  it("explicitly exchanges the default invitation fragment before checking the user", async () => {
    const auth = client();
    expect(
      await acceptInvitationSession(
        auth,
        "#access_token=test-access&refresh_token=test-refresh&type=invite",
      ),
    ).toBe(true);
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: "test-access",
      refresh_token: "test-refresh",
    });
    expect(auth.getUser).toHaveBeenCalledOnce();
  });
  it.each([
    "#error=access_denied",
    "#access_token=a&type=invite",
    "#access_token=a&refresh_token=b&type=magiclink",
  ])(
    "rejects invalid invitation %s instead of using an existing session",
    async (fragment) => {
      const auth = client();
      expect(await acceptInvitationSession(auth, fragment)).toBe(false);
      expect(auth.getUser).not.toHaveBeenCalled();
    },
  );
  it("accepts password recovery for an already-confirmed invited account", async () => {
    const auth = client();
    expect(
      await acceptInvitationSession(
        auth,
        "#access_token=test-access&refresh_token=test-refresh&type=recovery",
      ),
    ).toBe(true);
    expect(auth.setSession).toHaveBeenCalledOnce();
    expect(auth.getUser).toHaveBeenCalledOnce();
  });
  it("rejects a token exchange failure", async () => {
    const auth = client();
    auth.setSession.mockResolvedValue({ error: { message: "expired" } });
    expect(
      await acceptInvitationSession(
        auth,
        "#access_token=a&refresh_token=b&type=invite",
      ),
    ).toBe(false);
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it("can recover from a temporary profile outage without accepting an unchecked session", async () => {
    const auth = client();
    const fragment = "#access_token=a&refresh_token=b&type=invite";
    const load = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        Response.json({ data: { profile: { id: "test" } } }),
      );
    expect(await verifyInvitationAccess(auth, fragment, load)).toEqual({
      state: "unavailable",
    });
    expect(await verifyInvitationAccess(auth, fragment, load)).toEqual({
      state: "ready",
      session: { profile: { id: "test" } },
    });
    expect(auth.getUser).toHaveBeenCalledTimes(2);
  });
  it("distinguishes temporary Auth/network failures from expired or forbidden invitations", async () => {
    const auth = client();
    const load = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 503 },
    });
    expect(await verifyInvitationAccess(auth, "", load)).toEqual({
      state: "unavailable",
    });
    expect(load).not.toHaveBeenCalled();
    expect(await verifyInvitationAccess(auth, "", load)).toEqual({
      state: "invalid",
    });
    auth.getUser.mockRejectedValueOnce(new TypeError("network failed"));
    expect(await verifyInvitationAccess(auth, "", load)).toEqual({
      state: "unavailable",
    });
  });
  it("does not retry an invalid fragment using an unrelated current session", async () => {
    const auth = client();
    const load = vi.fn();
    expect(
      await verifyInvitationAccess(auth, "#error=access_denied", load),
    ).toEqual({ state: "invalid" });
    expect(auth.getUser).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });
  it("keeps a temporarily failed token exchange retryable", async () => {
    const auth = client();
    auth.setSession.mockResolvedValue({ error: { status: 0 } });
    const load = vi.fn();
    expect(
      await verifyInvitationAccess(
        auth,
        "#access_token=a&refresh_token=b&type=invite",
        load,
      ),
    ).toEqual({ state: "unavailable" });
    expect(auth.getUser).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  });
  it("validates server-issued callback cookies with getUser, never trusting session data alone", async () => {
    const auth = client();
    expect(await acceptInvitationSession(auth, "")).toBe(true);
    expect(auth.setSession).not.toHaveBeenCalled();
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await acceptInvitationSession(auth, "")).toBe(false);
  });
  it("rejects an ordinary Admin login on an invitation page without invitation tokens", async () => {
    const auth = client();
    auth.getUser.mockResolvedValue({
      data: { user: { id: "admin" } },
      error: null,
    });
    expect(await acceptInvitationSession(auth, "")).toBe(false);
    const load = vi.fn();
    expect(await verifyInvitationAccess(auth, "", load)).toEqual({
      state: "invalid",
    });
    expect(load).not.toHaveBeenCalled();
  });
  it("rejects a server session for another account after verifying the invitation token", async () => {
    const auth = client();
    const load = vi
      .fn()
      .mockResolvedValue(Response.json({ data: { profile: { id: "other" } } }));
    expect(
      await verifyInvitationAccess(
        auth,
        "#access_token=a&refresh_token=b&type=invite",
        load,
      ),
    ).toEqual({ state: "invalid" });
    expect(auth.getUser).toHaveBeenCalledWith("a");
  });
});
