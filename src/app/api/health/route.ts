import { readConfig } from '../../../infrastructure/config.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(): Response {
  const config = readConfig();
  const liveReady = Boolean(
    config.apiKey &&
    (!config.production ||
      (config.origin && config.redisUrl && config.redisToken)),
  );
  return Response.json(
    {
      status: 'ok',
      service: 'ravelnest',
      mode: liveReady ? 'gemini-configured' : 'demo',
      notice:
        'This endpoint checks configuration only; it does not call Gemini.',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
