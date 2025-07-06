import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Exclude node_modules from React transform
      exclude: /node_modules/,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Development server optimizations
  server: {
    // Optimize HMR
    hmr: {
      overlay: true,
    },
  },
  // Dependency optimization
  optimizeDeps: {
    // Pre-bundle these critical dependencies for faster dev server startup
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "firebase/auth",
      "zustand",
    ],
    // Exclude heavy dependencies that should be lazy loaded
    exclude: ["sonner", "framer-motion", "jspdf", "jspdf-autotable"],
    // Force re-optimization in development
    force: true,
  },
  // Performance optimizations
  build: {
    // Target modern browsers for smaller bundle size
    target: "es2020",
    // Enable aggressive minification
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
    // Generate source maps only in development
    sourcemap: process.env.NODE_ENV === "development",
    // Optimize CSS aggressively
    cssMinify: "lightningcss",
    // Advanced chunk splitting for optimal caching
    rollupOptions: {
      output: {
        // Improved manual chunks for better performance
        manualChunks: (id) => {
          // Core React libraries
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "react-core";
          }
          // Router
          if (id.includes("react-router")) {
            return "router";
          }
          // Firebase
          if (id.includes("firebase")) {
            return "firebase";
          }
          // Heavy UI libraries (only load when needed)
          if (id.includes("framer-motion") || id.includes("sonner")) {
            return "ui-heavy";
          }
          // Chart/visualization libraries
          if (id.includes("chart") || id.includes("d3")) {
            return "charts";
          }
          // Utility libraries
          if (
            id.includes("lodash") ||
            id.includes("date-fns") ||
            id.includes("uuid")
          ) {
            return "utils";
          }
          // Auth-related
          if (id.includes("zustand") || id.includes("auth")) {
            return "auth";
          }
          // All other vendor libraries
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                ?.replace(".tsx", "")
                .replace(".ts", "") || "chunk"
            : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
      // Tree-shake unused code aggressively
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    // Preload module directives
    modulePreload: {
      polyfill: true,
    },
    // Optimize asset processing
    assetsInlineLimit: 4096, // Inline small assets
    copyPublicDir: true,
  },
  // Enable CSS code splitting
  css: {
    devSourcemap: process.env.NODE_ENV === "development",
  },
});
