import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { authPrisma } from "./db.js";

const fallbackSecret = "percent-tracker-local-dev-secret-change-me";
const isProduction = process.env["NODE_ENV"] === "production" || process.env["VERCEL"] === "1";
const authBaseURL =
  process.env["BETTER_AUTH_URL"] ?? (isProduction ? "https://api.thepercentai.com" : "http://localhost:3000");

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: authBaseURL,
  secret: process.env["BETTER_AUTH_SECRET"] ?? fallbackSecret,
  trustedOrigins: [
    "https://api.thepercentai.com",
    "http://localhost:1420",
    "http://127.0.0.1:1420",
    "tauri://localhost",
    "http://tauri.localhost",
  ],
  database: prismaAdapter(authPrisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [bearer()],
  advanced: {
    useSecureCookies: isProduction,
    defaultCookieAttributes: isProduction
      ? {
          sameSite: "none",
          secure: true,
        }
      : undefined,
  },
});
