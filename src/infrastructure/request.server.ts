import 'server-only';
import { planRequestSchema, type PlanRequest } from '../domain/contracts';
import type { ServerConfig } from './config.server';
import { PublicError, readBoundedJson } from './http.server';
import { liveAiUnavailable } from './plan-errors.server';

export async function validatePlanRequest(
  request: Request,
  config: ServerConfig,
): Promise<PlanRequest> {
  if (config.production && config.apiKey && !config.origin)
    throw liveAiUnavailable();
  const contentType = request.headers
    .get('content-type')
    ?.split(';')[0]
    ?.trim();
  if (contentType !== 'application/json')
    throw new PublicError(
      'UNSUPPORTED_MEDIA_TYPE',
      'Send this request as application/json.',
      415,
    );
  const origin = request.headers.get('origin');
  const expectedOrigin = config.origin || new URL(request.url).origin;
  if (origin !== expectedOrigin)
    throw new PublicError(
      'FORBIDDEN_ORIGIN',
      'This request must come from this website.',
      403,
    );
  const data = await readBoundedJson(request, 12000);
  const result = planRequestSchema.safeParse(data);
  if (!result.success)
    throw new PublicError(
      'INVALID_REQUEST',
      'Check your event details and try again.',
      400,
    );
  return result.data;
}
