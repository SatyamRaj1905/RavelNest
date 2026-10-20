'use client';

import { useState, useSyncExternalStore } from 'react';
import type { EventPlan, EventRecord, Workspace } from '@/domain/contracts';
import {
  addEvent,
  deleteEvent,
  selectEvent,
  updateActiveEvent,
} from '@/domain/workspace';
import { createWorkspaceStore } from '@/client/store';

export function useWorkspace(initial: Workspace) {
  const [store] = useState(() => createWorkspaceStore(initial));
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const active =
    snapshot.workspace.events.find(
      (event) => event.id === snapshot.workspace.activeEventId,
    ) ?? snapshot.workspace.events[0];
  return {
    ...snapshot,
    active,
    select: (id: string) =>
      store.update((workspace) => selectEvent(workspace, id)),
    remove: (id: string) =>
      store.update((workspace) => deleteEvent(workspace, id)),
    add: (event: EventRecord) =>
      store.update((workspace) => addEvent(workspace, event)),
    update: (plan: EventPlan, source?: EventRecord['source']) =>
      store.update((workspace) =>
        updateActiveEvent(workspace, (event) => ({
          ...event,
          plan,
          source: source ?? event.source,
        })),
      ),
  };
}
