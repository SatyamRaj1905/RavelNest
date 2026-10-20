# Run RavelNest locally

These steps run the complete frontend and API together. Demo mode is fully usable without a Gemini API key or database.

## 1. Install the prerequisites

Install **Node.js 22 or newer**, including npm. Open a terminal and check:

```bash
node --version
npm --version
```

The first command should show `v22` or a newer major version. This repository's Node requirement is intentionally stricter than the framework minimum.

Node.js **24** is the tested version and is selected by the included `.nvmrc`. If you already use nvm and your terminal cannot find `node` or `npm`, load nvm and select the repository version after opening the project folder:

```bash
source "$HOME/.nvm/nvm.sh"
nvm install
nvm use
```

These commands assume nvm is already installed; they do not install nvm itself. Run them from the project root so nvm reads `.nvmrc`.

## 2. Open the project folder

If the project is already on your desktop:

```bash
cd ~/Desktop/RavelNest
```

Otherwise, download or clone your own copy and open its root folder. The root contains `package.json` and `.env.example`.

## 3. Install the exact locked dependencies

```bash
npm ci
```

Keep `package-lock.json`; it makes local, CI, and deployment installations reproducible.

## 4. Create your local environment file

Create this file only if it does not already exist. If you already have `.env.local`, edit that file and preserve its existing credentials instead of copying over it.

```bash
cp .env.example .env.local
```

For the first run, leave the optional credentials empty. `.env.local` is a private local file and must not be committed.

| Variable                   | Local value             | Purpose                                      |
| -------------------------- | ----------------------- | -------------------------------------------- |
| `GEMINI_API_KEY`           | Empty for demo          | Optional server-side Gemini credential       |
| `GEMINI_MODEL`             | `gemini-3.1-flash-lite` | Provider model used for narrative enrichment |
| `APP_ORIGIN`               | `http://localhost:3000` | Canonical origin accepted by the API         |
| `UPSTASH_REDIS_REST_URL`   | Empty for local demo    | Shared production rate-limit endpoint        |
| `UPSTASH_REDIS_REST_TOKEN` | Empty for local demo    | Private shared rate-limit credential         |

Never add `NEXT_PUBLIC_` to a secret variable. Next.js exposes variables with that prefix to browser bundles. [Next.js environment-variable documentation](https://nextjs.org/docs/app/guides/environment-variables).

## 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Keep the terminal running. Stop the server with **Ctrl+C** when finished.

Check [http://localhost:3000/api/health](http://localhost:3000/api/health) to see the non-secret service status. Create an event, preview its plan, and save it. Reload the page; the event should still appear in this browser.

## 6. Enable live Gemini enrichment, if desired

1. Create a Gemini API key in Google AI Studio using the [official key setup guide](https://ai.google.dev/gemini-api/docs/api-key).
2. In `.env.local`, set `GEMINI_API_KEY` to your key and use `GEMINI_MODEL=gemini-3.1-flash-lite` unless you have verified another compatible model. This model supports the structured output used by RavelNest. [Official model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite).
3. Restart the development server so it reloads environment variables.
4. Generate a new preview and inspect the visible source label. A demo result can indicate missing configuration, a provider failure, or an invalid provider response; the notice explains the fallback.

Only the validated event brief and bounded planning request are sent to Gemini. Do not put confidential guest details into a planning prompt. Model output is validated and restricted to narrative fields; allocation math and operational state remain deterministic. [Google structured-output guidance](https://ai.google.dev/gemini-api/docs/generate-content/structured-output).

Local development uses a bounded in-process limiter. Public production live AI requires `APP_ORIGIN` and both Upstash variables; see the [deployment instructions](README.md#deployment). Upstash is optional infrastructure for protecting public AI usage, not an event database.

## 7. Run the checks

Install the browser used by Playwright once:

```bash
npx playwright install chromium
```

Then run:

```bash
npm run verify:full
npm run audit:prod
```

See [TESTING.md](TESTING.md) for what each check covers and its limitations.

## 8. Run the production server locally

Stop the development server, then run:

```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) again. The build also enforces bundle budgets. In production mode a missing shared limiter keeps live AI disabled and returns the canonical demo plan. This is expected for a credential-free local production test.

## Troubleshooting

| Symptom                             | Action                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `node` or `npm` is not found        | Install Node.js, reopen the terminal, and check the versions again.                                                            |
| `npm ci` rejects the lockfile       | Confirm you are at the project root and have the repository's `package-lock.json`. Do not delete it as a first fix.            |
| Port 3000 is occupied               | Stop the other server or run `npm run dev -- --port 3001`, and update `APP_ORIGIN` to `http://localhost:3001`.                 |
| The assistant shows demo mode       | Check configuration and the notice. Restart after changing `.env.local`. Demo mode still generates a usable plan.              |
| A request is rejected for origin    | Match `APP_ORIGIN` to the exact scheme, host, and port in your address bar.                                                    |
| Events disappear in another browser | Persistence is browser-local. Return to the browser where the event was saved.                                                 |
| Browser storage is blocked          | The app can keep the current session in memory and reports the persistence issue. Enable site storage to persist future edits. |
| Browser tests cannot launch         | Run `npx playwright install chromium`; on Linux CI use `npx playwright install --with-deps chromium`.                          |

The framework's [installation guide](https://nextjs.org/docs/app/getting-started/installation) explains the development server. RavelNest's complete operational procedure is in [RUNBOOK.md](RUNBOOK.md).
