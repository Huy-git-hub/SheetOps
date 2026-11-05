import { beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { actor, rpc } = vi.hoisted(() => ({ actor: vi.fn(), rpc: vi.fn() }));
vi.mock("../src/lib/server/http", async () => ({
  ...(await vi.importActual<typeof import("../src/lib/server/http")>(
    "../src/lib/server/http",
  )),
  requireActor: actor,
}));
vi.mock("../src/lib/supabase/server", () => ({ serverClient: vi.fn() }));
import { PATCH } from "../src/app/api/profile/route";
const request = (value: unknown) =>
  new Request("http://localhost:3000/api/profile", {
    method: "PATCH",
    headers: {
      origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(value),
  });
beforeEach(() => {
  vi.clearAllMocks();
  actor.mockResolvedValue({ db: { rpc } });
  rpc.mockResolvedValue({ data: "Tên mới", error: null });
});
it("uses a target-free self-service RPC for a freshly authorized user", async () => {
  expect((await PATCH(request({ full_name: "  Tên mới  " }))).status).toBe(200);
  expect(actor).toHaveBeenCalledWith(undefined, "admin");
  expect(rpc).toHaveBeenCalledWith("update_own_profile_name", {
    full_name_input: "Tên mới",
  });
});
it.each([
  { full_name: "Tên mới", role: "admin" },
  { full_name: "Tên mới", id: "someone-else" },
  { full_name: "   " },
])("rejects extra access/target fields or blank names", async (value) => {
  expect((await PATCH(request(value))).status).toBe(422);
  expect(rpc).not.toHaveBeenCalled();
});
it("reports a missing migration instead of bypassing database permissions", async () => {
  rpc.mockResolvedValue({ error: { code: "PGRST202" } });
  const response = await PATCH(request({ full_name: "Tên mới" }));
  expect(response.status).toBe(503);
  expect((await response.json()).error.code).toBe("PROFILE_MIGRATION_REQUIRED");
});
