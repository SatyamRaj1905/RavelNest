// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  errorResponse,
  PublicError,
  readBoundedJson,
} from '../../src/infrastructure/http.server';
import { validatePlanRequest } from '../../src/infrastructure/request.server';
import { readConfig } from '../../src/infrastructure/config.server';
import { createSampleWorkspace } from '../../src/domain/sample';

const brief = createSampleWorkspace().events[0]?.brief;
if (!brief) throw new Error('Missing sample.');
const request = (body: string, headers: Record<string, string> = {}) =>
  new Request('http://localhost:3000/api/plan', {
    method: 'POST',
    body,
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
      ...headers,
    },
  });

describe('bounded streamed JSON', () => {
  it('cancels rejected oversized bodies without allowing cleanup errors to hide the limit', async () => {
    const cancel = vi
      .fn()
      .mockRejectedValue(new Error('Private cleanup detail'));
    const body = new ReadableStream({ cancel });
    await expect(
      readBoundedJson(
        new Response(body, { headers: { 'content-length': '1000' } }),
        5,
      ),
    ).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE', status: 413 });
    expect(cancel).toHaveBeenCalledOnce();
  });
  it('accepts unknown JSON only after real UTF-8 stream parsing', async () => {
    const bytes = new TextEncoder().encode('{"message":"🎉"}');
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, 14));
        controller.enqueue(bytes.slice(14));
        controller.close();
      },
    });
    await expect(readBoundedJson(new Response(stream), 100)).resolves.toEqual({
      message: '🎉',
    });
  });
  it('rejects declared or actual byte excess, empty bodies and malformed streams', async () => {
    await expect(
      readBoundedJson(
        new Response('{}', { headers: { 'content-length': '1000' } }),
        5,
      ),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      readBoundedJson(new Response('🎉'.repeat(3)), 10),
    ).rejects.toMatchObject({ status: 413 });
    await expect(readBoundedJson(new Response(), 10)).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      readBoundedJson(new Response('{broken'), 100),
    ).rejects.toMatchObject({ code: 'INVALID_JSON' });
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new Error('private stream detail'));
      },
    });
    await expect(
      readBoundedJson(new Response(stream), 100),
    ).rejects.toMatchObject({ code: 'INVALID_JSON' });
  });
  it('returns stable public errors and hides unexpected details', async () => {
    const known = errorResponse(
      new PublicError('BAD_REQUEST', 'Try again.', 400),
    );
    expect(known.status).toBe(400);
    expect(await known.json()).toEqual({
      error: { code: 'BAD_REQUEST', message: 'Try again.' },
    });
    const unknown = errorResponse(new Error('SECRET provider stack'));
    expect(unknown.status).toBe(500);
    expect(await unknown.text()).not.toContain('SECRET');
    expect(unknown.headers.get('cache-control')).toBe('no-store');
  });
});

describe('same-origin API request contract', () => {
  it('validates before application logic and allows JSON charset', async () => {
    const parsed = await validatePlanRequest(
      request(JSON.stringify({ brief }), {
        'content-type': 'application/json; charset=utf-8',
      }),
      readConfig({}),
    );
    expect(parsed.brief).toEqual(brief);
  });
  it('rejects unknown schema fields, unsupported media, absent and hostile origins', async () => {
    await expect(
      validatePlanRequest(
        request(JSON.stringify({ brief, role: 'admin' })),
        readConfig({}),
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      validatePlanRequest(
        request('{}', { 'content-type': 'text/plain' }),
        readConfig({}),
      ),
    ).rejects.toMatchObject({ status: 415 });
    await expect(
      validatePlanRequest(
        request('{}', { origin: 'https://attacker.example' }),
        readConfig({}),
      ),
    ).rejects.toMatchObject({ status: 403 });
    const absent = new Request('http://localhost:3000/api/plan', {
      method: 'POST',
      body: '{}',
      headers: { 'content-type': 'application/json' },
    });
    await expect(
      validatePlanRequest(absent, readConfig({})),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      validatePlanRequest(
        request('{}', { 'content-type': '' }),
        readConfig({}),
      ),
    ).rejects.toMatchObject({ status: 415 });
  });
  it('requires an explicit origin for public production live AI', async () => {
    await expect(
      validatePlanRequest(
        request(JSON.stringify({ brief })),
        readConfig({ NODE_ENV: 'production', GEMINI_API_KEY: 'test-key' }),
      ),
    ).rejects.toMatchObject({ status: 503 });
  });
  it('pins production origin to configured canonical URL', async () => {
    await expect(
      validatePlanRequest(
        request('{}'),
        readConfig({ APP_ORIGIN: 'https://ravelnest.example' }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    const configured = request(JSON.stringify({ brief }), {
      origin: 'https://ravelnest.example',
    });
    await expect(
      validatePlanRequest(
        configured,
        readConfig({ APP_ORIGIN: 'https://ravelnest.example' }),
      ),
    ).resolves.toMatchObject({ brief });
  });
});
