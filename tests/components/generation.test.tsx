import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestPlan } from '@/client/request-plan';
import { useGeneration } from '@/components/use-generation';
import { createSampleWorkspace } from '@/domain/sample';
import type { PlanResponse } from '@/domain/contracts';

vi.mock('@/client/request-plan', () => ({ requestPlan: vi.fn() }));
const mockedRequest = vi.mocked(requestPlan);

function fixture() {
  const event = createSampleWorkspace(new Date('2026-10-20T00:00:00Z'))
    .events[0];
  if (!event) throw new Error('Expected sample event');
  const response: PlanResponse = {
    plan: event.plan,
    source: 'demo',
    notice: 'Preview only.',
  };
  return { brief: event.brief, response };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('Promise was not initialized');
  };
  let reject: (reason: Error) => void = () => {
    throw new Error('Promise was not initialized');
  };
  const promise = new Promise<T>((accept, refuse) => {
    resolve = accept;
    reject = refuse;
  });
  return { promise, resolve, reject };
}

beforeEach(() => mockedRequest.mockReset());

describe('cancellable generation', () => {
  it('aborts superseded requests and ignores their late responses', async () => {
    const { brief, response } = fixture();
    const old = deferred<PlanResponse>();
    const current = deferred<PlanResponse>();
    mockedRequest
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(current.promise);
    const { result } = renderHook(() => useGeneration());
    act(() => {
      void result.current.generate(brief, 'old');
    });
    const firstSignal = mockedRequest.mock.calls[0]?.[2];
    expect(firstSignal?.aborted).toBe(false);
    act(() => {
      void result.current.generate(brief, 'new');
    });
    expect(firstSignal?.aborted).toBe(true);
    await act(async () => {
      current.resolve({ ...response, notice: 'The latest response' });
    });
    await act(async () => {
      old.resolve({ ...response, notice: 'Obsolete response' });
    });
    expect(result.current.state.status).toBe('ready');
    if (result.current.state.status !== 'ready')
      throw new Error('Expected a ready preview');
    expect(result.current.state.result.notice).toBe('The latest response');
  });

  it('reset aborts pending generation so a late response cannot reopen the preview', async () => {
    const { brief, response } = fixture();
    const pending = deferred<PlanResponse>();
    mockedRequest.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useGeneration());
    act(() => {
      void result.current.generate(brief);
    });
    const signal = mockedRequest.mock.calls[0]?.[2];
    act(() => result.current.reset());
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      pending.resolve(response);
    });
    expect(result.current.state.status).toBe('idle');
  });

  it('aborts requests when the owner unmounts', () => {
    const pending = deferred<PlanResponse>();
    mockedRequest.mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(() => useGeneration());
    act(() => {
      void result.current.generate(fixture().brief);
    });
    const signal = mockedRequest.mock.calls[0]?.[2];
    unmount();
    expect(signal?.aborted).toBe(true);
  });

  it('returns to idle after an unexpected request failure', async () => {
    mockedRequest.mockRejectedValueOnce(
      new Error('Unexpected transport failure'),
    );
    const { result } = renderHook(() => useGeneration());
    await act(async () => {
      await result.current.generate(fixture().brief);
    });
    expect(result.current.state.status).toBe('idle');
  });
});

it('keeps the latest pending state when an aborted older request rejects late', async () => {
  const { brief, response } = fixture();
  const old = deferred<PlanResponse>();
  const latest = deferred<PlanResponse>();
  mockedRequest
    .mockReturnValueOnce(old.promise)
    .mockReturnValueOnce(latest.promise);
  const { result } = renderHook(() => useGeneration());
  act(() => {
    void result.current.generate(brief, 'old');
  });
  act(() => {
    void result.current.generate(brief, 'latest');
  });
  await act(async () => {
    old.reject(new Error('Aborted old request'));
  });
  expect(result.current.state.status).toBe('loading');
  await act(async () => {
    latest.resolve(response);
  });
  expect(result.current.state.status).toBe('ready');
});

it('reset without a pending request stays idle', () => {
  const { result } = renderHook(() => useGeneration());
  act(() => result.current.reset());
  expect(result.current.state.status).toBe('idle');
  expect(mockedRequest).not.toHaveBeenCalled();
});
