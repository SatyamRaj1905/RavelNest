'use client';

import { useState } from 'react';
import type { EventRecord, Workspace } from '@/domain/contracts';
import { MAX_EVENTS } from '@/domain/workspace';
import { Navigation, type Tab } from './navigation';
import { StudioMain } from './studio-main';
import { CreateEventDialog } from './create-event-dialog';
import { HelpDialog } from './help-dialog';
import { useWorkspace } from './use-workspace';

export function Studio({ initial }: { initial: Workspace }) {
  const state = useWorkspace(initial);
  const [tab, setTab] = useState<Tab>('Overview');
  const [dialog, setDialog] = useState<'create' | 'help' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [message, setMessage] = useState('');
  const event = state.active;
  if (!event)
    return (
      <p role="alert">
        Your workspace is unavailable. Refresh to reload your saved plans.
      </p>
    );
  function create() {
    setMobileOpen(false);
    if (state.workspace.events.length >= MAX_EVENTS) {
      setMessage(
        `Your nest holds ${MAX_EVENTS} events. Remove one in My events to make room.`,
      );
      return;
    }
    setDialog('create');
  }
  function save(record: EventRecord) {
    state.add(record);
    setDialog(null);
    setTab('Overview');
    setMessage('Your new event is saved. Let the good things begin.');
  }
  return (
    <div className="app-shell">
      <Navigation
        tab={tab}
        onTab={setTab}
        onCreate={create}
        onHelp={() => {
          setMobileOpen(false);
          setDialog('help');
        }}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <StudioMain
        state={state}
        event={event}
        tab={tab}
        message={message}
        onTab={setTab}
        onCreate={create}
        onMenu={() => setMobileOpen(true)}
        onDismiss={() => setMessage('')}
      />
      {dialog === 'create' && (
        <CreateEventDialog onClose={() => setDialog(null)} onSave={save} />
      )}
      {dialog === 'help' && <HelpDialog onClose={() => setDialog(null)} />}
    </div>
  );
}
