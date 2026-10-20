import 'server-only';
import { AiFailure } from '../domain/ai-failure';
import { GEMINI_DEADLINE_MS } from '../domain/ai-policy';
import type { EventBrief, EventPlan } from '../domain/contracts';
import type { Narrative } from '../domain/narrative';
import type { ServerConfig } from './config.server';
import { failureForStatus, normalizeAiFailure } from './gemini-errors.server';
import { createGeminiBody } from './gemini-prompt.server';
import { readGeminiResponse } from './gemini-response.server';
import { discardBody } from './http.server';

export { GEMINI_DEADLINE_MS } from '../domain/ai-policy';
const MAX_PROMPT_BYTES = 16000;

async function fetchAttempt(
  config: ServerConfig,
  body: string,
  signal: AbortSignal,
  fetcher: typeof fetch,
): Promise<Response> {
  try {
    return await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey,
        },
        body,
        signal,
        cache: 'no-store',
        redirect: 'error',
      },
    );
  } catch {
    throw new AiFailure('network');
  }
}

export async function generateNarrative(
  config: ServerConfig,
  brief: EventBrief,
  plan: EventPlan,
  prompt = '',
  fetcher: typeof fetch = fetch,
): Promise<Narrative> {
  const body = createGeminiBody(brief, plan, prompt, config.model);
  if (new TextEncoder().encode(body).byteLength > MAX_PROMPT_BYTES)
    throw new Error('Prompt exceeds its budget.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_DEADLINE_MS);
  try {
    let response = await fetchAttempt(config, body, controller.signal, fetcher);
    if (response.status >= 500) {
      await discardBody(response);
      response = await fetchAttempt(config, body, controller.signal, fetcher);
    }
    controller.signal.throwIfAborted();
    if (!response.ok) {
      await discardBody(response);
      throw failureForStatus(response.status);
    }
    const narrative = await readGeminiResponse(response);
    controller.signal.throwIfAborted();
    return narrative;
  } catch (error) {
    throw normalizeAiFailure(error, controller.signal.aborted);
  } finally {
    clearTimeout(timer);
  }
}
