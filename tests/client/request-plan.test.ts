import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestPlan } from '../../src/client/request-plan';
import { createSampleWorkspace } from '../../src/domain/sample';
import { PLAN_REQUEST_DEADLINE_MS } from '../../src/domain/ai-policy';
import { generatePlan } from '../../src/domain/planner';

const brief = createSampleWorkspace().events[0]?.brief;
if (!brief) throw new Error('Missing fixture');
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('runtime-validated browser planning with canonical offline parity', () => {
  it('sends a bounded same-origin POST and validates successful payloads', async () => {
    const payload = {
      plan: generatePlan(brief),
      source: 'demo',
      notice: 'A complete local draft.',
    };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(payload));
    vi.stubGlobal('fetch', fetcher);
    const controller = new AbortController();
    expect(await requestPlan(brief, 'garden style', controller.signal)).toEqual(
      payload,
    );
    expect(fetcher).toHaveBeenCalledWith(
      '/api/plan',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ brief, prompt: 'garden style' }),
        signal: expect.any(AbortSignal),
      }),
    );
  });
  it.each(['network', '500', 'non-json', 'schema', 'unknown'])(
    'uses identical local fallback for %s failures',
    async (kind) => {
      const fetcher = vi.fn<typeof fetch>();
      if (kind === 'network') fetcher.mockRejectedValue(new Error('Offline'));
      else if (kind === '500')
        fetcher.mockResolvedValue(new Response('', { status: 500 }));
      else if (kind === 'non-json')
        fetcher.mockResolvedValue(new Response('not JSON'));
      else if (kind === 'schema')
        fetcher.mockResolvedValue(Response.json({ plan: {} }));
      else
        fetcher.mockResolvedValue(
          Response.json({
            plan: generatePlan(brief),
            source: 'gemini',
            notice: 'Hi',
            injected: true,
          }),
        );
      vi.stubGlobal('fetch', fetcher);
      const result = await requestPlan(
        brief,
        'warm colors',
        new AbortController().signal,
      );
      expect(result.source).toBe('demo');
      expect(result.notice).toContain('offline');
      expect(result.plan).toEqual(generatePlan(brief, 'warm colors'));
    },
  );
  it('rejects valid-shaped responses whose totals or milestones conflict with the brief', async () => {
    const plan = generatePlan(brief);
    for (const changed of [
      {
        ...plan,
        budget: plan.budget.map((item) => ({
          ...item,
          amount: item.amount + 1,
        })),
      },
      {
        ...plan,
        tasks: plan.tasks.map((task) => ({ ...task, dueDate: '2199-12-31' })),
      },
    ]) {
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>().mockResolvedValue(
          Response.json({
            plan: changed,
            source: 'gemini',
            notice: 'Modified facts',
          }),
        ),
      );
      expect(
        (await requestPlan(brief, '', new AbortController().signal)).plan,
      ).toEqual(plan);
    }
  });
  it('rejects obsolete successful responses and already-aborted callers', async () => {
    const controller = new AbortController();
    const payload = {
      plan: generatePlan(brief),
      source: 'demo',
      notice: 'Draft',
    };
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => {
      controller.abort();
      return Response.json(payload);
    });
    vi.stubGlobal('fetch', fetcher);
    await expect(requestPlan(brief, '', controller.signal)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await expect(requestPlan(brief, '', controller.signal)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('propagates caller cancellation without applying a fallback or leaking stale state', async () => {
    const controller = new AbortController();
    const aborted = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async () => {
        controller.abort();
        throw aborted;
      }),
    );
    await expect(requestPlan(brief, '', controller.signal)).rejects.toBe(
      aborted,
    );
  });
});

it('gives the browser 35 seconds so the provider can use its 25-second budget', async () => {
  const timeout = vi.spyOn(AbortSignal, 'timeout');
  const payload = {
    plan: generatePlan(brief),
    source: 'gemini',
    notice: 'A validated response.',
  };
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(Response.json(payload)),
  );
  await expect(
    requestPlan(brief, '', new AbortController().signal),
  ).resolves.toEqual(payload);
  expect(PLAN_REQUEST_DEADLINE_MS).toBe(35_000);
  expect(timeout).toHaveBeenCalledWith(PLAN_REQUEST_DEADLINE_MS);
});
