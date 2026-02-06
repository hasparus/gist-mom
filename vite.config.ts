import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
  root: "src/client",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/client"),
    },
  },
});
