"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { makeAdminToken, verifyAdminToken } from "./auth-core";

const ADMIN_COOKIE = "percent_cms_admin";

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, makeAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    redirect("/login");
  }
}
