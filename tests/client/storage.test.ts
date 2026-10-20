import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_STORAGE_BYTES,
  readWorkspace,
  STORAGE_KEY,
  writeWorkspace,
} from '../../src/client/storage';
import { createSampleWorkspace } from '../../src/domain/sample';
import { createWorkspaceStore } from '../../src/client/store';
import { selectEvent } from '../../src/domain/workspace';

const workspace = createSampleWorkspace(new Date('2026-10-20T00:00:00Z'));
afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('validated browser persistence', () => {
  it('round-trips a real workspace and uses a versioned key', () => {
    expect(writeWorkspace(window.localStorage, workspace)).toBe('');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(readWorkspace(window.localStorage)).toEqual({
      workspace,
      notice: '',
    });
    window.localStorage.clear();
    expect(readWorkspace(window.localStorage)).toEqual({
      workspace: null,
      notice: '',
    });
  });
  it('preserves damaged browser data and provides a recovery notice', () => {
    for (const raw of [
      '{broken',
      JSON.stringify({ ...workspace, activeEventId: 'missing' }),
      JSON.stringify({ ...workspace, secret: true }),
      'x'.repeat(MAX_STORAGE_BYTES + 1),
    ]) {
      const storage = { getItem: vi.fn(() => raw) };
      const result = readWorkspace(storage);
      expect(result.workspace).toBeNull();
      expect(result.notice).toContain('could not be loaded');
      expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    }
  });
  it('measures persisted size in UTF-8 bytes, including multibyte text', () => {
    const raw = '🎉'.repeat(Math.floor(MAX_STORAGE_BYTES / 3));
    expect(raw.length).toBeLessThan(MAX_STORAGE_BYTES);
    expect(readWorkspace({ getItem: () => raw }).notice).toContain(
      'could not be loaded',
    );
  });
  it('supports read failures and quota exhaustion without exposing internals', () => {
    const storage = {
      getItem: () => {
        throw new Error('Private storage detail');
      },
      setItem: () => {
        throw new Error('Private quota detail');
      },
    };
    expect(readWorkspace(storage).notice).not.toContain('Private');
    expect(writeWorkspace(storage, workspace)).toContain('unavailable or full');
    const setItem = vi.fn();
    expect(
      writeWorkspace({ setItem }, { ...workspace, activeEventId: 'missing' }),
    ).toContain('unavailable or full');
    expect(setItem).not.toHaveBeenCalled();
  });
  it('rejects large otherwise valid workspaces rather than silently truncating', () => {
    const bigPlan = { ...workspace.events[0]?.plan };
    const event = workspace.events[0];
    if (!event || !bigPlan.tasks) throw new Error('Missing fixture');
    const large = {
      ...event,
      brief: { ...event.brief, preferences: 'p'.repeat(1200) },
      plan: {
        ...event.plan,
        summary: 's'.repeat(1800),
        ideas: Array.from({ length: 12 }, (_, index) => ({
          id: `idea-${index}`,
          title: 't'.repeat(100),
          description: 'd'.repeat(600),
          tag: 'tag',
          saved: false,
        })),
        tasks: Array.from({ length: 40 }, (_, index) => ({
          id: `task-${index}`,
          title: 't'.repeat(160),
          dueDate: event.brief.date,
          category: 'c'.repeat(80),
          completed: false,
        })),
        vendors: Array.from({ length: 16 }, (_, index) => ({
          id: `vendor-${index}`,
          category: 'v'.repeat(80),
          description: 'd'.repeat(240),
          status: 'to-contact' as const,
          notes: 'n'.repeat(500),
        })),
      },
    };
    const events = Array.from({ length: 12 }, (_, index) => ({
      ...large,
      id: `large-${index}`,
    }));
    const filled = { version: 1 as const, events, activeEventId: 'large-0' };
    expect(JSON.stringify(filled).length).toBeGreaterThan(MAX_STORAGE_BYTES);
    const setItem = vi.fn();
    expect(writeWorkspace({ setItem }, filled)).toContain(
      'unavailable or full',
    );
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe('external workspace store', () => {
  it('keeps stable server snapshot and loads saved data once on first subscriber', () => {
    const saved = selectEvent(workspace, 'sample-birthday');
    writeWorkspace(window.localStorage, saved);
    const store = createWorkspaceStore(workspace);
    const initial = store.getServerSnapshot();
    expect(store.getSnapshot()).toBe(initial);
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribe = store.subscribe(first);
    expect(first).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().workspace.activeEventId).toBe('sample-birthday');
    expect(store.getServerSnapshot()).toBe(initial);
    store.subscribe(second);
    expect(second).not.toHaveBeenCalled();
    unsubscribe();
    store.update((current) => selectEvent(current, 'sample-community'));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(readWorkspace(window.localStorage).workspace?.activeEventId).toBe(
      'sample-community',
    );
  });
  it('uses initial sample without data and exposes corrupt-read notices', () => {
    const empty = createWorkspaceStore(workspace);
    empty.subscribe(vi.fn());
    expect(empty.getSnapshot()).toEqual({ workspace, notice: '' });
    window.localStorage.setItem(STORAGE_KEY, '{broken');
    const damaged = createWorkspaceStore(workspace);
    damaged.subscribe(vi.fn());
    expect(damaged.getSnapshot().workspace).toEqual(workspace);
    expect(damaged.getSnapshot().notice).toContain('could not be loaded');
  });
  it('keeps the current session usable when accessing storage is blocked', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('blocked');
    });
    const store = createWorkspaceStore(workspace);
    store.subscribe(vi.fn());
    expect(store.getSnapshot().notice).toContain('blocked');
    store.update((current) => selectEvent(current, 'sample-birthday'));
    expect(store.getSnapshot().workspace.activeEventId).toBe('sample-birthday');
    expect(store.getSnapshot().notice).toContain('kept for this session');
  });
  it('surfaces write failure without losing in-memory updates', () => {
    const store = createWorkspaceStore(workspace);
    store.subscribe(vi.fn());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    store.update((current) => selectEvent(current, 'sample-birthday'));
    expect(store.getSnapshot().workspace.activeEventId).toBe('sample-birthday');
    expect(store.getSnapshot().notice).toContain('unavailable or full');
  });
});
