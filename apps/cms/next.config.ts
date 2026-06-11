import type { NextConfig } from "next";

const config: NextConfig = {
  // Prisma + 原生 better-sqlite3 必须留在 Node runtime，不要被 webpack 打包
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-better-sqlite3", "better-sqlite3"],
};

export default config;
