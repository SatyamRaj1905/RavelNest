import { Download } from 'lucide-react';
import type { EventPlan, EventRecord } from '@/domain/contracts';
import { downloadPlan } from '@/client/export-plan';
import type { Tab } from './navigation';
import { BudgetView } from './views/BudgetView';
import { TimelineView } from './views/TimelineView';
import { VendorsView } from './views/VendorsView';
import { IdeasView } from './views/IdeasView';
import { EventsView } from './views/EventsView';

type Props = {
  tab: Tab;
  event: EventRecord;
  events: EventRecord[];
  onUpdate: (plan: EventPlan) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
};
const descriptions = {
  Overview: '',
  'My events':
    'Every occasion deserves a little space to become something special.',
  Budget: 'Make room for the things that matter. Keep every number in view.',
  Timeline: 'Big moments come together one thoughtful little step at a time.',
  Vendors: 'Build your dream team, one conversation at a time.',
  Inspiration: 'The little touches that make a celebration unmistakably yours.',
};

export function WorkspaceContent({
  tab,
  event,
  events,
  onUpdate,
  onSelect,
  onDelete,
  onCreate,
}: Props) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{event.brief.name}</p>
          <h1>
            {tab === 'My events' ? 'Your occasions, in the making.' : tab}
          </h1>
          <p>{descriptions[tab]}</p>
        </div>
        <button
          className="button secondary"
          onClick={() => downloadPlan(event)}
        >
          <Download size={16} /> Export plan
        </button>
      </div>
      {tab === 'My events' && (
        <EventsView
          events={events}
          activeId={event.id}
          onSelect={onSelect}
          onCreate={onCreate}
          onDelete={onDelete}
        />
      )}
      {tab === 'Budget' && <BudgetView event={event} onUpdate={onUpdate} />}
      {tab === 'Timeline' && <TimelineView event={event} onUpdate={onUpdate} />}
      {tab === 'Vendors' && <VendorsView event={event} onUpdate={onUpdate} />}
      {tab === 'Inspiration' && <IdeasView event={event} onUpdate={onUpdate} />}
    </>
  );
}
