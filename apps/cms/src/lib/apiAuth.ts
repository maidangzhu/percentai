import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/auth-core";
import { fail } from "@/lib/apiResponse";

const ADMIN_COOKIE = "percent_cms_admin";

export async function requireApiAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return fail(401, "unauthorized");
  }
  return null;
}
