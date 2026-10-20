# RavelNest runbook

RavelNest runs one Next.js application containing the browser studio and same-origin API. Event state is stored per browser. Gemini enrichment and the production shared limiter are optional external services; failure returns a visible deterministic planning fallback.

## Clean startup

Use Node.js 22 or newer from the project root. Copy `.env.example` only when `.env.local` does not already exist; preserve existing credentials when editing that file.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Leave the key empty for demo mode. See [Setup.md](Setup.md) for the complete beginner walkthrough and variable reference.

For live development, use `GEMINI_MODEL=gemini-3.1-flash-lite` and follow [Explain.md](Explain.md).

## Release procedure

```bash
npx playwright install chromium
npm run verify:full
npm run audit:prod
```

Review [TESTING.md](TESTING.md), [PERFORMANCE.md](PERFORMANCE.md), and [JUDGING.md](JUDGING.md) against the final output. Resolve failed gates before publishing. A local passing build is separate from a verified hosted preview.

A clean `npm ci` passed on **20 October 2026**, along with production `/` and `/api/health` returning 200 and the six configured security headers. The latest **21 October 2026** regression on Node.js `v26.12.0` passed the complete gate: 149 Vitest tests in 19 files, twelve Chromium tests, scoped coverage targets, architecture checks across 70 source files, bundle limits, and a production audit with zero known vulnerabilities.

Live Gemini generation was verified after the timing update on 21 October: real browser generation displayed **Personalized with Gemini**, returned HTTP 200 with `source: "gemini"` in approximately 12.106 seconds, and had no observed CSP errors. A separate application request returned a schema-valid live result in approximately 2.931 seconds. The existing key was unchanged. These are individual successful local requests; shared production Upstash, public hosting, and manual assistive-technology verification remain outstanding environment checks.

## Production commands

```bash
npm ci
npm run build
npm start
```

The build enforces bundle budgets. `npm start` serves the existing production build on `0.0.0.0` and the host's `PORT`. Do not run the development server as the hosted start command. See [Deploy.md](Deploy.md) for exact Vercel and Render settings.

## Health and smoke tests

```bash
curl -i http://localhost:3000/api/health
curl -I http://localhost:3000
```

For hosting, replace the origin with the exact deployed HTTPS URL. Health should return safe JSON without secrets. It reports configuration, not proof that the external provider has successfully responded. Confirm live AI with a generated preview and its visible `Gemini` source label.

Gemini has a 25-second overall deadline, the browser request has 35 seconds, and the route/Vercel duration is configured to 45 seconds. A single `5xx` retry shares the provider deadline; a `429` is not immediately retried. A timeout notice calls for another bounded attempt with the existing working configuration, not an unsupported billing or key-rotation fix. An already-open demo preview retains its earlier result; refresh the updated app and generate a fresh preview before judging the new request.

Run the create → preview → save journey, change a budget actual, complete a task, update a vendor, and reload. Check mobile layout, keyboard focus, browser console, API errors, and the source notice. Repeat the browser suite against the deployed URL using the variable documented in [TESTING.md](TESTING.md).

## Failure diagnosis

| Observation                          | First checks                                                                                      | Recovery                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Build fails                          | Read the first failed gate: formatting, lint, types, tests, compilation, or bundle budget.        | Fix that failure and rerun the complete gate. Do not bypass limits to publish.                 |
| `/api/health` is unreachable         | Hosting logs, start command, Node version, assigned `PORT`, process state.                        | Use the documented web-service settings and redeploy.                                          |
| Origin rejection                     | Exact browser scheme/host/port and `APP_ORIGIN`.                                                  | Correct the environment variable and redeploy or restart.                                      |
| Demo source with a Gemini key        | Origin configuration, shared limiter availability in production, key/model settings, safe notice. | Correct settings; keep supported demo available during investigation.                          |
| Rate-limit response                  | Recent request burst and shared limiter connectivity.                                             | Wait for the rate window; use the canonical fallback without retry loops.                      |
| Provider timeout or invalid response | Provider status and quota; app's safe notice.                                                     | The app returns demo. Fix provider configuration without changing deterministic facts.         |
| Changes vanish after reload          | Browser storage availability and app storage notice.                                              | Enable site storage, preserve the current tab, and avoid clearing it. No server backup exists. |
| Different device has no event        | Workspace is local to the original browser profile.                                               | Return to that profile; there is no cloud sync in this release.                                |
| Browser tests cannot start           | Chromium dependency installation or occupied local port.                                          | Install Playwright Chromium and stop conflicting servers.                                      |

## Emergency reduction of external usage

Remove `GEMINI_API_KEY` in hosting settings and redeploy. The supported demo path continues to produce plans. If a key may have leaked, revoke it with Google and replace it; changing application code alone does not invalidate the credential. Keep provider logs free of event preferences and credentials.

## Data recovery and rollback

Server rollback restores code, not browser-local event data. There is no cloud backup, account recovery, or synchronization. Avoid telling a user to clear local storage as a routine troubleshooting step because that deletes their saved workspace. A malformed persisted workspace is rejected rather than trusted as valid state.

## Required checks before public submission

- [x] Automated release gates and current dependency audit pass locally on 21 October 2026.
- [x] Live Gemini generation is verified in local development on 21 October 2026.
- [ ] Actual deployment preview loads and `/api/health` responds.
- [ ] Exact canonical origin and production environment configuration are verified.
- [ ] Live Gemini success and shared limiter behavior are tested if live AI is enabled.
- [ ] Demo/network failure, keyboard, mobile, and persistence smoke stories pass on the hosted URL.
- [x] Manual accessibility limitations and remaining verification gaps are recorded accurately.
