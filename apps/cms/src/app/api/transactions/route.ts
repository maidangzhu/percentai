import { requireApiAdmin } from "@/lib/apiAuth";
import { fail, ok } from "@/lib/apiResponse";
import { listTransactions } from "@/lib/cmsService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = await requireApiAdmin();
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const page = Math.max(0, Number(url.searchParams.get("page") ?? 0));
  const user = url.searchParams.get("user")?.trim() || undefined;
  const reason = url.searchParams.get("reason")?.trim() || undefined;

  try {
    return ok(await listTransactions({ page, user, reason }));
  } catch (error) {
    console.error("[cms-api] transactions failed", error);
    return fail(500, "transactions query failed");
  }
}
