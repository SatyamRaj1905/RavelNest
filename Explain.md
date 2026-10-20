# RavelNest: enable Gemini locally and understand every environment variable

The Gemini integration is already implemented. To try it locally, add your existing key to `.env.local`, select the model, and run **`npm run dev`**. **Redis is not needed for this development workflow.**

This guide follows the current RavelNest source and official provider documentation checked on **21 October 2026**. Example credentials below are placeholders. Your actual key does not belong in this document.

## 1. Is my free Gemini API key tied to a particular model?

Your API key authorizes requests associated with a Google Cloud project. It is not the model name. RavelNest chooses the model separately through `GEMINI_MODEL`; access still depends on the project's permissions and available models. [Google's API key documentation](https://ai.google.dev/gemini-api/docs/api-key).

For this project, start with:

```dotenv
GEMINI_MODEL=gemini-3.1-flash-lite
```

That is the application's configured default. Google's model documentation lists this model as supporting structured output, which RavelNest needs to validate the generated summary and ideas. Use the identifier exactly, without `models/` or a descriptive name such as `Gemini Flash`. [Gemini 3.1 Flash-Lite model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite).

As checked on **21 October 2026**, Google lists free-tier input and output for standard Gemini 3.1 Flash-Lite requests. Creating a key does not guarantee unlimited usage or access for your particular project. Check the model's current free-tier availability in [Google's pricing table](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite).

