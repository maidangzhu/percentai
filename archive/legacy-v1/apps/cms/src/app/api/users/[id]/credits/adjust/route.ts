import { z } from "zod";
import { requireApiAdmin } from "@/lib/apiAuth";
import { fail, ok } from "@/lib/apiResponse";
import { adjustUserCredits, InsufficientCreditsError } from "@/lib/cmsService";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  delta: z.number().int().min(-100_000).max(100_000).refine((value) => value !== 0),
  note: z.string().trim().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireApiAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid body", 400, parsed.error.flatten());

  try {
    return ok(await adjustUserCredits({ userId: id, ...parsed.data }));
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return fail(402, "insufficient credits", error.code, {
        balance: error.balance,
        required: error.required,
      });
    }
    console.error("[cms-api] credit adjust failed", error);
    return fail(500, "credit adjust failed");
  }
}
