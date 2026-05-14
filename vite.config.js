import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    emptyOutDir: false,
    outDir: "assets",
    lib: {
      entry: "src/craft-dashboard.jsx",
      formats: ["es"],
      fileName: () => "craft-dashboard.js",
    },
    codeSplitting: false,
    rollupOptions: {
      output: {},
    },
  },
});
