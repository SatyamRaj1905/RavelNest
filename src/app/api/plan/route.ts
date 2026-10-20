import { planEvent } from '../../../application/plan-event';
import { readConfig } from '../../../infrastructure/config.server';
import { generateNarrative } from '../../../infrastructure/gemini.server';
import { errorResponse } from '../../../infrastructure/http.server';
import { enforceRateLimit } from '../../../infrastructure/rate-limit.server';
import { validatePlanRequest } from '../../../infrastructure/request.server';

export const runtime = 'nodejs';
export const maxDuration = 45;

export async function POST(request: Request): Promise<Response> {
  try {
    const config = readConfig();
    const input = await validatePlanRequest(request, config);
    await enforceRateLimit(config, request);
    const provider = config.apiKey
      ? (
          brief: typeof input.brief,
          plan: Parameters<typeof generateNarrative>[2],
          prompt: string,
        ) => generateNarrative(config, brief, plan, prompt)
      : undefined;
    const response = await planEvent(input, provider);
    return Response.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
