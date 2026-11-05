import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const { actor, updateUser } = vi.hoisted(() => ({
  actor: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("../src/lib/server/http", async () => {
  const actual = await vi.importActual<typeof import("../src/lib/server/http")>(
    "../src/lib/server/http",
  );
  return { ...actual, requireActor: actor };
});
vi.mock("../src/lib/supabase/server", () => ({ serverClient: vi.fn() }));
import { POST } from "../src/app/api/auth/password/route";

const accountId = "11111111-1111-4111-8111-111111111111";
function request(
  profileId = accountId,
  origin = "http://localhost:3000",
  password = "test-only-strong-password",
) {
  return new Request("http://localhost:3000/api/auth/password", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, password }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  actor.mockResolvedValue({
    profile: { id: accountId },
    db: { auth: { updateUser } },
  });
  updateUser.mockResolvedValue({ error: null });
});
it.each([7, 8, 72, 73])(
  "enforces the password length boundary at %s characters",
  async (length) => {
    const result = await POST(
      request(accountId, "http://localhost:3000", "a".repeat(length)),
    );
    expect(result.status).toBe(length >= 8 && length <= 72 ? 200 : 422);
    if (length < 8 || length > 72) expect(updateUser).not.toHaveBeenCalled();
  },
);
it("refuses to change a different account's password after a browser session switch", async () => {
  const result = await POST(request("22222222-2222-4222-8222-222222222222"));
  expect(result.status).toBe(409);
  expect((await result.json()).error.code).toBe("INVITE_SESSION_CHANGED");
  expect(updateUser).not.toHaveBeenCalled();
});
it("changes only the freshly authorized account and never returns the password", async () => {
  const result = await POST(request());
  expect(result.status).toBe(200);
  expect(updateUser).toHaveBeenCalledWith({
    password: "test-only-strong-password",
  });
  expect(await result.json()).toEqual({ data: { passwordSet: true } });
});
it("checks the request origin before authentication or mutation", async () => {
  expect((await POST(request(accountId, "https://other.example"))).status).toBe(
    403,
  );
  expect(actor).not.toHaveBeenCalled();
  expect(updateUser).not.toHaveBeenCalled();
});
it("keeps temporary Auth failures separate from rejected passwords", async () => {
  updateUser.mockResolvedValue({
    error: { status: 503, message: "private upstream information" },
  });
  const result = await POST(request());
  expect(result.status).toBe(503);
  expect(await result.text()).not.toContain("private upstream information");
});
