# Security boundaries

RavelNest is a browser-local event planning tool with an optional server-side Gemini integration. This document describes implemented controls and their verification points; it is not a security certification.

## Threat model

| Boundary                       | Main risk                                               | Control and evidence                                                                                            |
| ------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Browser → planning API         | Malformed, hostile, oversized, or cross-origin requests | Strict runtime contracts, body/content-type/origin checks, bounded input; API integration tests.                |
| Planning API → Gemini          | Cost abuse, provider failure, prompt injection          | Rate limiting, bounded prompt/output/deadline, structured output, runtime validation; provider and route tests. |
| AI output → workspace          | Invented numbers or unauthorized operational mutations  | Canonical deterministic budgets/dates; narrative-only enrichment; preview and explicit save.                    |
| Browser storage → interface    | Corrupt state or executable markup                      | Runtime persistence validation and escaped field rendering; storage tests.                                      |
| Server configuration → browser | Credential disclosure                                   | Server-only adapter and environment variables without public prefixes; source/build inspection.                 |
| Shared browser                 | Another device user reading local plans                 | No authentication boundary is provided. Use an appropriate browser profile and avoid sensitive guest data.      |

## Secret handling

`GEMINI_API_KEY` and `UPSTASH_REDIS_REST_TOKEN` belong in `.env.local` or the hosting provider's environment settings. Do not commit them, prefix them with `NEXT_PUBLIC_`, put them in screenshots, or log their values. The browser calls the same-origin route; it does not call Gemini directly. Health responses expose mode/configuration status, never credentials.

Before submission, inspect tracked source and generated client assets for actual secret values without printing the secret itself. The presence of an environment-variable name in a server module is not a leaked value. If a credential is exposed, revoke it with its provider, replace it, and redeploy.

## Public live AI policy

Public production Gemini access requires an exact `APP_ORIGIN` and shared Upstash rate-limit credentials. Missing configuration or unavailable shared limiting disables paid-provider access and uses the supported canonical demo path. Local development has bounded, expiring in-process limits, which are not claimed as a distributed production defense.

Rate limits reduce casual abuse; this release has no authenticated identity, per-account quota, billing enforcement, or bot-management service. A public host must still monitor provider usage and choose appropriate quotas. Vendor checklists do not trigger external bookings or payments.

## Input and output trust

External request bodies, persisted browser state, and provider responses are unknown until parsed with their runtime schemas. Request contracts reject unknown fields. The route validates origin and content type and bounds the body before application logic. Provider or parsing errors return stable safe public messages; internal stacks and raw provider errors are not rendered.

User preferences are untrusted data rather than system instructions. Generated output is limited to validated narrative fields. It cannot replace authoritative allocation math, dates, completion flags, or vendor statuses, and it is rendered as text rather than arbitrary HTML. [Google's structured-output guidance](https://ai.google.dev/gemini-api/docs/generate-content/structured-output) also calls for application-level semantic validation.

## Concrete resource limits

| Boundary                           | Limit                                                                                              | Canonical source                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Plan request body                  | 12,000 bytes, including streamed bodies                                                            | `src/infrastructure/request.server.ts`                                 |
| Event vision and assistant request | 1,200 characters each                                                                              | `src/domain/contracts.ts`                                              |
| Workspace                          | 12 events; 12 budget rows, 40 tasks, 16 vendors, and 12 ideas per plan                             | `src/domain/contracts.ts`                                              |
| Serialized browser workspace       | 250,000 UTF-8 bytes per saved workspace; both read and write enforce the limit                     | `src/client/storage.ts`                                                |
| Gemini prompt/response             | 16,000 prompt bytes; 48,000 response bytes; 1,800 output tokens                                    | Gemini adapter and prompt modules                                      |
| Provider deadline/retry            | 25 seconds total across at most two attempts; one retry only for `5xx`, none immediately for `429` | `src/domain/ai-policy.ts` and Gemini adapter                           |
| Browser generation timeout         | 35 seconds; obsolete requests abort                                                                | `src/domain/ai-policy.ts`, client request adapter, and generation hook |
| Configured hosting duration        | 45 seconds requested by the route and Vercel configuration; hosting support must be verified       | `src/app/api/plan/route.ts` and `vercel.json`                          |
| Development limiter                | 20 requests/minute per bucket; at most 256 buckets with expiry                                     | `src/infrastructure/rate-limit.server.ts`                              |
| Shared production limiter          | 20 requests/minute across instances sharing the Redis database/key; 2.5-second dependency timeout  | `src/infrastructure/rate-limit.server.ts`                              |

These limits bound the MVP. The shared production key is a global cost guard rather than an authenticated per-user quota. A hostile user could exhaust its availability; paid-provider access fails closed and the client offers deterministic fallback.

Failure notices are controlled by `src/domain/ai-failure.ts`. The adapter maps known timeout, rate-limit, authorization, model, output, connection, and availability outcomes to that finite set; the application returns the canonical fallback with the safe notice. It does not expose provider response bodies or infer a quota problem from a slow request. A health value of `gemini-configured` only reports configuration presence and does not prove success of the current generation request.

## Response headers

`next.config.ts` owns the response-header policy: content-security restrictions, frame protection, MIME sniffing protection, referrer policy, permissions policy, and production transport protection. Review that configuration alongside actual hosted headers because the hosting provider may add or alter headers.

The CSP permits inline scripts/styles for the current Next.js bootstrap and dynamic progress styling. Development mode additionally allows `unsafe-eval` for Next.js development tooling. Production excludes `unsafe-eval`; configuration tests enforce both cases. External script origins remain blocked, but this is not a nonce-based strict CSP. Removing the inline allowances requires a separate nonce/rendering change and corresponding browser checks.

```bash
curl -I http://localhost:3000
curl -I https://YOUR-APP-HOST
npm test
npm run audit:prod
```

The dependency audit result is recorded in [TESTING.md](TESTING.md); a zero-advisory result is time-specific and does not prove absence of vulnerabilities.

On **20 October 2026**, the local production smoke returned status 200 for `/` and `/api/health`, exposed all six configured security headers, and reported demo mode without credentials. The latest **21 October 2026** regression passed the production dependency audit with zero known vulnerabilities and the source/generated-client credential-pattern scan.

On 21 October, live Gemini was verified in local development: a real Chromium generation returned HTTP 200 with `source: "gemini"`, displayed **Personalized with Gemini**, and had no observed CSP errors. A separate application API response also passed the runtime schema. This does not verify production shared limiting, hosted TLS/headers, or public deployment behavior; those remain unverified.

After the timing/failure update, the final regression passed 149 Vitest tests in 19 files and twelve Chromium tests, including classified timeout/quota display and configuration-only health assertions. The production dependency audit still reported zero known vulnerabilities and the credential-pattern scan found no matches in source, tests, generated static assets, or documentation. Fresh local live generation succeeded with the unchanged key; no quota/authentication cause is inferred from the earlier slow requests.

## Data and unsupported controls

Event plans persist in the current browser's storage. They are not an encrypted vault, cloud backup, or shared database. Clearing storage removes them. Event briefs are sent to Gemini only when live enrichment is configured and requested; model/provider processing is subject to that service's terms. The application does not collect guest contact lists.

Accounts, authorization roles, multi-device sync, audit trails, encrypted exports, payment processing, real vendor verification, and regulatory compliance certification are outside this release. Review [Deploy.md](Deploy.md) before enabling public live AI.
