// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { AiFailure } from '../../src/domain/ai-failure';
import { readGeminiResponse } from '../../src/infrastructure/gemini-response.server';
import {
  failureForStatus,
  normalizeAiFailure,
} from '../../src/infrastructure/gemini-errors.server';

const narrative = {
  summary: 'A clear plan.',
  ideas: Array.from({ length: 4 }, () => ({
    title: 'A thoughtful detail',
    description: 'Create a seasonal welcome table.',
    tag: 'Personal',
  })),
};
const envelope = (
  text: string = JSON.stringify(narrative),
  finishReason = 'STOP',
) => ({ candidates: [{ finishReason, content: { parts: [{ text }] } }] });

describe('provider output classification', () => {
  it('parses structured narratives with provider metadata without losing strict narrative validation', async () => {
    const data = { ...envelope(), usageMetadata: { totalTokenCount: 402 } };
    await expect(readGeminiResponse(Response.json(data))).resolves.toEqual(
      narrative,
    );
  });
  it('identifies exhausted output limits even when no content was returned', async () => {
    await expect(
      readGeminiResponse(
        Response.json({ candidates: [{ finishReason: 'MAX_TOKENS' }] }),
      ),
    ).rejects.toMatchObject({ code: 'output-limit' });
    await expect(
      readGeminiResponse(new Response('x'.repeat(48001))),
    ).rejects.toMatchObject({ code: 'output-limit' });
  });
  it.each([
    {},
    { candidates: [] },
    { candidates: [{ finishReason: 'STOP' }] },
    { candidates: [{ finishReason: 'SAFETY' }] },
    { candidates: [{ finishReason: 'STOP', content: { parts: [] } }] },
    envelope('{invalid JSON'),
    envelope(JSON.stringify({ ...narrative, budget: 0 })),
    envelope(JSON.stringify({ ...narrative, ideas: [] })),
  ])(
    'rejects malformed or incomplete provider output %# with a sanitized code',
    async (input) => {
      await expect(
        readGeminiResponse(Response.json(input)),
      ).rejects.toMatchObject({
        name: 'AiFailure',
        code: 'invalid-output',
        message: 'invalid-output',
      });
    },
  );
  it('classifies invalid response JSON as output failure rather than a raw parser error', async () => {
    await expect(
      readGeminiResponse(new Response('private malformed response')),
    ).rejects.toMatchObject({ code: 'invalid-output' });
  });
  it('normalizes unknown failures and gives the actual deadline priority over a wrapped stream error', () => {
    const known = new AiFailure('invalid-output');
    expect(normalizeAiFailure(known, false)).toBe(known);
    expect(normalizeAiFailure(known, true).code).toBe('timeout');
    expect(
      normalizeAiFailure(new Error('Private provider detail'), false).code,
    ).toBe('unavailable');
    expect(failureForStatus(502).code).toBe('unavailable');
  });
});
