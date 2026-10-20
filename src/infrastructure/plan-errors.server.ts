import 'server-only';
import { PublicError } from './http.server';

export function liveAiUnavailable(): PublicError {
  return new PublicError(
    'SERVICE_UNAVAILABLE',
    'Live AI is temporarily unavailable. Use the local planning option.',
    503,
  );
}

export function rateLimited(): PublicError {
  return new PublicError(
    'RATE_LIMITED',
    'Too many plans. Please try again in a minute.',
    429,
  );
}
