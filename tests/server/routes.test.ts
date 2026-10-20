// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../src/app/api/plan/route';
import { GET } from '../../src/app/api/health/route';
import { createSampleWorkspace } from '../../src/domain/sample';
import { planResponseSchema } from '../../src/domain/contracts';
import { generatePlan } from '../../src/domain/planner';
import {
  DEFAULT_GEMINI_MODEL,
  readConfig,
} from '../../src/infrastructure/config.server';

const brief = createSampleWorkspace().events[0]?.brief;
if (!brief) throw new Error('Missing sample.');
let serial = 0;
const request = (
  body: unknown = { brief },
  extraHeaders: Record<string, string> = {},
) =>
  new Request('http://localhost:3000/api/plan', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      origin: 'http://localhost:3000',
      'x-forwarded-for': `route-${serial++}`,
      ...extraHeaders,
    },
  });

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('GEMINI_API_KEY', '');
  vi.stubEnv('GEMINI_MODEL', '');
  vi.stubEnv('APP_ORIGIN', '');
  vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
  vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('plan route integration', () => {
  it('returns valid canonical demo output with no-store caching', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const payload = planResponseSchema.parse(await response.json());
    expect(payload.plan).toEqual(generatePlan(brief));
    expect(payload.source).toBe('demo');
  });
  it('rejects malformed or hostile requests with stable errors', async () => {
    expect((await POST(request({ brief, unknown: true }))).status).toBe(400);
    expect(
      (await POST(request({}, { origin: 'https://attacker.example' }))).status,
    ).toBe(403);
    expect(
      (await POST(request({}, { 'content-type': 'text/plain' }))).status,
    ).toBe(415);
    expect(
      (await POST(request({ brief, prompt: 'a'.repeat(13000) }))).status,
    ).toBe(413);
    const malformed = new Request('http://localhost:3000/api/plan', {
      method: 'POST',
      body: '{invalid',
      headers: {
        origin: 'http://localhost:3000',
        'content-type': 'application/json',
      },
    });
    expect((await POST(malformed)).status).toBe(400);
  });
  it('fails closed for production live AI without distributed limits', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GEMINI_API_KEY', 'private-key');
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private-key');
  });
  it('recovers from provider network failure using exact canonical demo', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'private-key');
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockRejectedValue(new Error('Private provider failure')),
    );
    const response = await POST(request());
    const payload = planResponseSchema.parse(await response.json());
    expect(payload.source).toBe('demo');
    expect(payload.plan).toEqual(generatePlan(brief));
    expect(payload.notice).not.toContain('Private');
  });
  it('uses the canonical demo plan without retrying or switching a model that returns 404', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'private-key');
    vi.stubEnv('GEMINI_MODEL', 'gemini-2.5-flash');
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { error: { code: 404, message: 'Private provider detail' } },
          { status: 404 },
        ),
      );
    vi.stubGlobal('fetch', fetcher);
    const response = await POST(request());
    const payload = planResponseSchema.parse(await response.json());
    expect(response.status).toBe(200);
    expect(payload.source).toBe('demo');
    expect(payload.plan).toEqual(generatePlan(brief));
    expect(payload.notice).not.toContain('Private provider detail');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    );
  });
  it('composes production limiter and schema-constrained AI successfully', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GEMINI_API_KEY', 'private-key');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'private-token');
    vi.stubEnv('APP_ORIGIN', 'http://localhost:3000');
    const output = {
      summary: 'A thoughtful live draft.',
      ideas: Array.from({ length: 4 }, () => ({
        title: 'A personal detail',
        description: 'Reusable seasonal arrangements.',
        tag: 'Thoughtful',
      })),
    };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ result: 1 }))
      .mockResolvedValueOnce(
        Response.json({
          candidates: [
            {
              finishReason: 'STOP',
              content: { parts: [{ text: JSON.stringify(output) }] },
            },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetcher);
    const response = await POST(request());
    const payload = planResponseSchema.parse(await response.json());
    expect(payload.source).toBe('gemini');
    expect(payload.plan.summary).toBe(output.summary);
    expect(payload.plan.budget).toEqual(generatePlan(brief).budget);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe('configuration and health visibility', () => {
  it('applies defaults and rejects model path injection', () => {
    expect(DEFAULT_GEMINI_MODEL).toBe('gemini-3.1-flash-lite');
    expect(readConfig({}).model).toBe(DEFAULT_GEMINI_MODEL);
    expect(readConfig({ GEMINI_MODEL: '' }).model).toBe(DEFAULT_GEMINI_MODEL);
    expect(readConfig({ GEMINI_MODEL: 'gemini-2.5-flash' }).model).toBe(
      'gemini-2.5-flash',
    );
    expect(readConfig({ GEMINI_MODEL: '../secrets?key=bad' }).model).toBe(
      DEFAULT_GEMINI_MODEL,
    );
    expect(
      readConfig({
        GEMINI_MODEL: 'gemini-3.5-flash',
        GEMINI_API_KEY: '  test  ',
      }).apiKey,
    ).toBe('test');
    expect(readConfig({ GEMINI_MODEL: 'gemini-3.5-flash' }).model).toBe(
      'gemini-3.5-flash',
    );
  });
  it('reveals configuration mode without secrets or provider calls', async () => {
    const provider = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', provider);
    expect(await GET().json()).toEqual({
      status: 'ok',
      service: 'ravelnest',
      mode: 'demo',
      notice:
        'This endpoint checks configuration only; it does not call Gemini.',
    });
    vi.stubEnv('GEMINI_API_KEY', 'private-key');
    expect(await GET().json()).toMatchObject({ mode: 'gemini-configured' });
    vi.stubEnv('NODE_ENV', 'production');
    expect(await GET().json()).toMatchObject({ mode: 'demo' });
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'private-token');
    expect(await GET().json()).toMatchObject({ mode: 'demo' });
    vi.stubEnv('APP_ORIGIN', 'http://localhost:3000');
    expect(await GET().json()).toMatchObject({ mode: 'gemini-configured' });
    const response = GET();
    expect(await response.text()).not.toContain('private');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(provider).not.toHaveBeenCalled();
  });
});
