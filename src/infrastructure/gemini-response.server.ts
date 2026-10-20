import 'server-only';
import { z } from 'zod';
import { AiFailure } from '../domain/ai-failure';
import { narrativeSchema, type Narrative } from '../domain/narrative';
import { PublicError, readBoundedJson } from './http.server';

const MAX_RESPONSE_BYTES = 48000;
const envelopeSchema = z.object({
  candidates: z
    .array(
      z.object({
        finishReason: z.string().max(80),
        content: z.unknown().optional(),
      }),
    )
    .min(1)
    .max(4),
});
const contentSchema = z.object({
  parts: z
    .array(z.object({ text: z.string().max(16000) }))
    .min(1)
    .max(8),
});

function parseNarrative(input: unknown): Narrative {
  const envelope = envelopeSchema.parse(input);
  const candidate = envelope.candidates[0];
  if (!candidate) throw new AiFailure('invalid-output');
  if (candidate.finishReason === 'MAX_TOKENS')
    throw new AiFailure('output-limit');
  if (candidate.finishReason !== 'STOP') throw new AiFailure('invalid-output');
  const content = contentSchema.parse(candidate.content);
  const output: unknown = JSON.parse(
    content.parts.map((part) => part.text).join(''),
  );
  return narrativeSchema.parse(output);
}

export async function readGeminiResponse(
  response: Response,
): Promise<Narrative> {
  try {
    return parseNarrative(await readBoundedJson(response, MAX_RESPONSE_BYTES));
  } catch (error) {
    if (error instanceof AiFailure) throw error;
    if (error instanceof PublicError && error.code === 'PAYLOAD_TOO_LARGE')
      throw new AiFailure('output-limit');
    throw new AiFailure('invalid-output');
  }
}
