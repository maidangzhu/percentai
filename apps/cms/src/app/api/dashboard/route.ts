import { requireApiAdmin } from "@/lib/apiAuth";
import { fail, ok } from "@/lib/apiResponse";
import { getDashboardData } from "@/lib/cmsService";

export const dynamic = "force-dynamic";

export async function GET() {
  const unauthorized = await requireApiAdmin();
  if (unauthorized) return unauthorized;
  try {
    return ok(await getDashboardData());
  } catch (error) {
    console.error("[cms-api] dashboard failed", error);
    return fail(500, "dashboard query failed");
  }
}
