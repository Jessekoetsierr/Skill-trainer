import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { modeInitScript } from "coachman-ui/init-script";

// One self-contained index.html (fonts included), so the same build runs
// from the local server and as a Claude artifact.
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile({ removeViteModuleLoader: true }),
    {
      name: "coachman-mode-init",
      transformIndexHtml: () => [{ tag: "script", children: modeInitScript, injectTo: "head-prepend" }],
    },
  ],
  resolve: { dedupe: ["react", "react-dom"] },
  optimizeDeps: { exclude: ["coachman-ui"], include: ["lucide-react"] },
  build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false, chunkSizeWarningLimit: 5000 },
  server: { proxy: { "/api": "http://127.0.0.1:5173" }, port: 5174 },
});
