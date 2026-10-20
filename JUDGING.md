# Judging evidence

RavelNest addresses the supplied brief: a GenAI assistant for weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas. No official judging rubric, awarded score, rank, or public deployment result has been provided. The matrix below maps the brief and engineering playbook to inspectable evidence; it is not a score prediction.

## Judge walkthrough

1. Start with [Setup.md](Setup.md), without credentials if desired.
2. Create an event with a specific date, budget, guest count, location, and vision.
3. Review the generated preview and its source label, then save it.
4. Change an actual cost, complete a task, adjust a vendor, and save an idea.
5. Reload, then inspect the updated event across the workspace views.
6. Request an alternative direction in the assistant. Confirm that a preview requires an explicit save.
7. Block the planning request after loading the page and repeat generation. Confirm usable deterministic fallback and an explanatory notice.

## Problem alignment

| Requirement        | Claim and product evidence                                                                 | Source and verification                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Three event types  | Wedding, birthday, and community briefs have type-specific plans.                          | Canonical domain contracts and planner; `npm test`. Create one event of each type.                            |
| Budgets            | Allocations total exactly the requested integer budget; actual spending is editable.       | Domain planner and workspace calculations; `npm test`, `npm run test:e2e`.                                    |
| Timelines          | Generated dated tasks support completion tracking.                                         | Domain planner and Timeline view; `npm test`, `npm run test:e2e`.                                             |
| Vendor checklists  | Category requirements and editable planning status are tied to an event.                   | Canonical planner and Vendors view; `npm run test:e2e`. No live vendor discovery claim.                       |
| Personalized ideas | Event vision grounds canonical ideas and optional Gemini enrichment.                       | Application planning service and Inspiration view; `npm test`, `npm run test:e2e`.                            |
| GenAI              | Server-only Gemini REST requests use bounded grounding, structured output, and validation. | `src/infrastructure` and `src/application`; `npm test`. Successful live-provider verification requires a key. |
| Complete journey   | Create → preview → save → edit → reload.                                                   | Browser suite in `tests/e2e`; `npm run test:e2e`.                                                             |

## Engineering categories

| Category         | Claim                                                                                    | Evidence and reproducible check                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Architecture     | Deterministic rules have canonical ownership; adapters delegate to them.                 | [ARCHITECTURE.md](ARCHITECTURE.md), source review, `npm run lint`.                                                       |
| Code quality     | Strict typing, zero-warning lint, bounded production file/function complexity.           | `tsconfig.json`, `eslint.config.mjs`; `npm run type-check`, `npm run lint`.                                              |
| Efficiency       | Route JavaScript/CSS budgets fail the build; planning uses bounded linear passes.        | [PERFORMANCE.md](PERFORMANCE.md), `scripts/check-bundle-budget.mjs`; `npm run build`.                                    |
| Tests            | Meaningful logic coverage has an explicit scope; browser checks cover state propagation. | [TESTING.md](TESTING.md); `npm run verify:full`.                                                                         |
| Failure recovery | Demo/provider/network paths use the same deterministic plan.                             | Canonical planner, application service, browser fallback; `npm test`, `npm run test:e2e`.                                |
| Security         | Requests and AI output are validated; provider secrets stay server-side.                 | [SECURITY.md](SECURITY.md), route contracts, `next.config.ts`; `npm test`, `npm run audit:prod`.                         |
| Accessibility    | Semantic controls, labels, dialog focus behavior, and responsive layouts are tested.     | [ACCESSIBILITY.md](ACCESSIBILITY.md), component/browser tests; `npm run test:e2e`. Manual items remain distinct.         |
| Deployment       | Full Next.js configuration supports Vercel and Render with safe demo mode.               | [Deploy.md](Deploy.md), [RUNBOOK.md](RUNBOOK.md); `npm run build`, `npm start`. Hosted preview remains a separate check. |

## Evidence status

The latest local regression gate passed on **21 October 2026**, using Node.js `v26.12.0`: 149 Vitest tests in 19 files, 12 Chromium browser tests, zero lint warnings/type errors, 70 source files passing architecture checks, production build/bundle limits, and a zero-advisory production dependency audit. Scoped logic coverage is **99.74% statements, 100% lines, 100% functions, and 98.47% branches**. Serious/critical axe violations were zero in the tested states. A clean locked installation was verified on 20 October.

Live Gemini service access was verified in local development on **21 October 2026** with `gemini-3.1-flash-lite`. A real Chromium flow displayed **Personalized with Gemini** and returned a planning response with HTTP 200 and `source: "gemini"`, with no observed CSP errors; a separate application API request returned a schema-valid live response. This verifies the local development integration, not production shared limiting or public hosting.

The latest live browser request took approximately 12.106 seconds, exceeding the former nine-second deadline while succeeding within the new 25-second provider budget. A separate fresh application request succeeded in approximately 2.931 seconds. This shows observed variability and the need for deadline headroom; it does not establish a latency guarantee. Automated tests cover the shared retry deadline, no immediate provider-429 retry, classified safe notices, and deterministic fallback parity. The health endpoint explicitly states that it checks configuration without calling Gemini.

Exact scope and commands are recorded in [TESTING.md](TESTING.md); current byte counts and the separately dated, limited local browser diagnostic are in [PERFORMANCE.md](PERFORMANCE.md). The source/browser review has no unresolved high or medium findings in the reviewed MVP scope. Shared Upstash infrastructure, a public hosting preview, and manual assistive-technology checks remain unverified. No externally awarded hackathon score is claimed.

## Deliberate scope

There is one host role and one browser-local workspace. The project does not claim authenticated collaboration, guest-data management, real-time vendor quotes, verified business listings, bookings, payments, or full offline installation. AI text cannot silently mutate saved operational state. These boundaries keep the demonstrated planning journey concrete and reviewable.
