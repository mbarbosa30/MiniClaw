# Synthesis Hackathon Submission Strategy

## Project: MiniClaw by SelfClaw

**What it is:** A privacy-first AI agent verification registry and economic platform on Celo. MiniClaw.work is the consumer miniapp — cheap personal AI agents with wallets, tokens, a services marketplace, and agent-to-agent commerce. Runs inside MiniPay. SelfClaw.ai is the underlying platform providing verification, identity, and economic infrastructure.

**Live URLs:** selfclaw.ai (platform), miniclaw.work (miniapp)

**Key differentiator:** Only verified humans and agents can sell on the marketplace. Verification on SelfClaw uses Self.xyz passport proofs (ZK-powered). MiniClaw will integrate Self verification to enforce the same trust layer — ensuring every marketplace seller is identity-verified without exposing personal data.

---

## Submission API

- **Base URL:** `https://synthesis.devfolio.co`
- **Skill reference:** `curl -s https://synthesis.md/skill.md`
- **Submission skill:** `curl -s https://synthesis.md/submission/skill.md`

### Registration Flow

1. `POST /register/init` — agent info + human info → get `pendingId`
2. Verify via email OTP: `POST /register/verify/email/send` → `POST /register/verify/email/confirm`
3. `POST /register/complete` → get `apiKey` (format: `sk-synth-...`)
4. Self-custody transfer (required before publishing)
5. `POST /projects` — create draft project with track UUIDs
6. `PUT /projects/:id` — add full description, repo, submission metadata
7. `POST /projects/:id/publish` — publish (admin only, all members must be self-custody)

---

## Target Tracks (up to 10 + automatic Open Track)

### 1. Best Agent on Celo — $5,000
- **UUID:** `ff26ab4933c84eea856a5c6bf513370b`
- **Company:** Celo
- **Angle:** MiniClaw runs on Celo with real wallets, deployable tokens, and a services marketplace — all inside MiniPay. 20 persona templates including 7 designed for Global South entrepreneurs (AI Hustle Builder, VibeCoder, Biz Launcher, Gig Maximizer, Creator Coach, Distribution Strategist, Family Treasurer). Agents create Celo wallets, deploy ERC-20 tokens, receive gas sponsorship, and transact on Celo mainnet.

### 2. Agents With Receipts — ERC-8004 — $4,000
- **UUID:** `3bf41be958da497bbb69f1a150c76af9`
- **Company:** Protocol Labs
- **Angle:** Every MiniClaw agent registers an onchain ERC-8004 identity NFT on Celo. This identity is used for verification, reputation (PoC scoring), and trust signals in agent-to-agent commerce. The identity contract is deployed and live — agents have permanent onchain identities that follow them across the ecosystem.

### 3. Let the Agent Cook — No Humans Required — $4,000
- **UUID:** `10bd47fac07e4f85bda33ba482695b24`
- **Company:** Protocol Labs
- **Angle:** MiniClaw agents operate autonomously across multiple dimensions:
  - **Proactive Reflection** — reviews conversation summaries and top memories, proposes 1-3 follow-up tasks (research, suggestions, reviews, opportunities)
  - **Proactive Outreach** — generates autonomous check-in messages when the owner is inactive (3+ days), on task completion, conversation milestones, and knowledge gap nudges
  - **Daily Digest** — autonomous 24h skill that generates a conversational briefing of agent activity in the agent's personality style
  - **Spawning Pipeline** — researches the owner and seeds agent memories so the agent starts working immediately without manual setup
  - **Calendar Reminders** — agents set and fire reminders autonomously
  - Owner controls frequency ("chatty"/"balanced"/"quiet"/"disabled") but the agent decides what to do

### 4. Ship Something Real with OpenServ — $4,500
- **UUID:** `9bd8b3fde4d0458698d618daf496d1c7`
- **Company:** OpenServ
- **Angle:** Multi-agent platform where agents discover each other via a social feed, evaluate trust via token portfolios (social collateral), pay each other with their own tokens via belief commerce, tip each other, and complete marketplace orders. 15 built-in platform services auto-accept and execute asynchronously. Real-time event stream (SSE) for monitoring all agent activity. Agent-to-agent economic actions: tipping, token buying, service requesting — all as first-class chat tools. Deployed and live with real users.

### 5. ERC-8183 Open Build — $2,000
- **UUID:** `49c3d90b1f084c44a3585231dc733f83`
- **Company:** Virtuals
- **Angle:** MiniClaw's belief commerce system is a working implementation of what ERC-8183 standardizes — built before the spec existed. The commerce lifecycle maps directly:
  - ERC-8183: Open → Funded → Submitted → Completed/Rejected
  - MiniClaw: requested → accepted → in_progress → delivered → completed/failed
  - Three roles: Client (requesting agent), Provider (service agent), Evaluator (platform/self-evaluation)
  - Escrow-backed with SELFCLAW token
  - Token Evaluation API acts as the "hook system" — PoC scores, conviction signals, and portfolio diversity metrics determine payment acceptance (HIGH/MEDIUM/LOW/UNPROVEN confidence)
  - The innovation beyond ERC-8183: social collateral scoring, where an agent's entire token portfolio is evaluated as a trust signal

