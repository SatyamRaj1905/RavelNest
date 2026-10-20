# RavelNest architecture

RavelNest is a local-first event planning studio for weddings, birthdays, and community events. Next.js App Router serves the document and same-origin API. Small React client components handle the interactive workspace. Plain CSS and local SVG visualizations provide the interface; no design builders are used.

## Dependency and ownership plan

Browser behavior follows `components → client adapters → domain`. Server planning follows `app route handlers → application → domain`; route handlers inject infrastructure adapters that depend on the domain contracts.

- `src/domain/contracts.ts`: canonical runtime schemas, derived types, and `EVENT_LIMITS` shared by forms and domain operations. Event briefs contain name, type (`wedding`, `birthday`, `community`), date (ISO calendar date), guests, budget (integer major currency units), currency (`INR`, `USD`, `EUR`, `GBP`), location and preferences. Plans contain a summary, exact budget allocations, dated tasks, vendor category checklists and personalized ideas. `parsePlanResponseForBrief` checks responses against the original budget and event date using the same predicates as saved events, without creating a fake saved record.
- `src/domain/planner.ts`: deterministic plan generation and budget calculations. Allocations sum exactly to the requested budget, including rounding. Dates are derived in UTC. The AI cannot set budgets, dates, vendors, or completed state.
- `src/domain/workspace.ts`: canonical event mutation, capacity, persistence schema and aggregate calculations. Browser persistence is per device, with no accounts or shared guest records.
- `src/application`: orchestrates the canonical plan with optional, validated Gemini narrative enrichment. The same deterministic implementation supports server and browser fallback.
- `src/domain/narrative.ts`: derives provider text constraints from the canonical plan and idea schemas. Personalization requires matching idea counts and preserves each idea's identity and saved flag, along with every operational field.
- `src/client`: bounded browser persistence, schema-validated request handling, canonical local fallback, and Markdown export.
- `src/infrastructure`: server-only Gemini REST adapter, bounded HTTP parsing, safe failure classification, and rate limiting. No provider SDK is included in the browser.
- `src/components`: focused workspace views, forms, accessible dialogs and cancellable async state. AI output is previewed and explicitly saved by the user. Approval belongs to the current result, so editing a later prompt cannot reset approval of an already applied result. Unexpected generation failures retain the draft and expose a safe retry message.

## API and trust boundaries

`POST /api/plan` accepts `{ brief, prompt }` with strict runtime validation. `prompt` is an optional short instruction. Successful responses use `{ plan, source, notice }`, with source `gemini` or `demo`. Route handlers validate origin, content type, streamed body size and rate limit before calling the application service. Stable safe error responses use `{ error: { code, message } }`.

`GET /api/health` reports service and AI configuration mode without secrets. AI requests receive only the brief, deterministic planning facts and bounded user preference text. User text is untrusted data, never authority. Structured output is runtime validated; only narrative fields can be enriched. Provider failures return the canonical demo plan with a visible notice. No generated content is rendered as HTML.

The configured mode is a presence check, not a probe of the live provider. Each generation request has its own outcome and source label. A previously successful live request does not prevent a later request from timing out or returning an invalid response; failure recovery keeps the same canonical plan rather than applying partial generated state.

Rejected provider and oversized HTTP bodies are cancelled through a shared cleanup helper. A cancellation failure cannot replace the original quota or service error. Production unavailable/rate-limit messages have one owner in `src/infrastructure/plan-errors.server.ts`.

`src/domain/ai-policy.ts` owns the 25-second overall provider deadline and 35-second browser request deadline. At most one retry is allowed for a provider `5xx`; both attempts share the same provider timer. A `429` returns a classified fallback without an immediate retry. The route and Vercel execution budgets are configured to 45 seconds, while hosting support for that duration remains an environment requirement.

`src/domain/ai-failure.ts` owns the finite failure codes and safe public notice mapping. The infrastructure adapter classifies timeout, rate limit, authorization, model availability, output limit, invalid output, connection failure, and other provider failure; the application service converts these into notices beside the same canonical fallback plan. Unknown errors retain a general unavailable notice. Raw provider messages and credentials are never included. Prompt guidance requests concise narratives within the unchanged 1,800-token output ceiling.

## Budgets and release gates

Strict TypeScript includes unchecked indexed access and exact optional properties. Production ESLint uses TypeScript's project service to enforce type-aware rules, including unsafe value handling and unhandled promises. `scripts/quality-policy.mjs` owns complexity 10, function length 60 nonblank/noncomment lines, and source/CSS file length 400 physical lines. ESLint warnings fail the gate. Meaningful logic must reach 95% statement/line/function and 90% branch coverage, with the scope listed in TESTING.md. Unit, contract, component, integration, browser and automated accessibility tests are release gates. JavaScript and CSS gzip/raw budgets are enforced during the hosting build. Collections, input, provider deadlines and rate-limit storage have explicit bounds.

`npm run architecture:check` parses TypeScript syntax to inspect imports, re-exports, literal dynamic imports, import types and `require` calls. It rejects unresolved internal dependencies, forbidden layers, cycles, nonliteral module loads, unauthorized domain externals, and client entry points that reach server-only code. The same build check measures TypeScript and CSS file lengths and writes its dependency graph to `artifacts/quality.json`. `npm run test:tooling` covers these checks independently of application coverage.

CI runs the full release gate and production dependency audit. Browser adapters and the async creation/generation/workspace hooks are included in meaningful-logic coverage. UI markup is assessed through component and browser tests rather than represented as line-coverage evidence. The 21 October 2026 local gate measured 71 TypeScript files and 21 CSS files; the largest were 200 and 304 lines respectively. Styles are split by workspace responsibility without changing the layout contract.

Local Playwright runs start a fresh production server with an empty Gemini key, empty Redis settings and canonical `http://127.0.0.1:3000` origin. They cannot silently reuse a development server or consume the developer's provider quota. Network-controlled Gemini responses test the approval path separately from live integration.

The budget gate covers every emitted static JavaScript/CSS chunk, a conservative ceiling above initial-route transfer. `npm run browser:measure` records a separate fresh-browser transfer sample against a running production server. Neither measurement is represented as a hackathon score or deployed field-performance result.

## Deployment scope

Vercel and Render both run the full Next.js server; static-only hosting cannot execute Gemini requests. No external database is necessary for the local-first MVP. Multi-device collaboration, real vendor discovery, payments and authenticated accounts are outside this release. Live AI requires a user-supplied server-side Gemini key. Public live AI additionally requires distributed rate-limit configuration. A local production build and a deployed preview are separate verification claims.
