import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { reset, create } = vi.hoisted(() => ({
  reset: vi.fn(),
  create: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: create }));
vi.mock("../src/lib/supabase/server", () => ({
  publicConfig: () => ({
    url: "https://fixture.example.invalid",
    key: "test-publishable",
  }),
  serverClient: vi.fn(),
}));
import { POST } from "../src/app/api/auth/password-reset/route";
const request = (value: unknown, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/auth/password-reset", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  vi.stubEnv("VERCEL_ENV", "development");
  create.mockReturnValue({ auth: { resetPasswordForEmail: reset } });
  reset.mockResolvedValue({ error: null });
});
it("sends a fixed configured recovery redirect and a generic account-independent response", async () => {
  const response = await POST(request({ email: "test@example.invalid" }));
  expect(response.status).toBe(202);
  expect(reset).toHaveBeenCalledWith("test@example.invalid", {
    redirectTo: "http://localhost:3000/auth/accept",
  });
  expect(await response.text()).not.toContain("test@example.invalid");
  expect(create.mock.calls[0][2].auth).toMatchObject({
    flowType: "implicit",
    persistSession: false,
  });
});
it("rejects a caller-supplied redirect and cross-origin mail request", async () => {
  expect(
    (
      await POST(
        request({
          email: "test@example.invalid",
          redirectTo: "https://attacker.invalid",
        }),
      )
    ).status,
  ).toBe(422);
  expect(
    (
      await POST(
        request({ email: "test@example.invalid" }, "https://attacker.invalid"),
      )
    ).status,
  ).toBe(403);
  expect(reset).not.toHaveBeenCalled();
});
it("preserves provider throttling without disclosing private provider messages", async () => {
  reset.mockResolvedValue({
    error: { status: 429, message: "private provider" },
  });
  const response = await POST(request({ email: "test@example.invalid" }));
  expect(response.status).toBe(429);
  expect(await response.text()).not.toContain("private provider");
});
