# Testing and verification

The latest local regression gate passed on **21 October 2026**, on macOS with Node.js `v26.12.0` and Chromium `156.0.8078.4`. It includes 165 Vitest cases, 37 Node tooling cases and 13 Chromium journeys. The clean locked installation was previously verified on 20 October with Node.js `v24.16.0`; current regression results and historical live integration observations are dated separately.

## Commands

```bash
npm ci
npx playwright install chromium
npm run verify:full
npm run audit:prod
```

`verify:full` runs formatting, type-aware zero-warning lint, strict type checking, independent Node tooling tests, covered unit/contract/component/integration tests, the production build with architecture and bundle enforcement, and Playwright browser tests. Browser installation is a one-time machine setup. Linux CI can use `npx playwright install --with-deps chromium`.

| Command                | What it establishes                                                         |
| ---------------------- | --------------------------------------------------------------------------- |
| `npm run format:check` | Project text follows the configured Prettier rules and ignore list.         |
| `npm run lint`         | ESLint checks pass with zero warnings and production quality limits.        |
| `npm run type-check`   | The configured strict TypeScript project has no type errors.                |
| `npm run test:tooling` | Node tests verify import parsing, architecture rules and file measurements. |
| `npm test`             | Vitest cases and configured meaningful-logic coverage thresholds pass.      |
| `npm run build`        | Production compilation and JavaScript/CSS bundle budgets pass.              |
| `npm run test:e2e`     | Chromium user journeys and automated axe assertions pass.                   |
| `npm run audit:prod`   | npm's current production dependency advisory audit.                         |

## Test layers and scope

- **Unit:** exact budget rounding, all event types/currencies, dates, bounded workspace mutations, and aggregate calculations.
- **Contracts:** strict request/response schemas, unknown fields, malformed values, hostile or oversized input, and shared budget/date invariants checked against the originating brief.
- **Parity:** server and browser fallback delegate to the same canonical planner.
- **Component:** labels, keyboard/dialog semantics, response-specific approval, preserved prompts/drafts after errors, retry behavior, local calendar-day bounds, and async cancellation.
- **Integration:** API content type, origin, body size, rate limiting, safe errors, demo behavior, and provider failure seams.
- **AI failure boundaries:** overall provider/client deadlines, a shared deadline across the single `5xx` retry, no immediate retry for `429`, finite safe failure notices, completion/schema checks, and unchanged canonical fallback output.
- **Configuration:** development CSP permits the evaluation needed by Next.js development tooling; production CSP excludes that allowance.
- **Tooling:** TypeScript AST import forms, unresolved dependencies, forbidden layers, cycles, server-only reachability, domain dependency purity, recursive file traversal and source/CSS line limits. These tests use Node's test runner and are separate from application coverage. Raw/gzip bundle limits are enforced by the production build's separate bundle check.
- **Browser:** complete event creation, preview approval, budget/task/vendor/idea updates, reload persistence, mobile layout, keyboard navigation, network fallback, composed stylesheet body-font behavior, and checks rejecting every axe violation in the audited states.

Coverage applies to the explicitly included domain, application, infrastructure, client adapter modules, and the `use-generation`, `use-create-event`, and `use-workspace` hooks in `vitest.config.ts`. UI markup and framework route glue are assessed through component, integration, and browser tests; a logic coverage percentage must not be represented as whole-repository coverage. Targets are **95% statements, lines, and functions; 90% branches**.

`npm run architecture:check` parses production TypeScript syntax for layer violations, unresolved dependencies, cycles, domain externals and client paths into server-only modules. It measures source and CSS file lengths against the shared quality policy and writes `artifacts/quality.json`. It runs as part of every build. `.github/workflows/ci.yml` runs the full gate and audit on pushes and pull requests. The workflow is configured; no remote GitHub run is claimed.

Local Playwright runs start a fresh `npm start` production process with `PORT=3000`, `GEMINI_API_KEY` and Redis settings explicitly empty, and `APP_ORIGIN=http://127.0.0.1:3000`. Existing servers are never reused. This prevents inherited ports, `.env.local` credentials, development behavior or another local origin from changing the suite's conditions. Stop a process using port 3000 before running the suite. These settings do not edit `.env.local` or alter hosted environment variables.

Automated browser checks exercise thirteen stories. They include a valid Gemini-shaped response controlled at the network seam to verify approval, saved-idea preservation, and persisted source labeling. Two intercepted canonical responses verify that timeout and quota notices remain distinct, show the demo badge, and keep **Save event** available. A font regression assertion waits for local fonts to load and checks the computed body font after stylesheet composition. These controlled checks are separate from the live verification below. Axe waits for finite entrance animations to settle before measuring contrast.

Live-provider verification is a point-in-time integration check. A configured health response is not a generation test, and a successful live response does not establish reliability across later requests. In the subsequent 21 October diagnostic, two requests reached the then-configured nine-second deadline while a fresh adapter request succeeded in approximately 5.039 seconds. No provider `429` was observed in that diagnostic, so those observations do not substantiate a quota or billing cause. [Explain.md](Explain.md) separates configuration, individual request results, and timeout troubleshooting.

