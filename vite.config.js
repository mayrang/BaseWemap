import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: false,
  },
  base: "/BaseWemap/",
  resolve: {
    alias: {
      // '@': resolve(__dirname, './src'),
      apis: resolve(__dirname, "./src/apis"),
      assets: resolve(__dirname, "./src/assets"),
      components: resolve(__dirname, "./src/components"),
      layouts: resolve(__dirname, "./src/layouts"),
      pages: resolve(__dirname, "./src/pages"),
      utils: resolve(__dirname, "./src/utils"),
    },
  },
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://localhost:5000/",
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    // port: 3000,
  },
  test: {
    css: false,
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/utils/test/setup.js",
    coverage: {
      reporter: ["text", "lcov"],
    },
  },
});
