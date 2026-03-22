# Synthesis Hackathon — MiniClaw Submission Receipt

**Submitted:** March 22, 2026  
**Status:** PUBLISHED (`publish` — canonical API enum value)  
**Project UUID:** `86689582a4e24c8689f79f235d79218b`  
**Project Slug:** `miniclaw-973f`  
**Team:** Zeno (UUID: `58537b81122a40f7b6405d3a740c9abf`)  
**Repo:** https://github.com/mbarbosa30/MiniClaw  

> **API enum note:** The Synthesis API returns `custodyType: "self_custody"` (underscore, not hyphen)
> and `status: "publish"` (not "published"). Both match the expected states for eligibility and publication.

---

## Step 1 — Participant Status Check

`GET https://synthesis.devfolio.co/participants/me` → **HTTP 200**

Key fields verified:
- `custodyType`: `self_custody` ✓
- `team.role`: `admin` ✓
- `team.name`: `Zeno`
- `team.projects`: 2 existing published projects (TeliGent, BuilderScout) — room for 1 more ✓
- No team join needed — already on correct team

---

## Step 2 — Team Join

**Skipped** — participant already on team "Zeno" (`58537b81122a40f7b6405d3a740c9abf`).

---

## Step 3 — Project Created

`POST https://synthesis.devfolio.co/projects` → **HTTP 201**

Payload included:
- `teamUUID`: `58537b81122a40f7b6405d3a740c9abf`
- `name`: MiniClaw
- 9 track UUIDs (see below)
- Full description, problemStatement, repoURL, conversationLog, submissionMetadata
- `agentFramework`: other → SelfClaw.ai
- `agentHarness`: other → Zeno (SelfClaw.ai built-in AI builder agent)
- `intention`: continuing
- `skills`: 12 skills listed (wallet management, ERC-8004 minting, escrow lifecycle, etc.)

Synthesis auto-pulled from repo:
- `commitCount`: 359
- `contributorCount`: 2
- `firstCommitAt`: 2026-03-13T23:21:55Z
- `lastCommitAt`: 2026-03-22T08:52:50Z

---

## Step 4 — Full Content

All content was submitted in the single creation payload. The API requires the full body on POST — no separate PUT was needed.

---

## Step 5 — Published

`POST https://synthesis.devfolio.co/projects/86689582a4e24c8689f79f235d79218b/publish` → **HTTP 200**

Confirmed response fields:
- `status`: `publish`
- `slug`: `miniclaw-973f`
- `uuid`: `86689582a4e24c8689f79f235d79218b`
- All 9 tracks registered

---

## Tracks Entered

| Track | Prize |
|---|---|
| Best Agent on Celo (`ff26ab4933c84eea856a5c6bf513370b`) | $5,000 |
| Let the Agent Cook (`10bd47fac07e4f85bda33ba482695b24`) | $4,000 |
| Agents With Receipts ERC-8004 (`3bf41be958da497bbb69f1a150c76af9`) | $4,000 |
| ERC-8183 Open Build (`49c3d90b1f084c44a3585231dc733f83`) | $2,000 |
| Ethereum Web Auth / ERC-8128 (`01bd7148fc204cdebaa483c214db6e38`) | $750 |
| Best OpenServ Build Story (`a73320342ae74465b8e71e5336442dc3`) | $500 |
| Escrow Ecosystem Extensions / Arkhai (`88e91d848daf4d1bb0d40dec0074f59e`) | $450 |
| Applications / Arkhai (`d6c88674390b4150a9ead015443a1375`) | $450 |
| Synthesis Open Track (`fdb76d08812b43f6a5f454744b66f590`) | $28,134 |
| **Total eligible** | **$45,784** |
