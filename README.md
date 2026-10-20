# RavelNest

**Bring people together. Keep the planning together.**

RavelNest is a GenAI-powered planning studio for weddings, birthdays, and community events. Turn an event brief into a practical budget, dated checklist, vendor requirements, and personalized ideas, then manage the plan in one workspace.

Built for the **Google Promptwars** hackathon with Next.js, React, TypeScript, and plain CSS. The project follows [FIRST_ATTEMPT_98_PLAYBOOK.md](FIRST_ATTEMPT_98_PLAYBOOK.md); that engineering target is not an independently awarded score.

![RavelNest desktop planning studio with connected budget, timeline, and assistant views](docs/screenshots/overview.png)

[View the mobile workspace](docs/screenshots/mobile.png). These screenshots show the local sample workspace, not a public deployment.

## The problem

Event planning spreads decisions across spreadsheets, messages, and inspiration boards. A beautiful idea becomes difficult to execute when costs, deadlines, and vendor requirements do not stay connected.

RavelNest gives hosts a coherent starting plan and a place to act on it. Weddings, birthdays, and community events receive different planning templates. Budgets and dates come from deterministic rules; Gemini can enrich the explanation and ideas without changing the underlying commitments.

## What you can do

- Create an event with a date, guest count, budget, currency, location, and personal vision.
- Preview a generated plan and explicitly save it to your workspace.
- Track allocated and actual spending, complete timeline tasks, maintain vendor checklists, and save ideas.
- Use the assistant to explore another planning direction before accepting changes.
- Keep working through the supported demo fallback when AI credentials or the network are unavailable after the app has loaded.
- Return to saved events in the same browser through validated local storage.
- Export the current plan as Markdown to keep a portable copy of budgets, tasks, vendors, and ideas.

The workspace has six views: **Overview, My events, Budget, Timeline, Vendors, and Inspiration**. Vendor entries are planning checklists; they are not verified businesses, live quotes, or bookings. Plans are estimates for the host to review.

## Quick start

Use Node.js 22 or newer and npm. Copy `.env.example` only when `.env.local` does not already exist; preserve an existing file and its credentials. From the repository root:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No key, database, account, or external design service is required for demo mode. For optional Gemini setup, follow [Setup.md](Setup.md). For hosting, follow [Deploy.md](Deploy.md).

[Explain.md](Explain.md) walks through live Gemini setup, model selection, environment variables, and development versus production behavior.

## A two-minute demo

1. Choose **Create event** and enter a wedding, birthday, or community event brief.
2. Choose **Generate plan**. Review its source label, allocations, timeline, and ideas.
3. Choose **Save event**, then update a cost, complete a task, and change a vendor status.
4. Reload the page to confirm that your workspace persists in this browser.
5. Ask the assistant for an idea matching the event's vision. Review the result before saving it.

## How it works

```text
Event brief → runtime validation → deterministic plan
                                      ↓
                         optional Gemini narrative enrichment
                                      ↓
                         validated preview → user saves

Provider/network failure → same canonical deterministic plan
```

| Layer                | Technology and responsibility                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Interface            | React 19, semantic HTML, plain CSS, Lucide icons                                              |
| Full-stack framework | Next.js 16 App Router and same-origin route handlers                                          |
| Contracts            | Strict TypeScript and Zod runtime validation                                                  |
| Planning             | Pure rules for exact allocations, dated tasks, vendors, and ideas                             |
| AI                   | Server-only Gemini REST integration; optional `GEMINI_API_KEY`                                |
| Persistence          | Browser-local workspace with bounded collections and validation                               |
| Verification         | ESLint, Prettier, Vitest, Playwright, axe, architecture boundaries, production bundle budgets |

See [ARCHITECTURE.md](ARCHITECTURE.md) for trust boundaries and canonical ownership.

The build rejects dependency cycles and invalid layer imports before compiling. GitHub Actions is configured to install locked dependencies and run the complete release gate plus the production audit on pushes and pull requests; its remote execution is separate from the local results below. Asset sources and licenses are listed in [ASSETS.md](ASSETS.md).

## Verification

```bash
npm run verify:full
npm run audit:prod
```

The latest local regression gate on **21 October 2026** passed with Node.js `v26.12.0`: **149 Vitest tests in 19 files**, **12 browser tests**, zero lint/type errors, zero serious/critical axe findings in the tested states, and a zero-advisory production dependency audit. Scoped logic coverage reached **99.74% statements, 100% lines/functions, and 98.47% branches**. The production build passed architecture checks across 70 source files and the bundle budgets.

Live Gemini was also verified in local development on **21 October 2026** with `gemini-3.1-flash-lite`: the browser displayed **Personalized with Gemini**, the planning response returned HTTP 200 with `source: "gemini"`, and no CSP errors were observed in that browser journey. Exact test scope and measurements are recorded in [TESTING.md](TESTING.md), [PERFORMANCE.md](PERFORMANCE.md), and [JUDGING.md](JUDGING.md). These results do not establish a hackathon score. Shared production rate limiting, a deployed preview, and manual assistive-technology review still require their own verification.

Generation uses a 25-second provider deadline and a 35-second browser deadline, with specific fallback notices for timeouts and other known failures. One successful browser request took approximately 12.1 seconds, longer than the former nine-second limit; this illustrates why individual responses need deadline headroom. It is not a latency guarantee. [Explain.md](Explain.md) covers refreshing the page, generating a new preview, and interpreting the configured indicator.

## Project documentation

| Document                             | Purpose                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------- |
| [Setup.md](Setup.md)                 | Beginner-friendly local installation, Gemini configuration, troubleshooting |
| [Explain.md](Explain.md)             | Live Gemini setup, model access, environment variables, and Redis explained |
| [Deploy.md](Deploy.md)               | Vercel and Render settings and deployment smoke checks                      |
| [JUDGING.md](JUDGING.md)             | Problem-to-evidence matrix and judge walkthrough                            |
| [TESTING.md](TESTING.md)             | Test layers, coverage scope, and verification status                        |
| [PERFORMANCE.md](PERFORMANCE.md)     | Bundle budgets, measurement method, and complexity                          |
| [SECURITY.md](SECURITY.md)           | Threat model, input limits, secrets, and production AI behavior             |
| [ACCESSIBILITY.md](ACCESSIBILITY.md) | Interface decisions and manual review checklist                             |
| [RUNBOOK.md](RUNBOOK.md)             | Operational checks, failure behavior, and recovery                          |

## Release scope

Workspace data stays in the current browser. Clearing site storage removes it; another browser or device will have its own workspace. This release does not provide accounts, multi-user synchronization, guest messaging, real vendor search, payments, or booking. An initial offline page load is not supported; fallback planning works after the application has loaded.

No license grant has been selected for this repository. Do not assume that the absence of a license grants reuse or redistribution rights.
