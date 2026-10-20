# First-Attempt 98+ Engineering Playbook

> A portable quality standard for hackathons, AI evaluations, and judged software challenges.
> Copy this file into every new repository before implementation begins and ask Codex to treat it
> as a binding project requirement.

## Objective

Build a submission that is capable of scoring above 98% on its first evaluation attempt, with code quality treated as the highest-risk category.

This playbook improves the probability of a high score; it cannot guarantee a percentage or rank.
Evaluation rubrics, hidden checks, competing submissions, and leaderboard thresholds can change.

## Proven lesson

VenueIQ (my previous project) improved from **94.54%(came in first attempt only) to 97.08% (next and final attempt for submission)** after a focused engineering pass. The successful changes
included:

- eliminating maintainability warnings and per-file lint exceptions;
- decomposing large domain, UI, AI, and simulation modules;
- replacing duplicated fallback logic with canonical implementations;
- upgrading route search from repeated linear scans to indexed binary-heap Dijkstra;
- adding runtime validation at client/server boundaries;
- caching reusable server resources with explicit bounds and expiry;
- splitting global CSS into shared and route-owned chunks;
- enforcing bundle budgets during local, CI, and deployment builds;
- expanding exact boundary, parity, malformed-response, cache, and browser tests;
- publishing reproducible judging and performance evidence.

The next project must apply these decisions from the first commit instead of relying on a late
refactor.

## How to use this file

