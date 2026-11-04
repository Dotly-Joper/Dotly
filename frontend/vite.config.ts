import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/screenshots": "http://localhost:3000",
    },
  },
});