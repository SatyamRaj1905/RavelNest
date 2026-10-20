import type { Workspace } from '@/domain/contracts';
import { readWorkspace, writeWorkspace } from './storage';

export function createWorkspaceStore(initial: Workspace) {
  const initialSnapshot = { workspace: initial, notice: '' };
  let snapshot = initialSnapshot;
  let loaded = false;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initialSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (!loaded) {
        loaded = true;
        try {
          const result = readWorkspace(window.localStorage);
          snapshot = {
            workspace: result.workspace ?? initial,
            notice: result.notice,
          };
        } catch {
          snapshot = {
            workspace: initial,
            notice:
              'Browser storage is blocked. Your workspace will stay in this session.',
          };
        }
        notify();
      }
      return () => {
        listeners.delete(listener);
      };
    },
    update: (transform: (workspace: Workspace) => Workspace) => {
      const workspace = transform(snapshot.workspace);
      let notice = '';
      try {
        notice = writeWorkspace(window.localStorage, workspace);
      } catch {
        notice =
          'Browser storage is blocked. Changes are kept for this session.';
      }
      snapshot = { workspace, notice };
      notify();
    },
  };
}
