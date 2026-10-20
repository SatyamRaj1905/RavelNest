import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkspace } from '@/components/use-workspace';
import { createSampleWorkspace } from '@/domain/sample';
import { createEvent } from '@/domain/workspace';
import { applySuggestions, toggleTask } from '@/domain/plan-updates';
import { readWorkspace } from '@/client/storage';

const initial = createSampleWorkspace(new Date('2026-10-20T00:00:00Z'));
beforeEach(() => window.localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('workspace hook canonical transitions', () => {
  it('selects, adds and removes events through the same persisted workspace rules', () => {
    const { result } = renderHook(() => useWorkspace(initial));
    expect(result.current.active?.id).toBe('sample-wedding');
    act(() => result.current.select('sample-birthday'));
    expect(result.current.active?.id).toBe('sample-birthday');
    const active = result.current.active;
    if (!active) throw new Error('Expected an active event');
    const created = createEvent({
      ...active.brief,
      name: 'A fresh celebration',
    });
    act(() => result.current.add(created));
    expect(result.current.active?.id).toBe(created.id);
    expect(result.current.workspace.events).toHaveLength(4);
    act(() => result.current.remove(created.id));
    expect(result.current.workspace.events).toHaveLength(3);
    expect(result.current.active?.id).toBe('sample-wedding');
    expect(readWorkspace(window.localStorage).workspace).toEqual(
      result.current.workspace,
    );
  });
  it('stores approved narrative provenance and preserves that source during operational edits', () => {
    const { result } = renderHook(() => useWorkspace(initial));
    const active = result.current.active;
    if (!active) throw new Error('Expected an active event');
    const live = applySuggestions(active.plan, {
      ...active.plan,
      summary: 'A live Gemini narrative accepted by the host.',
    });
    act(() => result.current.update(live, 'gemini'));
    expect(result.current.active?.source).toBe('gemini');
    const tasksEdited = toggleTask(live, 'task-5');
    act(() => result.current.update(tasksEdited));
    expect(result.current.active?.source).toBe('gemini');
    expect(result.current.active?.plan.tasks[4]?.completed).toBe(true);
    act(() =>
      result.current.update(
        {
          ...tasksEdited,
          summary: 'A locally generated narrative accepted by the host.',
        },
        'demo',
      ),
    );
    expect(result.current.active?.source).toBe('demo');
    expect(result.current.active?.plan.tasks[4]?.completed).toBe(true);
    expect(
      readWorkspace(window.localStorage).workspace?.events[0]?.source,
    ).toBe('demo');
  });
  it('loads an existing active event and surfaces storage failures in the hook result', () => {
    const saved = { ...initial, activeEventId: 'sample-community' };
    window.localStorage.setItem(
      'ravelnest.workspace.v1',
      JSON.stringify(saved),
    );
    const { result } = renderHook(() => useWorkspace(initial));
    expect(result.current.active?.id).toBe('sample-community');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    act(() => result.current.select('sample-birthday'));
    expect(result.current.active?.id).toBe('sample-birthday');
    expect(result.current.notice).toContain('unavailable or full');
  });
  it('provides a defensive first event when an initial active ID is unavailable', () => {
    const { result } = renderHook(() =>
      useWorkspace({ ...initial, activeEventId: 'missing' }),
    );
    expect(result.current.active?.id).toBe('sample-wedding');
  });
});
