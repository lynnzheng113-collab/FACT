import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Keep the two local prototypes on separate browser origins.
const identity = { variant: "original", root: import.meta.url };
const variantIdentity: Plugin = {
  name: "fact-variant-identity",
  configureServer(server) {
    server.middlewares.use("/__fact_variant", (_request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Cache-Control", "no-store");
      response.end(JSON.stringify(identity));
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use("/__fact_variant", (_request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Cache-Control", "no-store");
      response.end(JSON.stringify(identity));
    });
  },
};

export default defineConfig({
  base: "./",
  plugins: [react(), variantIdentity],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