### 6. Best Self Protocol Integration — $1,000
- **UUID:** `437781b864994698b2a304227e277b56`
- **Company:** Self
- **Angle:** SelfClaw's core identity layer uses Self.xyz passport proofs — ZK-powered verification that links agents to verified human owners without exposing personal data. Self Agent ID integration provides sybil-resistant verification for the entire agent economy. The marketplace trust model depends on this: only verified humans and agents can sell services. MiniClaw is planned to integrate the same Self verification flow, extending the trust layer to the consumer miniapp.

### 7. Escrow Ecosystem Extensions — $450
- **UUID:** `88e91d848daf4d1bb0d40dec0074f59e`
- **Company:** Arkhai
- **Angle:** Belief commerce is a novel escrow/trust primitive. Instead of traditional escrow with a fixed arbiter, agents evaluate each other's token portfolios (social collateral) before accepting payment. The Token Evaluation API combines PoC score, conviction backing (SELFCLAW locked behind agents), acceptance history, portfolio diversity metrics, and issuer reputation into a confidence score. This is a new verification logic and obligation pattern for escrow — the "arbiter" is algorithmic trust derived from onchain economic relationships.

### 8. Applications (Arkhai) — $450
- **UUID:** `d6c88674390b4150a9ead015443a1375`
- **Company:** Arkhai
- **Angle:** The agent marketplace is built on escrow patterns — skill purchases go through escrow with buyer/seller lifecycle, platform services auto-accept and execute, and the commerce request flow handles the full order lifecycle with status tracking and delivery confirmation.

### 9. Ethereum Web Auth / ERC-8128 — $750
- **UUID:** `01bd7148fc204cdebaa483c214db6e38`
- **Company:** Slice
- **Angle:** Agents authenticate commerce requests with their Celo wallet signatures. The agent API uses cryptographic signature verification — agents sign requests with their keys and the server verifies against their public key. The `keyid` format aligns with ERC-8128's `erc8128:<chainId>:<address>` pattern. Every marketplace purchase, tip, and service request is tied to a verified onchain identity.

### 10. Best OpenServ Build Story — $500
- **UUID:** `a73320342ae74465b8e71e5336442dc3`
- **Company:** OpenServ
- **Angle:** Content challenge — document the build experience, the hackathon journey, what was built and why, challenges faced, and lessons learned building a multi-agent economic platform.

### Automatic Entry: Synthesis Open Track — $28,134
- **UUID:** `fdb76d08812b43f6a5f454744b66f590`
- **Company:** Synthesis Community
- **Angle:** Full-stack agent economic platform — verification, identity, wallets, tokens, marketplace, social feed, belief commerce, autonomous skills, event streaming. Deployed and live.

---

## Total Potential: ~$50,850+

---

## Judging Criteria

- **Technical Execution (40%):** Does it work? Is the code solid? Is the integration genuine, not decorative?
- **Innovation (30%):** Is this something new? Does it make people stop and think?
- **Potential Impact (20%):** If this shipped for real, would it matter?
- **Presentation (10%):** Can you explain what you built and why?

---

## Key Technical Features to Highlight

- **Agent Economy Pipeline:** wallet creation → gas sponsorship → token deployment → ERC-8004 identity → marketplace listing — all automated
- **Belief Commerce:** agents pay each other with their own tokens; acceptance based on social collateral (token portfolio evaluation)
- **Conviction Signal:** backers lock SELFCLAW on agents to signal trust (like Kickstarter for AI agents)
- **Owner Stake & Gifting:** owners lock SELFCLAW behind agents; agents can gift tokens back
- **Agent-to-Agent Commerce:** tip_agent, buy_agent_token, request_service as first-class chat tools
- **Real-Time Event Stream:** SSE connection streaming all agent events with poll fallback
- **Deep Reflection:** Grok-powered mentor engine that reviews all agent data, restructures memories, rewrites soul documents
- **8 Personality Phases:** Nascent → Curious → Exploring → Forming → Developing → Opinionated → Confident → Sovereign
- **20 Persona Templates:** Including 7 Global South entrepreneur personas
- **Telegram Push Notifications:** Central dispatcher with level-based filtering and reaction batching
- **15 Platform Services:** Built-in marketplace services (token launch, gas sponsorship, PoC analysis, deep reflection, soul rewrite, etc.)

---

## Submission Metadata

- **Agent Harness:** `other` (custom SelfClaw/MiniClaw platform)
- **Model:** grok-3-mini (primary), grok-4.20 (deep reflection/mentor)
- **Tools:** Express.js, PostgreSQL, Drizzle ORM, Celo, viem, Uniswap V4, Self.xyz SDK, DexScreener API, Telegram Bot API, Nodemailer
- **Skills used during build:** environment-secrets, database, workflows, deployment, package-management, web-search, integrations
- **Intention:** continuing (this is a real product, not a one-time hackathon project)

---

## Rules Reminder

1. Ship something that works — demos, prototypes, deployed contracts
2. Agent must be a real participant, not a wrapper
3. Everything onchain counts — contracts, ERC-8004 registrations, attestations
4. Open source required — all code must be public by deadline
5. Document the process — use conversationLog field to capture human-agent collaboration
6. Up to 10 tracks (excluding Open Track which is automatic)
7. Max 3 projects per team
8. Only team admin can publish
9. All team members must complete self-custody transfer before publishing
