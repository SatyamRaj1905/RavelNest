import { Download, Flower2 } from 'lucide-react';
import type { EventRecord } from '@/domain/contracts';
import { downloadPlan } from '@/client/export-plan';
import { StudioHeader } from './studio-header';
import { Overview } from './overview';
import { WorkspaceContent } from './workspace-content';
import type { Tab } from './navigation';
import type { useWorkspace } from './use-workspace';

type Props = {
  state: ReturnType<typeof useWorkspace>;
  event: EventRecord;
  tab: Tab;
  message: string;
  onTab: (tab: Tab) => void;
  onCreate: () => void;
  onMenu: () => void;
  onDismiss: () => void;
};

function StudioFooter({ event }: { event: EventRecord }) {
  return (
    <footer className="workspace-footer">
      <span>
        <Flower2 size={15} />
        Made for moments that matter.
      </span>
      <span>
        {event.id.startsWith('sample-')
          ? 'Sample workspace'
          : 'Your personal workspace'}{' '}
        · Private to this browser
      </span>
      <button className="text-button" onClick={() => downloadPlan(event)}>
        <Download size={14} /> Export your plan
      </button>
    </footer>
  );
}

function StudioNotices({
  notice,
  message,
  onDismiss,
}: {
  notice: string;
  message: string;
  onDismiss: () => void;
}) {
  return (
    <>
      {notice && (
        <p className="workspace-notice" role="alert">
          {notice}
        </p>
      )}
      {message && (
        <div className="workspace-notice" role="status">
          {message}
          <button aria-label="Dismiss notification" onClick={onDismiss}>
            ×
          </button>
        </div>
      )}
    </>
  );
}

export function StudioMain({
  state,
  event,
  tab,
  message,
  onTab,
  onCreate,
  onMenu,
  onDismiss,
}: Props) {
  return (
    <div className="workspace">
      <StudioHeader
        tab={tab}
        events={state.workspace.events}
        activeId={event.id}
        onSelect={state.select}
        onMenu={onMenu}
      />
      <main id="main" className="main-content" tabIndex={-1}>
        <StudioNotices
          notice={state.notice}
          message={message}
          onDismiss={onDismiss}
        />
        {tab === 'Overview' ? (
          <Overview
            event={event}
            total={state.workspace.events.length}
            onTab={onTab}
            onCreate={onCreate}
            onUpdate={state.update}
          />
        ) : (
          <WorkspaceContent
            key={event.id + tab}
            tab={tab}
            event={event}
            events={state.workspace.events}
            onUpdate={state.update}
            onSelect={(id) => {
              state.select(id);
              onTab('Overview');
            }}
            onDelete={state.remove}
            onCreate={onCreate}
          />
        )}
        <StudioFooter event={event} />
      </main>
    </div>
  );
}