The updated deadline policy is owned by `src/domain/ai-policy.ts`: 25 seconds total for Gemini and 35 seconds for the browser request. Classified safe notices are owned by `src/domain/ai-failure.ts`. The route and Vercel duration are 45 seconds. The final regression record below includes these changes, alongside health-endpoint assertions proving that configuration checks do not call the provider.

After the update, a fresh application request returned a validated live result in approximately **2.931 seconds**, and a fresh real Chromium generation returned `source: "gemini"` with the visible **Personalized with Gemini** badge in approximately **12.106 seconds**, with zero observed CSP errors. The latter successful call exceeded the former nine-second limit. These are individual local observations, not a latency benchmark or a guarantee that future calls will succeed. The original unclassified failures remain consistent with deadline expiry rather than proving a particular provider error.

## Run against a deployed URL

After deploying a preview, point the browser suite at its exact URL:

```bash
PLAYWRIGHT_BASE_URL=https://YOUR-APP-HOST npm run test:e2e
```

The deployed service must be reachable and configured for its own origin. This command does not deploy the application. Keep deployment protection or authentication requirements in mind when selecting a reachable preview.

## Final local record

| Check                                                   | Final result                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clean dependency installation                           | `npm ci` passed from the lockfile on 20 October 2026.                                                                                                                                                                                                                           |
| Formatting, lint, types                                 | Passed; zero ESLint warnings and TypeScript errors.                                                                                                                                                                                                                             |
| Unit/contract/component/integration/configuration tests | 165 passed across 22 Vitest files on 21 October 2026.                                                                                                                                                                                                                           |
| Independent tooling tests                               | 37 passed across 3 Node test files.                                                                                                                                                                                                                                             |
| Scoped logic coverage                                   | 99.52% statements (423/425), 100% lines (382/382), 100% functions (119/119), 98.09% branches (206/210).                                                                                                                                                                         |
| Architecture boundaries and cycles                      | 71 production TypeScript/TSX files and 21 CSS files passed. Largest source: 200 lines; largest CSS: 304 lines; limit: 400.                                                                                                                                                      |
| Production build and bundle gate                        | Passed; exact byte measurements in [PERFORMANCE.md](PERFORMANCE.md).                                                                                                                                                                                                            |
| Browser journeys                                        | 13 Chromium tests passed in the final regression run, completing in approximately 6.1 seconds.                                                                                                                                                                                  |
| Automated accessibility                                 | Zero axe violations at any reported severity in tested views and dialog states.                                                                                                                                                                                                 |
| Production dependency audit                             | `npm run audit:prod` reported zero known vulnerabilities.                                                                                                                                                                                                                       |
| Credential pattern scan                                 | Source and generated client assets passed the final credential-pattern inspection.                                                                                                                                                                                              |
| Local production smoke                                  | On 20 October, `/` and `/api/health` returned 200; health reported demo mode; six configured security headers were present.                                                                                                                                                     |
| Live Gemini in local development                        | On 21 October after the timing update, real Chromium generation returned HTTP 200 with `source: "gemini"` and displayed **Personalized with Gemini** in approximately 12.106 seconds; zero CSP errors observed. A separate application request also passed response validation. |
| Git diff whitespace check                               | `git diff --check` passed. The current workspace is a Git repository.                                                                                                                                                                                                           |

Coverage artifacts are generated at `coverage/coverage-summary.json`; build checks write `artifacts/bundle.json` and `artifacts/quality.json`. These generated reports are ignored by Git. A future run can change counts and percentages, so refresh this record from its output.

The final source/browser review found no unresolved high or medium findings within the reviewed MVP scope. The latest 21 October regression covers canonical form/domain constraints, response-to-brief validation, narrative identity preservation, rejected-body cleanup, safe error recovery and result-specific approval, in addition to the existing model, CSP, timing and fallback checks. Live Gemini was verified earlier in local development using `gemini-3.1-flash-lite`; no new provider request was required for this refactor. Live Upstash, the latest revision's hosted behavior, and manual assistive-technology checks remain unverified in this pass.

## Manual review checklist

Automated checks do not establish the items below. Mark a checkbox only after completing that review and preserve the environment used.

- [ ] Complete the official demonstration story from a fresh browser profile.
- [ ] Inspect desktop and narrow mobile layouts with real content and long event names.
- [ ] Complete every view and dialog using keyboard only; inspect focus restoration.
- [ ] Test 200%/400% zoom, screen-reader announcements, reduced motion, and RTL.
- [ ] Review contrast for text, focus indicators, disabled controls, and chart labels.
- [ ] Inspect browser console/network logs for errors, duplicate requests, and secrets.
- [x] Verify a real Gemini result locally: completed on 21 October 2026 through the browser and application API.
- [ ] Simulate a failure of the live provider after a successful live request; automated mocked failure paths are already covered.
- [ ] Verify shared rate limiting against the deployed Upstash service.
- [ ] Run the smoke checks against the public preview URL using production configuration.

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for the assistive-technology checklist and [RUNBOOK.md](RUNBOOK.md) for hosted smoke checks. No hackathon score can be inferred from a local test percentage; the supplied 96.98/100 baseline and its category scores are recorded separately in [JUDGING.md](JUDGING.md).
