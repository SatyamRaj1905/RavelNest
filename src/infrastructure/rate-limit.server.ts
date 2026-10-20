import 'server-only';
import { z } from 'zod';
import type { ServerConfig } from './config.server';
import { discardBody, readBoundedJson } from './http.server';
import { liveAiUnavailable, rateLimited } from './plan-errors.server';

const WINDOW_MS = 60000;
const LIMIT = 20;
const MAX_LOCAL_KEYS = 256;
const redisResultSchema = z.object({ result: z.number().int().positive() });
const SCRIPT =
  "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]); end; return count";

type Bucket = { count: number; expiresAt: number };

export class LocalRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  check(key: string, now: number = Date.now()): boolean {
    for (const [id, bucket] of this.buckets)
      if (bucket.expiresAt <= now) this.buckets.delete(id);
    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= MAX_LOCAL_KEYS) return false;
      bucket = { count: 0, expiresAt: now + WINDOW_MS };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    return bucket.count <= LIMIT;
  }
}

const localLimiter = new LocalRateLimiter();

async function distributedLimit(
  config: ServerConfig,
  fetcher: typeof fetch,
): Promise<boolean> {
  const url = new URL(config.redisUrl);
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new Error('Invalid limiter URL.');
  const response = await fetcher(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.redisToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      'EVAL',
      SCRIPT,
      '1',
      'ravelnest:plan:global:v1',
      String(WINDOW_MS),
    ]),
    signal: AbortSignal.timeout(2500),
    cache: 'no-store',
    redirect: 'error',
  });
  if (!response.ok) {
    await discardBody(response);
    throw new Error('Limiter unavailable.');
  }
  return (
    redisResultSchema.parse(await readBoundedJson(response, 4096)).result <=
    LIMIT
  );
}

function enforceLocalLimit(request: Request): void {
  const key = request.headers.get('x-forwarded-for')?.slice(0, 120) ?? 'local';
  if (!localLimiter.check(key)) throw rateLimited();
}

export async function enforceRateLimit(
  config: ServerConfig,
  request: Request,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  if (!config.production || !config.apiKey) return enforceLocalLimit(request);
  if (!config.redisUrl || !config.redisToken) throw liveAiUnavailable();
  let allowed: boolean;
  try {
    allowed = await distributedLimit(config, fetcher);
  } catch {
    throw liveAiUnavailable();
  }
  if (!allowed) throw rateLimited();
}
