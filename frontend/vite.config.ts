import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// paths aliass
import * as path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react({
      // plugins: [["@swc/plugin-styled-components", {}]] 
    }),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: "0.0.0.0",
    proxy: {
      '/api': {
        // target: 'http://192.168.1.115:3000',
        target: 'http://backend:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    watch: {
      usePolling: true
    },
    origin: "http://localhost:5173",

    allowedHosts: [
      'localhost',
      'dev.hqnw.live',
    ],
  },
})
