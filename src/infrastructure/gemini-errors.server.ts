import 'server-only';
import { AiFailure } from '../domain/ai-failure';

export function failureForStatus(status: number): AiFailure {
  if (status === 429) return new AiFailure('rate-limit');
  if (status === 401 || status === 403) return new AiFailure('authentication');
  if (status === 404) return new AiFailure('model-unavailable');
  return new AiFailure('unavailable');
}

export function normalizeAiFailure(
  error: unknown,
  timedOut: boolean,
): AiFailure {
  if (timedOut) return new AiFailure('timeout');
  return error instanceof AiFailure ? error : new AiFailure('unavailable');
}
