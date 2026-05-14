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
      entry: {
        "craft-dashboard": "src/craft-dashboard.jsx",
        "supabase-auth": "src/supabase-auth.js",
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    codeSplitting: false,
    rollupOptions: {
      output: {},
    },
  },
});
