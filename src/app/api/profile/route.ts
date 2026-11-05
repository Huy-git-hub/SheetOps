import { z } from "zod";
import {
  body,
  checkOrigin,
  fail,
  HttpError,
  json,
  requireActor,
} from "@/lib/server/http";

export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const input = z
      .object({ full_name: z.string().trim().min(1).max(200) })
      .strict()
      .parse(await body(request));
    const { db } = await requireActor(undefined, "admin");
    const { data, error } = await db.rpc("update_own_profile_name", {
      full_name_input: input.full_name,
    });
    if (error?.code === "PGRST202")
      throw new HttpError(
        503,
        "Chức năng đổi tên chưa được cập nhật trên database. Vui lòng liên hệ quản trị viên.",
        "PROFILE_MIGRATION_REQUIRED",
      );
    if (error) throw error;
    return json({ full_name: data });
  } catch (error) {
    return fail(error);
  }
}
