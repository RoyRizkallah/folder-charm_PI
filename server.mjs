import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Proxy /api/anthropic/* → https://api.anthropic.com/*
app.use(
  "/api/anthropic",
  createProxyMiddleware({
    target: "https://api.anthropic.com",
    changeOrigin: true,
    pathRewrite: { "^/api/anthropic": "" },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader("x-api-key", process.env.VITE_ANTHROPIC_API_KEY || "");
        proxyReq.setHeader("anthropic-version", "2023-06-01");
        // Remove the browser-only header since we're server-side now
        proxyReq.removeHeader("anthropic-dangerous-allow-browser");
      },
    },
  })
);

// Serve the React app
app.use(express.static(join(__dirname, "dist")));
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
