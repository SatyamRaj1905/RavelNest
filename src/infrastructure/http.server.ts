import 'server-only';

export class PublicError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'PublicError';
  }
}

export async function readBoundedJson(
  message: Request | Response,
  maxBytes: number,
): Promise<unknown> {
  if (Number(message.headers.get('content-length')) > maxBytes)
    throw new PublicError(
      'PAYLOAD_TOO_LARGE',
      'The request is too large.',
      413,
    );
  const reader = message.body?.getReader();
  if (!reader)
    throw new PublicError('INVALID_JSON', 'Send a valid JSON request.', 400);
  const decoder = new TextDecoder();
  let text = '';
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes)
        throw new PublicError(
          'PAYLOAD_TOO_LARGE',
          'The request is too large.',
          413,
        );
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    if (error instanceof PublicError) throw error;
    throw new PublicError('INVALID_JSON', 'Send a valid JSON request.', 400);
  } finally {
    reader.releaseLock();
  }
}

export function errorResponse(error: unknown): Response {
  const safe =
    error instanceof PublicError
      ? error
      : new PublicError(
          'INTERNAL_ERROR',
          'Something went wrong. Please try again.',
          500,
        );
  return Response.json(
    { error: { code: safe.code, message: safe.message } },
    { status: safe.status, headers: { 'Cache-Control': 'no-store' } },
  );
}
