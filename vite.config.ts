import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    hmr: {
      port: 5173,
    },
    allowedHosts: ["b62b-180-75-6-105.ngrok-free.app"],
    cors: true,
  },
  preview: {
    host: true,
    port: 5173, // ✅ This ensures preview runs on 5173
    strictPort: false,
  },
  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info"],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-core": ["react", "react-dom"],
          router: ["react-router-dom"],
          firebase: ["firebase/auth", "firebase/firestore", "firebase/storage"],
          ui: ["framer-motion", "sonner"],
          utils: ["zustand"],
        },
        entryFileNames: "js/[name]-[hash].js",
        chunkFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/[name]-[hash][extname]";
          }
          if (
            assetInfo.name?.endsWith(".tsx") ||
            assetInfo.name?.endsWith(".ts")
          ) {
            return "js/[name]-[hash].js";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "firebase/auth",
      "zustand",
    ],
  },
});
