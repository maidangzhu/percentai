"use server";

import { cookies } from "next/headers";
import { checkAdminPassword, makeAdminToken } from "@/lib/auth-core";

const ADMIN_COOKIE = "percent_cms_admin";

export async function verifyAdminPasswordClient(password: string): Promise<boolean> {
  // Server action：密码在服务端比对，绝不暴露给客户端
  if (!checkAdminPassword(password)) return false;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, makeAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return true;
}
