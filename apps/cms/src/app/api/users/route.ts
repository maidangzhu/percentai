import { requireApiAdmin } from "@/lib/apiAuth";
import { fail, ok } from "@/lib/apiResponse";
import { listUsers } from "@/lib/cmsService";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireApiAdmin();
  if (unauthorized) return unauthorized;
  try {
    return ok({ users: await listUsers() });
  } catch (error) {
    console.error("[cms-api] users failed", error);
    return fail(500, "users query failed");
  }
}
