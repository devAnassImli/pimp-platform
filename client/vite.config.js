import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Le proxy renvoie tous les appels /api vers le serveur Express (port 4000).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
