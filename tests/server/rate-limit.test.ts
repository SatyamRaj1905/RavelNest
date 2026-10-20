// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  enforceRateLimit,
  LocalRateLimiter,
} from '../../src/infrastructure/rate-limit.server';
import { readConfig } from '../../src/infrastructure/config.server';

const production = readConfig({
  NODE_ENV: 'production',
  GEMINI_API_KEY: 'test-key',
  UPSTASH_REDIS_REST_URL: 'https://redis.example',
  UPSTASH_REDIS_REST_TOKEN: 'test-token',
});
const request = (key?: string) =>
  new Request(
    'http://localhost/api/plan',
    key ? { headers: { 'x-forwarded-for': key } } : undefined,
  );

afterEach(() => vi.unstubAllGlobals());

describe('bounded local rate limits', () => {
  it('permits exact limit, rejects next hit and expires at the boundary', () => {
    const limiter = new LocalRateLimiter();
    for (let count = 0; count < 20; count++)
      expect(limiter.check('a', 100)).toBe(true);
    expect(limiter.check('a', 100)).toBe(false);
    expect(limiter.check('a', 60099)).toBe(false);
    expect(limiter.check('a', 60100)).toBe(true);
  });
  it('keeps a hard cap without evicting active limits, releases expired keys', () => {
    const limiter = new LocalRateLimiter();
    for (let key = 0; key < 256; key++)
      expect(limiter.check(String(key), 0)).toBe(true);
    expect(limiter.check('overflow', 1)).toBe(false);
    expect(limiter.check('overflow', 60000)).toBe(true);
    expect(new LocalRateLimiter().check('default-time')).toBe(true);
  });
  it('uses bounded local limits for development and supported keyless demo', async () => {
    const config = readConfig({ NODE_ENV: 'development' });
    await expect(enforceRateLimit(config, request())).resolves.toBeUndefined();
    for (let count = 0; count < 20; count++)
      await enforceRateLimit(config, request('local-limit-test'));
    await expect(
      enforceRateLimit(config, request('local-limit-test')),
    ).rejects.toMatchObject({ status: 429 });
    await expect(
      enforceRateLimit(
        { ...production, apiKey: '' },
        request('production-demo'),
      ),
    ).resolves.toBeUndefined();
  });
});

describe('fail-closed production live limiter', () => {
  it('uses atomic expiry plus global budget protection independent of spoofed IP', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ result: 20 }));
    await enforceRateLimit(production, request('spoofed'), fetcher);
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(String(url)).toBe('https://redis.example/');
    expect(String(init?.body)).toContain('PEXPIRE');
    expect(String(init?.body)).toContain('ravelnest:plan:global:v1');
    expect(String(init?.body)).not.toContain('spoofed');
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer test-token' });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
  it('rejects the request above the distributed limit', async () => {
    await expect(
      enforceRateLimit(
        production,
        request(),
        vi.fn<typeof fetch>().mockResolvedValue(Response.json({ result: 21 })),
      ),
    ).rejects.toMatchObject({ status: 429 });
  });
  it('rejects missing configuration before network', async () => {
    for (const config of [
      { ...production, redisUrl: '' },
      { ...production, redisToken: '' },
    ]) {
      const fetcher = vi.fn<typeof fetch>();
      await expect(
        enforceRateLimit(config, request(), fetcher),
      ).rejects.toMatchObject({ status: 503 });
      expect(fetcher).not.toHaveBeenCalled();
    }
  });
  it('fails closed for unsafe URLs, network, non-JSON and schema errors', async () => {
    for (const redisUrl of [
      'http://redis.example',
      'https://user@redis.example',
      'https://:password@redis.example',
      'invalid',
    ]) {
      await expect(
        enforceRateLimit(
          { ...production, redisUrl },
          request(),
          vi.fn<typeof fetch>(),
        ),
      ).rejects.toMatchObject({ status: 503 });
    }
    for (const providerResponse of [
      new Response('', { status: 503 }),
      new Response('not JSON'),
      Response.json({ result: '1' }),
    ]) {
      await expect(
        enforceRateLimit(
          production,
          request(),
          vi.fn<typeof fetch>().mockResolvedValue(providerResponse),
        ),
      ).rejects.toMatchObject({ status: 503 });
    }
    await expect(
      enforceRateLimit(
        production,
        request(),
        vi.fn<typeof fetch>().mockRejectedValue(new Error('Private token')),
      ),
    ).rejects.toMatchObject({ status: 503 });
  });
  it('uses injected global fetch by default', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ result: 1 }));
    vi.stubGlobal('fetch', fetcher);
    await expect(
      enforceRateLimit(production, request()),
    ).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