To check your own allowance:

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Open the API Keys/dashboard area and identify the project associated with your existing key.
3. Open that project's usage/rate-limit view; Google's [rate-limit documentation](https://ai.google.dev/gemini-api/docs/rate-limits) links directly to the active-limits page.
4. Check the selected model and the project's usage tier. Stay on an available free-tier option if you want to avoid enabling paid usage.

Google applies quotas per project, not per API key. Generating another key in the same project does not create a fresh quota. Requests, tokens and daily usage can have separate limits; the project dashboard is the authority for your account. [Google's rate-limit explanation](https://ai.google.dev/gemini-api/docs/rate-limits).

## 2. Set up the local environment file

### Step 1: open the project root

In your terminal:

```bash
cd ~/Desktop/RavelNest
```

The root contains `package.json`, `.env.example`, and your `.env.local`.

### Step 2: understand the two environment files

| File           | What belongs in it                                                          |
| -------------- | --------------------------------------------------------------------------- |
| `.env.example` | Shareable variable names, defaults and empty credential fields.             |
| `.env.local`   | Your actual private local settings. Next.js loads them for the application. |

You already have `.env.local` open. **Edit that existing file; do not overwrite it by copying `.env.example` over it.** Keep one entry for each variable.

### Step 3: configure local AI

Use these settings in `.env.local`, replacing the placeholder with your existing Gemini key. If the key is already there, keep its value.

```dotenv
GEMINI_API_KEY=PASTE_YOUR_EXISTING_GEMINI_KEY_HERE
GEMINI_MODEL=gemini-3.1-flash-lite
APP_ORIGIN=http://localhost:3000
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Leave the last two values empty for now. Save the file with **Cmd+S** on macOS. Use the exact variable names above: this application reads `GEMINI_API_KEY`, not an alternative name such as `GOOGLE_API_KEY`.

### Step 4: check Node and dependencies

The project requires Node.js 22 or newer:

```bash
node --version
npm --version
```

If you already use nvm and the commands are unavailable, run these from the project root:

```bash
source "$HOME/.nvm/nvm.sh"
nvm install
nvm use
```

The repository's `.nvmrc` selects Node 24. If dependencies have not been installed, run:

```bash
npm ci
```

### Step 5: start the development server

Stop an existing RavelNest server with **Ctrl+C** in the terminal running it. Then run:

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and keep the terminal running. Restart the server after changing environment values so the new configuration is loaded consistently.

Use `npm run dev` for your first local AI check. `npm start` runs production mode and has additional Redis requirements, explained below.

If port 3000 is occupied and you cannot stop the other process, change the origin to:

```dotenv
APP_ORIGIN=http://localhost:3001
```

Then start:

```bash
npm run dev -- --port 3001
```

Open `http://localhost:3001`, matching the configured origin.

## 3. Confirm that Gemini actually works

### Step 1: check that the key setting was detected

Open [http://localhost:3000/api/health](http://localhost:3000/api/health), using your chosen port. In development, a nonempty key setting should produce:

```json
{
  "status": "ok",
  "service": "ravelnest",
  "mode": "gemini-configured",
  "notice": "This endpoint checks configuration only; it does not call Gemini."
}
```

This is a **configuration check**, not a successful AI test. Its `notice` states that it does not call Gemini. It does not check your quota, model access, or key validity. A mistyped nonempty key can still produce this mode.

### Step 2: generate a fresh event plan

1. Open the website and choose **Create event**.
2. Enter a name, event type, future date, guest count, budget and location.
3. Give **Your vision** a specific direction, for example: “An intimate garden birthday with vegetarian food, reusable decorations and activities for children.”
4. Choose **Generate plan** and wait for the preview.
5. Look for **Personalized with Gemini**. That label means this request returned a validated Gemini result.
6. Choose **Save event** if you want to keep the preview.

The initial sample workspace does not automatically become a Gemini plan when you add a key. Generate a new preview or ask the assistant for fresh suggestions.

### Step 3: try the planning companion

On Overview, enter a request such as “Suggest personal touches using seasonal flowers and reusable decor.” Send it, review **Gemini suggestions**, and choose **Apply suggestions** to save them.

Gemini personalizes the summary and ideas. Budget allocations and timeline dates remain controlled by the planning engine, so unchanged budget numbers are expected.

For an additional check, open browser developer tools → **Network**, send a request, and inspect the **Response** of `POST /api/plan`. A successful live result has `"source": "gemini"`. Do not share a full request/response capture containing private event details.

**A working page or HTTP 200 alone does not prove AI worked.** Provider failure can also return a usable plan with `"source": "demo"`. The UI labels that fallback as **Demo planning engine** or **Demo suggestions**.

### Local live verification: 21 October 2026

The complete RavelNest `POST /api/plan` workflow returned **HTTP 200 with `"source": "gemini"`** using `gemini-3.1-flash-lite` in local development. This verified the live provider call, structured response validation, and application enrichment path. No credential or private event content is recorded here. Production Redis and public deployment verification remain separate checks.

A successful live request verifies that request at that time. It does not guarantee that the next request will complete before its deadline. The health page can continue to say `gemini-configured` while an individual request falls back to demo.

### Why configured Gemini can still return a demo plan

The configuration indicator checks that settings are present. Every generation request separately depends on provider availability, response time, access, and valid structured output. Inspect that request's source and notice; a configured badge alone does not identify the failure.

In the later **21 October 2026** investigation, two planning requests finished at approximately **9.0 seconds**, matching the provider deadline then configured in RavelNest. A fresh request through the same Gemini adapter and existing key succeeded in approximately **5.039 seconds**, returning HTTP 200 and a completed response. This supports a request-deadline explanation for the intermittent fallback. It does not establish that the key is invalid or that a free-tier quota was exhausted; no `429` response was observed in that diagnostic.

Keep the existing working key. Changing keys or enabling paid billing is not a demonstrated fix for a request timeout. If a later notice specifically reports a provider rate limit, check the project's current limits and wait for the applicable reset; treat that separately from a slow response.

After the timing update, a fresh full application request succeeded in approximately **2.931 seconds**. A fresh real Chromium event preview then succeeded in approximately **12.106 seconds**, showing **Personalized with Gemini**, HTTP 200 with `"source": "gemini"`, and zero observed CSP errors. That successful browser request took longer than the previous nine-second cutoff. These individual results support allowing more response-time headroom; they do not guarantee future latency or prove the exact cause of the earlier unclassified failures. The existing key was unchanged.

Reload [http://localhost:3000](http://localhost:3000) to use the updated app, then generate a new event preview or send a new assistant request. An already-open demo preview is the result of its earlier request and will keep its demo badge. With the updated interface, **Back to details → Generate plan** makes a fresh request. Existing saved demo events are not regenerated by refreshing the health page.

### Request timing and failure notices

The provider now has **25 seconds total**, shared by the initial attempt and at most one retry for a `5xx` response. A provider `429` is reported without an immediate automatic retry. The browser waits up to **35 seconds** for the planning endpoint, leaving room for the provider deadline, validation, and server overhead. The route and Vercel configuration request a **45-second** hosting limit; the actual hosting plan must support it. These are bounded deadlines, not promised response times. The canonical timing constants are in [ai-policy.ts](src/domain/ai-policy.ts).

The UI now uses a specific, safe notice when the adapter can classify the failure:

| Notice begins with                                   | Meaning and next step                                                                              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| “Gemini took too long to respond.”                   | The provider deadline expired. Try again with the existing key; a shorter request may reduce work. |
| “Gemini reached a rate or quota limit.”              | A provider `429` occurred. Check AI Studio's allowance and wait before retrying.                   |
| “Gemini could not authorize this request.”           | A provider authorization response occurred. Check key/project access.                              |
| “The configured Gemini model is unavailable.”        | The provider returned a model-not-found response. Check the exact model and project access.        |
| “Gemini could not finish within the response limit.” | Output reached a token/size limit. Try a shorter planning request.                                 |
| “Gemini returned an incomplete or invalid response.” | The generated response failed completion or schema checks. Retry the request.                      |
| “The server could not reach Gemini.”                 | The provider connection failed. Check the server's connection and retry.                           |
| “Gemini is temporarily unavailable.”                 | Another provider failure occurred. Try again later.                                                |

These notices come from [ai-failure.ts](src/domain/ai-failure.ts), using the adapter's bounded classifications rather than displaying raw provider messages. Each keeps the complete deterministic plan available. If the browser cannot reach the planning endpoint at all, it uses the separate local offline notice. A generic unclassified error can still use the general unavailable notice.

## 4. Every application environment variable

| Variable                   | Meaning                                                            | Where to get its value                                                                       | Needed for local `npm run dev` AI?         | Needed for production live AI?                                |
| -------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `GEMINI_API_KEY`           | Authorizes the server's Gemini requests. Treat it like a password. | Your existing key in [Google AI Studio's API Keys page](https://aistudio.google.com/apikey). | Yes.                                       | Yes.                                                          |
| `GEMINI_MODEL`             | Selects the model used for generation.                             | A supported model identifier; start with `gemini-3.1-flash-lite`. It is not generated.       | Keep the supplied default.                 | Keep the supplied default or verify a compatible alternative. |
| `APP_ORIGIN`               | The exact website origin allowed to submit planning requests.      | Your browser address: scheme, hostname and port. You set it yourself.                        | Set it to your local address.              | Explicitly required; use the deployed HTTPS origin.           |
| `UPSTASH_REDIS_REST_URL`   | The HTTPS address of your Upstash Redis REST endpoint.             | Your Redis database's REST connection details in Upstash.                                    | No; Redis is not used in development mode. | Yes.                                                          |
| `UPSTASH_REDIS_REST_TOKEN` | Authorizes the server to update the Redis rate counter.            | The same database's standard writable REST token.                                            | No.                                        | Yes.                                                          |

`APP_ORIGIN` examples:

```dotenv
# Local development
APP_ORIGIN=http://localhost:3000

# Example deployment; replace with your actual hostname
APP_ORIGIN=https://your-ravelnest.vercel.app
```

Keep only the relevant origin entry in your actual file. It must have **no trailing slash and no path**. `http://localhost:3000` and `http://127.0.0.1:3000` are different origins. If you configure the first, open that exact address. A mismatch is rejected even during development.

## 5. What Redis does in this project

Redis holds RavelNest's **shared request counter** for production AI access. The application currently allows up to **20 planning requests per 60-second window** across server instances sharing the same Redis database and counter key.

For example, several visitors can reach different server instances. Each instance checks the same counter before making a Gemini request. Once the window's allowance has been consumed, further live API requests are rejected until the window expires; the website can still offer its local demo plan.

Without shared storage, separate servers would count requests independently. A shared counter helps limit consumption of your Gemini quota. This is an application limit, separate from Google's quotas, and it is global rather than per user.

In this release:

- Gemini generates the AI text; Redis does not generate it.
- Event plans persist in browser local storage. Redis is not the event-plan database or a cloud backup.
- Redis stores an expiring counter, not event briefs, guest lists or generated plans.
- Development uses an in-memory limiter. Supplying Redis values while running `npm run dev` does not make that workflow use Redis.

These behaviors come from [`rate-limit.server.ts`](src/infrastructure/rate-limit.server.ts), not from a requirement imposed by the Gemini API.

## 6. Create the Redis URL and token in Upstash

You can complete local development with Gemini before doing this section. Create Redis when preparing production live AI or testing that production configuration locally.

### Step 1: create a database

1. Open the [Upstash Console](https://console.upstash.com/) and sign in or create an account.
2. Open **Redis** and choose **Create Database**.
3. Name it `ravelnest-rate-limit`.
4. Choose a primary region near the server where RavelNest will run.
5. Continue to plan selection. Choose a free option if it is offered for your account and fits your needs; review the displayed terms before confirming a paid option.
6. Create the database and open its details.

Button labels can change. Upstash's [official getting-started guide](https://upstash.com/docs/redis/overall/getstarted) describes the current database-creation flow.

### Step 2: find the REST credentials

Open the database's **Connect** section and select **REST**. Copy its REST endpoint URL and the **standard** REST token. Keep the read-only-token option off: this project's counter needs write permissions. Upstash documents the token selector in its [REST authentication guide](https://upstash.com/docs/redis/features/restapi#security-and-authentication).

The URL must start with `https://`. Copy the REST URL rather than a TCP connection string beginning with `redis://` or `rediss://`. Copy the token identified as `UPSTASH_REDIS_REST_TOKEN`, not a separate account-management credential.

The service provides these connection values after database creation; you do not invent them. You do not need to install a local Redis server or Redis CLI for RavelNest's REST connection. [Upstash REST API documentation](https://upstash.com/docs/redis/features/restapi).

### Step 3: add both values to `.env.local`

For a local production-mode test, your configuration should look like this:

```dotenv
GEMINI_API_KEY=YOUR_EXISTING_GEMINI_KEY
GEMINI_MODEL=gemini-3.1-flash-lite
APP_ORIGIN=http://localhost:3000
UPSTASH_REDIS_REST_URL=https://YOUR_DATABASE_ENDPOINT.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_STANDARD_REST_TOKEN
```

Replace the placeholders with your own values from the correct services. The URL and token must belong to the same Redis database. Save the file.

### Step 4: test the production configuration locally

Stop the development server with **Ctrl+C**, then run:

```bash
npm run build
npm start
```

Open your configured local address and generate a fresh plan. A live result should have the Gemini source label. In Upstash's database console, inspect metrics or its data browser for the expiring counter `ravelnest:plan:global:v1`. It may disappear after the window expires; seeing it confirms counter activity, not successful Gemini generation.

Do not expect production live AI with a key and empty Redis settings to work: this application's production protection rejects that request before calling Gemini. The browser then offers a labeled local fallback.

For deployment, put these values in the hosting dashboard, replace `APP_ORIGIN` with the deployed origin, and redeploy. Follow the [deployment instructions](README.md#deployment) for Vercel or Render.

## 7. Development versus production

| How you start RavelNest   | Gemini key                 | Origin                | Redis                             | Result                                                      |
| ------------------------- | -------------------------- | --------------------- | --------------------------------- | ----------------------------------------------------------- |
| `npm run dev`             | Empty                      | Matching local origin | Unused                            | Demo plan.                                                  |
| `npm run dev`             | Valid and model accessible | Matching local origin | Unused                            | Attempts live Gemini; falls back if the provider fails.     |
| `npm start` after a build | Empty                      | Matching origin       | Not required                      | Demo plan.                                                  |
| `npm start` after a build | Present                    | Missing or mismatched | Any                               | API rejects the request; the website offers local fallback. |
| `npm start` after a build | Present                    | Correct               | Missing, invalid or unavailable   | API blocks live access; the website offers local fallback.  |
| `npm start` after a build | Valid and model accessible | Correct               | Working, with allowance remaining | Attempts live Gemini; falls back if the provider fails.     |

Production rules depend on **how the server is started**, even if its address is `localhost`.

Next.js manages `NODE_ENV` for these commands. You do not need to add it to `.env.local`. To change the listening port, use `--port` as shown above or set `PORT` in the shell/hosting settings. Setting `PORT` inside `.env.local` does not change the listening port. A changed port needs a matching `APP_ORIGIN`. [Next.js CLI documentation](https://nextjs.org/docs/app/api-reference/cli/next). `PLAYWRIGHT_BASE_URL` and `CI` are test/automation settings, not Gemini or Redis credentials, and are unnecessary for this setup.

## 8. Troubleshooting

During the **21 October 2026** local investigation, an older `npm start` process still occupied port 3000 after environment settings changed, while a development server ran on 3001. Stop the earlier RavelNest processes from their terminals, start one development server, and open the exact origin configured in `APP_ORIGIN`. A 3001 browser URL with a 3000 origin setting is rejected.

In the same investigation, generation requests to `gemini-2.5-flash` and `gemini-2.5-flash-lite` returned `404 NOT_FOUND` for the tested project, even though model listing showed them. Changing the selected model to `gemini-3.1-flash-lite` produced the successful live application result above. This records the observed project behavior, not a claim that the older models are universally unavailable. Model listing alone does not prove successful generation access.

| Symptom                                                                | What to check                                                                                                                                                                       |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health says `demo` during `npm run dev`                                | Confirm `GEMINI_API_KEY` is nonempty in the root `.env.local`, save, and restart.                                                                                                   |
| Health says `gemini-configured`, but the preview says demo             | Configuration was detected, but generation failed. Check the key's project, model access, current quota and internet connection. This health response does not test those services. |
| Old sample events still say demo                                       | Generate a new preview or new assistant suggestions. Existing sample plans are not regenerated automatically.                                                                       |
| Local AI falls back despite a key                                      | Use `npm run dev` first. If using `npm start`, configure Redis and the explicit origin too.                                                                                         |
| `POST /api/plan` returns 403                                           | Match `APP_ORIGIN` to the address bar's exact scheme, hostname and port; remove trailing slashes/paths.                                                                             |
| `POST /api/plan` returns 503 in production                             | Check the explicit origin and both Redis values. Verify the database is available and the standard token can write.                                                                 |
| `POST /api/plan` returns 429                                           | RavelNest's request window is full. Wait for it to expire. Google's own quota is separate and can also cause a demo result.                                                         |
| A Google model/access error occurs                                     | Check the exact model identifier and its availability for the project's tier; do not substitute an image, audio or embedding model into this text-planning adapter.                 |
| Quota is exhausted                                                     | Check AI Studio's active limits and wait for the relevant reset or choose an available supported model. Another key in the same project does not reset quota.                       |
| Redis credentials are filled but no counter appears during development | Expected: `npm run dev` uses memory, not Redis. Test with a production build/server to exercise Redis.                                                                              |
| Health says configured after entering incorrect Redis values           | Expected: health checks configuration presence, not Redis connectivity. Generate a plan to exercise the connection.                                                                 |
| The app returns a demo plan with HTTP 200                              | Expected fallback behavior after a provider failure. Inspect `source` and the notice rather than status alone.                                                                      |

The application deliberately does not expose raw provider errors or secrets. Use the visible notices, the request's source field and provider dashboards to narrow the issue.

## 9. Keep credentials in the right place

Store real secrets only in `.env.local` or private hosting settings. Keep `.env.example` shareable, and do not add `NEXT_PUBLIC_` to the key or Redis token. `.gitignore` already excludes `.env.local`. Do not paste secrets into frontend source, documentation, chat or screenshots. [Google's key-handling guidance](https://ai.google.dev/gemini-api/docs/api-key#security-and-secret-management).

No credentials need to be generated for `APP_ORIGIN` or `GEMINI_MODEL`: you choose their values. For your first local check, the only service credential you need is the Gemini key you already generated.

## Source of the project-specific behavior

- [Environment configuration](src/infrastructure/config.server.ts)
- [Origin and request validation](src/infrastructure/request.server.ts)
- [Development and production rate limiting](src/infrastructure/rate-limit.server.ts)
- [Gemini request adapter](src/infrastructure/gemini.server.ts)
- [Narrative enrichment and fallback](src/application/plan-event.ts)
- [Health endpoint](src/app/api/health/route.ts)
- [Local setup](Setup.md) and [deployment instructions](README.md#deployment)

This guide records the successful local live Gemini verification above and explains how to repeat it. It does not claim that production Redis, a hosted deployment, or another project's credentials have been verified.
