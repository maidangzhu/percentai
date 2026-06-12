import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      external: [
        "node:fs",
        "node:path",
        "node:os",
        "node:crypto",
        "fs",
        "path",
        "os",
        "crypto",
        /^@prisma\/client/,
        /^@prisma\/adapter-/,
        "better-sqlite3",
        /^\.\.\/generated\/prisma\//,
        /^\.\/generated\/prisma\//,
      ],
    },
  },
  optimizeDeps: {
    exclude: ["@prisma/client", "@prisma/adapter-better-sqlite3", "better-sqlite3"],
  },
}));
