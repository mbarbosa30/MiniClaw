# Contributing to MiniClaw

Thanks for your interest. This is a pnpm monorepo — here's what you need to know before opening a PR.

## Repo structure

```
artifacts/miniclaw/           # Mobile-first MiniApp (React + Vite)
artifacts/selfclaw-landing/   # Landing page (React + Vite, served at /ing/)
artifacts/api-server/         # Express 5 API + proxy layer
lib/db/                       # Drizzle ORM schema + DB client
lib/api-spec/                 # OpenAPI spec + Orval codegen
lib/api-client-react/         # Generated React Query hooks (do not edit by hand)
lib/api-zod/                  # Generated Zod schemas (do not edit by hand)
scripts/                      # One-off utility scripts
```

## Getting started

```bash
git clone https://github.com/your-org/miniclaw.git
cd miniclaw
pnpm install
```

Set up your environment variables (see README for the full list), then start whichever artifact you're working on:

```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/miniclaw run dev
pnpm --filter @workspace/selfclaw-landing run dev
```

## Before opening a PR

1. **Typecheck from root** — never from inside a single package:
   ```bash
   pnpm run typecheck
   ```

2. **Keep PRs focused** — one feature or fix per PR. If you're touching multiple unrelated areas, split into separate PRs.

3. **No generated file edits** — `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/` are produced by Orval from the OpenAPI spec. Edit `lib/api-spec/openapi.yaml` and run `pnpm --filter @workspace/api-spec run codegen` instead.

4. **MiniApp constraints** — `artifacts/miniclaw` targets MiniPay's WebView. Do not add Wagmi, wallet connect libraries, or any package that uses native browser APIs not available in WebView.

5. **Relative API URLs** — all API calls in `artifacts/miniclaw` must use relative URLs (no hardcoded hosts). They are proxied through `api-server`.

## PR conventions

- Branch name: `feat/short-description` or `fix/short-description`
- Commit messages: plain English, imperative mood ("Add category filter chips", not "Added…")
- PR description: what changed, why, and how to test it

## Questions?

Open a [Discussion](https://github.com/your-org/miniclaw/discussions) or file an issue using one of the templates.
