// frontend/vite.config.js
// ─── Конфигурация Vite ────────────────────────────────────────────────────────
//
// Прокси нужен только в dev-режиме (npm run dev).
// В продакшне запросы проксирует nginx.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,

    proxy: {
      // REST API → бэкенд FastAPI
      "/api": {
        target: "http://157.90.127.202:8000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },

      // WebSocket → бэкенд FastAPI
      "/ws": {
        target: "http://157.90.127.202:8000",
        changeOrigin: true,
        secure: false,
        ws: true,          // ← ОБЯЗАТЕЛЬНО для WebSocket
      },

      // Статика (загруженные планы) → бэкенд
      "/uploads": {
        target: "http://157.90.127.202:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
