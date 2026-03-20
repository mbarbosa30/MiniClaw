import express, { type Express } from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import router from "./routes";

const app: Express = express();

app.use(cors());

// Proxy /api/selfclaw/* → https://selfclaw.ai/api/selfclaw/* server-side.
// Must be mounted BEFORE body parsers so the raw request stream is intact.
// All request headers (Authorization, X-Wallet-Address, etc.) are forwarded
// by default. Supports SSE streaming (the chat endpoint).
app.use(
  createProxyMiddleware({
    target: "https://selfclaw.ai",
    changeOrigin: true,
    pathFilter: "/api/selfclaw",
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
