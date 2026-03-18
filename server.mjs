import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || "";
console.log("ANTHROPIC_API_KEY present:", !!ANTHROPIC_KEY, "length:", ANTHROPIC_KEY.length);

// Proxy /api/anthropic/* → https://api.anthropic.com/*
app.use(
  "/api/anthropic",
  createProxyMiddleware({
    target: "https://api.anthropic.com",
    changeOrigin: true,
    pathRewrite: { "^/api/anthropic": "" },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader("x-api-key", ANTHROPIC_KEY);
        proxyReq.setHeader("anthropic-version", "2023-06-01");
        proxyReq.setHeader("anthropic-beta", "pdfs-2024-09-25");
        proxyReq.removeHeader("origin");
        proxyReq.removeHeader("referer");
      },
    },
  })
);

// Serve the React app
app.use(express.static(join(__dirname, "dist")));
app.get("/{*path}", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