1. Copy it to the root of the new repository.
2. Give Codex the prompt in [Reusable kickoff prompt](#reusable-kickoff-prompt).
3. Create the quality configuration, architecture boundaries, and release scripts before building
feature UI.
4. Keep the checklist current throughout development.
5. Treat the first submission as the only available submission.

## Priority order

Allocate effort in this order:

1. Correct problem-statement alignment and a complete working journey.
2. Code quality and architecture.
3. Efficiency and measurable performance.
4. Testing and failure behavior.
5. Security, accessibility, and deployment reliability.
6. Evaluator-facing documentation and evidence.

Do not sacrifice correctness, security, or accessibility merely to shorten code.

## Day-zero quality budgets

Configure these limits before implementing features. They are deliberately stricter than the final
VenueIQ limits because code quality remained the main opportunity after reaching 97.08%.

| Signal | First-attempt target |
| --- | ---: |
| TypeScript errors | 0 |
| ESLint warnings | 0 |
| Cyclomatic complexity | Maximum 10 per production function |
| Production function length | Maximum 60 nonblank lines |
| Production TypeScript/TSX file length | Maximum 400 physical lines |
| React component length | Prefer 150 lines or fewer |
| Copy-pasted business rules | 0 |
| Unexplained lint/type suppressions | 0 |
| Statement, line, and function coverage | At least 95% for meaningful application logic |
| Branch coverage | At least 90% |
| Serious/critical automated accessibility violations | 0 |
| Known production dependency vulnerabilities | 0 |
| Initial route bundle regression | 0 unless measured and justified |
| Unbounded caches, collections, retries, or polling | 0 |

Static data should also be split by responsibility. Do not place a 1,000-line fixture in one file
and assume evaluators will ignore it because it is data.

## Required TypeScript baseline

Use strict TypeScript and enable at least:

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "allowJs": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Additional rules:

- Never use `any`, `@ts-ignore`, unsafe response casts, or non-null assertions to bypass design
  problems.
- Parse unknown external values through a runtime schema.
- Prefer discriminated unions for async and domain states.
- Derive union types and runtime enums from one canonical tuple where possible.
- Use exhaustive switches for closed domain unions.
- Keep server-only modules clearly named and protected from browser imports.

## Architecture before features

Write a short architecture plan before implementation. Use clear dependency direction:

```text
UI / route handlers
        ↓
application services and use cases
        ↓
pure domain rules and canonical contracts
        ↓
infrastructure adapters for AI, storage, network, and external APIs
```

Non-negotiable architecture rules:

- Route handlers compose validation, authorization, rate limits, and one application service; they
  do not contain business rules.
- Domain modules are framework-independent and deterministic wherever practical.
- One module owns each identifier, schema, calculation, fallback rule, and localization fact.
- UI convenience adapters delegate to canonical domain/application behavior.
- Infrastructure dependencies never leak into pure domain modules.
- Compatibility barrels only re-export; they do not become new monoliths.
- Public APIs are narrow and intentional. Avoid exporting helpers solely because they exist.
- Dependencies point inward. Add an automated cycle/boundary check when the project is large enough
  to justify it.

## Code-quality rules

### Functions and modules

- A function should perform one operation at one abstraction level.
- Extract named policy, mapping, validation, and orchestration helpers.
- Prefer early returns over deeply nested conditionals.
- Replace repeated linear searches with precomputed maps or indexes when data is reused.
- Do not sort an entire collection to find a minimum or maximum.
- Avoid magic strings and numbers; name domain constants and document their source.
- Comments explain why, safety constraints, or non-obvious tradeoffs—not line-by-line mechanics.
- Errors should have stable types/codes at boundaries and safe public messages.
- Keep compatibility behavior covered before refactoring it.

### React and frontend code

- Use Server Components by default; add client boundaries only around actual interaction.
- Split complex views into domain-named components and focused hooks, preferably separate files.
- Avoid components that mix data fetching, transformation, state machines, and large markup trees.
- Cancel obsolete requests and ignore stale responses.
- Validate successful API payloads at runtime before updating state.
- Memoize only measured or clearly expensive derived work; do not add decorative memoization.
- Preserve semantic HTML, keyboard access, focus behavior, live regions, RTL, reduced motion, and
  text alternatives while refactoring.
- Do not lazy-load critical offline/error fallback code unless it is guaranteed to be locally
  available before failure.

### Backend and API code

- Validate content type, payload size, origin/authentication, and request schema before business
  logic.
- Return stable public error codes without stacks, secrets, or provider messages.
- Put timeouts and bounded retries around every external request.
- Cache reusable clients/configuration instead of constructing them per request.
- Every cache must have a maximum size, expiry policy, deterministic key, and invalidation story.
- Do not cache user-sensitive output across identities without explicit isolation.
- Keep observability useful but free of credentials and personal data.

## Generative AI pattern

AI should communicate trusted facts, not invent the system of record.

```text
validated user request
        ↓
deterministic tools / authorized data retrieval
        ↓
minimal trusted grounding object
        ↓
schema-constrained model generation
        ↓
runtime output validation
        ↓
field-rendered UI

Any failure → deterministic, canonical fallback
```

Required AI practices:

- Keep API keys and SDKs server-side.
- Send only facts required for the requested narrative; enforce a prompt byte/token budget.
- Use structured output plus runtime validation.
- Set a low, intentional temperature and a bounded output-token limit.
- Use one short controlled retry only for retryable failures.
- Apply an overall deadline, not separate timeouts that can multiply unexpectedly.
- Make demo/offline mode a supported product path, not a test hack.
- Test prompt-injection handling and authority boundaries.
- Never let generated text mutate operational state without explicit human approval.
- Test parity between canonical fallback behavior and all UI adapters.

## Efficiency rules

Efficiency claims require measurements or complexity evidence.

### Algorithms and compute

- State the expected complexity of important algorithms.
- Add tests for exact output, ties, adversarial inputs, and boundary conditions.
- Build immutable indexes once for reusable static graphs or catalogs.
- Convert repeated membership checks to `Set` and lookups to `Map` where justified.
- Avoid recomputing deterministic state when only presentation state changes.
- Use linear reduction rather than sorting when only one extreme value is needed.
- Keep formatter, parser, provider client, and rate-limiter construction out of hot paths.

### Network and server

- Avoid background polling unless freshness requirements demand it.
- Deduplicate identical in-flight or short-lived requests when safe.
- Use cancellation and timeouts for browser and server requests.
- Reduce AI grounding payloads and model output limits.
- Fail safely without cascading retries.
- Record cache hit/miss behavior when caching materially affects the claim.

### Browser and bundle

- Measure every primary route after the first production build.
- Establish separate raw and gzip budgets for JavaScript and CSS.
- Make the build fail when a route exceeds its budget.
- Keep validation or visualization libraries out of routes that do not use them.
- Split styles by shared foundation and route/feature ownership.
- Remove unused dependencies, plugins, fonts, maps, chart libraries, and build transforms.
- Prefer local SVG/CSS for small purpose-built visualizations.
- Check mobile behavior, reduced motion, and accessibility after every CSS split.

Set project-specific budgets from the first measured build. Then allow no silent increase. If a
necessary correctness improvement adds weight, document the tradeoff and offset it elsewhere when
possible.

## Testing strategy

Testing must prove architecture and edge behavior, not merely raise coverage.

### Required layers

1. **Unit tests:** domain calculations, algorithms, parsers, policies, localization, cache keys,
   expiry, and error classification.
2. **Contract tests:** request/response schemas, strict rejection of unknown fields, safe errors,
   and external-provider seams.
3. **Parity tests:** every adapter/fallback must match its canonical implementation.
4. **Component tests:** semantics, keyboard interaction, accessible names, async states, retry, and
   state transitions.
5. **Integration tests:** API routes, headers, origin/rate limits, demo mode, and failure recovery.
6. **End-to-end tests:** one complete journey per role plus mobile, keyboard, offline/fallback, and
   cross-feature propagation.
7. **Accessibility tests:** automated axe checks plus a manual checklist for focus, zoom, contrast,
   screen readers, RTL, and reduced motion.

### High-value edge cases

- empty, unknown, oversized, malformed, and hostile inputs;
- exact algorithm ties and unreachable paths;
- timeout, abort, non-JSON, invalid schema, 429, and 5xx responses;
- stale or superseded browser requests;
- cache expiry, capacity, key collisions, and configuration changes;
- storage failure and unavailable browser APIs;
- zero-item, one-item, maximum-item, and already-complete states;
- every enum/scenario/language against the canonical identifier list.

Avoid relying primarily on snapshots. Prefer assertions about externally meaningful behavior.

## Security baseline

- Secrets are never prefixed with public/client environment-variable names.
- Local secret files are ignored and never committed.
- Search source, build output, logs, and git diff for leaked secret names and values.
- Use strict request and response schemas.
- Enforce size limits before parsing large payloads.
- Apply production-grade distributed rate limits where required; fail closed for sensitive routes.
- Configure CSP, anti-framing, nosniff, referrer, permissions, and transport headers as applicable.
- Run the production dependency audit immediately before submission.
- Render model/user content as fields or text, never arbitrary HTML.
- Document threat boundaries and intentionally unsupported security features.

## Evaluator-facing evidence

Create these files early and keep them factual:

- `README.md`: problem, users, differentiator, architecture summary, setup, demo, verified results.
- `ARCHITECTURE.md`: boundaries, dependency direction, data flow, failure behavior, major decisions.
- `JUDGING.md`: one section per rubric category with claim, source, test, and verification command.
- `TESTING.md`: test layers, coverage scope, commands, and manual QA.
- `PERFORMANCE.md`: measurement method, route budgets, current results, and justified tradeoffs.
- `SECURITY.md`: threat model, secret handling, validation, limits, headers, and production behavior.
- `ACCESSIBILITY.md`: WCAG-oriented decisions and manual assistive-technology checklist.
- `RUNBOOK.md`: clean setup, environment variables, deployment, smoke tests, and troubleshooting.

Do not write claims such as “optimized,” “secure,” “accessible,” or “production-ready” without a source location and reproducible verification command. Refresh all counts and measurements from the final command output; stale numbers reduce trust.

## Recommended release scripts

Adapt names to the framework, but preserve the sequence:

```json
{
  "scripts": {
    "format:check": "prettier --check .",
    "lint": "eslint . --max-warnings=0",
    "type-check": "tsc --noEmit",
    "test": "vitest run --coverage",
    "build": "next build",
    "bundle:check": "node scripts/check-bundle-budget.mjs",
    "test:e2e": "playwright test",
    "audit:prod": "npm audit --omit=dev",
    "verify": "npm run format:check && npm run lint && npm run type-check && npm run test && npm run build && npm run bundle:check",
    "verify:full": "npm run verify && npm run test:e2e"
  }
}
```

Optional tools for larger projects, only when configured and useful:

- `knip` for unused files, exports, and dependencies;
- `jscpd` for duplication budgets;
- `dependency-cruiser` for dependency direction and circular imports;
- Lighthouse CI for repeatable deployed performance/accessibility budgets.

Do not add tools solely for appearance. Their checks must run in CI and have actionable limits.

## Feature definition of done

A feature is not complete until all answers are yes:

- [ ] Does it directly support a stated user/problem requirement?
- [ ] Is the business rule owned in exactly one canonical location?
- [ ] Are external inputs and outputs runtime validated?
- [ ] Are failure, timeout, empty, and retry states designed?
- [ ] Are requests cancellable or protected from stale updates where needed?
- [ ] Is the implementation below complexity, function, component, and file budgets?
- [ ] Are keyboard, focus, screen-reader, RTL, mobile, and reduced-motion behaviors preserved?
- [ ] Are unit/contract/component tests present for meaningful branches?
- [ ] Did route bundle measurements stay within budget?
- [ ] Is documentation/evaluator evidence updated?

## Pre-submission procedure

### Pass 1: Automated release gate

Run from a clean installation when practical:

```bash
npm ci
npm run verify:full
npm run audit:prod
git diff --check
```

Also search for common static-evaluation penalties:

```bash
rg -n "TODO|FIXME|HACK|@ts-ignore|@ts-expect-error|eslint-disable|\\bas any\\b" src tests
find src -type f \( -name '*.ts' -o -name '*.tsx' \) -print0 | xargs -0 wc -l | sort -nr
```

Review every exception manually. The ideal result is no suppressions and no unexpectedly large
production source file.

### Pass 2: Human product review

- Run every official judging story from a clean browser profile.
- Test desktop and mobile at minimum.
- Complete the flows using keyboard only.
- Inspect loading, empty, error, offline/demo, and recovery states.
- Confirm all destructive or operational actions require appropriate approval.
- Inspect the browser console and network panel for errors, duplicate requests, and secrets.
- Verify that every displayed fact is labeled accurately as live, simulated, cached, or generated.

### Pass 3: Blind architecture review

Ask Codex to review the repository as an evaluator without making changes. Require findings ordered
by severity for:

- code duplication and canonical ownership;
- complexity, long files/functions/components, and mixed abstraction levels;
- unsafe casts, suppressions, dead code, and unused dependencies;
- avoidable `O(n²)` work, repeated sorting/index creation, unbounded caches, and polling;
- client/server boundary leaks and oversized bundles;
- untested failure paths and misleading documentation claims.

Fix all high and medium findings, then rerun the complete gate.

### Pass 4: Deployment-equivalent verification

- Run the exact command used by the hosting provider.
- Deploy a preview using the real production configuration.
- Verify canonical URL/origin settings, API health, headers, AI live/fallback behavior, and bundle
  budgets.
- Repeat the primary smoke journeys against the deployed URL.
- Submit only after preview verification succeeds.

## Common score-lowering patterns

Avoid these from the beginning:

- creating a monolith and promising to refactor later;
- duplicating domain, server fallback, and client fallback logic;
- hiding complexity behind ESLint exceptions;
- using coverage exclusions to imply unmeasured code is tested;
- unsafe `response.json()` casts;
- repeatedly constructing SDK, Redis, formatter, parser, or graph-index objects;
- sorting full arrays to select one item;
- unbounded maps, retries, queues, timers, or caches;
- shipping validation libraries and unrelated CSS to every route;
- lazy-loading critical offline fallback code;
- adding heavy libraries for visuals that local SVG/CSS can express clearly;
- optimistic UI that can apply stale responses;
- tests that only cover happy paths;
- documentation with stale test counts, unsupported claims, or placeholder evidence;
- committing secrets, local environment files, reports, build output, or editor artifacts;
- spending all three submissions as iterative QA instead of completing QA before attempt one.

## Reusable kickoff prompt

Paste this at the beginning of each new challenge:

```text
Treat FIRST_ATTEMPT_98_PLAYBOOK.md as a binding engineering standard for this project.

Our goal is a first-attempt AI evaluation score above 98%, with code quality as the highest-risk
category. Before implementing features:

1. Inspect the complete challenge brief and repository.
2. Create a rubric-to-evidence matrix and identify hidden quality/efficiency risks.
3. Define architecture boundaries, canonical contracts, failure behavior, and measurable budgets.
4. Configure strict TypeScript, zero-warning linting, complexity 10, function length 60, and
   production file length 400 with no per-file exceptions.
5. Plan deterministic business logic, minimal schema-constrained AI usage, canonical fallbacks,
   runtime-validated API boundaries, and a complete test pyramid.

During implementation, continuously verify code quality, efficiency, accessibility, security, and
bundle impact instead of postponing them. Before handoff, run the full release gate, conduct a blind
evaluator-style review, fix every high/medium finding, verify the exact deployment command, and
update all judging evidence with measured final results.

Do not promise a score or claim quality without reproducible evidence. Do not commit or push unless
I explicitly ask.
```

## Final submission checklist

- [x] Every official requirement maps to working product evidence.
- [x] Architecture and trust boundaries are documented and match the code.
- [x] Complexity ≤10, functions ≤60 lines, production files ≤400 lines, zero warnings/exceptions.
- [x] No duplicated business rules or fallback behavior.
- [x] No unsafe external-data casts or leaked server dependencies.
- [x] Important algorithms have stated complexity and boundary tests.
- [x] All caches/retries/collections are bounded.
- [x] All primary routes pass measured JS/CSS budgets.
- [x] Coverage targets pass and meaningful failure branches are tested.
- [x] End-to-end, accessibility, keyboard, mobile, offline/fallback, and recovery journeys pass.
- [x] Production audit reports zero known vulnerabilities.
- [x] Credential-pattern scan and clean-install build pass. Git diff check is inapplicable: this folder is not a Git repository.
- [x] README and judging documents contain current measured results.
- [ ] Exact hosting-provider build and deployed-preview smoke tests pass.
- [x] A final evaluator-style review has no unresolved high or medium findings.

Local release record (20 October 2026): `npm ci`, `npm run verify:full`, and `npm run audit:prod` pass. There are 115 Vitest tests and 10 Chromium browser tests. Meaningful logic coverage is 99.71% statements, 100% lines/functions and 98.28% branches. Automated axe checks report zero serious/critical violations on tested views. See TESTING.md and PERFORMANCE.md for scope and measured evidence. Live Gemini, live shared Redis, a deployed preview and manual assistive-technology checks remain unverified. The local production build passes; the deployed-preview checklist item remains open. No score or rank is claimed.

Local AI verification update (21 October 2026): a real Google request and a fresh Chromium event preview both returned `source: gemini` with `gemini-3.1-flash-lite`. The default configuration and setup examples now use that verified model after the prior model returned HTTP 404. The regression gate passes 118 Vitest tests across 17 files and 10 Chromium tests; scope and coverage targets remain documented in TESTING.md. Production Upstash and the deployed-preview checklist item remain unverified.

## Portable memory rule

This file is the persistent memory of the VenueIQ improvement process. For every future challenge, copy it into the new repository and explicitly tell Codex to read and follow it before taking any implementation action.

## RavelNest local AI reliability update: 21 October 2026

This dated entry supersedes the earlier 21 October test counts. Earlier release and AI-verification records above describe their respective earlier states.

Observed evidence: two unclassified planning requests ended near the then-configured nine-second provider deadline, while a fresh direct adapter request with the existing key succeeded in approximately 5.039 seconds. No provider `429` was observed in that diagnostic. After the update, a fresh application request returned a validated live result in approximately 2.931 seconds, and a fresh real Chromium preview succeeded in approximately 12.106 seconds with `source: gemini`, the visible **Personalized with Gemini** badge, and zero observed CSP errors. The latter successful request exceeded the old deadline. This supports deadline headroom for variable response times; it does not prove the exact cause of the original unclassified failures or guarantee future latency. The key was unchanged, and neither key rotation nor paid billing was established as a timeout fix.

The implementation now uses canonical 25-second provider and 35-second browser deadlines, with route/Vercel duration configured to 45 seconds. At most one `5xx` retry shares the original provider deadline; a `429` is surfaced without an immediate retry. A finite domain-owned failure mapping produces safe notices for timeouts, rate limits, authorization, model availability, output limits, invalid output, connection failure, and other provider failures. Every failure preserves the same deterministic fallback. The health endpoint explicitly says it checks configuration and does not call Gemini; an existing demo preview remains the result of its earlier request until a fresh generation is made.

Final local regression evidence: `npm run verify:full` passes **149 Vitest tests across 19 files** and **12 Chromium tests**. Scoped logic coverage is **99.74% statements (393/394), 100% lines (356/356), 100% functions (112/112), and 98.47% branches (194/197)**. Architecture checks pass across **70 production source files**; lint warnings, type errors, serious/critical axe findings in tested states, and production audit advisories are zero. The final review has no unresolved high or medium findings in the reviewed scope. Credential-pattern scanning found no matches in source, tests, generated static assets, or documentation.

The Node.js `v26.12.0` production build emits **775,048 raw / 238,871 gzip JavaScript bytes** across 14 files and **41,590 raw / 9,319 gzip CSS bytes** in one file. Existing raw/gzip ceilings remain 850,000/260,000 JavaScript bytes and 50,000/12,000 CSS bytes. Older Node.js 24 browser diagnostics remain historical and are not presented as new performance measurements.

Live Gemini is verified in **local development**. Shared production Upstash, a deployed preview, and manual assistive-technology checks remain unverified. No hackathon score or rank is claimed.
