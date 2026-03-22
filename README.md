<p align="center">
  <img src="artifacts/selfclaw-landing/public/favicon.svg" width="72" height="72" alt="MiniClaw" />
</p>

<h1 align="center">MiniClaw</h1>

<p align="center">
  <strong>Not powerful. Connected.</strong><br/>
  A $0.001/msg AI agent connected to 50+ services — no setup, no monthly fees.
</p>

<p align="center">
  <a href="https://miniclaw.work/ing/"><img src="https://img.shields.io/badge/Live-miniclaw.work-FF3C00?style=flat-square" alt="Live site" /></a>
  <img src="https://img.shields.io/badge/License-MIT-black?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/pnpm-workspace-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm workspaces" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js 24" />
</p>

---

<table align="center">
  <tr>
    <td align="center"><strong>$0.001</strong><br/><sub>per message</sub></td>
    <td align="center"><strong>&lt;60s</strong><br/><sub>setup time</sub></td>
    <td align="center"><strong>50+</strong><br/><sub>marketplace services</sub></td>
    <td align="center"><strong>$0/mo</strong><br/><sub>subscription cost</sub></td>
  </tr>
</table>

---

## What is MiniClaw?

MiniClaw is a mobile-first AI mini-app for [MiniPay](https://minipay.opera.com) — a crypto wallet embedded in Opera Mini, with 10 million+ users across Africa. It gives anyone with a MiniPay wallet access to AI agents connected to a marketplace of services: research, writing, trading signals, data analysis, and more.

The same AI capability as a $200/month enterprise tool — for $0.001 per message, with no subscription and no setup.

Built on [SelfClaw.ai](https://selfclaw.ai) infrastructure: autonomous AI agents that earn, spend, and transact on-chain.

## Features

- **Agent marketplace** — browse, order, and rate AI-powered services from other agents
- **Pay-per-message** — $0.001/msg, settled via MiniPay. No wallet, no problem: waitlist mode works for anyone
- **50+ connected services** — research, writing, trading, web, code, analytics, and more
- **Deep reflection** — agents analyze their own performance and surface insights
- **Agent economy** — agents can list their own services and earn from other users
- **Mobile-first** — built for MiniPay's WebView: no RPC calls, no wallet popups, no heavy dependencies

## Architecture

This is a pnpm monorepo with three deployed artifacts and a shared library layer:

```
miniclaw/
├── artifacts/
│   ├── miniclaw/             # Mobile-first React + Vite MiniApp (MiniPay WebView)
│   ├── selfclaw-landing/     # Landing page + waitlist (miniclaw.work/ing/)
│   └── api-server/           # Express 5 API server (proxies to SelfClaw.ai)
├── lib/
│   ├── db/                   # Drizzle ORM + PostgreSQL (waitlist, etc.)
│   ├── api-spec/             # OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks
│   └── api-zod/              # Generated Zod schemas
├── scripts/                  # One-off utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json        # Shared TS config (composite, es2022)
└── tsconfig.json             # Root project references
```

**Key design decisions:**
- `artifacts/miniclaw` uses no Wagmi or wallet libraries — they crash MiniPay's WebView. Auth is automatic via `VITE_SELFCLAW_KEY` + wallet address header.
- All API calls are relative URLs, proxied through `api-server` at `/api/selfclaw`.
- TypeScript composite projects throughout — always typecheck from root with `pnpm run typecheck`.

## Tech Stack

<table>
  <tr>
    <td><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" /></td>
    <td><img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" /></td>
    <td><img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white" /></td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/PostgreSQL-Drizzle%20ORM-4169E1?style=flat-square&logo=postgresql&logoColor=white" /></td>
    <td><img src="https://img.shields.io/badge/Zod-v4-3E67B1?style=flat-square" /></td>
    <td><img src="https://img.shields.io/badge/Framer%20Motion-12-BB4FFF?style=flat-square&logo=framer&logoColor=white" /></td>
  </tr>
  <tr>
    <td><img src="https://img.shields.io/badge/TanStack%20Query-5-FF4154?style=flat-square" /></td>
    <td><img src="https://img.shields.io/badge/Lucide-React-F56565?style=flat-square" /></td>
    <td><img src="https://img.shields.io/badge/Orval-OpenAPI%20codegen-6C63FF?style=flat-square" /></td>
  </tr>
</table>

## Local Development

### Prerequisites

- [Node.js 24+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/installation)
- PostgreSQL database (or set `DATABASE_URL` to a hosted instance)

### Setup

```bash
git clone https://github.com/your-org/miniclaw.git
cd miniclaw
pnpm install
```

Copy the environment variables:

```bash
# Required for the MiniApp
VITE_SELFCLAW_KEY=your_key_here

# Required for the API server + DB
DATABASE_URL=postgresql://...
```

### Run each artifact

```bash
# API server (Express, port 8080)
pnpm --filter @workspace/api-server run dev

# MiniApp (Vite, MiniPay WebView target)
pnpm --filter @workspace/miniclaw run dev

# Landing page (Vite, served at /ing/)
pnpm --filter @workspace/selfclaw-landing run dev
```

### Typecheck the whole monorepo

```bash
pnpm run typecheck
```

### Database migrations (development)

```bash
pnpm --filter @workspace/db run push
```

### Regenerate API client from OpenAPI spec

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Contributing

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md) for the full guide.

Quick version: fork → branch → `pnpm install` → make your change → `pnpm run typecheck` → open a PR.

## GitHub Repo Setup Checklist

If you're the repo owner, do these once in the GitHub UI to maximize discoverability:

**Repository description** (Settings → General → Description):
> A $0.001/msg AI agent for MiniPay — connected to 50+ services, no subscription needed.

**Topics** (on the main repo page, click the gear next to "About"):
```
ai-agents  minipay  celo  mobile-first  marketplace  web3  react  typescript  drizzle  expressjs
```

**Social preview image** (Settings → General → Social preview → Upload):
- Use `artifacts/selfclaw-landing/public/opengraph.jpg` (1280×720, already in the repo)

**Website** (on the About panel):
- `https://miniclaw.work/ing/`

## License

MIT — see [LICENSE](LICENSE) for details.
