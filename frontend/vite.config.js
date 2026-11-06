import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const frontendRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        landing: resolve(frontendRoot, "index.html"),
        dashboard: resolve(frontendRoot, "dashboard.html"),
        admin: resolve(frontendRoot, "admin.html")
      }
    }
  }
});
