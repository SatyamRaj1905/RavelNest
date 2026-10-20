import { Plus, Sparkles } from 'lucide-react';
import type { EventPlan, EventRecord } from '@/domain/contracts';
import type { Tab } from './navigation';
import { DashboardStats } from './dashboard-stats';
import { FeaturedEvent } from './featured-event';
import { UpcomingTasks } from './upcoming-tasks';
import { BudgetSnapshot } from './budget-snapshot';
import { InspirationBanner } from './inspiration-banner';
import { Assistant } from './assistant';

export function Overview({
  event,
  total,
  onTab,
  onCreate,
  onUpdate,
}: {
  event: EventRecord;
  total: number;
  onTab: (tab: Tab) => void;
  onCreate: () => void;
  onUpdate: (plan: EventPlan, source?: EventRecord['source']) => void;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow greeting">
            <Sparkles size={14} /> A SPACE FOR YOUR NEXT BIG MOMENT
          </p>
          <h1>
            Less planning. <em>More celebrating.</em>
          </h1>
          <p>
            A thoughtful little home for everything you’re bringing together.
          </p>
        </div>
        <button className="button primary" onClick={onCreate}>
          <Plus size={17} />
          Create event
        </button>
      </div>
      <DashboardStats event={event} total={total} onTab={onTab} />
      <div className="overview-columns">
        <div className="overview-main">
          <FeaturedEvent event={event} onOpen={() => onTab('Timeline')} />
          <div className="overview-bottom">
            <UpcomingTasks
              event={event}
              onUpdate={onUpdate}
              onOpen={() => onTab('Timeline')}
            />
            <BudgetSnapshot event={event} onOpen={() => onTab('Budget')} />
          </div>
        </div>
        <Assistant key={event.id} event={event} onUpdate={onUpdate} />
      </div>
      <InspirationBanner onOpen={() => onTab('Inspiration')} />
    </>
  );
}
