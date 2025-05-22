import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// import tailwindcss from "@tailwindcss/vite"; // Removed: not a valid package

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
