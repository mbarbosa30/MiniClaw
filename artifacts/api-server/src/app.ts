import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import router from "./routes";

const UPSTREAM = "https://selfclaw.ai";

// Helper: copy forwarded auth headers from the incoming request.
function authHeaders(req: Request): Record<string, string> {
  const h: Record<string, string> = {};
  if (req.headers.authorization) h["Authorization"] = req.headers.authorization;
  if (req.headers["x-wallet-address"]) h["X-Wallet-Address"] = req.headers["x-wallet-address"] as string;
  return h;
}

const app: Express = express();

app.use(cors());

// ── Custom handler: GET /api/selfclaw/v1/hosted-agents/:id/tasks/summary ────
// Intercepts the summary endpoint BEFORE the generic proxy so we can enrich the
// response. The upstream sometimes returns recentlyCompleted with count > 0 but
// an empty items array. When that happens we issue a second call for the actual
// completed tasks and stitch items in before returning, so the Activity view can
// display them without a manual reload.
app.get(
  "/api/selfclaw/v1/hosted-agents/:id/tasks/summary",
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const headers = authHeaders(req);

    try {
      const summaryUrl = `${UPSTREAM}/api/selfclaw/v1/hosted-agents/${id}/tasks/summary`;
      const summaryResp = await fetch(summaryUrl, { headers });

      if (!summaryResp.ok) {
        res.status(summaryResp.status).end(await summaryResp.text());
        return;
      }

      const summary = (await summaryResp.json()) as {
        recentlyCompleted?: { count?: number; items?: unknown[] };
        [key: string]: unknown;
      };

      // Enrich: populate items when backend only returned count
      const rc = summary.recentlyCompleted;
      if (rc && (rc.items ?? []).length === 0 && (rc.count ?? 0) > 0) {
        try {
          const completedUrl = `${UPSTREAM}/api/selfclaw/v1/hosted-agents/${id}/tasks?status=completed&limit=10`;
          const completedResp = await fetch(completedUrl, { headers });
          if (completedResp.ok) {
            const raw = (await completedResp.json()) as unknown;
            const items: unknown[] = Array.isArray(raw)
              ? raw
              : (raw as { tasks?: unknown[] })?.tasks ?? [];
            summary.recentlyCompleted = { ...rc, items };
          }
        } catch {
          // Fallback fetch failed — return summary as-is, items stay empty
        }
      }

      res.json(summary);
    } catch (err) {
      console.error("[tasks/summary enrichment error]", (err as Error).message);
      res.status(502).json({ error: "Upstream error fetching task summary." });
    }
  },
);

// ── Generic proxy: all other /api/selfclaw/* requests ───────────────────────
// Must be mounted BEFORE body parsers so the raw request stream is intact.
// All request headers (Authorization, X-Wallet-Address, etc.) are forwarded.
app.use(
  createProxyMiddleware({
    target: UPSTREAM,
    changeOrigin: true,
    pathFilter: "/api/selfclaw",
    on: {
      error: (err, req, res) => {
        console.error("[proxy error]", err.message);
        if ("headersSent" in res && !res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Proxy error: upstream connection failed." }));
        }
      },
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
