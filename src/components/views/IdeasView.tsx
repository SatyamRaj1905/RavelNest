'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toggleIdea } from '@/domain/plan-updates';
import type { PlanViewProps } from './types';
import { ViewHeading } from './ViewHeading';
import { ViewFilters } from './ViewFilters';
import { IdeaCard } from './IdeaCard';
import { EmptyView } from './EmptyView';

type IdeaFilter = 'all' | 'saved';

export function IdeasView({ event, onUpdate }: PlanViewProps) {
  const [filter, setFilter] = useState<IdeaFilter>('all');
  const savedCount = event.plan.ideas.filter((idea) => idea.saved).length;
  const ideas = event.plan.ideas.filter(
    (idea) => filter === 'all' || idea.saved,
  );
  return (
    <section className="workspace-view" aria-label="Personalized event ideas">
      <ViewHeading
        eyebrow="A little inspiration, a lot of you"
        title="Make it wonderfully yours."
        description="Thoughtful ideas shaped around your celebration, your guests, and your story."
      >
        <span className="ideas-personalized">
          <Sparkles size={15} aria-hidden="true" />
          Personalized for you
        </span>
      </ViewHeading>
      <ViewFilters<IdeaFilter>
        label="Filter event ideas"
        value={filter}
        onChange={setFilter}
        options={[
          {
            value: 'all',
            label: 'All inspiration',
            count: event.plan.ideas.length,
          },
          { value: 'saved', label: 'Saved ideas', count: savedCount },
        ]}
      />
      {ideas.length ? (
        <div className="ideas-grid">
          {ideas.map((idea, index) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              index={index}
              onSave={() => onUpdate(toggleIdea(event.plan, idea.id))}
            />
          ))}
        </div>
      ) : (
        <EmptyView
          title="Your collection starts with a spark."
          description="Save an idea that makes you smile and find it right here."
        />
      )}
    </section>
  );
}
