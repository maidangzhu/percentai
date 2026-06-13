import { requireApiAdmin } from "@/lib/apiAuth";
import { fail, ok } from "@/lib/apiResponse";
import { getUserDetail } from "@/lib/cmsService";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireApiAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    const user = await getUserDetail(id);
    if (!user) return fail(404, "user not found");
    return ok(user);
  } catch (error) {
    console.error("[cms-api] user detail failed", error);
    return fail(500, "user query failed");
  }
}
