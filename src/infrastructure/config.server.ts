import 'server-only';

export const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-lite';

export type ServerConfig = {
  apiKey: string;
  model: string;
  production: boolean;
  origin: string;
  redisUrl: string;
  redisToken: string;
};

export function readConfig(
  env: Record<string, string | undefined> = process.env,
): ServerConfig {
  const model = env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  return {
    apiKey: env.GEMINI_API_KEY?.trim() ?? '',
    model: /^[a-zA-Z0-9.-]{1,80}$/.test(model) ? model : DEFAULT_GEMINI_MODEL,
    production: env.NODE_ENV === 'production',
    origin: env.APP_ORIGIN ?? '',
    redisUrl: env.UPSTASH_REDIS_REST_URL ?? '',
    redisToken: env.UPSTASH_REDIS_REST_TOKEN ?? '',
  };
}
