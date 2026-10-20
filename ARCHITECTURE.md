# RavelNest architecture

RavelNest is a local-first event planning studio for weddings, birthdays, and community events. Next.js App Router serves the document and same-origin API. Small React client components handle the interactive workspace. Plain CSS and local SVG visualizations provide the interface; no design builders are used.

## Dependency and ownership plan

Browser behavior follows `components → client adapters → domain`. Server planning follows `app route handlers → application → domain`; route handlers inject infrastructure adapters that depend on the domain contracts.

- `src/domain/contracts.ts`: canonical runtime schemas and derived types. Event briefs contain name, type (`wedding`, `birthday`, `community`), date (ISO calendar date), guests, budget (integer major currency units), currency (`INR`, `USD`, `EUR`, `GBP`), location and preferences. Plans contain a summary, exact budget allocations, dated tasks, vendor category checklists and personalized ideas.
- `src/domain/planner.ts`: deterministic plan generation and budget calculations. Allocations sum exactly to the requested budget, including rounding. Dates are derived in UTC. The AI cannot set budgets, dates, vendors, or completed state.
- `src/domain/workspace.ts`: canonical event mutation, capacity, persistence schema and aggregate calculations. Browser persistence is per device, with no accounts or shared guest records.
- `src/application`: orchestrates the canonical plan with optional, validated Gemini narrative enrichment. The same deterministic implementation supports server and browser fallback.
- `src/client`: bounded browser persistence, schema-validated request handling, canonical local fallback, and Markdown export.
- `src/infrastructure`: server-only Gemini REST adapter, bounded HTTP parsing, safe failure classification, and rate limiting. No provider SDK is included in the browser.
- `src/components`: focused workspace views, forms, accessible dialogs and cancellable async state. AI output is previewed and explicitly saved by the user.

## API and trust boundaries

`POST /api/plan` accepts `{ brief, prompt }` with strict runtime validation. `prompt` is an optional short instruction. Successful responses use `{ plan, source, notice }`, with source `gemini` or `demo`. Route handlers validate origin, content type, streamed body size and rate limit before calling the application service. Stable safe error responses use `{ error: { code, message } }`.

`GET /api/health` reports service and AI configuration mode without secrets. AI requests receive only the brief, deterministic planning facts and bounded user preference text. User text is untrusted data, never authority. Structured output is runtime validated; only narrative fields can be enriched. Provider failures return the canonical demo plan with a visible notice. No generated content is rendered as HTML.

The configured mode is a presence check, not a probe of the live provider. Each generation request has its own outcome and source label. A previously successful live request does not prevent a later request from timing out or returning an invalid response; failure recovery keeps the same canonical plan rather than applying partial generated state.

`src/domain/ai-policy.ts` owns the 25-second overall provider deadline and 35-second browser request deadline. At most one retry is allowed for a provider `5xx`; both attempts share the same provider timer. A `429` returns a classified fallback without an immediate retry. The route and Vercel execution budgets are configured to 45 seconds, while hosting support for that duration remains an environment requirement.

`src/domain/ai-failure.ts` owns the finite failure codes and safe public notice mapping. The infrastructure adapter classifies timeout, rate limit, authorization, model availability, output limit, invalid output, connection failure, and other provider failure; the application service converts these into notices beside the same canonical fallback plan. Unknown errors retain a general unavailable notice. Raw provider messages and credentials are never included. Prompt guidance requests concise narratives within the unchanged 1,800-token output ceiling.

## Budgets and release gates

Strict TypeScript includes unchecked indexed access and exact optional properties. Production functions have a 60 nonblank line maximum, cyclomatic complexity 10 and files 400 physical lines. ESLint warnings fail the build. Meaningful domain, application and infrastructure logic must reach 95% statement/line/function and 90% branch coverage, with the scope listed in TESTING.md. Unit, contract, component, integration, browser and automated accessibility tests are release gates. JavaScript and CSS gzip/raw budgets are enforced during the hosting build. Collections, input, provider deadlines and rate-limit storage have explicit bounds.

`npm run architecture:check` enforces the allowed static import directions and rejects cycles across the source tree. The same check runs in the deployment build. CI runs the full release gate and production dependency audit; it retains coverage, bundle and browser reports. Browser adapters and the async creation/generation/workspace hooks are included in meaningful-logic coverage. UI markup is assessed through component and browser tests rather than represented as line-coverage evidence.

The budget gate covers every emitted static JavaScript/CSS chunk, a conservative ceiling above initial-route transfer. `npm run browser:measure` records a separate fresh-browser transfer sample against a running production server. Neither measurement is represented as a hackathon score or deployed field-performance result.

## Deployment scope

Vercel and Render both run the full Next.js server; static-only hosting cannot execute Gemini requests. No external database is necessary for the local-first MVP. Multi-device collaboration, real vendor discovery, payments and authenticated accounts are outside this release. Live AI requires a user-supplied server-side Gemini key. Public live AI additionally requires distributed rate-limit configuration. A local production build and a deployed preview are separate verification claims.
