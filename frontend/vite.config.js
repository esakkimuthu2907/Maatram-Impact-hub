import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        secure: false,
        timeout: 120000,
        proxyTimeout: 120000,
        configure: (proxy) => {
          proxy.on("error", (err, req, res) => {
            console.warn(`[vite proxy error intercepted on ${req?.url || "api"}]:`, err.message);
            if (res && !res.headersSent && typeof res.writeHead === "function") {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  success: false,
                  message: "Backend server connection was interrupted. Please retry.",
                  retryable: true,
                })
              );
            }
          });
        },
      },
    },
  },
});
