import { requireApiAdmin } from "@/lib/apiAuth";
import { fail, ok } from "@/lib/apiResponse";
import { ensureUserSignupBonus } from "@/lib/cmsService";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireApiAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  try {
    return ok(await ensureUserSignupBonus(id));
  } catch (error) {
    console.error("[cms-api] ensure signup bonus failed", error);
    return fail(500, "ensure signup bonus failed");
  }
}
