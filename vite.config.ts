import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    cloudflare(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/client"),
    },
  },
  environments: {
    client: {
      build: {
        rollupOptions: {
          input: path.resolve(__dirname, "index.html"),
        },
      },
    },
  },
  server: {
    port: 1999,
  },
});
