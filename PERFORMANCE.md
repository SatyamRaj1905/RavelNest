# Performance evidence

Measurements in this document describe a production build or a named browser run. They do not imply deployed Core Web Vitals or a Lighthouse score.

## Reproduce the bundle measurement

```bash
npm run build
npm run bundle:check
```

The build includes the bundle check, so hosting uses the same gate. `scripts/check-bundle-budget.mjs` sums every emitted JavaScript and CSS file under `.next/static`, including chunks beyond the initial page load, and prints observed bytes. This conservative whole-build ceiling is not an exact initial-route transfer measurement. Gzip is computed per file and summed; hosting compression and caching can differ.

## Final production asset ceiling

Measured in the latest regression build on **21 October 2026**, Node.js `v26.12.0`:

| Scope                             |    Raw JS |   Gzip JS |  Raw CSS | Gzip CSS | Status                      |
| --------------------------------- | --------: | --------: | -------: | -------: | --------------------------- |
| All emitted `.next/static` assets | 775,048 B | 238,871 B | 41,590 B |  9,319 B | Passed                      |
| Enforced maximum                  | 850,000 B | 260,000 B | 50,000 B | 12,000 B | Build fails above any limit |

The emitted set contains 14 JavaScript files and one CSS file. The first measured build contained 771,741 raw JavaScript bytes; the 3,307-byte raw increase incorporates approval/source preservation, dialog focus handling, retained form drafts, and date-boundary correctness. The latest raw JavaScript/CSS totals match the 20 October final build, and all limits remain unchanged. Gzip sizes differ from the earlier Node.js `v24.16.0` run; this is not a comparison under identical tooling, so the compressed-byte difference is not attributed solely to code changes.

The studio at `/` is the primary interactive route. `/api/health` and `/api/plan` are server endpoints. Refresh this table from the final gate and inspect the budget script for authoritative limits. Initial route requests and Core Web Vitals remain separate browser measurements.

The final 21 October reliability regression retained these exact asset totals and existing limits after adding the 25-second provider / 35-second browser deadline policy and classified fallback behavior. Architecture checks passed across 70 source files, with 149 Vitest tests in 19 files and twelve browser tests passing. Detailed scope remains in [TESTING.md](TESTING.md).

## Local live AI observations: 21 October 2026

After the deadline update, one fresh application request returned a validated live result in approximately **2.931 seconds**. A fresh real Chromium generation returned HTTP 200 with `source: "gemini"`, displayed **Personalized with Gemini**, and completed in approximately **12.106 seconds**, with zero observed CSP errors. The existing key was unchanged. The successful browser request exceeded the former nine-second provider deadline and completed within the new 25-second budget.

These observations demonstrate variability in successful local requests, not a controlled before/after benchmark, provider latency distribution, or guaranteed response time. The two earlier unclassified requests ending around nine seconds are consistent with the former deadline; the diagnostic did not observe a provider `429`. The one allowed `5xx` retry shares the overall deadline, and a provider `429` is surfaced without immediate retry. The route/Vercel 45-second setting is a configured hosting allowance, not a promise that any provider call will finish in that time.

## Historical local browser diagnostic: 20 October 2026

Start the production server with `npm start`, then in another terminal run:

```bash
npm run browser:measure
```

`scripts/measure-browser.mjs` opens one fresh Chromium context at 1440 × 1100 with reduced motion and no network/CPU throttling, waits for network idle, and reads the Performance API. It writes `artifacts/browser-performance.json`. The retained **20 October** diagnostic used Chromium `156.0.8078.4`, Node.js `v24.16.0`, and `http://127.0.0.1:3000`. It was not rerun after the 21 October model/CSP update and must not be read as a current Node.js 26 measurement.

| Diagnostic             |                                One local sample |
| ---------------------- | ----------------------------------------------: |
| Requested JavaScript   | 10 files; 199,420 B encoded / 662,059 B decoded |
| Requested CSS          |      1 file; 9,260 B encoded / 41,590 B decoded |
| First Contentful Paint |                                           60 ms |
| DOMContentLoaded       |                                         20.2 ms |

Encoded/decoded values describe script and stylesheet response bodies, not all page assets or HTTP overhead. This sample runs on the same machine as the server and is diagnostic only. It is not a Lighthouse score, field result, public-network performance claim, or cross-device benchmark. FCP and DOMContentLoaded observe different milestones and are not expected to occur in the same order.

## Algorithm and resource behavior

| Operation                | Complexity and bound                                                                       | Verification                                 |
| ------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Allocate event budget    | Linear in a fixed, small category list; rounding preserves the exact entered total.        | Canonical planner unit tests, `npm test`.    |
| Generate dated checklist | Linear in bounded type-specific task templates.                                            | Date/type boundary tests, `npm test`.        |
| Workspace totals         | Linear reduction over bounded events and plan rows.                                        | Workspace unit tests, `npm test`.            |
| Update one event         | Linear pass over the bounded workspace; no network round trip for local edits.             | Workspace and persistence tests, `npm test`. |
| Browser persistence      | One validated bounded workspace per browser; storage failures are surfaced.                | Storage tests and reload journey.            |
| AI request               | Bounded prompt/output, overall deadline, and controlled retry policy.                      | Provider adapter and application tests.      |
| Rate limiting            | Expiring bounded development entries; shared production limits guard paid provider access. | Limiter tests and deployment smoke checks.   |

The product does not use background polling, a map SDK, charting library, image-generation service, or third-party design builder. Small visualizations use CSS/SVG, and vendor checklist edits are local operations. These are inspectable design choices, not a measured latency claim.

## Browser measurement checklist

- [ ] Run Lighthouse on the production preview for desktop and mobile with the exact tool version and throttling recorded.
- [ ] Record LCP, CLS, INP/TBT, transferred bytes, and the tested URL rather than only the composite score.
- [ ] Inspect the primary journey under a slow connection and reduced CPU.
- [ ] Verify mobile overflow, long content, reduced motion, and chart alternatives.
- [ ] Compare a later build to this baseline and justify any budget change.

No Lighthouse, field-performance, or public-network latency result is claimed until that measurement has been run. A passing bundle gate is one performance constraint, not a substitute for browser measurement.
